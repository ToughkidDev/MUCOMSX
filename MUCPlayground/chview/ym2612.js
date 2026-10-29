// YM2612 (OPN2, the Mega Drive FM) panel, ported from MDPlayer4Mac (GPL-3.0):
// macos/MDPlayerUI/Visualizer/Ym2612Visualizer.cs + DrawBuffYm2612.cs (a port of MDPlayer's
// frmYM2612), with the YM2612 part of macos/MDPlayerCore/ChipRegister.cs (registers, key-on,
// the falling key-on levels and the DAC level). Rows are FM 1-5, FM-EX 1-3, then the
// channel 6 FM / DAC row, as on the Mac.
import * as D from './draw.js';

const md = [0x08 << 4, 0x08 << 4, 0x08 << 4, 0x08 << 4, 0x0c << 4, 0x0e << 4, 0x0e << 4, 0x0f << 4];

function params() {
  const p = { lfoSw: null, lfoFrq: -1, timerA: -1, timerB: -1, channels: D.channels(9) };
  for (const c of p.channels) { c.pcmMode = 0; c.pcmBuff = 0; }
  return p;
}

const rType = (mask) => D.images[mask ? 'rType_02' : 'rType_01'];
const clamp = (v) => Math.min(Math.max(Math.trunc(v), 0), 19);

// DrawBuffYm2612.KeyBoardOPNM: the keyboard of one row, and the note name.
function keyBoardOPNM(fb, row, o, nt) {
  if (o.note === nt) return;
  const y = (row + 1) * 8;
  const ot = o.note;
  if (ot >= 0 && ot < 12 * 8) {
    D.drawKbn(fb, 33 + D.Tables.kbl[(ot % 12) * 2] + Math.trunc(ot / 12) * 28, y, D.Tables.kbl[(ot % 12) * 2 + 1], 0);
  }
  if (nt >= 0 && nt < 12 * 8) {
    D.drawKbn(fb, 33 + D.Tables.kbl[(nt % 12) * 2] + Math.trunc(nt / 12) * 28, y, D.Tables.kbl[(nt % 12) * 2 + 1] + 4, 0);
  }
  D.drawFont8(fb, 329, y, 1, '   ');
  if (nt >= 0) {
    D.drawFont8(fb, 329, y, 1, D.Tables.kbn[nt % 12]);
    if (Math.trunc(nt / 12) < 10) D.drawFont8(fb, 345, y, 1, D.Tables.kbo[Math.trunc(nt / 12)]);
  }
  o.note = nt;
}

// DrawBuffYm2612.ChYM2612P / ChYM2612At: an FM badge (ch < 5) or an FM-EX badge (5 < ch < 10).
function chAt(fb, row, ch, o, nm) {
  const mask = !!nm;
  if (o.mask !== null && o.mask === mask) return;
  const y = 8 + row * 8;
  if (ch < 5) {
    fb.draw(1, y, rType(mask), 128, 0, 0, 16, 8);
    D.drawFont8(fb, 17, y, mask ? 1 : 0, String(ch + 1));
  } else if (ch > 5 && ch < 10) {
    fb.draw(1, y, rType(mask), 128, 32 * (ch - 5), 24, 32, 8);
  }
  o.mask = mask;
}

// DrawBuffYm2612.Ch3YM2612: channel 3's badge, "3" or "EX" in special mode.
function ch3(fb, o, nm, ne) {
  if (o.mask === nm && o.ex === ne) return;
  const mask = !!nm, y = 8 + 2 * 8;
  if (!ne) {
    fb.draw(1, y, rType(mask), 128, 0, 0, 16, 8);
    D.drawFont8(fb, 17, y, mask ? 1 : 0, '3');
  } else {
    fb.draw(1, y, rType(mask), 128, 0, 24, 24, 8);
  }
  o.mask = nm;
  o.ex = ne;
}

// DrawBuffYm2612.Ch6YM2612At: channel 6's badge, "6" (FM) or the PCM badge (DAC on).
function ch6At(fb, row, buff, o, nt, nm) {
  const mask = !!nm;
  if (buff === 0 && o.pcmMode === nt && o.mask !== null && o.mask === mask) return;
  const y = 8 + row * 8;
  if (nt === 0) {
    fb.draw(1, y, rType(mask), 128, 0, 0, 16, 8);
    D.drawFont8(fb, 17, y, mask ? 1 : 0, '6');
  } else {
    fb.draw(1, y, rType(mask), 128, 16, 0, 16, 8);
    D.drawFont8(fb, 17, y, 0, ' ');
  }
  o.pcmMode = nt;
  o.mask = mask;
}

