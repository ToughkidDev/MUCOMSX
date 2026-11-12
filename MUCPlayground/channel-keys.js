// Keys while playing: every part of the song as its own keyboard, one row each, the key it
// plays pressed in its colour, the way chiptune videos show the channels. The page shows it
// in the right frame while a song plays with the keys mode on (the piano for writing notes
// comes back when it stops).
//   parts     [{ name, chip, color, perc, pads }] from the song's text; a rhythm, drum or
//             effect part (perc) has no pitch: its row is a set of drum pads (BD, SD, HH …,
//             or the effects XD0–XD9), each lit as it is hit and fading; they come last
//   range     the keyboards cover the octaves the song's notes use (at least four)
//   notes     update(map) each frame: part name -> MIDI note sounding now, or null; for a
//             drum part { ev, hits: [pad index …] }, a new ev being a new hit

const BLACK = [1, 3, 6, 8, 10];
const WHITE_OF = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];   // semitone -> white key in the octave
const FLASH = 260;   // ms a drum pad takes to fade after a hit

export class ChannelKeys {
  // opts: t(key, …args)
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.parts = [];
    this.notes = new Map();
    this.hits = new Map();   // drum part name -> [time of each pad's last hit]
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
      if (!p.perc) continue;
      const was = this.notes.get(p.name), now = notes.get(p.name);
      if (!now || now.ev === was?.ev) continue;
      const times = this.hits.get(p.name) || [];
      for (const i of now.hits) times[i] = performance.now();
      this.hits.set(p.name, times);
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
    const firstDrum = this.parts.findIndex((p) => p.perc);
    const sep = firstDrum > 0 ? 8 : 0;   // a space between the keyboards and the drums
    const rowH = Math.max(12, Math.min(64, (H - gap - sep) / n - gap));
    const labelW = Math.min(76, Math.max(46, W * 0.12));
    const kx = labelW + gap * 2, kw = W - kx - gap;
    const octaves = (this.hi - this.lo + 1) / 12;
    const whiteW = kw / (octaves * 7);
    const now = performance.now();
    const fs = Math.max(10, Math.min(13, rowH * 0.42));
    this.parts.forEach((p, k) => {
      const y = gap + k * (rowH + gap) + (firstDrum > 0 && k >= firstDrum ? sep : 0);
      if (y > H) return;
      if (k === firstDrum && sep) {
        g.fillStyle = '#2b2f3a';
        g.fillRect(gap, y - sep / 2 - gap / 2 - 0.5, W - gap * 2, 1);
      }
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
      if (p.perc) { this.drawPads(g, p, kx, y, kw, rowH, now); return; }
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

  // A drum part: a pad per drum (or effect), named on it, lit in the part's colour when hit
  // and fading out.
  drawPads(g, p, x0, y, w, h, now) {
    const pads = p.pads?.length ? p.pads : ['HIT'];
    const times = this.hits.get(p.name) || [];
    const pg = 4;
    const pw = Math.min(110, (w - pg * (pads.length - 1)) / pads.length);
    const r = Math.min(6, h / 4, pw / 4);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `600 ${Math.max(9, Math.min(13, h * 0.42, pw * 0.3))}px ui-monospace, Menlo, Consolas, monospace`;
    pads.forEach((name, i) => {
      const x = x0 + i * (pw + pg);
      const a = Math.max(0, 1 - (now - (times[i] ?? -1e9)) / FLASH);
      g.beginPath();
      g.roundRect(x, y, pw, h, r);
      g.fillStyle = '#1d2028';
      g.fill();
      if (a > 0) {
        g.globalAlpha = 0.25 + 0.75 * a;
        g.fillStyle = p.color;
        g.fill();
        g.globalAlpha = 1;
      }
      g.lineWidth = 1;
      g.strokeStyle = a > 0 ? p.color : '#363b48';
      g.stroke();
      g.fillStyle = a > 0.35 ? '#ffffff' : '#8a93a6';
      g.fillText(name, x + pw / 2, y + h / 2 + 0.5);
    });
    g.textAlign = 'start';
  }
}
