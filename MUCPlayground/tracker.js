// Tracker view: the song's parts as columns of rows, the way Furnace shows a pattern, next
// to the MUC text and kept in step with it both ways.
//   reading   mml-timeline.js turns the text into notes and rests per part; each row is a
//             fixed number of clocks (the Row setting), each cell shows the note starting
//             there (C#4), its voice (@) and volume (v) in hex, OFF where a rest follows a
//             note, and a line while a note is held. Notes from repeats or macros are dimmed:
//             they come from the same text as the first time
//   editing   a cell is typed the way it is shown: C#4 / D-5 (note, sharp or -, octave),
//             OFF (note off), ... (empty: a rest), two hex digits for @ and v; or, chosen
//             under Keys, Furnace's quick keys Z S X … / Q 2 W …; or the keys mode piano.
//             A note, Delete (rest) or note off rewrites the MML token behind it: a new pitch,
//             or the token cut in two where the cell lies inside a note or rest. Below a
//             part's last note, the note is added to the part's text (the note before it
//             held up to there). Hex digits in the @ and v columns set the voice / volume
//             (an @n / vn written before the note). The text changes, and the tracker is
//             redrawn from the text
//   playing   the page passes the playing position (from the engine's trace); the rows scroll
//             with it, the playing row in the middle
//   access    the text size follows the editor's; each column is headed by its part and chip;
//             the cell under the cursor is described for screen readers (a live region);
//             ? lists the keys; Ctrl+Z / Ctrl+Y undo and redo the tracker's own edits; Step
//             is how many rows the cursor moves after an entry; Ctrl+↑ / ↓ go to the
//             previous / next note or rest of the part
//   effects   on a MucoMSX ?XT4 track a note starts a shared effect: its cell shows XD0–XD9
//             (c … a) in orange with no @, the info line the ?XDn definition (a click shows it
//             in the text); a digit or XDn is typed there, and keys give c … a as XD0–XD9
//   roll      View: Roll shows the same notes as coloured lines on a piano roll instead,
//             time flowing left past a fixed playing line, each part in its colour, the notes
//             sounding now lit white; rhythm, drum and effect parts as grey marks on a lane
//             at the top. The Row setting is the zoom; the wheel or ← → look around, a click
//             on a note shows it in the text. Editing stays in View: Pattern

import { timeline, lengthText, noteText, tokenText } from './mml-timeline.js';
import { KEY_MAP } from './keyboard.js';

const NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
const RESOLUTIONS = [4, 8, 12, 16, 24, 32, 48, 64];   // rows per whole note
const C = {
  bg: '#121317', row4: '#1a1c22', row16: '#232731', grid: '#2b2f3a', num: '#7f8899', num16: '#d6b25e',
  note: '#e6e6e6', inst: '#5ab0f0', vol: '#7fd17f', off: '#e3736a', empty: '#4a5162', hold: '#4b5263',
  fx: '#f0a040', dim: 0.62, cursorRow: '#26304a', cursor: '#5aa0ff', play: '#4a2f68', playLine: '#b07cff', head: '#191b21', text: '#c8ccd6',
  headOn: '#262c3a', kind: '#8a93a6',
};

// The sound chip a part plays, shown under its name.
function chipOf(name) {
  if (name.startsWith('SCC')) return 'SCC';
  const msx = /^MSX([A-K])/.exec(name);
  if (msx) return msx[1] === 'G' ? 'DRUM' : 'DEF'.includes(msx[1]) ? 'PSG' : 'OPLL';
  const letter = name[0];
  return 'ABCHIJ'.includes(letter) ? 'FM' : 'DEF'.includes(letter) ? 'SSG' : letter === 'G' ? 'RHY' : letter === 'K' ? 'ADPCM' : '';
}
// A track read from a file's chip writes (chip-notes.js) names its chip and colour itself.
const trackChip = (tr) => tr.chip ?? chipOf(tr.name);
const trackColor = (view, tr) => tr.color ?? view.o.colors(tr.name);
const STEPS = [0, 1, 2, 3, 4, 6, 8, 12, 16];

const hex2 = (v) => (v === null || v === undefined ? '..' : typeof v === 'string' ? (v.slice(0, 2) + '..').slice(0, 2) : ((v & 255).toString(16).toUpperCase().padStart(2, '0')));