// DrawBuffYm2612.InstOPN2: the operator table, three channels to a row of blocks.
function instOPN2(fb, x, y, c, oi, ni) {
  const sx = (c % 3) * 4 * 29 + x;
  const sy = Math.trunc(c / 3) * 8 * 6 + y;
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 11; i++) {
      const k = i + j * 11;
      if (oi[k] !== ni[k]) {
        D.drawFont4Int(fb, sx + i * 8 + (i > 5 ? 4 : 0), sy + j * 8, 0, i === 5 ? 3 : 2, ni[k]);
        oi[k] = ni[k];
      }
    }
  }
  const head = [[44, sx + 8 * 4], [45, sx + 8 * 6], [46, sx + 8 * 8 + 4], [47, sx + 8 * 11]];
  for (const [k, hx] of head) {
    if (oi[k] !== ni[k]) { D.drawFont4Int(fb, hx, sy - 16, 0, 2, ni[k]); oi[k] = ni[k]; }
  }
}

export class YM2612 {
  static plane = 'planeYM2612';

  constructor(clock) {
    this.clock = (clock & 0x3fffffff) || 7670454;
    // ChipRegister state
    this.reg = [new Array(0x100).fill(0), new Array(0x100).fill(0)];
    this.keyOn = [0, 0, 0, 0, 0, 0];
    this.keyOnCh3 = 0;
    this.vol = new Array(9).fill(0);
    this.ch3SlotVol = [0, 0, 0, 0];
    this.oldParam = params();
    this.newParam = params();
    for (const c of this.oldParam.channels) c.mask = null;   // draw every badge once
  }

  // ChipRegister.setYM2612Register
  write(port, addr, data) {
    const R = this.reg;
    R[port & 1][addr] = data;
    if (port === 0 && addr === 0x28) {
      const ch = (data & 0x3) + ((data & 0x4) > 0 ? 3 : 0);
      if (ch >= 0 && ch < 6) {
        if (ch !== 2 || (R[0][0x27] & 0xc0) !== 0x40) {
          if (ch !== 5 || (R[0][0x2b] & 0x80) === 0) {
            if ((data & 0xf0) !== 0) {
              this.keyOn[ch] = (data & 0xf0) | 1;
              this.vol[ch] = 256 * 6;
            } else {
              this.keyOn[ch] = data & 0xf0;
            }
          }
        } else {
          this.keyOn[2] = data & 0xf0;
          for (let i = 0; i < 4; i++) {
            const b = 0x10 << i;
            if ((this.keyOnCh3 & b) !== (data & b)) {
              if ((data & b) !== 0) this.ch3SlotVol[i] = 256 * 6;
              this.keyOnCh3 = (this.keyOnCh3 & ~b) | (data & b);
            }
          }
        }
      }
    }
    // PCM (DAC)
    if ((R[0][0x2b] & 0x80) > 0 && R[0][0x2a] > 0) this.vol[5] = Math.abs(R[0][0x2a] - 0x7f) * 20;
  }

  clearVis() {}

  // ChipRegister.updateVol
  updateVol() {
    const dec = (a, i) => { if (a[i] > 0) { a[i] -= 50; if (a[i] < 0) a[i] = 0; } };
    for (let i = 0; i < 9; i++) dec(this.vol, i);
    for (let i = 0; i < 4; i++) dec(this.ch3SlotVol, i);
  }

  // The Mac constructor: FM 1-5, Ch3 FM-EX 1-3, then the shared FM6/DAC (PCM) row.
  screenInit(fb) {
    D.reorderRows(fb, D.images[YM2612.plane], 8, 8, [0, 1, 2, 3, 4, 6, 7, 8, 5]);
  }

