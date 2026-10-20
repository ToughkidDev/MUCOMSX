// FM voice banks: MUCOM88's voice file (VOICE.DAT) and the voices a song defines itself, and
// importing voices from other files. No page code here, so it can be tested on its own.
//
// VOICE.DAT: 256 records of 32 bytes (8192 bytes; shorter files exist). Record n is @n,
// record 0 a header. In a record:
//   0       a byte of the original tools (kept as it is)
//   1-24    registers in operator order OP1 OP3 OP2 OP4: DT/ML ×4, TL ×4, KS/AR ×4, DR ×4,
//           SR (D2R) ×4, SL/RR ×4          (the compiler's smon.CONVERT layout)
//   25      FB/ALG
//   26-31   the name, six characters (MML can pick a voice by name: @"brass1")
// A record whose 25 data bytes are all 0 is empty.
//
// A voice here: { fb, alg, ops: [{ AR, D1R, D2R, RR, D1L, TL, KS, ML, DT } × 4] }, the
// operators in OP1..OP4 order as in an inline definition (fm-preview.js).

export const FIELDS = ['AR', 'D1R', 'D2R', 'RR', 'D1L', 'TL', 'KS', 'ML', 'DT'];
export const DAT_SIZE = 8192;
const REG_ORDER = [0, 2, 1, 3];            // register slot -> operator (OP1 OP3 OP2 OP4)
const CARRIERS = [[3], [3], [3], [3], [1, 3], [1, 2, 3], [1, 2, 3], [0, 1, 2, 3]];

const op = (o) => Object.fromEntries(FIELDS.map((f) => [f, o[f] | 0]));
export const cloneVoice = (v) => ({ fb: v.fb | 0, alg: v.alg | 0, ops: v.ops.map(op) });

// ---------- records ----------
export function encodeVoice(v) {
  const b = new Uint8Array(25);
  REG_ORDER.forEach((o, r) => {
    const p = v.ops[o];
    b[r] = ((p.DT & 7) << 4) | (p.ML & 15);
    b[4 + r] = p.TL & 127;
    b[8 + r] = ((p.KS & 3) << 6) | (p.AR & 31);
    b[12 + r] = p.D1R & 31;
    b[16 + r] = p.D2R & 31;
    b[20 + r] = ((p.D1L & 15) << 4) | (p.RR & 15);
  });
  b[24] = ((v.fb & 7) << 3) | (v.alg & 7);
  return b;
}

export function decodeVoice(b) {
  const ops = [null, null, null, null];
  REG_ORDER.forEach((o, r) => {
    ops[o] = {
      AR: b[8 + r] & 31, D1R: b[12 + r] & 31, D2R: b[16 + r] & 31, RR: b[20 + r] & 15, D1L: b[20 + r] >> 4,
      TL: b[4 + r] & 127, KS: b[8 + r] >> 6, ML: b[r] & 15, DT: (b[r] >> 4) & 7,
    };
  });
  return { fb: (b[24] >> 3) & 7, alg: b[24] & 7, ops };
}

// Two voices are the same sound when their registers match, the carriers' levels taken
// relative to the loudest one (a VGM writes a carrier's TL again for every volume).
export function normalizeLevel(v) {
  const out = cloneVoice(v);
  const car = CARRIERS[out.alg];
  const min = Math.min(...car.map((k) => out.ops[k].TL));
  for (const k of car) out.ops[k].TL -= min;
  return out;
}
export const voiceKey = (v) => Array.from(encodeVoice(normalizeLevel(v))).join(',');

// A name as the file keeps it: up to six printable ASCII characters.
export const cleanName = (s) => String(s ?? '').replace(/[^\x20-\x7e]/g, '').slice(0, 6);

const isEmpty = (bytes, at) => { for (let i = 1; i < 26; i++) if (bytes[at + i]) return false; return true; };

// The voices in a voice file: [{ n, voice, name }] for the records that are not empty.
export function readDat(bytes) {
  const out = [];
  for (let n = 1; n < 256 && n * 32 + 32 <= bytes.length; n++) {
    const at = n * 32;
    if (isEmpty(bytes, at)) continue;
    const name = String.fromCharCode(...bytes.slice(at + 26, at + 32)).replace(/[\0\xff]/g, ' ').trimEnd();
    out.push({ n, voice: decodeVoice(bytes.slice(at + 1, at + 26)), name: cleanName(name) });
  }
  return out;
}

