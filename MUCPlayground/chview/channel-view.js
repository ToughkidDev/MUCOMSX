// Channel view, laid out like MDPlayer4Mac's: the chip panels stacked FM -> SSG/PSG -> PCM,
// at 25-100% of MDPlayer's 2x size (75% by default), redrawn every 33 ms. The panels are
// driven by the chip register writes of the song that is playing. The writes come from
// the MUC engine (as it renders) or are read straight out of a VGM file; either way each
// write carries the audio frame it belongs to, and is applied when that frame is heard.
import { loadImages, images, FrameBuffer } from './draw.js';

const BASE = new URL('./', import.meta.url);

// Chip type -> module and class. A chip without a panel is listed by name only.
const PANELS = {
  YM2608: ['./ym2608.js', 'YM2608'],
  YM2610: ['./ym2610.js', 'YM2610'],
  YM2203: ['./ym2203.js', 'YM2203'],
  YM2151: ['./ym2151.js', 'YM2151'],
  YM2413: ['./ym2413.js', 'YM2413'],
  AY8910: ['./ay8910.js', 'AY8910'],
  K051649: ['./k051649.js', 'K051649'],
};

// VGM write commands: command byte -> [chip type, chip id, port].
const COMMANDS = {
  0x51: ['YM2413', 0, 0], 0xa1: ['YM2413', 1, 0],
  0x54: ['YM2151', 0, 0], 0xa4: ['YM2151', 1, 0],
  0x55: ['YM2203', 0, 0], 0xa5: ['YM2203', 1, 0],
  0x56: ['YM2608', 0, 0], 0x57: ['YM2608', 0, 1], 0xa6: ['YM2608', 1, 0], 0xa7: ['YM2608', 1, 1],
  0x58: ['YM2610', 0, 0], 0x59: ['YM2610', 0, 1], 0xa8: ['YM2610', 1, 0], 0xa9: ['YM2610', 1, 1],
};

// VGM header clocks: offset -> chip type (bit 30 of the clock means two chips).
const VGM_CLOCKS = [
  [0x10, 'YM2413'], [0x30, 'YM2151'], [0x44, 'YM2203'], [0x48, 'YM2608'], [0x4c, 'YM2610'],
  [0x74, 'AY8910'], [0x9c, 'K051649'],
];
const VGM_OTHER = [
  [0x0c, 'SN76489'], [0x2c, 'YM2612'], [0x38, 'SegaPCM'], [0x40, 'RF5C68'], [0x50, 'YM3812'],
  [0x54, 'YM3526'], [0x58, 'Y8950'], [0x5c, 'YMF262'], [0x60, 'YMF278B'], [0x64, 'YMF271'],
  [0x68, 'YMZ280B'], [0x6c, 'RF5C164'], [0x70, 'PWM'], [0x80, 'GB DMG'], [0x84, 'NES APU'],
  [0x88, 'MultiPCM'], [0x8c, 'uPD7759'], [0x90, 'OKIM6258'], [0x98, 'OKIM6295'], [0xa0, 'K054539'],
  [0xa4, 'HuC6280'], [0xa8, 'C140'], [0xac, 'K053260'], [0xb0, 'Pokey'], [0xb4, 'QSound'],
  [0xb8, 'SCSP'], [0xc0, 'WonderSwan'], [0xc4, 'VSU'], [0xc8, 'SAA1099'], [0xcc, 'ES5503'],
  [0xd0, 'ES5506'], [0xd8, 'X1-010'], [0xdc, 'C352'], [0xe0, 'GA20'],
];

