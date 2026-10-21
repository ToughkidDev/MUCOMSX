// Channel faders beside a chip panel, in MDPlayer4Mac's mixer graphics: its rFader sprite
// sheet (rail, knob, 2px level bar), turned on its side the way its MixerVisualizer does,
// and rFont_03 for the numbers. One fader per channel, on the panel's own channel row (8
// pixels high, like the rail and the knob); channels without a row of their own (rhythm,
// ADPCM-A) get labelled rows below. The units are MDPlayer4Mac's mixer's (0.5 dB steps, 0
// the song as written, 35/43 of the way along as frmMixer2 splits its travel): from -32
// (-16 dB) to +20 (+10 dB), and below -32 OFF (-192 for the engine). Dragging rests at 0 for
// a couple of pixels; the small key right of each fader puts it back to 0. The engine
// applies the faders to the registers the song writes.

import { images } from './draw.js';

export const STRIP_W = 102;
const LABEL_X = 2, VALUE_X = 15, FADER_X = 33, FADER_LEN = 56, KNOB_W = 13;
const RESET_X = FADER_X + FADER_LEN + 2, RESET_W = 10;   // the key that puts a fader back to 0
const USABLE = FADER_LEN - KNOB_W;
export const MIN_VOL = -192, LOW_VOL = -32, MAX_VOL = 20;   // MIN_VOL: OFF
const ZERO = Math.floor((USABLE * 35) / 43);   // 43 px of travel, like frmMixer2: 35 below 0, 8 above
const OFF_PX = 2;                              // the first pixels: OFF
const DETENT_PX = 2;                           // dragging rests at 0 this close to it

// [y, channel, label]: the channel numbers ChannelMixer (engine) uses.
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
export const ROWS = {
  YM2608: [...range(6, (c) => [8 + c * 8, c, '']), ...range(3, (c) => [80 + c * 8, 6 + c, '']), [104, 15, ''],
    ...['BD', 'SD', 'TOP', 'HH', 'TOM', 'RIM'].map((l, i) => [128 + i * 8, 9 + i, l])],
  YM2610: [...range(6, (c) => [8 + c * 8, c, '']), ...range(3, (c) => [80 + c * 8, 6 + c, '']), [112, 15, ''],
    ...range(6, (i) => [128 + i * 8, 9 + i, 'A' + (i + 1)])],
  YM2151: range(8, (c) => [8 + c * 8, c, '']),
  YM2413: [...range(9, (c) => [8 + c * 8, c, '']), ...['BD', 'SD', 'TOM', 'CYM', 'HH'].map((l, i) => [80 + i * 8, 9 + i, l])],
  AY8910: range(3, (c) => [8 + c * 8, c, '']),
  K051649: range(5, (c) => [8 + c * 8, c, '']),
};

// rFader's vertical tiles, turned clockwise once (as MixerVisualizer blits them).
let sprites = null;
function turned(img, sx, sy, w, h) {
  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sg = src.getContext('2d');
  sg.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  const from = sg.getImageData(0, 0, w, h);
  const out = document.createElement('canvas');
  out.width = h; out.height = w;
  const og = out.getContext('2d');
  const to = og.createImageData(h, w);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const s = (r * w + c) * 4, d = (c * h + (h - 1 - r)) * 4;
    for (let k = 0; k < 4; k++) to.data[d + k] = from.data[s + k];
  }
  og.putImageData(to, 0, 0);
  return out;
}
function loadSprites() {
  if (sprites) return sprites;
  const f = images.rFader;
  sprites = {
    knob: turned(f, 8, 0, 8, 13),        // the chip knob (red)
    capLeft: turned(f, 24, 0, 8, 8),
    capRight: turned(f, 16, 0, 8, 8),
    rail: turned(f, 16, 8, 8, 8),
  };
  return sprites;
}

// After MixerVisualizer.FaderPosition / VolumeAtPosition, over -32..0..+20 and OFF.
export function knobAt(v) {
  if (v <= MIN_VOL) return 0;
  if (v <= 0) return OFF_PX + Math.round(((Math.max(LOW_VOL, v) - LOW_VOL) * (ZERO - OFF_PX)) / -LOW_VOL);
  return ZERO + Math.round((v * (USABLE - ZERO)) / MAX_VOL);
}
export function volAt(pos, detent = false) {
  const p = Math.max(0, Math.min(USABLE, pos));
  if (detent && Math.abs(p - ZERO) <= DETENT_PX) return 0;
  if (p < OFF_PX - 0.5) return MIN_VOL;
  return p <= ZERO ? Math.round(LOW_VOL + ((p - OFF_PX) * -LOW_VOL) / (ZERO - OFF_PX)) : Math.round(((p - ZERO) * MAX_VOL) / (USABLE - ZERO));
}
// A small turning arrow for the reset key (7 x 6): a ring open at the lower right, its
// arrowhead at the right pointing down.
const RESET_ICON = ['..###..', '.#...#.', '#...###', '#....#.', '.#.....', '..###..'];

