// Turns an MGS file (MGSDRV: MSX PSG, SCC, MSX-MUSIC) into a MUC for MUCPlayground, as an
// arrangement for the OPNA with the SCC kept:
//   PSG 1-3    -> OPNA SSG  D E F
//   SCC 1-5    -> SCCA-SCCE
//   FM 1-6     -> OPNA FM   A B C H I J   (a seventh to ninth FM track -> MSX-MUSIC MSXA-C)
//   rhythm     -> OPNA rhythm G
// No ? commands are written, so the song stays in the ordinary grammar (65,536 bytes).
//
// Step 1 of the converter: notes, rests, lengths, octaves, ties, repeats, volume, SCC waves
// and tempo. Voices, envelopes and the other commands come later; what was left out is
// counted in the report.
//
// Timing: a quarter note is 48 steps in MGS; the MUC uses C192, one clock per step. MGSDRV
// plays a whole note (192 steps) in floor(14400 / tempo) frames of 1/60 s (measured on the
// driver; it is the "shortest note" formula of MGSC's manual), so tempo 170 really plays at
// 171.4. MUCOM88 plays one clock per timer-B period of (256 - t) * 1152 / 3993600 s, and t
// is the nearest value to that speed (the report gives all three). A file without a tempo
// (older than v3.04) counts in 1/60 s: tempo 75 is exactly that.
//
// Octave and default length are run-time state in MGSDRV (a repeat that ends in another
// octave starts its next pass there) but compile-time state in MUCOM88 (the text decides).
// Each track is therefore played through in a small model: a repeat whose passes do not all
// sound the same notes from the text is written out pass by pass.

import { parseMgs } from './mgs-file.js';

const TIMER_UNIT = 1152 / 3993600;          // seconds per timer-B count
const NOTE = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];
// MGSDRV's own pitch table of the PSG and SCC (periods of octave 1, c to b).
const PSG_TUNE = [3421, 3228, 3047, 2876, 2715, 2562, 2419, 2283, 2155, 2034, 1920, 1812];
const MAX_TEXT = 65536;
const UNROLL_LIMIT = 30000;                 // tokens a written-out repeat may add

const OPNA_FM = ['A', 'B', 'C', 'H', 'I', 'J'], OPLL_FM = ['MSXA', 'MSXB', 'MSXC'];
const PSG = ['D', 'E', 'F'], SCC = ['SCCA', 'SCCB', 'SCCC', 'SCCD', 'SCCE'];

// A placeholder voice until the OPLL voices are converted: one sine carrier pair.
const DEFAULT_VOICE = ['  @0', '   3,4', '   31,8,2,7,2,34,0,2,0', '   31,6,1,8,1,0,0,1,0', '   31,0,0,15,0,127,0,1,0', '   31,0,0,15,0,127,0,1,0'];

// Frames MGSDRV takes for a whole note, and the timer-B count nearest to its step.
const framesPerWhole = (tempo) => Math.max(1, Math.floor(14400 / Math.max(1, tempo)));
const timerFor = (tempo) => Math.min(255, Math.max(1, Math.round(framesPerWhole(tempo) / (192 * 60 * TIMER_UNIT))));

// A length in clocks as MML: 4, 8., %7 ...
function lengthText(n) {
  if (192 % n === 0) return String(192 / n);
  if (n % 3 === 0 && 192 % (n / 3 * 2) === 0) return `${192 / (n / 3 * 2)}.`;
  return `%${n}`;
}
// A length of any size in pieces of at most 255 clocks (whole notes first).
function pieces(n) {
  const out = [];
  while (n > 255) { out.push(192); n -= 192; }
  if (n > 0) out.push(n);
  return out;
}

