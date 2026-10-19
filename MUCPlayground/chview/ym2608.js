// YM2608 (OPNA) panel, ported from MDPlayer4Mac (GPL-3.0): the channel visualizer
// (macos/MDPlayerUI/Visualizer/Ym2608Visualizer.cs, itself a port of MDPlayer's
// frmYM2608) and the YM2608 part of ChipRegister (register, key-on and level tracking).
// Rows are grouped FM -> SSG -> PCM like MDPlayer4Mac; rhythm and ADPCM meters follow the
// emulator's live output level (visVolume), set by the page before each update.
import * as D from './draw.js';

const md = [0x08 << 4, 0x08 << 4, 0x08 << 4, 0x08 << 4, 0x0c << 4, 0x0e << 4, 0x0e << 4, 0x0f << 4];
const fmDivTbl = [6, 3, 2];
const ssgDivTbl = [4, 2, 1];

function params() {
  return { lfoSw: false, lfoFrq: -1, nfrq: -1, efrq: -1, etype: -1, timerA: -1, timerB: -1,
    rhythmTotalLevel: -1, adpcmLevel: -1, channels: D.channels(19) };
}

export class YM2608 {
  static plane = 'planeD';

  constructor(clock) {
    this.clock = clock;
    // ChipRegister state
    this.reg = [new Array(0x100).fill(0), new Array(0x100).fill(0)];
    for (const p of [0, 1]) for (const a of [0xb4, 0xb5, 0xb6]) this.reg[p][a] = 0xc0;
    this.keyOn = [0, 0, 0, 0, 0, 0];
    this.keyOnCh3 = 0;
    this.vol = new Array(9).fill(0);
    this.ch3SlotVol = [0, 0, 0, 0];
    this.rhythmVol = Array.from({ length: 6 }, () => [0, 0]);
    this.adpcmVol = [0, 0];
    this.adpcmPan = 0;
    // MDSound's live output levels (getYM2608VisVolume) and rhythm key mask, from the engine.
    this.visVolume = null;
    this.rhythmKeyMask = 0;
    this.liveMeterLevels = [0, 0, 0, 0];
    // form state
    this.oldParam = params();
    this.newParam = params();
  }

  // ChipRegister.setYM2608Register
  write(dPort, dAddr, dData) {
    const r = this.reg;
    if (dPort === 0 && (dAddr === 0x2d || dAddr === 0x2e || dAddr === 0x2f)) r[0][0x2d] = dAddr - 0x2d;
    else r[dPort][dAddr] = dData;

    if (dPort === 0 && dAddr === 0x28) {
      const ch = (dData & 0x3) + ((dData & 0x4) > 0 ? 3 : 0);
      if (ch >= 0 && ch < 6) {
        if (ch !== 2 || (r[0][0x27] & 0xc0) !== 0x40) {
          if ((dData & 0xf0) !== 0) {
            this.keyOn[ch] = (dData & 0xf0) | 1;
            this.vol[ch] = 256 * 6;
          } else {
            this.keyOn[ch] = (dData & 0xf0) | 0;
          }
        } else {
          this.keyOn[2] = dData & 0xf0;
          for (let i = 0; i < 4; i++) {
            const b = 0x10 << i;
            if ((this.keyOnCh3 & b) !== (dData & b)) {
              if ((dData & b) !== 0) this.ch3SlotVol[i] = 256 * 6;
              this.keyOnCh3 = (this.keyOnCh3 & ~b) | (dData & b);
            }
          }
        }
      }
    }
    if (dPort === 1 && dAddr === 0x00 && (dData & 0x80) !== 0) {
      this.adpcmVol[0] = Math.trunc((256 * 6.0 * r[1][0x0b] / 64.0) * ((this.adpcmPan & 0x02) > 0 ? 1 : 0));
      this.adpcmVol[1] = Math.trunc((256 * 6.0 * r[1][0x0b] / 64.0) * ((this.adpcmPan & 0x01) > 0 ? 1 : 0));
    }
    if (dPort === 1 && dAddr === 0x01) this.adpcmPan = (dData & 0xc0) >> 6;
    if (dPort === 0 && dAddr === 0x10) {
      const tl = r[0][0x11] & 0x3f;
      for (let i = 0; i < 6; i++) {
        if ((dData & (0x1 << i)) !== 0) {
          const il = (r[0][0x18 + i] & 0x1f) * (((dData & 0x80) === 0) ? 1 : 0);
          const pan = (r[0][0x18 + i] & 0xc0) >> 6;
          this.rhythmVol[i][0] = Math.trunc(256 * 6 * ((tl * il) >> 4) / 127.0) * ((pan & 2) > 0 ? 1 : 0);
          this.rhythmVol[i][1] = Math.trunc(256 * 6 * ((tl * il) >> 4) / 127.0) * ((pan & 1) > 0 ? 1 : 0);
        }
      }
    }
  }

