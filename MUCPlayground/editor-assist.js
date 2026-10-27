// Editor help for MUC: syntax colouring and suggestions.
// Colouring draws the same text, coloured, underneath a transparent <textarea>, so the
// browser's own caret, selection, undo and IME keep working unchanged.
import { TAGS, PARTS, COMMANDS, VOICE_TEMPLATE } from './mml-reference.js';
import { BOOKS } from './manual-data.js';

export const PART_LETTERS = 'ABCDEFGHIJK';
export const PART_COLORS = ['#e4572e', '#e09f1f', '#7fa83a', '#1f9e89', '#3d7cc9', '#8e5bd1', '#d6457f',
  '#c46a2b', '#3fa34d', '#5b7f95', '#b0306a'];

// Part names: A–K, MUCOMSX native MSXA…, the msPb0102 dedicated SCC parts SCCA–SCCE, and
// the shared-definition rows of the MucoMSX chip extensions (PSGS, SCCS, OPLS).
const PART_LINE = /^((?:MSX)?[A-K][A-K0-9]*|SCC(?:[A-E][0-9]?)+|PSGS|SCCS|OPLS)(?=[ \t])/;
export const SCC_COLOR = '#0fa3b8';
const MACRO_DEF = /^#\s*\*(\d+)\s*\{/;
const VOICE_DEF = /^[ \t]+@(%?\d+)/;
// MucoMSX global resources, at the start of a line: ?WD0={…} SCC wave, ?WS1,2,1 bank wave,
// ?IU0={…} OPLL voice, ?IT0={…} drum kit, ?KT0={…} pitch table, ?IM0={…} instrument program.
const RESOURCE_DEF = /^\?(WD|WS|IU|IT|KT|IM)\s*\d+/;
// SCC5 inline wave: @W0:{ … }, read as MUCOMSX's compiler reads it: spaces and : or = are
// optional (@W1 : { … }, @W1={ … }, @W1 { … }), and @W1 alone heads a 64-sample wave.
const WAVE_DEF = /^[ \t]+@W(\d+)(?=[ \t]*(?:[:={;]|$))/;

export function partKind(label) {
  if (label.startsWith('SCC') || label === 'PSGS') return 'ssg';   // SCC5 parts take the SSG commands (v0–15, E …)
  if (label === 'OPLS') return 'fm';
  const letter = label.replace(/^MSX/, '')[0];
  if ('ABCHIJ'.includes(letter)) return 'fm';
  if ('DEF'.includes(letter)) return 'ssg';
  if (letter === 'G') return 'rhythm';
  return 'pcm';
}

// ---------- colouring ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;

// The body of a part line or macro: notes, commands, numbers, structure, comments.
function mml(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === ';') { out += span('t-com', text.slice(i)); break; }
    if (ch === ' ' || ch === '\t') { out += ch; i++; continue; }
    let j = i + 1;
    if (ch === '?' && /[A-Z]{2}/.test(text.slice(j, j + 2)) && !/[A-Za-z]/.test(text[j + 2] || '')) {
      // A MucoMSX chip extension command (?EP, ?WD …), or a one-letter alias (?e, ?a …).
      out += span('t-cmd', text.slice(i, j + 2));
      j += 2;
    } else if ((ch === '?' || ch === '@') && /[A-Za-z]/.test(text[j] || '') && ch === '?') {
      out += span('t-cmd', text.slice(i, j + 1));
      j += 1;
    } else if (ch === '$' && /[0-9a-fA-F]/.test(text[j] || '')) {
      while (j < text.length && /[0-9a-fA-F]/.test(text[j])) j++;
      out += span('t-num', text.slice(i, j));
    } else if (/[a-gr]/.test(ch)) {
      while (j < text.length && (text[j] === '+' || text[j] === '-')) j++;
      out += span('t-note', text.slice(i, j));
    } else if (ch === '*' && /\d/.test(text[j] || '')) {
      while (j < text.length && /\d/.test(text[j])) j++;
      out += span('t-mac', text.slice(i, j));
    } else if (/[A-Za-z@]/.test(ch)) {
      out += span('t-cmd', ch);
    } else if (/[0-9,.\-]/.test(ch)) {
      while (j < text.length && /[0-9,.\-]/.test(text[j])) j++;
      out += span('t-num', text.slice(i, j));
    } else if (/[[\]/&^<>{}|:()%=!]/.test(ch)) {
      out += span('t-str', ch);
    } else {
      out += esc(ch);
    }
    i = j;
  }
  return out;
}

function commentSplit(text) {
  const k = text.indexOf(';');
  return k < 0 ? [text, ''] : [text.slice(0, k), text.slice(k)];
}

