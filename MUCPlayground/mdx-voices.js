// Sounds for the MDX converter (mdx-to-muc.js): YM2151 voices as OPNA voices, and, for the
// two FM tracks an OPNA has no channel for, as an SCC wave with a software envelope.
//
// A YM2151 voice and an OPNA voice are the same four operators and eight algorithms. What the
// OPNA lacks is DT2 (the coarse detune that makes an operator inharmonic), the noise on the
// eighth channel and most of the LFO: those are left out. The YM2151 of the X68000 runs at
// 4 MHz, so its envelopes are about an eighth faster than the same numbers give on an OPNA;
// that is left as it is.

// MXDRV's volume 0-15 as the level taken off the carriers (0.75 dB steps). MUCOM88's FM volume
// with #CarrierCorrection uses the same sixteen numbers, so v carries over as it is.
export const VOLUME_TL = [42, 40, 37, 34, 32, 29, 26, 24, 21, 18, 16, 13, 10, 8, 5, 2];
// The volume whose level is nearest to an attenuation given outright (@v: 127 - n).
export const volumeOf = (att) => VOLUME_TL.reduce((best, tl, v) => (Math.abs(tl - att) < Math.abs(VOLUME_TL[best] - att) ? v : best), 0);

// The operators of a voice in the order of the algorithm (1 to 4, the last one always a
// carrier), which is MUCOM88's order; the file has them as the chip's registers do: M1, M2, C1, C2.
const CHAIN = [0, 2, 1, 3];
const CARRIERS = [[3], [3], [3], [3], [1, 3], [1, 2, 3], [1, 2, 3], [0, 1, 2, 3]];

// A YM2151 voice as an OPNA voice: { fb, alg, ops: 4 x [AR, DR, SR, RR, SL, TL, KS, ML, DT] }.
export function opmToOpna(v) {
  return {
    fb: v.fl, alg: v.con,
    ops: CHAIN.map((k) => { const o = v.ops[k]; return [o.ar, o.d1r, o.d2r, o.rr, o.d1l, o.tl, o.ks, o.mul, o.dt1]; }),
  };
}
export const usesDt2 = (v) => v.ops.some((o) => o.dt2 && o.tl < 100);

// ---- the voice as a wave ----------------------------------------------------------------------

const N = 1024;
// One period of the steady tone: sine operators, phase modulation of 4 pi at full level, the
// feedback of the first operator pi / 16 ... 4 pi on the mean of its last two samples.
// decayed: the modulators after their first decay (for how much the tone moves in a note).
function period(v, decayed) {
  const ops = CHAIN.map((k) => v.ops[k]), carriers = CARRIERS[v.con];
  const half = ops.some((o) => o.mul === 0);              // a multiple of 1/2: two periods of the note
  const mul = ops.map((o) => (o.mul || 0.5) * (half ? 2 : 1));
  const amp = ops.map((o, k) => 10 ** (-(o.tl * 0.75 + (decayed && !carriers.includes(k) && o.d1r ? Math.min(o.d1l * 3, 24) : 0)) / 20));
  const fb = v.fl ? Math.PI * 2 ** (v.fl - 5) : 0, I = 4 * Math.PI, w = (2 * Math.PI) / N;
  const out = new Float64Array(N);
  let p1 = 0, p2 = 0;
  for (let n = 0; n < 3 * N; n++) {
    const ph = n * w, s = (k, mod = 0) => amp[k] * Math.sin(ph * mul[k] + I * mod);
    const o1 = amp[0] * Math.sin(ph * mul[0] + fb * (p1 + p2) / 2);
    p2 = p1; p1 = o1;
    if (n < 2 * N) continue;
    let y;
    switch (v.con) {
      case 0: y = s(3, s(2, s(1, o1))); break;
      case 1: y = s(3, s(2, o1 + s(1))); break;
      case 2: y = s(3, o1 + s(2, s(1))); break;
      case 3: y = s(3, s(1, o1) + s(2)); break;
      case 4: y = s(1, o1) + s(3, s(2)); break;
      case 5: y = s(1, o1) + s(2, o1) + s(3, o1); break;
      case 6: y = s(1, o1) + s(2) + s(3); break;
      default: y = o1 + s(1) + s(2) + s(3);
    }
    out[n - 2 * N] = y;
  }
  return { out, half };
}
// The harmonics 1 to count of a period: [[cos, sin], ...] and the power of each.
function harmonics(x, count) {
  const h = [];
  for (let k = 1; k <= count; k++) {
    let c = 0, s = 0;
    for (let n = 0; n < x.length; n++) { const a = (2 * Math.PI * k * n) / x.length; c += x[n] * Math.cos(a); s += x[n] * Math.sin(a); }
    h.push([(2 * c) / x.length, (2 * s) / x.length]);
  }
  return h;
}