export class Tracker {
  // opts: t(key, …args); edit(edits[]): apply [{ row, col, len, text }] to the MUC text;
  // text(): the MUC text; restore(text): put back a whole text (undo / redo);
  // reveal(src | null): show an event's source in the text; preview(on, midi, trackName, fx)
  // (fx: an effect note, heard as noise); colors(name): a part's colour.
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.tracks = [];
    this.perWhole = 16;
    this.cursor = { track: 0, row: 0, col: 0 };   // col: 0 note, 1 voice (@), 2 volume (v)
    this.input = 'display';   // 'display' (typed as shown: C#4, OFF, 0F) or 'tracker' (Z S X … / Q 2 W …)
    try { this.input = localStorage.getItem('mucplayground.trackerInput') === 'tracker' ? 'tracker' : 'display'; } catch { /* default */ }
    this.armed = false;       // the tracker was the last place written in (the piano writes here then)
    this.fontSize = 13;
    this.step = 1;            // rows the cursor moves after an entry
    try { const v = localStorage.getItem('mucplayground.trackerStep'); if (v !== null && STEPS.includes(Number(v))) this.step = Number(v); } catch { /* default */ }
    this.undoStack = [];      // { before, after, cursor } of the tracker's own edits
    this.redoStack = [];
    this.octave = 4;
    this.playTick = null;
    this.view = 'pattern';    // 'pattern' (rows and cells) or 'roll' (a piano roll, view only)
    try { if (localStorage.getItem('mucplayground.trackerView') === 'roll') this.view = 'roll'; } catch { /* default */ }
    this.rollTick = 0;        // where the roll looks when it does not follow the playing line
    this.rollHits = [];       // the notes drawn on the roll: { x, y, w, h, ev }
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
        <span class="tool-group" role="group" aria-label="${T('trkView')}"><button type="button" class="btn small" data-view="pattern" title="${T('trkViewPatternTip')}">${T('trkViewPattern')}</button><button type="button" class="btn small" data-view="roll" title="${T('trkViewRollTip')}">${T('trkViewRoll')}</button></span>
        <label>${T('trkRow')} <select class="trk-res">${RESOLUTIONS.map((r) => `<option value="${r}"${r === this.perWhole ? ' selected' : ''}>1/${r}</option>`).join('')}</select></label>
        <span class="tool-group trk-edit" role="group" aria-label="${T('keysOctave')}"><button type="button" class="btn small" data-oct="-1" title="${T('keysOctDown')}" aria-label="${T('keysOctDown')}">−</button><output class="trk-oct" aria-live="polite"></output><button type="button" class="btn small" data-oct="1" title="${T('keysOctUp')}" aria-label="${T('keysOctUp')}">+</button></span>
        <label class="trk-edit" title="${T('trkStepTip')}">${T('trkStep')} <select class="trk-step">${STEPS.map((n) => `<option value="${n}"${n === this.step ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="trk-edit">${T('trkInput')} <select class="trk-input"><option value="display">${T('trkInputDisplay')}</option><option value="tracker">${T('trkInputTracker')}</option></select></label>
        <span class="tool-group trk-tools trk-edit" role="group"><button type="button" class="btn small" data-act="rest" title="${T('trkRestTip')}">${T('trkRest')}</button><button type="button" class="btn small" data-act="off" title="${T('trkOffTip')}" aria-label="${T('trkOffTip')}">OFF</button><button type="button" class="btn small" data-act="keys" title="${T('trkKeysTip')}" aria-label="${T('trkKeysTip')}">🎹</button></span>
        <span class="tool-group trk-edit" role="group"><button type="button" class="btn small" data-act="undo" title="${T('trkUndoTip')}" aria-label="${T('trkUndoTip')}" disabled>↶</button><button type="button" class="btn small" data-act="redo" title="${T('trkRedoTip')}" aria-label="${T('trkRedoTip')}" disabled>↷</button><button type="button" class="btn small" data-act="help" title="${T('trkHelpTip')}" aria-label="${T('trkHelpTip')}" aria-expanded="false">?</button></span>
        <span class="trk-info"></span>
      </div>
      <div class="trk-help" hidden></div>
      <p class="trk-sr" id="trkKeysHelp">${T('trkSrHelp')}</p>
      <div class="trk-sr trk-live" aria-live="polite"></div>
      <div class="trk-scroll" tabindex="0" role="application" aria-roledescription="${T('trkTitle')}" aria-label="${T('trkTitle')}" aria-describedby="trkKeysHelp"><canvas class="trk-canvas" aria-hidden="true"></canvas><div class="trk-spacer"></div></div>`;
    const q = (s) => this.root.querySelector(s);
    this.scroller = q('.trk-scroll');
    this.canvas = q('.trk-canvas');
    this.spacer = q('.trk-spacer');
    q('.trk-res').onchange = (e) => { const tick = this.cursor.row * this.rowTicks; this.perWhole = +e.target.value; this.cursor.row = Math.floor(tick / this.rowTicks); this.layout(); this.scrollToCursor(); };
    this.root.querySelectorAll('[data-oct], [data-act], [data-view]').forEach((b) => b.addEventListener('pointerdown', (e) => e.preventDefault()));
    this.root.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => this.setView(b.dataset.view); });
    this.root.querySelectorAll('[data-oct]').forEach((b) => { b.onclick = () => this.setOctave(this.octave + +b.dataset.oct); });
    this.root.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'keys') this.o.keys();
        else if (act === 'undo') this.undo();
        else if (act === 'redo') this.redo();
        else if (act === 'help') this.toggleHelp();
        else this.edit(act);
      };
    });
    const step = q('.trk-step');
    step.onchange = () => { this.step = +step.value; try { localStorage.setItem('mucplayground.trackerStep', String(this.step)); } catch { /* ignore */ } this.scroller.focus(); };
    const input = q('.trk-input');
    input.value = this.input;
    input.onchange = () => { this.input = input.value; try { localStorage.setItem('mucplayground.trackerInput', this.input); } catch { /* ignore */ } this.showInfo(null); this.scroller.focus(); };
    // Scrolling by hand while a song plays stops the rows following it for a moment.
    this.scroller.addEventListener('scroll', () => { if (performance.now() - this.autoAt > 80) this.holdUntil = performance.now() + 2500; this.draw(); });
    this.scroller.addEventListener('pointerdown', (e) => this.click(e));
    // Hovering an effect note shows its ?XD definition; leaving goes back to the cursor's cell.
    this.scroller.addEventListener('pointermove', (e) => this.hover(e));
    this.scroller.addEventListener('pointerleave', () => { if (this.hovered) { this.hovered = null; this.showInfo(this.eventAt(this.cursor.track, this.cursor.row * this.rowTicks)?.ev); } });
    this.scroller.addEventListener('keydown', (e) => this.key(e));
    this.scroller.addEventListener('keyup', (e) => { if (this.held === e.code) { this.o.preview(false, this.heldMidi); this.held = null; } });
    this.scroller.addEventListener('focus', () => { this.armed = true; this.draw(); });
    this.scroller.addEventListener('blur', () => this.draw());
    // The roll: the wheel looks along the song (a moment while it plays, then it follows again).
    this.scroller.addEventListener('wheel', (e) => {
      if (this.view !== 'roll') return;
      e.preventDefault();
      this.rollTick = this.rollAt() + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / (this.rollPpt || 1);
      this.rollTick = Math.max(0, this.rollTick);
      this.holdUntil = performance.now() + 2500;
      this.draw();
    }, { passive: false });
    new ResizeObserver(() => this.layout()).observe(this.scroller);
    this.setOctave(this.octave);
    this.setView(this.view);
  }

  // View: 'pattern' (rows and cells, edited here) or 'roll' (the notes as coloured lines).
  setView(view) {
    this.view = view === 'roll' ? 'roll' : 'pattern';
    try { localStorage.setItem('mucplayground.trackerView', this.view); } catch { /* ignore */ }
    this.root.classList.toggle('trk-roll', this.view === 'roll');
    this.root.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === this.view)));
    if (this.view === 'roll' && this.playTick === null) this.rollTick = this.cursor.row * this.rowTicks;
    this.layout();
    if (this.view === 'pattern' && this.m) this.scrollToCursor();
  }

  setOctave(o) {
    this.octave = Math.max(1, Math.min(7, o));
    this.root.querySelector('.trk-oct').textContent = `o${this.octave}`;
  }

  // Clocks per row, from the first part's base clock.
  get rowTicks() { return Math.max(1, Math.round((this.tracks[0]?.clock || 128) / this.perWhole)); }

  // Notes read from a file's chip writes (a .vgm or .mub playing: chip-notes.js), shown
  // read-only: no text behind them to edit or show. setText goes back to the MUC text.
  setTracks(tracks) {
    this.external = true;
    this.root.classList.add('trk-ro');
    this.tracks = tracks;
    this.bySource = new Map();
    this.cursor.track = Math.min(this.cursor.track, Math.max(0, this.tracks.length - 1));
    this.closeEditor?.();
    this.layout();
    this.showInfo(null);
  }

  setText(text) {
    this.external = false;
    this.root.classList.remove('trk-ro');
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

  // The editor's text size (10–24 px): the tracker's text, rows and columns follow it.
  setFontSize(px) {
    this.fontSize = Math.max(10, Math.min(24, Number(px) || 13));
    this.layout();
  }

  get font() { return `${this.fontSize}px ui-monospace, Menlo, Consolas, monospace`; }

  // ---------- geometry ----------
  metrics() {
    const g = this.canvas.getContext('2d');
    g.font = this.font;
    const cw = g.measureText('0').width, fs = this.fontSize;
    return { cw, rowH: Math.round(fs * 1.4), headH: Math.round(fs * 2.9), numW: Math.ceil(cw * 4 + 14), colW: Math.ceil(cw * 10 + 14) };
  }

  get rows() {
    // One more pattern after the longest part, to write new notes into.
    const end = Math.max(0, ...this.tracks.map((t) => t.end));
    return Math.ceil(end / this.rowTicks) + 64;
  }

  layout() {
    if (!this.isOpen) return;
    const m = this.metrics();
    this.m = m;
    const w = this.scroller.clientWidth, h = this.scroller.clientHeight;
    // Room above and below so any row can sit in the middle.
    this.pad = Math.max(0, Math.floor((h - m.headH) / 2 - m.rowH));
    // The roll draws its own time axis: nothing to scroll.
    const roll = this.view === 'roll';
    this.spacer.style.width = roll ? `${w}px` : `${m.numW + this.tracks.length * m.colW}px`;
    this.spacer.style.height = roll ? `${h}px` : `${m.headH + this.pad * 2 + this.rows * m.rowH}px`;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.draw();
  }

  // x offset and width of a cell's note (0), @ (1) and v (2) fields.
  subColumn(col) {
    const cw = this.m.cw, gap = cw * 0.6;
    const at = [6, 6 + cw * 3 + gap, 6 + cw * 5 + gap * 2][col];
    return [at, col === 0 ? cw * 3 : cw * 2];
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
    g.font = this.font;
    g.textBaseline = 'middle';
    if (this.view === 'roll') { this.drawRoll(g, W, H); return; }
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
      const color = trackColor(this, this.tracks[k]);
      for (let r = first; r <= last; r++) {
        const y = this.rowY(r);
        if (y + m.rowH < m.headH || y > H) continue;
        const cy = y + m.rowH / 2 + 0.5;
        const starts = this.startsIn(k, r);
        const ev = starts[0];
        let tx = x + 6;
        const put = (text, col, alpha = 1) => { g.globalAlpha = alpha; g.fillStyle = col; g.fillText(text, tx, cy); tx += g.measureText(text).width + m.cw * 0.6; g.globalAlpha = 1; };
        if (ev && ev.kind === 'note' && ev.label !== undefined) {
          // a drum hit read from a file: the drums it strikes
          put(ev.label.length > 3 ? ev.label.slice(0, 2) + '+' : ev.label.padEnd(3), C.fx);
          put('..', C.empty); put('..', C.empty);
        } else if (ev && ev.kind === 'note' && ev.fx !== undefined) {
          // an effect note: XD0–XD9 (red when the song does not define it)
          const a = ev.rep ? C.dim : 1;
          const known = ev.fx < 10 && this.tracks[k].effects?.has(ev.fx);
          put(ev.tied ? '^^^' : ev.fx < 10 ? `XD${ev.fx}` : 'XD?', ev.tied ? C.hold : known ? C.fx : C.off, a);
          put('..', C.empty);
          put(hex2(ev.vol), C.vol, a);
        } else if (ev && ev.kind === 'note') {
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
        if ((focused || this.armed) && k === this.cursor.track && r === this.cursor.row) {
          const [cx, cw] = this.subColumn(this.cursor.col);
          g.strokeStyle = C.cursor; g.lineWidth = 1.5;
          g.globalAlpha = focused ? 1 : 0.5;
          g.strokeRect(x + cx - 3.5, y + 1.5, cw + 7, m.rowH - 3);
          g.globalAlpha = 1; g.lineWidth = 1;
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
      const on = k === this.cursor.track;
      if (on) { g.fillStyle = C.headOn; g.fillRect(x + 1, 0, m.colW - 2, m.headH); }
      g.fillStyle = trackColor(this, this.tracks[k]);
      g.fillRect(x + 1, m.headH - (on ? 5 : 3), m.colW - 2, on ? 5 : 3);
      // the part's name, and under it its chip (an effect track says so)
      g.fillStyle = on ? '#ffffff' : C.text;
      g.fillText(this.tracks[k].name, x + 6, m.headH * 0.3);
      const fx = this.tracks[k].fxTail || this.tracks[k].events.some((e) => e.fx !== undefined);
      g.fillStyle = C.kind;
      g.font = `${Math.round(this.fontSize * 0.78)}px ui-monospace, Menlo, Consolas, monospace`;
      g.fillText(trackChip(this.tracks[k]) + (fx ? ' · FX' : ''), x + 6, m.headH * 0.68);
      g.font = this.font;
    }
    g.fillStyle = C.head;
    g.fillRect(0, 0, m.numW - 2, m.headH);
    g.fillStyle = C.num;
    g.fillText(this.tracks.length ? 'ROW' : this.o.t('trkEmpty'), 6, m.headH * 0.3);
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
    this.announce();
    if (reveal && !this.external) this.o.reveal(hit ? hit.ev.src : null);
  }

  // The cursor's cell in words, for screen readers: part and chip, row, then what starts or
  // sounds there, and the field the cursor is in.
  describe() {
    const { track, row, col } = this.cursor;
    const tr = this.tracks[track];
    if (!tr) return '';
    const T = this.o.t;
    const starts = this.startsIn(track, row)[0];
    const held = starts ? null : this.eventAt(track, row * this.rowTicks)?.ev;
    const ev = starts || held;
    const noteName = (e) => (e.label !== undefined ? e.label : e.fx !== undefined ? `XD${e.fx}` : NAMES[e.midi % 12].replace('-', '') + (Math.floor(e.midi / 12) - 1));
    let what;
    if (!ev) what = T('trkSayEmpty');
    else if (ev.kind === 'rest') what = T('trkSayRest', ev.len);
    else if (held) what = T('trkSayHeld', noteName(ev));
    else what = T('trkSayNote', noteName(ev), ev.fx !== undefined ? null : hex2(ev.inst), hex2(ev.vol), ev.len);
    const field = [T('trkSayFieldNote'), '@', 'v'][col];
    return T('trkSayCell', tr.name, trackChip(tr), row.toString(16).toUpperCase().padStart(2, '0'), what, field);
  }

  announce() {
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => { const live = this.root.querySelector('.trk-live'); if (live) live.textContent = this.describe(); }, 120);
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
    if (this.external) {
      // time in the song (a tick is 1/60 s) and what plays
      const time = (tk) => { const sec = tk / 60; return `${Math.floor(sec / 60)}:${(sec % 60).toFixed(2).padStart(5, '0')}`; };
      info.textContent = !ev ? this.o.t('trkFile') : `${time(ev.tick)} +${(ev.len / 60).toFixed(2)}s · ${ev.label ?? (ev.midi !== undefined ? NAMES[ev.midi % 12].replace('-', '') + (Math.floor(ev.midi / 12) - 1) : this.o.t('trkSayRest', ev.len))}`;
      return;
    }
    if (!ev) { info.textContent = this.o.t(this.input === 'display' ? 'trkHintDisplay' : 'trkHint'); return; }
    const where = this.o.t('trkWhere', ev.src.row, ev.tick, ev.len);
    info.textContent = where + (ev.shared ? ' · ' + this.o.t('trkShared') : '') + (ev.src.macro ? ' · ' + this.o.t('trkMacro') : '') + (ev.src.alone ? '' : ' · ' + this.o.t('trkMulti'));
    if (ev.fx !== undefined) this.showEffect(info, ev.fx);
  }

  // The ?XDn definition an effect note starts, in front of the info line's text (so it is
  // never cut off): a click shows it in the editor.
  showEffect(info, fx) {
    const track = this.tracks.find((tr) => tr.effects);
    const def = track?.effects.get(fx);
    info.prepend(' · ');
    if (!def) { info.prepend(this.o.t(fx < 10 ? 'trkFxUndefined' : 'trkFxRange', fx)); return; }
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'trk-def';
    link.textContent = def.text;
    link.title = this.o.t('trkFxDef');
    link.addEventListener('pointerdown', (e) => e.preventDefault());
    link.onclick = () => this.o.reveal({ row: def.row, col: def.col, len: def.len });
    info.prepend(link);
  }

  // Whether the cursor's cell is on an effect (?XT4) stretch of its track: the event there,
  // or the last one before it, starts an effect; below the end, the track ends as one.
  isFx(track, row) {
    const tr = this.tracks[track];
    if (!tr) return false;
    const tick = row * this.rowTicks;
    const at = this.startsIn(track, row)[0] || this.eventAt(track, tick)?.ev;
    if (at) return at.fx !== undefined;
    if (tick >= tr.end) return !!tr.fxTail;
    let before = null;
    for (const ev of tr.events) { if (ev.tick > tick) break; before = ev; }
    return before ? before.fx !== undefined : !!tr.fxTail;
  }

  // An effect typed in a cell: ?XDn written as its note letter, heard as a noise burst.
  enterFx(n) {
    if (this.external) return;
    const midi = 12 * (this.octave + 1) + n;
    this.previewFx(midi);
    this.edit('note', midi);
  }

  // The sound of a note typed in the cursor's cell: noise on an effect track (only for an
  // effect that can be written there), the part's own sound elsewhere. Held until released
  // when `held`, otherwise a short tap.
  preview(midi, held = false) {
    const { track, row } = this.cursor;
    const name = this.tracks[track]?.name;
    if (this.isFx(track, row)) { this.previewFx(midi, held); return; }
    this.o.preview(true, midi, name);
    if (!held) setTimeout(() => this.o.preview(false, midi), 300);
  }
  previewFx(midi, held = false) {
    const { track } = this.cursor;
    const fx = ((midi % 12) + 12) % 12;
    if (fx > 9 || !this.tracks[track]?.effects?.has(fx)) return;
    this.o.preview(true, midi, this.tracks[track].name, true);
    if (!held) setTimeout(() => this.o.preview(false, midi), 300);
  }

  hover(e) {
    if (!this.m || e.buttons || this.editor || this.view === 'roll') return;
    const r = this.scroller.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const track = Math.floor((x + this.scroller.scrollLeft - this.m.numW) / this.m.colW);
    const row = Math.floor((y + this.scroller.scrollTop - this.m.headH - this.pad) / this.m.rowH);
    const ev = y >= this.m.headH && x >= this.m.numW && row >= 0 ? this.startsIn(track, row)[0] : null;
    const key = ev?.fx !== undefined ? `${track}:${row}` : null;
    if (key === this.hovered) return;
    const was = this.hovered;
    this.hovered = key;
    if (key) this.showInfo(ev);
    else if (was) this.showInfo(this.eventAt(this.cursor.track, this.cursor.row * this.rowTicks)?.ev);
  }

  click(e) {
    if (!this.m) return;
    const r = this.scroller.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (this.view === 'roll') {
      // A note on the roll: its MML in the text.
      this.scroller.focus({ preventScroll: true });
      const hit = [...this.rollHits].reverse().find((h) => x >= h.x - 2 && x <= h.x + h.w + 2 && y >= h.y - 2 && y <= h.y + h.h + 2);
      if (hit) { this.showInfo(hit.ev); if (!this.external) this.o.reveal(hit.ev.src); }
      return;
    }
    if (y < this.m.headH || x < this.m.numW) return;
    const track = Math.floor((x + this.scroller.scrollLeft - this.m.numW) / this.m.colW);
    // (the empty band above the first row picks the first row)
    const row = Math.max(0, Math.floor((y + this.scroller.scrollTop - this.m.headH - this.pad) / this.m.rowH));
    if (track < 0 || track >= this.tracks.length) return;
    const inCell = x + this.scroller.scrollLeft - this.m.numW - track * this.m.colW;
    this.cursor.col = inCell < this.subColumn(1)[0] - 2 ? 0 : inCell < this.subColumn(2)[0] - 2 ? 1 : 2;
    this.scroller.focus({ preventScroll: true });
    this.moveTo(track, row);
  }

  key(e) {
    if (this.view === 'roll') {
      // ← → a beat (with Shift a bar), Home the start.
      const clock = this.tracks[0]?.clock || 128;
      const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (d || e.key === 'Home') {
        e.preventDefault();
        this.rollTick = e.key === 'Home' ? 0 : Math.max(0, this.rollAt() + d * (e.shiftKey ? clock : clock / 4));
        this.holdUntil = performance.now() + 2500;
        this.draw();
      }
      return;
    }
    const { track, row } = this.cursor;
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); return; }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); return; }
      // the part's previous / next note or rest
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { e.preventDefault(); this.jump(e.code === 'ArrowDown' ? 1 : -1); return; }
      return;
    }
    if (e.altKey) return;
    if (e.key === '?') { e.preventDefault(); this.toggleHelp(); return; }
    if (e.key === 'Escape' && !this.root.querySelector('.trk-help').hidden) { e.preventDefault(); this.toggleHelp(false); return; }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      // across the note / @ / v fields, then to the next part
      e.preventDefault();
      let col = this.cursor.col + (e.code === 'ArrowRight' ? 1 : -1), t = track;
      if (col > 2) { col = 0; t++; } else if (col < 0) { col = 2; t--; }
      if (t < 0 || t >= this.tracks.length) return;
      this.cursor.col = col;
      this.moveTo(t, row);
      return;
    }
    const move = { ArrowUp: -1, ArrowDown: 1, PageUp: -16, PageDown: 16 }[e.code];
    if (move) { e.preventDefault(); this.moveTo(track, row + move); return; }
    if (this.external) {
      if (e.code === 'Home') { e.preventDefault(); this.moveTo(track, 0); }
      if (e.code === 'End') { e.preventDefault(); this.moveTo(track, this.rows - 1); }
      return;
    }
    if (this.input === 'display') {
      // Typed as shown: a letter, O, . or - starts a note field; hex digits an @ / v field;
      // Enter opens the field with what it shows.
      const fx = this.cursor.col === 0 && this.isFx(track, row);
      // On an effect track a digit is the effect itself, X starts XDn.
      if (fx && /^[0-9]$/.test(e.key)) { e.preventDefault(); this.enterFx(+e.key); return; }
      const starts = this.cursor.col === 0 ? (fx ? /^[a-gox.\-]$/i : /^[a-go.\-]$/i) : /^[0-9a-f]$/i;
      if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); this.openEditor(this.fieldText(), true); return; }
      if (e.key.length === 1 && starts.test(e.key)) { e.preventDefault(); this.openEditor(e.key.toUpperCase()); return; }
      if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); if (this.cursor.col === 0) this.edit('rest'); return; }
      if (e.code === 'Home') { e.preventDefault(); this.moveTo(track, 0); return; }
      if (e.code === 'End') { e.preventDefault(); this.moveTo(track, this.rows - 1); return; }
      return;
    }
    if (this.cursor.col > 0) {
      // @ / v fields: hex digits, two make the value
      if (/^[0-9a-f]$/i.test(e.key)) {
        e.preventDefault();
        const d = parseInt(e.key, 16);
        const fresh = this.pending?.track !== track || this.pending?.row !== row || this.pending?.col !== this.cursor.col;
        const value = fresh ? d : (this.pending.value * 16 + d) & 255;
        this.pending = fresh ? { track, row, col: this.cursor.col, value } : null;
        this.setParam(this.cursor.col === 1 ? '@' : 'v', value, !fresh);
        return;
      }
      if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); return; }
    }
    if (e.code === 'Home') { e.preventDefault(); this.moveTo(track, 0); return; }
    if (e.code === 'End') { e.preventDefault(); this.moveTo(track, this.rows - 1); return; }
    if (e.code === 'NumpadDivide' || e.code === 'NumpadMultiply') { e.preventDefault(); this.setOctave(this.octave + (e.code === 'NumpadMultiply' ? 1 : -1)); return; }
    if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); this.edit('rest'); return; }
    if (e.code === 'Digit1' || e.code === 'Backquote') { e.preventDefault(); this.edit('off'); return; }
    const semi = KEY_MAP[e.code];
    if (semi === undefined) return;
    const midi = 12 * (this.octave + 1) + semi;
    e.preventDefault();
    if (e.repeat) return;
    this.preview(midi, true);
    this.held = e.code; this.heldMidi = midi;
    this.edit('note', midi);
  }

  // ---------- typing a cell as it is shown ----------
  // What the cursor's field shows: C#4 / OFF / ... for the note, 03 / .. for @ and v.
  fieldText() {
    const { track, row, col } = this.cursor;
    const ev = this.startsIn(track, row)[0];
    if (!ev) return col ? '' : '';
    if (col === 0) {
      if (ev.kind === 'rest') return 'OFF';
      if (ev.fx !== undefined) return `XD${ev.fx}`;
      return NAMES[ev.midi % 12] + (Math.floor(ev.midi / 12) - 1);
    }
    const v = col === 1 ? ev.inst : ev.vol;
    return typeof v === 'number' ? hex2(v) : '';
  }

  // A text box over the field, in the tracker's own format; it closes by itself once the
  // value is complete (C#4, C-4, C4, OFF, ..., two hex digits), or with Enter.
  openEditor(initial, select = false) {
    if (this.external) return;
    this.closeEditor();
    const { track, row, col } = this.cursor;
    const [fx, fw] = this.subColumn(col);
    const sr = this.scroller.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
    const box = document.createElement('input');
    box.className = 'trk-cell-edit';
    box.spellcheck = false;
    box.autocomplete = 'off';
    box.maxLength = col === 0 ? 3 : 2;
    box.style.left = `${sr.left - rr.left + this.colX(track) + fx - 4}px`;
    box.style.top = `${sr.top - rr.top + this.rowY(row)}px`;
    box.style.width = `${fw + 8}px`;
    box.style.height = `${this.m.rowH}px`;
    box.style.fontSize = `${this.fontSize}px`;
    box.value = initial;
    this.root.appendChild(box);
    this.editor = box;
    box.focus();
    if (select) box.select();
    const fxCell = col === 0 && this.isFx(track, row);
    this.showInfo(null, this.o.t(fxCell ? 'trkTypeFx' : col === 0 ? 'trkTypeNote' : 'trkTypeHex', col === 1 ? '@' : 'v'));
    const done = () => this.commitEditor(false);
    box.addEventListener('input', () => {
      const v = box.value.toUpperCase().replace(/\s/g, '').replace('+', '#');
      if (v !== box.value) box.value = v;
      const complete = col === 0 ? /^([A-G][-#]?[1-8]|OFF|\.\.\.|---)$/.test(v) || (fxCell && /^XD[0-9]$/.test(v)) : /^[0-9A-F]{2}$/.test(v);
      if (complete) done();
    });
    box.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); this.commitEditor(true); }
      else if (e.key === 'Escape') { e.preventDefault(); this.closeEditor(); this.scroller.focus(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); this.commitEditor(true); }
    });
    box.addEventListener('blur', () => { if (this.editor === box) this.closeEditor(); });
  }

  closeEditor() {
    const box = this.editor;
    this.editor = null;
    box?.remove();
  }

  // forced: Enter, which also takes an incomplete value (C → the octave set above, 3 → 03).
  commitEditor(forced) {
    const box = this.editor;
    if (!box) return;
    const v = box.value.toUpperCase();
    const col = this.cursor.col;
    this.closeEditor();
    this.scroller.focus({ preventScroll: true });
    if (col === 0) {
      if (v === 'OFF') { this.edit('off'); return; }
      if (v === '' || /^[.\-]+$/.test(v)) { if (v) this.edit('rest'); return; }
      const xd = /^(?:XD)?([0-9])$/.exec(v);
      if (xd && this.isFx(this.cursor.track, this.cursor.row)) { this.enterFx(+xd[1]); return; }
      const m = /^([A-G])([-#]?)([1-8])?$/.exec(v);
      if (!m || (!m[3] && !forced)) { this.showInfo(null, this.o.t('trkTypeNote')); return; }
      const oct = m[3] ? +m[3] : this.octave;
      const midi = 12 * (oct + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : 0);
      this.setOctave(oct);
      this.preview(midi);
      this.edit('note', midi);
    } else {
      if (!/^[0-9A-F]{1,2}$/.test(v)) return;
      const { row } = this.cursor;
      this.setParam(col === 1 ? '@' : 'v', parseInt(v, 16), true);
      this.advance(row);
      this.draw();
    }
  }

  // A note from the keys mode piano.
  enterNote(midi) {
    if (this.external) return;
    this.cursor.col = 0;
    this.edit('note', midi);
  }

  // Sets the voice (@) or volume (v) of the note starting in the cursor's row: an @n / vn
  // just before it is changed, or one is written there. again: the second hex digit, which
  // completes the value typed with the first.
  setParam(kind, value, again) {
    if (this.external) return;
    const { track, row } = this.cursor;
    const ev = this.startsIn(track, row).find((e) => e.kind === 'note');
    if (!ev) { this.showInfo(null, this.o.t('trkParamNote')); return; }
    if (ev.tied || ev.porta || ev.echo) { this.showInfo(null, this.o.t('trkCannot')); return; }
    const src = ev.src;
    const before = this.o.sourceText(src.row, 0, src.col);
    const m = new RegExp(`(${kind === '@' ? '@' : 'v'})(\\d+)\\s*$`).exec(before);
    if (m && !(kind === '@' && /@W$/.test(before.slice(0, m.index + 2)))) {
      const at = m.index + 1;
      this.apply([{ row: src.row, col: at, len: m[2].length, text: String(value) }]);
    } else {
      this.apply([{ row: src.row, col: src.col, len: 0, text: `${kind}${value} ` }]);
    }
    this.cursor.row = row;
    if (ev.shared) this.showInfo(null, this.o.t('trkShared'));
    else this.showInfo(null, this.o.t(again ? 'trkParamSet' : 'trkParamNext', kind, value));
  }

  // ---------- undo, steps, jumps, help ----------
  // Every edit the tracker makes goes through here, so it can be undone: the text before
  // and after, and where the cursor was.
  apply(edits) {
    const before = this.o.text();
    const cursor = { ...this.cursor };
    this.o.edit(edits);
    this.undoStack.push({ before, after: this.o.text(), cursor });
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
    this.markUndo();
  }

  // Only while the text is still what the tracker left: an edit typed in the text since
  // then is undone there (the editor's own Ctrl+Z).
  undo() {
    if (this.external) return;
    const last = this.undoStack[this.undoStack.length - 1];
    if (!last) { this.showInfo(null, this.o.t('trkNothingUndo')); return; }
    if (this.o.text() !== last.after) { this.undoStack = []; this.redoStack = []; this.markUndo(); this.showInfo(null, this.o.t('trkUndoStale')); return; }
    this.undoStack.pop();
    this.redoStack.push(last);
    this.o.restore(last.before);
    this.cursor = { ...last.cursor };
    this.afterHistory('trkUndone');
  }

  redo() {
    if (this.external) return;
    const next = this.redoStack[this.redoStack.length - 1];
    if (!next) { this.showInfo(null, this.o.t('trkNothingRedo')); return; }
    if (this.o.text() !== next.before) { this.redoStack = []; this.markUndo(); this.showInfo(null, this.o.t('trkUndoStale')); return; }
    this.redoStack.pop();
    this.undoStack.push(next);
    this.o.restore(next.after);
    this.cursor = { ...next.cursor };
    this.afterHistory('trkRedone');
  }

  afterHistory(message) {
    this.markUndo();
    this.scrollToCursor();
    this.showInfo(null, this.o.t(message));
    this.announce();
  }

  markUndo() {
    this.root.querySelector('[data-act="undo"]').disabled = !this.undoStack.length;
    this.root.querySelector('[data-act="redo"]').disabled = !this.redoStack.length;
  }

  // Where the cursor goes after an entry: Step rows down.
  advance(row) {
    this.cursor.row = Math.min(this.rows - 1, row + this.step);
    this.announce();
  }

  // The part's previous / next event (note or rest) from the cursor.
  jump(dir) {
    const { track, row } = this.cursor;
    const evs = this.tracks[track]?.events || [];
    const at = row * this.rowTicks;
    const ev = dir > 0 ? evs.find((e) => e.tick >= at + this.rowTicks) : [...evs].reverse().find((e) => e.tick < at);
    if (ev) this.moveTo(track, Math.floor(ev.tick / this.rowTicks));
  }

  // The keys, for the input chosen under Input.
  toggleHelp(show) {
    const box = this.root.querySelector('.trk-help');
    const open = show ?? box.hidden;
    const T = this.o.t;
    if (open) {
      const rows = T(this.input === 'display' ? 'trkKeysDisplay' : 'trkKeysTracker').concat(T('trkKeysCommon'));
      box.innerHTML = `<b>${T('trkHelpTitle')}</b><dl>${rows.map(([k, d]) => `<dt>${k}</dt><dd>${d}</dd>`).join('')}</dl>`;
    }
    box.hidden = !open;
    this.root.querySelector('[data-act="help"]').setAttribute('aria-expanded', String(open));
    if (!open) this.scroller.focus({ preventScroll: true });
  }

  // ---------- editing ----------
  // Rewrites the token behind the cursor: 'note' (a pitch), 'rest' (Delete: the note
  // becomes a rest), 'off' (a rest from this row on).
  edit(action, midi) {
    if (this.external) return;
    const { track, row } = this.cursor;
    const tick = row * this.rowTicks;
    const tr = this.tracks[track];
    if (!tr) return;
    this.armed = true;
    // On an effect track only c … a (XD0–XD9) the song defines can be written; the octave
    // means nothing there, so the note keeps the octave it is written at.
    let fx = null;
    if (action === 'note' && this.isFx(track, row)) {
      fx = ((midi % 12) + 12) % 12;
      if (fx > 9) { this.showInfo(null, this.o.t('trkFxRange', fx)); return; }
      if (!tr.effects?.has(fx)) { this.showInfo(null, this.o.t('trkFxUndefined', fx)); return; }
    }
    const pitch = (oct) => (fx === null ? midi : 12 * (oct + 1) + fx);
    const starts = this.startsIn(track, row);
    const hit = starts.length ? { ev: starts[0] } : this.eventAt(track, tick);
    if (!hit) {
      if (tick >= tr.end) this.append(tr, tick, action, fx === null ? midi : pitch(tr.tail.oct));
      else this.showInfo(null, this.o.t('trkPastEnd'));
      return;
    }
    const ev = hit.ev;
    if (ev.tied || ev.porta || ev.echo) { this.showInfo(null, this.o.t('trkCannot')); return; }
    const src = ev.src;
    const edits = [];
    const clock = ev.clock || tr.clock || 128, unit = ev.unit || 0;
    if (ev.tick >= tick) {
      // The event starts in this row: change it in place.
      if (action === 'note') {
        const text = noteText(pitch(ev.oct), ev.oct);
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
      const head = this.o.sourceText(src.row, src.col, src.letterLen) + lengthText(before, clock, unit);
      const tail = action === 'note' ? noteText(pitch(ev.oct), ev.oct, lengthText(after, clock, unit)) : 'r' + lengthText(after, clock, unit);
      edits.push({ row: src.row, col: src.col, len: src.len, text: `${head} ${tail}` });
    }
    this.apply(edits);
    if (ev.shared) this.showInfo(null, this.o.t('trkShared'));
    else if (!src.alone) this.showInfo(null, this.o.t('trkMulti'));
    this.advance(row);
  }

  // A note (or a note off) below the part's last note: the part's text gets the note, and
  // what was sounding before it (the last note or rest) is held up to it.
  append(tr, tick, action, midi) {
    if (tr.tail.ended) { this.showInfo(null, this.o.t('trkEnded')); return; }
    const clock = tr.clock || 128, len = this.rowTicks, unit = tr.unit || 0;
    const gap = tick - tr.end;
    const edits = [];
    let text = '';
    const last = tr.events[tr.events.length - 1];
    if (gap > 0) {
      const plain = last && !last.shared && !last.tied && !last.porta && !last.echo && !last.src.macro && last.src.alone;
      if (plain) {
        // longer last note / rest instead of a gap
        const letters = this.o.sourceText(last.src.row, last.src.col, last.src.letterLen);
        edits.push({ row: last.src.row, col: last.src.col, len: last.src.len, text: tokenText(letters, last.len + gap, clock, unit) });
      } else text += tokenText('r', gap, clock, unit) + ' ';
    }
    if (action === 'note') {
      const [pre, name, post] = splitOctave(noteText(midi, tr.tail.oct));
      text += pre + tokenText(name, len, clock, unit) + post;
    } else text += tokenText('r', len, clock, unit);
    const t = tr.tail;
    if (t.alone) edits.push({ row: t.row, col: t.col, len: 0, text: t.before ? text + ' ' : ' ' + text });
    else edits.push({ row: t.row, col: this.o.sourceText(t.row, 0, 1e9).length, len: 0, text: `\n${tr.name} ${text}` });
    this.apply(edits);
    this.advance(Math.floor(tick / this.rowTicks));
  }

  // ---------- roll view ----------
  // The tick at the playing line: the song's while it plays (unless the wheel just moved
  // the roll), else where the roll was left.
  rollAt() {
    return this.playTick !== null && performance.now() > this.holdUntil ? this.playTick : this.rollTick;
  }

  drawRoll(g, W, H) {
    const m = this.m, fs = this.fontSize;
    const clock = this.tracks[0]?.clock || 128;
    const ppt = (m.cw * 2) / this.rowTicks;      // one Row step is two characters wide
    this.rollPpt = ppt;
    const t0 = this.rollAt();
    if (this.playTick === null || performance.now() <= this.holdUntil) this.rollTick = t0;
    const playX = Math.round(W * 0.4);
    const a = t0 - playX / ppt, b = t0 + (W - playX) / ppt;
    const xOf = (tick) => playX + (tick - t0) * ppt;
    // Pitched parts on the roll; rhythm, drum and effect parts on a lane at the top.
    const perc = (tr) => tr.drum || ['RHY', 'DRUM'].includes(trackChip(tr)) || tr.events.some((ev) => ev.fx !== undefined);
    const pitched = [], lane = [];
    this.tracks.forEach((tr, k) => (perc(tr) ? lane : pitched).push(k));
    let lo = 127, hi = 0;
    for (const k of pitched) for (const ev of this.tracks[k].events) if (ev.kind === 'note' && ev.midi !== undefined) { lo = Math.min(lo, ev.midi); hi = Math.max(hi, ev.midi); }
    if (lo > hi) { lo = 48; hi = 72; }
    lo -= 2; hi += 2;
    const top = m.headH;
    const laneH = lane.length ? Math.max(6, Math.min(10, Math.round(fs * 0.6))) * lane.length + 6 : 0;
    const y0 = top + laneH + 4, y1 = H - 4;
    const rowh = Math.max(1, (y1 - y0) / (hi - lo + 1));
    const yOf = (midi) => y1 - (midi - lo + 1) * rowh;
    // pitch rows: black keys a shade darker, a line at every C (named at the left)
    g.font = `${Math.max(9, Math.round(fs * 0.75))}px ui-monospace, Menlo, Consolas, monospace`;
    for (let p = lo; p <= hi; p++) {
      const y = yOf(p);
      if ([1, 3, 6, 8, 10].includes(p % 12)) { g.fillStyle = '#0e0f13'; g.fillRect(0, y, W, rowh); }
      if (p % 12 === 0) {
        const line = Math.round(y + rowh);
        g.fillStyle = '#2a2f3b'; g.fillRect(0, line - 0.5, W, 1);
      } else if (rowh >= 5) { g.fillStyle = '#181a20'; g.fillRect(0, Math.round(y + rowh) - 0.5, W, 1); }
    }
    // the octave names, over the rows (drawn after them, so no row covers one)
    if (rowh * 12 >= 18) {
      g.fillStyle = '#8a93a6';
      g.textBaseline = 'bottom';
      for (let p = Math.ceil(lo / 12) * 12; p <= hi; p += 12) g.fillText(`C${Math.floor(p / 12) - 1}`, 4, Math.round(yOf(p) + rowh) - 1);
      g.textBaseline = 'middle';
    }
    // beats faint, bars bright
    const beat = clock / 4;
    for (let tick = Math.max(0, Math.floor(a / beat) * beat); tick <= b; tick += beat) {
      const x = Math.round(xOf(tick)) + 0.5;
      const bar = Math.abs(tick / clock - Math.round(tick / clock)) < 1e-6;
      g.fillStyle = bar ? '#7d8799' : '#252934';
      g.fillRect(x - (bar ? 0.5 : 0), top, bar ? 1.5 : 1, H - top);
    }
    // notes
    const hits = [];
    const now = this.playTick;
    const sounding = (ev) => now !== null && ev.tick <= now && now < ev.tick + ev.len;
    const drawNotes = (k, place) => {
      const evs = this.tracks[k].events;
      // the first event that may still show (notes are rarely longer than four bars)
      let i = 0, j = evs.length;
      while (i < j) { const mid = (i + j) >> 1; if (evs[mid].tick < a - clock * 4) i = mid + 1; else j = mid; }
      for (; i < evs.length && evs[i].tick <= b; i++) {
        const ev = evs[i];
        if (ev.kind !== 'note' || ev.tick + ev.len < a) continue;
        const r = place(ev);
        if (!r) continue;
        const on = sounding(ev);
        g.globalAlpha = on ? 1 : ev.rep ? 0.45 : 0.9;
        if (on) { g.shadowColor = r.color; g.shadowBlur = 8; }
        g.fillStyle = on ? '#ffffff' : r.color;
        g.fillRect(r.x, r.y, r.w, r.h);
        g.shadowBlur = 0;
        hits.push({ x: r.x, y: r.y, w: r.w, h: r.h, ev });
      }
      g.globalAlpha = 1;
    };
    for (const k of pitched) {
      const color = trackColor(this, this.tracks[k]);
      const h = Math.max(2, Math.min(rowh * 0.7, 8));
      drawNotes(k, (ev) => (ev.midi === undefined ? null : { x: xOf(ev.tick), y: yOf(ev.midi) + (rowh - h) / 2, w: Math.max(2, ev.len * ppt - 1), h, color }));
    }
    if (lane.length) {
      g.fillStyle = '#0b0c10'; g.fillRect(0, top, W, laneH);
      const lh = (laneH - 6) / lane.length;
      lane.forEach((k, n) => drawNotes(k, (ev) => ({ x: xOf(ev.tick), y: top + 3 + n * lh + lh * 0.25, w: Math.max(3, Math.min(ev.len, this.rowTicks) * ppt - 2), h: Math.max(2, lh * 0.5), color: ev.fx !== undefined ? C.fx : '#9aa3b5' })));
    }
    this.rollHits = hits;
    // the playing line
    g.fillStyle = '#e0505a';
    g.fillRect(playX - 1, top, 2, H - top);
    // the parts and their colours
    g.fillStyle = C.head;
    g.fillRect(0, 0, W, top);
    g.font = this.font;
    let x = 8;
    const bar = Math.floor(t0 / clock) + 1;
    g.fillStyle = C.num16;
    g.fillText(`${bar}`, x, top / 2);
    x += g.measureText(`${bar}`).width + 12;
    for (const tr of this.tracks) {
      if (x > W - 20) break;
      g.fillStyle = trackColor(this, tr);
      g.fillRect(x, top / 2 - 4, 10, 8);
      g.fillStyle = C.text;
      g.fillText(tr.name, x + 14, top / 2);
      x += 14 + g.measureText(tr.name).width + 12;
    }
  }

  // ---------- playing ----------
  setPlayhead(tick) {
    this.playTick = tick;
    if (tick !== null && this.view === 'roll') { this.draw(); return; }
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
