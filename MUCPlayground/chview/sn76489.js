// SN76489 (DCSG, the Mega Drive / Master System PSG) panel, ported from MDPlayer4Mac
// (GPL-3.0): macos/MDPlayerUI/Visualizer/Sn76489Visualizer.cs + DrawBuffSn76489.cs (a port
// of MDPlayer's frmSN76489), with the SN76489 part of macos/MDPlayerCore/ChipRegister.cs
// (latched register writes, per-channel volume, Game Gear stereo).
import * as D from './draw.js';

function params() {
  const p = { channels: D.channels(4) };
  for (const c of p.channels) c.mask = null;   // draw every badge once
  return p;
}

// DrawBuff.ChSN76489_P: the channel badge.
function chBadge(fb, ch, mask) {
  fb.draw(0, 8 + ch * 8, D.images[mask ? 'rType_02' : 'rType_01'], 128, 32, 0, 16, 8);
  D.drawFont8(fb, 16, 8 + ch * 8, mask ? 1 : 0, String(1 + ch));
}

export class SN76489 {
  static plane = 'planeSN76489';

  constructor(clock) {
    this.clock = (clock & 0x3fffffff) || 3579545;
    // ChipRegister state
    this.reg = [0, 15, 0, 15, 0, 15, 0, 15];
    this.latched = 0;
    this.ggPan = 0xff;
    this.vol = [[0, 0], [0, 0], [0, 0], [0, 0]];
    this.oldParam = params();
    this.newParam = params();
    // frmSN76489.ScreenInit: channel 4's note carries the noise control byte, reset to 0.
    this.oldParam.channels[3].note = 0;
  }

  // ChipRegister.setSN76489Register (port 0) and setSN76489RegisterGGpanning (port 1).
  write(port, addr, data) {
    if (port === 1) { this.ggPan = data; return; }
    const r = this.reg;
    // SN76489_Write
    if (data & 0x80) {
      this.latched = (data >> 4) & 0x07;
      r[this.latched] = (r[this.latched] & 0x3f0) | (data & 0xf);
    } else if (this.latched % 2 === 0 && this.latched < 5) {
      r[this.latched] = (r[this.latched] & 0x00f) | ((data & 0x3f) << 4);
    } else {
      r[this.latched] = data & 0x0f;
    }
    if ((data & 0x10) !== 0 && this.latched !== 0 && this.latched !== 2 && this.latched !== 4 && this.latched !== 6) {
      const ch = (data & 0x60) >> 5;
      this.vol[ch][0] = (15 - (data & 0xf)) * ((this.ggPan >> (ch + 4)) & 0x1);
      this.vol[ch][1] = (15 - (data & 0xf)) * ((this.ggPan >> ch) & 0x1);
    }
  }

  updateVol() {}

  // The Mac visualizer only draws the plane (already on the FrameBuffer).
  screenInit(fb) {}

  screenChangeParams() {
    const R = this.reg, vol = this.vol, np = this.newParam;
    const meter = (v) => Math.min(Math.max(Math.trunc(v / (15.0 / 19.0)), 0), 19);
    const pan = (shift) => { const p = (this.ggPan >> shift) & 0x11; return (p & 0x1) | (p >> 3); };
    for (let ch = 0; ch < 3; ch++) {
      const c = np.channels[ch];
      c.freq = R[ch * 2];
      if (R[ch * 2 + 1] !== 15 && c.freq !== 0) {
        const ftone = Math.fround(this.clock / (2.0 * R[ch * 2] * 16.0));
        c.note = D.Common.searchSSGNote(ftone);
      } else {
        c.note = -1;
      }
      c.volumeL = meter(vol[ch][0]);
      c.volumeR = meter(vol[ch][1]);
      c.volume = Math.max(vol[ch][0], vol[ch][1]);
      c.pan = pan(ch);
    }
    // Noise channel.
    const n = np.channels[3];
    n.note = R[6];
    n.freq = R[4];
    n.volumeL = meter(vol[3][0]);
    n.volumeR = meter(vol[3][1]);
    n.volume = Math.max(vol[3][0], vol[3][1]);
    n.pan = pan(3);
  }

  screenDrawParams(fb) {
    const op = this.oldParam, np = this.newParam;
    for (let c = 0; c < 4; c++) {
      const o = op.channels[c], n = np.channels[c];
      const y = 8 + c * 8;
      D.Volume(fb, 280, y, 1, o, 'volumeL', n.volumeL, 0);
      D.Volume(fb, 280, y, 2, o, 'volumeR', n.volumeR, 0);
      if (c < 3) D.KeyBoardDCSG(fb, 32, y, o, 'note', n.note, 0);
      if (o.mask !== n.mask) { chBadge(fb, c, !!n.mask); o.mask = n.mask; }
      D.Pan(fb, 24, y, o, 'pan', n.pan, o, 'pantp', 0);
      if (o.volume !== n.volume) {
        D.drawFont4(fb, 272, y, 0, String(n.volume).padStart(2, '0'));
        o.volume = n.volume;
      }
      if (c < 3) D.font4Hex12Bit(fb, 256, y, 0, o, 'freq', n.freq);
    }
    // DrawBuff.ChSN76489Noise: the noise mode and rate.
    const o = op.channels[3], n = np.channels[3];
    if (o.note !== n.note) {
      D.drawFont4(fb, 56, 32, 0, (n.note & 0x4) !== 0 ? 'WHITE   ' : 'PERIODIC');
      D.drawFont4(fb, 120, 32, 0, ['0  ', '1  ', '2  ', 'CH3'][n.note & 0x3]);
      o.note = n.note;
    }
  }
}
