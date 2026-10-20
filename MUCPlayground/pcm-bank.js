// MUCOM88 ADPCM (#pcm) banks: the YM2608 ADPCM-B codec, the bank file formats, WAV files and
// the importers behind the PCM tab of the voice bank.
//
// MUCOM88 bank (mucompcm.bin, as mucomDotNET's PCMTool writes it): 32 entries of 32 bytes,
// then the ADPCM data.
//   +0  name, 16 bytes (Shift-JIS, space padded; a 0 first byte = no entry)
//   +16 10 bytes the tools keep for themselves (kept as they are)
//   +26 volume (u16)
//   +28 start address in 4-byte units (u16)
//   +30 length in bytes (u16); the driver plays one 4-byte unit more (start + length / 4
//       is its inclusive end), so an entry here is that whole range
// The driver skips nameless entries, so @n is the n-th named entry: a bank written here
// names every entry up to the last one (a hole gets a silent "-").
// mucomDotNET's own form ("mda "): 'mda ', count (u16), then count + 1 entries of
// name + 0, 3, volume (u16), start (u16), end (u16) in 4-byte units, then the data.
//
// The chip plays the data at DELTA-N / 65536 × 55.47 kHz; the driver's o1 c is
// 0x4A82 → about 16.1 kHz, the rate a sample plays at its own pitch on o1 c (o2 c: half).

export const SLOTS = 32;
export const RAM_SIZE = 0x40000;                       // 256 KB of ADPCM RAM
export const CHIP_RATE = 7987200 / 144;                // YM2608 ADPCM output rate
const PCMNMB = [0x49BA, 0x4E1C, 0x52C1, 0x57AD, 0x5CE4, 0x626A, 0x6844, 0x6E77, 0x7509, 0x7BFE, 0x835E, 0x8B2D].map((x) => x + 200);
export const NATIVE_RATE = (CHIP_RATE * PCMNMB[0]) / 65536;   // o1 c, about 16136 Hz
const NOTE_NAMES = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];

// The rate the driver plays a note at (o1–o8; higher octaves play slower, as in the driver).
export const noteRate = (oct, semi) => (CHIP_RATE * (PCMNMB[semi] >> (oct - 1))) / 65536;
// The note that plays data recorded at `rate` at its own pitch (nearest; cents off).
export function rateNote(rate) {
  let best = null;
  for (let o = 1; o <= 8; o++) for (let s = 0; s < 12; s++) {
    const cents = 1200 * Math.log2(rate / noteRate(o, s));
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { oct: o, semi: s, cents, text: `o${o} ${NOTE_NAMES[s]}` };
  }
  return best;
}

// ---------- ADPCM-B ----------
const STEP = [57, 57, 57, 57, 77, 102, 128, 153, 57, 57, 57, 57, 77, 102, 128, 153];

// Float samples (-1..1) to ADPCM-B, padded to a whole number of 4-byte units (mucomDotNET's
// encoder, with the chip's limits on the running value so both stay in step).
export function encodeAdpcm(samples) {
  const count = Math.ceil(samples.length / 8) * 8;
  const out = new Uint8Array(count / 2);
  let xn = 0, step = 127;
  for (let i = 0; i < count; i++) {
    const s = i < samples.length ? Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))) : 0;
    const dn = s - xn;
    let code = Math.min(7, Math.floor((Math.abs(dn) * 4) / step));
    const d = Math.trunc(((code * 2 + 1) * step) / 8);
    if (dn < 0) { code |= 8; xn -= d; } else xn += d;
    xn = Math.max(-32768, Math.min(32767, xn));
    step = Math.max(127, Math.min(24576, Math.trunc((STEP[code] * step) / 64)));
    if (i & 1) out[i >> 1] |= code; else out[i >> 1] = code << 4;
  }
  return out;
}

// ADPCM-B to float samples, as the chip plays it.
export function decodeAdpcm(bytes) {
  const out = new Float32Array(bytes.length * 2);
  let xn = 0, step = 127;
  for (let i = 0; i < out.length; i++) {
    const code = i & 1 ? bytes[i >> 1] & 15 : bytes[i >> 1] >> 4;
    const d = Math.trunc((((code & 7) * 2 + 1) * step) / 8);
    xn = Math.max(-32768, Math.min(32767, code & 8 ? xn - d : xn + d));
    step = Math.max(127, Math.min(24576, Math.trunc((STEP[code] * step) / 64)));
    out[i] = xn / 32768;
  }
  return out;
}