// The commands of a track as a tree: repeats become { count, body, exit } nodes. A [ without
// its ] plays straight through; what follows a repeat that never ends is never reached.
function buildTree(cmds, report) {
  const root = { body: [] };
  const stack = [root];
  for (let i = 0; i < cmds.length; i++) {
    const c = cmds[i], top = stack[stack.length - 1];
    if (c[0] === '[') { const node = { count: c[1], body: [], exit: null }; top.body.push(node); stack.push(node); }
    else if (c[0] === ']') { if (stack.length > 1) stack.pop(); }
    else if (c[0] === '|') { if (stack.length > 1 && top.exit === null) top.exit = top.body.length; }
    else if (c[0] === '&') {
      // a slur only between two notes
      const prev = cmds[i - 1];
      let k = i + 1;
      while (k < cmds.length && !['note', 'rh', '[', ']', '|'].includes(cmds[k][0])) k++;
      if (prev && prev[0] === 'note' && prev[1] < 12 && k < cmds.length && cmds[k][0] === 'note' && cmds[k][1] < 12) top.body.push(c);
    } else top.body.push(c);
  }
  while (stack.length > 1) {                 // unclosed: its commands are played once
    const node = stack.pop(), parent = stack[stack.length - 1];
    parent.body.splice(parent.body.indexOf(node), 1, ...node.body);
  }
  const fix = (items, depth) => {
    for (let i = 0; i < items.length; i++) {
      const x = items[i];
      if (Array.isArray(x)) continue;
      if (x.count === 0 && depth > 0) { x.count = 1; x.exit = null; report.warn('nestedEndless'); }
      fix(x.body, depth + 1);
      if (x.count === 0 && depth === 0) { x.exit = null; items.length = i + 1; break; }
    }
  };
  fix(root.body, 0);
  return root.body;
}

// ---- the run-time model: octave and default length -------------------------------------
let nodeIds = new WeakMap(), nextId = 1;
const idOf = (node) => { if (!nodeIds.has(node)) nodeIds.set(node, nextId++); return nodeIds.get(node); };
const mix = (h, x) => (Math.imul(h ^ x, 0x01000193) + 0x9e3779b9) >>> 0;

// Plays items[from, to) from state st (changed in place); returns a hash of what sounds.
function run(items, from, to, st, memo) {
  let h = 0x811c9dc5;
  for (let i = from; i < to; i++) {
    const x = items[i];
    if (!Array.isArray(x)) { h = mix(h, runLoop(x, st, memo)); continue; }
    switch (x[0]) {
      case 'o': st.oct = x[1]; break;
      case '>': st.oct = Math.min(8, st.oct + 1); break;
      case '<': st.oct = Math.max(1, st.oct - 1); break;
      case 'l': st.len = x[1]; break;
      case 'note': h = mix(mix(h, x[1] < 12 ? st.oct * 16 + x[1] : 255), x[2] ?? st.len); break;
      case 'rh': h = mix(mix(h, 256 + x[1]), x[2] ?? st.len); break;
      default: break;
    }
  }
  return h;
}
// One pass of a repeat (the last one stops at its exit), remembered per entry state.
function pass(node, partial, st, memo) {
  const key = `${idOf(node)}:${partial ? 1 : 0}:${st.oct}:${st.len}`;
  let r = memo.get(key);
  if (!r) {
    const s = { ...st };
    const h = run(node.body, 0, partial ? node.exit : node.body.length, s, memo);
    memo.set(key, r = { h, oct: s.oct, len: s.len });
  }
  st.oct = r.oct; st.len = r.len;
  return r.h;
}
function runLoop(node, st, memo) {
  let h = 0x1234567;
  const n = node.count || 1;
  for (let i = 0; i < n; i++) h = mix(h, pass(node, i === n - 1 && node.exit !== null, st, memo));
  return h;
}
// Do all passes of the repeat sound what its text, written once from state st, would?
function stable(node, st, memo) {
  const s = { ...st }, n = node.count;
  const full = pass(node, false, { ...st }, memo), part = node.exit !== null ? pass(node, true, { ...st }, memo) : 0;
  for (let i = 0; i < n; i++) {
    const last = i === n - 1 && node.exit !== null;
    if (pass(node, last, s, memo) !== (last ? part : full)) return false;
  }
  return true;
}

