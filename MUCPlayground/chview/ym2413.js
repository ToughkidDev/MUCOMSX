// YM2413 (OPLL) panel: MDPlayer4Mac's Ym2413Visualizer + DrawBuffYm2413 (a port of
// MDPlayer's frmYM2413) and the YM2413 part of its ChipRegister (registers and key-on
// tracking), ported from MDPlayer / MDPlayer4Mac (GPL-3.0).
import * as D from './draw.js';

// Common.searchSegaPCMNote
function searchSegaPCMNote(ml) {
  let m = Infinity, n = 0;
  for (let i = 0; i < 12 * 8; i++) {
    const a = Math.abs(ml - (D.Tables.pcmMulTbl[i % 12 + 12] * Math.pow(2, Math.trunc(i / 12) - 4)));
    if (m > a) { m = a; n = i; }
  }
  return n;
}

export class YM2413 {
  static plane = 'planeYM2413';

  constructor(clock) {
    this.clock = clock;
    // ChipRegister state
    this.reg = new Array(0x39).fill(0);
    this.rhythmMode = false;
    this.keyOn = new Array(14).fill(false);     // ChipKeyInfo.On: set at key-on, cleared when read
    this.keyOff = new Array(14).fill(true);     // ChipKeyInfo.Off
    // form state
    this.oldParam = { channels: D.channels(14) };
    this.newParam = { channels: D.channels(14) };
  }

  // ChipRegister.setYM2413Register
  write(port, dAddr, dData) {
    if (dAddr < 0 || dAddr >= this.reg.length) return;
    this.reg[dAddr] = dData;
    if (dAddr === 0x0e) this.rhythmMode = (dData & 0x20) !== 0;
    if (dAddr >= 0x20 && dAddr <= 0x28) {
      const ch = dAddr - 0x20;
      if ((dData & 0x10) === 0) {
        this.keyOff[ch] = true;
      } else {
        if (this.keyOff[ch]) this.keyOn[ch] = true;
        this.keyOff[ch] = false;
      }
    }
    if (dAddr === 0x0e) {
      for (let c = 0; c < 5; c++) {
        if ((dData & (0x10 >> c)) === 0) {
          this.keyOff[c + 9] = true;
        } else {
          if (this.keyOff[c + 9]) this.keyOn[c + 9] = true;
          this.keyOff[c + 9] = false;
        }
      }
    }
  }

  // ChipRegister.getYM2413KeyInfo
  takeKeyInfo() {
    const ki = { On: this.keyOn.slice(), Off: this.keyOff.slice() };
    this.keyOn.fill(false);
    return ki;
  }

  updateVol() {}

  // The Mac visualizer only draws the plane (already on the FrameBuffer); the first
  // screenDrawParams fills in everything that differs from the initial state.
  screenInit(fb) {}

