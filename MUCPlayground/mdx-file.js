// MDX files: the music data of MXDRV, the Sharp X68000's FM driver (eight YM2151 tracks and
// one ADPCM track, or eight with PCM8), and PDX files, the ADPCM samples a song names.
//
// An MDX file is a title (Shift-JIS) ended by 0D 0A 1A, the PDX file's name ended by 0, and
// then, counted from there: the offset of the voices and the offsets of 9 or 16 tracks
// (big-endian words). A voice is 27 bytes, its number first, the rest as the YM2151 has them,
// operators in the order M1, M2, C1, C2. A track is a string of commands:
//   00-7F          a rest of n + 1 ticks
//   80-DF, n       a note (80 is o0 d+; on a PCM track sample 0), n + 1 ticks
//   FF n           tempo: the YM2151's timer B          FE r, v   write register r
//   FD n           voice                                FC n      pan (1 left, 2 right, 3 both)
//   FB n           volume: 0-15, or 128 + attenuation   FA / F9   volume down / up
//   F8 n           gate: n/8 of the note, or 256 - n ticks cut from its end
//   F7             no key off after the next note (a tie or a slur)
//   F6 n, 0        repeat n times ... F5 back (word)    F4 ahead (word): leave the last pass here
//   F3 d (word)    detune, 1/64 semitones               F2 d (word)  slide the next note, 1/16384 semitones a tick
//   F1 0 / F1 back the end / play on from there for ever
//   F0 n           key on n ticks late                  EF n / EE send to track n / wait for it
//   ED n           noise frequency (FM), sample rate 0-4 (PCM)
//   EC / EB        pitch / level LFO: 80 off, 81 on, or wave, period (word), depth (word)
//   EA             the chip's LFO: 80 off, 81 on, or wave, speed, PMD, AMD, PMS/AMS
//   E9 n           the LFOs start n ticks into a note   E8        PCM8 (eight PCM tracks)
//   E7 1, n        fade out
// A PDX file is 96 pairs of offset and length (32 bits, big-endian) and the samples: 4-bit
// ADPCM of the OKI MSM6258, low nibble first.
//
// parseMdx(bytes) -> { title (bytes), pdx (name or '', read as Shift-JIS), voices: Map(n -> voice), tracks: [track] }
//   voice: { fl, con, mask, ops: 4 x { dt1, mul, tl, ks, ar, ame, d1r, dt2, d2r, d1l, rr } } (M1, M2, C1, C2)
//   track: { items, loop } - items is a list of commands and repeats, loop the index in items
//          the track plays on from when it reaches its end (null: it ends)
//   a command is an array, the name first: ['r', ticks] ['n', note, ticks] ['t', n] ['y', r, v]
//   ['@', n] ['p', n] ['v', n] ['('] [')'] ['q', n] ['&'] ['D', n] ['_', n] ['k', n] ['S', n]
//   ['W'] ['F', n] ['MP', wave, period, depth] ['MPON'] ['MPOF'] ['MA', ...] ['MAON'] ['MAOF']
//   ['MH', wave, speed, pmd, amd, sens] ['MHON'] ['MHOF'] ['MD', n] ['PCM8'] ['fade', n]
//   a repeat is { count, body: [...], exit } - exit the index in body the last pass leaves at (or null)
// parsePdx(bytes) -> 96 x (Uint8Array | null)          decodeOki(bytes) -> Float32Array, -1..1

const u16 = (b, i) => (b[i] << 8) | b[i + 1];
const s16 = (b, i) => ((u16(b, i) ^ 0x8000) - 0x8000);

export function isMdx(bytes) {
  try { return headerOf(bytes) !== null; } catch { return false; }
}

