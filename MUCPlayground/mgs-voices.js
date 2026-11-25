// Sounds for the MGS converter (mgs-to-muc.js): MSX-MUSIC (OPLL) voices as OPNA voices, and
// MGSDRV's PSG / SCC envelopes as MUCOM88 software envelopes (E).
//
// Every rule below was fitted to the original chips' output: an OPLL patch played by MGSDRV
// against the OPNA voice played by the playground engine (spectrum, envelope slopes), and the
// PSG volume register frame by frame.

// The fifteen built-in YM2413 voices (the register bytes 0-7; from emu2413's table), in ROM
// order 1-15. MGSC's @0-@14 are ROM voices 1-15.
export const OPLL_ROM = [
  [0x71, 0x61, 0x1e, 0x17, 0xd0, 0x78, 0x00, 0x17],   // 1 violin
  [0x13, 0x41, 0x1a, 0x0d, 0xd8, 0xf7, 0x23, 0x13],   // 2 guitar
  [0x13, 0x01, 0x99, 0x00, 0xf2, 0xc4, 0x21, 0x23],   // 3 piano
  [0x11, 0x61, 0x0e, 0x07, 0x8d, 0x64, 0x70, 0x27],   // 4 flute
  [0x32, 0x21, 0x1e, 0x06, 0xe1, 0x76, 0x01, 0x28],   // 5 clarinet
  [0x31, 0x22, 0x16, 0x05, 0xe0, 0x71, 0x00, 0x18],   // 6 oboe
  [0x21, 0x61, 0x1d, 0x07, 0x82, 0x81, 0x11, 0x07],   // 7 trumpet
  [0x33, 0x21, 0x2d, 0x13, 0xb0, 0x70, 0x00, 0x07],   // 8 organ
  [0x61, 0x61, 0x1b, 0x06, 0x64, 0x65, 0x10, 0x17],   // 9 horn
  [0x41, 0x61, 0x0b, 0x18, 0x85, 0xf0, 0x81, 0x07],   // 10 synthesizer
  [0x33, 0x01, 0x83, 0x11, 0xea, 0xef, 0x10, 0x04],   // 11 harpsichord
  [0x17, 0xc1, 0x24, 0x07, 0xf8, 0xf8, 0x22, 0x12],   // 12 vibraphone
  [0x61, 0x50, 0x0c, 0x05, 0xd2, 0xf5, 0x40, 0x42],   // 13 synth bass
  [0x01, 0x01, 0x55, 0x03, 0xe9, 0x90, 0x03, 0x02],   // 14 acoustic bass
  [0x41, 0x41, 0x89, 0x03, 0xf1, 0xe4, 0xc0, 0x13],   // 15 electric guitar
];
export const OPLL_NAMES = ['violin', 'guitar', 'piano', 'flute', 'clarinet', 'oboe', 'trumpet', 'organ', 'horn', 'synthesizer',
  'harpsichord', 'vibraphone', 'synth bass', 'acoustic bass', 'electric guitar'];

// The carrier level that puts an OPNA FM part where MGSDRV's OPLL sits against the PSG
// (with the PSG one volume step down, see PSG_VOLUME_STEP in mgs-to-muc.js): 6 dB.
const CARRIER_TL = 8;
const KEY_SCALE = [0, 5, 9, 18];            // TL steps for KSL 1.5 / 3 / 6 dB per octave, as at o4 a
const MULTIPLE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15];
const OFF = [31, 0, 0, 15, 0, 127, 0, 1, 0];

