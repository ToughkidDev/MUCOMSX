// MML as a timeline, for the tracker view: every part's notes and rests with their start
// and length in clocks, pitch, voice (@) and volume (v), and where in the text they are.
// Read the way MUCOM88's compiler reads them (mucomDotNET muc88.cs):
//   defaults        o6 (internal octave 5), length 24 clocks, C128
//   lengths         n = C/n clocks, %n = n clocks, each dot adds half of the last part,
//                   ^len adds a length, & ties to the next note
//   o > < l C @ v ) ( r   as usual; [ … / … ]n repeats (n defaults to 2); *n macros
//                   (#*n{…}); L the loop point; : ends the part; { c4 > c } portamento
//                   (the first note's length)
// A song with the MucoMSX chip extensions (an MSX row with ?, @letter or :n, or a PSGS /
// SCCS / OPLS row) is read the way MDPlayer4Mac's native compiler lays it out
// (MucoNative/MsxMusicalCompiler.cs): each MSX channel's rows, the shared rows of its chip
// (PSGS → MSXD, SCCS → SCCA, OPLS → MSXA) among them, become one run of code in channel
// order, and each channel is played through it from its own start:
//   ?XU n           a compact channel: lengths are units of n ticks (%1–%16, or 192/length),
//                   defaults o4 and one unit; lengths and octaves are fixed where written
//   ?FDn={…}        phrase n (a label; without ?FR / ! / ?FJ it runs on into what follows),
//   :n              a label; ?XDn={…} effects are not played
//   ?FCn ?FR ?FJn   call, return, jump; a jump back to where the channel has been is its loop
//   ?FB0 … ?FBn     back to the mark until played n times; ?FBn,m the same back to label m
//   ?IDmask,len     an MSX-MUSIC drum hit; $hex numbers
// one-letter ? and @ forms included. Ticks are the same on every row and chip.
// Other commands are skipped with their numbers. This is a reading for display and
// editing, not a compiler: what it cannot follow it leaves out.

const PART = /^([ \t]*)(PSGS|SCCS|OPLS|(?:MSX)?(?:[A-V][0-9]*)+|SCC(?:[A-E][0-9]?)+)(?=[ \t])/;
const SHARED = { PSGS: 'MSXD', SCCS: 'SCCA', OPLS: 'MSXA' };
const EXTENDED = /^(?:MSX[A-K]|SCC[A-E])[ \t][^;\n]*(?:\?|@[A-Za-z]|:\d)|^(?:PSGS|SCCS|OPLS)[ \t]/m;
// The native compiler's channel order.
const MSX_ORDER = ['MSXD', 'MSXE', 'MSXF', 'SCCA', 'SCCB', 'SCCC', 'SCCD', 'SCCE', 'MSXA', 'MSXB', 'MSXC', 'MSXH', 'MSXI', 'MSXJ', 'MSXG'];
// MucoMSX one-letter forms of the commands that change timing.
const MSX_ALIAS = { u: 'XU', p: 'FC', r: 'FR', j: 'FJ', b: 'FB', D: 'ID', P: 'FD', R: 'XD', k: 'XT', x: 'XM', z: 'XS', f: 'XP' };
const MACRO = /^#\s*\*(\d+)\{([^}]*)\}/;
const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const ROUTE = '\u0001';   // where a channel's own code starts (msxTracks)
const ORDER = 'ABCDEFGHIJKLMNOPQRSTUV';

// The tracks one part name writes to: 'A', 'A1' (page 1), 'MSXD', 'SCCB' …
export function partTracks(name) {
  const prefix = name.startsWith('SCC') ? 'SCC' : name.startsWith('MSX') ? 'MSX' : '';
  return (name.slice(prefix.length).match(/[A-V][0-9]?/g) || []).map((p) => prefix + p);
}

function trackOrder(name) {
  const prefix = name.startsWith('SCC') ? 2 : name.startsWith('MSX') ? 1 : 0;
  const rest = name.slice(prefix ? 3 : 0);
  return prefix * 1000 + ORDER.indexOf(rest[0]) * 10 + (+rest.slice(1) || 0);
}

