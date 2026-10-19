// YM2203 (OPN) panel, ported from MDPlayer4Mac (GPL-3.0):
// macos/MDPlayerUI/Visualizer/Ym2203Visualizer.cs + DrawBuffYm2203.cs, with the YM2203
// part of macos/MDPlayerCore/ChipRegister.cs (register, key-on and level tracking).
// Rows are grouped FM 1-3, FM-EX 1-3, then SSG 1-3, as on the Mac.
import * as D from './draw.js';

const md = [0x08 << 4, 0x08 << 4, 0x08 << 4, 0x08 << 4, 0x0c << 4, 0x0e << 4, 0x0e << 4, 0x0f << 4];
const fmDivTbl = [6, 3, 2];
const ssgDivTbl = [4, 2, 1];

function params() {
  return { nfrq: -1, efrq: -1, etype: -1, channels: D.channels(9) };
}

// DrawBuffYm2203.ChYm2203At: the channel badge drawn at a display row, only when the mask
// state changes (the plane already shows the unmasked badges).
function chAt(fb, row, ch, o, nm) {
  const mask = !!nm;
  if (o.mask !== null && o.mask !== undefined && o.mask === mask) return;
  D.ChYM2203_P(fb, 0, 8 + row * 8, ch, mask, 0);
  o.mask = mask;
}

export class YM2203 {
  static plane = 'planeYM2203';

  constructor(clock) {
    this.clock = clock;
    // ChipRegister state
    this.reg = new Array(0x100).fill(0);
    this.keyOn = [0, 0, 0, 0, 0, 0];
    this.keyOnCh3 = 0;
    this.vol = new Array(9).fill(0);
    this.ch3SlotVol = [0, 0, 0, 0];
    // form state
    this.oldParam = params();
    this.newParam = params();
  }