// The voice as a 32-sample SCC wave: { wave (32 x -128..127), down (octaves the part plays
// lower: 1 when an operator runs at half the note, the wave then holding two periods of the
// note), level (dB of the voice's own peak against full scale), kept (the share of the tone's
// power 32 samples hold: harmonics 1 to 15), moves (how far the tone changes while the
// modulators decay, 0-1), dt2 (the voice is inharmonic) }. With down, flat: { wave, kept } is
// the wave of one period at the note itself, without what sounds below it: for notes that an
// octave down would be under the SCC's lowest.
export function sccWave(v) {
  const a = period(v, false), b = period(v, true);
  const all = harmonics(a.out, 96), late = harmonics(b.out, 96);
  const pow = (h) => h.map(([c, s]) => c * c + s * s);
  const pa = pow(all), pb = pow(late), sum = (x) => x.reduce((t, y) => t + y, 0);
  const dot = pa.reduce((t, x, i) => t + Math.sqrt(x * pb[i]), 0);
  const moves = 1 - dot / Math.max(1e-12, Math.sqrt(sum(pa) * sum(pb)));
  const shape = (h) => {                                   // 32 samples of the harmonics h[0..14]
    const y = new Float64Array(32);
    let peak = 0;
    for (let n = 0; n < 32; n++) {
      let t = 0;
      for (let k = 1; k <= 15; k++) { const ang = (2 * Math.PI * k * n) / 32; t += h[k - 1][0] * Math.cos(ang) + h[k - 1][1] * Math.sin(ang); }
      y[n] = t; peak = Math.max(peak, Math.abs(t));
    }
    return Array.from(y, (t) => Math.max(-128, Math.min(127, Math.round((t / Math.max(1e-9, peak)) * 127))));
  };
  let full = 0;
  for (const x of a.out) full = Math.max(full, Math.abs(x));
  const out = { wave: shape(all), down: a.half ? 1 : 0, level: 20 * Math.log10(Math.max(1e-6, full)), kept: sum(pa.slice(0, 15)) / Math.max(1e-12, sum(pa)), moves, dt2: usesDt2(v) };
  if (a.half) {
    const even = all.filter((_, i) => i % 2 === 1);       // the note's own harmonics
    out.flat = { wave: shape(even), kept: sum(pow(even).slice(0, 15)) / Math.max(1e-12, sum(pa)) };
  }
  return out;
}

// ---- the carrier's envelope as levels ---------------------------------------------------------

