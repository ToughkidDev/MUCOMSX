// Oscilloscope view: every channel of the playing song as its own waveform, the way chiptune
// oscilloscope videos show them, next to the MUC text.
//   samples   the engine reads each channel's output from inside the chip emulators while
//             it plays (src/Engine/ChannelScope.cs) and sends them at 22,050 Hz with the
//             output frame they start at; they are kept here for a few seconds
//   drawing   each frame shows, per channel, the stretch of wave ending where the audio is
//             heard now, moved back to its steepest rising zero crossing so a steady note
//             stands still; the height follows the channel's recent peak
//   channels  the ones that have sounded so far (or all of the song's chips with All); each
//             panel also names the MML note or command the part is playing now
//   levels    under the panels, a meter per channel: its loudness (RMS over 20 ms) against
//             the chip's full output, in dB, with the peak held for a second; unlike the
//             waves, whose height follows each channel, the meters compare the channels
const RATE = 22050;
const RING = 1 << 16;                 // samples kept per channel (about 3 s)
const FLOOR = { FM: 2000, SSG: 300, PSG: 300, RHY: 2000, ADPCM: 2000, OPLL: 1200, DRUM: 1200, SCC: 2000 };
// A channel's full output, as the engine reads it (see ChannelScope.cs), for the meters.
const FULL = { FM: 32768, SSG: 1400, PSG: 1400, RHY: 32768, ADPCM: 32768, OPLL: 8192, DRUM: 16384, SCC: 30720 };
const RANGE_DB = 48;
const STORE_WINDOW = 'mucplayground.scopeWindow', STORE_ALL = 'mucplayground.scopeAll', STORE_METERS = 'mucplayground.scopeMeters';