// ---------- reading the text into nodes ----------
// The text of a track is a list of characters with where they came from. Macro calls
// (*n) are replaced by the macro's text, as the compiler does, so a / or ] inside a macro
// belongs to the repeat around the call.
function streamOf(segments, macros = new Map(), depth = 0) {
  const s = [];
  for (const seg of segments) {
    const text = seg.text;
    for (let i = 0; i < text.length; i++) {
      const m = text[i] === '*' && /^\*(\d+)/.exec(text.slice(i));
      if (m && macros.has(m[1])) {
        if (depth < 8) s.push(...streamOf([macros.get(m[1])], macros, depth + 1).slice(0, -1));
        i += m[0].length - 1;
        continue;
      }
      s.push({ ch: text[i], row: seg.row, col: seg.col + i, macro: seg.macro, alone: seg.alone !== false });
    }
    s.push({ ch: ' ', row: 0, col: 0 });   // lines do not run into each other
  }
  return s;
}

// msx: read MucoMSX commands; lex (extended songs): the channel's octave and default
// length as the compiler fixes them where they are written.
function parse(s, msx = false, lex = null) {
  let i = 0;
  const peek = (k = 0) => (s[i + k] ? s[i + k].ch : '');
  const num = () => {
    let t = '';
    if (peek() === '-' && /\d/.test(peek(1))) { t = '-'; i++; }
    while (/\d/.test(peek())) t += s[i++].ch;
    return t === '' || t === '-' ? null : +t;
  };
  // A length: { div } (n), { clocks } (%n) or {} (the default), with dots.
  const length = () => {
    const len = {};
    if (peek() === '%') { i++; len.clocks = num(); }   // (dots after %n do not count)
    else { const n = num(); if (n !== null) len.div = n; }
    len.dots = 0;
    while (peek() === '.') { len.dots++; i++; }
    return len;
  };
  const extend = () => {
    const ties = [];
    while (peek() === '^') { i++; ties.push(length()); }
    return ties;
  };
  // MucoMSX operands: numbers ($hex too) or - (off), separated by commas.
  const operands = () => {
    const args = [];
    for (;;) {
      const back = i;
      while (peek() === ' ' || peek() === '\t') i++;
      if (peek() === '$') {
        i++;
        let t = '';
        while (/[0-9A-Fa-f]/.test(peek())) t += s[i++].ch;
        args.push(parseInt(t || '0', 16));
      } else if (/[+-]?\d/.test(peek() + peek(1)) && (/\d/.test(peek()) || /\d/.test(peek(1)))) {
        let sign = 1;
        if (peek() === '+' || peek() === '-') { sign = peek() === '-' ? -1 : 1; i++; }
        args.push(sign * num());
      } else if (peek() === '-') { i++; args.push('-'); }
      else { i = back; break; }
      const comma = i;
      while (peek() === ' ' || peek() === '\t') i++;
      if (peek() !== ',') { i = comma; break; }
      i++;
    }
    return args;
  };
  const nodes = [];
  const stack = [{ body: nodes }];
  const top = () => stack[stack.length - 1].body;
  while (i < s.length) {
    const start = i, c = peek();
    if (msx && (c === '?' || (c === '@' && /[A-Za-z]/.test(peek(1))))) {
      i++;
      let name = '';
      if (c === '?' && /[A-Z]/.test(peek()) && /[A-Z]/.test(peek(1)) && !/[A-Za-z]/.test(peek(2))) { name = peek() + peek(1); i += 2; }
      else if (/[A-Za-z]/.test(peek())) { name = MSX_ALIAS[peek()] || peek(); i++; }
      const args = operands();
      const n = typeof args[0] === 'number' ? args[0] : null;
      if (name === 'FD' || name === 'XD') {
        while (/[ \t=]/.test(peek())) i++;
        if (peek() === '{') i++;
        if (name === 'FD') { if (n !== null) top().push({ t: 'label', id: n }); }
        else { while (i < s.length && peek() !== '}') i++; i++; }   // effects are not played
      } else if (name === 'XU' && n) top().push({ t: 'unit', v: n });
      else if (name === 'XT' && n !== null) top().push({ t: 'type', v: n });
      else if (name === 'XM' && n !== null) top().push({ t: 'xm', mode: n, v: typeof args[1] === 'number' ? args[1] : null });
      else if (name === 'XS' && n !== null) top().push({ t: 'step', v: n & 255, src: { at: s[start], letterLen: i - start, len: i - start } });
      else if (name === 'XP') top().push({ t: 'step', v: null });
      else if (name === 'FC' && n !== null) top().push({ t: 'call', id: n });
      else if (name === 'FJ' && n !== null) top().push({ t: 'jump', id: n });
      else if (name === 'FR') top().push({ t: 'ret' });
      else if (name === 'FB' && args.length === 1 && n === 0) top().push({ t: 'mark' });
      else if (name === 'FB' && n) top().push({ t: 'fb', count: n, target: typeof args[1] === 'number' ? args[1] : null });
      else if (name === 'ID' && args.length > 1) {
        const len = { units: typeof args[1] === 'number' ? args[1] : 1 };
        const src = { at: s[start], letterLen: i - start, len: i - start };
        top().push(args[0] === '-' ? { t: 'rest', len, ties: [], src } : { t: 'note', semi: 0, drum: args[0], len, ties: [], src });
      }
      continue;
    }
    if (msx && c === ':' && /\d/.test(peek(1))) { i++; top().push({ t: 'label', id: num() }); continue; }
    if (msx && c === '}') { i++; continue; }
    if (c === ROUTE) { i++; top().push({ t: 'route' }); continue; }
    if (lex && (c === 'o' || c === '>' || c === '<')) {
      i++;
      if (c === 'o') { const v = num(); if (v !== null) lex.oct = v; } else lex.oct += c === '>' ? 1 : -1;
      top().push({ t: 'o', v: lex.oct });
      continue;
    }
    if (lex && c === 'l') { i++; lex.def = length(); continue; }
    if (c in SEMI || c === 'r') {
      i++;
      let semi = c === 'r' ? null : SEMI[c];
      while (c !== 'r' && /[+\-#]/.test(peek())) semi += peek() === '-' ? -1 : 1, i++;
      const letterLen = i - start;
      const len = length();
      if (lex && len.div === undefined && (len.clocks === undefined || len.clocks === null)) Object.assign(len, lex.def ? { ...lex.def, l: true } : { deflt: true });
      const ties = extend();
      top().push({ t: c === 'r' ? 'rest' : 'note', semi, len, ties, src: { at: s[start], letterLen, len: i - start } });
    } else if (c === '{') {
      // Portamento: the first note sounds (for its length), the rest only move the octave.
      i++;
      const inner = [];
      let first = null;
      while (i < s.length && peek() !== '}') {
        const k = peek();
        if (k in SEMI) {
          const st = i;
          i++;
          let semi = SEMI[k];
          while (/[+\-#]/.test(peek())) semi += peek() === '-' ? -1 : 1, i++;
          const letterLen = i - st;
          const len = length();
          const node = { t: 'note', semi, len, ties: [], porta: true, src: { at: s[st], letterLen, len: i - st } };
          if (!first) { first = node; inner.push(node); }
        } else if (k === '>' || k === '<') { inner.push({ t: k === '>' ? 'up' : 'down', inPorta: !!first }); i++; }
        else if (k === 'o') { i++; inner.push({ t: 'o', v: num(), inPorta: !!first }); }
        else i++;
      }
      i++;
      // {c>c}4 (the length after the braces) is read too, though the compiler rejects it.
      const after = length();
      if (first && (after.div !== undefined || after.clocks !== undefined)) first.len = after;
      top().push({ t: 'porta', inner });
    } else if (c === '[') { i++; const loop = { t: 'loop', body: [], exit: -1, count: 2 }; top().push(loop); stack.push(loop); }
    else if (c === '/') { i++; if (stack.length > 1) stack[stack.length - 1].exit = top().length; }
    else if (c === ']') {
      i++;
      const n = num();
      if (stack.length > 1) { const loop = stack.pop(); if (n !== null) loop.count = n; }
    } else if (c === '>' || c === '<') { i++; top().push({ t: c === '>' ? 'up' : 'down' }); }
    else if (c === 'o') { i++; top().push({ t: 'o', v: num() }); }
    else if (c === 'l') { i++; top().push({ t: 'l', len: length() }); }
    else if (c === 'C') { i++; top().push({ t: 'C', v: num() }); }
    else if (c === '@') {
      i++;
      if (/\d/.test(peek())) top().push({ t: '@', v: num() });
      else if (peek() === '"') {
        // A voice by name: @"name"
        let name = '';
        i++;
        while (i < s.length && peek() !== '"') name += s[i++].ch;
        i++;
        top().push({ t: '@', v: name });
      }
    }
    else if (c === 'v') { i++; top().push({ t: 'v', v: num() }); while (peek() === ',' || /\d/.test(peek())) i++; }
    else if (c === ')' || c === '(') { i++; const n = num(); top().push({ t: 'vrel', d: (c === ')' ? 1 : -1) * (n ?? 1) }); }
    else if (c === '&') { i++; top().push({ t: 'tie' }); }
    else if (c === 'L') { i++; top().push({ t: 'L' }); }
    else if (c === ':' || c === '!') { i++; top().push({ t: 'end', at: s[start] }); }
    else if (c === '%') { i++; top().push({ t: 'count', v: num() }); }
    else if (c === 's') { i++; top().push({ t: 's', v: num() }); }
    else if (c === '^') { i++; top().push({ t: 'extend', len: length() }); }
    else if (c === '\\') {
      // \=n,v picks the echo (the n-th note back); \ alone plays it for the last note's length.
      const at = s[i];
      i++;
      if (peek() === '=') { i++; top().push({ t: 'echoSet', v: num() }); while (/[\d,]/.test(peek())) i++; }
      else top().push({ t: 'echo', src: { at, letterLen: 1, len: 1 } });
    }
    else {
      // Any other command: its letter(s), then numbers, signs, commas.
      i++;
      while (/[-+\d,.$%]/.test(peek())) i++;
    }
  }
  return nodes;
}

// ---------- playing the nodes into events ----------
// Lengths the way the compiler counts them (msub.STLIZM, SETRST, SETLIZ):
//   note  %n, or C/n (or the default) with every dot adding half of the last part; a byte
//   rest  the same, but only one dot unless the driver is mucomDotNET (#driver, MSX songs)
//   l     every dot
// In an extended MucoMSX song lengths are fixed where written (the default and l too); on
// a compact channel a length is a number of units (%n, or 192/n) of ?XU ticks.
function extTicks(len, st) {
  if (len.units !== undefined) return len.units * (st.compact ? st.unit : 1);
  if (len.deflt) return st.compact ? st.unit : 24;
  if (st.compact) return (len.clocks ?? (len.div ? Math.max(1, Math.round(192 / len.div)) : 1)) * st.unit;
  return ticksOf(len, st, len.l ? 'l' : 'note');
}
function ticksOf(len, st, kind = 'note') {
  if (len.clocks !== undefined && len.clocks !== null) return len.clocks & 255;
  let t = len.div ? Math.floor(st.clock / len.div) : st.count;
  if (kind === 'rest' && !st.dotnet) return len.dots ? ((t & 255) + ((t & 255) >> 1)) & 255 : t & 255;
  let cnt = t, add = 0;
  for (let d = 0; d < len.dots; d++) { cnt >>= 1; add += cnt; }
  return kind === 'l' ? t + add : (t + add) & 255;
}

// A PSG / SCC track of type 4 (?XT4): its notes start the shared effects ?XD0–?XD9 (the
// note's place in the octave: c = 0, c+ = 1 … a = 9) instead of sounding a pitch.
const fxTrack = (st) => st.ext && st.base && st.type !== null && (st.type & 5) === 4;

function run(nodes, st, out, rep) {
  for (const node of nodes) {
    if (st.ended) return;
    switch (node.t) {
      case 'note': case 'rest': {
        const tk = (l) => (st.ext ? extTicks(l, st) : ticksOf(l, st, node.t));
        let len = tk(node.len) + node.ties.reduce((sum, l) => sum + tk(l), 0);
        // s n: key-on revise, added to one note and taken from the next.
        if (node.t === 'note' && st.shuffle) { len = Math.max(0, len + st.shuffle); st.shuffle = -st.shuffle; }
        const ev = { tick: st.tick, len, kind: node.t, src: node.src, rep, oct: st.oct, clock: st.clock, unit: st.compact ? st.unit : 0 };
        if (node.t === 'note') {
          ev.midi = 12 * (st.oct + 1) + node.semi;
          ev.inst = node.drum ?? st.inst;
          if (fxTrack(st)) ev.fx = ((node.semi % 12) + 12) % 12;
          ev.vol = st.vol;
          if (st.tie) ev.tied = true;
          if (node.porta) ev.porta = true;
        }
        st.tie = false;
        out.push(ev);
        st.tick += len;
        if (node.t === 'note') { st.last = len; st.history.unshift(ev.midi); st.history.length = Math.min(st.history.length, 10); }
        break;
      }
      case 'echo': {
        const midi = st.history[st.echo];
        if (midi === undefined || !st.last) break;
        out.push({ tick: st.tick, len: st.last, kind: 'note', midi, oct: st.oct, clock: st.clock, inst: st.inst, vol: st.vol, echo: true, src: node.src, rep });
        st.tick += st.last;
        break;
      }
      case 'echoSet': st.echo = Math.max(0, (node.v || 1) - 1); break;
      case 'count': if (node.v) st.count = node.v; break;
      case 'extend': {
        // ^len after a gap: the last note (or rest) gets longer.
        const ev = out[out.length - 1];
        const add = st.ext ? extTicks(node.len, st) : ticksOf(node.len, st);
        if (ev) ev.len += add;
        st.tick += add;
        break;
      }
      case 'porta': run(node.inner, st, out, rep); break;
      case 'up': st.oct = Math.min(8, st.oct + 1); break;
      case 'down': st.oct = Math.max(1, st.oct - 1); break;
      case 'o': if (node.v !== null) st.oct = Math.max(1, Math.min(8, node.v)); break;
      case 'l': st.count = ticksOf(node.len, st, 'l'); break;
      case 's': st.shuffle = node.v || 0; break;
      case 'C': if (node.v && !st.compact) st.clock = node.v; break;
      case 'unit': st.unit = node.v; break;
      // PSG / SCC track types: 1 notes, 2 literal steps (?XS, ?XP) of the length ?XM set
      // (?XM0: the next step's own value), 4 notes that start effects.
      case 'type': st.type = node.v; break;
      case 'xm': if (node.mode === 0) st.stepNext = true; else if (node.v !== null) st.stepLen = node.v; break;
      case 'step': {
        if (!st.base) break;
        if (st.stepNext && node.v !== null) { st.stepLen = node.v; st.stepNext = false; }
        const type = st.type ?? 1;
        if (fxTrack(st) && node.v !== null) {
          // a note byte that starts effect ?XD(byte >> 4)
          const len = ((node.v & 15) + 1) * st.unit;
          out.push({ tick: st.tick, len, kind: 'note', midi: 12 * (st.oct + 1) + (node.v >> 4), fx: node.v >> 4, inst: st.inst, vol: st.vol, src: node.src, rep, oct: st.oct, clock: st.clock, unit: st.unit });
          st.tick += len;
        } else if (type & 1 && node.v !== null) {
          // ?XS on a note track is a note byte: pitch (12+ a rest) and length in units.
          const pitch = node.v >> 4, len = ((node.v & 15) + 1) * st.unit;
          const ev = { tick: st.tick, len, kind: pitch >= 12 ? 'rest' : 'note', src: node.src, rep, oct: st.oct, clock: st.clock, unit: st.unit };
          if (pitch < 12) Object.assign(ev, { midi: 12 * (st.oct + 1) + pitch, inst: st.inst, vol: st.vol });
          out.push(ev);
          st.tick += len;
        } else if (type & 2) st.tick += Math.max(1, st.stepLen || 1);
        break;
      }
      case '@': st.inst = node.v; break;
      case 'v': if (node.v !== null) st.vol = node.v; break;
      case 'vrel': st.vol = (st.vol ?? 0) + node.d; break;
      case 'tie': st.tie = true; break;
      case 'L': st.loopTick = st.tick; break;
      case 'end': st.ended = true; st.endAt = node.at; return;
      case 'loop':
        for (let k = 0; k < Math.max(1, node.count); k++) {
          const last = k === node.count - 1;
          run(last && node.exit >= 0 ? node.body.slice(0, node.exit) : node.body, st, out, rep || k > 0);
          if (st.ended || st.tick > 1e7) return;
        }
        break;
    }
  }
}

// Source positions of a track's events, and which of them are written once but played
// more than once (repeats, macros, phrases).
function finish(events) {
  const seen = new Map();
  for (const ev of events) {
    const at = ev.src.at;
    // alone: false when the line is written by several parts (AB c d e): editing it changes them all.
    ev.src = { row: at.row, col: at.col, len: ev.src.len, letterLen: ev.src.letterLen, macro: !!at.macro, alone: at.alone !== false };
    const key = `${at.row}:${at.col}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const ev of events) ev.shared = seen.get(`${ev.src.row}:${ev.src.col}`) > 1;
}

// Where more notes for a track can be written: after its last line's MML (or on a new line
// after it), at the octave the track ends on; on a compact MucoMSX row, in front of its !.
function tailOf(segs, st, compact) {
  const lastSeg = segs[segs.length - 1];
  const tail = { row: lastSeg.row, col: lastSeg.end, alone: lastSeg.alone, oct: st.oct, ended: st.ended };
  if (compact && st.endAt && st.endAt.row === lastSeg.row && st.endAt.col === lastSeg.end - 1) Object.assign(tail, { col: st.endAt.col, before: true, ended: false });
  return tail;
}

// The MSX channels of an extended MucoMSX song: one run of code, laid out as the compiler
// lays it out, and each channel played through it from its start. rows: every MSX row in
// the text's order, { ch, seg } (shared rows under their chip's first channel).
const COMPACT = /(?:\?XU|[?@]u)[ \t]*\d/;
const DEFINITION = /^[ \t]*(?:\?(?:FD|XD)|[?@][PR])[ \t]*[$\d]/;
function msxTracks(rows, macros) {
  const byChannel = new Map();
  for (const r of rows) {
    if (!byChannel.has(r.ch)) byChannel.set(r.ch, []);
    byChannel.get(r.ch).push(r.seg);
  }
  const compact = new Map([...byChannel].map(([ch, segs]) => [ch, segs.some((g) => COMPACT.test(g.text))]));
  // With ordinary (non-?XU) rows the compiler puts each channel's rows together, in channel
  // order, and ends each ordinary channel; otherwise the rows stay in the text's order.
  const grouped = [...compact.values()].some((c) => !c);
  const lex = new Map([...compact].map(([ch, c]) => [ch, { oct: c ? 4 : 6, def: null }]));
  const started = new Set();
  // A channel starts at its first own row that is not a definition.
  const mark = (ch, seg) => {
    if (seg.shared || started.has(ch) || DEFINITION.test(seg.text)) return [seg];
    started.add(ch);
    return [{ text: ROUTE, row: 0, col: 0, ch }, seg];
  };
  const code = [], labels = new Map(), routes = new Map();
  // The shared effects (?XDn={…}), for the tracker: where each is defined and its text.
  const effects = new Map();
  const XD = /(?:\?XD|[?@]R)[ \t]*(\$[0-9A-Fa-f]+|\d+)[ \t]*=?[ \t]*\{[^}]*\}?/g;
  for (const { seg } of rows) {
    for (const m of seg.text.matchAll(XD)) {
      const id = m[1][0] === '$' ? parseInt(m[1].slice(1), 16) : +m[1];
      if (!effects.has(id)) effects.set(id, { row: seg.row, col: seg.col + m.index, len: m[0].length, text: m[0].endsWith('}') ? m[0] : m[0] + ' …' });
    }
  }
  const add = (ch, segs) => {
    for (const node of parse(streamOf(segs, macros), true, lex.get(ch))) {
      if (node.t === 'label' && !labels.has(node.id)) labels.set(node.id, code.length);
      if (node.t === 'route' && !routes.has(ch)) routes.set(ch, code.length);
      code.push(node);
    }
  };
  if (grouped) {
    for (const ch of MSX_ORDER) {
      if (!byChannel.has(ch)) continue;
      add(ch, byChannel.get(ch).flatMap((g) => mark(ch, g)));
      if (!compact.get(ch)) code.push({ t: 'end' });
    }
  } else for (const r of rows) add(r.ch, mark(r.ch, r.seg));
  const tracks = [];
  for (const ch of MSX_ORDER) {
    const own = (byChannel.get(ch) || []).filter((g) => !g.shared);
    if (!own.length) continue;
    const st = { ext: true, compact: compact.get(ch), base: MSX_ORDER.indexOf(ch) < 8, type: null, stepLen: 1, stepNext: false, unit: 1, shuffle: 0, tick: 0,
      oct: compact.get(ch) ? 4 : 6, count: compact.get(ch) ? 1 : 24, clock: 128, inst: null, vol: null, tie: false, loopTick: null, ended: false, last: 0, history: [], echo: 0 };
    const events = [], played = new Map(), counters = new Map(), calls = [];
    let pc = routes.has(ch) ? routes.get(ch) + 1 : code.length, mark = pc, steps = 0;
    while (pc < code.length && !st.ended && steps++ < 200000 && st.tick < 1e7) {
      const node = code[pc], again = played.has(pc);
      if (!again) played.set(pc, st.tick);
      if (node.t === 'call') {
        const to = labels.get(node.id);
        if (to !== undefined && calls.length < 8) { calls.push(pc + 1); pc = to; continue; }
      } else if (node.t === 'ret') {
        if (!calls.length) break;
        pc = calls.pop();
        continue;
      } else if (node.t === 'jump') {
        const to = labels.get(node.id);
        if (to === undefined) break;
        // Back to where this channel has been: that is its loop.
        if (played.has(to) && !calls.length) { st.loopTick = played.get(to); break; }
        pc = to;
        continue;
      } else if (node.t === 'mark') mark = pc;
      else if (node.t === 'fb') {
        const to = node.target === null ? mark : labels.get(node.target);
        const n = (counters.get(pc) || 0) + 1;
        if (to !== undefined && n < node.count) { counters.set(pc, n); pc = to; continue; }
        counters.delete(pc);
      } else if (node.t !== 'label' && node.t !== 'route') run([node], st, events, again);
      pc++;
    }
    finish(events);
    tracks.push({ name: ch, events, end: st.tick, loopTick: st.loopTick, clock: st.clock, unit: compact.get(ch) ? st.unit : 0, tail: tailOf(own, st, compact.get(ch)),
      effects, fxTail: fxTrack(st) });
  }
  return tracks;
}

// The song's tracks: [{ name, events: [{ tick, len, kind, midi, oct, inst, vol, tied,
// porta, rep, shared, src: { row, col, len, letterLen, macro } }], end, loopTick, clock }]
export function timeline(text) {
  const lines = text.split('\n');
  const macros = new Map();
  lines.forEach((line, k) => {
    const m = MACRO.exec(line);
    if (m) macros.set(m[1], { text: m[2], row: k + 1, col: line.indexOf('{') + 1, macro: true });
  });
  const extended = EXTENDED.test(text);
  const segments = new Map();
  const msxRows = [];
  lines.forEach((line, k) => {
    const m = PART.exec(line);
    if (!m) return;
    let body = line.slice(m[0].length);
    const semicolon = body.indexOf(';');
    if (semicolon >= 0) body = body.slice(0, semicolon);
    // PSGS / SCCS / OPLS: definitions for the first channel of their chip; not a track.
    const share = SHARED[m[2]];
    if (share) {
      if (extended) msxRows.push({ ch: share, seg: { text: body, row: k + 1, col: m[0].length, shared: true } });
      return;
    }
    const tracksHere = partTracks(m[2]);
    for (const track of tracksHere) {
      if (!segments.has(track) && !(extended && /^(MSX|SCC)/.test(track))) segments.set(track, []);
      // alone: the line writes only to this track, so notes can be added at its end.
      const seg = { text: body, row: k + 1, col: m[0].length, alone: tracksHere.length === 1, end: m[0].length + body.trimEnd().length };
      if (extended && /^(MSX|SCC)/.test(track)) msxRows.push({ ch: track, seg });
      else segments.get(track).push(seg);
    }
  });
  // Rests take every dot under the mucomDotNET driver, which MUCOMSX songs are compiled for.
  const dotnet = /^#driver[ \t]+mucomDotNET/im.test(text) || [...segments.keys()].some((n) => /^(MSX|SCC)/.test(n)) || /^#SSGExtend[ \t]+On/im.test(text);
  const tracks = extended ? msxTracks(msxRows, macros) : [];
  for (const [name, segs] of segments) {
    const nodes = parse(streamOf(segs, macros));
    const st = { dotnet, shuffle: 0, tick: 0, oct: 6, count: 24, clock: 128, inst: null, vol: null, tie: false, loopTick: null, ended: false, last: 0, history: [], echo: 0 };
    const events = [];
    run(nodes, st, events, false);
    finish(events);
    // A part with no notes yet still gets a column, to start writing it from the tracker.
    tracks.push({ name, events, end: st.tick, loopTick: st.loopTick, clock: st.clock, unit: 0, tail: tailOf(segs, st, false) });
  }
  tracks.sort((a, b) => trackOrder(a.name) - trackOrder(b.name));
  return tracks;
}

// ---------- writing back ----------
const LETTERS = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];

// A length in clocks as MML: 8, 4., or %12 when no note value fits. On a compact MucoMSX
// row (unit: ticks per unit) it is a number of units, %1–%16.
export function lengthText(ticks, clock = 128, unit = 0) {
  if (unit) return `%${Math.max(1, Math.min(16, Math.round(ticks / unit)))}`;
  for (const dots of [0, 1, 2]) {
    // base + base/2 + base/4 …
    const factor = [1, 1.5, 1.75][dots];
    const base = ticks / factor;
    if (Number.isInteger(base) && base > 0 && clock % base === 0) {
      let cnt = base, add = 0;
      for (let d = 0; d < dots; d++) { cnt >>= 1; add += cnt; }
      if (base + add === ticks) return String(clock / base) + '.'.repeat(dots);
    }
  }
  return `%${ticks}`;
}

// A whole note or rest of any length: pieces of at most a whole note (each length is a
// byte), tied with ^ for a note, separate rests for a rest. letters: 'c+', 'r' …
export function tokenText(letters, ticks, clock = 128, unit = 0) {
  if (unit) {
    // Compact rows have no ties: a long note is played again every 16 units.
    const out = [];
    for (let left = Math.max(1, Math.round(ticks / unit)); left > 0; left -= 16) out.push(`${letters}%${Math.min(16, left)}`);
    return out.join(' ');
  }
  const pieces = [];
  for (let left = ticks; left > 0; left -= Math.min(left, clock)) pieces.push(lengthText(Math.min(left, clock), clock));
  if (!pieces.length) return '';
  return letters === 'r' ? pieces.map((l) => 'r' + l).join(' ') : letters + pieces.join('^');
}

// A note at `midi` written where the octave is `oct`: c+, >d<, <<a>> …
export function noteText(midi, oct, length = '') {
  const want = Math.floor(midi / 12) - 1;
  const d = want - oct;
  const name = LETTERS[((midi % 12) + 12) % 12] + length;
  return d > 0 ? '>'.repeat(d) + name + '<'.repeat(d) : d < 0 ? '<'.repeat(-d) + name + '>'.repeat(-d) : name;
}