// YM2610 ADPCM-A (12-bit, fixed 18.5 kHz) to float samples, for VGM imports.
function decodeAdpcmA(bytes) {
  const steps = [16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552];
  const adj = [-1, -1, -1, -1, 2, 5, 7, 9];
  const out = new Float32Array(bytes.length * 2);
  let acc = 0, idx = 0;
  for (let i = 0; i < out.length; i++) {
    const code = i & 1 ? bytes[i >> 1] & 15 : bytes[i >> 1] >> 4;
    const v = Math.trunc(((2 * (code & 7) + 1) * steps[idx]) / 8);
    acc = Math.max(-2048, Math.min(2047, acc + (code & 8 ? -v : v)));
    idx = Math.max(0, Math.min(48, idx + adj[code & 7]));
    out[i] = acc / 2048;
  }
  return out;
}

// ---------- names ----------
const sjis = (() => { try { return new TextDecoder('shift_jis'); } catch { return null; } })();
const decodeName = (b) => (sjis ? sjis.decode(b) : String.fromCharCode(...b)).replace(/[\0\s]+$/, '');
export const cleanName = (s) => String(s ?? '').replace(/[^\x20-\x7e]/g, '').trim().slice(0, 16);
const HOLE = '-';

// ---------- bank files ----------
const u16 = (b, at) => b[at] | (b[at + 1] << 8);
export const isMda = (b) => b && b.length > 6 && String.fromCharCode(b[0], b[1], b[2], b[3]) === 'mda ';

// { format: 'mucom88' | 'mda', entries: [{ n, name, volume, adpcm, extra? }] } or null when
// the bytes are not a bank.
export function readPcmBank(bytes) {
  if (!bytes) return null;
  if (isMda(bytes)) {
    const count = u16(bytes, 4) + 1;
    let p = 6;
    const raw = [];
    for (let i = 0; i < count; i++) {
      const start = p;
      while (p < bytes.length && bytes[p]) p++;
      if (p + 8 > bytes.length) return null;
      const name = decodeName(bytes.subarray(start, p));
      p += 2;
      raw.push({ n: i + 1, name, volume: u16(bytes, p), st: u16(bytes, p + 2), ed: u16(bytes, p + 4) });
      p += 6;
    }
    const data = bytes.subarray(p);
    const entries = [];
    for (const r of raw) {
      if (!r.name && !r.ed) continue;
      const from = r.st * 4, to = Math.min(data.length, (r.ed + 1) * 4);
      if (from >= data.length || to <= from) continue;
      entries.push({ n: r.n, name: r.name, volume: r.volume, adpcm: data.slice(from, to) });
    }
    return { format: 'mda', entries };
  }
  if (bytes.length < 0x400) return null;
  const data = bytes.subarray(0x400);
  const entries = [];
  let n = 0;
  for (let i = 0; i < SLOTS; i++) {
    const at = i * 32;
    if (!bytes[at]) {
      // Not an entry: then the rest of the record should be empty too.
      if (bytes.subarray(at + 16, at + 32).some((x, k) => x && k >= 12)) return null;
      continue;
    }
    n++;
    const nameBytes = bytes.subarray(at, at + 16);
    if (nameBytes.some((x) => x < 0x20 && x !== 0)) return null;
    const st = u16(bytes, at + 28) * 4, len = u16(bytes, at + 30);
    if (st > data.length) return null;
    const name = decodeName(nameBytes);
    if (name === HOLE && !len) continue;
    // Entries may overlap, or run past the data (into RAM the chip has cleared).
    const adpcm = new Uint8Array((len & ~3) + 4);
    adpcm.set(data.subarray(st, st + adpcm.length));
    entries.push({ n, name, volume: u16(bytes, at + 26), adpcm, extra: bytes.slice(at + 16, at + 26) });
  }
  return { format: 'mucom88', entries };
}

