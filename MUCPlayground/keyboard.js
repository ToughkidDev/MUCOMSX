// Keys mode: a piano under the editor, played with the mouse, a finger or the computer
// keyboard (the tracker layout: Z S X D C V … for the lower octave, Q 2 W 3 E R … for the
// one above). It only reports notes; the page decides what they sound like.

// event.code -> semitone above the panel's base octave (works on any keyboard layout).
export const KEY_MAP = {
  KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
  Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16,
  KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23,
  KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28, BracketLeft: 29, Equal: 30, BracketRight: 31,
};
// What to print on each key: the PC keys that play it (two for o+1 C to E).
const KEY_LABEL = {};
for (const [code, semi] of Object.entries(KEY_MAP)) {
  const name = code.replace(/^Key|^Digit/, '').replace('Comma', ',').replace('Period', '.').replace('Semicolon', ';')
    .replace('Slash', '/').replace('BracketLeft', '[').replace('BracketRight', ']').replace('Equal', '=');
  KEY_LABEL[semi] = KEY_LABEL[semi] === undefined ? name : `${name} ${KEY_LABEL[semi]}`;
}
const NAMES = ['C', 'C+', 'D', 'D+', 'E', 'F', 'F+', 'G', 'G+', 'A', 'A+', 'B'];
const BLACK = [1, 3, 6, 8, 10];
const OCTAVES = 3;   // shown: the base octave and two above, then one more C

export class Keyboard {
  // t(key, ...args): text; onNote(on, midi): a key went down / up; onFocus(focused).
  constructor(root, { t, onNote, onClose, onSource, onFocus }) {
    this.root = root;
    this.t = t;
    this.onNote = onNote;
    this.onClose = onClose;
    this.onSource = onSource;
    this.onFocus = onFocus || (() => {});
    this.octave = 4;             // MUCOM88 octave of the lower row's Z
    this.down = new Map();       // source (key code / pointer id) -> midi
    // On the panel itself, which build() (on a language change) keeps.
    root.addEventListener('keydown', (e) => this.key(e, true));
    root.addEventListener('keyup', (e) => this.key(e, false));
    root.addEventListener('focusin', () => this.focusChanged());
    root.addEventListener('focusout', () => { setTimeout(() => this.focusChanged(), 0); });
    this.build();
  }

  get isOpen() { return !this.root.hidden; }

  // MIDI note of octave o, semitone s (o4 A = 440 Hz, so o4 C = 60).
  midi(semi) { return 12 * (this.octave + 1) + semi; }

