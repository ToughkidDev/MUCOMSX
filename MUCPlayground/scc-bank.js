// SCC wave banks: the wave file a MUCOMSX song uses for SCCA–SCCE (#sccvoice, SCCVOICE.DAT
// by default) and the waves the MUC defines itself, and importing waves from other files.
// No page code here, so it can be tested on its own.
//
// The file (SCWD), as MDPlayer4Mac's MsxMucCompiler reads it:
//   0   "SCWD"            4   version 1, 0      6   count (1–256)    8   record size 34
//   10  0                 12  CRC-32 of everything after the 16-byte header
//   16  count records: wave number (16-bit, 0–255, ascending) and 32 signed samples
// A wave defined in the MUC (  @Wn:{ 32 values }) wins over the file's wave n.
// A wave here: an array of 32 numbers, -128..127.

const MAGIC = 'SCWD';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export const isScwd = (bytes) => bytes && bytes.length >= 16 && String.fromCharCode(...bytes.slice(0, 4)) === MAGIC;

// [{ n, wave }] in number order, or null when the file is not one the compiler accepts.
export function readScwd(bytes) {
  if (!isScwd(bytes) || bytes[4] !== 1 || bytes[5] !== 0) return null;
  const u16 = (at) => bytes[at] | (bytes[at + 1] << 8);
  const count = u16(6);
  if (u16(8) !== 34 || u16(10) !== 0 || count < 1 || count > 256 || bytes.length !== 16 + count * 34) return null;
  const out = [];
  for (let i = 0; i < count; i++) {
    const at = 16 + i * 34;
    out.push({ n: u16(at), wave: Array.from(bytes.slice(at + 2, at + 34), (b) => (b > 127 ? b - 256 : b)) });
  }
  return out;
}

// A file holding these waves ([{ n, wave }]); null when there are none (a file needs one).
export function writeScwd(waves) {
  const list = [...waves].filter((w) => w.n >= 0 && w.n <= 255).sort((a, b) => a.n - b.n);
  if (!list.length) return null;
  const out = new Uint8Array(16 + list.length * 34);
  out.set([0x53, 0x43, 0x57, 0x44, 1, 0, list.length & 255, list.length >> 8, 34, 0, 0, 0]);
  list.forEach((w, i) => {
    const at = 16 + i * 34;
    out[at] = w.n;
    out[at + 1] = 0;
    for (let k = 0; k < 32; k++) out[at + 2 + k] = (Math.max(-128, Math.min(127, Math.round(w.wave[k] || 0))) + 256) & 255;
  });
  const crc = crc32(out.subarray(16));
  out[12] = crc & 255; out[13] = (crc >>> 8) & 255; out[14] = (crc >>> 16) & 255; out[15] = crc >>> 24;
  return out;
}

