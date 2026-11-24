// Chip levels: how loud each chip, or one part of a chip, plays against the others.
// Edit the numbers here; no engine rebuild is needed (the engines read this list when they
// start, and apply it to every song they open: MUC / .mub and VGM files alike).
//
// Units are MDPlayer's mixer units, as in MDPlayer4Mac's Balance settings: 0.5 dB steps,
// 0 = as the emulator makes it, -192 = off, at most +20.
//    -2 = 1 dB quieter (x0.89)    -4 = 2 dB (x0.79)    -6 = 3 dB (x0.71)    -12 = 6 dB (x0.5)
//    +2 = 1 dB louder  (x1.12)    +4 = 2 dB (x1.26)
//
// A key is a chip, for the whole chip, or a chip and one of its parts:
//   YM2608 (OPNA)    FM  SSG  RHYTHM  ADPCM
//   YM2610 (OPNB)    FM  SSG  ADPCMA  ADPCMB
//   YM2203 (OPN)     FM  SSG
//   YM2612 (OPN2)    FM  DAC
//   Y8950            FM  ADPCM
//   whole chips      YM2151  YM2413  AY8910  K051649  SN76489 … (any MDSound chip name)

export const CHIP_LEVELS = {
  // The real YM2608's SSG sounds about 20% quieter against its FM than in the emulator.
  'YM2608 SSG': -4,
};