// An OPLL patch (8 register bytes) as an OPNA voice: { fb, alg, ops: 4 x [AR,DR,SR,RR,SL,TL,KS,ML,DT] }.
// sustain: MGSDRV's so (the channel's SUS bit), which lengthens the release.
//   * the modulator level and the feedback carry over as they are (the spectra agree to 0.5 dB);
//   * rates: AR 2a+4, DR 2d+3, RR r+1 give the OPLL's slopes; a percussive tone (EG-TYP 0)
//     decays at its RR while the key is held and releases at rate 7, a sustained one holds;
//   * a half-sine carrier is the sine plus its octave 7.5 dB down, each with its own
//     modulator (the octave's twice as deep); a half-sine modulator is the modulator 4.5 dB
//     down plus its octave (algorithm 2 has two modulators on one carrier);
//   * key scale level (quieter towards high notes) has no place in an OPNA voice: what it
//     takes off around the middle of the keyboard (3.4, 6.75 or 13.5 dB at o4 a) is added to the level;
//   * tremolo and vibrato are left out.
// The song needs #CarrierCorrection Yes: without it MUCOM88 ignores the carriers' TL.
//
// levels: a software envelope MGSDRV runs on the voice (@e / @r on an FM track), as the volume
// 0-15 of each frame. An OPNA part has no such envelope, so it is built into the carrier: the
// envelope's steps are 3 dB each, the carrier's own decay is added, and the sum is fitted with
// the carrier's decay rate, sustain level and sustain rate; the envelope's peak sets the level.
export function opllToOpna(patch, sustain = false, levels = null) {
  const half = (b, rates, levels) => ({
    egt: (b >> 5) & 1, ksr: (b >> 4) & 1, ml: MULTIPLE[b & 15], ar: rates >> 4, dr: rates & 15, sl: levels >> 4, rr: levels & 15,
  });
  const mod = half(patch[0], patch[4], patch[6]), car = half(patch[1], patch[5], patch[7]);
  const tl = (patch[2] & 63) + KEY_SCALE[patch[2] >> 6], dc = (patch[3] >> 4) & 1, dm = (patch[3] >> 3) & 1, fb = patch[3] & 7;
  const out = CARRIER_TL + KEY_SCALE[patch[3] >> 6];           // the carrier's level
  const shaped = levels && shapeCarrier(car, levels);
  const op = (o, level, carrier, ml = o.ml) => {
    const ar = o.ar ? Math.min(31, o.ar * 2 + 4) : 0;
    let dr = o.dr ? Math.min(31, o.dr * 2 + 3) : 0, sl = o.sl;
    // the modulator is not released at key off; the carrier's release follows SUS
    let sr = o.egt || !o.rr ? 0 : Math.min(31, o.rr * 2 + 3);
    const rr = !carrier ? 0 : sustain ? 6 : o.egt ? Math.min(15, o.rr + 1) : 8;
    if (carrier && shaped) { dr = shaped.dr; sl = shaped.sl; sr = shaped.sr; level += shaped.tl; }
    return [ar, dr, sr, rr, sl, Math.min(127, Math.max(0, level)), o.ksr ? 2 : 0, ml, 0];
  };
  const twice = (ml) => (ml === 0 ? 1 : Math.min(15, ml * 2));
  const m = tl + (dm ? 6 : 0);
  if (dc) {
    return { fb, alg: 4, ops: [op(mod, m, false), op(car, out + 8, true), op(mod, m - 8, false), op(car, out + 18, true, twice(car.ml))] };
  }
  if (dm) return { fb, alg: 2, ops: [op(mod, m, false), OFF, op(mod, tl + 18, false, twice(mod.ml)), op(car, out, true)] };
  return { fb, alg: 2, ops: [op(mod, tl, false), OFF, OFF, op(car, out, true)] };
}

// The carrier's envelope with a software envelope laid over it (see opllToOpna).
// The OPLL's decay at rate r falls 11.5 * 2^(r - 3) dB a second, the OPNA's at rate x
// 11.9 * 2^((x - 9) / 2) (both measured).
function shapeCarrier(car, levels) {
  const frames = Math.min(levels.length, 90), peak = Math.max(...levels.slice(0, frames));
  const slope = (r) => (r ? 11.5 * 2 ** (r - 3) : 0), rate = (s) => (s < 0.7 ? 0 : Math.min(31, Math.max(1, Math.round(9 + 2 * Math.log2(s / 11.9)))));
  const d1 = slope(car.dr), d2 = car.egt ? 0 : slope(car.rr), hold = car.sl * 3;
  const own = (t) => (!d1 || t * d1 < hold ? t * d1 : hold + (t - hold / d1) * d2);
  const target = [];
  for (let i = 0; i < frames; i++) target.push(Math.min(60, own(i / 60) + (peak - levels[i]) * 3));
  const last = frames - 1, weight = (i) => (i < 20 ? 2 : 1);
  const error = (f) => { let e = 0; for (let i = 0; i < frames; i++) e += weight(i) * (f(i) - target[i]) ** 2; return e; };
  let best = { err: error(() => 0), s1: 0, lvl: 0, s2: 0 };
  for (let b = 1; b < last; b++) {
    const lvl = target[b], s1 = lvl / (b / 60), s2 = Math.max(0, (target[last] - lvl) / ((last - b) / 60));
    const err = error((i) => (i <= b ? (s1 * i) / 60 : lvl + (s2 * (i - b)) / 60));
    if (err < best.err) best = { err, s1, lvl, s2 };
  }
  const sl = Math.min(15, Math.max(0, Math.round(best.lvl / 3)));
  return { dr: sl ? rate(best.s1) : 0, sl, sr: rate(sl ? best.s2 : Math.max(best.s1, best.s2)), tl: (15 - peak) * 4 };
}

