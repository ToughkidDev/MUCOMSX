// YM2610 / YM2610B (OPNB) panel, ported from MDPlayer4Mac (GPL-3.0):
// macos/MDPlayerUI/Visualizer/Ym2610Visualizer.cs + DrawBuffYm2610.cs, with the YM2610
// part of macos/MDPlayerCore/ChipRegister.cs (register, key-on and level tracking).
// Rows are grouped FM 1-6, FM-EX 1-3, SSG 1-3, then ADPCM-B/ADPCM-A, as on the Mac.
//
// Live emulator meters: the page sets `visVolume` (levels[source][L/R] from the OPNB
// core: source 1 = FM, 2 = SSG, 3 = ADPCM-A, 4 = ADPCM-B) and `adpcmAKeyMask` (bit per
// ADPCM-A voice that is playing) before each screenChangeParams; clearVis() on Stop.
import * as D from './draw.js';

const md = [0x08 << 4, 0x08 << 4, 0x08 << 4, 0x08 << 4, 0x0c << 4, 0x0e << 4, 0x0e << 4, 0x0f << 4];
const fmDivTbl = [6, 3, 2];
const ssgDivTbl = [4, 2, 1];

function params() {
  return { lfoSw: false, lfoFrq: -1, nfrq: -1, efrq: -1, etype: -1, timerA: -1, timerB: -1,
    rhythmTotalLevel: -1, adpcmLevel: -1, channels: D.channels(19) };
}

// DrawBuffYm2610.ChYm2610At: the channel badge drawn at a display row, only when the mask
// state changes (the plane already shows the unmasked badges).
function chAt(fb, row, ch, o, nm) {
  const mask = !!nm;
  if (o.mask !== null && o.mask !== undefined && o.mask === mask) return;
  D.ChYM2610_P(fb, 1, 8 + row * 8, ch, mask, 0);
  o.mask = mask;
}