function headerOf(b) {
  let i = 2;
  for (; i < b.length && i < 2048; i++) if (b[i] === 0x1a && b[i - 1] === 0x0a && b[i - 2] === 0x0d) break;
  if (i >= b.length || i >= 2048) return null;
  const titleEnd = i - 2;
  let j = i + 1;
  while (j < b.length && b[j] !== 0) j++;
  if (j >= b.length || j - i > 64) return null;
  const base = j + 1;
  if (base + 20 > b.length) return null;
  const offsets = [];
  for (let k = 0; k < 17 && base + k * 2 + 1 < b.length; k++) offsets.push(u16(b, base + k * 2));
  // the tracks begin where the table ends: that tells 9 tracks from 16
  const inFile = offsets.slice(0, 10).filter((o) => base + o < b.length);
  if (inFile.length < 2) return null;
  const count = Math.min(16, (Math.min(...inFile) - 2) >> 1);
  if (count !== 9 && count !== 16) return null;
  return { titleEnd, pdxAt: i + 1, pdxEnd: j, base, voices: offsets[0], tracks: offsets.slice(1, 1 + count) };
}

const WORD = new Set([0xf3, 0xf2]);
const NAMES = { 0xff: 't', 0xfd: '@', 0xfc: 'p', 0xfb: 'v', 0xf8: 'q', 0xf0: 'k', 0xef: 'S', 0xed: 'F', 0xe9: 'MD' };

function parseTrack(b, start, end) {
  const top = [], stack = [], at = new Map();          // byte position -> index in the top list
  let list = top, loop = null, p = start, guard = 0;
  const rest = (n) => { const last = list[list.length - 1]; if (Array.isArray(last) && last[0] === 'r') last[1] += n; else list.push(['r', n]); };
  while (p < end && guard++ < 200000) {
    if (!stack.length) at.set(p, top.length);
    const c = b[p];
    if (c < 0x80) { rest(c + 1); p++; continue; }
    if (c < 0xe0) { list.push(['n', c - 0x80, b[p + 1] + 1]); p += 2; continue; }
    if (c === 0xf6) { const node = { count: b[p + 1] || 256, body: [], exit: null }; list.push(node); stack.push([list, node]); list = node.body; p += 3; continue; }
    if (c === 0xf5) {
      if (stack.length) { const [outer] = stack.pop(); list = outer; }
      p += 3; continue;
    }
    if (c === 0xf4) { if (stack.length) stack[stack.length - 1][1].exit = list.length; p += 3; continue; }
    if (c === 0xf1) {
      const back = s16(b, p + 1);
      if (b[p + 1] !== 0 && back < 0) {
        const target = p + 3 + back;
        // the place to play on from: a command at the top level (else the nearest one before it)
        let best = null;
        for (const [pos, idx] of at) if (pos <= target && (best === null || pos > best[0])) best = [pos, idx];
        loop = best ? best[1] : 0;
      }
      break;
    }
    if (c === 0xf7) { list.push(['&']); p++; continue; }
    if (c === 0xfa) { list.push(['(']); p++; continue; }
    if (c === 0xf9) { list.push([')']); p++; continue; }
    if (c === 0xee) { list.push(['W']); p++; continue; }
    if (c === 0xe8) { list.push(['PCM8']); p++; continue; }
    if (c === 0xfe) { list.push(['y', b[p + 1], b[p + 2]]); p += 3; continue; }
    if (c === 0xe7) { if (b[p + 1] === 1) { list.push(['fade', b[p + 2]]); p += 3; } else p += 2; continue; }
    if (c === 0xec || c === 0xeb || c === 0xea) {
      const name = c === 0xec ? 'MP' : c === 0xeb ? 'MA' : 'MH';
      if (b[p + 1] === 0x80) { list.push([name + 'OF']); p += 2; }
      else if (b[p + 1] === 0x81) { list.push([name + 'ON']); p += 2; }
      else if (c === 0xea) { list.push(['MH', b[p + 1], b[p + 2], b[p + 3], b[p + 4], b[p + 5]]); p += 6; }
      else { list.push([name, b[p + 1], u16(b, p + 2), s16(b, p + 4)]); p += 6; }
      continue;
    }
    if (WORD.has(c)) { list.push([c === 0xf3 ? 'D' : '_', s16(b, p + 1)]); p += 3; continue; }
    if (NAMES[c]) { list.push([NAMES[c], b[p + 1]]); p += 2; continue; }
    p++;                                               // a command this reader does not know: one byte
  }
  // a repeat left open at the end of the track stays as it is; a loop point inside one cannot be kept
  return { items: top, loop };
}