  screenChangeParams() {
    const np = this.newParam, R = this.reg, fmKey = this.keyOn, fmVol = this.vol, slotVol = this.ch3SlotVol;
    const isFmEx = (R[0][0x27] & 0x40) !== 0;
    np.channels[2].ex = isFmEx;
    np.lfoSw = (R[0][0x22] & 0x8) !== 0;
    np.lfoFrq = R[0][0x22] & 0x7;
    np.timerA = R[0][0x24] | ((R[0][0x25] & 0x3) << 8);
    np.timerB = R[0][0x26];

    const masterClock = this.clock, fmDiv = 6;
    const note = (freq, octav) => {
      let ff = freq / ((2 << 20) / (masterClock / (24 * fmDiv))) * (2 << (octav + 2));
      ff /= 1038;
      return Math.min(Math.max(D.Common.searchYM2608Adpcm(ff) - 1, 0), 95);
    };

    for (let ch = 0; ch < 6; ch++) {
      const p = ch > 2 ? 1 : 0, c = ch > 2 ? ch - 3 : ch, P = R[p];
      const nyc = np.channels[ch];
      nyc.slot = (fmKey[ch] >> 4) & 0xff;
      for (let i = 0; i < 4; i++) {
        const ops = i === 0 ? 0 : (i === 1 ? 8 : (i === 2 ? 4 : 12));
        const inst = nyc.inst, o = i * 11;
        inst[o + 0] = P[0x50 + ops + c] & 0x1f; // AR
        inst[o + 1] = P[0x60 + ops + c] & 0x1f; // DR
        inst[o + 2] = P[0x70 + ops + c] & 0x1f; // SR
        inst[o + 3] = P[0x80 + ops + c] & 0x0f; // RR
        inst[o + 4] = (P[0x80 + ops + c] & 0xf0) >> 4; // SL
        inst[o + 5] = P[0x40 + ops + c] & 0x7f; // TL
        inst[o + 6] = (P[0x50 + ops + c] & 0xc0) >> 6; // KS
        inst[o + 7] = P[0x30 + ops + c] & 0x0f; // ML
        inst[o + 8] = (P[0x30 + ops + c] & 0x70) >> 4; // DT
        inst[o + 9] = (P[0x60 + ops + c] & 0x80) >> 7; // AM
        inst[o + 10] = P[0x90 + ops + c] & 0x0f; // SG
      }
      nyc.inst[44] = P[0xb0 + c] & 0x07; // AL
      nyc.inst[45] = (P[0xb0 + c] & 0x38) >> 3; // FB
      nyc.inst[46] = (P[0xb4 + c] & 0x38) >> 4; // AMS
      nyc.inst[47] = P[0xb4 + c] & 0x07; // FMS
      nyc.pan = (P[0xb4 + c] & 0xc0) >> 6;

      let n = -1;
      if (ch !== 2 || !isFmEx) {
        const freq = P[0xa0 + c] + (P[0xa4 + c] & 0x07) * 0x100;
        const octav = (P[0xa4 + c] & 0x38) >> 3;
        nyc.freq = (freq & 0x7ff) | ((octav & 7) << 11);
        if ((fmKey[ch] & 1) !== 0) n = note(freq, octav);
        const con = fmKey[ch] & 0xff;
        const m = md[P[0xb0 + c] & 7];
        let v = 127;
        v = (con & 0x10) !== 0 && (m & 0x10) !== 0 && v > (P[0x40 + c] & 0x7f) ? P[0x40 + c] & 0x7f : v;
        v = (con & 0x20) !== 0 && (m & 0x20) !== 0 && v > (P[0x44 + c] & 0x7f) ? P[0x44 + c] & 0x7f : v;
        v = (con & 0x40) !== 0 && (m & 0x40) !== 0 && v > (P[0x48 + c] & 0x7f) ? P[0x48 + c] & 0x7f : v;
        v = (con & 0x80) !== 0 && (m & 0x80) !== 0 && v > (P[0x4c + c] & 0x7f) ? P[0x4c + c] & 0x7f : v;
        nyc.volumeL = clamp((127 - v) / 127.0 * ((P[0xb4 + c] & 0x80) !== 0 ? 1 : 0) * fmVol[ch] / 80.0);
        nyc.volumeR = clamp((127 - v) / 127.0 * ((P[0xb4 + c] & 0x40) !== 0 ? 1 : 0) * fmVol[ch] / 80.0);
      } else {
        const m = md[R[0][0xb0 + 2] & 7];
        const freq = R[0][0xa9] + (R[0][0xad] & 0x07) * 0x100;
        const octav = (R[0][0xad] & 0x38) >> 3;
        np.channels[2].freq = (freq & 0x7ff) | ((octav & 7) << 11);
        if ((fmKey[2] & 0x10) !== 0 && (m & 0x10) !== 0) n = note(freq, octav);
        const v = (m & 0x10) !== 0 ? P[0x40 + c] : 127;
        np.channels[2].volumeL = clamp((127 - v) / 127.0 * ((R[0][0xb4 + 2] & 0x80) !== 0 ? 1 : 0) * slotVol[0] / 80.0);
        np.channels[2].volumeR = clamp((127 - v) / 127.0 * ((R[0][0xb4 + 2] & 0x40) !== 0 ? 1 : 0) * slotVol[0] / 80.0);
      }
      nyc.note = n;
    }

    // Ch3 special mode: the three extra operator slots (the fourth uses channel 3's own).
    const exReg = [2, 0, -6];
    for (let ch = 6; ch < 9; ch++) {
      const c = exReg[ch - 6];
      const nyc = np.channels[ch];
      nyc.pan = 0;
      if (isFmEx) {
        const m = md[R[0][0xb0 + 2] & 7];
        let op = ch - 5;
        op = op === 1 ? 2 : (op === 2 ? 1 : op);
        const freq = R[0][0xa8 + c] + (R[0][0xac + c] & 0x07) * 0x100;
        const octav = (R[0][0xac + c] & 0x38) >> 3;
        nyc.freq = (freq & 0x7ff) | ((octav & 7) << 11);
        nyc.note = (fmKey[2] & (0x10 << (ch - 5))) !== 0 && (m & (0x10 << op)) !== 0 ? note(freq, octav) : -1;
        const v = (m & (0x10 << op)) !== 0 ? R[0][0x42 + op * 4] : 127;
        nyc.volumeL = clamp((127 - v) / 127.0 * slotVol[ch - 5] / 80.0);
      } else {
        nyc.note = -1;
        nyc.volumeL = 0;
      }
    }

    const ch6 = np.channels[5];
    ch6.pcmMode = (R[0][0x2b] & 0x80) >> 7;
    if (ch6.pcmBuff > 0) ch6.pcmBuff--;
    if (ch6.pcmMode !== 0) {
      ch6.volumeL = Math.min(Math.max(Math.trunc(fmVol[5] / 80), 0), 19);
      ch6.volumeR = ch6.volumeL;
    }
  }