export class YM2610 {
  static plane = 'planeYM2610';

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
    // emulator-side meters (ChipRegister.GetYM2610VisVolume / GetYM2610AdpcmAKeyMask)
    this.visVolume = null;
    this.adpcmAKeyMask = 0;
    this.liveMeterLevels = new Array(10).fill(0);
    // visualizer state
    this.oldParam = params();
    this.newParam = params();
    // The plane has meter artwork; start the PCM meters at 0 (old values stay -1) so the
    // first update clears them.
    for (let channel = 12; channel < 19; channel++) {
      this.newParam.channels[channel].volumeL = 0;
      this.newParam.channels[channel].volumeR = 0;
    }
  }

  // ChipRegister.ClearVisualizationVolumes (on Stop).
  clearVis() {
    this.visVolume = null;
    this.adpcmAKeyMask = 0;
  }

  static toMeterLevel(levels, source, side) {
    if (!levels || source < 0 || source >= levels.length || !levels[source]
      || side < 0 || side >= levels[source].length) return 0;
    // 1,600 units per LED segment leaves headroom for the loudest ADPCM samples.
    return Math.min(Math.trunc(Math.abs(levels[source][side]) / 1600), 19);
  }

  // Rises at once, falls 2 segments per screen update.
  updateLiveMeter(meterIndex, rawLevel) {
    const previous = this.liveMeterLevels[meterIndex];
    this.liveMeterLevels[meterIndex] = rawLevel >= previous ? rawLevel : Math.max(0, previous - 2);
    return this.liveMeterLevels[meterIndex];
  }

  // ChipRegister.setYM2610Register
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

    // ADPCM B KEYON
    if (dPort === 0 && dAddr === 0x10) {
      if ((dData & 0x80) !== 0) {
        let p = (r[0][0x11] & 0xc0) >> 6;
        p = p === 0 ? 3 : p;
        this.adpcmPan = p;
        const level = r[0][0x1b] & 0xff;
        const peak = Math.trunc(256 * 6.0 * level / 255.0);
        this.adpcmVol[0] = (this.adpcmPan & 0x02) !== 0 ? peak : 0;
        this.adpcmVol[1] = (this.adpcmPan & 0x01) !== 0 ? peak : 0;
      } else {
        this.adpcmVol[0] = 0;
        this.adpcmVol[1] = 0;
      }
    }

    // ADPCM A KEYON
    if (dPort === 1 && dAddr === 0x00 && (dData & 0x80) === 0) {
      const tl = r[1][0x01] & 0x3f;
      for (let i = 0; i < 6; i++) {
        if ((dData & (0x1 << i)) !== 0) {
          const il = r[1][0x08 + i] & 0x1f;
          const pan = (r[1][0x08 + i] & 0xc0) >> 6;
          const peak = Math.trunc(256 * 6 * ((tl * il) >> 4) / 127.0);
          this.rhythmVol[i][0] = (pan & 2) > 0 ? peak : 0;
          this.rhythmVol[i][1] = (pan & 1) > 0 ? peak : 0;
        } else {
          this.rhythmVol[i][0] = 0;
          this.rhythmVol[i][1] = 0;
        }
      }
    }
  }

  // ChipRegister.updateVol
  updateVol() {
    const dec = (a, i) => { if (a[i] > 0) { a[i] -= 50; if (a[i] < 0) a[i] = 0; } };
    for (let i = 0; i < 9; i++) dec(this.vol, i);
    for (let i = 0; i < 4; i++) dec(this.ch3SlotVol, i);
    for (let i = 0; i < 6; i++) { dec(this.rhythmVol[i], 0); dec(this.rhythmVol[i], 1); }
    dec(this.adpcmVol, 0);
    dec(this.adpcmVol, 1);
  }

  // The Mac constructor: the plane is already drawn by FrameBuffer; regroup its rows
  // as FM 1-6, FM-EX 1-3, SSG 1-3, then ADPCM-B/ADPCM-A (PixelScreen.ReorderRowsFrom).
  screenInit(fb) {
    D.reorderRows(fb, D.images[YM2610.plane], 8, 8, [0, 1, 2, 3, 4, 5, 9, 10, 11, 6, 7, 8, 12]);
  }

  screenChangeParams() {
    const newParam = this.newParam;
    const R = this.reg;
    const fmKey = this.keyOn;
    const vol = this.vol;
    const ch3SlotVol = this.ch3SlotVol;
    const rhythm = this.rhythmVol;
    const adpcmVol = this.adpcmVol;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const live = this.visVolume;
    const lvl = YM2610.toMeterLevel;
    const fmMeterL = this.updateLiveMeter(0, lvl(live, 1, 0));
    const fmMeterR = this.updateLiveMeter(1, lvl(live, 1, 1));
    const ssgMeter = Math.max(
      this.updateLiveMeter(2, lvl(live, 2, 0)),
      this.updateLiveMeter(3, lvl(live, 2, 1)));
    const adpcmAMeterL = this.updateLiveMeter(4, lvl(live, 3, 0));
    const adpcmAMeterR = this.updateLiveMeter(5, lvl(live, 3, 1));
    const adpcmBMeterL = this.updateLiveMeter(6, lvl(live, 4, 0));
    const adpcmBMeterR = this.updateLiveMeter(7, lvl(live, 4, 1));

    const isFmEx = (R[0][0x27] & 0x40) > 0;
    newParam.channels[2].ex = isFmEx;

    const defaultMasterClock = 8000000;
    let ssgMul = 1.0;
    let masterClock = defaultMasterClock;
    if (this.clock) {
      ssgMul = this.clock / defaultMasterClock;
      masterClock = this.clock;
    }
    let divInd = R[0][0x2d];
    if (divInd < 0 || divInd > 2) divInd = 0;
    const fmDiv = fmDivTbl[divInd];
    const ssgDiv = ssgDivTbl[divInd];
    ssgMul = ssgMul / ssgDiv * 4;

    newParam.timerA = R[0][0x24] | ((R[0][0x25] & 0x3) << 8);
    newParam.timerB = R[0][0x26];
    newParam.rhythmTotalLevel = R[1][0x01];
    newParam.adpcmLevel = R[0][0x1b];
    newParam.lfoSw = (R[0][0x22] & 0x8) !== 0;
    newParam.lfoFrq = R[0][0x22] & 0x7;

    for (let ch = 0; ch < 6; ch++) {
      const p = ch > 2 ? 1 : 0;
      const c = ch > 2 ? ch - 3 : ch;
      const inst = newParam.channels[ch].inst;
      for (let i = 0; i < 4; i++) {
        const ops = i === 0 ? 0 : (i === 1 ? 8 : (i === 2 ? 4 : 12));
        inst[i * 11 + 0] = R[p][0x50 + ops + c] & 0x1f; //AR
        inst[i * 11 + 1] = R[p][0x60 + ops + c] & 0x1f; //DR
        inst[i * 11 + 2] = R[p][0x70 + ops + c] & 0x1f; //SR
        inst[i * 11 + 3] = R[p][0x80 + ops + c] & 0x0f; //RR
        inst[i * 11 + 4] = (R[p][0x80 + ops + c] & 0xf0) >> 4; //SL
        inst[i * 11 + 5] = R[p][0x40 + ops + c] & 0x7f; //TL
        inst[i * 11 + 6] = (R[p][0x50 + ops + c] & 0xc0) >> 6; //KS
        inst[i * 11 + 7] = R[p][0x30 + ops + c] & 0x0f; //ML
        inst[i * 11 + 8] = (R[p][0x30 + ops + c] & 0x70) >> 4; //DT
        inst[i * 11 + 9] = (R[p][0x60 + ops + c] & 0x80) >> 7; //AM
        inst[i * 11 + 10] = R[p][0x90 + ops + c] & 0x0f; //SG
      }
      inst[44] = R[p][0xb0 + c] & 0x07; //AL
      inst[45] = (R[p][0xb0 + c] & 0x38) >> 3; //FB
      inst[46] = (R[p][0xb4 + c] & 0x38) >> 4; //AMS
      inst[47] = R[p][0xb4 + c] & 0x07; //FMS

      newParam.channels[ch].pan = (R[p][0xb4 + c] & 0xc0) >> 6;
      newParam.channels[ch].slot = (fmKey[ch] >> 4) & 0xff;

      let freq, octav, n = -1;
      if (ch !== 2 || !isFmEx) {
        freq = R[p][0xa0 + c] + (R[p][0xa4 + c] & 0x07) * 0x100;
        octav = (R[p][0xa4 + c] & 0x38) >> 3;
        newParam.channels[ch].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
        ff /= 1038;
        if ((fmKey[ch] & 1) !== 0) n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);

        const con = fmKey[ch] & 0xff;
        let v = 127;
        const m = md[R[p][0xb0 + c] & 7];
        //OP1
        v = (((con & 0x10) !== 0) && ((m & 0x10) !== 0) && v > (R[p][0x40 + c] & 0x7f)) ? (R[p][0x40 + c] & 0x7f) : v;
        //OP3
        v = (((con & 0x20) !== 0) && ((m & 0x20) !== 0) && v > (R[p][0x44 + c] & 0x7f)) ? (R[p][0x44 + c] & 0x7f) : v;
        //OP2
        v = (((con & 0x40) !== 0) && ((m & 0x40) !== 0) && v > (R[p][0x48 + c] & 0x7f)) ? (R[p][0x48 + c] & 0x7f) : v;
        //OP4
        v = (((con & 0x80) !== 0) && ((m & 0x80) !== 0) && v > (R[p][0x4c + c] & 0x7f)) ? (R[p][0x4c + c] & 0x7f) : v;
        newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ((R[p][0xb4 + c] & 0x80) !== 0 ? 1 : 0) * vol[ch] / 80.0), 0, 19);
        newParam.channels[ch].volumeR = clamp(Math.trunc((127 - v) / 127.0 * ((R[p][0xb4 + c] & 0x40) !== 0 ? 1 : 0) * vol[ch] / 80.0), 0, 19);
        if ((fmKey[ch] & 1) !== 0) {
          if ((R[p][0xb4 + c] & 0x80) !== 0) newParam.channels[ch].volumeL = Math.max(newParam.channels[ch].volumeL, fmMeterL);
          if ((R[p][0xb4 + c] & 0x40) !== 0) newParam.channels[ch].volumeR = Math.max(newParam.channels[ch].volumeR, fmMeterR);
        }
      } else {
        const m = md[R[0][0xb0 + 2] & 7];
        freq = R[0][0xa9] + (R[0][0xad] & 0x07) * 0x100;
        octav = (R[0][0xad] & 0x38) >> 3;
        newParam.channels[2].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
        ff /= 1038;
        // MDPlayer leaves out the -1 here (unlike YM2608); kept as is.
        if ((fmKey[2] & 0x10) !== 0 && ((m & 0x10) !== 0)) n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff), 0), 95);
        const v = ((m & 0x10) !== 0) ? R[p][0x40 + c] : 127;
        newParam.channels[2].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ((R[0][0xb4 + 2] & 0x80) !== 0 ? 1 : 0) * ch3SlotVol[0] / 80.0), 0, 19);
        newParam.channels[2].volumeR = clamp(Math.trunc((127 - v) / 127.0 * ((R[0][0xb4 + 2] & 0x40) !== 0 ? 1 : 0) * ch3SlotVol[0] / 80.0), 0, 19);
        if ((fmKey[2] & 0x10) !== 0) {
          if ((R[0][0xb4 + 2] & 0x80) !== 0) newParam.channels[2].volumeL = Math.max(newParam.channels[2].volumeL, fmMeterL);
          if ((R[0][0xb4 + 2] & 0x40) !== 0) newParam.channels[2].volumeR = Math.max(newParam.channels[2].volumeR, fmMeterR);
        }
      }
      newParam.channels[ch].note = n;
    }

    for (let ch = 6; ch < 9; ch++) { //FM EX
      const exReg = [2, 0, -6];
      const c = exReg[ch - 6];
      newParam.channels[ch].pan = 0;
      if (isFmEx) {
        const m = md[R[0][0xb0 + 2] & 7];
        let op = ch - 5;
        op = op === 1 ? 2 : (op === 2 ? 1 : op);
        const freq = R[0][0xa8 + c] + (R[0][0xac + c] & 0x07) * 0x100;
        const octav = (R[0][0xac + c] & 0x38) >> 3;
        newParam.channels[ch].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let n = -1;
        if ((fmKey[2] & (0x10 << (ch - 5))) !== 0 && ((m & (0x10 << op)) !== 0)) {
          let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
          ff /= 1038;
          n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
        }
        newParam.channels[ch].note = n;
        const v = ((m & (0x10 << op)) !== 0) ? R[0][0x42 + op * 4] : 127;
        newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ch3SlotVol[ch - 5] / 80.0), 0, 19);
        if ((fmKey[2] & (0x10 << (ch - 5))) !== 0) newParam.channels[ch].volumeL = Math.max(newParam.channels[ch].volumeL, fmMeterL);
      } else {
        newParam.channels[ch].note = -1;
        newParam.channels[ch].volumeL = 0;
      }
    }

    for (let ch = 0; ch < 3; ch++) { //SSG
      const channel = newParam.channels[ch + 9];
      const t = (R[0][0x07] & (0x1 << ch)) === 0;
      const n = (R[0][0x07] & (0x8 << ch)) === 0;
      channel.tn = (t ? 1 : 0) + (n ? 2 : 0);
      channel.volumeL = R[0][0x08 + ch] & 0xf;
      channel.volume = (t || n) ? (R[0][0x08 + ch] & 0xf) : 0;
      if (channel.volume > 0) channel.volume = Math.max(channel.volume, ssgMeter);
      const ft = R[0][0x00 + ch * 2];
      const ct = R[0][0x01 + ch * 2] & 0xf;
      const tp = (ct << 8) | ft;
      channel.freq = tp;
      if (channel.volumeL === 0 && (R[0][0x08 + ch] & 0x10) === 0) {
        channel.note = -1;
      } else if (tp === 0) {
        channel.note = -1;
      } else {
        const ftone = masterClock / (64.0 * tp) * ssgMul;
        channel.note = D.Common.searchSSGNote(ftone);
      }
      channel.ex = (R[0][0x08 + ch] & 0x10) !== 0;
    }

    newParam.nfrq = R[0][0x06] & 0x1f;
    newParam.efrq = R[0][0x0c] * 0x100 + R[0][0x0b];
    newParam.etype = R[0][0x0d] & 0xf;

    //ADPCM B
    const b = newParam.channels[12];
    b.pan = (R[0][0x11] & 0xc0) >> 6;
    if (adpcmVol[0] !== 0) b.volumeL = clamp(Math.trunc(adpcmVol[0] / 80), 0, 19);
    else if (b.volumeL > 0) b.volumeL--;
    if (adpcmVol[1] !== 0) b.volumeR = clamp(Math.trunc(adpcmVol[1] / 80), 0, 19);
    else if (b.volumeR > 0) b.volumeR--;
    const delta = (R[0][0x1a] << 8) | R[0][0x19];
    b.freq = delta;
    const frq = delta / 9447.0; // Delta=9447 at freq=8kHz
    b.note = (R[0][0x10] & 0x80) !== 0 ? D.Common.searchYM2608Adpcm(frq) : -1;
    if ((R[0][0x11] & 0xc0) === 0) b.note = -1;
    // The live output decides whether ADPCM-B is sounding, not the key register.
    if (adpcmBMeterL !== 0 || adpcmBMeterR !== 0) {
      b.volumeL = Math.max(b.volumeL, adpcmBMeterL);
      b.volumeR = Math.max(b.volumeR, adpcmBMeterR);
    }

    //ADPCM A
    for (let ch = 13; ch < 19; ch++) {
      const a = newParam.channels[ch];
      a.pan = (R[1][0x08 + ch - 13] & 0xc0) >> 6;
      a.volumeRL = R[1][ch - 13 + 0x08] & 0x1f;
      if (rhythm[ch - 13][0] !== 0) a.volumeL = clamp(Math.trunc(rhythm[ch - 13][0] / 80), 0, 19);
      else if (a.volumeL > 0) a.volumeL--;
      if (rhythm[ch - 13][1] !== 0) a.volumeR = clamp(Math.trunc(rhythm[ch - 13][1] / 80), 0, 19);
      else if (a.volumeR > 0) a.volumeR--;
      // Several voices can key on together; the core's key mask ties the mixed meter to rows.
      if ((this.adpcmAKeyMask & (1 << (ch - 13))) !== 0) {
        a.volumeL = Math.max(a.volumeL, adpcmAMeterL);
        a.volumeR = Math.max(a.volumeR, adpcmAMeterR);
      }
    }
  }

  screenDrawParams(fb) {
    const tp = 0;
    const oldParam = this.oldParam, newParam = this.newParam;
    //FM - SSG
    for (let c = 0; c < 9; c++) {
      const oyc = oldParam.channels[c];
      const nyc = newParam.channels[c];
      if (c === 2) {
        D.Volume(fb, 272 + 1, 8 + c * 8, 1, oyc, 'volumeL', nyc.volumeL, tp);
        D.Volume(fb, 272 + 1, 8 + c * 8, 2, oyc, 'volumeR', nyc.volumeR, tp);
        D.Pan(fb, 25, 8 + c * 8, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
        D.KeyBoardOPNA(fb, 33, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.InstOPNA(fb, 5, 17 * 8, c, oyc.inst, nyc.inst);
        D.Ch3YM2610(fb, c, oyc, 'mask', nyc.mask, oyc, 'ex', nyc.ex, tp);
        D.Slot(fb, 1 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      } else if (c < 6) {
        D.Volume(fb, 272 + 1, 8 + c * 8, 1, oyc, 'volumeL', nyc.volumeL, tp);
        D.Volume(fb, 272 + 1, 8 + c * 8, 2, oyc, 'volumeR', nyc.volumeR, tp);
        D.Pan(fb, 25, 8 + c * 8, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
        D.KeyBoardOPNA(fb, 33, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.InstOPNA(fb, 5, 17 * 8, c, oyc.inst, nyc.inst);
        D.ChYM2610(fb, c, oyc, 'mask', nyc.mask, tp);
        D.Slot(fb, 1 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      } else {
        //FMex
        D.Volume(fb, 272 + 1, 8 + c * 8, 0, oyc, 'volumeL', nyc.volumeL, tp);
        D.KeyBoardOPNA(fb, 33, 8 + c * 8, oyc, 'note', nyc.note, tp);
        chAt(fb, c, c, oyc, nyc.mask);
        D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      }
    }

    //SSG
    for (let c = 0; c < 3; c++) {
      const oyc = oldParam.channels[c + 9];
      const nyc = newParam.channels[c + 9];
      D.VolumeShort(fb, 280 + 1, 8 + (c + 9) * 8, 0, oyc, 'volume', nyc.volume, tp);
      D.KeyBoardOPNA(fb, 33, (c + 9) * 8 + 8, oyc, 'note', nyc.note, tp);
      D.TnOPNA(fb, 6, 2, c + 9, oyc, 'tn', nyc.tn, oyc, 'tntp', 0);
      chAt(fb, c + 9, c + 9, oyc, nyc.mask);
      D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + (c + 9) * 8, 0, oyc, 'freq', nyc.freq);
      D.font4HexByte(fb, 272 + 1, 8 + (c + 9) * 8, 0, oyc, 'volumeL', nyc.volumeL);
      D.drawNESSw(fb, 268 + 1, 8 + (c + 9) * 8, oyc, 'ex', nyc.ex);
    }

    //ADPCM B
    const ob = oldParam.channels[12], nb = newParam.channels[12];
    D.Volume(fb, 256, 8 + 13 * 8, 1, ob, 'volumeL', nb.volumeL, tp);
    D.Volume(fb, 256, 8 + 13 * 8, 2, ob, 'volumeR', nb.volumeR, tp);
    D.Pan(fb, 24, 8 + 13 * 8, ob, 'pan', nb.pan, ob, 'pantp', tp);
    D.ChYM2610(fb, 13, ob, 'mask', nb.mask, tp);
    D.KeyBoardOPNA(fb, 33, 8 + 13 * 8, ob, 'note', nb.note, tp);
    D.font4Hex16Bit(fb, 1 + 4 * 78, 8 + 13 * 8, 0, ob, 'freq', nb.freq);
    D.font4HexByte(fb, 272 + 1, 8 + 13 * 8, 0, ob, 'volume', nb.volume);

    //ADPCM A(Rhythm)
    for (let c = 0; c < 6; c++) {
      const oyc = oldParam.channels[c + 13];
      const nyc = newParam.channels[c + 13];
      D.VolumeYM2610Rhythm(fb, c, 1, oyc, 'volumeL', nyc.volumeL, tp);
      D.VolumeYM2610Rhythm(fb, c, 2, oyc, 'volumeR', nyc.volumeR, tp);
      D.PanYM2610Rhythm(fb, c, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
      D.font4Int2(fb, c * 4 * 15 + 9, 26 * 4, 0, 0, oyc, 'volumeRL', nyc.volumeRL);
    }
    for (let c = 0; c < 6; c++) D.ChYM2610Rhythm(fb, c, oldParam.channels[13 + c], 'mask', newParam.channels[13 + c].mask, tp);

    D.font4Hex12Bit(fb, 85 * 4, 30 * 4, 0, oldParam, 'timerA', newParam.timerA);
    D.font4HexByte(fb, 85 * 4, 32 * 4, 0, oldParam, 'timerB', newParam.timerB);
    //HardLFO NOISE ENV
    D.LfoSw(fb, 84 * 4, 18 * 8, oldParam, 'lfoSw', newParam.lfoSw);
    D.LfoFrq(fb, 84 * 4, 19 * 8, oldParam, 'lfoFrq', newParam.lfoFrq);
    D.Nfrq(fb, 84, 42, oldParam, 'nfrq', newParam.nfrq);
    D.Efrq(fb, 84, 44, oldParam, 'efrq', newParam.efrq);
    D.Etype(fb, 84, 46, oldParam, 'etype', newParam.etype);
    D.font4Int2(fb, 84 * 4, 50 * 4, 0, 0, oldParam, 'rhythmTotalLevel', newParam.rhythmTotalLevel);
    D.font4Int3(fb, 84 * 4, 52 * 4, 0, 3, oldParam, 'adpcmLevel', newParam.adpcmLevel);
  }
}