// A bank from entries [{ n, name, volume, adpcm, extra? }]; null when there are none.
// The driver plays each entry's data exactly.
export function writePcmBank(entries, format = 'mucom88') {
  const list = entries.filter((e) => e && e.adpcm && e.adpcm.length).sort((a, b) => a.n - b.n);
  if (!list.length) return null;
  const last = list[list.length - 1].n;
  const byN = new Map(list.map((e) => [e.n, e]));
  const parts = [];
  let size = 0;
  const place = (adpcm) => {
    const len = Math.ceil(adpcm.length / 4) * 4;
    const st = size;
    if (st + len > RAM_SIZE) throw new Error(`PCM: more than ${RAM_SIZE >> 10} KB of ADPCM data`);
    parts.push([st, adpcm]);
    size += len;
    return { st, len };
  };
  const name = (s) => { const t = cleanName(s); return t || HOLE; };
  if (format === 'mda') {
    const heads = [];
    for (let n = 1; n <= last + 1; n++) {
      const e = byN.get(n);
      const at = e ? place(e.adpcm) : null;
      const nm = e ? name(e.name) : '';
      heads.push([...Array.from(nm, (c) => c.charCodeAt(0)), 0, 3,
        ...le16(e?.volume ?? 0), ...le16(at ? at.st >> 2 : 0), ...le16(at ? (at.st + at.len - 1) >> 2 : 0)]);
    }
    const head = [0x6d, 0x64, 0x61, 0x20, ...le16(last), ...heads.flat()];
    const out = new Uint8Array(head.length + size).fill(0x80);
    out.set(head);
    for (const [st, adpcm] of parts) out.set(adpcm, head.length + st);
    return out;
  }
  if (last > SLOTS) throw new Error(`PCM @${last}: a MUCOM88 bank holds @1–@${SLOTS}`);
  const heads = new Uint8Array(0x400);
  for (let n = 1; n <= last; n++) {
    const e = byN.get(n), at = (n - 1) * 32;
    heads.fill(0x20, at, at + 16);
    const nm = e ? name(e.name) : HOLE;
    for (let k = 0; k < nm.length; k++) heads[at + k] = nm.charCodeAt(k);
    if (e?.extra) heads.set(e.extra.subarray(0, 10), at + 16);
    heads.set(le16(e?.volume ?? 0), at + 26);
    if (e) {
      const p = place(e.adpcm);
      if (p.len - 4 > 0xffff) throw new Error(`PCM @${n}: ${p.len} bytes (at most 65536)`);
      heads.set(le16(p.st >> 2), at + 28);
      heads.set(le16(p.len - 4), at + 30);
    }
  }
  const out = new Uint8Array(0x400 + size).fill(0x80);
  out.set(heads);
  for (const [st, adpcm] of parts) out.set(adpcm, 0x400 + st);
  return out;
}
const le16 = (v) => [v & 255, (v >> 8) & 255];

// Number n of a bank set to an entry (null: removed).
export function putPcm(bytes, n, entry) {
  const bank = readPcmBank(bytes) || { format: 'mucom88', entries: [] };
  const list = bank.entries.filter((e) => e.n !== n);
  if (entry) list.push({ ...entry, n });
  return writePcmBank(list, bank.format);
}

// A short stable key for the data (duplicates on import).
export function pcmKey(adpcm) {
  let h = 0x811c9dc5;
  for (let i = 0; i < adpcm.length; i++) h = Math.imul(h ^ adpcm[i], 0x01000193);
  return `${adpcm.length}:${(h >>> 0).toString(16)}`;
}

// ---------- WAV ----------
// Any PCM / float WAV, mixed to mono: { rate, samples, channels, bits, float }.
export function readWav(bytes) {
  const s4 = (at) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
  if (bytes.length < 12 || s4(0) !== 'RIFF' || s4(8) !== 'WAVE') return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fmt = null, data = null;
  for (let p = 12; p + 8 <= bytes.length;) {
    const id = s4(p), size = dv.getUint32(p + 4, true);
    if (id === 'fmt ') {
      let format = dv.getUint16(p + 8, true);
      if (format === 0xfffe && size >= 26) format = dv.getUint16(p + 32, true);
      fmt = { format, channels: dv.getUint16(p + 10, true), rate: dv.getUint32(p + 12, true), align: dv.getUint16(p + 20, true), bits: dv.getUint16(p + 22, true) };
    } else if (id === 'data') data = { at: p + 8, size: Math.min(size, bytes.length - p - 8) };
    p += 8 + size + (size & 1);
  }
  if (!fmt || !data || !fmt.channels || !fmt.rate) return null;
  const { format, channels, bits } = fmt;
  const width = bits >> 3, frame = Math.max(fmt.align, width * channels);
  if (!((format === 1 && [8, 16, 24, 32].includes(bits)) || (format === 3 && (bits === 32 || bits === 64)))) return null;
  const frames = Math.floor(data.size / frame);
  const out = new Float32Array(frames);
  const read = (at) => {
    if (format === 3) return bits === 32 ? dv.getFloat32(at, true) : dv.getFloat64(at, true);
    if (bits === 8) return (bytes[at] - 128) / 128;
    if (bits === 16) return dv.getInt16(at, true) / 32768;
    if (bits === 24) return (((bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16)) << 8) >> 8) / 8388608;
    return dv.getInt32(at, true) / 2147483648;
  };
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += read(data.at + i * frame + c * width);
    out[i] = sum / channels;
  }
  return { rate: fmt.rate, samples: out, channels, bits, float: format === 3 };
}