// A file name as the X68000 wrote it (Shift-JIS; a PDX is often named in Japanese).
function sjis(bytes) {
  try { return new TextDecoder('shift_jis').decode(bytes); } catch { return String.fromCharCode(...bytes); }
}

export function parseMdx(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const h = headerOf(b);
  if (!h) throw new Error('Not an MDX file.');
  if (b[h.base + 4] === 0x4c && b[h.base + 5] === 0x5a && b[h.base + 6] === 0x58) throw new Error('The MDX file is compressed (LZX); unpack it first.');
  const starts = [h.voices, ...h.tracks].filter((o) => h.base + o < b.length).sort((x, y) => x - y);
  const endOf = (o) => { const next = starts.find((s) => s > o); return h.base + (next ?? b.length - h.base); };
  const voices = new Map();
  if (h.base + h.voices < b.length) {
    for (let p = h.base + h.voices, end = endOf(h.voices); p + 27 <= end; p += 27) {
      const f = (at) => [0, 1, 2, 3].map((k) => b[p + at + k]);
      const dm = f(3), tl = f(7), ka = f(11), ad = f(15), d2 = f(19), dr = f(23);
      voices.set(b[p], {
        fl: (b[p + 1] >> 3) & 7, con: b[p + 1] & 7, mask: b[p + 2] & 15,
        ops: [0, 1, 2, 3].map((k) => ({
          dt1: (dm[k] >> 4) & 7, mul: dm[k] & 15, tl: tl[k] & 127, ks: ka[k] >> 6, ar: ka[k] & 31,
          ame: ad[k] >> 7, d1r: ad[k] & 31, dt2: d2[k] >> 6, d2r: d2[k] & 31, d1l: dr[k] >> 4, rr: dr[k] & 15,
        })),
      });
    }
  }
  const tracks = h.tracks.map((o) => (h.base + o < b.length ? parseTrack(b, h.base + o, endOf(o)) : { items: [], loop: null }));
  return {
    title: b.slice(0, h.titleEnd),
    pdx: sjis(b.slice(h.pdxAt, h.pdxEnd)).trim(),
    voices, tracks,
  };
}

// ---- PDX ------------------------------------------------------------------------------------

export function parsePdx(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 768) throw new Error('Not a PDX file.');
  const u32 = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const out = [];
  for (let k = 0; k < 96; k++) {
    const at = u32(k * 8), len = u32(k * 8 + 4);
    out.push(len > 0 && at >= 768 && at + len <= b.length ? b.subarray(at, at + len) : null);
  }
  return out;
}

// The MSM6258's ADPCM: two samples a byte, the low nibble first, 12 bits out.
const OKI_STEP = Array.from({ length: 49 }, (_, i) => Math.floor(16 * 1.1 ** i));
const OKI_MOVE = [-1, -1, -1, -1, 2, 4, 6, 8];
export function decodeOki(bytes) {
  const out = new Float32Array(bytes.length * 2);
  let signal = 0, step = 0;
  for (let i = 0; i < out.length; i++) {
    const n = (bytes[i >> 1] >> ((i & 1) * 4)) & 15, s = OKI_STEP[step];
    const d = (s >> 3) + (n & 1 ? s >> 2 : 0) + (n & 2 ? s >> 1 : 0) + (n & 4 ? s : 0);
    signal = Math.max(-2048, Math.min(2047, signal + (n & 8 ? -d : d)));
    step = Math.max(0, Math.min(48, step + OKI_MOVE[n & 7]));
    out[i] = signal / 2048;
  }
  return out;
}