  // ChipRegister.updateVol: meters fall back after each key-on, once per screen update.
  updateVol() {
    const dec = (a, i) => { if (a[i] > 0) { a[i] -= 50; if (a[i] < 0) a[i] = 0; } };
    for (let i = 0; i < 9; i++) dec(this.vol, i);
    for (let i = 0; i < 4; i++) dec(this.ch3SlotVol, i);
    for (let i = 0; i < 6; i++) { dec(this.rhythmVol[i], 0); dec(this.rhythmVol[i], 1); }
    dec(this.adpcmVol, 0);
    dec(this.adpcmVol, 1);
  }

  clearVis() {
    this.visVolume = null;
    this.rhythmKeyMask = 0;
    this.liveMeterLevels.fill(0);
  }

  // Ym2608Visualizer's constructor: FM 1-6 + FM-EX 1-3, then SSG 1-3, then ADPCM.
  screenInit(fb) {
    D.reorderRows(fb, D.images[YM2608.plane], 8, 8, [0, 1, 2, 3, 4, 5, 9, 10, 11, 6, 7, 8, 12]);
    // Paint the PCM meters empty rather than leaving the background's full-scale bars.
    for (let ch = 12; ch < 19; ch++) {
      this.newParam.channels[ch].volumeL = 0;
      this.newParam.channels[ch].volumeR = 0;
    }
  }

  static toMeterLevel(levels, source, side, unitsPerSegment = 1600, maximum = 19) {
    if (!levels || source < 0 || source >= levels.length || !levels[source] || side < 0 || side >= levels[source].length) return 0;
    return Math.min(Math.trunc(Math.abs(levels[source][side]) / unitsPerSegment), maximum);
  }

  updateLiveMeter(i, raw) {
    const previous = this.liveMeterLevels[i];
    this.liveMeterLevels[i] = raw >= previous ? raw : Math.max(0, previous - 2);
    return this.liveMeterLevels[i];
  }