// What the mucomDotNET compiler takes for #@pcm: 8 / 16-bit mono PCM.
export function wavFitsCompiler(bytes) {
  const w = readWav(bytes);
  return !!w && w.channels === 1 && !w.float && (w.bits === 8 || w.bits === 16);
}

// 16-bit mono WAV.
export function writeWav(samples, rate) {
  const n = samples.length, out = new Uint8Array(44 + n * 2);
  const dv = new DataView(out.buffer);
  const str = (at, s) => { for (let i = 0; i < 4; i++) out[at + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, Math.round(rate), true); dv.setUint32(28, Math.round(rate) * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), true);
  return out;
}

// ---------- resampling ----------
// Windowed sinc (Blackman, 16 zero crossings a side), low-passed when going down.
export function resample(samples, from, to) {
  if (!samples.length || Math.abs(from - to) < 1e-6) return Float32Array.from(samples);
  const ratio = from / to, n = Math.max(1, Math.round(samples.length / ratio));
  const cut = Math.min(1, 1 / ratio), half = 16 / cut;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * ratio, lo = Math.ceil(x - half), hi = Math.floor(x + half);
    let sum = 0, wsum = 0;
    for (let k = lo; k <= hi; k++) {
      const t = k - x;
      const sinc = t === 0 ? 1 : Math.sin(Math.PI * t * cut) / (Math.PI * t * cut);
      const w = 0.42 + 0.5 * Math.cos((Math.PI * t) / half) + 0.08 * Math.cos((2 * Math.PI * t) / half);
      const v = k >= 0 && k < samples.length ? samples[k] : 0;
      sum += v * sinc * w;
      wsum += sinc * w;
    }
    out[i] = wsum ? sum / wsum : 0;
  }
  return out;
}

// ---------- the MUC's own samples: #@pcm n,"name","file.wav",volume[,R] ----------
// [{ n, name, file, volume, reverse, row, endRow }] (rows 1-based).
export function mucPcms(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const m = /^#@pcm[ \t]+(.*)$/i.exec(line);
    if (!m) return;
    const items = splitItems(m[1].replace(/;.*$/, ''));
    const n = parseNumber(items[0]);
    if (!Number.isFinite(n)) return;
    out.push({ n, name: items[1] ?? '', file: items[2] ?? '', volume: items.length > 3 && /^\d+$/.test(items[3]) ? +items[3] : 0, reverse: (items[4] || '').toUpperCase() === 'R', row: i + 1, endRow: i + 1 });
  });
  return out;
}
function splitItems(s) {
  const items = [];
  let item = '', str = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') { if (str && s[i + 1] === '"') { item += '"'; i++; continue; } str = !str; continue; }
    if (c === ',' && !str) { items.push(item.trim()); item = ''; continue; }
    item += c;
  }
  if (item.trim()) items.push(item.trim());
  return items;
}
function parseNumber(s) {
  s = String(s ?? '').trim().toLowerCase();
  if (/^\$[0-9a-f]+$/.test(s)) return parseInt(s.slice(1), 16);
  if (/^\d+$/.test(s)) return +s;
  return NaN;
}
export const pcmLine = (n, name, file, volume = 100, reverse = false) => `#@pcm ${n},"${cleanName(name).replace(/"/g, "'")}","${file}",${volume}${reverse ? ',R' : ''}`;

// The samples a #@pcm line stands for, as the compiler reads them (volume %, reversed).
export function mucSamples(def, wavBytes) {
  const w = wavBytes && readWav(wavBytes);
  if (!w) return null;
  const k = (def.volume || 0) / 100;
  let s = w.samples.map((x) => Math.max(-1, Math.min(1, x * k)));
  if (def.reverse) s = s.reverse();
  return { samples: s, rate: w.rate };
}