// An OPLL patch as the voice an MSX-MUSIC part (MSXA ...) needs to play it. Such a part plays
// the built-in instrument nearest to its voice, and MucoMSX compares, for algorithms 0-4, the
// third and fourth operators with the instruments' modulator and carrier (multiple, attack and
// decay / 2, sustain level, release, modulator level, feedback; a sustain rate of 0 counts as a
// held tone). The patch is written into exactly those places, so a built-in voice finds
// itself, and a song's own voice the built-in one MucoMSX holds nearest.
// For a built-in voice, pass its number (1-15): the table MucoMSX itself compares with is used
// (it differs from the chip's in a few rates), so that each one is found exactly.
const MUCOMSX_PRESETS = [
  [113, 97, 30, 23, 239, 127, 0, 23], [19, 65, 26, 13, 248, 247, 35, 19], [19, 1, 153, 0, 242, 196, 17, 35],
  [49, 97, 14, 7, 152, 100, 112, 39], [34, 33, 30, 6, 191, 118, 0, 40], [49, 34, 22, 5, 224, 113, 15, 24],
  [33, 97, 29, 7, 130, 143, 16, 7], [35, 33, 45, 20, 255, 127, 0, 7], [65, 97, 27, 6, 100, 101, 16, 23],
  [97, 97, 11, 24, 133, 255, 129, 7], [19, 1, 131, 17, 250, 228, 16, 4], [23, 129, 35, 7, 248, 248, 34, 18],
  [97, 80, 12, 5, 242, 245, 41, 66], [1, 1, 84, 3, 195, 146, 3, 2], [65, 65, 137, 3, 241, 229, 17, 19],
];
export function opllSelector(patch, rom = 0) {
  if (rom) patch = MUCOMSX_PRESETS[rom - 1];
  const op = (b, rates, levels, tl) => [(rates >> 4) * 2, (rates & 15) * 2, b & 0x20 ? 0 : 1, levels & 15, levels >> 4, tl, 0, b & 15, 0];
  return { fb: patch[3] & 7, alg: 2, ops: [OFF, OFF, op(patch[0], patch[4], patch[6], patch[2] & 63), op(patch[1], patch[5], patch[7], 0)] };
}

// MGS FM volume 0-15 (3 dB a step) as the nearest MUCOM88 FM volume (about 2 dB a step, 30 dB
// in all): 15, 13, 12 ... keep their level; below 5 the MUCOM88 scale ends.
export const FM_VOLUME = [0, 0, 0, 0, 0, 0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15];
// ... and as the volume of an MSX-MUSIC part, which MucoMSX turns into the OPLL's 3 dB steps
// (v15 is 0, v0 is 10 steps down: lower MGS volumes do not get quieter).
export const OPLL_VOLUME = [0, 0, 0, 0, 0, 1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 15];

// ---- PSG / SCC envelopes -----------------------------------------------------------------
const HORIZON = 150;        // frames (1/60 s) of an envelope that are fitted

// The levels (0-15) an @e envelope steps through, one per frame, and the tone / noise mode
// and noise period it starts with.
export function envelopeLevels(env, frames = HORIZON) {
  const out = [];
  let cur = 15, loop = -1, mode = env.mode, noise = env.noise, ended = false;
  for (const c of env.cmds) {
    if (out.length >= frames) break;
    if (c[0] === 'v') { cur = c[1]; out.push(cur); }
    else if (c[0] === 'v:') { cur = c[1]; for (let i = 0; i < Math.max(1, c[2]); i++) out.push(cur); }
    else if (c[0] === 'v=') {
      const n = Math.max(1, c[2]), from = out.length ? cur : c[1], d = c[1] - from;
      for (let i = 0; i < n; i++) out.push(from + Math.sign(d) * Math.floor((i * Math.abs(d)) / n));
      cur = c[1];
    } else if (c[0] === '[') loop = out.length;
    else if (c[0] === ']') { ended = true; break; }
    else if (c[0] === '/' && !out.length) mode = c[1] || mode;
    else if (c[0] === 'n' && !out.length) noise = c[1];
  }
  if (!out.length) out.push(15);
  if (ended && loop >= 0 && loop < out.length) { for (let i = loop; out.length < frames; i = i + 1 < out.length ? i + 1 : loop) out.push(out[i]); out.length = frames; }
  while (out.length < frames) out.push(out[out.length - 1]);          // the last level is held
  return { levels: out.slice(0, frames), mode, noise };
}