// dB a second the YM2151 (4 MHz) falls at a rate 0-31 with key scaling 0-3, around the middle
// of the keyboard: the envelope moves every third sample (62.5 kHz), by 1/1024 of 96 dB, on
// 4 to 7 of 8 turns every 2^(11 - r/4) turns below rate 48 and by 1, 2, 4 or 8 above.
function fall(rate, ks) {
  if (!rate) return 0;
  const r = Math.min(63, 2 * rate + [2, 4, 8, 16][ks]);
  const turn = 62500 / 3, part = (4 + (r & 3)) / 8;
  const steps = r < 48 ? (turn * part) / 2 ** (11 - (r >> 2)) : turn * part * 2 * 2 ** ((r >> 2) - 12);
  return steps * (96 / 1024);
}
// The level (0-15, linear, 15 the peak) of the voice's loudest carrier frame by frame while
// the key is held, and what it loses a frame once the key is off (of 255).
export function carrierLevels(v, frames = 150) {
  const ops = CHAIN.map((k) => v.ops[k]);
  const c = CARRIERS[v.con].map((k) => ops[k]).sort((x, y) => x.tl - y.tl)[0];
  const up = fall(c.ar, c.ks) * 13.8, d1 = fall(c.d1r, c.ks), d2 = fall(c.d2r, c.ks), floor = c.d1l === 15 ? 93 : c.d1l * 3;
  const out = [];
  // the attack: from 48 dB down, each step a share of what is left (fast first), in the time
  // a fall of 48 dB at that rate would take
  let att = c.ar >= 30 || !up ? 0 : 48;
  let phase = att > 0 ? 0 : 1;
  const share = up ? 0.5 ** ((up / 60) / (48 / 9)) : 0;
  for (let f = 0; f < frames; f++) {
    out.push(15 * 10 ** (-att / 20));
    if (phase === 0) { att *= share; if (att <= 0.1) { att = 0; phase = 1; } }
    else if (phase === 1) { att += d1 / 60; if (att >= floor || !d1) { att = Math.min(att, floor); phase = 2; } }
    else att = Math.min(96, att + d2 / 60);
  }
  const off = fall(c.rr * 2 + 1, c.ks);                   // RR is half as fine as the other rates
  return { levels: out, release: off ? Math.min(255, (255 * off) / 60 / 30) : 255 };
}

// ---- the voice on the OPLL ----------------------------------------------------------------------

