// FM voice preview: with the caret on an inline FM voice definition the editor shows the
// algorithm, an approximate output wave and the operators' envelopes.
//   "  @n"            two spaces, @ and the number (as mucomDotNET's FVTEXT reads it)
//   "   FB,ALG"
//   4 lines           OP1..OP4: AR,D1R,D2R,RR,D1L,TL,KS,ML,DT
// or MUCOM88's 25-byte form, the register values as they are written to the chip:
//   "  @%n"
//   6 lines of 4      DT/ML, TL, KS/AR, AM/D1R, D2R, D1L/RR, each in slot order
//                     (OP1, OP3, OP2, OP4); decimal or $hex
//   1 line            FB/ALG
// The drawings are a guide, not an emulation: the wave is computed the OPN way (phase
// modulation, TL in 0.75 dB steps, ML multiples, OP1 feedback) at full envelope level,
// ignoring DT and KS; envelope times follow the OPN rate table roughly.

const HEAD = /^ .@(\d+)[ \t]*(?:;.*)?$/;
const HEAD25 = /^ .@%(\d+)[ \t]*(?:;.*)?$/;
export const FIELDS = ['AR', 'D1R', 'D2R', 'RR', 'D1L', 'TL', 'KS', 'ML', 'DT'];
export const LIMITS = [31, 31, 31, 15, 15, 127, 3, 15, 7];
export const OP_COLORS = ['#d1495b', '#e09f3e', '#2a9d8f', '#577fd8'];