// ---- one track ---------------------------------------------------------------------------
// kind: 'psg' | 'scc' | 'fm' | 'opll' | 'rhythm'
function convertTrack(cmds, kind, m, report) {
  const items = buildTree(cmds, report);
  const memo = new Map();
  const out = [];
  const sim = { oct: 4, len: 48 };             // MGSDRV's state
  // What the text written so far leaves; nothing is taken for granted at the start (the
  // default length of a part is not a quarter of C192 until l says so).
  const txt = { oct: null, len: null, mask: null };
  // The octave numbers agree as they are (checked against MGSDRV's registers): o4 a is 440 Hz
  // on PSG / SSG and SCC, and 220 Hz on MGSDRV's FM, OPNA FM parts and MSX-MUSIC parts alike.
  const shift = 0;
  const waves = new Set(m.waves.keys());

  // #psg_tune: the pitch table of the PSG and SCC tracks. Each note moves by the nearest
  // number of semitones to where the table puts it (the fine rest comes with detune).
  const tune = (kind === 'psg' || kind === 'scc') && m.voice?.psgTune
    ? m.voice.psgTune.map((p, i) => (p > 0 ? Math.round(12 * Math.log2(PSG_TUNE[i] / p)) : 0)) : null;
  let carry = 0;                               // octaves the tuned note leaves its own octave by
  const setOctave = () => {
    const want = Math.min(8, Math.max(1, sim.oct + shift + carry));
    if (txt.oct === want) return;
    out.push(txt.oct !== null && want === txt.oct + 1 ? '>' : txt.oct !== null && want === txt.oct - 1 ? '<' : `o${want}`);
    txt.oct = want;
  };
  const sound = (name, length, pitched) => {
    const n = length ?? sim.len;
    if (length === null && n <= 255 && n !== txt.len) { out.push(`l${lengthText(n)}`); txt.len = n; }
    if (pitched) setOctave();
    const ps = pieces(n);
    ps.forEach((p, i) => {
      out.push(name + (p === txt.len ? '' : lengthText(p)));
      if (i < ps.length - 1 && name !== 'r') out.push('&');
    });
  };
  const emit = (list, from, to) => {
    for (let i = from; i < to; i++) {
      const x = list[i];
      if (!Array.isArray(x)) { loop(x); continue; }
      switch (x[0]) {
        case 'o': sim.oct = x[1]; break;
        case '>': sim.oct = Math.min(8, sim.oct + 1); break;
        case '<': sim.oct = Math.max(1, sim.oct - 1); break;
        case 'l': sim.len = x[1]; break;
        case 'note':
          if (kind === 'rhythm') { sound('r', x[2], false); break; }
          if (x[1] < 12) {
            const key = x[1] + (tune ? tune[x[1]] : 0);
            carry = Math.floor(key / 12);
            sound(NOTE[((key % 12) + 12) % 12], x[2], true);
          } else sound('r', x[2], false);
          break;
        case 'rh': {
          if (kind !== 'rhythm' || !x[1]) { sound('r', x[2], false); break; }
          // MGS: 16 B, 8 S, 4 tom, 2 cymbal, 1 hi-hat; G part: 1 BD, 2 SD, 4 TOP, 8 HH, 16 TOM
          const f = x[1], mask = (f & 16 ? 1 : 0) | (f & 8 ? 2 : 0) | (f & 2 ? 4 : 0) | (f & 1 ? 8 : 0) | (f & 4 ? 16 : 0);
          if (mask !== txt.mask) { out.push(`@${mask}`); txt.mask = mask; }
          sound('c', x[2], false);
          break;
        }
        case '&': out.push('&'); break;
        case 't': { const n = timerFor(x[1]); out.push(`t${256 - n}`); report.tempo(x[1], n); break; }
        case 'v':
          if (kind === 'rhythm') report.skip('v (rhythm)');
          else out.push(`v${x[1]}`);
          break;
        case 'v+':
          if (kind === 'rhythm') report.skip('v (rhythm)');
          else if (x[1]) out.push(`${x[1] > 0 ? ')' : '('}${Math.abs(x[1])}`);
          break;
        case '@':
          if (kind === 'scc' && waves.has(x[1])) out.push(`@${x[1]}`);
          else report.skip(kind === 'psg' ? '@ (envelope)' : kind === 'scc' ? '@ (wave not defined)' : '@ (voice)');
          break;
        default: report.skip(x[0]);
      }
    }
  };
  const loop = (node) => {
    if (node.count === 0) {                       // the rest of the track, for ever
      const s = { ...sim };
      const first = pass(node, false, s, memo);   // s is now the state the second pass starts in
      const second = pass(node, false, s, memo);  // ... and now the third
      if (first !== second) {
        // the first pass differs: it is the lead-in, and the second is what repeats
        emit(node.body, 0, node.body.length);
        if (pass(node, false, { ...s }, memo) !== second) report.warn('repeatDrifts');
      }
      out.push('L');
      txt.mask = null;
      emit(node.body, 0, node.body.length);
      return;
    }
    const end = node.exit ?? node.body.length;
    if (stable(node, sim, memo)) {
      const after = { ...sim };
      runLoop(node, after, memo);
      out.push('[');
      txt.mask = null;
      emit(node.body, 0, end);
      if (node.exit !== null) { out.push('/'); emit(node.body, end, node.body.length); }
      out.push(`]${node.count}`);
      txt.mask = null;
      sim.oct = after.oct; sim.len = after.len;
      return;
    }
    // its passes differ: write them out
    const before = out.length;
    for (let i = 0; i < node.count; i++) {
      emit(node.body, 0, i === node.count - 1 ? end : node.body.length);
      if (out.length - before > UNROLL_LIMIT) throw new Error('The MGS file is too long once its repeats are written out.');
    }
    report.count('repeatsWrittenOut');
  };
  emit(items, 0, items.length);
  return out;
}

