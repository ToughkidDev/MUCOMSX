// K051649 (SCC) panel: MDPlayer4Mac's K051649Visualizer + DrawBuffK051649 (a port of
// MDPlayer's frmK051649), with the register state it reads from MDSound's k051649 core
// (ChipRegister.GetK051649Register; the writes ChipRegister.writeK051649 passes on),
// ported from MDPlayer / MDPlayer4Mac / MDSound (GPL-3.0).
import * as D from './draw.js';

function newChannel() {
  const c = new D.Channel();
  c.typ = new Array(67).fill(0);   // MDChipParams.Channel.typ (holds the drawn waveform)
  c.dda = false;
  return c;
}

// DrawBuffK051649.Font4HexByte: unlike draw.js's (Windows) version this clamps to
// 0..0xff, so negative wavetable samples read 00, as in MDPlayer4Mac.
function font4HexByte(screen, x, y, o, k, nn) {
  if (o[k] === nn) return;
  let num = D.Common.Range(nn, 0, 0xff);
  let n = Math.trunc(num / 0x10);
  num -= n * 0x10;
  n = n > 0xf ? 0 : n;
  D.drawFont4(screen, x, y, 0, D.Tables.hexCh[n]);
  D.drawFont4(screen, x + 4, y, 0, D.Tables.hexCh[num]);
  o[k] = nn;
}

export class K051649 {
  static plane = 'planeK051649';

  constructor(clock) {
    this.clock = (clock & 0x3fffffff) || 1500000;   // Vgm.K051649ClockValue, Mac fallback 1500000
    // k051649_state
    this.state = {
      channel_list: Array.from({ length: 5 }, () => ({ frequency: 0, volume: 0, key: 0, waveram: new Int8Array(32) })),
      cur_reg: 0,
      test: 0,
    };
    const params = () => ({ channels: Array.from({ length: 5 }, newChannel) });
    this.oldParam = params();
    this.newParam = params();
  }

  // VGM 0xD2 pp aa dd: MDPlayer writes offset pp*2 = aa, then pp*2+1 = dd (k051649_w).
  write(port, addr, data) {
    this.k051649_w(port << 1, addr & 0xff);
    this.k051649_w((port << 1) | 1, data & 0xff);
  }

  k051649_w(offset, data) {
    const info = this.state;
    if ((offset & 1) === 0) { info.cur_reg = data; return; }
    const reg = info.cur_reg;
    switch (offset >> 1) {
      case 0x00: { // k051649_waveform_w
        if (((info.test & 0x40) !== 0) || (((info.test & 0x80) !== 0) && reg >= 0x60)) return;
        if (reg >= 0x60) {
          // channel 5 shares waveram with channel 4
          info.channel_list[3].waveram[reg & 0x1f] = data;
          info.channel_list[4].waveram[reg & 0x1f] = data;
        } else {
          const ch = reg >> 5;
          if (ch < 5) info.channel_list[ch].waveram[reg & 0x1f] = data;
        }
        break;
      }
      case 0x01: { // k051649_frequency_w
        const ch = reg >> 1;
        if (ch >= 5) return;
        const chn = info.channel_list[ch];
        if ((reg & 1) !== 0) chn.frequency = (chn.frequency & 0x0ff) | ((data << 8) & 0xf00);
        else chn.frequency = (chn.frequency & 0xf00) | data;
        break;
      }
      case 0x02: { // k051649_volume_w
        const ch = reg & 0x7;
        if (ch < 5) info.channel_list[ch].volume = data & 0xf;
        break;
      }
      case 0x03: { // k051649_keyonoff_w
        let d = data;
        for (let i = 0; i < 5; i++) { info.channel_list[i].key = d & 1; d >>= 1; }
        break;
      }
      case 0x04: { // k052539_waveform_w (SCC+)
        if ((info.test & 0x40) !== 0) return;
        const ch = reg >> 5;
        if (ch < 5) info.channel_list[ch].waveram[reg & 0x1f] = data;
        break;
      }
      case 0x05: // k051649_test_w
        info.test = data;
        break;
    }
  }

  updateVol() {}

  // The Mac visualizer only draws the plane (already on the FrameBuffer).
  screenInit(fb) {}

  screenChangeParams() {
    const chip = this.state;
    for (let ch = 0; ch < 5; ch++) {
      const psg = chip.channel_list[ch];
      const channel = this.newParam.channels[ch];
      for (let i = 0; i < 32; i++) channel.inst[i] = psg.waveram[i];
      const ftone = this.clock / (8.0 * psg.frequency);
      channel.freq = psg.frequency;
      channel.volume = psg.key !== 0 ? Math.trunc(psg.volume * 1.33) : 0;
      channel.volumeL = psg.volume;
      channel.note = (psg.key !== 0 && channel.volume !== 0) ? D.Common.searchSSGNote(ftone) : -1;
      channel.dda = psg.key !== 0;
    }
  }

  screenDrawParams(fb) {
    const tp = 0;
    for (let c = 0; c < 5; c++) {
      const oyc = this.oldParam.channels[c];
      const nyc = this.newParam.channels[c];
      const x = c % 3;
      const y = Math.trunc(c / 3);
      D.KeyBoard(fb, c, oyc, 'note', nyc.note, tp);
      D.Volume(fb, 256, 8 + c * 8, 0, oyc, 'volume', nyc.volume, tp);
      D.font4Hex12Bit(fb, x * 4 * 26 + 4 * 14, y * 8 * 6 + 8 * 11, tp, oyc, 'freq', nyc.freq);
      D.font4Hex4Bit(fb, x * 4 * 26 + 4 * 22, y * 8 * 6 + 8 * 11, tp, oyc, 'volumeL', nyc.volumeL);
      D.drawNESSw(fb, x * 4 * 26 + 4 * 25, y * 8 * 6 + 8 * 11, oyc, 'dda', nyc.dda);
      D.WaveFormToK051649(fb, c, oyc, 'typ', nyc.inst);
      D.ChK051649(fb, c, oyc, 'mask', nyc.mask, tp);
      for (let i = 0; i < 32; i++) {
        const fx = i % 8;
        const fy = Math.trunc(i / 8);
        font4HexByte(fb, x * 4 * 26 + 4 * 10 + fx * 8, y * 8 * 6 + 8 * 7 + fy * 8, oyc.inst, i, nyc.inst[i]);
      }
    }
  }
}