  // ChipRegister.setYM2203Register (the chip has one port)
  write(dPort, dAddr, dData) {
    const r = this.reg;
    if (dAddr !== 0x2d && dAddr !== 0x2e && dAddr !== 0x2f) r[dAddr] = dData;
    else r[0x2d] = dAddr - 0x2d;

    if (dAddr === 0x28) {
      const ch = dData & 0x3;
      if (ch >= 0 && ch < 3) {
        if (ch !== 2 || (r[0x27] & 0xc0) !== 0x40) {
          if ((dData & 0xf0) !== 0) {
            this.keyOn[ch] = (dData & 0xf0) | 1;
            this.vol[ch] = 256 * 6;
          } else {
            this.keyOn[ch] &= 0xfe;
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
  }

  // No emulator-side meters on this panel.
  clearVis() {}

  // ChipRegister.updateVol
  updateVol() {
    const dec = (a, i) => { if (a[i] > 0) { a[i] -= 50; if (a[i] < 0) a[i] = 0; } };
    for (let i = 0; i < 6; i++) dec(this.vol, i);
    for (let i = 0; i < 4; i++) dec(this.ch3SlotVol, i);
  }

  // The Mac constructor: the plane is already drawn by FrameBuffer; regroup its rows as
  // FM 1-3, FM-EX 1-3, then SSG 1-3 (PixelScreen.ReorderRowsFrom).
  screenInit(fb) {
    D.reorderRows(fb, D.images[YM2203.plane], 8, 8, [0, 1, 2, 6, 7, 8, 3, 4, 5]);
  }

  screenChangeParams() {
    const newParam = this.newParam;
    const R = this.reg;
    const fmKey = this.keyOn;
    const vol = this.vol;
    const ch3SlotVol = this.ch3SlotVol;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

    const isFmEx = (R[0x27] & 0x40) > 0;
    newParam.channels[2].ex = isFmEx;

    const defaultMasterClock = 7987200 / 2;
    let ssgMul = 1.0;
    let masterClock = defaultMasterClock;
    if (this.clock) {
      ssgMul = this.clock / defaultMasterClock;
      masterClock = this.clock;
    }
    let divInd = R[0x2d];
    if (divInd < 0 || divInd > 2) divInd = 0;
    const fmDiv = fmDivTbl[divInd];
    const ssgDiv = ssgDivTbl[divInd];
    ssgMul = ssgMul / ssgDiv * 4;

    for (let ch = 0; ch < 3; ch++) {
      const c = ch;
      const inst = newParam.channels[ch].inst;
      for (let i = 0; i < 4; i++) {
        const ops = i === 0 ? 0 : (i === 1 ? 8 : (i === 2 ? 4 : 12));
        inst[i * 11 + 0] = R[0x50 + ops + c] & 0x1f; //AR
        inst[i * 11 + 1] = R[0x60 + ops + c] & 0x1f; //DR
        inst[i * 11 + 2] = R[0x70 + ops + c] & 0x1f; //SR
        inst[i * 11 + 3] = R[0x80 + ops + c] & 0x0f; //RR
        inst[i * 11 + 4] = (R[0x80 + ops + c] & 0xf0) >> 4; //SL
        inst[i * 11 + 5] = R[0x40 + ops + c] & 0x7f; //TL
        inst[i * 11 + 6] = (R[0x50 + ops + c] & 0xc0) >> 6; //KS
        inst[i * 11 + 7] = R[0x30 + ops + c] & 0x0f; //ML
        inst[i * 11 + 8] = (R[0x30 + ops + c] & 0x70) >> 4; //DT
        inst[i * 11 + 9] = (R[0x60 + ops + c] & 0x80) >> 7; //AM
        inst[i * 11 + 10] = R[0x90 + ops + c] & 0x0f; //SG
      }
      inst[44] = R[0xb0 + c] & 0x07; //AL
      inst[45] = (R[0xb0 + c] & 0x38) >> 3; //FB
      inst[46] = (R[0xb4 + c] & 0x38) >> 4; //AMS
      inst[47] = R[0xb4 + c] & 0x07; //FMS

      newParam.channels[ch].pan = 3;
      newParam.channels[ch].slot = (fmKey[ch] >> 4) & 0xff;

      let freq, octav, n = -1;
      if (ch !== 2 || !isFmEx) {
        octav = (R[0xa4 + c] & 0x38) >> 3;
        freq = R[0xa0 + c] + (R[0xa4 + c] & 0x07) * 0x100;
        newParam.channels[ch].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let ff = freq / ((2 << 20) / (masterClock / (12 * fmDiv))) * (2 << (octav + 2));
        ff /= 1038;
        newParam.channels[ch].slot = 0;
        if ((fmKey[ch] & 1) !== 0) {
          n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
          newParam.channels[ch].slot = (fmKey[ch] >> 4) & 0xff;
        }
        const con = fmKey[ch] & 0xff;
        let v = 127;
        const m = md[R[0xb0 + c] & 7];
        //OP1
        v = (((con & 0x10) !== 0) && ((m & 0x10) !== 0) && v > (R[0x40 + c] & 0x7f)) ? (R[0x40 + c] & 0x7f) : v;
        //OP3
        v = (((con & 0x20) !== 0) && ((m & 0x20) !== 0) && v > (R[0x44 + c] & 0x7f)) ? (R[0x44 + c] & 0x7f) : v;
        //OP2
        v = (((con & 0x40) !== 0) && ((m & 0x40) !== 0) && v > (R[0x48 + c] & 0x7f)) ? (R[0x48 + c] & 0x7f) : v;
        //OP4
        v = (((con & 0x80) !== 0) && ((m & 0x80) !== 0) && v > (R[0x4c + c] & 0x7f)) ? (R[0x4c + c] & 0x7f) : v;
        newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * vol[ch] / 80.0), 0, 19);
      } else {
        const m = md[R[0xb0 + 2] & 7];
        freq = R[0xa9] + (R[0xad] & 0x07) * 0x100;
        octav = (R[0xad] & 0x38) >> 3;
        newParam.channels[2].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let ff = freq / ((2 << 20) / (masterClock / (12 * fmDiv))) * (2 << (octav + 2));
        ff /= 1038;
        if ((fmKey[2] & 0x10) !== 0 && ((m & 0x10) !== 0)) n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
        const v = ((m & 0x10) !== 0) ? R[0x40 + c] : 127;
        newParam.channels[2].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ch3SlotVol[0] / 80.0), 0, 19);
      }
      newParam.channels[ch].note = n;
    }

    for (let ch = 3; ch < 6; ch++) { //FM EX
      const exReg = [2, 0, -6];
      const c = exReg[ch - 3];
      newParam.channels[ch].pan = 0;
      if (isFmEx) {
        const m = md[R[0xb0 + 2] & 7];
        let op = ch - 2;
        op = op === 1 ? 2 : (op === 2 ? 1 : op);
        const freq = R[0xa8 + c] + (R[0xac + c] & 0x07) * 0x100;
        const octav = (R[0xac + c] & 0x38) >> 3;
        newParam.channels[ch].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        let n = -1;
        if ((fmKey[2] & (0x20 << (ch - 3))) !== 0 && ((m & (0x10 << op)) !== 0)) {
          let ff = freq / ((2 << 20) / (masterClock / (12 * fmDiv))) * (2 << (octav + 2));
          ff /= 1038;
          n = Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
        }
        newParam.channels[ch].note = n;
        const v = ((m & (0x10 << op)) !== 0) ? R[0x42 + op * 4] : 127;
        newParam.channels[ch].volumeL = clamp(Math.trunc((127 - v) / 127.0 * ch3SlotVol[ch - 2] / 80.0), 0, 19);
      } else {
        newParam.channels[ch].note = -1;
        newParam.channels[ch].volumeL = 0;
      }
    }

    for (let ch = 0; ch < 3; ch++) { //SSG
      const channel = newParam.channels[ch + 6];
      const t = (R[0x07] & (0x1 << ch)) === 0;
      const n = (R[0x07] & (0x8 << ch)) === 0;
      channel.tn = (t ? 1 : 0) + (n ? 2 : 0);
      channel.volumeL = R[0x08 + ch] & 0xf;
      channel.volume = (t || n) ? (R[0x08 + ch] & 0xf) : 0;
      const ft = R[0x00 + ch * 2];
      const ct = R[0x01 + ch * 2];
      let tp = (ct << 8) | ft;
      channel.freq = tp;
      if (!t && !n && channel.volume > 0) channel.volume--;
      if (channel.volume === 0 && (R[0x08 + ch] & 0x10) === 0) {
        channel.note = -1;
      } else {
        if (tp === 0) tp = 1;
        // 7987200: MDPlayer's note table is based on the OPNA master clock.
        const ftone = Math.fround(7987200.0 / (64.0 * tp) * ssgMul);
        channel.note = D.Common.searchSSGNote(ftone);
      }
      channel.ex = (R[0x08 + ch] & 0xf0) !== 0;
    }

    newParam.nfrq = R[0x06] & 0x1f;
    newParam.efrq = R[0x0c] * 0x100 + R[0x0b];
    newParam.etype = R[0x0d] & 0xf;
  }