// A YM2413 has two operators a voice, and one voice of its own (eight register bytes) for
// all its channels. The patch nearest to a YM2151 voice is looked for by the tone: of the
// modulator's multiple, level, feedback and the two wave forms, the setting whose steady
// spectrum is nearest to the voice's (the cosine of the two, harmonics 1 to 40). Multiples
// are tried from the voice's own operators. The envelopes come from the loudest carrier and
// from the operator that modulates it.
const OPLL_MULT = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15];
const HARMONICS = 32, M = 128;
const COS = new Float64Array(HARMONICS * M), SIN = new Float64Array(HARMONICS * M);
for (let k = 0; k < HARMONICS; k++) for (let n = 0; n < M; n++) { COS[k * M + n] = Math.cos((2 * Math.PI * (k + 1) * n) / M); SIN[k * M + n] = Math.sin((2 * Math.PI * (k + 1) * n) / M); }
// the levels of harmonics 1 to HARMONICS of M samples, as a vector of length 1
function spectrum(x) {
  const a = new Float64Array(HARMONICS);
  let total = 0;
  for (let k = 0; k < HARMONICS; k++) {
    let c = 0, s = 0;
    for (let n = 0, at = k * M; n < M; n++, at++) { c += x[n] * COS[at]; s += x[n] * SIN[at]; }
    a[k] = Math.hypot(c, s); total += a[k] * a[k];
  }
  total = Math.sqrt(total) || 1;
  for (let k = 0; k < HARMONICS; k++) a[k] /= total;
  return a;
}
// the steady spectrum of modulator -> carrier (multiples in periods of the window)
const scratch = new Float64Array(M);
function twoOps(mm, mc, tl, fb, dm, dc) {
  const amp = 10 ** (-(tl * 0.75) / 20), beta = fb ? Math.PI * 2 ** (fb - 5) : 0, w = (2 * Math.PI) / M;
  let p1 = 0, p2 = 0;
  for (let n = fb ? 0 : 2 * M; n < 3 * M; n++) {
    let m = Math.sin(n * w * mm + beta * (p1 + p2) / 2);
    if (dm && m < 0) m = 0;
    m *= amp; p2 = p1; p1 = m;
    if (n < 2 * M) continue;
    const c = Math.sin(n * w * mc + 4 * Math.PI * m);
    scratch[n - 2 * M] = dc && c < 0 ? 0 : c;
  }
  return spectrum(scratch);
}
// a period of N samples as M (N is a multiple of M)
const thin = (x) => Float64Array.from({ length: M }, (_, i) => x[i * (x.length / M)]);
const fitted = new Map();
// The OPLL patch for a voice: { bytes (the eight registers), match (0-1: how near its tone
// is), level (dB of the voice's own peak, which the part's volume carries), moves, dt2 }.
export function opllPatch(v) {
  const key = JSON.stringify(v);
  if (fitted.has(key)) return fitted.get(key);
  const ops = CHAIN.map((k) => v.ops[k]), carriers = CARRIERS[v.con];
  const a = period(v, false), b = period(v, true), scale = a.half ? 2 : 1;
  const target = spectrum(thin(a.out)), late = spectrum(thin(b.out));
  let same = 0;
  for (let i = 0; i < HARMONICS; i++) same += target[i] * late[i];
  const moves = 1 - same;
  const nearest = (r) => OPLL_MULT.reduce((best, m, i) => (Math.abs(m - r) < Math.abs(OPLL_MULT[best] - r) ? i : best), 0);
  const mults = (list) => [...new Set(list.map((k) => nearest(ops[k].mul || 0.5)))];
  const cars = mults(carriers), mods = [...new Set([...mults([0, 1, 2, 3]), ...cars])];
  let best = { score: -1 };
  const tryOne = (mm, mc, tl, fb, dm, dc) => {
    const y = twoOps(OPLL_MULT[mm] * scale, OPLL_MULT[mc] * scale, tl, fb, dm, dc);
    let s = 0;
    for (let i = 0; i < HARMONICS; i++) s += y[i] * target[i];
    if (s > best.score) best = { score: s, mm, mc, tl, fb, dm, dc };
  };
  for (const mc of cars) for (const mm of mods) for (let tl = 0; tl < 64; tl += 3) for (const fb of [0, 2, 4, 5, 6, 7]) for (const dm of [0, 1]) for (const dc of [0, 1]) tryOne(mm, mc, tl, fb, dm, dc);
  const at = { ...best };
  for (let tl = Math.max(0, at.tl - 2); tl <= Math.min(63, at.tl + 2); tl++) for (let fb = Math.max(0, at.fb - 1); fb <= Math.min(7, at.fb + 1); fb++) tryOne(at.mm, at.mc, tl, fb, at.dm, at.dc);
  // envelopes: the loudest carrier's, and that of the operator before it in the algorithm
  const c = carriers.map((k) => k).sort((x, y) => ops[x].tl - ops[y].tl)[0];
  const before = v.con <= 3 ? 2 : v.con === 4 ? c - 1 : v.con === 5 ? 0 : v.con === 6 && c === 1 ? 0 : c;
  const clamp = (x) => Math.max(0, Math.min(15, Math.round(x)));
  const env = (o) => {
    const held = o.d2r === 0;
    return {
      first: (held ? 0x20 : 0) | (o.ks >= 2 ? 0x10 : 0),
      rates: (o.ar >= 30 ? 15 : clamp((o.ar - 4) / 2)) << 4 | clamp((o.d1r - 3) / 2),
      levels: o.d1l << 4 | (held ? clamp(o.rr - 1) : clamp((o.d2r - 3) / 2)),
    };
  };
  const em = env(ops[before]), ec = env(ops[c]);
  let full = 0;
  for (const x of a.out) full = Math.max(full, Math.abs(x));
  const out = {
    bytes: [em.first | best.mm, ec.first | best.mc, best.tl, best.dc << 4 | best.dm << 3 | best.fb, em.rates, ec.rates, em.levels, ec.levels],
    match: best.score, level: 20 * Math.log10(Math.max(1e-6, full)), moves, dt2: usesDt2(v),
  };
  fitted.set(key, out);
  return out;
}
