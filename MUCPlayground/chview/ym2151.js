// YM2151 (OPM) panel, ported from MDPlayer4Mac (GPL-3.0):
// macos/MDPlayerUI/Visualizer/Ym2151Visualizer.cs + DrawBuffYm2151.cs, with the YM2151
// part of macos/MDPlayerCore/ChipRegister.cs (register, key-on, level and AMD/PMD
// tracking).
import * as D from './draw.js';

// CON (algorithm) to the carrier operators, in the key-on bit order:
// 7  6   5   4   3   2  1  0
// x, C2, M2, C1, M1, x, x, x
const md = [0x40, 0x40, 0x40, 0x40, 0x50, 0x70, 0x70, 0x78];

function params() {
  return { ne: -1, nfrq: -1, lfrq: -1, pmd: -1, amd: -1, timerA: -1, timerB: -1, waveform: -1, lfosync: -1,
    channels: D.channels(8) };
}

export class YM2151 {
  static plane = 'planeE';

  constructor(clock) {
    this.clock = clock || 3579545;
    // Key-code note correction. MDPlayer4Mac uses 0 (Windows MDPlayer adds its VGM
    // driver's clock-based YM2151Hosei, 1 at 3579545 Hz).
    this.hosei = 0;
    // ChipRegister state
    this.reg = new Array(0x100).fill(0);
    this.keyOn = new Array(8).fill(0);
    this.vol = new Array(8).fill(0);
    this.amd = -1;
    this.pmd = -1;
    // form state
    this.oldParam = params();
    this.newParam = params();
  }

  // ChipRegister.setYM2151Register
  write(dPort, dAddr, dData) {
    this.reg[dAddr] = dData;
    if (dAddr === 0x08) { //Key-On/Off
      const ch = dData & 0x7;
      const con = dData & 0x78;
      if (con !== 0) {
        this.keyOn[ch] = con | 1;
        this.vol[ch] = 256 * 6;
      } else {
        this.keyOn[ch] = con;
      }
    }
    if (dAddr === 0x19) { //AMD/PMD
      if ((dData & 0x80) !== 0) this.pmd = dData & 0x7f;
      else this.amd = dData & 0x7f;
    }
  }

  // No emulator-side meters on this panel.
  clearVis() {}

  // ChipRegister.updateVol
  updateVol() {
    for (let i = 0; i < 8; i++) {
      if (this.vol[i] > 0) { this.vol[i] -= 50; if (this.vol[i] < 0) this.vol[i] = 0; }
    }
  }

  // The Mac constructor only draws the plane, which FrameBuffer has already done.
  screenInit(fb) {}