// A copy of the file with @n set (voice null: emptied). The header and each record's
// first byte stay as they were; a short file grows to the full 8192 bytes when needed.
export function writeDat(bytes, n, voice, name) {
  const size = Math.max(bytes?.length || 0, n * 32 + 32 > (bytes?.length || 0) ? DAT_SIZE : 0);
  const out = new Uint8Array(size);
  if (bytes) out.set(bytes.slice(0, size));
  const at = n * 32;
  if (voice) {
    out.set(encodeVoice(voice), at + 1);
    const nm = cleanName(name).padEnd(6, ' ');
    for (let i = 0; i < 6; i++) out[at + 26 + i] = nm.charCodeAt(i);
  } else out.fill(0, at + 1, at + 32);
  return out;
}

export function newDat() { return new Uint8Array(DAT_SIZE); }

// ---------- voices written in a MUC ----------
// "  @n" then FB,ALG and four operator rows (the usual form), or "  @%n" and the 25 register
// values in six rows of four and FB/ALG (the compiler's other form). The @M (OPM) form is
// not read. [{ n, voice, row, endRow, form: 'plain' | '%' }], rows 1-based.
export function mucVoices(text) {
  const lines = text.split('\n');
  const nums = (s) => (s || '').split(';')[0].split(',').map((x) => x.trim()).filter((x) => x !== '').map(Number);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^ .@(%?)(\d+)[ \t]*(?:;.*)?$/.exec(lines[i]);
    if (!m) continue;
    const n = +m[2];
    if (m[1] === '%') {
      const vals = [];
      for (let r = 1; r <= 6; r++) vals.push(...nums(lines[i + r]));
      const fbalg = nums(lines[i + 7]);
      if (vals.length !== 24 || fbalg.length < 1 || !vals.every(Number.isFinite)) continue;
      out.push({ n, voice: decodeVoice(Uint8Array.from([...vals, fbalg[0]])), row: i + 1, endRow: i + 8, form: '%' });
      continue;
    }
    const fa = nums(lines[i + 1]);
    const ops = [2, 3, 4, 5].map((r) => nums(lines[i + r]));
    if (fa.length !== 2 || ops.some((o) => o.length !== 9) || ![...fa, ...ops.flat()].every(Number.isFinite)) continue;
    out.push({ n, voice: { fb: fa[0], alg: fa[1], ops: ops.map((o) => Object.fromEntries(FIELDS.map((f, k) => [f, o[k]]))) }, row: i + 1, endRow: i + 6, form: 'plain' });
  }
  return out;
}

// An inline definition (the usual form), as lines.
export function voiceLines(n, v, name) {
  const head = `  @${n}` + (name ? `   ; ${cleanName(name)}` : '');
  return [head, `   ${v.fb},${v.alg}`, ...v.ops.map((o) => '   ' + FIELDS.map((f) => o[f]).join(','))];
}

// ---------- importing ----------
// MUB / MUC8: the voices the song uses, 25 bytes each after a count; where they are is in
// bytes 1-2 of the music data. (Their @ numbers are not kept.)
function mubVoices(bytes) {
  const le32 = (at) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24);
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  if (magic !== 'MUC8' && magic !== 'MUB8') return null;
  const data = le32(4);
  const oto = data + (bytes[data + 1] | (bytes[data + 2] << 8));
  const count = bytes[oto];
  const out = [];
  for (let k = 0; k < count && oto + 1 + k * 25 + 25 <= bytes.length; k++) out.push(decodeVoice(bytes.slice(oto + 1 + k * 25, oto + 26 + k * 25)));
  return out;
}

// VGM / VGZ: the voice each channel has at every key on, for the OPN family (YM2203, YM2608,
// YM2610, YM2612) and the OPM (YM2151, converted: DT2 and the LFO settings are dropped).
// Returns [{ voice, count, chip }], most used first.
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
// command -> [chip family, chip id, port]
const VGM_CHIPS = {
  0x55: ['opn', 'YM2203', 0], 0xa5: ['opn', 'YM2203#2', 0],
  0x56: ['opn', 'YM2608', 0], 0x57: ['opn', 'YM2608', 1], 0xa6: ['opn', 'YM2608#2', 0], 0xa7: ['opn', 'YM2608#2', 1],
  0x58: ['opn', 'YM2610', 0], 0x59: ['opn', 'YM2610', 1], 0xa8: ['opn', 'YM2610#2', 0], 0xa9: ['opn', 'YM2610#2', 1],
  0x52: ['opn', 'YM2612', 0], 0x53: ['opn', 'YM2612', 1], 0xa2: ['opn', 'YM2612#2', 0], 0xa3: ['opn', 'YM2612#2', 1],
  0x54: ['opm', 'YM2151', 0], 0xa4: ['opm', 'YM2151#2', 0],
};