  screenChangeParams() {
    const newParam = this.newParam;
    const ym2608Register = this.reg;
    const fmKeyYM2608 = this.keyOn;
    const ym2608Vol = this.vol;
    const ym2608Ch3SlotVol = this.ch3SlotVol;
    const ym2608Rhythm = this.rhythmVol;
    const ym2608AdpcmVol = this.adpcmVol;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const live = this.visVolume;
    const hasAdpcmLiveMeter = !!(live && live.length > 4 && live[4] && live[4].length > 1);
    const rhythmMeterL = this.updateLiveMeter(0, YM2608.toMeterLevel(live, 3, 0));
    const rhythmMeterR = this.updateLiveMeter(1, YM2608.toMeterLevel(live, 3, 1));
    // ADPCM-B uses a 15-segment short bar on a tighter scale.
    const adpcmMeterL = this.updateLiveMeter(2, YM2608.toMeterLevel(live, 4, 0, 450, 15));
    const adpcmMeterR = this.updateLiveMeter(3, YM2608.toMeterLevel(live, 4, 1, 450, 15));

    newParam.timerA = ym2608Register[0][0x24] | ((ym2608Register[0][0x25] & 0x3) << 8);
    newParam.timerB = ym2608Register[0][0x26];
    newParam.rhythmTotalLevel = ym2608Register[0][0x11];
    newParam.adpcmLevel = ym2608Register[1][0x0b];
    const isFmEx = (ym2608Register[0][0x27] & 0x40) > 0;
    newParam.channels[2].ex = isFmEx;

    const defaultMasterClock = 7987200;
    let ssgMul = 1.0;
    let masterClock = defaultMasterClock;
    if (this.clock) {
      ssgMul = this.clock / defaultMasterClock;
      masterClock = this.clock;
    }
    let divInd = ym2608Register[0][0x2d];
    if (divInd < 0 || divInd > 2) divInd = 0;
    const fmDiv = fmDivTbl[divInd];
    const ssgDiv = ssgDivTbl[divInd];
    ssgMul = ssgMul / ssgDiv * 4;

    newParam.lfoSw = (ym2608Register[0][0x22] & 0x8) !== 0;
    newParam.lfoFrq = ym2608Register[0][0x22] & 0x7;

    for (let ch = 0; ch < 6; ch++) {
      const p = ch > 2 ? 1 : 0;
      const c = ch > 2 ? ch - 3 : ch;
      const inst = newParam.channels[ch].inst;
      for (let i = 0; i < 4; i++) {
        const ops = i === 0 ? 0 : (i === 1 ? 8 : (i === 2 ? 4 : 12));
        inst[i * 11 + 0] = ym2608Register[p][0x50 + ops + c] & 0x1f; //AR
        inst[i * 11 + 1] = ym2608Register[p][0x60 + ops + c] & 0x1f; //DR
        inst[i * 11 + 2] = ym2608Register[p][0x70 + ops + c] & 0x1f; //SR
        inst[i * 11 + 3] = ym2608Register[p][0x80 + ops + c] & 0x0f; //RR
        inst[i * 11 + 4] = (ym2608Register[p][0x80 + ops + c] & 0xf0) >> 4; //SL
        inst[i * 11 + 5] = ym2608Register[p][0x40 + ops + c] & 0x7f; //TL
        inst[i * 11 + 6] = (ym2608Register[p][0x50 + ops + c] & 0xc0) >> 6; //KS
        inst[i * 11 + 7] = ym2608Register[p][0x30 + ops + c] & 0x0f; //ML
        inst[i * 11 + 8] = (ym2608Register[p][0x30 + ops + c] & 0x70) >> 4; //DT
        inst[i * 11 + 9] = (ym2608Register[p][0x60 + ops + c] & 0x80) >> 7; //AM
        inst[i * 11 + 10] = ym2608Register[p][0x90 + ops + c] & 0x0f; //SG
      }
      inst[44] = ym2608Register[p][0xb0 + c] & 0x07; //AL
      inst[45] = (ym2608Register[p][0xb0 + c] & 0x38) >> 3; //FB
      inst[46] = (ym2608Register[p][0xb4 + c] & 0x38) >> 4; //AMS
      inst[47] = ym2608Register[p][0xb4 + c] & 0x07; //FMS

      newParam.channels[ch].pan = (ym2608Register[p][0xb4 + c] & 0xc0) >> 6;
      newParam.channels[ch].slot = (fmKeyYM2608[ch] >> 4) & 0xff;

      let freq, octav, n = -1;
      if (ch !== 2 || !isFmEx) {
        octav = (ym2608Register[p][0xa4 + c] & 0x38) >> 3;
        freq = ym2608Register[p][0xa0 + c] + (ym2608Register[p][0xa4 + c] & 0x07) * 0x100;
        newParam.channels[ch].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
        ff /= 1038;
        if ((fmKeyYM2608[ch] & 1) !== 0) n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);

        const con = fmKeyYM2608[ch] & 0xff;
        let v = 127;
        const m = md[ym2608Register[p][0xb0 + c] & 7];
        //OP1
        v = (((con & 0x10) !== 0) && ((m & 0x10) !== 0) && v > (ym2608Register[p][0x40 + c] & 0x7f)) ? (ym2608Register[p][0x40 + c] & 0x7f) : v;
        //OP3
        v = (((con & 0x20) !== 0) && ((m & 0x20) !== 0) && v > (ym2608Register[p][0x44 + c] & 0x7f)) ? (ym2608Register[p][0x44 + c] & 0x7f) : v;
        //OP2
        v = (((con & 0x40) !== 0) && ((m & 0x40) !== 0) && v > (ym2608Register[p][0x48 + c] & 0x7f)) ? (ym2608Register[p][0x48 + c] & 0x7f) : v;
        //OP4
        v = (((con & 0x80) !== 0) && ((m & 0x80) !== 0) && v > (ym2608Register[p][0x4c + c] & 0x7f)) ? (ym2608Register[p][0x4c + c] & 0x7f) : v;
        newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ((ym2608Register[p][0xb4 + c] & 0x80) !== 0 ? 1 : 0) * ym2608Vol[ch] / 80.0), 0, 19);
        newParam.channels[ch].volumeR = clamp(Math.trunc((127 - v) / 127.0 * ((ym2608Register[p][0xb4 + c] & 0x40) !== 0 ? 1 : 0) * ym2608Vol[ch] / 80.0), 0, 19);
      } else {
        const m = md[ym2608Register[0][0xb0 + 2] & 7];
        freq = ym2608Register[0][0xa9] + (ym2608Register[0][0xad] & 0x07) * 0x100;
        octav = (ym2608Register[0][0xad] & 0x38) >> 3;
        newParam.channels[2].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
        ff /= 1038;
        if ((fmKeyYM2608[2] & 0x10) > 0 && ((m & 0x10) !== 0)) n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
        const v = ((m & 0x10) !== 0) ? ym2608Register[p][0x40 + c] : 127;
        newParam.channels[2].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ((ym2608Register[0][0xb4 + 2] & 0x80) !== 0 ? 1 : 0) * ym2608Ch3SlotVol[0] / 80.0), 0, 19);
        newParam.channels[2].volumeR = clamp(Math.trunc((127 - v) / 127.0 * ((ym2608Register[0][0xb4 + 2] & 0x40) !== 0 ? 1 : 0) * ym2608Ch3SlotVol[0] / 80.0), 0, 19);
      }
      newParam.channels[ch].note = n;
    }

    for (let ch = 6; ch < 9; ch++) { //FM EX
      const exReg = [2, 0, -6];
      const c = exReg[ch - 6];
      newParam.channels[ch].pan = 0;
      if (isFmEx) {
        const m = md[ym2608Register[0][0xb0 + 2] & 7];
        let op = ch - 5;
        op = op === 1 ? 2 : (op === 2 ? 1 : op);
        const freq = ym2608Register[0][0xa8 + c] + (ym2608Register[0][0xac + c] & 0x07) * 0x100;
        const octav = (ym2608Register[0][0xac + c] & 0x38) >> 3;
        newParam.channels[ch].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let n = -1;
        if ((fmKeyYM2608[2] & (0x10 << (ch - 5))) !== 0 && ((m & (0x10 << op)) !== 0)) {
          let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
          ff /= 1038;
          n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
        }
        newParam.channels[ch].note = n;
        const v = ((m & (0x10 << op)) !== 0) ? ym2608Register[0][0x42 + op * 4] : 127;
        newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ym2608Ch3SlotVol[ch - 5] / 80.0), 0, 19);
      } else {
        newParam.channels[ch].note = -1;
        newParam.channels[ch].volumeL = 0;
      }
    }

    for (let ch = 0; ch < 3; ch++) { //SSG
      const channel = newParam.channels[ch + 9];
      const t = (ym2608Register[0][0x07] & (0x1 << ch)) === 0;
      const n = (ym2608Register[0][0x07] & (0x8 << ch)) === 0;
      channel.tn = (t ? 1 : 0) + (n ? 2 : 0);
      channel.volumeL = ym2608Register[0][0x08 + ch] & 0xf;
      channel.volume = (t || n) ? (ym2608Register[0][0x08 + ch] & 0xf) : 0;
      const ft = ym2608Register[0][0x00 + ch * 2];
      const ct = ym2608Register[0][0x01 + ch * 2] & 0xf;
      const tp = (ct << 8) | ft;
      channel.freq = tp;
      if (channel.volumeL === 0 && (ym2608Register[0][0x08 + ch] & 0x10) === 0) {
        channel.note = -1;
      } else if (tp === 0) {
        channel.note = -1;
      } else {
        const ftone = masterClock / (64.0 * tp) * ssgMul;
        channel.note = D.Common.searchSSGNote(ftone);
      }
      channel.ex = (ym2608Register[0][0x08 + ch] & 0x10) !== 0;
    }

    newParam.nfrq = ym2608Register[0][0x06] & 0x1f;
    newParam.efrq = ym2608Register[0][0x0c] * 0x100 + ym2608Register[0][0x0b];
    newParam.etype = ym2608Register[0][0x0d] & 0xf;

    //ADPCM
    const adpcm = newParam.channels[12];
    adpcm.pan = (ym2608Register[1][0x01] & 0xc0) >> 6;
    adpcm.volume = ym2608Register[1][0x0b];
    // The register-derived value is only a key-on flash; the live meter is the real level.
    adpcm.volumeL = hasAdpcmLiveMeter ? adpcmMeterL : clamp(Math.trunc(ym2608AdpcmVol[0] / 90), 0, 15);
    adpcm.volumeR = hasAdpcmLiveMeter ? adpcmMeterR : clamp(Math.trunc(ym2608AdpcmVol[1] / 90), 0, 15);
    const delta = (ym2608Register[1][0x0a] << 8) | ym2608Register[1][0x09];
    adpcm.freq = delta;
    const frq = delta / 9447.0;
    adpcm.note = (ym2608Register[1][0x00] & 0x80) !== 0 ? (D.Common.searchYM2608Adpcm(frq) - 1) : -1;
    if ((ym2608Register[1][0x01] & 0xc0) === 0) adpcm.note = -1;

    for (let ch = 13; ch < 19; ch++) { //RHYTHM
      newParam.channels[ch].pan = (ym2608Register[0][0x18 + ch - 13] & 0xc0) >> 6;
      newParam.channels[ch].volumeL = clamp(Math.trunc(ym2608Rhythm[ch - 13][0] / 80), 0, 19);
      newParam.channels[ch].volumeR = clamp(Math.trunc(ym2608Rhythm[ch - 13][1] / 80), 0, 19);
      newParam.channels[ch].volumeRL = ym2608Register[0][ch - 13 + 0x18] & 0x1f;
      if ((this.rhythmKeyMask & (1 << (ch - 13))) !== 0) {
        newParam.channels[ch].volumeL = Math.max(newParam.channels[ch].volumeL, rhythmMeterL);
        newParam.channels[ch].volumeR = Math.max(newParam.channels[ch].volumeR, rhythmMeterR);
      }
    }
  }

  screenDrawParams(fb) {
    const tp = 0;
    const oldParam = this.oldParam, newParam = this.newParam;
    for (let c = 0; c < 9; c++) {
      const oyc = oldParam.channels[c];
      const nyc = newParam.channels[c];
      if (c === 2) {
        D.Volume(fb, 272 + 1, 8 + c * 8, 1, oyc, 'volumeL', nyc.volumeL, tp);
        D.Volume(fb, 272 + 1, 8 + c * 8, 2, oyc, 'volumeR', nyc.volumeR, tp);
        D.Pan(fb, 25, 8 + c * 8, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
        D.KeyBoardOPNA(fb, 33, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.InstOPNA(fb, 4, 17 * 8, c, oyc.inst, nyc.inst);
        D.Ch3YM2608(fb, c, oyc, 'mask', nyc.mask, oyc, 'ex', nyc.ex, tp);
        D.Slot(fb, 1 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      } else if (c < 6) {
        D.Volume(fb, 272 + 1, 8 + c * 8, 1, oyc, 'volumeL', nyc.volumeL, tp);
        D.Volume(fb, 272 + 1, 8 + c * 8, 2, oyc, 'volumeR', nyc.volumeR, tp);
        D.Pan(fb, 25, 8 + c * 8, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
        D.KeyBoardOPNA(fb, 33, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.InstOPNA(fb, 4, 17 * 8, c, oyc.inst, nyc.inst);
        D.ChYM2608(fb, c, oyc, 'mask', nyc.mask, tp);
        D.Slot(fb, 1 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      } else {
        D.Volume(fb, 272 + 1, 8 + c * 8, 0, oyc, 'volumeL', nyc.volumeL, tp);
        D.KeyBoardOPNA(fb, 33, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.ChYM2608(fb, c, oyc, 'mask', nyc.mask, tp);
        D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      }
    }

    //SSG
    for (let c = 0; c < 3; c++) {
      const oyc = oldParam.channels[c + 9];
      const nyc = newParam.channels[c + 9];
      D.VolumeShort(fb, 280 + 1, 8 + (c + 9) * 8, 0, oyc, 'volume', nyc.volume, tp);
      D.KeyBoardOPNA(fb, 33, (c + 9) * 8 + 8, oyc, 'note', nyc.note, tp);
      D.TnOPNA(fb, 6, 2, c + 9, oyc, 'tn', nyc.tn, oyc, 'tntp', tp * 2);
      D.ChYM2608(fb, c + 9, oyc, 'mask', nyc.mask, tp);
      D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + (c + 9) * 8, 0, oyc, 'freq', nyc.freq);
      D.font4HexByte(fb, 272 + 1, 8 + (c + 9) * 8, 0, oyc, 'volumeL', nyc.volumeL);
      D.drawNESSw(fb, 268 + 1, 8 + (c + 9) * 8, oyc, 'ex', nyc.ex);
    }

    //ADPCM
    const oa = oldParam.channels[12], na = newParam.channels[12];
    D.VolumeShort(fb, 280 + 1, 8 + 12 * 8, 1, oa, 'volumeL', na.volumeL, tp);
    D.VolumeShort(fb, 280 + 1, 8 + 12 * 8, 2, oa, 'volumeR', na.volumeR, tp);
    D.Pan(fb, 25, 8 + 12 * 8, oa, 'pan', na.pan, oa, 'pantp', tp);
    D.KeyBoardOPNA(fb, 33, 8 + 12 * 8, oa, 'note', na.note, tp);
    D.ChYM2608(fb, 12, oa, 'mask', na.mask, tp);
    D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + 12 * 8, 0, oa, 'freq', na.freq);
    D.font4HexByte(fb, 272 + 1, 8 + 12 * 8, 0, oa, 'volume', na.volume);

    //Rhythm
    for (let c = 0; c < 6; c++) {
      const oyc = oldParam.channels[c + 13];
      const nyc = newParam.channels[c + 13];
      D.VolumeYM2608Rhythm(fb, c, 1, oyc, 'volumeL', nyc.volumeL, tp);
      D.VolumeYM2608Rhythm(fb, c, 2, oyc, 'volumeR', nyc.volumeR, tp);
      D.PanYM2608Rhythm(fb, c, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
      D.font4Int2(fb, c * 4 * 15 + 4, 28 * 4, 0, 0, oyc, 'volumeRL', nyc.volumeRL);
      D.ChYM2608Rhythm(fb, c, oyc, 'mask', nyc.mask, tp);
    }

    D.font4Hex12Bit(fb, 85 * 4, 30 * 4, 0, oldParam, 'timerA', newParam.timerA);
    D.font4HexByte(fb, 85 * 4, 32 * 4, 0, oldParam, 'timerB', newParam.timerB);
    D.LfoSw(fb, 84 * 4, 18 * 8, oldParam, 'lfoSw', newParam.lfoSw);
    D.LfoFrq(fb, 84 * 4, 19 * 8, oldParam, 'lfoFrq', newParam.lfoFrq);
    D.Nfrq(fb, 84, 42, oldParam, 'nfrq', newParam.nfrq);
    D.Efrq(fb, 84, 44, oldParam, 'efrq', newParam.efrq);
    D.Etype(fb, 84, 46, oldParam, 'etype', newParam.etype);
    D.font4Int2(fb, 84 * 4, 50 * 4, 0, 0, oldParam, 'rhythmTotalLevel', newParam.rhythmTotalLevel);
    D.font4Int3(fb, 84 * 4, 52 * 4, 0, 3, oldParam, 'adpcmLevel', newParam.adpcmLevel);
  }
}
