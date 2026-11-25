// Reads an MGS file (MGSDRV v3 music data: MSX PSG, SCC and MSX-MUSIC, up to 17 tracks).
// The layout follows the format notes of digital-sound-antiques' mgsc (mgs-format.md) and
// MGSC's own manual (MGSC111.DOC); the decompression follows mgsrc-js (uncompress.ts, ISC
// licence, Mitsutaka Okazaki). See LICENSES/mgsrc-js.txt.
//
//   parseMgs(bytes) -> {
//     version: '313',            the three characters after "MGS" ('A13' when compressed)
//     compressed, title (bytes, Shift-JIS), opllMode (0: nine FM, 1: six FM + rhythm),
//     lfoMode, machine, noReverse, tempo (0 when the file has none: 75),
//     voice: { opll: [{ num, data[8] }], maps: [{ from, to }], env: [...], scc: [{ num, data[32] }],
//              psgTune, opllTune, texts: [{ num, bytes }] } | null,
//     tracks: { 1..17: { cmds: [...], unknown: byte | null } },
//   }
// Tracks 1-3 are PSG, 4-8 SCC, 9-17 FM; with opllMode 1 track 15 is the rhythm track.
// A track command is an array: [name, ...values]. Lengths are in steps (a quarter note is 48;
// in files older than v3.04 a step is 1/60 s), null for "the default length (l)".
//   ['note', pitch 0-11 | 12 rest, length]      ['rh', drums (16 B, 8 S, 4 M, 2 C, 1 H), length]
//   ['l', length] ['o', 1-8] ['>'] ['<'] ['&'] ['t', tempo] ['q', n] ['v', 0-15] ['v+', ±n]
//   ['rv', drum, 0-15] ['rv+', drum, ±n] ['@', n] ['@e', n] ['k', n] ['s', n] ['m', n] ['n', n]
//   ['/', mode] ['keyoff'] ['\\', n] ['@\\', n] ['p', n] ['_', pitch] ['h', delay, depth, speed, step]
//   ['@p', n] ['lfo', 0|1] ['hi'] ['sus', 0|1] ['kmode', 0|1] ['y', reg, value]
//   ['[', count (0: for ever)] ['|'] [']'] ['$'] ['@m', n] ['@o', n] ['@f']

const s8 = (x) => (x > 127 ? x - 256 : x);
const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const s16 = (b, i) => { const v = u16(b, i); return v > 32767 ? v - 65536 : v; };

// The 00 that starts the binary header, and the settings byte after it.
function header(d) {
  if (d.length < 48 || d[0] !== 0x4d || d[1] !== 0x47 || d[2] !== 0x53) throw new Error('Not an MGS file.');
  const root = d.indexOf(0);
  if (root < 0) throw new Error('Not an MGS file.');
  return { root, settings: d[root + 1] };
}

// A compressed file (version "Axx"): an LZEXE-like scheme, the whole binary part.
export function uncompressMgs(inp) {
  const { root } = header(inp);
  let rp = root + 2;
  const out = new Uint8Array(0x10000);
  let wp = rp;
  rp += 2;
  out.set(inp.subarray(0, rp));
  out[3] = 0x33;             // "MGSAxx" -> "MGS3xx"
  out[rp - 3] &= 0x7f;       // not compressed any more
  let count = 1, bits = 0;
  const bit = () => {
    const r = bits & 0x80 ? 1 : 0;
    bits = (bits << 1) & 0xff;
    if (--count === 0) { count = 8; bits = inp[rp++]; }
    return r;
  };
  bit();
  for (;;) {
    if (rp > inp.length) throw new Error('The MGS file is damaged (compressed data ends early).');
    if (bit()) { out[wp++] = inp[rp++]; continue; }
    let size, offset;
    if (bit()) {
      const lo = inp[rp++], hi = inp[rp++];
      size = hi >> 5;
      if (size === 0) { size = inp[rp++]; if (size === 0) break; }
      offset = ((hi << 8) | lo | 0xe000) - 0x10000;
    } else {
      size = (bit() << 1) | bit();
      offset = (0xff00 | inp[rp++]) - 0x10000;
    }
    if (wp + offset < 0 || wp + size + 2 > out.length) throw new Error('The MGS file is damaged (compressed data).');
    for (let i = 0; i < size + 2; i++, wp++) out[wp] = out[wp + offset];
  }
  return out.slice(0, wp);
}