export class MixerStrip {
  // get(ch) -> volume (-192 = off .. +20); set(ch, volume); title: tooltip.
  constructor(type, height, { get, set, title }) {
    this.rows = ROWS[type] || [];
    this.get = get;
    this.set = set;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cv-screen cv-mixer';
    this.canvas.width = STRIP_W;
    this.canvas.height = height;
    this.canvas.title = title || '';
    this.g = this.canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.restore = new Map();   // channel -> level before OFF (a click on the number)
    this.pressed = null;        // the channel whose reset key is down
    this.reset = null;          // RESET VOL, on the last strip (setReset)
    this.title = title || '';
    this.wire();
    this.draw();
  }

  text(x, y, s) {
    const font = images.rFont_03;
    for (const ch of s) {
      const i = ch.charCodeAt(0) - 0x20;
      if (i > 0 && i < 64) this.g.drawImage(font, (i % 32) * 4, Math.floor(i / 32) * 8, 4, 8, x, y, 4, 8);
      x += 4;
    }
  }

  draw() {
    const g = this.g, sp = loadSprites();
    g.fillStyle = '#000';
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.text(LABEL_X, 0, 'VOL');
    for (const [y, ch, label] of this.rows) {
      const vol = this.get(ch);
      if (label) this.text(LABEL_X, y, label);
      // As MDPlayer prints it: +20 … 0 … -191; OFF at the bottom.
      const value = vol <= MIN_VOL ? 'OFF' : vol > 0 ? `+${vol}` : `${vol}`;
      this.text(VALUE_X + (4 - value.length) * 4, y, value);
      // Rail: quiet end left, loud end right.
      g.drawImage(sp.capLeft, FADER_X, y);
      for (let x = 8; x < FADER_LEN - 8; x += 8) g.drawImage(sp.rail, FADER_X + x, y);
      g.drawImage(sp.capRight, FADER_X + FADER_LEN - 8, y);
      // The 2px level bar in the rail, up to the knob's centre (lit, then red by the knob).
      const knob = knobAt(vol), level = knob + (KNOB_W >> 1);
      for (let i = 0; i < FADER_LEN; i += 2) {
        const tile = vol > MIN_VOL && i < level ? (i >= level - 8 ? 0 : 1) : 2;
        g.drawImage(images.rFader, 24, 8 + tile, 2, 1, FADER_X + i, y + 3, 2, 1);
      }
      g.drawImage(sp.knob, FADER_X + knob, y);
      this.drawResetKey(y, vol !== 0, this.pressed === ch);
    }
    this.drawResetVol();
  }

  // RESET VOL under the last strip's faders: lined up with them (same x, width and 8 px
  // height), two rows below the last one. reset: { onReset, anyChanged, title }.
  setReset(reset) {
    this.reset = reset;
    const last = Math.max(...this.rows.map(([y]) => y));
    this.reset.y = last + 16;
    if (this.canvas.height < this.reset.y + 8) {
      this.canvas.height = this.reset.y + 8;   // (resizing resets the context)
      this.g.imageSmoothingEnabled = false;
    }
    this.draw();
  }