  screenChangeParams() {
    const newParam = this.newParam;
    const R = this.reg;
    const fmKey = this.keyOn;
    const vol = this.vol;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

    for (let ch = 0; ch < 8; ch++) {
      const inst = newParam.channels[ch].inst;
      for (let i = 0; i < 4; i++) {
        const ops = i === 0 ? 0 : (i === 1 ? 16 : (i === 2 ? 8 : 24));
        inst[i * 11 + 0] = R[0x80 + ops + ch] & 0x1f; //AR
        inst[i * 11 + 1] = R[0xa0 + ops + ch] & 0x1f; //DR
        inst[i * 11 + 2] = R[0xc0 + ops + ch] & 0x1f; //SR
        inst[i * 11 + 3] = R[0xe0 + ops + ch] & 0x0f; //RR
        inst[i * 11 + 4] = (R[0xe0 + ops + ch] & 0xf0) >> 4; //SL
        inst[i * 11 + 5] = R[0x60 + ops + ch] & 0x7f; //TL
        inst[i * 11 + 6] = (R[0x80 + ops + ch] & 0xc0) >> 6; //KS
        inst[i * 11 + 7] = R[0x40 + ops + ch] & 0x0f; //ML
        inst[i * 11 + 8] = (R[0x40 + ops + ch] & 0x70) >> 4; //DT
        inst[i * 11 + 9] = (R[0xc0 + ops + ch] & 0xc0) >> 6; //DT2
        inst[i * 11 + 10] = (R[0xa0 + ops + ch] & 0x80) >> 7; //AM
      }
      inst[44] = R[0x20 + ch] & 0x07; //AL
      inst[45] = (R[0x20 + ch] & 0x38) >> 3; //FB
      inst[46] = R[0x38 + ch] & 0x3; //AMS
      inst[47] = (R[0x38 + ch] & 0x70) >> 4; //PMS

      newParam.channels[ch].slot = (fmKey[ch] >> 3) & 0xff;
      const p = (R[0x20 + ch] & 0xc0) >> 6;
      newParam.channels[ch].pan = p === 1 ? 2 : (p === 2 ? 1 : p);
      let note = R[0x28 + ch] & 0x0f;
      note = note < 3 ? note : (note < 7 ? note - 1 : (note < 11 ? note - 2 : note - 3));
      const oct = (R[0x28 + ch] & 0x70) >> 4;
      newParam.channels[ch].note = (fmKey[ch] & 1) !== 0 ? (oct * 12 + note + this.hosei) : -1;

      const con = fmKey[ch] & 0xff;
      let v = 127;
      const m = md[R[0x20 + ch] & 7];
      const carrierOp = con & m;
      //OP1 M1
      v = (((carrierOp & 0x08) !== 0) && v > (R[0x60 + ch] & 0x7f)) ? (R[0x60 + ch] & 0x7f) : v;
      //OP3 C1
      v = (((carrierOp & 0x10) !== 0) && v > (R[0x68 + ch] & 0x7f)) ? (R[0x68 + ch] & 0x7f) : v;
      //OP2 M2
      v = (((carrierOp & 0x20) !== 0) && v > (R[0x70 + ch] & 0x7f)) ? (R[0x70 + ch] & 0x7f) : v;
      //OP4 C2
      v = (((carrierOp & 0x40) !== 0) && v > (R[0x78 + ch] & 0x7f)) ? (R[0x78 + ch] & 0x7f) : v;
      newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ((R[0x20 + ch] & 0x80) !== 0 ? 1 : 0) * vol[ch] / 80.0), 0, 19);
      newParam.channels[ch].volumeR = clamp(Math.trunc((127 - v) / 127.0 * ((R[0x20 + ch] & 0x40) !== 0 ? 1 : 0) * vol[ch] / 80.0), 0, 19);
      newParam.channels[ch].kc = R[0x28 + ch] & 0x7f;
      newParam.channels[ch].kf = (R[0x30 + ch] & 0xfc) >> 2;
    }
    newParam.ne = (R[0x0f] & 0x80) >> 7;
    newParam.nfrq = R[0x0f] & 0x1f;
    newParam.lfrq = R[0x18] & 0xff;
    newParam.pmd = this.pmd;
    newParam.amd = this.amd;
    newParam.timerA = R[0x10] | ((R[0x11] & 0x3) << 8);
    newParam.timerB = R[0x12];
    newParam.waveform = R[0x1b] & 0x3;
    newParam.lfosync = (R[0x01] & 0x02) >> 1;
  }

  screenDrawParams(fb) {
    const tp = 0;
    const oldParam = this.oldParam, newParam = this.newParam;
    for (let c = 0; c < 8; c++) {
      const oyc = oldParam.channels[c];
      const nyc = newParam.channels[c];
      D.InstOPM(fb, 9, 11, c, oyc.inst, nyc.inst);
      D.Pan(fb, 25, 8 + c * 8, oyc, 'pan', nyc.pan, oyc, 'pantp', tp);
      D.KeyBoardOPM(fb, c, oyc, 'note', nyc.note, tp);
      D.Slot(fb, 1 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
      D.Volume(fb, 68 * 4 + 1, 8 + c * 8, 1, oyc, 'volumeL', nyc.volumeL, tp);
      D.Volume(fb, 68 * 4 + 1, 8 + c * 8, 2, oyc, 'volumeR', nyc.volumeR, tp);
      D.ChYM2151(fb, c, oyc, 'mask', nyc.mask, tp);
      D.KcYM2151(fb, c, oyc, 'kc', nyc.kc);
      D.KfYM2151(fb, c, oyc, 'kf', nyc.kf);
    }
    D.NeYM2151(fb, oldParam, 'ne', newParam.ne);
    D.NfrqYM2151(fb, oldParam, 'nfrq', newParam.nfrq);
    D.LfrqYM2151(fb, oldParam, 'lfrq', newParam.lfrq);
    D.AmdYM2151(fb, oldParam, 'amd', newParam.amd);
    D.PmdYM2151(fb, oldParam, 'pmd', newParam.pmd);
    D.font4Hex12Bit(fb, 82 * 4 + 1, 22 * 8, 0, oldParam, 'timerA', newParam.timerA);
    D.font4HexByte(fb, 82 * 4 + 1, 23 * 8, 0, oldParam, 'timerB', newParam.timerB);
    D.WaveFormYM2151(fb, oldParam, 'waveform', newParam.waveform);
    D.LfoSyncYM2151(fb, oldParam, 'lfosync', newParam.lfosync);
  }
}