export function highlightLine(line) {
  if (!line) return '';
  if (line[0] === ';') return span('t-com', line);
  if (line[0] === '#') {
    const m = MACRO_DEF.exec(line);
    if (m) return span('t-mac', m[0].slice(0, -1)) + span('t-str', '{') + mml(line.slice(m[0].length));
    const t = /^#\S*/.exec(line)[0];
    return span('t-tag', t) + span('t-val', line.slice(t.length));
  }
  const r = RESOURCE_DEF.exec(line);
  if (r) return span('t-mac', r[0]) + mml(line.slice(r[0].length));
  const p = PART_LINE.exec(line);
  if (p) {
    const letter = p[1] === 'PSGS' ? 'D' : p[1] === 'OPLS' ? 'A' : p[1].replace(/^MSX/, '')[0];
    const color = p[1].startsWith('SCC') ? SCC_COLOR : PART_COLORS[PART_LETTERS.indexOf(letter)] || 'inherit';
    return `<span class="t-part" style="color:${color}">${esc(p[1])}</span>` + mml(line.slice(p[1].length));
  }
  const w = WAVE_DEF.exec(line);
  if (w) {
    // The : or = between the number and the values, coloured alike.
    const sep = /^[ \t]*[:=]/.exec(line.slice(w[0].length))?.[0] || '';
    return esc(w[0].slice(0, w[0].indexOf('@'))) + span('t-mac', '@W' + w[1]) + (sep ? esc(sep.slice(0, -1)) + span('t-str', sep.slice(-1)) : '') + mml(line.slice(w[0].length + sep.length));
  }
  const v = VOICE_DEF.exec(line);
  if (v) {
    const [body, comment] = commentSplit(line.slice(v[0].length));
    return esc(v[0].slice(0, v[0].indexOf('@'))) + span('t-mac', '@' + v[1]) + span('t-num', body) + (comment ? span('t-com', comment) : '');
  }
  if (/^[ \t]+[\d,\s\-]+(;.*)?$/.test(line)) {
    const [body, comment] = commentSplit(line);
    return span('t-num', body) + (comment ? span('t-com', comment) : '');
  }
  return esc(line);
}

// Re-colours only the lines that changed since last time.
export class Highlighter {
  constructor(target) { this.target = target; this.cache = new Map(); }
  render(text) {
    const lines = text.split('\n');
    const next = new Map();
    const html = lines.map((l) => {
      let h = this.cache.get(l);
      if (h === undefined) h = highlightLine(l);
      next.set(l, h);
      return h;
    });
    this.cache = next;
    // A trailing newline still needs a line to land the last caret row on.
    this.target.innerHTML = html.join('\n') + '\n';
  }
  scroll(left, top) { this.target.style.transform = `translate(${-left}px, ${-top}px)`; }
}

// ---------- suggestions ----------
const NOTE_LETTERS = 'abcdefgr';

// The MucoMSX ? commands (the manual's msx book): which chips a part line drives, as the
// book's `on` names them, and the entries a ? on such a line may be.
function msxChips(label) {
  if (/^SCC/.test(label)) return ['SCC'];
  if (label === 'PSGS') return ['PSG'];
  if (label === 'OPLS') return ['OPLL'];
  const m = /^MSX([A-K])/.exec(label);
  if (!m) return null;
  return m[1] === 'G' ? ['MSXG'] : 'DEF'.includes(m[1]) ? ['PSG'] : ['OPLL'];
}
const MSX_ENTRIES = BOOKS.msx.sections.flatMap((s) => s.e);
const msxDesc = (e, language) => `${e.t[language] || e.t.en}: ${e.d[language] || e.d.en}`;
// Resource lines start with ?XXn={…}: offered at the start of a line, filled in from the
// entry's example.
function resourceItems(prefix, language) {
  return MSX_ENTRIES.filter((e) => /^\?(WD|WS|IU=|IT=|KT=|IM=)/.test(e.c) && e.c.startsWith(prefix.slice(0, 3)))
    .map((e) => {
      const ex = (e.x || '').split('\n').find((l) => l.startsWith(e.c.slice(0, 3)));
      return { label: e.c.replace('=', ''), insert: ex || '?WS0,0,1', sig: e.s, desc: msxDesc(e, language) };
    });
}