  screenDrawParams(fb) {
    const op = this.oldParam, np = this.newParam;
    for (let c = 0; c < 9; c++) {
      const o = op.channels[c], n = np.channels[c];
      if (c < 5) {
        D.Volume(fb, 289, 8 + c * 8, 1, o, 'volumeL', n.volumeL, 0);
        D.Volume(fb, 289, 8 + c * 8, 2, o, 'volumeR', n.volumeR, 0);
        D.Pan(fb, 25, 8 + c * 8, o, 'pan', n.pan, o, 'pantp', 0);
        keyBoardOPNM(fb, c, o, n.note);
        instOPN2(fb, 13, 96, c, o.inst, n.inst);
        if (c === 2) ch3(fb, o, n.mask, n.ex); else chAt(fb, c, c, o, n.mask);
        D.Slot(fb, 1 + 4 * 64, 8 + c * 8, o, 'slot', n.slot);
        D.font4Hex16Bit(fb, 1 + 4 * 68, 8 + c * 8, 0, o, 'freq', n.freq);
      } else if (c === 5) {
        const row = 8;   // channel 6 / DAC, under the FM-EX rows
        D.Pan(fb, 25, 8 + row * 8, o, 'pan', n.pan, o, 'pantp', 0);
        instOPN2(fb, 13, 96, c, o.inst, n.inst);
        ch6At(fb, row, n.pcmBuff, o, n.pcmMode, n.mask);
        D.Volume(fb, 289, 8 + row * 8, 1, o, 'volumeL', n.volumeL, 0);
        D.Volume(fb, 289, 8 + row * 8, 2, o, 'volumeR', n.volumeR, 0);
        keyBoardOPNM(fb, row, o, n.note);
        D.Slot(fb, 1 + 4 * 64, 8 + row * 8, o, 'slot', n.slot);
        D.font4Hex16Bit(fb, 1 + 4 * 68, 8 + row * 8, 0, o, 'freq', n.freq);
      } else {
        const row = c - 1;   // FM-EX 1-3
        D.Volume(fb, 289, 8 + row * 8, 0, o, 'volumeL', n.volumeL, 0);
        keyBoardOPNM(fb, row, o, n.note);
        chAt(fb, row, c, o, n.mask);
        o.freq = 0;
        // The Mac's DrawFont4Hex16Bit shows an unset (-1) frequency as 0000.
        D.font4Hex16Bit(fb, 1 + 4 * 68, 8 + row * 8, 0, o, 'freq', Math.max(n.freq, 0));
      }
    }
    D.LfoSw(fb, 16 + 1, 176, op, 'lfoSw', np.lfoSw);
    D.LfoFrq(fb, 64 + 1, 176, op, 'lfoFrq', np.lfoFrq);
    D.font4Hex12Bit(fb, 1 + 29 * 4, 44 * 4, 0, op, 'timerA', np.timerA);
    D.font4HexByte(fb, 1 + 43 * 4, 44 * 4, 0, op, 'timerB', np.timerB);
  }
}