// Which operators each algorithm sends to which, and which are heard (carriers).
export const ALGS = [
  { edges: [[0, 1], [1, 2], [2, 3]], out: [3], pos: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  { edges: [[0, 2], [1, 2], [2, 3]], out: [3], pos: [[0, 0], [0, 2], [1, 1], [2, 1]] },
  { edges: [[0, 3], [1, 2], [2, 3]], out: [3], pos: [[1, 0], [0, 2], [1, 2], [2, 1]] },
  { edges: [[0, 1], [1, 3], [2, 3]], out: [3], pos: [[0, 0], [1, 0], [1, 2], [2, 1]] },
  { edges: [[0, 1], [2, 3]], out: [1, 3], pos: [[0, 0], [1, 0], [0, 2], [1, 2]] },
  { edges: [[0, 1], [0, 2], [0, 3]], out: [1, 2, 3], pos: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  { edges: [[0, 1]], out: [1, 2, 3], pos: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  { edges: [], out: [0, 1, 2, 3], pos: [[0, 0], [0, 1], [0, 2], [0, 3]] },
];

const nums = (s) => s.split(';')[0].split(',').map((x) => x.trim()).filter((x) => x !== '').map((x) => (/^-?\d+$/.test(x) ? Number(x) : NaN));

// The voice the 1-based row belongs to, or null:
// { id, fb, alg, ops: [{AR,…,DT}], row, endRow, col, focus (0-3 an operator, -1 the
//   header or FB/ALG line), problems: [{ op (-1 = FB/ALG), field, value?, count? }] }
export function voiceAt(lines, row) {
  for (let head = row; head >= Math.max(1, row - 7); head--) {
    const h25 = HEAD25.exec(lines[head - 1] || '');
    if (h25) return row > head + 7 ? null : voice25(lines, row, head, Number(h25[1]));
    if (row > head + 5) continue;
    const h = HEAD.exec(lines[head - 1] || '');
    if (!h) continue;
    if (row > head + 5) return null;
    const problems = [];
    const fa = nums(lines[head] || '');
    if (fa.length !== 2) problems.push({ op: -1, count: fa.length, need: 2 });
    const fb = fa[0], alg = fa[1];
    if (!(fb >= 0 && fb <= 7)) problems.push({ op: -1, field: 'FB', value: fb });
    if (!(alg >= 0 && alg <= 7)) problems.push({ op: -1, field: 'ALG', value: alg });
    const ops = [];
    for (let k = 0; k < 4; k++) {
      const v = nums(lines[head + 1 + k] || '');
      if (v.length !== 9) problems.push({ op: k, count: v.length, need: 9 });
      const op = {};
      FIELDS.forEach((f, i) => {
        op[f] = v[i];
        if (i < v.length && !(v[i] >= 0 && v[i] <= LIMITS[i])) problems.push({ op: k, field: f, value: v[i], max: LIMITS[i] });
      });
      ops.push(op);
    }
    return { id: Number(h[1]), fb, alg, ops, row: head, endRow: head + 5, col: lines[head - 1].indexOf('@'),
      focus: row - head >= 2 ? row - head - 2 : -1, problems };
  }
  return null;
}

const ok = (v, max) => Number.isFinite(v) && v >= 0 && v <= max;
const val = (v, max, dflt) => (ok(v, max) ? v : dflt);

// One cycle-accurate-enough pass of the OPN operator network, two periods long.
export function computeWave(voice, n = 1024) {
  const alg = ALGS[val(voice.alg, 7, 0)];
  const fb = val(voice.fb, 7, 0);
  const mul = voice.ops.map((o) => (val(o.ML, 15, 1) === 0 ? 0.5 : val(o.ML, 15, 1)));
  const amp = voice.ops.map((o) => 10 ** (-val(o.TL, 127, 127) * 0.75 / 20));
  const into = [[], [], [], []];
  for (const [a, b] of alg.edges) into[b].push(a);
  const out = new Float64Array(n);
  let p1 = 0, p2 = 0;          // OP1's last two outputs, for feedback
  const pre = n;               // run once before recording so the feedback settles
  for (let s = -pre; s < n; s++) {
    const t = (s / n) * 2;     // two periods of the base frequency
    const o = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) {
      let mod = 0;
      if (k === 0 && fb) mod = 2 * Math.PI * (p1 + p2) * 2 ** (fb - 7);
      for (const m of into[k]) mod += 8 * Math.PI * o[m];
      o[k] = amp[k] * Math.sin(2 * Math.PI * mul[k] * t + mod);
    }
    p2 = p1; p1 = o[0];
    if (s >= 0) out[s] = alg.out.reduce((sum, k) => sum + o[k], 0);
  }
  // The carriers add up without clipping on the chip; scale the shape to fit.
  const peak = Math.max(1e-9, ...out.map(Math.abs));
  return out.map((v) => v / peak);
}

// Attenuation (dB, 0 = loudest) of one operator over time; key-off at `off` seconds.
// OPN: a 96 dB slope takes about 39.6 s at rate 4 and halves every 4 rate steps; rates
// are 2*AR, 2*D1R, 2*D2R, 4*RR+2, plus `rks` (the key scaling of the note) when not 0.
// The attack is curved like the chip's.
export function envelope(op, t, off, rks = 0) {
  const t96 = (rate) => (rate <= 0 ? Infinity : 39.6 * 2 ** (-(Math.min(rate + rks, 63) - 4) / 4));
  const ar = val(op.AR, 31, 0), d1r = val(op.D1R, 31, 0), d2r = val(op.D2R, 31, 0);
  const rr = val(op.RR, 15, 15), sl = val(op.D1L, 15, 0) === 15 ? 96 : val(op.D1L, 15, 0) * 3;
  const tl = val(op.TL, 127, 127) * 0.75;
  const level = (time) => {
    if (ar === 0) return 96;
    const ta = ar >= 31 ? 0 : t96(2 * ar) / 4.5;
    if (time < ta) return 96 * (1 - time / ta) ** 3;
    const t1 = time - ta;
    const td = t96(2 * d1r) * sl / 96;
    if (t1 < td) return (t1 / td) * sl;
    return Math.min(96, sl + ((t1 - td) / t96(2 * d2r)) * 96);
  };
  let db;
  if (t <= off) db = level(t);
  else { const at = level(off); db = Math.min(96, at + ((t - off) / t96(4 * rr + 2)) * 96); }
  return Math.min(96, db + tl);
}

export function drawVoice(canvas, voice, colors) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  g.font = '11px ui-monospace, Menlo, Consolas, monospace';
  g.textBaseline = 'middle';
  const algIndex = val(voice.alg, 7, 0);
  const alg = ALGS[algIndex];
  const focus = voice.focus;

  // ---- algorithm diagram (left)
  const dx = 150, dy = 112;
  const cols = Math.max(...alg.pos.map((p) => p[0])) + 1;
  const cell = Math.min(34, (dx - 34) / cols);
  const node = (k) => {
    const [c, r] = alg.pos[k];
    const rows = Math.max(...alg.pos.map((p) => p[1])) + 1;
    return { x: 12 + c * cell + cell / 2 + (dx - 34 - cols * cell) / 2, y: 10 + (r + 0.5) * ((dy - 14) / rows) };
  };
  const box = 22;
  g.lineWidth = 1.5;
  g.strokeStyle = colors.muted;
  for (const [a, b] of alg.edges) {
    const A = node(a), B = node(b);
    g.beginPath(); g.moveTo(A.x + box / 2, A.y); g.lineTo(B.x - box / 2, B.y); g.stroke();
  }
  const outX = dx - 10;
  for (const k of alg.out) {
    const A = node(k);
    g.beginPath(); g.moveTo(A.x + box / 2, A.y); g.lineTo(outX, A.y); g.stroke();
  }
  g.beginPath(); g.moveTo(outX, Math.min(...alg.out.map((k) => node(k).y))); g.lineTo(outX, Math.max(...alg.out.map((k) => node(k).y))); g.stroke();
  // feedback loop on OP1
  if (val(voice.fb, 7, 0) > 0) {
    const A = node(0);
    g.strokeStyle = OP_COLORS[0];
    g.beginPath();
    g.moveTo(A.x + box / 2, A.y - 4); g.lineTo(A.x + box / 2 + 5, A.y - 4); g.lineTo(A.x + box / 2 + 5, A.y - box / 2 - 6);
    g.lineTo(A.x - box / 2 - 5, A.y - box / 2 - 6); g.lineTo(A.x - box / 2 - 5, A.y - 4); g.lineTo(A.x - box / 2, A.y - 4);
    g.stroke();
  }
  for (let k = 0; k < 4; k++) {
    const A = node(k);
    const carrier = alg.out.includes(k);
    g.fillStyle = carrier ? OP_COLORS[k] : colors.panel;
    g.strokeStyle = OP_COLORS[k];
    g.lineWidth = k === focus ? 3 : 1.5;
    g.beginPath(); g.roundRect(A.x - box / 2, A.y - box / 2, box, box, 4); g.fill(); g.stroke();
    g.fillStyle = carrier ? '#fff' : OP_COLORS[k];
    g.textAlign = 'center';
    g.fillText(String(k + 1), A.x, A.y + 0.5);
  }
  g.textAlign = 'left';
  g.fillStyle = colors.muted;
  g.fillText(`ALG ${Number.isFinite(voice.alg) ? voice.alg : '?'}  FB ${Number.isFinite(voice.fb) ? voice.fb : '?'}`, 6, dy + 2);

  // ---- output wave (right)
  const wx = dx + 8, ww = W - wx - 4, wy = 6, wh = dy - 6;
  g.fillStyle = colors.bg;
  g.fillRect(wx, wy, ww, wh);
  const mid = wy + wh / 2;
  g.strokeStyle = colors.grid; g.lineWidth = 1;
  g.beginPath(); g.moveTo(wx, Math.round(mid) + .5); g.lineTo(wx + ww, Math.round(mid) + .5); g.stroke();
  g.beginPath(); g.moveTo(wx + ww / 2 + .5, wy); g.lineTo(wx + ww / 2 + .5, wy + wh); g.stroke();
  const wave = computeWave(voice);
  g.strokeStyle = colors.line; g.lineWidth = 1.6;
  g.beginPath();
  wave.forEach((v, i) => { const x = wx + (i / (wave.length - 1)) * ww, y = mid - v * (wh / 2 - 3); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  g.stroke();

  // ---- envelopes (bottom): attenuation incl. TL, key on for 1 s, then key off
  const ex = 30, ey = dy + 16, ew = W - ex - 6, eh = H - ey - 22;
  const span = 1.5, off = 1.0;
  g.fillStyle = colors.bg;
  g.fillRect(ex, ey, ew, eh);
  g.strokeStyle = colors.grid; g.lineWidth = 1;
  g.fillStyle = colors.muted;
  g.textAlign = 'right';
  for (const db of [0, 24, 48, 72, 96]) {
    const y = ey + (db / 96) * eh;
    g.beginPath(); g.moveTo(ex, Math.round(y) + .5); g.lineTo(ex + ew, Math.round(y) + .5); g.stroke();
    g.fillText(db ? `-${db}` : '0', ex - 3, y);
  }
  g.textAlign = 'left';
  const xOff = ex + (off / span) * ew;
  g.setLineDash([3, 3]);
  g.beginPath(); g.moveTo(xOff + .5, ey); g.lineTo(xOff + .5, ey + eh); g.stroke();
  g.setLineDash([]);
  g.fillText('key on', ex + 3, ey + eh + 12);
  g.fillText('key off', xOff + 3, ey + eh + 12);
  g.textAlign = 'right';
  g.fillText('dB', ex - 3, ey + eh + 12);
  g.fillText('1.5 s', ex + ew, ey + eh + 12);
  g.textAlign = 'left';
  const order = [0, 1, 2, 3].filter((k) => k !== focus).concat(focus >= 0 ? [focus] : []);
  for (const k of order) {
    const carrier = alg.out.includes(k);
    g.strokeStyle = OP_COLORS[k];
    g.lineWidth = k === focus ? 3 : 1.6;
    g.setLineDash(carrier ? [] : [4, 3]);
    g.beginPath();
    for (let i = 0; i <= 300; i++) {
      const tt = (i / 300) * span;
      const x = ex + (i / 300) * ew, y = ey + (envelope(voice.ops[k], tt, off) / 96) * eh;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  g.setLineDash([]);
}

// Numbers of a 25-byte line: decimal or $hex.
const nums25 = (s) => s.split(';')[0].split(',').map((x) => x.trim()).filter((x) => x !== '')
  .map((x) => (/^\$[0-9a-f]+$/i.test(x) ? parseInt(x.slice(1), 16) : /^\d+$/.test(x) ? Number(x) : NaN));
const SLOT_OF_OP = [0, 2, 1, 3];   // OP1..OP4 in the chip's slot order (OP1, OP3, OP2, OP4)

// A voice in the 25-byte form, as voiceAt returns it (format: 25). The values are register
// bytes, so they are always in range; only the count of each line is checked.
function voice25(lines, row, head, id) {
  const problems = [];
  const reg = [];
  for (let r = 0; r < 6; r++) {
    const v = nums25(lines[head + r] || '');
    if (v.length !== 4 || v.some((x) => !(x >= 0 && x <= 255))) problems.push({ op: -1, count: v.length, need: 4 });
    reg.push(v);
  }
  const fa = nums25(lines[head + 6] || '');
  if (fa.length !== 1) problems.push({ op: -1, count: fa.length, need: 1 });
  const fbAlg = fa[0] & 63;
  const ops = [0, 1, 2, 3].map((k) => {
    const at = (r) => (reg[r][SLOT_OF_OP[k]] ?? 0) & 255;
    return {
      AR: at(2) & 31, D1R: at(3) & 31, D2R: at(4) & 31, RR: at(5) & 15, D1L: at(5) >> 4,
      TL: at(1) & 127, KS: at(2) >> 6, ML: at(0) & 15, DT: (at(0) >> 4) & 7,
    };
  });
  return { id, fb: fbAlg >> 3, alg: fbAlg & 7, ops, row: head, endRow: head + 7, col: lines[head - 1].indexOf('@'),
    focus: -1, problems, format: 25 };
}