// ---------- waves written in a MUC ----------
// "  @Wn:{ … }" (or = or nothing before the braces, or 32 values without braces), on one
// line or several, as MsxMucCompiler.ExtractScc reads them. [{ n, wave, row, endRow }].
// A song with #SSGExtend On uses 64-sample @W waves for D E F instead: none are read.
export function mucWaves(text) {
  if (/^#SSGExtend[ \t]+On\b/im.test(text)) return [];
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^[ \t]+@W(\d+)[ \t]*(?:[:=][ \t]*)?(\{)?(.*)$/i.exec(lines[i]);
    if (!m) continue;
    const braces = !!m[2];
    let rest = m[3], end = i, closed = false;
    const vals = [];
    for (;;) {
      let part = rest.split(';')[0];
      const close = part.indexOf('}');
      if (close >= 0) { part = part.slice(0, close); closed = true; }
      for (const tok of part.split(/[,\s]+/).filter(Boolean)) vals.push(/^-?\d+$/.test(tok) ? +tok : NaN);
      if (closed || (!braces && vals.length >= 32) || vals.length > 32 || end + 1 >= lines.length || end - i > 12) break;
      end++;
      rest = lines[end];
    }
    if (vals.length === 32 && vals.every((v) => v >= -128 && v <= 127)) out.push({ n: +m[1], wave: vals, row: i + 1, endRow: end + 1 });
    i = end;
  }
  return out;
}

export const waveLine = (n, wave) => `  @W${n}:{ ${wave.join(',')} }`;
export const waveKey = (wave) => wave.join(',');

// ---------- what a wave sounds like ----------
// Its harmonics (1–15) compared with the basic shapes; '' when it is none of them.
function spectrum(w) {
  const mean = w.reduce((a, b) => a + b, 0) / w.length;
  const mags = [];
  for (let k = 1; k <= 15; k++) {
    let re = 0, im = 0;
    w.forEach((v, i) => { re += (v - mean) * Math.cos((2 * Math.PI * k * i) / w.length); im += (v - mean) * Math.sin((2 * Math.PI * k * i) / w.length); });
    mags.push(Math.hypot(re, im));
  }
  const norm = Math.hypot(...mags) || 1;
  return mags.map((m) => m / norm);
}
const shape = (f) => Array.from({ length: 32 }, (_, i) => Math.round(127 * f(i / 32)));
const SHAPES = [
  ['sine', shape((t) => Math.sin(2 * Math.PI * t))],
  ['triangle', shape((t) => 1 - 4 * Math.abs(t - 0.5))],
  ['saw', shape((t) => 2 * t - 1)],
  ['square', shape((t) => (t < 0.5 ? 1 : -1))],
  ...[4, 8, 12].map((k) => [`pulse ${k}/32`, shape((t) => (t < k / 32 ? 1 : -1))]),
].map(([name, w]) => [name, spectrum(w)]);

export function waveShape(wave) {
  if (Math.max(...wave) === Math.min(...wave)) return 'flat';
  const s = spectrum(wave);
  let best = '', score = 0;
  for (const [name, ref] of SHAPES) {
    const c = s.reduce((sum, v, i) => sum + v * ref[i], 0);
    if (c > score) { score = c; best = name; }
  }
  return score >= 0.97 ? best : '';
}

// ---------- importing ----------
// VGM / VGZ: the waves the K051649 / K052539 (SCC / SCC+) actually plays: a channel's 32
// bytes taken once it is keyed on with a volume above 0. [{ wave, count }], most used first.
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

function vgmWaves(bytes) {
  const le32 = (at) => (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
  let p = le32(8) >= 0x150 && le32(0x34) ? 0x34 + le32(0x34) : 0x40;
  const ram = Array.from({ length: 5 }, () => new Array(32).fill(0));
  const dirty = new Array(5).fill(false), keyed = new Array(5).fill(false), vol = new Array(5).fill(0);
  const found = new Map();
  const take = (ch) => {
    if (!(dirty[ch] && keyed[ch] && vol[ch])) return;
    dirty[ch] = false;
    const wave = ram[ch].map((b) => (b > 127 ? b - 256 : b));
    if (Math.max(...wave) === Math.min(...wave)) return;
    const key = waveKey(wave);
    const f = found.get(key);
    if (f) f.count++; else found.set(key, { wave, count: 1 });
  };
  while (p < bytes.length) {
    const c = bytes[p];
    if (c === 0x66) break;
    if (c === 0x67) { p += 7 + (le32(p + 3) & 0x7fffffff); continue; }
    if (c === 0xd2) {
      const port = bytes[p + 1] & 0x7f, a = bytes[p + 2], d = bytes[p + 3];
      if (!(bytes[p + 1] & 0x80)) {
        if (port === 0 && a < 0x80) {            // SCC: channels 0-3; 4 shares 3's RAM
          const ch = a >> 5;
          for (const c2 of ch === 3 ? [3, 4] : [ch]) { ram[c2][a & 31] = d; dirty[c2] = true; if ((a & 31) === 31) take(c2); }
        } else if (port === 4 && a < 0xa0) {     // SCC+: five waves
          const ch = a >> 5;
          ram[ch][a & 31] = d; dirty[ch] = true;
          if ((a & 31) === 31) take(ch);
        } else if (port === 1) take(Math.min(4, a >> 1));
        else if (port === 2) { const ch = Math.min(4, a); vol[ch] = d & 15; take(ch); }
        else if (port === 3) for (let ch = 0; ch < 5; ch++) { keyed[ch] = !!(d & (1 << ch)); take(ch); }
      }
      p += 4;
      continue;
    }
    const n = VGM_LEN[c];
    p += n < 0 ? 1 : 1 + n;
  }
  return [...found.values()].sort((a, b) => b.count - a.count);
}

// Furnace .fur / .fuw: its 32-sample wavetables (any height, scaled to -128..127).
function furnaceWaves(bytes) {
  const out = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i + 8 < bytes.length; i++) {
    if (bytes[i] !== 0x57 || bytes[i + 1] !== 0x41 || bytes[i + 2] !== 0x56 || bytes[i + 3] !== 0x45) continue;   // WAVE
    let p = i + 8;
    let name = '';
    while (p < bytes.length && bytes[p] && name.length < 200) name += String.fromCharCode(bytes[p++]);
    p++;
    if (p + 12 > bytes.length) continue;
    const width = view.getInt32(p, true), height = view.getInt32(p + 8, true);
    p += 12;
    if (width !== 32 || height < 1 || height > 255 || p + 128 > bytes.length) continue;
    const vals = Array.from({ length: 32 }, (_, k) => view.getInt32(p + k * 4, true));
    if (vals.some((v) => v < 0 || v > height)) continue;
    const wave = vals.map((v) => Math.round((v / height) * 255) - 128);
    if (Math.max(...wave) !== Math.min(...wave)) out.push({ wave, name });
  }
  return out;
}

async function inflate(bytes, format) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Waves found in a file: { kind, waves: [{ wave, n?, count? }] }. kind: 'scwd', 'muc',
// 'vgm', 'furnace' or null.
export async function importWaves(fileName, bytes, decodeText = (b) => new TextDecoder('shift_jis').decode(b)) {
  const ext = fileName.toLowerCase().split('.').pop();
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await inflate(bytes, 'gzip');
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  if (magic === MAGIC) return { kind: 'scwd', waves: (readScwd(bytes) || []).map((w) => ({ wave: w.wave, n: w.n })) };
  if (magic === 'Vgm ') return { kind: 'vgm', waves: vgmWaves(bytes) };
  if (ext === 'fur' || ext === 'fuw') {
    if (!String.fromCharCode(...bytes.slice(0, 8)).startsWith('-Furnace')) {
      try { bytes = await inflate(bytes, 'deflate'); } catch { return { kind: 'furnace', waves: [] }; }
    }
    return { kind: 'furnace', waves: furnaceWaves(bytes) };
  }
  if (ext === 'muc' || ext === 'txt') return { kind: 'muc', waves: mucWaves(decodeText(bytes)).map((w) => ({ wave: w.wave, n: w.n })) };
  return { kind: null, waves: [] };
}
