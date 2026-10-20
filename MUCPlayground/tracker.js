// Tracker view: the song's parts as columns of rows, the way Furnace shows a pattern, next
// to the MUC text and kept in step with it both ways.
//   reading   mml-timeline.js turns the text into notes and rests per part; each row is a
//             fixed number of clocks (the Row setting), each cell shows the note starting
//             there (C#4), its voice (@) and volume (v) in hex, OFF where a rest follows a
//             note, and a line while a note is held. Notes from repeats or macros are dimmed:
//             they come from the same text as the first time
//   editing   typing a note (Z S X … / Q 2 W …, as on the keys), Delete (rest) or 1 (note
//             off) in a cell rewrites the MML token behind it: a new pitch, or the token cut
//             in two where the cell lies inside a note or rest. The text changes, and the
//             tracker is redrawn from the text
//   playing   the page passes the playing position (from the engine's trace); the rows scroll
//             with it, the playing row in the middle

import { timeline, lengthText, noteText } from './mml-timeline.js';
import { KEY_MAP } from './keyboard.js';

const NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
const RESOLUTIONS = [4, 8, 12, 16, 24, 32, 48, 64];   // rows per whole note
const C = {
  bg: '#121317', row4: '#1a1c22', row16: '#232731', grid: '#2b2f3a', num: '#6f7787', num16: '#d6b25e',
  note: '#e6e6e6', inst: '#5ab0f0', vol: '#7fd17f', off: '#e3736a', empty: '#3d4250', hold: '#4b5263',
  dim: 0.45, cursorRow: '#26304a', cursor: '#5aa0ff', play: '#4a2f68', playLine: '#b07cff', head: '#191b21', text: '#c8ccd6',
};

const hex2 = (v) => (v === null || v === undefined ? '..' : typeof v === 'string' ? (v.slice(0, 2) + '..').slice(0, 2) : ((v & 255).toString(16).toUpperCase().padStart(2, '0')));