  screenChangeParams() {
    const newParam = this.newParam;
    const ym2413Register = this.reg;
    const ki = this.takeKeyInfo();

    for (let ch = 0; ch < 9; ch++) {
      const nyc = newParam.channels[ch];
      nyc.inst[0] = (ym2413Register[0x30 + ch] & 0xf0) >> 4;
      nyc.inst[1] = (ym2413Register[0x20 + ch] & 0x20) >> 5;
      nyc.inst[2] = (ym2413Register[0x20 + ch] & 0x10) >> 4;
      nyc.inst[3] = ym2413Register[0x30 + ch] & 0x0f;

      const freq = ym2413Register[0x10 + ch] + ((ym2413Register[0x20 + ch] & 0x1) << 8);
      const oct = (ym2413Register[0x20 + ch] & 0xe) >> 1;
      nyc.note = searchSegaPCMNote(freq / 172.0) + (oct - 4) * 12;

      if (ki.On[ch]) {
        nyc.volumeL = 19 - nyc.inst[3];
      } else {
        if (nyc.inst[2] === 0) nyc.note = -1;
        nyc.volumeL--; if (nyc.volumeL < 0) nyc.volumeL = 0;
      }
    }

    // Rhythm: BD, SD, TOM, CYM, HH
    const rhythm = [
      () => 19 - (ym2413Register[0x36] & 0x0f),
      () => 19 - (ym2413Register[0x37] & 0x0f),
      () => 19 - ((ym2413Register[0x38] & 0xf0) >> 4),
      () => 19 - (ym2413Register[0x38] & 0x0f),
      () => 19 - ((ym2413Register[0x37] & 0xf0) >> 4),
    ];
    for (let i = 0; i < 5; i++) {
      const c = newParam.channels[9 + i];
      if (ki.On[9 + i]) {
        c.volume = rhythm[i]();
      } else {
        c.volume--;
        if (c.volume < 0) c.volume = 0;
      }
    }

    const inst = newParam.channels[0].inst;
    inst[4] = ym2413Register[0x02] & 0x3f; //TL
    inst[5] = ym2413Register[0x03] & 0x07; //FB
    inst[6] = (ym2413Register[0x04] & 0xf0) >> 4; //AR
    inst[7] = ym2413Register[0x04] & 0x0f; //DR
    inst[8] = (ym2413Register[0x06] & 0xf0) >> 4; //SL
    inst[9] = ym2413Register[0x06] & 0x0f; //RR
    inst[10] = (ym2413Register[0x02] & 0x80) >> 7; //KL
    inst[11] = ym2413Register[0x00] & 0x0f; //MT
    inst[12] = (ym2413Register[0x00] & 0x80) >> 7; //AM
    inst[13] = (ym2413Register[0x00] & 0x40) >> 6; //VB
    inst[14] = (ym2413Register[0x00] & 0x20) >> 5; //EG
    inst[15] = (ym2413Register[0x00] & 0x10) >> 4; //KR
    inst[16] = (ym2413Register[0x03] & 0x08) >> 3; //DM
    inst[17] = (ym2413Register[0x05] & 0xf0) >> 4; //AR
    inst[18] = ym2413Register[0x05] & 0x0f; //DR
    inst[19] = (ym2413Register[0x07] & 0xf0) >> 4; //SL
    inst[20] = ym2413Register[0x07] & 0x0f; //RR
    inst[21] = (ym2413Register[0x03] & 0x80) >> 7; //KL
    inst[22] = ym2413Register[0x01] & 0x0f; //MT
    inst[23] = (ym2413Register[0x01] & 0x80) >> 7; //AM
    inst[24] = (ym2413Register[0x01] & 0x40) >> 6; //VB
    inst[25] = (ym2413Register[0x01] & 0x20) >> 5; //EG
    inst[26] = (ym2413Register[0x01] & 0x10) >> 4; //KR
    inst[27] = (ym2413Register[0x03] & 0x10) >> 4; //DC
  }

  screenDrawParams(fb) {
    const tp = 0;
    const oldParam = this.oldParam, newParam = this.newParam;
    for (let c = 0; c < 9; c++) {
      const oyc = oldParam.channels[c];
      const nyc = newParam.channels[c];
      const x = c % 3, y = Math.trunc(c / 3);
      D.Volume(fb, 256, 8 + c * 8, 0, oyc, 'volumeL', nyc.volumeL, tp);
      D.KeyBoard(fb, c, oyc, 'note', nyc.note, tp);
      D.drawInstNumber(fb, x * 16 + 37, y * 2 + 24, oyc.inst, 0, nyc.inst[0]);
      D.SUSFlag(fb, x * 16 + 41, y * 2 + 24, 0, oyc.inst, 1, nyc.inst[1]);
      D.SUSFlag(fb, x * 16 + 44, y * 2 + 24, 0, oyc.inst, 2, nyc.inst[2]);
      D.drawInstNumber(fb, x * 16 + 46, y * 2 + 24, oyc.inst, 3, nyc.inst[3]);
      D.ChYM2413(fb, c, oyc, 'mask', nyc.mask, tp);
    }
    for (let ch = 9; ch < 14; ch++) D.ChYM2413(fb, ch, oldParam.channels[ch], 'mask', newParam.channels[ch].mask, tp);
    D.VolumeXY(fb, 6, 20, 0, oldParam.channels[9], 'volume', newParam.channels[9].volume, tp);
    D.VolumeXY(fb, 21, 20, 0, oldParam.channels[10], 'volume', newParam.channels[10].volume, tp);
    D.VolumeXY(fb, 36, 20, 0, oldParam.channels[11], 'volume', newParam.channels[11].volume, tp);
    D.VolumeXY(fb, 51, 20, 0, oldParam.channels[12], 'volume', newParam.channels[12].volume, tp);
    D.VolumeXY(fb, 66, 20, 0, oldParam.channels[13], 'volume', newParam.channels[13].volume, tp);

    const oyc = oldParam.channels[0];
    const nyc = newParam.channels[0];
    D.drawInstNumber(fb, 9, 22, oyc.inst, 4, nyc.inst[4]); //TL
    D.drawInstNumber(fb, 14, 22, oyc.inst, 5, nyc.inst[5]); //FB
    for (let c = 0; c < 11; c++) {
      D.drawInstNumber(fb, c * 3, 26, oyc.inst, 6 + c, nyc.inst[6 + c]);
      D.drawInstNumber(fb, c * 3, 28, oyc.inst, 17 + c, nyc.inst[17 + c]);
    }
  }
}
