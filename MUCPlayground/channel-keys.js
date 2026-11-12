// Keys while playing: every part of the song as its own keyboard, one row each, the key it
// plays pressed in its colour, the way chiptune videos show the channels. The page shows it
// in the right frame while a song plays with the keys mode on (the piano for writing notes
// comes back when it stops).
//   parts     [{ name, chip, color, perc }] from the song's text; a rhythm, drum or effect
//             part (perc) has no pitch: its row flashes on each hit
//   range     the keyboards cover the octaves the song's notes use (at least four)
//   notes     update(map) each frame: part name -> MIDI note sounding now, or null

const BLACK = [1, 3, 6, 8, 10];
const WHITE_OF = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];   // semitone -> white key in the octave
const FLASH = 140;   // ms a hit stays lit on a rhythm row

export class ChannelKeys {
  // opts: t(key, …args)
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.parts = [];
    this.notes = new Map();
    this.hits = new Map();   // perc part name -> time of its last hit
    this.lo = 36; this.hi = 95;
    this.build();
  }

  get isOpen() { return !this.root.hidden; }

  build() {
    const T = this.o.t;
    this.root.innerHTML = `
      <div class="ck-bar"><b><span aria-hidden="true">🎹</span> ${T('ckTitle')}</b><span class="ck-info"></span></div>
      <div class="ck-area" role="img"><canvas class="ck-canvas" aria-hidden="true"></canvas></div>`;
    this.area = this.root.querySelector('.ck-area');
    this.canvas = this.root.querySelector('.ck-canvas');
    new ResizeObserver(() => this.draw()).observe(this.area);
    this.describe();
  }

  // A song starts: its parts, and the lowest and highest notes they play.
  start(parts, lo, hi) {
    this.parts = parts;
    this.notes = new Map();
    this.hits = new Map();
    // whole octaves, at least four
    let a = Math.floor((Number.isFinite(lo) ? lo : 48) / 12), b = Math.floor((Number.isFinite(hi) ? hi : 72) / 12);
    while (b - a < 3) { if (a > 1) a--; if (b - a < 3) b++; }
    this.lo = a * 12; this.hi = b * 12 + 11;
    this.describe();
    this.draw();
  }

  stop() {
    this.notes = new Map();
    this.hits = new Map();
    this.draw();
  }

  // Each frame: what every part sounds now (name -> MIDI note or null). A rhythm part's
  // hit is a new note object (it lights its row for a moment).
  update(notes) {
    for (const p of this.parts) {
      const was = this.notes.get(p.name), now = notes.get(p.name) ?? null;
      if (p.perc && now !== null && now !== was) this.hits.set(p.name, performance.now());
    }
    this.notes = notes;
    this.draw();
  }

  describe() {
    const T = this.o.t;
    const text = this.parts.length ? T('ckParts', this.parts.length) : T('ckIdle');
    const info = this.root.querySelector('.ck-info');
    if (info) info.textContent = text;
    this.area?.setAttribute('aria-label', text);
  }

  draw() {
    if (!this.isOpen) return;
    const area = this.area, cv = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, area.clientWidth), H = Math.max(1, area.clientHeight);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#121317';
    g.fillRect(0, 0, W, H);
    if (!this.parts.length) {
      g.fillStyle = '#7f8899';
      g.font = '14px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(this.o.t('ckIdle'), W / 2, H / 2);
      g.textAlign = 'start';
      return;
    }
    const n = this.parts.length;
    const gap = 3;
    const rowH = Math.max(12, Math.min(64, (H - gap) / n - gap));
    const labelW = Math.min(76, Math.max(46, W * 0.12));
    const kx = labelW + gap * 2, kw = W - kx - gap;
    const octaves = (this.hi - this.lo + 1) / 12;
    const whiteW = kw / (octaves * 7);
    const now = performance.now();
    const fs = Math.max(10, Math.min(13, rowH * 0.42));
    this.parts.forEach((p, k) => {
      const y = gap + k * (rowH + gap);
      if (y > H) return;
      const midi = this.notes.get(p.name) ?? null;
      // the label: the part's name in its colour, its chip under it
      g.fillStyle = '#1b1e25';
      g.fillRect(gap, y, labelW, rowH);
      g.fillStyle = p.color;
      g.fillRect(gap, y, 3, rowH);
      g.textBaseline = 'middle';
      g.font = `600 ${fs}px ui-monospace, Menlo, Consolas, monospace`;
      g.fillStyle = '#e6e8ee';
      g.fillText(p.name, gap + 8, y + rowH * (rowH > 26 ? 0.36 : 0.5));
      if (rowH > 26) {
        g.font = `${Math.max(9, fs - 2)}px ui-monospace, Menlo, Consolas, monospace`;
        g.fillStyle = '#8a93a6';
        g.fillText(p.chip, gap + 8, y + rowH * 0.72);
      }
      if (p.perc) {
        // a rhythm, drum or effect part: one long cell, lit on each hit
        const lit = now - (this.hits.get(p.name) || -1e9) < FLASH;
        g.fillStyle = lit ? p.color : '#1d2028';
        g.fillRect(kx, y, kw, rowH);
        g.strokeStyle = '#2b2f3a';
        g.strokeRect(kx + 0.5, y + 0.5, kw - 1, rowH - 1);
        return;
      }
      // white keys, then black keys over them
      for (let o = 0; o < octaves; o++) {
        for (let wk = 0; wk < 7; wk++) {
          const x = kx + (o * 7 + wk) * whiteW;
          const semi = [0, 2, 4, 5, 7, 9, 11][wk];
          const on = midi === this.lo + o * 12 + semi;
          g.fillStyle = on ? p.color : '#c9ccd6';
          g.fillRect(x, y, Math.max(1, whiteW - 1), rowH);
        }
      }
      const bw = whiteW * 0.62, bh = rowH * 0.6;
      for (let o = 0; o < octaves; o++) {
        for (const semi of BLACK) {
          const x = kx + (o * 7 + WHITE_OF[semi] + 1) * whiteW - bw / 2 - 0.5;
          const on = midi === this.lo + o * 12 + semi;
          g.fillStyle = on ? p.color : '#22252d';
          g.fillRect(x, y, bw, bh);
        }
      }
      // a pressed key also shows as a glow line under the row, readable on small keys
      if (midi !== null && midi >= this.lo && midi <= this.hi) {
        const o = Math.floor((midi - this.lo) / 12), semi = (midi - this.lo) % 12;
        const x = BLACK.includes(semi) ? kx + (o * 7 + WHITE_OF[semi] + 1) * whiteW - bw / 2 : kx + (o * 7 + WHITE_OF[semi]) * whiteW;
        g.fillStyle = p.color;
        g.fillRect(x, y + rowH - 3, BLACK.includes(semi) ? bw : whiteW - 1, 3);
      }
    });
  }
}