// The commands of an @e envelope.
function parseEnvelope(b) {
  const out = [];
  for (let i = 0; i < b.length;) {
    const c = b[i++];
    if (c < 16) out.push(['v', c]);
    else if (c === 0x10) out.push(['@', b[i++]]);
    else if (c === 0x11) { out.push(['y', b[i], b[i + 1]]); i += 2; }
    else if (c === 0x12) out.push(['\\', s8(b[i++])]);
    else if (c >= 0x20 && c <= 0x2f) out.push(['v=', c & 15, b[i++]]);     // slide to the level over n counts
    else if (c === 0x40) out.push(['[']);
    else if (c === 0x60) out.push([']']);
    else if (c >= 0x80 && c <= 0x9f) out.push(['n', c & 31]);
    else if (c >= 0xa0 && c <= 0xaf) out.push(['/', c & 3]);
    else if (c >= 0xe0 && c <= 0xef) out.push(['v:', c & 15, b[i++]]);     // the level for n counts
    else { out.push(['?', c]); break; }
  }
  return out;
}

function parseVoice(b) {
  const v = { opll: [], maps: [], env: [], scc: [], psgTune: null, opllTune: null, texts: [], unknown: null };
  for (let i = 0; i < b.length;) {
    const c = b[i++];
    if (c === 0) { v.opll.push({ num: b[i] & 31, data: Array.from(b.subarray(i + 1, i + 9)) }); i += 9; }
    else if (c === 1) { v.maps.push({ from: b[i], to: b[i + 1] }); i += 2; }
    else if (c === 2) {
      const num = b[i] & 31, m = b[i + 1];
      i += 2;
      const mode = (m & 0x7f) >> 5, noise = m & 31;
      if (m < 0x80) {
        const len = b[i++];
        v.env.push({ type: 'e', num, mode, noise, cmds: parseEnvelope(b.subarray(i, i + len)) });
        i += len;
      } else {
        const [al, ar, dr, sl, sr, rr] = b.subarray(i, i + 6);
        v.env.push({ type: 'r', num, mode, noise, al, ar, dr, sl, sr, rr });
        i += 6;
      }
    } else if (c === 3) { v.scc.push({ num: b[i] & 31, data: Array.from(b.subarray(i + 1, i + 33), s8) }); i += 33; }
    else if (c === 4 || c === 5) {
      const t = [];
      for (let k = 0; k < 12; k++) t.push(u16(b, i + k * 2));
      if (c === 4) v.psgTune = t; else v.opllTune = t;
      i += 24;
    } else if (c === 6) {
      const num = b[i++];
      let e = b.indexOf(0, i);
      if (e < 0) e = b.length;
      v.texts.push({ num, bytes: b.slice(i, e) });
      i = e + 1;
    } else if (c === 0xff) break;
    else { v.unknown = c; break; }
  }
  return v;
}

