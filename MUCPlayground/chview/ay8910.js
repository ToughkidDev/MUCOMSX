// AY8910 (PSG) panel: MDPlayer4Mac's Ay8910Visualizer + DrawBuffAy8910 (a port of
// MDPlayer's frmAY8910) and the AY8910 part of its ChipRegister, ported from MDPlayer /
// MDPlayer4Mac (GPL-3.0).
import * as D from './draw.js';

export class AY8910 {
  static plane = 'planeAY8910';

  // `clock` is the VGM header clock. MDPlayer4Mac's visualizer gets the clock MDSound runs
  // the chip at (VgmEngine: (header clock & 0x7fffffff) / 2), falling back to 1789772.5.
  constructor(clock) {
    this.clock = clock;
    this.clockAY8910 = Math.trunc((clock & 0x7fffffff) / 2) || 1789772.5;
    this.reg = new Array(0x100).fill(0);
    const params = () => ({ nfrq: -1, efrq: -1, etype: -1, channels: D.channels(3) });
    this.oldParam = params();
    this.newParam = params();
  }

  // ChipRegister.setAY8910Register
  write(port, dAddr, dData) {
    if (dAddr >= 0 && dAddr < 0x100) this.reg[dAddr] = dData;
  }

  updateVol() {}

  // The Mac visualizer only draws the plane (already on the FrameBuffer).
  screenInit(fb) {}

  screenChangeParams() {
    const newParam = this.newParam;
    const AY8910Register = this.reg;
    for (let ch = 0; ch < 3; ch++) { //SSG
      const channel = newParam.channels[ch];
      const t = (AY8910Register[0x07] & (0x1 << ch)) === 0;
      const n = (AY8910Register[0x07] & (0x8 << ch)) === 0;
      channel.tn = (t ? 1 : 0) + (n ? 2 : 0);
      newParam.nfrq = AY8910Register[0x06] & 0x1f;
      newParam.efrq = AY8910Register[0x0c] * 0x100 + AY8910Register[0x0b];
      newParam.etype = AY8910Register[0x0d] & 0xf;

      let v = AY8910Register[0x08 + ch] & 0x1f;
      v = v > 15 ? 15 : v;
      channel.volumeL = v;
      channel.volume = Math.trunc(((t || n) ? 1 : 0) * v * (20.0 / 16.0));
      if (!t && !n && channel.volume > 0) channel.volume--;

      const ft = AY8910Register[0x00 + ch * 2];
      const ct = AY8910Register[0x01 + ch * 2];
      let tp = (ct << 8) | ft;
      if (tp === 0) tp = 1;
      channel.freq = tp;

      if (channel.volume === 0) {
        channel.note = -1;
      } else {
        const ftone = this.clockAY8910 / (8.0 * tp);
        channel.note = D.Common.searchSSGNote(ftone);
      }
      channel.ex = (AY8910Register[0x08 + ch] & 0xf0) !== 0;
    }
  }

  screenDrawParams(fb) {
    const tp = 0;
    const oldParam = this.oldParam, newParam = this.newParam;
    for (let c = 0; c < 3; c++) {
      const oyc = oldParam.channels[c];
      const nyc = newParam.channels[c];
      D.Volume(fb, 280, 8 + c * 8, 0, oyc, 'volume', nyc.volume, tp);
      D.KeyBoardDCSG(fb, 32, 8 + c * 8, oyc, 'note', nyc.note, tp);
      D.ToneNoise(fb, 6, 2, c, oyc, 'tn', nyc.tn, oyc, 'tntp', nyc.mask === true ? 1 : 0);
      D.ChAY8910(fb, c, oyc, 'mask', nyc.mask, tp);
      if (oyc.volumeL !== nyc.volumeL) {
        D.drawFont4(fb, 272, 8 + c * 8, 0, String(nyc.volumeL).padStart(2, '0'));
        oyc.volumeL = nyc.volumeL;
      }
      D.font4Hex12Bit(fb, 256, 8 + c * 8, 0, oyc, 'freq', nyc.freq);
      D.drawNESSw(fb, 268, 8 + c * 8, oyc, 'ex', nyc.ex);
    }
    D.Nfrq(fb, 5, 8, oldParam, 'nfrq', newParam.nfrq);
    D.Efrq(fb, 18, 8, oldParam, 'efrq', newParam.efrq);
    D.Etype(fb, 33, 8, oldParam, 'etype', newParam.etype);
  }
}
