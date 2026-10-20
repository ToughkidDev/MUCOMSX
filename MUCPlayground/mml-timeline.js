// MML as a timeline, for the tracker view: every part's notes and rests with their start
// and length in clocks, pitch, voice (@) and volume (v), and where in the text they are.
// Read the way MUCOM88's compiler reads them (mucomDotNET muc88.cs):
//   defaults        o6 (internal octave 5), length 24 clocks, C128
//   lengths         n = C/n clocks, %n = n clocks, each dot adds half of the last part,
//                   ^len adds a length, & ties to the next note
//   o > < l C @ v ) ( r   as usual; [ … / … ]n repeats (n defaults to 2); *n macros
//                   (#*n{…}); L the loop point; : ends the part; { c4 > c } portamento
//                   (the first note's length)
// Other commands are skipped with their numbers. This is a reading for display and
// editing, not a compiler: what it cannot follow it leaves out.

const PART = /^([ \t]*)((?:MSX)?(?:[A-V][0-9]*)+|SCC(?:[A-E][0-9]?)+)(?=[ \t])/;
const MACRO = /^#\s*\*(\d+)\{([^}]*)\}/;
const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
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
      s.push({ ch: text[i], row: seg.row, col: seg.col + i, macro: seg.macro });
    }
    s.push({ ch: ' ', row: 0, col: 0 });   // lines do not run into each other
  }
  return s;
}

function parse(s) {
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
  const nodes = [];
  const stack = [{ body: nodes }];
  const top = () => stack[stack.length - 1].body;
  while (i < s.length) {
    const start = i, c = peek();
    if (c in SEMI || c === 'r') {
      i++;
      let semi = c === 'r' ? null : SEMI[c];
      while (c !== 'r' && /[+\-#]/.test(peek())) semi += peek() === '-' ? -1 : 1, i++;
      const letterLen = i - start;
      const len = length();
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
    else if (c === ':' || c === '!') { i++; top().push({ t: 'end' }); }
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
function ticksOf(len, st, kind = 'note') {
  if (len.clocks !== undefined && len.clocks !== null) return len.clocks & 255;
  let t = len.div ? Math.floor(st.clock / len.div) : st.count;
  if (kind === 'rest' && !st.dotnet) return len.dots ? ((t & 255) + ((t & 255) >> 1)) & 255 : t & 255;
  let cnt = t, add = 0;
  for (let d = 0; d < len.dots; d++) { cnt >>= 1; add += cnt; }
  return kind === 'l' ? t + add : (t + add) & 255;
}

function run(nodes, st, out, rep) {
  for (const node of nodes) {
    if (st.ended) return;
    switch (node.t) {
      case 'note': case 'rest': {
        let len = ticksOf(node.len, st, node.t) + node.ties.reduce((sum, l) => sum + ticksOf(l, st, node.t), 0);
        // s n: key-on revise, added to one note and taken from the next.
        if (node.t === 'note' && st.shuffle) { len = Math.max(0, len + st.shuffle); st.shuffle = -st.shuffle; }
        const ev = { tick: st.tick, len, kind: node.t, src: node.src, rep, oct: st.oct, clock: st.clock };
        if (node.t === 'note') {
          ev.midi = 12 * (st.oct + 1) + node.semi;
          ev.inst = st.inst;
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
        const add = ticksOf(node.len, st);
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
      case 'C': if (node.v) st.clock = node.v; break;
      case '@': st.inst = node.v; break;
      case 'v': if (node.v !== null) st.vol = node.v; break;
      case 'vrel': st.vol = (st.vol ?? 0) + node.d; break;
      case 'tie': st.tie = true; break;
      case 'L': st.loopTick = st.tick; break;
      case 'end': st.ended = true; return;
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

// The song's tracks: [{ name, events: [{ tick, len, kind, midi, oct, inst, vol, tied,
// porta, rep, shared, src: { row, col, len, letterLen, macro } }], end, loopTick, clock }]
export function timeline(text) {
  const lines = text.split('\n');
  const macros = new Map();
  lines.forEach((line, k) => {
    const m = MACRO.exec(line);
    if (m) macros.set(m[1], { text: m[2], row: k + 1, col: line.indexOf('{') + 1, macro: true });
  });
  const segments = new Map();
  lines.forEach((line, k) => {
    const m = PART.exec(line);
    if (!m) return;
    let body = line.slice(m[0].length);
    const semicolon = body.indexOf(';');
    if (semicolon >= 0) body = body.slice(0, semicolon);
    for (const track of partTracks(m[2])) {
      if (!segments.has(track)) segments.set(track, []);
      segments.get(track).push({ text: body, row: k + 1, col: m[0].length });
    }
  });
  // Rests take every dot under the mucomDotNET driver, which MUCOMSX songs are compiled for.
  const dotnet = /^#driver[ \t]+mucomDotNET/im.test(text) || [...segments.keys()].some((n) => /^(MSX|SCC)/.test(n)) || /^#SSGExtend[ \t]+On/im.test(text);
  const tracks = [];
  for (const [name, segs] of segments) {
    const nodes = parse(streamOf(segs, macros));
    const st = { dotnet, shuffle: 0, tick: 0, oct: 6, count: 24, clock: 128, inst: null, vol: null, tie: false, loopTick: null, ended: false, last: 0, history: [], echo: 0 };
    const events = [];
    run(nodes, st, events, false);
    const seen = new Map();
    for (const ev of events) {
      const at = ev.src.at;
      ev.src = { row: at.row, col: at.col, len: ev.src.len, letterLen: ev.src.letterLen, macro: !!at.macro };
      const key = `${at.row}:${at.col}`;
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    for (const ev of events) ev.shared = seen.get(`${ev.src.row}:${ev.src.col}`) > 1;
    if (events.length) tracks.push({ name, events, end: st.tick, loopTick: st.loopTick, clock: st.clock });
  }
  tracks.sort((a, b) => trackOrder(a.name) - trackOrder(b.name));
  return tracks;
}

// ---------- writing back ----------
const LETTERS = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];

// A length in clocks as MML: 8, 4., or %12 when no note value fits.
export function lengthText(ticks, clock = 128) {
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

// A note at `midi` written where the octave is `oct`: c+, >d<, <<a>> …
export function noteText(midi, oct, length = '') {
  const want = Math.floor(midi / 12) - 1;
  const d = want - oct;
  const name = LETTERS[((midi % 12) + 12) % 12] + length;
  return d > 0 ? '>'.repeat(d) + name + '<'.repeat(d) : d < 0 ? '<'.repeat(-d) + name + '>'.repeat(-d) : name;
}