function vgmVoices(bytes) {
  if (String.fromCharCode(...bytes.slice(0, 4)) !== 'Vgm ') return null;
  const le32 = (at) => (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
  const version = le32(8);
  let p = version >= 0x150 && le32(0x34) ? 0x34 + le32(0x34) : 0x40;
  const regs = new Map();   // chip -> [port0 Uint8Array(256), port1]
  const found = new Map();  // key -> { voice, count, chip }
  const take = (chip, voice) => {
    const v = normalizeLevel(voice);
    const key = voiceKey(v);
    const f = found.get(key);
    if (f) f.count++;
    else found.set(key, { voice: v, count: 1, chip });
  };
  while (p < bytes.length) {
    const c = bytes[p];
    if (c === 0x66) break;
    if (c === 0x67) { p += 7 + (le32(p + 3) & 0x7fffffff); continue; }
    const chip = VGM_CHIPS[c];
    if (chip) {
      const [family, id, port] = chip;
      const a = bytes[p + 1], d = bytes[p + 2];
      if (!regs.has(id)) regs.set(id, [new Uint8Array(256), new Uint8Array(256)]);
      const r = regs.get(id);
      r[port][a] = d;
      if (family === 'opn' && port === 0 && a === 0x28 && (d & 0xf0)) {
        // key on: channel 0-2 on port 0, 4-6 on port 1
        const ch = d & 3, bank = r[(d & 4) ? 1 : 0];
        if (ch < 3) {
          const b = new Uint8Array(25);
          [0x30, 0x40, 0x50, 0x60, 0x70, 0x80].forEach((base, k) => { for (let s = 0; s < 4; s++) b[k * 4 + s] = bank[base + ch + s * 4]; });
          b[24] = bank[0xb0 + ch];
          take(id, decodeVoice(b));
        }
      } else if (family === 'opm' && a === 0x08 && (d & 0x78)) {
        const ch = d & 7, R = r[0];
        // OPM slots M1 M2 C1 C2 are 8 registers apart: the same order as OPN's OP1 OP3 OP2 OP4.
        const b = new Uint8Array(25);
        for (let s = 0; s < 4; s++) {
          const at = ch + s * 8;
          b[s] = R[0x40 + at] & 0x7f;
          b[4 + s] = R[0x60 + at];
          b[8 + s] = R[0x80 + at];
          b[12 + s] = R[0xa0 + at] & 0x1f;
          b[16 + s] = R[0xc0 + at] & 0x1f;
          b[20 + s] = R[0xe0 + at];
        }
        b[24] = R[0x20 + ch] & 0x3f;
        take(id, decodeVoice(b));
      }
      p += 3;
      continue;
    }
    const n = VGM_LEN[c];
    if (n < 0) { p++; continue; }
    p += 1 + n;
  }
  return [...found.values()].sort((a, b) => b.count - a.count);
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Voices found in a file: { voices: [{ voice, name, n? }], kind, note? }. kind: 'dat',
// 'muc', 'mub', 'vgm' or null (not a file voices can be taken from).
export async function importVoices(fileName, bytes, decodeText = (b) => new TextDecoder('shift_jis').decode(b)) {
  const ext = fileName.toLowerCase().split('.').pop();
  const stem = fileName.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toLowerCase() || 'imp';
  const label = (k) => `${stem}${String(k).padStart(3, '0')}`.slice(0, 6);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  if (magic === 'Vgm ') {
    const list = vgmVoices(bytes) || [];
    return { kind: 'vgm', voices: list.map((f, k) => ({ voice: f.voice, name: label(k + 1), count: f.count, chip: f.chip })) };
  }
  if (magic === 'MUC8' || magic === 'MUB8') {
    return { kind: 'mub', voices: (mubVoices(bytes) || []).map((v, k) => ({ voice: v, name: label(k + 1) })) };
  }
  if (magic === 'mupb' || magic === 'msPb') return { kind: 'mub', voices: [], note: 'extended' };
  if (ext === 'dat' || (bytes.length % 32 === 0 && bytes.length >= 64 && bytes.length <= DAT_SIZE && ext !== 'muc')) {
    return { kind: 'dat', voices: readDat(bytes).map((e) => ({ voice: e.voice, name: e.name || label(e.n), n: e.n })) };
  }
  if (ext === 'muc' || ext === 'txt') {
    return { kind: 'muc', voices: mucVoices(decodeText(bytes)).map((e) => ({ voice: e.voice, name: label(e.n), n: e.n })) };
  }
  return { kind: null, voices: [] };
}