// Tokens as rows of the part: notes run together, everything else is spaced.
function rows(part, first, tokens, width = 96) {
  const lines = [];
  let cur = `${part} ${first}`.trimEnd(), glue = false;
  for (const t of tokens) {
    const noteLike = /^[a-gr&<>]/.test(t);
    const sep = glue && noteLike ? '' : ' ';
    if (cur.length + sep.length + t.length > width) { lines.push(cur); cur = `${part} ${t}`; }
    else cur += sep + t;
    glue = noteLike;
  }
  lines.push(cur);
  return lines;
}

function decodeTitle(bytes, fallback) {
  let text = '';
  try { text = new TextDecoder('shift_jis').decode(bytes); } catch { text = String.fromCharCode(...bytes); }
  text = text.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (text || fallback || 'MGS').slice(0, 120);
}

const kindOf = (m, t) => (t <= 3 ? 'psg' : t <= 8 ? 'scc' : m.opllMode === 1 && t === 15 ? 'rhythm' : 'fm');
const hasNotes = (tr) => tr.cmds.some((c) => (c[0] === 'note' && c[1] < 12) || (c[0] === 'rh' && c[1]));
const hasTempo = (tr) => tr.cmds.some((c) => c[0] === 't');

// mgsToMuc(bytes, { fileName }) -> { text, title, report }
// Throws an Error with a plain message for a file that is not MGS, is damaged or becomes too long.
export function mgsToMuc(bytes, { fileName = '' } = {}) {
  const m = parseMgs(bytes);
  nodeIds = new WeakMap(); nextId = 1;
  // a wave number defined twice: the later definition is the one in force
  m.waves = new Map((m.voice?.scc || []).map((w) => [w.num, w.data]));
  const skipped = new Map(), counts = new Map(), warnings = new Set();
  const tempos = [];
  const report = {
    skip: (name) => skipped.set(name, (skipped.get(name) || 0) + 1),
    count: (name) => counts.set(name, (counts.get(name) || 0) + 1),
    warn: (name) => warnings.add(name),
    // written in the file, as MGSDRV plays it, as the MUC plays it
    tempo: (bpm, n) => tempos.push({ bpm, driver: 14400 / framesPerWhole(bpm), actual: 1.25 / (n * TIMER_UNIT) }),
  };

  const tempo = m.tempo || 75;
  const active = Object.keys(m.tracks).map(Number).filter((t) => hasNotes(m.tracks[t]) || hasTempo(m.tracks[t]));
  if (!active.length) throw new Error('The MGS file has no notes.');

  // parts: FM tracks beyond six go to MSX-MUSIC, the ones that only use built-in voices first
  const maps = new Map((m.voice?.maps || []).map((x) => [x.from, x.to]));
  const userVoice = (n) => (maps.has(n) ? maps.get(n) : n >= 15 ? 0 : n + 1) === 0;
  const plain = (t) => !m.tracks[t].cmds.some((c) => (c[0] === '@' && userVoice(c[1])) || c[0] === 'y' || c[0] === '@e');
  const fm = active.filter((t) => kindOf(m, t) === 'fm');
  const toOpll = [];
  if (fm.length > 6) {
    const order = [...fm].sort((a, b) => (plain(b) - plain(a)) || (b - a));
    for (const t of order.slice(0, Math.min(3, fm.length - 6))) toOpll.push(t);
    toOpll.sort((a, b) => a - b);
  }
  const onOpna = fm.filter((t) => !toOpll.includes(t));
  if (onOpna.length > 6) { report.warn('fmTracksDropped'); onOpna.length = 6; }
  const partOf = new Map();
  onOpna.forEach((t, i) => partOf.set(t, { part: OPNA_FM[i], kind: 'fm' }));
  toOpll.forEach((t, i) => partOf.set(t, { part: OPLL_FM[i], kind: 'opll' }));
  for (const t of active) {
    const k = kindOf(m, t);
    if (k === 'psg') partOf.set(t, { part: PSG[t - 1], kind: k });
    else if (k === 'scc') partOf.set(t, { part: SCC[t - 4], kind: k });
    else if (k === 'rhythm') partOf.set(t, { part: 'G', kind: k });
  }

  const title = decodeTitle(m.title, fileName.replace(/\.[^.]*$/, ''));
  const lines = [`#title ${title}`, `#comment Converted from ${fileName || 'an MGS file'} (MGS${m.version}) by MUCPlayground`, ''];
  if ([...partOf.values()].some((p) => p.kind === 'fm' || p.kind === 'opll')) lines.push(...DEFAULT_VOICE, '');
  for (const [num, data] of [...m.waves].sort((a, b) => a[0] - b[0])) lines.push(`  @W${num}:{ ${data.join(',')} }`);
  if (m.waves.size) lines.push('');

  const n0 = timerFor(tempo);
  report.tempo(tempo, n0);
  const parts = [];
  let firstRow = true;
  for (const t of [...partOf.keys()].sort((a, b) => a - b)) {
    const { part, kind } = partOf.get(t);
    const tokens = convertTrack(m.tracks[t].cmds, kind, m, report);
    if (m.tracks[t].unknown !== null) report.warn('unknownCommand');
    const first = ['C192'];
    if (firstRow) first.push(`t${256 - n0}`);
    firstRow = false;
    if (kind === 'fm' || kind === 'opll') first.push('@0 v0');
    else if (kind === 'psg') first.push('@0 v0');
    else if (kind === 'scc') first.push('E255,0,0,0,0,255 v0');
    else first.push('v63,31,31,31,31,31,0');
    lines.push(...rows(part, first.join(' '), tokens));
    parts.push({ track: t, part });
  }
  const text = lines.join('\n') + '\n';
  const size = new TextEncoder().encode(text).length;
  if (size > MAX_TEXT) throw new Error(`The MGS file is too long as a MUC (${size.toLocaleString('en-US')} bytes; the limit is ${MAX_TEXT.toLocaleString('en-US')}).`);
  return {
    text, title,
    report: {
      version: m.version, compressed: m.compressed, oldTiming: !m.tempo, parts,
      tempo: tempos, skipped: Object.fromEntries(skipped), counts: Object.fromEntries(counts), warnings: [...warnings], size,
    },
  };
}