function parseTrack(b, rhythm) {
  const cmds = [];
  let unknown = null, i = 0;
  // A length of the old (1/60 s) form: bytes are added while they are 255.
  const counts = () => { let n = 0, c; do { c = b[i++]; n += c; } while (c === 255 && i < b.length); return n; };
  while (i < b.length) {
    const c = b[i++];
    if (rhythm && c <= 0x1f) cmds.push(['rh', c & 31, counts()]);
    else if (rhythm && c <= 0x3f) cmds.push(['rh', c & 31, b[i++] || 256]);
    else if (rhythm && (c & 0xe0) === 0xa0) cmds.push(['rh', c & 31, null]);
    else if (c <= 0x0c) cmds.push(['note', c, counts()]);
    else if (c >= 0x10 && c <= 0x1c) cmds.push(['note', c & 15, null]);
    else if (c >= 0x20 && c <= 0x2f) cmds.push(['note', Math.min(12, c & 15), b[i++] || 256]);
    else if (c >= 0x30 && c <= 0x3f) cmds.push(['note', Math.min(12, c & 15), null]);
    else if (c === 0x40) cmds.push(['&']);
    else if (c === 0x41) { cmds.push(['t', u16(b, i)]); i += 50; }       // the value, then a 48-byte frame table
    else if (c === 0x42) cmds.push(['l', b[i++] || 256]);
    else if (c === 0x43) { cmds.push(['l', u16(b, i)]); i += 2; }
    else if (c === 0x44) cmds.push(['q', b[i++]]);
    else if (c === 0x45) { cmds.push(['rv', b[i] >> 5, b[i] & 15]); i++; }
    else if (c === 0x46) cmds.push(['v+', s8(b[i++])]);
    else if (c === 0x47) { cmds.push(['rv+', b[i] >> 5, (b[i] & 16 ? (b[i] & 15) - 16 : b[i] & 15)]); i++; }
    else if (c === 0x48) cmds.push(['k', b[i++]]);
    else if (c === 0x49) cmds.push(['@e', b[i++]]);
    else if (c === 0x4a) cmds.push(['keyoff']);
    else if (c === 0x4b) cmds.push(['s', b[i++]]);
    else if (c === 0x4c) { cmds.push(['m', u16(b, i)]); i += 2; }
    else if (c === 0x4d) cmds.push(['n', b[i++]]);
    else if (c === 0x4e) cmds.push(['>']);
    else if (c === 0x4f) cmds.push(['<']);
    else if (c === 0x50) cmds.push(['\\', s8(b[i++])]);
    else if (c === 0x51) { cmds.push(['@\\', s16(b, i)]); i += 2; }
    else if (c === 0x52) cmds.push(['p', b[i++]]);
    else if (c === 0x53) cmds.push(['_', b[i++]]);
    else if (c === 0x54) { cmds.push(['h', b[i] - 1, b[i + 1], b[i + 2] - 1, s8(b[i + 3])]); i += 4; }
    else if (c === 0x55) { cmds.push(['@p', s16(b, i)]); i += 2; }
    else if (c === 0x57) { cmds.push(['[', b[i]]); i += 3; }
    else if (c === 0x58) { cmds.push(['|']); i += 2; }
    else if (c === 0x59) { cmds.push([']']); i += 3; }
    else if (c === 0x5a) cmds.push([rhythm ? 'kmode' : 'lfo', b[i++] ? 1 : 0]);
    else if (c === 0x5b) cmds.push(['sus', b[i++] ? 1 : 0]);
    else if (c === 0x5c) { cmds.push(['y', b[i], b[i + 1]]); i += 2; }
    else if (c === 0x5d) cmds.push(['$']);
    else if (c === 0x5f) cmds.push(['@\\', b[i++]]);
    else if (c === 0x60) cmds.push(['@m', b[i++]]);
    else if (c === 0x61) cmds.push(['@o', b[i++]]);
    else if (c === 0x63) cmds.push(['@f']);
    else if (c === 0x64) cmds.push(['hi']);
    else if (c >= 0x80 && c <= 0x9f) cmds.push(['@', c & 31]);
    else if (c >= 0xc0 && c <= 0xcf) cmds.push(['v', c & 15]);
    else if (c >= 0xd0 && c <= 0xdf) cmds.push(['o', (c & 7) + 1]);
    else if (c >= 0xe0 && c <= 0xef) cmds.push(['/', c & 3]);
    else if (c === 0xff) break;
    else { unknown = c; break; }
  }
  return { cmds, unknown };
}

export function isMgs(bytes) {
  return bytes.length > 48 && bytes[0] === 0x4d && bytes[1] === 0x47 && bytes[2] === 0x53 && bytes[6] === 0x0d && bytes[7] === 0x0a;
}

export function parseMgs(bytes) {
  const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const compressed = !!(header(raw).settings & 0x80);
  const d = compressed ? uncompressMgs(raw) : raw;
  const { root, settings } = header(d);
  if (root + 40 > d.length) throw new Error('The MGS file is damaged (no track table).');
  let end = d.indexOf(0x1a);
  if (end < 0 || end > root) end = root;
  let title = d.subarray(8, end);
  while (title.length && (title[title.length - 1] === 0x0a || title[title.length - 1] === 0x0d)) title = title.subarray(0, title.length - 1);
  const m = {
    version: String.fromCharCode(raw[3], raw[4], raw[5]), compressed, title: title.slice(),
    opllMode: settings & 1, lfoMode: (settings >> 1) & 1, machine: (settings >> 2) & 7, noReverse: !!(settings & 0x40),
    tempo: u16(d, root + 2), voice: null, tracks: {},
  };
  const at = (t) => u16(d, root + 4 + t * 2);
  for (let t = 0; t < 18; t++) {
    const off = at(t);
    if (!off) continue;
    if (root + off >= d.length) throw new Error('The MGS file is damaged (a track lies outside the file).');
    const b = d.subarray(root + off);
    if (t === 0) m.voice = parseVoice(b);
    else m.tracks[t] = parseTrack(b, m.opllMode === 1 && t === 15);
  }
  return m;
}