  screenDrawParams(fb) {
    const tp = 0;
    const oldParam = this.oldParam, newParam = this.newParam;
    for (let c = 0; c < 6; c++) {
      const oyc = oldParam.channels[c];
      const nyc = newParam.channels[c];
      if (c === 2) {
        D.Volume(fb, 272, 8 + c * 8, 0, oyc, 'volumeL', nyc.volumeL, tp);
        D.KeyBoardOPNA(fb, 32, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.Inst(fb, 1, 12, c, oyc.inst, nyc.inst);
        D.Ch3YM2203(fb, c, oyc, 'mask', nyc.mask, oyc, 'ex', nyc.ex, tp);
        D.Slot(fb, 0 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 0 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      } else if (c < 3) {
        D.Volume(fb, 272, 8 + c * 8, 0, oyc, 'volumeL', nyc.volumeL, tp);
        D.KeyBoardOPNA(fb, 32, 8 + c * 8, oyc, 'note', nyc.note, tp);
        D.Inst(fb, 1, 12, c, oyc.inst, nyc.inst);
        D.ChYM2203(fb, c, oyc, 'mask', nyc.mask, tp);
        D.Slot(fb, 0 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 0 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      } else {
        D.Volume(fb, 272, 8 + c * 8, 0, oyc, 'volumeL', nyc.volumeL, tp);
        D.KeyBoardOPNA(fb, 32, 8 + c * 8, oyc, 'note', nyc.note, tp);
        chAt(fb, c, c, oyc, nyc.mask);
        D.Slot(fb, 0 + 4 * 64, 8 + c * 8, oyc, 'slot', nyc.slot);
        D.font4Hex16Bit(fb, 0 + 4 * 78, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      }
    }

    for (let c = 0; c < 3; c++) {
      const oyc = oldParam.channels[c + 6];
      const nyc = newParam.channels[c + 6];
      D.VolumeShort(fb, 280 + 0, 8 + (c + 6) * 8, 0, oyc, 'volume', nyc.volume, tp);
      D.KeyBoardOPNA(fb, 32, 8 + (c + 6) * 8, oyc, 'note', nyc.note, tp);
      D.Tn(fb, 6, 2, c + 6, oyc, 'tn', nyc.tn, oyc, 'tntp', 0);
      chAt(fb, c + 6, c + 6, oyc, nyc.mask);
      D.drawNESSw(fb, 268 + 0, 8 + (c + 6) * 8, oyc, 'ex', nyc.ex);
      D.font4Hex16Bit(fb, 0 + 4 * 78, 8 + (c + 6) * 8, 0, oyc, 'freq', nyc.freq);
      D.font4HexByte(fb, 272 + 0, 8 + (c + 6) * 8, 0, oyc, 'volumeL', nyc.volumeL);
    }

    D.Nfrq(fb, 5, 32, oldParam, 'nfrq', newParam.nfrq);
    D.Efrq(fb, 18, 32, oldParam, 'efrq', newParam.efrq);
    D.Etype(fb, 33, 32, oldParam, 'etype', newParam.etype);
  }
}
