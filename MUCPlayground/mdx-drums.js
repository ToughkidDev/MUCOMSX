// ADPCM samples that sound like the YM2608's rhythm drums.
//
// An X68000 song keeps its drums in a PDX file; the OPNA has six drums of its own (bass drum,
// snare, top cymbal, hi-hat, tom, rim shot) on a channel apart from its ADPCM, where they cost
// no sample memory and sound together. nearestDrum says which of the six a sample is most like
// and how much: the sound's energy in 13 bands (80 Hz to 7.2 kHz, half an octave or so each)
// over three stretches of time from its start (0-25, 25-100 and 100-400 ms), as one vector,
// against the same of each drum (DRUM_SHAPES, measured from the chip's samples); the likeness
// is the cosine of the two, 1 for the same shape. The drums among themselves are 0.06 to 0.68.
//
//   nearestDrum(samples: Float32Array (-1..1), rate) -> { drum: 0-5, like: 0-1, peak } | null
//     drum: index into DRUM_NAMES (the bit of MUCOM88's rhythm mask is 1 << drum)
//     peak: the loudest 5 ms of the sample (RMS), for its level
export const DRUM_NAMES = ['bass drum', 'snare drum', 'top cymbal', 'hi-hat', 'tom', 'rim shot'];
const BANDS = 13, LOW = 80, TOP = 7200, CUTS = [0, 0.025, 0.1, 0.4];
const DRUM_SHAPES = [
  [0.754,0.609,0.203,0.014,0.004,0.004,0.006,0.007,0.013,0.022,0.053,0.057,0.015,0.062,0.077,0.029,0.01,0.005,0.003,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0.097,0.21,0.729,0.405,0.075,0.028,0.015,0.035,0.08,0.189,0.207,0.159,0.05,0.004,0.021,0.094,0.056,0.039,0.01,0.011,0.016,0.048,0.16,0.22,0.192,0.055,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0.019,0.007,0.015,0.028,0.126,0.083,0.074,0.058,0.091,0.07,0.186,0.25,0.152,0.006,0.01,0.017,0.039,0.075,0.079,0.136,0.097,0.087,0.078,0.352,0.328,0.186,0.012,0.009,0.013,0.101,0.1,0.125,0.161,0.161,0.156,0.168,0.461,0.336,0.215],
  [0.022,0.018,0.018,0.062,0.042,0.041,0.071,0.047,0.079,0.104,0.173,0.264,0.919,0.06,0.042,0.035,0.035,0.034,0.017,0.014,0.029,0.014,0.017,0.025,0.037,0.099,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0.049,0.411,0.65,0.054,0.109,0.167,0.027,0.024,0.018,0.059,0.041,0.055,0.039,0.006,0.429,0.326,0.023,0.062,0.091,0.009,0.006,0.003,0.005,0.005,0.005,0.004,0.044,0.178,0.124,0.017,0.012,0.014,0.004,0.002,0.002,0.002,0.002,0.001,0.001],
  [0.083,0.089,0.065,0.096,0.073,0.297,0.195,0.532,0.346,0.419,0.397,0.196,0.25,0,0,0.005,0,0.007,0.009,0.024,0.03,0.025,0.025,0.015,0.017,0.014,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

function spectrum(x, from, to, rate) {
  const n = to - from, out = new Array(BANDS).fill(0);
  if (n < 16) return out;
  let size = 256;
  while (size < n) size <<= 1;
  const re = new Float64Array(size), im = new Float64Array(size);
  for (let i = 0; i < n; i++) re[i] = x[from + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / n));
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; }
  }
  for (let len = 2; len <= size; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < size; i += len) for (let k = 0; k < len / 2; k++) {
      const c = Math.cos(ang * k), s = Math.sin(ang * k), a = i + k, b = a + len / 2;
      const xr = re[b] * c - im[b] * s, xi = re[b] * s + im[b] * c;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
  for (let k = 1; k < size / 2; k++) {
    const f = (k * rate) / size;
    if (f < LOW || f >= TOP) continue;
    out[Math.min(BANDS - 1, Math.floor((BANDS * Math.log(f / LOW)) / Math.log(TOP / LOW)))] += (re[k] * re[k] + im[k] * im[k]) / size;
  }
  return out;
}

export function nearestDrum(x, rate) {
  let top = 0;
  for (const v of x) top = Math.max(top, Math.abs(v));
  if (top < 0.01) return null;
  let start = 0;
  while (start < x.length && Math.abs(x[start]) < top * 0.1) start++;
  const v = [];
  for (let s = 0; s < CUTS.length - 1; s++) {
    const a = Math.min(x.length, start + Math.round(CUTS[s] * rate)), b = Math.min(x.length, start + Math.round(CUTS[s + 1] * rate));
    v.push(...spectrum(x, a, b, rate));
  }
  const total = v.reduce((p, q) => p + q, 0);
  if (!total) return null;
  const mine = v.map((q) => Math.sqrt(q / total));
  let best = null;
  DRUM_SHAPES.forEach((ref, drum) => {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < ref.length; i++) { dot += mine[i] * ref[i]; na += mine[i] ** 2; nb += ref[i] ** 2; }
    const like = dot / Math.sqrt(na * nb || 1);
    if (!best || like > best.like) best = { drum, like };
  });
  const w = Math.max(8, Math.round(rate * 0.005));
  let peak = 0;
  for (let i = 0; i + w <= x.length; i += w) { let s = 0; for (let j = 0; j < w; j++) s += x[i + j] ** 2; peak = Math.max(peak, Math.sqrt(s / w)); }
  return { ...best, peak };
}