export async function gunzipIfNeeded(bytes) {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes;
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Reads a VGM's chip writes in time order, following its loop like the player does.
class VgmReader {
  constructor(data) {
    this.d = data;
    const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.v = v;
    const u32 = (o) => (o + 4 <= data.length ? v.getUint32(o, true) : 0);
    const version = u32(0x08);
    const dataOffset = version >= 0x150 && u32(0x34) ? 0x34 + u32(0x34) : 0x40;
    this.start = dataOffset;
    this.loop = u32(0x1c) ? 0x1c + u32(0x1c) : 0;
    this.pos = dataOffset;
    this.frame = 0;
    this.chips = [];
    this.others = [];
    const headerEnd = Math.min(dataOffset, data.length);
    for (const [offset, type] of VGM_CLOCKS) {
      if (offset + 4 > headerEnd) continue;
      const raw = u32(offset);
      const clock = raw & 0x3fffffff;
      if (!clock) continue;
      this.chips.push({ type, id: 0, clock });
      if (raw & 0x40000000) this.chips.push({ type, id: 1, clock });
    }
    for (const [offset, name] of VGM_OTHER) {
      if (offset + 4 <= headerEnd && (u32(offset) & 0x3fffffff)) this.others.push(name);
    }
    this.ended = false;
  }

  // Calls emit(frame, type, id, port, addr, data) for every write up to `until`.
  readUntil(until, emit) {
    const d = this.d;
    let guard = 0;
    while (!this.ended && this.frame <= until) {
      if (this.pos >= d.length) { this.ended = true; break; }
      const c = d[this.pos];
      if (c === 0x66) {
        if (this.loop && this.loop < d.length && guard++ < 4) { this.pos = this.loop; continue; }
        this.ended = true;
        break;
      }
      if (COMMANDS[c]) {
        const [type, id, port] = COMMANDS[c];
        emit(this.frame, type, id, port, d[this.pos + 1], d[this.pos + 2]);
        this.pos += 3;
      } else if (c === 0xa0) {
        const a = d[this.pos + 1];
        emit(this.frame, 'AY8910', a >> 7, 0, a & 0x7f, d[this.pos + 2]);
        this.pos += 3;
      } else if (c === 0xd2) {
        const p = d[this.pos + 1];
        emit(this.frame, 'K051649', p >> 7, p & 0x7f, d[this.pos + 2], d[this.pos + 3]);
        this.pos += 4;
      } else if (c === 0x61) { this.frame += this.v.getUint16(this.pos + 1, true); this.pos += 3; }
      else if (c === 0x62) { this.frame += 735; this.pos += 1; }
      else if (c === 0x63) { this.frame += 882; this.pos += 1; }
      else if (c >= 0x70 && c <= 0x7f) { this.frame += (c & 15) + 1; this.pos += 1; }
      else if (c >= 0x80 && c <= 0x8f) { this.frame += c & 15; this.pos += 1; }
      else if (c === 0x67) { this.pos += 7 + (this.v.getUint32(this.pos + 3, true) & 0x7fffffff); }
      else if (c === 0x68) this.pos += 12;
      else if (c >= 0x30 && c <= 0x3f) this.pos += 2;
      else if (c === 0x4f || c === 0x50) this.pos += 2;
      else if (c >= 0x40 && c <= 0x5f) this.pos += 3;
      else if (c === 0x90 || c === 0x91 || c === 0x95) this.pos += 5;
      else if (c === 0x92) this.pos += 6;
      else if (c === 0x93) this.pos += 11;
      else if (c === 0x94) this.pos += 2;
      else if (c >= 0xa0 && c <= 0xbf) this.pos += 3;
      else if (c >= 0xc0 && c <= 0xdf) this.pos += 4;
      else if (c >= 0xe0) this.pos += 5;
      else this.pos += 1;
    }
  }
}

// MDPlayer4Mac's ShowVisualizersFor order; VGMs are then grouped FM -> SSG/PSG -> PCM
// (a stable sort, so chips keep this order within a group).
const ORDER = ['YM2151', 'AY8910', 'YM2413', 'YM2203', 'YM2608', 'YM2610', 'K051649'];
const FAMILY = { YM2151: 0, YM2413: 0, YM2203: 0, YM2608: 0, YM2610: 0, AY8910: 1, K051649: 1 };
export const SCALES = [75, 100, 75, 50, 25, 50];   // the Zoom button's cycle, from 75%
const TICK = 33;

export class ChannelView {
  constructor(root) {
    this.root = root;
    this.panels = [];      // { type, id, chip, fb, el }
    this.events = [];      // flat: frame, type index, id, port, addr, data
    this.index = 0;
    this.vgm = null;
    this.tickAt = 0;
    this.session = 0;
    this.empty();
  }

  empty(message) {
    this.root.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'cv-empty';
    p.textContent = message || this.root.dataset.empty || '';
    this.root.appendChild(p);
    this.panels = [];
  }

  // chips: [{ type, id, clock }]; others: names of chips that have no panel.
  async start(chips, others = [], vgmData = null) {
    const session = ++this.session;
    this.events = [];
    this.index = 0;
    this.levels = [];
    this.levelIndex = 0;
    this.vgm = vgmData ? new VgmReader(vgmData) : null;
    if (this.vgm) { chips = this.vgm.chips; others = this.vgm.others; }
    chips = chips.filter((c) => ORDER.includes(c.type))
      .sort((x, y) => ORDER.indexOf(x.type) - ORDER.indexOf(y.type) || x.id - y.id);
    if (this.vgm) chips.sort((x, y) => FAMILY[x.type] - FAMILY[y.type]);
    await loadImages(BASE);
    const loaded = [];
    for (const c of chips) {
      const [file, name] = PANELS[c.type];
      try { loaded.push({ ...c, Cls: (await import(file))[name] }); } catch { others.push(c.type); }
    }
    if (session !== this.session) return;
    this.root.innerHTML = '';
    this.panels = [];
    for (const p of loaded) {
      const chip = new p.Cls(p.clock);
      const fb = new FrameBuffer(images[p.Cls.plane]);
      chip.screenInit(fb);
      fb.canvas.className = 'cv-screen';
      fb.canvas.title = p.type + (p.id ? ` #${p.id + 1}` : '');
      this.root.appendChild(fb.canvas);
      this.panels.push({ type: p.type, id: p.id, chip, fb });
    }
    if (others.length) {
      const note = document.createElement('p');
      note.className = 'cv-other';
      note.textContent = (this.root.dataset.other || '') + [...new Set(others)].join(', ');
      this.root.appendChild(note);
    }
    if (!this.panels.length && !others.length) this.empty();
    this.applyScale();
    this.tickAt = 0;
    this.draw();
  }

  // Display size in percent of MDPlayer's 2x panels (MDPlayer4Mac's channel view zoom).
  setScale(percent) {
    this.scale = percent;
    this.applyScale();
  }

  applyScale() {
    const k = (this.scale || 75) / 50;
    for (const p of this.panels) {
      p.fb.canvas.style.width = `${p.fb.canvas.width * k}px`;
    }
  }

  // Playback stopped: the panels stay, with the live meters cleared (MDPlayer4Mac's
  // ClearVisualizationVolumes); register-driven meters fall back on their own.
  stop() {
    this.events = [];
    this.index = 0;
    this.levels = [];
    this.levelIndex = 0;
    this.vgm = null;
    for (const p of this.panels) p.chip.clearVis?.();
  }

  // Live output levels: groups of frame, chip command (0x56 YM2608, 0x58 YM2610), id,
  // key mask, then the left and right levels of sources 1-4 (MDSound's visVolume).
  pushLevels(log) {
    for (const v of log) this.levels.push(v);
  }

  // Engine chip log: pairs of frame and VGM command << 24 | port << 16 | addr << 8 | data.
  push(log) {
    for (let i = 0; i + 1 < log.length; i += 2) {
      const w = log[i + 1];
      const cmd = w >>> 24, port = (w >> 16) & 0xff, addr = (w >> 8) & 0xff, data = w & 0xff;
      if (cmd === 0xa0) this.events.push(log[i], 'AY8910', 0, 0, addr, data);
      else if (cmd === 0xd2) this.events.push(log[i], 'K051649', 0, port, addr, data);
      else if (COMMANDS[cmd]) { const [type, id, p] = COMMANDS[cmd]; this.events.push(log[i], type, id, p, addr, data); }
    }
  }

  write(type, id, port, addr, data) {
    for (const p of this.panels) if (p.type === type && p.id === id) { p.chip.write(port, addr, data); return; }
  }

  // Applies everything up to the frame being heard and redraws, at most 60 times a second
  // (MDPlayer updates its screens, and lets the level meters fall, at that rate).
  update(frame) {
    if (this.vgm) this.vgm.readUntil(frame, (f, type, id, port, addr, data) => this.write(type, id, port, addr, data));
    const ev = this.events;
    while (this.index + 5 < ev.length && ev[this.index] <= frame) {
      this.write(ev[this.index + 1], ev[this.index + 2], ev[this.index + 3], ev[this.index + 4], ev[this.index + 5]);
      this.index += 6;
    }
    if (this.index > 60000) { this.events = ev.slice(this.index); this.index = 0; }
    const lv = this.levels;
    while (this.levelIndex + 11 < lv.length && lv[this.levelIndex] <= frame) {
      const i = this.levelIndex;
      const type = lv[i + 1] === 0x56 ? 'YM2608' : 'YM2610';
      for (const p of this.panels) {
        if (p.type !== type || p.id !== lv[i + 2]) continue;
        p.chip.visVolume = [[0, 0], [lv[i + 4], lv[i + 5]], [lv[i + 6], lv[i + 7]], [lv[i + 8], lv[i + 9]], [lv[i + 10], lv[i + 11]]];
        if (type === 'YM2608') p.chip.rhythmKeyMask = lv[i + 3];
        else p.chip.adpcmAKeyMask = lv[i + 3];
      }
      this.levelIndex += 12;
    }
    if (this.levelIndex > 80000) { this.levels = lv.slice(this.levelIndex); this.levelIndex = 0; }
    this.tick();
  }

  // MDPlayer4Mac's visualizer timer: every 33 ms, read the registers, redraw what
  // changed, then let the key-on peaks fall (ChipRegister.updateVol).
  tick() {
    const now = performance.now();
    if (now - this.tickAt < TICK - 4) return;
    this.tickAt = now;
    this.draw();
    for (const p of this.panels) p.chip.updateVol();
  }

  draw() {
    for (const p of this.panels) {
      p.chip.screenChangeParams();
      p.chip.screenDrawParams(p.fb);
    }
  }
}