  drawResetVol() {
    const r = this.reset;
    if (!r) return;
    const g = this.g, x = FADER_X, y = r.y, w = FADER_LEN, h = 8, pressed = r.pressed;
    g.fillStyle = '#4a4a4a';
    g.fillRect(x, y, w, h);
    g.fillStyle = pressed ? '#1a1a1a' : '#9a9a9a';
    g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h);
    g.fillStyle = pressed ? '#9a9a9a' : '#1a1a1a';
    g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = '#000';
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    // rFont_03 draws on rows 2-7 of its 8-pixel cells: those six rows go inside the frame.
    const label = 'RESET VOL', font = images.rFont_03;
    g.globalAlpha = r.anyChanged() ? 1 : 0.45;
    let tx = x + Math.floor((w - label.length * 4) / 2) + (pressed ? 1 : 0);
    for (const ch of label) {
      const i = ch.charCodeAt(0) - 0x20;
      if (i > 0 && i < 64) g.drawImage(font, (i % 32) * 4, Math.floor(i / 32) * 8 + 2, 4, 6, tx, y + 1, 4, 6);
      tx += 4;
    }
    g.globalAlpha = 1;
  }

  // A raised key in the rail's greys, like RESET VOL; dim when the fader is at 0 already.
  drawResetKey(y, on, pressed) {
    const g = this.g, x = RESET_X, w = RESET_W, h = 8;
    g.fillStyle = '#4a4a4a';
    g.fillRect(x, y, w, h);
    g.fillStyle = pressed ? '#1a1a1a' : '#9a9a9a';
    g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h);
    g.fillStyle = pressed ? '#9a9a9a' : '#1a1a1a';
    g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = '#000';
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = on ? '#e8e8e8' : '#5a5a5a';
    const ox = x + 1 + (pressed ? 1 : 0), oy = y + 1 + (pressed ? 1 : 0);
    RESET_ICON.forEach((line, r) => { for (let c = 0; c < line.length; c++) if (line[c] === '#') g.fillRect(ox + c, oy + r, 1, 1); });
  }

  // Native pixel and row under the pointer.
  hit(e) {
    const r = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * this.canvas.width) / r.width;
    const y = ((e.clientY - r.top) * this.canvas.height) / r.height;
    const row = this.rows.find(([ry]) => y >= ry && y < ry + 8);
    return { x, y, row };
  }

  // Every fader of the chip back to the song's level.
  resetAll() {
    this.restore.clear();
    for (const [, ch] of this.rows) this.change(ch, 0);
  }

  change(ch, vol) {
    if (this.get(ch) === vol) return;
    this.set(ch, vol);
    this.draw();
  }

  wire() {
    const c = this.canvas;
    let drag = null;
    const overReset = (x, y) => this.reset && y >= this.reset.y && y < this.reset.y + 8 && x >= FADER_X && x < FADER_X + FADER_LEN;
    c.addEventListener('pointerdown', (e) => {
      const { x, y, row } = this.hit(e);
      if (overReset(x, y)) {
        this.reset.pressed = true;
        this.draw();
        setTimeout(() => { this.reset.pressed = false; this.reset.onReset(); this.draw(); }, 90);
        return;
      }
      if (y < 8) return;
      if (!row) return;
      const ch = row[1];
      if (x >= RESET_X) {
        // The reset key: this fader back to 0.
        if (x >= RESET_X + RESET_W) return;
        this.pressed = ch;
        this.draw();
        setTimeout(() => { this.pressed = null; this.restore.delete(ch); this.change(ch, 0); this.draw(); }, 90);
        return;
      }
      if (x < FADER_X) {
        // The number: OFF and back.
        const vol = this.get(ch);
        if (vol <= MIN_VOL) this.change(ch, this.restore.get(ch) ?? 0);
        else { this.restore.set(ch, vol); this.change(ch, MIN_VOL); }
        return;
      }
      drag = ch;
      c.setPointerCapture(e.pointerId);
      this.change(ch, volAt(x - FADER_X - KNOB_W / 2, true));
      e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
      const { x, y } = this.hit(e);
      // The tooltip of what is under the pointer.
      const tip = overReset(x, y) ? this.reset.title : this.title;
      if (c.title !== tip) c.title = tip;
      if (drag === null) return;
      this.change(drag, volAt(x - FADER_X - KNOB_W / 2, true));
    });
    const end = () => { drag = null; };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('dblclick', (e) => {
      const { x, y, row } = this.hit(e);
      // VOL: every channel of the chip back to the song's level; a fader: that one.
      if (y < 8) { this.resetAll(); return; }
      if (row && x < RESET_X) this.change(row[1], 0);
    });
    c.addEventListener('wheel', (e) => {
      const { row } = this.hit(e);
      if (!row) return;
      e.preventDefault();
      // One step (0.5 dB) a notch, as MDPlayer's mixer; below -32 is OFF.
      const vol = this.get(row[1]), up = e.deltaY < 0;
      let next = vol <= MIN_VOL ? (up ? LOW_VOL : MIN_VOL) : vol + (up ? 1 : -1);
      if (next < LOW_VOL) next = MIN_VOL;
      this.change(row[1], Math.min(MAX_VOL, next));
    }, { passive: false });
  }
}