// ---------- imports ----------
// Samples found in a file: { kind, samples: [{ name, adpcm?, samples?, rate?, volume? }] }.
// adpcm: chip data taken as it is; samples: audio to encode (at `rate`).
export async function importPcm(fileName, bytes, decodeAudio = null) {
  const base = fileName.split(/[\\/]/).pop().replace(/\.[^.]*$/, '');
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  if (magic === 'RIFF') {
    const w = readWav(bytes);
    if (w) return { kind: 'wav', samples: [{ name: base, samples: w.samples, rate: w.rate }] };
  }
  if (magic === 'Vgm ') return { kind: 'vgm', samples: vgmSamples(bytes, base) };
  if (magic === 'MUC8' || magic === 'MUB8') {
    const le32 = (at) => (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
    const ptr = le32(0x14), size = le32(0x18);
    const bank = ptr && size && ptr + size <= bytes.length ? readPcmBank(bytes.subarray(ptr, ptr + size)) : null;
    return { kind: 'mub', samples: bank ? bank.entries.map(fromBank) : [] };
  }
  const bank = readPcmBank(bytes);
  if (bank && bank.entries.length) return { kind: 'bank', samples: bank.entries.map(fromBank) };
  if (decodeAudio) {
    try {
      const a = await decodeAudio(bytes);
      if (a) return { kind: 'audio', samples: [{ name: base, samples: a.samples, rate: a.rate }] };
    } catch { /* not audio the browser knows */ }
  }
  return { kind: null, samples: [] };
}
const fromBank = (e) => ({ name: e.name, adpcm: e.adpcm, volume: e.volume, extra: e.extra });

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const VGM_LEN = (() => {
  const t = new Array(256).fill(-1);
  for (let c = 0x30; c <= 0x3f; c++) t[c] = 1;
  for (let c = 0x40; c <= 0x4e; c++) t[c] = 2;
  t[0x4f] = 1; t[0x50] = 1;
  for (let c = 0x51; c <= 0x5f; c++) t[c] = 2;
  t[0x61] = 2; t[0x62] = 0; t[0x63] = 0; t[0x68] = 11;
  for (let c = 0x70; c <= 0x8f; c++) t[c] = 0;
  Object.assign(t, { 0x90: 4, 0x91: 4, 0x92: 5, 0x93: 10, 0x94: 1, 0x95: 4 });
  for (let c = 0xa0; c <= 0xbf; c++) t[c] = 2;
  for (let c = 0xc0; c <= 0xdf; c++) t[c] = 3;
  for (let c = 0xe0; c <= 0xff; c++) t[c] = 4;
  return t;
})();

// The samples a VGM keys on: YM2608 ADPCM (RAM filled by data blocks or register writes),
// YM2610 ADPCM-B / ADPCM-A and Y8950 (MSX-AUDIO) ADPCM. ADPCM-B data is taken as it is;
// ADPCM-A (another codec) is decoded to audio.
function vgmSamples(bytes, base) {
  const le32 = (at) => (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
  const version = le32(8);
  let p = version >= 0x150 && le32(0x34) ? 0x34 + le32(0x34) : 0x40;
  const clock = (at, def) => (version >= 0x151 && le32(at) ? le32(at) & 0x3fffffff : def);
  const opnaClock = clock(0x48, 7987200), opnbClock = clock(0x4c, 8000000), y8950Clock = clock(0x58, 3579545);
  const roms = { opna: new Uint8Array(0), opnbB: new Uint8Array(0), opnbA: new Uint8Array(0), y8950: new Uint8Array(0) };
  const grow = (key, size) => { if (roms[key].length < size) { const r = new Uint8Array(Math.min(size, 1 << 24)); r.set(roms[key]); roms[key] = r; } };
  const putRom = (key, at, data) => { grow(key, at + data.length); roms[key].set(data.subarray(0, Math.max(0, roms[key].length - at)), at); };
  const opna = { r: new Uint8Array(0x20), ptr: 0, writing: false };
  const opnb = { r: new Uint8Array(0x20), a: new Uint8Array(0x30) };
  const y = { r: new Uint8Array(0x20), ptr: 0, writing: false };
  const found = new Map();
  const take = (rom, from, to, rate, kind) => {
    if (to <= from || from >= rom.length) return;
    const slice = rom.slice(from, Math.min(to, rom.length));
    if (!slice.some((b) => b !== 0 && b !== 0x80 && b !== 0x08 && b !== 0x88)) return;
    const key = `${kind}:${from}:${slice.length}`;
    const f = found.get(key);
    if (f) { f.count++; return; }
    found.set(key, kind === 'a' ? { samples: decodeAdpcmA(slice), rate, count: 1, from } : { adpcm: slice, rate, count: 1, from });
  };
  const deltaN = (lo, hi) => lo | (hi << 8);
  while (p < bytes.length) {
    const c = bytes[p];
    if (c === 0x66) break;
    if (c === 0x67) {
      const type = bytes[p + 2], size = le32(p + 3) & 0x7fffffff;
      const key = { 0x81: 'opna', 0x83: 'opnbB', 0x82: 'opnbA', 0x88: 'y8950' }[type];
      if (key && size > 8) putRom(key, le32(p + 11), bytes.subarray(p + 15, p + 7 + size));
      p += 7 + size;
      continue;
    }
    const a = bytes[p + 1], d = bytes[p + 2];
    if (c === 0x57 && a < 0x20) {              // YM2608 port 1: ADPCM
      opna.r[a] = d;
      const unit = opna.r[1] & 3 ? 32 : 4;
      if (a === 0) {
        if ((d & 0x60) === 0x60) { opna.writing = true; opna.ptr = (opna.r[2] | (opna.r[3] << 8)) * unit; }
        else opna.writing = false;
        if ((d & 0xe0) === 0xa0) {             // start, playing from RAM
          const st = (opna.r[2] | (opna.r[3] << 8)) * unit, ed = ((opna.r[4] | (opna.r[5] << 8)) + 1) * unit;
          take(roms.opna, st, ed, (deltaN(opna.r[9], opna.r[10]) / 65536) * (opnaClock / 144), 'b');
        }
      } else if (a === 8 && opna.writing) { grow('opna', opna.ptr + 1); roms.opna[opna.ptr++] = d; }
    } else if (c === 0x59 && a >= 0x10 && a < 0x20) {   // YM2610 port 1: ADPCM-B
      opnb.r[a - 0x10] = d;
      if (a === 0x10 && (d & 0x80)) {
        const st = (opnb.r[2] | (opnb.r[3] << 8)) << 8, ed = ((opnb.r[4] | (opnb.r[5] << 8)) + 1) << 8;
        take(roms.opnbB, st, ed, (deltaN(opnb.r[9], opnb.r[10]) / 65536) * (opnbClock / 144), 'b');
      }
    } else if (c === 0x59 && a < 0x30) {       // YM2610 port 1: ADPCM-A
      opnb.a[a] = d;
      if (a === 0 && !(d & 0x80)) for (let ch = 0; ch < 6; ch++) {
        if (!(d & (1 << ch))) continue;
        const st = (opnb.a[0x10 + ch] | (opnb.a[0x18 + ch] << 8)) << 8, ed = ((opnb.a[0x20 + ch] | (opnb.a[0x28 + ch] << 8)) + 1) << 8;
        take(roms.opnbA, st, ed, opnbClock / 432, 'a');
      }
    } else if (c === 0x5c && a >= 0x07 && a <= 0x12) {   // Y8950: ADPCM
      y.r[a] = d;
      if (a === 0x07) {
        y.writing = (d & 0x60) === 0x60;
        if (y.writing) y.ptr = (y.r[9] | (y.r[10] << 8)) * 32;
      }
      if (a === 0x0f && y.writing) { grow('y8950', y.ptr + 1); roms.y8950[y.ptr++] = d; }
      if (a === 0x07 && (d & 0xe0) === 0xa0) {
        const st = (y.r[9] | (y.r[10] << 8)) * 32, ed = ((y.r[11] | (y.r[12] << 8)) + 1) * 32;
        take(roms.y8950, st, ed, (deltaN(y.r[0x10], y.r[0x11]) / 65536) * (y8950Clock / 72), 'b');
      }
    }
    const n = VGM_LEN[c];
    p += n < 0 ? 1 : 1 + n;
  }
  return [...found.values()].sort((a, b) => a.from - b.from).map((f, i) => ({ ...f, name: `${base.slice(0, 12)}${i + 1}` }));
}