// Items to suggest at the caret, or null. `force` is Ctrl+Space: show even with no prefix.
export function suggestionsAt(text, caret, language, force) {
  const lineStart = text.lastIndexOf('\n', caret - 1) + 1;
  const before = text.slice(lineStart, caret);
  const describe = (e) => e[language] || e.en;

  if (/^#[^\s]*$/.test(before)) {
    return { prefix: before, items: TAGS.filter((e) => e.label.toLowerCase().startsWith(before.toLowerCase())).map((e) => ({ ...e, desc: describe(e) })) };
  }
  if (/^\?[A-Z]{0,2}$/.test(before)) return { prefix: before, items: resourceItems(before, language) };
  if (/^[A-Z]*$/.test(before) && (before || force)) {
    return { prefix: before, items: PARTS.filter((e) => e.label.startsWith(before)).map((e) => ({ ...e, insert: e.label + ' ', desc: describe(e) })) };
  }
  if (/^[ \t]+@?$/.test(before)) {
    if (!force && !before.endsWith('@')) return null;
    const indent = before.replace(/@$/, '');
    return { prefix: before, items: [{ ...VOICE_TEMPLATE, insert: indent ? VOICE_TEMPLATE.insert.replace(/^  /, indent) : VOICE_TEMPLATE.insert, desc: describe(VOICE_TEMPLATE) }] };
  }

  let kind = null;
  const p = PART_LINE.exec(before);
  if (p) kind = partKind(p[1]);
  else if (MACRO_DEF.test(before)) kind = 'any';
  if (!kind) return null;
  const [body] = commentSplit(before.slice(p ? p[1].length : 0));
  if (body.length < before.length - (p ? p[1].length : 0)) return null;     // inside a comment

  const prefix = /[@*?]?[A-Za-z]*$/.exec(body)[0];
  const lines = text.split('\n');
  if (prefix.startsWith('?')) {
    const chips = p && msxChips(p[1]);
    if (!chips && kind !== 'any') return null;
    const items = MSX_ENTRIES.filter((e) => e.c.startsWith('?') && !e.c.endsWith('=') && !/^\?W[DS]$/.test(e.c) && e.c.startsWith(prefix.toUpperCase())
      && (!chips || !e.on || e.on.split(' ').some((c) => chips.includes(c))))
      .map((e) => ({ label: e.c, insert: e.c, sig: e.s, desc: msxDesc(e, language) }));
    return { prefix, items };
  }
  if (prefix === '@' && p && p[1].startsWith('SCC')) {
    const waves = [];
    lines.forEach((l, i) => {
      const w = WAVE_DEF.exec(l);
      if (w) waves.push({ label: '@' + w[1], insert: '@' + w[1], sig: `line ${i + 1}`, desc: describe({ en: 'SCC wave defined in this song (@W)', ko: '이 곡에 정의된 SCC 파형(@W)', ja: 'この曲で定義したSCC波形（@W）' }) });
      const d = /^\?WD\s*(\d+)/.exec(l);
      if (d) waves.push({ label: '@' + d[1], insert: '@' + d[1], sig: `line ${i + 1}`, desc: describe({ en: 'SCC wave defined in this song (?WD)', ko: '이 곡에 정의된 SCC 파형(?WD)', ja: 'この曲で定義したSCC波形（?WD）' }) });
    });
    return { prefix, items: waves };
  }
  if (prefix === '@' && kind === 'fm') {
    const voices = [];
    lines.forEach((l, i) => {
      const v = VOICE_DEF.exec(l);
      if (v) voices.push({ label: '@' + v[1], insert: '@' + v[1], sig: `line ${i + 1}`, desc: describe({ en: 'Voice defined in this song', ko: '이 곡에 정의된 음색', ja: 'この曲で定義した音色' }) });
    });
    const cmd = COMMANDS.filter((e) => e.label === '@' && e.on.includes('fm')).map((e) => ({ ...e, insert: '@', desc: describe(e) }));
    return { prefix, items: [...voices, ...cmd] };
  }
  if (prefix === '*') {
    const macros = [];
    lines.forEach((l) => {
      const m = MACRO_DEF.exec(l);
      if (m) macros.push({ label: '*' + m[1], insert: '*' + m[1], sig: l.slice(m[0].length - 1, m[0].length + 24), desc: describe({ en: 'Macro defined in this song', ko: '이 곡에 정의된 매크로', ja: 'この曲で定義したマクロ' }) });
    });
    return { prefix, items: macros };
  }
  if (!force && (prefix === '' || (prefix.length === 1 && NOTE_LETTERS.includes(prefix)))) return null;
  const items = COMMANDS.filter((e) => (!e.on || kind === 'any' || e.on.includes(kind)) && e.label.startsWith(prefix))
    .map((e) => ({ ...e, insert: e.insert ?? e.label, desc: describe(e) }));
  return { prefix, items };
}