export class ScopeView {
  // opts: t(key, …args); colors(name): a part's colour; now(): the output frame heard now,
  // or null when nothing plays; noteOf(name): what that part is playing now ('' if nothing).
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.channels = [];      // { name, chip, ring: Int16Array, active, peak }
    this.newest = -1;        // newest sample index written (absolute, in 22,050 Hz samples)
    this.windowMs = 25;
    this.all = false;
    this.meters = true;
    try {
      this.meters = localStorage.getItem(STORE_METERS) !== '0';
      const w = Number(localStorage.getItem(STORE_WINDOW));
      if (w >= 5 && w <= 100) this.windowMs = w;
      this.all = localStorage.getItem(STORE_ALL) === '1';
    } catch { /* defaults */ }
    this.build();
  }

  get isOpen() { return !this.root.hidden; }

  build() {
    const T = this.o.t;
    this.root.innerHTML = `
      <div class="scope-bar">
        <b><span aria-hidden="true">∿</span> ${T('scopeTitle')}</b>
        <label title="${T('scopeWindowTip')}">${T('scopeWindow')} <input type="range" class="scope-win" min="5" max="100" step="1" value="${this.windowMs}" aria-describedby="scopeWinOut"><output id="scopeWinOut" class="scope-win-out"></output></label>
        <label title="${T('scopeAllTip')}"><input type="checkbox" class="scope-all"${this.all ? ' checked' : ''}> ${T('scopeAll')}</label>
        <label title="${T('scopeMetersTip')}"><input type="checkbox" class="scope-meters"${this.meters ? ' checked' : ''}> ${T('scopeMeters')}</label>
        <span class="scope-info" aria-live="polite"></span>
      </div>
      <div class="scope-area" role="img"><canvas class="scope-canvas" aria-hidden="true"></canvas></div>`;
    const q = (s) => this.root.querySelector(s);
    this.canvas = q('.scope-canvas');
    this.area = q('.scope-area');
    const win = q('.scope-win');
    const showWin = () => { q('.scope-win-out').textContent = `${this.windowMs} ms`; };
    win.oninput = () => { this.windowMs = +win.value; showWin(); try { localStorage.setItem(STORE_WINDOW, String(this.windowMs)); } catch { /* ignore */ } this.drawOnce(); };
    win.ondblclick = () => { win.value = 25; win.oninput(); };
    showWin();
    q('.scope-all').onchange = (e) => { this.all = e.target.checked; try { localStorage.setItem(STORE_ALL, this.all ? '1' : '0'); } catch { /* ignore */ } this.describe(); this.drawOnce(); };
    q('.scope-meters').onchange = (e) => { this.meters = e.target.checked; try { localStorage.setItem(STORE_METERS, this.meters ? '1' : '0'); } catch { /* ignore */ } this.drawOnce(); };
    new ResizeObserver(() => this.drawOnce()).observe(this.area);
    this.describe();
  }

  // ---------- data ----------
  // A new song: its channels, in the engine's order ([{ name, chip }]).
  setChannels(list) {
    this.channels = (list || []).map((c) => ({ name: c.name, chip: c.chip, ring: new Int16Array(RING), active: false, peak: 0, level: 0, hold: 0, holdAt: 0 }));
    this.newest = -1;
    this.unsupported = false;
    this.describe();
    this.drawOnce();
  }

  // Playback of something the scope cannot show (a VGM file).
  setUnsupported() {
    this.channels = [];
    this.unsupported = true;
    this.describe();
    this.drawOnce();
  }

  // A batch from the engine: int32 frame of the first sample, then int16 per channel per sample.
  push(buffer) {
    const n = this.channels.length;
    if (!n || buffer.byteLength < 6) return;
    const frame = new DataView(buffer).getInt32(0, true);
    const s = new Int16Array(buffer, 4, (buffer.byteLength - 4) >> 1);
    const count = Math.floor(s.length / n);
    const a0 = Math.floor(frame / 2);
    let fresh = false;
    for (let c = 0; c < n; c++) {
      const ch = this.channels[c];
      const ring = ch.ring;
      for (let i = 0; i < count; i++) {
        const v = s[i * n + c];
        ring[(a0 + i) & (RING - 1)] = v;
        if (!ch.active && (v > 48 || v < -48)) { ch.active = true; fresh = true; }
      }
    }
    this.newest = Math.max(this.newest, a0 + count - 1);
    if (fresh) this.describe();
  }

  shown() { return this.channels.filter((c) => this.all || c.active); }

  // The info line and the picture's text alternative: which channels are shown.
  describe() {
    const T = this.o.t;
    const list = this.shown();
    const info = this.root.querySelector('.scope-info');
    const area = this.root.querySelector('.scope-area');
    const text = this.unsupported ? T('scopeVgm') : !this.channels.length ? T('scopeIdle') : !list.length ? T('scopeWaiting')
      : T('scopeChannels', list.length, list.map((c) => `${c.name} ${c.chip}`).join(', '));
    if (info) info.textContent = this.unsupported || !this.channels.length || !list.length ? text : T('scopeCount', list.length);
    if (area) area.setAttribute('aria-label', text);
  }

  // ---------- drawing ----------
  open() { this.describe(); this.loop(); }
  close() { cancelAnimationFrame(this.raf); this.raf = 0; }

  loop() {
    cancelAnimationFrame(this.raf);
    const tick = () => {
      if (!this.isOpen) { this.raf = 0; return; }
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  drawOnce() { if (this.isOpen) this.draw(); }

  draw() {
    const area = this.area, cv = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, area.clientWidth), H = Math.max(1, area.clientHeight);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#07080b';
    g.fillRect(0, 0, W, H);
    const list = this.shown();
    if (!list.length) {
      g.fillStyle = '#7f8899';
      g.font = '14px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const T = this.o.t;
      g.fillText(this.unsupported ? T('scopeVgm') : !this.channels.length ? T('scopeIdle') : T('scopeWaiting'), W / 2, H / 2);
      g.textAlign = 'start';
      return;
    }
    // A grid wider than tall, like the videos: one column on a narrow pane, up to four.
    const n = list.length;
    let cols = 1;
    for (let c = 1; c <= 4; c++) {
      const w = W / c, h = H / Math.ceil(n / c);
      cols = c;
      if (w / h <= 3.2 || c === n) break;
    }
    if (W / cols < 150) cols = Math.max(1, Math.floor(W / 150));
    const rows = Math.ceil(n / cols);
    const meterH = this.meters ? Math.round(Math.max(64, Math.min(140, H * 0.2))) : 0;
    const cw = W / cols, chh = (H - meterH) / rows;
    const now = this.o.now();
    const end = now === null ? this.newest : Math.min(this.newest, Math.floor(now / 2));
    const win = Math.max(16, Math.round((this.windowMs / 1000) * RATE));
    list.forEach((ch, k) => {
      const x0 = (k % cols) * cw, y0 = Math.floor(k / cols) * chh;
      this.drawChannel(g, ch, x0, y0, cw, chh, end, win, now !== null);
    });
    this.measure(list, end, now !== null);
    if (meterH) this.drawMeters(g, list, 0, H - meterH, W, meterH);
  }

  // Each channel's level now: RMS over the last 20 ms in dB of the chip's full output, as
  // 0–1 of the meter; the peak is held for a second, then falls.
  measure(list, end, playing) {
    const t = performance.now();
    const len = Math.round(RATE * 0.02);
    for (const ch of list) {
      let level = 0;
      if (playing && end >= 0) {
        let sum = 0;
        for (let i = 0; i < len; i++) { const v = ch.ring[(end - i) & (RING - 1)]; sum += v * v; }
        const rms = Math.sqrt(sum / len);
        const db = 20 * Math.log10(Math.max(1e-9, (rms * Math.SQRT2) / (FULL[ch.chip] || 32768)));
        level = Math.min(1, Math.max(0, (db + RANGE_DB) / RANGE_DB));
      }
      ch.level = Math.max(level, ch.level * 0.86);
      if (ch.level >= ch.hold) { ch.hold = ch.level; ch.holdAt = t; }
      else if (t - ch.holdAt > 1000) ch.hold = Math.max(ch.level, ch.hold - 0.015);
    }
  }

  // The level strip under the panels: one vertical meter per channel, named under it.
  drawMeters(g, list, x0, y0, w, h) {
    g.fillStyle = '#0b0c10';
    g.fillRect(x0, y0, w, h);
    g.fillStyle = '#1d2129';
    g.fillRect(x0, y0, w, 1);
    const n = list.length, colW = w / n;
    const labelH = 16, top = y0 + 8, barH = h - labelH - 14;
    const barW = Math.max(4, Math.min(26, colW * 0.45));
    // scale marks every 12 dB
    g.strokeStyle = '#1a1e26';
    for (let db = 0; db <= RANGE_DB; db += 12) {
      const y = Math.round(top + (barH * db) / RANGE_DB) + 0.5;
      g.beginPath(); g.moveTo(x0 + 2, y); g.lineTo(x0 + w - 2, y); g.stroke();
    }
    const grad = g.createLinearGradient(0, top + barH, 0, top);
    grad.addColorStop(0, '#2fa863'); grad.addColorStop(0.7, '#d7c23e'); grad.addColorStop(1, '#e5534b');
    list.forEach((ch, k) => {
      const cx = x0 + colW * k + colW / 2, bx = Math.round(cx - barW / 2);
      g.fillStyle = '#151820';
      g.fillRect(bx, top, barW, barH);
      const fill = Math.round(barH * ch.level);
      if (fill > 0) { g.fillStyle = grad; g.fillRect(bx, top + barH - fill, barW, fill); }
      if (ch.hold > 0.01) {
        g.fillStyle = '#f0f2f6';
        g.fillRect(bx, Math.round(top + barH - barH * ch.hold), barW, 2);
      }
      // the part's colour as a cap, its name under the meter
      g.fillStyle = this.o.colors(ch.name);
      g.fillRect(bx, top + barH + 2, barW, 2);
      g.font = `${colW < 34 ? 9 : 11}px ui-monospace, Menlo, Consolas, monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'top';
      g.fillText(colW < 34 ? ch.name.replace(/^(MSX|SCC)/, '') : ch.name, cx, top + barH + 6);
      g.textAlign = 'start';
      g.textBaseline = 'alphabetic';
    });
  }

  drawChannel(g, ch, x0, y0, w, h, end, win, playing) {
    const ring = ch.ring, mask = RING - 1;
    const color = this.o.colors(ch.name);
    // frame
    g.fillStyle = '#0c0e13';
    g.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.strokeStyle = '#1d2129';
    g.lineWidth = 1;
    g.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    const mid = y0 + h / 2;
    g.strokeStyle = '#1a1e26';
    g.beginPath(); g.moveTo(x0 + 4, mid); g.lineTo(x0 + w - 4, mid); g.stroke();
    // the stretch shown: its middle moved back to the steepest rising zero crossing within
    // half a window, so a steady wave stands still
    let center = end - Math.floor(win / 2);
    if (end >= 0) {
      let best = -1, slope = 0;
      for (let i = center; i > center - win / 2; i--) {
        const a = ring[(i - 1) & mask], b = ring[i & mask];
        if (a < 0 && b >= 0 && b - a > slope) { slope = b - a; best = i; }
      }
      if (best >= 0) center = best;
    }
    const from = center - Math.floor(win / 2);
    // height: the channel's recent peak (falling slowly), never below a floor for its chip
    let peak = 0;
    if (end >= 0) for (let i = 0; i < win; i++) { const v = Math.abs(ring[(from + i) & mask]); if (v > peak) peak = v; }
    ch.peak = Math.max(peak, ch.peak * 0.97);
    const scale = (h * 0.42) / Math.max(ch.peak, FLOOR[ch.chip] || 1000);
    // the wave
    if (end >= 0) {
      g.save();
      g.beginPath();
      g.rect(x0 + 2, y0 + 2, w - 4, h - 4);
      g.clip();
      g.strokeStyle = color;
      g.lineWidth = 1.6;
      g.lineJoin = 'round';
      g.shadowColor = color;
      g.shadowBlur = 6;
      g.globalAlpha = ch.active ? 1 : 0.35;
      g.beginPath();
      const step = Math.max(1, Math.floor(win / (w * 2)));
      for (let i = 0; i < win; i += step) {
        const x = x0 + 4 + ((w - 8) * i) / (win - 1);
        const y = mid - ring[(from + i) & mask] * scale;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      g.restore();
    }
    // label, on a dark plate so a tall wave never hides it
    const big = Math.max(11, Math.min(14, h / 6)), small = Math.max(10, Math.min(12, h / 7));
    g.font = `600 ${big}px ui-monospace, Menlo, Consolas, monospace`;
    const nameW = g.measureText(ch.name).width;
    g.font = `${small}px ui-monospace, Menlo, Consolas, monospace`;
    const chipW = g.measureText(ch.chip).width;
    g.fillStyle = 'rgba(7, 8, 11, 0.78)';
    g.fillRect(x0 + 4, y0 + 3, nameW + chipW + 16, big + 6);
    g.textBaseline = 'top';
    g.font = `600 ${big}px ui-monospace, Menlo, Consolas, monospace`;
    g.fillStyle = color;
    g.fillText(ch.name, x0 + 8, y0 + 6);
    g.font = `${small}px ui-monospace, Menlo, Consolas, monospace`;
    g.fillStyle = '#8a93a6';
    g.fillText(ch.chip, x0 + 14 + nameW, y0 + 7);
    // what the part plays now (its MML), at the right
    const note = playing ? (this.o.noteOf?.(ch.name) || '').slice(0, 14) : '';
    if (note) {
      g.font = `600 ${big}px ui-monospace, Menlo, Consolas, monospace`;
      const nw = g.measureText(note).width;
      g.fillStyle = 'rgba(7, 8, 11, 0.78)';
      g.fillRect(x0 + w - nw - 14, y0 + 3, nw + 10, big + 6);
      g.fillStyle = '#e8eaf0';
      g.fillText(note, x0 + w - nw - 9, y0 + 6);
    }
    g.textBaseline = 'alphabetic';
  }
}