export class Tracker {
  // opts: t(key, …args); edit(edits[]): apply [{ row, col, len, text }] to the MUC text;
  // reveal(src | null): show an event's source in the text; preview(on, midi, trackName);
  // colors(name): a part's colour.
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.tracks = [];
    this.perWhole = 16;
    this.cursor = { track: 0, row: 0 };
    this.octave = 4;
    this.playTick = null;
    this.follow = true;
    this.holdUntil = 0;
    this.autoAt = 0;
    this.build();
  }

  get isOpen() { return !this.root.hidden; }

  build() {
    const T = this.o.t;
    this.root.innerHTML = `
      <div class="trk-bar">
        <b>🎼 ${T('trkTitle')}</b>
        <label>${T('trkRow')} <select class="trk-res">${RESOLUTIONS.map((r) => `<option value="${r}"${r === this.perWhole ? ' selected' : ''}>1/${r}</option>`).join('')}</select></label>
        <span class="tool-group" role="group" aria-label="${T('keysOctave')}"><button type="button" class="btn small" data-oct="-1">−</button><output class="trk-oct"></output><button type="button" class="btn small" data-oct="1">+</button></span>
        <span class="trk-info"></span>
      </div>
      <div class="trk-scroll" tabindex="0" aria-label="${T('trkTitle')}"><canvas class="trk-canvas"></canvas><div class="trk-spacer"></div></div>`;
    const q = (s) => this.root.querySelector(s);
    this.scroller = q('.trk-scroll');
    this.canvas = q('.trk-canvas');
    this.spacer = q('.trk-spacer');
    q('.trk-res').onchange = (e) => { const tick = this.cursor.row * this.rowTicks; this.perWhole = +e.target.value; this.cursor.row = Math.floor(tick / this.rowTicks); this.layout(); this.scrollToCursor(); };
    this.root.querySelectorAll('[data-oct]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.onclick = () => this.setOctave(this.octave + +b.dataset.oct);
    });
    // Scrolling by hand while a song plays stops the rows following it for a moment.
    this.scroller.addEventListener('scroll', () => { if (performance.now() - this.autoAt > 80) this.holdUntil = performance.now() + 2500; this.draw(); });
    this.scroller.addEventListener('pointerdown', (e) => this.click(e));
    this.scroller.addEventListener('keydown', (e) => this.key(e));
    this.scroller.addEventListener('keyup', (e) => { if (this.held === e.code) { this.o.preview(false, this.heldMidi); this.held = null; } });
    this.scroller.addEventListener('focus', () => this.draw());
    this.scroller.addEventListener('blur', () => this.draw());
    new ResizeObserver(() => this.layout()).observe(this.scroller);
    this.setOctave(this.octave);
  }

  setOctave(o) {
    this.octave = Math.max(1, Math.min(7, o));
    this.root.querySelector('.trk-oct').textContent = `o${this.octave}`;
  }

  // Clocks per row, from the first part's base clock.
  get rowTicks() { return Math.max(1, Math.round((this.tracks[0]?.clock || 128) / this.perWhole)); }

  setText(text) {
    try { this.tracks = timeline(text); } catch { this.tracks = []; }
    // Where each event is written (row:col, 1-based column like the trace) -> [track, index].
    this.bySource = new Map();
    this.tracks.forEach((tr, k) => tr.events.forEach((ev, i) => {
      const key = `${ev.src.row}:${ev.src.col + 1}`;
      if (!this.bySource.has(key)) this.bySource.set(key, []);
      this.bySource.get(key).push([k, i]);
    }));
    this.cursor.track = Math.min(this.cursor.track, Math.max(0, this.tracks.length - 1));
    this.layout();
  }

  // ---------- geometry ----------
  metrics() {
    const g = this.canvas.getContext('2d');
    g.font = '13px ui-monospace, Menlo, Consolas, monospace';
    const cw = g.measureText('0').width;
    return { cw, rowH: 18, headH: 24, numW: Math.ceil(cw * 4 + 14), colW: Math.ceil(cw * 10 + 14) };
  }

  get rows() {
    const end = Math.max(0, ...this.tracks.map((t) => t.end));
    return Math.ceil(end / this.rowTicks) + 1;
  }

  layout() {
    if (!this.isOpen) return;
    const m = this.metrics();
    this.m = m;
    const w = this.scroller.clientWidth, h = this.scroller.clientHeight;
    // Room above and below so any row can sit in the middle.
    this.pad = Math.max(0, Math.floor((h - m.headH) / 2 - m.rowH));
    this.spacer.style.width = `${m.numW + this.tracks.length * m.colW}px`;
    this.spacer.style.height = `${m.headH + this.pad * 2 + this.rows * m.rowH}px`;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.draw();
  }

  rowY(row) { return this.m.headH + this.pad + row * this.m.rowH - this.scroller.scrollTop; }
  colX(track) { return this.m.numW + track * this.m.colW - this.scroller.scrollLeft; }

  // ---------- events ----------
  // The event of `track` sounding at `tick` (its start at or before), or null.
  eventAt(track, tick) {
    const evs = this.tracks[track]?.events || [];
    let lo = 0, hi = evs.length - 1, found = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (evs[mid].tick <= tick) { found = mid; lo = mid + 1; } else hi = mid - 1; }
    if (found < 0) return null;
    const ev = evs[found];
    return tick < ev.tick + ev.len ? { ev, index: found } : null;
  }

  // Events starting inside row `row` of a track.
  startsIn(track, row) {
    const evs = this.tracks[track]?.events || [];
    const a = row * this.rowTicks, b = a + this.rowTicks;
    let lo = 0, hi = evs.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (evs[mid].tick < a) lo = mid + 1; else hi = mid; }
    const out = [];
    for (let i = lo; i < evs.length && evs[i].tick < b; i++) out.push(evs[i]);
    return out;
  }

  // ---------- drawing ----------
  draw() {
    if (!this.isOpen || !this.m) return;
    const m = this.m;
    const g = this.canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = this.canvas.width / dpr, H = this.canvas.height / dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);
    g.font = '13px ui-monospace, Menlo, Consolas, monospace';
    g.textBaseline = 'middle';
    const first = Math.max(0, Math.floor((this.scroller.scrollTop - this.pad) / m.rowH) - 1);
    const last = Math.min(this.rows - 1, first + Math.ceil(H / m.rowH) + 2);
    const playRow = this.playTick === null ? -1 : Math.floor(this.playTick / this.rowTicks);
    const focused = document.activeElement === this.scroller;
    // row bands
    for (let r = first; r <= last; r++) {
      const y = this.rowY(r);
      if (y + m.rowH < m.headH || y > H) continue;
      let band = r % 16 === 0 ? C.row16 : r % 4 === 0 ? C.row4 : null;
      if (r === playRow) band = C.play;
      else if (r === this.cursor.row) band = C.cursorRow;
      if (band) { g.fillStyle = band; g.fillRect(0, y, W, m.rowH); }
    }
    // cells
    for (let k = 0; k < this.tracks.length; k++) {
      const x = this.colX(k);
      if (x + m.colW < m.numW || x > W) continue;
      g.strokeStyle = C.grid;
      g.beginPath(); g.moveTo(Math.round(x) + .5, m.headH); g.lineTo(Math.round(x) + .5, H); g.stroke();
      const color = this.o.colors(this.tracks[k].name);
      for (let r = first; r <= last; r++) {
        const y = this.rowY(r);
        if (y + m.rowH < m.headH || y > H) continue;
        const cy = y + m.rowH / 2 + 0.5;
        const starts = this.startsIn(k, r);
        const ev = starts[0];
        let tx = x + 6;
        const put = (text, col, alpha = 1) => { g.globalAlpha = alpha; g.fillStyle = col; g.fillText(text, tx, cy); tx += g.measureText(text).width + m.cw * 0.6; g.globalAlpha = 1; };
        if (ev && ev.kind === 'note') {
          const a = ev.rep ? C.dim : 1;
          const name = NAMES[ev.midi % 12] + (Math.floor(ev.midi / 12) - 1);
          put(ev.tied ? '^^^' : name, ev.tied ? C.hold : C.note, a);
          put(hex2(ev.inst), C.inst, a);
          put(hex2(ev.vol), C.vol, a);
        } else if (ev && ev.kind === 'rest') {
          const before = this.eventAt(k, ev.tick - 1);
          put(before && before.ev.kind === 'note' ? 'OFF' : '···', before && before.ev.kind === 'note' ? C.off : C.empty, ev.rep ? C.dim : 1);
          put('..', C.empty); put('..', C.empty);
        } else {
          const held = this.eventAt(k, r * this.rowTicks);
          if (held && held.ev.kind === 'note') {
            // a held note: a bar in the part's colour
            g.fillStyle = color;
            g.globalAlpha = held.ev.rep ? 0.25 : 0.55;
            g.fillRect(x + 8, y, 3, m.rowH);
            g.globalAlpha = 1;
            tx = x + 6;
            put('   ', C.empty);
          } else put('···', C.empty);
          if (!(held && held.ev.kind === 'note')) { put('..', C.empty); put('..', C.empty); }
        }
        // more than one event in this row: a dot in the corner
        if (starts.length > 1) { g.fillStyle = C.num16; g.fillRect(x + m.colW - 6, y + 3, 3, 3); }
        if (focused && k === this.cursor.track && r === this.cursor.row) {
          g.strokeStyle = C.cursor; g.lineWidth = 1.5;
          g.strokeRect(x + 2.5, y + 1.5, m.cw * 3 + 8, m.rowH - 3);
          g.lineWidth = 1;
        }
      }
    }
    // row numbers (hex within 64-row patterns, like Furnace) and pattern breaks
    g.fillStyle = C.head;
    g.fillRect(0, m.headH, m.numW - 2, H);
    for (let r = first; r <= last; r++) {
      const y = this.rowY(r);
      if (y + m.rowH < m.headH || y > H) continue;
      g.fillStyle = r === playRow ? C.playLine : r % 16 === 0 ? C.num16 : C.num;
      const label = r % 64 === 0 ? `${(r / 64).toString(16).toUpperCase().padStart(2, '0')}:` : (r % 64).toString(16).toUpperCase().padStart(2, '0');
      g.fillText(label, 6, y + m.rowH / 2 + 0.5);
      if (r % 64 === 0 && r) { g.fillStyle = C.num16; g.fillRect(m.numW, y, W, 1); }
    }
    if (playRow >= 0) {
      const y = this.rowY(playRow);
      g.fillStyle = C.playLine;
      g.fillRect(0, y, 3, m.rowH);
    }
    // channel names
    g.fillStyle = C.head;
    g.fillRect(0, 0, W, m.headH);
    for (let k = 0; k < this.tracks.length; k++) {
      const x = this.colX(k);
      if (x + m.colW < m.numW || x > W) continue;
      g.fillStyle = this.o.colors(this.tracks[k].name);
      g.fillRect(x + 1, m.headH - 3, m.colW - 2, 3);
      g.fillStyle = C.text;
      g.fillText(this.tracks[k].name, x + 6, m.headH / 2);
    }
    g.fillStyle = C.head;
    g.fillRect(0, 0, m.numW - 2, m.headH);
    g.fillStyle = C.num;
    g.fillText(this.tracks.length ? 'ROW' : this.o.t('trkEmpty'), 6, m.headH / 2);
  }

  // ---------- moving ----------
  scrollToRow(row, center = false) {
    const m = this.m;
    if (!m) return;
    const top = m.headH + this.pad + row * m.rowH;
    const view = this.scroller.clientHeight;
    if (center) this.scroller.scrollTop = top - m.headH - (view - m.headH) / 2 + m.rowH / 2;
    else if (top - this.scroller.scrollTop < m.headH + m.rowH) this.scroller.scrollTop = top - m.headH - m.rowH;
    else if (top - this.scroller.scrollTop > view - m.rowH * 2) this.scroller.scrollTop = top - view + m.rowH * 2;
  }
  scrollToCursor() {
    if (!this.m) return;
    this.scrollToRow(this.cursor.row);
    const x = this.m.numW + this.cursor.track * this.m.colW;
    if (x - this.scroller.scrollLeft < this.m.numW) this.scroller.scrollLeft = x - this.m.numW;
    else if (x + this.m.colW - this.scroller.scrollLeft > this.scroller.clientWidth) this.scroller.scrollLeft = x + this.m.colW - this.scroller.clientWidth;
    this.draw();
  }

  moveTo(track, row, reveal = true) {
    this.cursor.track = Math.max(0, Math.min(this.tracks.length - 1, track));
    this.cursor.row = Math.max(0, Math.min(this.rows - 1, row));
    this.scrollToCursor();
    const hit = this.eventAt(this.cursor.track, this.cursor.row * this.rowTicks);
    this.showInfo(hit?.ev);
    if (reveal) this.o.reveal(hit ? hit.ev.src : null);
  }

  // The text's caret moved: put the cursor on the event written there.
  caretAt(row, col) {
    for (let k = 0; k < this.tracks.length; k++) {
      const ev = this.tracks[k].events.find((e) => e.src.row === row && col >= e.src.col && col <= e.src.col + e.src.len);
      if (ev) {
        this.cursor = { track: k, row: Math.floor(ev.tick / this.rowTicks) };
        if (this.playTick === null) this.scrollToCursor();
        this.showInfo(ev);
        this.draw();
        return;
      }
    }
  }

  showInfo(ev, message) {
    const info = this.root.querySelector('.trk-info');
    if (message) { info.textContent = message; return; }
    if (!ev) { info.textContent = this.o.t('trkHint'); return; }
    const where = this.o.t('trkWhere', ev.src.row, ev.tick, ev.len);
    info.textContent = where + (ev.shared ? ' · ' + this.o.t('trkShared') : '') + (ev.src.macro ? ' · ' + this.o.t('trkMacro') : '');
  }

  click(e) {
    if (!this.m) return;
    const r = this.scroller.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < this.m.headH || x < this.m.numW) return;
    const track = Math.floor((x + this.scroller.scrollLeft - this.m.numW) / this.m.colW);
    const row = Math.floor((y + this.scroller.scrollTop - this.m.headH - this.pad) / this.m.rowH);
    if (track < 0 || track >= this.tracks.length || row < 0) return;
    this.scroller.focus({ preventScroll: true });
    this.moveTo(track, row);
  }

  key(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const { track, row } = this.cursor;
    const move = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], PageUp: [0, -16], PageDown: [0, 16] }[e.code];
    if (move) { e.preventDefault(); this.moveTo(track + move[0], row + move[1]); return; }
    if (e.code === 'Home') { e.preventDefault(); this.moveTo(track, 0); return; }
    if (e.code === 'End') { e.preventDefault(); this.moveTo(track, this.rows - 1); return; }
    if (e.code === 'NumpadDivide' || e.code === 'NumpadMultiply') { e.preventDefault(); this.setOctave(this.octave + (e.code === 'NumpadMultiply' ? 1 : -1)); return; }
    if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); this.edit('rest'); return; }
    if (e.code === 'Digit1' || e.code === 'Backquote') { e.preventDefault(); this.edit('off'); return; }
    const semi = KEY_MAP[e.code];
    if (semi === undefined) return;
    e.preventDefault();
    if (e.repeat) return;
    const midi = 12 * (this.octave + 1) + semi;
    this.o.preview(true, midi, this.tracks[track]?.name);
    this.held = e.code; this.heldMidi = midi;
    this.edit('note', midi);
  }

  // ---------- editing ----------
  // Rewrites the token behind the cursor: 'note' (a pitch), 'rest' (Delete: the note
  // becomes a rest), 'off' (a rest from this row on).
  edit(action, midi) {
    const { track, row } = this.cursor;
    const tick = row * this.rowTicks;
    const tr = this.tracks[track];
    if (!tr) return;
    const starts = this.startsIn(track, row);
    const hit = starts.length ? { ev: starts[0] } : this.eventAt(track, tick);
    if (!hit) { this.showInfo(null, this.o.t('trkPastEnd')); return; }
    const ev = hit.ev;
    if (ev.tied || ev.porta || ev.echo) { this.showInfo(null, this.o.t('trkCannot')); return; }
    const src = ev.src;
    const edits = [];
    const clock = ev.clock || tr.clock || 128;
    if (ev.tick >= tick) {
      // The event starts in this row: change it in place.
      if (action === 'note') {
        const text = noteText(midi, ev.oct);
        const [pre, name, post] = splitOctave(text);
        if (post) edits.push({ row: src.row, col: src.col + src.len, len: 0, text: post });
        edits.push({ row: src.row, col: src.col, len: src.letterLen, text: pre + name });
      } else if (ev.kind === 'note') {
        edits.push({ row: src.row, col: src.col, len: src.letterLen, text: 'r' });
      } else return;
    } else {
      // Inside a longer note or rest: cut it in two at this row.
      if (action !== 'note' && ev.kind === 'rest') return;
      const before = tick - ev.tick, after = ev.len - before;
      const head = this.o.sourceText(src.row, src.col, src.letterLen) + lengthText(before, clock);
      const tail = action === 'note' ? noteText(midi, ev.oct, lengthText(after, clock)) : 'r' + lengthText(after, clock);
      edits.push({ row: src.row, col: src.col, len: src.len, text: `${head} ${tail}` });
    }
    this.o.edit(edits);
    if (ev.shared) this.showInfo(null, this.o.t('trkShared'));
    this.cursor.row = Math.min(this.rows - 1, row + 1);
  }

  // ---------- playing ----------
  setPlayhead(tick) {
    this.playTick = tick;
    if (tick !== null && this.follow && performance.now() > this.holdUntil) {
      const row = Math.floor(tick / this.rowTicks);
      if (row !== this.lastPlayRow) {
        this.lastPlayRow = row;
        this.autoAt = performance.now();   // our own scroll is not the user's
        this.scrollToRow(row, true);
      }
    }
    if (tick === null) this.lastPlayRow = -1;
    this.draw();
  }
}

// ">d<" -> ['>', 'd', '<']
function splitOctave(text) {
  const m = /^([<>]*)([a-g][+#-]?)(.*)$/.exec(text);
  return m ? [m[1], m[2], m[3]] : ['', text, ''];
}
