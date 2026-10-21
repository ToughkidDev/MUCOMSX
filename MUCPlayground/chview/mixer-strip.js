// Channel faders beside a chip panel, in MDPlayer4Mac's mixer graphics: its rFader sprite
// sheet (rail, knob, 2px level bar), turned on its side the way its MixerVisualizer does,
// and rFont_03 for the numbers. One fader per channel, on the panel's own channel row (8
// pixels high, like the rail and the knob); channels without a row of their own (rhythm,
// ADPCM-A) get labelled rows below. The scale is MDPlayer4Mac's mixer's: -192 to +20 in
// 0.5 dB steps (-96 dB to +10 dB; -192, far left, is OFF), with 0 (the song as written) 35/43
// of the way along, as frmMixer2 splits its travel; the engine applies it to the registers
// the song writes.

import { images } from './draw.js';

export const STRIP_W = 92;
const LABEL_X = 2, VALUE_X = 15, FADER_X = 33, FADER_LEN = 56, KNOB_W = 13;
const USABLE = FADER_LEN - KNOB_W;
export const MIN_VOL = -192, MAX_VOL = 20;
const ZERO = Math.floor((USABLE * 35) / 43);   // 43 px of travel, like frmMixer2: 35 below 0, 8 above

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

// MixerVisualizer.FaderPosition / VolumeAtPosition.
export const knobAt = (v) => (v <= 0 ? Math.round(((v - MIN_VOL) * ZERO) / -MIN_VOL) : ZERO + Math.round((v * (USABLE - ZERO)) / MAX_VOL));
export function volAt(pos) {
  const p = Math.max(0, Math.min(USABLE, pos));
  return p <= ZERO ? Math.round(MIN_VOL + (p * -MIN_VOL) / ZERO) : Math.round(((p - ZERO) * MAX_VOL) / (USABLE - ZERO));
}

// The button under the faders: every channel of every chip back to 0 dB. Drawn like the
// strips (rFader's rail greys, rFont_03 letters); dim when there is nothing to reset.
export const RESET_H = 18;
export class MixerReset {
  constructor({ title, onReset, anyChanged }) {
    this.onReset = onReset;
    this.anyChanged = anyChanged;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cv-screen cv-mixer-reset';
    this.canvas.width = STRIP_W;
    this.canvas.height = RESET_H;
    this.canvas.title = title || '';
    this.canvas.setAttribute('role', 'button');
    this.canvas.tabIndex = 0;
    this.g = this.canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.pressed = false;
    const press = () => { this.pressed = true; this.draw(); setTimeout(() => { this.pressed = false; this.onReset(); this.draw(); }, 90); };
    this.canvas.addEventListener('click', press);
    this.canvas.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(); } });
    this.draw();
  }

  draw() {
    const g = this.g, w = this.canvas.width, on = this.anyChanged();
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, RESET_H);
    // A raised key in the rail's greys around a black face (rFont_03 is drawn on black):
    // light top-left edge, dark bottom-right; the other way round while pressed.
    const x = LABEL_X, y = 3, bw = w - LABEL_X * 2, bh = RESET_H - 4;
    const light = this.pressed ? '#1a1a1a' : '#9a9a9a', dark = this.pressed ? '#9a9a9a' : '#1a1a1a';
    g.fillStyle = '#4a4a4a';
    g.fillRect(x, y, bw, bh);
    g.fillStyle = light;
    g.fillRect(x, y, bw, 1); g.fillRect(x, y, 1, bh);
    g.fillStyle = dark;
    g.fillRect(x, y + bh - 1, bw, 1); g.fillRect(x + bw - 1, y, 1, bh);
    g.fillStyle = '#000';
    g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    const label = 'RESET ALL';
    g.globalAlpha = on ? 1 : 0.45;
    const font = images.rFont_03;
    let tx = x + Math.floor((bw - label.length * 4) / 2) + (this.pressed ? 1 : 0);
    const ty = y + Math.floor((bh - 8) / 2) + (this.pressed ? 1 : 0);
    for (const ch of label) {
      const i = ch.charCodeAt(0) - 0x20;
      if (i > 0 && i < 64) g.drawImage(font, (i % 32) * 4, Math.floor(i / 32) * 8, 4, 8, tx, ty, 4, 8);
      tx += 4;
    }
    g.globalAlpha = 1;
    this.canvas.style.cursor = on ? 'pointer' : 'default';
  }
}

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
    }
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
    c.addEventListener('pointerdown', (e) => {
      const { x, y, row } = this.hit(e);
      if (y < 8) return;
      if (!row) return;
      const ch = row[1];
      if (x < FADER_X) {
        // The number: OFF and back.
        const vol = this.get(ch);
        if (vol <= MIN_VOL) this.change(ch, this.restore.get(ch) ?? 0);
        else { this.restore.set(ch, vol); this.change(ch, MIN_VOL); }
        return;
      }
      drag = ch;
      c.setPointerCapture(e.pointerId);
      this.change(ch, volAt(x - FADER_X - KNOB_W / 2));
      e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
      if (drag === null) return;
      const { x } = this.hit(e);
      this.change(drag, volAt(x - FADER_X - KNOB_W / 2));
    });
    const end = () => { drag = null; };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('dblclick', (e) => {
      const { y, row } = this.hit(e);
      // VOL: every channel of the chip back to the song's level; a fader: that one.
      if (y < 8) { this.resetAll(); return; }
      if (row) this.change(row[1], 0);
    });
    c.addEventListener('wheel', (e) => {
      const { row } = this.hit(e);
      if (!row) return;
      e.preventDefault();
      // One step (0.5 dB) a notch, as MDPlayer's mixer.
      const vol = this.get(row[1]);
      this.change(row[1], Math.max(MIN_VOL, Math.min(MAX_VOL, vol + (e.deltaY < 0 ? 1 : -1))));
    }, { passive: false });
  }
}