  build() {
    const T = this.t;
    this.root.innerHTML = `
      <div class="keys-bar">
        <b class="keys-title">🎹 ${T('keysMode')}</b>
        <label>${T('keysSource')} <select class="keys-source"></select></label>
        <span class="tool-group keys-oct" role="group" aria-label="${T('keysOctave')}"><button type="button" class="btn small" data-oct="-1" title="${T('keysOctDown')}">−</button><output class="keys-oct-out"></output><button type="button" class="btn small" data-oct="1" title="${T('keysOctUp')}">+</button></span>
        <span class="keys-hint"></span>
        <span class="spacer"></span>
        <button type="button" class="btn small keys-close" title="${T('keysClose')}" aria-label="${T('keysClose')}">✕</button>
      </div>
      <div class="kb" role="group" aria-label="${T('keysMode')}"></div>`;
    const q = (s) => this.root.querySelector(s);
    q('.keys-close').onclick = () => this.onClose();
    this.root.querySelectorAll('[data-oct]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.onclick = () => this.shift(+b.dataset.oct);
    });
    q('.keys-source').onchange = (e) => this.onSource(e.target.value);
    this.wirePointer(q('.kb'));
    this.drawKeys();
    this.focusChanged();
  }

  // The keys follow the computer keyboard only while the panel has the focus, so typing
  // in the editor stays typing.
  focusChanged() {
    const focused = this.root.contains(document.activeElement) && document.activeElement.tagName !== 'SELECT';
    this.root.classList.toggle('focused', focused);
    this.root.querySelector('.keys-hint').textContent = this.t(focused ? 'keysHintOn' : 'keysHintOff');
    if (!focused) this.releaseKeys();
    this.onFocus(focused);
  }

  focus() { this.root.querySelector('.kb').focus({ preventScroll: true }); }

  shift(by) {
    const o = Math.max(1, Math.min(6, this.octave + by));
    if (o === this.octave) return;
    this.releaseAll();
    this.octave = o;
    this.drawKeys();
  }

  // options: [[value, label]]; the list is rebuilt only when its values change.
  setSources(options, value) {
    const sel = this.root.querySelector('.keys-source');
    if ([...sel.options].map((o) => o.value).join('\n') === options.map(([v]) => v).join('\n')) {
      options.forEach(([, label], i) => { if (sel.options[i].textContent !== label) sel.options[i].textContent = label; });
      if (sel.value !== value && options.some(([v]) => v === value)) sel.value = value;
      return sel.value;
    }
    sel.innerHTML = '';
    for (const [v, label] of options) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = label;
      sel.appendChild(o);
    }
    sel.value = options.some(([v]) => v === value) ? value : options[0]?.[0];
    return sel.value;
  }

  drawKeys() {
    const kb = this.root.querySelector('.kb');
    const whites = [];
    let html = '';
    for (let semi = 0; semi <= OCTAVES * 12; semi++) {
      const n = semi % 12;
      if (BLACK.includes(n)) continue;
      whites.push(semi);
    }
    const w = 100 / whites.length;
    whites.forEach((semi, i) => {
      const n = semi % 12, oct = this.octave + Math.floor(semi / 12);
      html += `<div class="key white" data-semi="${semi}" style="left:${i * w}%;width:${w}%"><span class="pc">${KEY_LABEL[semi] ?? ''}</span>${n === 0 ? `<span class="nm">o${oct}</span>` : ''}</div>`;
      if (semi < OCTAVES * 12 && BLACK.includes(n + 1)) {
        html += `<div class="key black" data-semi="${semi + 1}" style="left:${(i + 1) * w - w * 0.32}%;width:${w * 0.64}%"><span class="pc">${KEY_LABEL[semi + 1] ?? ''}</span></div>`;
      }
    });
    kb.innerHTML = html;
    kb.tabIndex = 0;
    this.root.querySelector('.keys-oct-out').textContent = `o${this.octave}–o${this.octave + OCTAVES}`;
    this.mark();
  }

  // Lights the keys that are down.
  mark() {
    const on = new Set(this.down.values());
    this.root.querySelectorAll('.key').forEach((k) => k.classList.toggle('on', on.has(this.midi(+k.dataset.semi))));
  }

  press(source, midi) {
    if (this.down.get(source) === midi) return;
    this.release(source);
    this.down.set(source, midi);
    this.onNote(true, midi);
    this.mark();
  }

  release(source) {
    if (!this.down.has(source)) return;
    const midi = this.down.get(source);
    this.down.delete(source);
    if (![...this.down.values()].includes(midi)) this.onNote(false, midi);
    this.mark();
  }

  releaseKeys() { for (const s of [...this.down.keys()]) if (typeof s === 'string') this.release(s); }
  releaseAll() { for (const s of [...this.down.keys()]) this.release(s); }

  key(e, down) {
    if (e.target.tagName === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (down && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) { e.preventDefault(); this.shift(e.code === 'ArrowUp' ? 1 : -1); return; }
    const semi = KEY_MAP[e.code];
    if (semi === undefined) return;
    e.preventDefault();
    if (down) { if (!e.repeat) this.press(e.code, this.midi(semi)); }
    else this.release(e.code);
  }

  // Press a key and slide across the others; each pointer (finger) plays its own note.
  wirePointer(kb) {
    const keyAt = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el && kb.contains(el) ? el.closest('.key') : null;
    };
    kb.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      kb.focus({ preventScroll: true });
      kb.setPointerCapture(e.pointerId);
      const k = keyAt(e.clientX, e.clientY);
      if (k) this.press(e.pointerId, this.midi(+k.dataset.semi));
    });
    kb.addEventListener('pointermove', (e) => {
      if (!this.down.has(e.pointerId)) return;
      const k = keyAt(e.clientX, e.clientY);
      if (k) this.press(e.pointerId, this.midi(+k.dataset.semi));
    });
    const up = (e) => this.release(e.pointerId);
    kb.addEventListener('pointerup', up);
    kb.addEventListener('pointercancel', up);
    kb.addEventListener('lostpointercapture', up);
  }

  // The note's name the MUCOM88 way: o4 C+.
  static noteName(midi) { return `o${Math.floor(midi / 12) - 1} ${NAMES[midi % 12]}`; }
}