// The voice an @e envelope switches to for most of its first 40 frames (a "patch slide"), or
// null when it stays with the track's voice.
export function envelopeVoice(env) {
  const time = new Map();
  let cur = null, n = 0;
  for (const c of env.cmds) {
    if (n >= 40) break;
    const add = (k) => { time.set(cur, (time.get(cur) || 0) + k); n += k; };
    if (c[0] === '@') cur = c[1];
    else if (c[0] === 'v') add(1);
    else if (c[0] === 'v:' || c[0] === 'v=') add(Math.max(1, c[2]));
    else if (c[0] === ']') { add(40 - n); break; }
  }
  if (n < 40) time.set(cur, (time.get(cur) || 0) + 40 - n);
  return [...time].sort((a, b) => b[1] - a[1])[0][0];
}
// An @r envelope as levels 0-15 per frame (it runs AL, AR, DR, SL, SR as MUCOM88's E does).
export const rateEnvelopeLevels = (env, frames = HORIZON) => adsr(env.al, env.ar, env.dr, env.sl, env.sr, frames).map((e) => e / 17);

// MUCOM88's envelope, frame by frame: AL, then +AR to 255, -DR to SL, -SR to 0 (rates per frame).
function adsr(al, ar, dr, sl, sr, frames) {
  const out = [];
  let e = al, phase = e >= 255 ? 1 : 0;
  for (let i = 0; i < frames; i++) {
    out.push(Math.max(0, Math.min(255, e)));
    if (phase === 0) { if (ar <= 0) continue; e += ar; if (e >= 255) { e = 255; phase = 1; } }
    else if (phase === 1) { e -= dr; if (e <= sl) { e = Math.max(e, 0); phase = 2; } }
    else e = Math.max(0, e - sr);
  }
  return out;
}

// An @e envelope as E parameters, rates per frame: { al, ar, dr, sl, sr, peak }.
// MGSDRV subtracts (15 - v) from the envelope's level; MUCOM88 multiplies. The fit is made on
// what the track's usual volume (vref) leaves of the envelope, scaled so that its peak is the
// full envelope; `peak` (0-15) is the envelope's own highest level, which the volume carries.
export function fitEnvelope(levels, vref = 15) {
  const cut = levels.map((l) => Math.max(0, l - (15 - vref)));
  const peak = Math.max(...levels), top = Math.max(...cut);
  if (top <= 0) return { al: 255, ar: 0, dr: 0, sl: 255, sr: 0, peak };
  const target = cut.map((l) => (l / top) * 255);
  const p = target.findIndex((v) => v >= 255);
  const al = p > 0 ? Math.round(target[0]) : 255, ar = p > 0 ? (255 - target[0]) / p : 0;
  const z = target.slice(p), last = z[z.length - 1];
  const weight = (i) => (i < 20 ? 2 : i < 60 ? 1 : 0.4);
  const error = (dr, sl, sr) => { const e = adsr(255, 0, dr, sl, sr, z.length); let s = 0; for (let i = 0; i < z.length; i++) s += weight(i) * (e[i] - z[i]) ** 2; return s; };
  let best = { dr: 0, sl: 255, sr: 0, err: error(0, 255, 0) };
  const firstAt = (v) => { const i = z.findIndex((x) => x <= v); return i < 0 ? z.length : i; };
  for (let b = 1; b < Math.min(z.length, 90); b++) {
    if (z[b] >= z[b - 1] && b > 1) continue;                  // break points only where the level falls
    const sl = z[b], dr = (255 - sl) / b;
    const tails = [0];
    if (last < sl) { const e = firstAt(last); if (e > b) tails.push((sl - last) / (e - b)); }
    if (sl > 0) { const e = firstAt(0); if (e > b && e < z.length) tails.push(sl / (e - b)); }
    for (const sr of tails) {
      const err = error(dr, sl, sr);
      if (err < best.err) best = { dr, sl, sr, err };
    }
  }
  return { al, ar, dr: best.dr, sl: Math.round(best.sl), sr: best.sr, peak };
}

// E parameters as text. Rates are per frame; `ticksPerFrame` is how many MUCOM88 clocks pass
// in 1/60 s (the envelope runs on the song's clock). release: the level lost per frame.
export function envelopeText({ al, ar, dr, sl, sr }, release, ticksPerFrame) {
  const rate = (r) => (r <= 0 ? 0 : Math.min(255, Math.max(1, Math.round(r / ticksPerFrame))));
  return `E${Math.round(al)},${rate(ar)},${rate(dr)},${Math.round(sl)},${rate(sr)},${rate(release)}`;
}
