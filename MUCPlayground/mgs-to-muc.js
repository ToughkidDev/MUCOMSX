// Turns an MGS file (MGSDRV: MSX PSG, SCC, MSX-MUSIC) into a MUC for MUCPlayground, as an
// arrangement for the OPNA with the SCC kept:
//   PSG 1-3    -> OPNA SSG  D E F
//   SCC 1-5    -> SCCA-SCCE
//   FM 1-6     -> OPNA FM   A B C H I J   (a seventh to ninth FM track -> MSX-MUSIC MSXA-C)
//   rhythm     -> OPNA rhythm G
// No ? commands are written, so the song stays in the ordinary grammar (65,536 bytes).
//
// Steps 1 and 2 of the converter: notes, rests, lengths, gates, octaves, ties, repeats, tempo;
// OPLL voices as OPNA voices, volumes, PSG / SCC envelopes and noise, the rhythm, SCC waves.
// Detune, vibrato, portamento and envelopes on FM tracks come later; what was left out is
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
import { OPLL_ROM, OPLL_NAMES, opllToOpna, opllSelector, FM_VOLUME, OPLL_VOLUME, envelopeLevels, fitEnvelope, envelopeText } from './mgs-voices.js';

const TIMER_UNIT = 1152 / 3993600;          // seconds per timer-B count
const NOTE = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];
// MGSDRV's own pitch table of the PSG and SCC (periods of octave 1, c to b).
const PSG_TUNE = [3421, 3228, 3047, 2876, 2715, 2562, 2419, 2283, 2155, 2034, 1920, 1812];
const MAX_TEXT = 65536;
const UNROLL_LIMIT = 3000;                  // tokens a written-out repeat may take
// The PSG one volume step (3 dB) down: MGSDRV's PSG against its SCC and OPLL, as measured,
// is that much quieter than the OPNA's SSG against the SCC and the OPNA's FM.
const PSG_VOLUME_STEP = 1;
const MAX_MACROS = 100;
// The OPNA rhythm against the SSG as MGSDRV's OPLL rhythm sits against its PSG (measured hit by
// hit): the total level, and each drum's level at MGS volume 15 (BD, SD, TOP, HH, TOM).
const RHYTHM_TOTAL = 50;
const RHYTHM_TOP = { bd: 31, sd: 27, top: 31, hh: 28, tom: 23 };

const OPNA_FM = ['A', 'B', 'C', 'H', 'I', 'J'], OPLL_FM = ['MSXA', 'MSXB', 'MSXC'];
const PSG = ['D', 'E', 'F'], SCC = ['SCCA', 'SCCB', 'SCCC', 'SCCD', 'SCCE'];

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

// ---- one track ---------------------------------------------------------------------------
// MGSDRV keeps its state while it plays (a repeat that ends in another octave starts its next
// pass there); MUCOM88 fixes octave and default length when it compiles, and several MGS
// commands become MUC text that depends on what was set before (a voice is patch + sustain, an
// E is envelope + release speed). So every command goes through one function, act(), which
// moves the track's state and says what the command sounds or writes; a repeat is kept as a
// repeat only when all its passes come out the same.
//
// kind: 'psg' | 'scc' | 'fm' | 'opll' | 'rhythm'
// state: oct, len, gate (all); env, k, off (psg, scc); patch, user, sus, vol (fm, opll); lv (rhythm)
const clamp15 = (v) => Math.min(15, Math.max(0, v));
const startState = (kind) => ({ oct: 4, len: 48, gate: 8, env: -1, k: 0, off: 0, patch: 0, user: -1, sus: 0, vol: 0, lv: kind === 'rhythm' ? [0, 0, 0, 0, 0] : null });
const cloneState = (st) => ({ ...st, lv: st.lv && [...st.lv] });
const stateKey = (st) => `${st.oct},${st.len},${st.gate},${st.env},${st.k},${st.off},${st.patch},${st.user},${st.sus},${st.vol},${st.lv || ''}`;

// What command x does from state st (changed in place): null, { note, len, key } for a note or
// rest, { drums, len } for a rhythm hit, or { tokens: [...] } to write. song.skip counts what
// is left out (only when counting).
function act(x, st, kind, song, counting) {
  const skip = (name) => { if (counting) song.report.skip(name); return null; };
  const fmVolume = kind === 'opll' ? OPLL_VOLUME : FM_VOLUME;
  // an MSX-MUSIC part cannot lengthen the release: its voice is the same with sustain on
  const voice = () => ({ tokens: [song.voice(st.patch, kind === 'opll' ? 0 : st.sus, counting, kind)] });
  const rhythmVolume = () => {
    // an OPLL volume step is 3 dB, an OPNA rhythm level step 0.75 dB
    const il = (top, v) => Math.max(0, top - 4 * (15 - v));
    const [b, s, m, c, h] = st.lv, T = RHYTHM_TOP;
    return { tokens: [`v${RHYTHM_TOTAL},${il(T.bd, b)},${il(T.sd, s)},${il(T.top, c)},${il(T.hh, h)},${il(T.tom, m)},0`] };
  };
  // the envelope in force as E (with the release speed k), and what else selecting it sets
  const envelope = (select) => {
    const f = song.envelope(st.env, kind);
    // one token: the envelope with the tone / noise setting it brings (they become a macro)
    const tokens = [f.text(st.k) + (select && kind === 'psg' && f.mode ? ` P${f.mode}${f.mode >= 2 ? ` w${f.noise}` : ''}` : '')];
    if (select) {
      const d = f.off - st.off;       // the envelope's own peak is carried by the volume
      if (d > 0) tokens.push(`(${d}`); else if (d < 0) tokens.push(`)${-d}`);
      st.off = f.off;
    }
    return { tokens };
  };
  switch (x[0]) {
    case 'o': st.oct = x[1]; return null;
    case '>': st.oct = Math.min(8, st.oct + 1); return null;
    case '<': st.oct = Math.max(1, st.oct - 1); return null;
    case 'l': st.len = x[1]; return null;
    case 'q': if (kind === 'rhythm') return null; st.gate = x[1]; return null;
    case 'note':
      if (kind === 'rhythm' || x[1] >= 12) return { note: 'r', len: x[2] ?? st.len, auto: x[2] === null };
      return { note: x[1], len: x[2] ?? st.len, auto: x[2] === null, gate: st.gate };
    case 'rh': {
      if (kind !== 'rhythm' || !x[1]) return { note: 'r', len: x[2] ?? st.len, auto: x[2] === null };
      // MGS: 16 B, 8 S, 4 tom, 2 cymbal, 1 hi-hat; G part: 1 BD, 2 SD, 4 TOP, 8 HH, 16 TOM
      const f = x[1];
      return { drums: (f & 16 ? 1 : 0) | (f & 8 ? 2 : 0) | (f & 2 ? 4 : 0) | (f & 1 ? 8 : 0) | (f & 4 ? 16 : 0), len: x[2] ?? st.len, auto: x[2] === null };
    }
    case '&': return { tokens: ['&'] };
    case 't': { const n = timerFor(x[1]); if (counting) song.report.tempo(x[1], n); return { tokens: [`t${256 - n}`] }; }
    case 'v':
      if (kind === 'rhythm') { st.lv.fill(x[1]); return rhythmVolume(); }
      if (kind === 'fm' || kind === 'opll') { st.vol = x[1]; return { tokens: [`v${fmVolume[st.vol]}`] }; }
      return { tokens: [`v${clamp15(x[1] - st.off - (kind === 'psg' ? PSG_VOLUME_STEP : 0))}`] };
    case 'v+':
      if (!x[1]) return null;
      if (kind === 'rhythm') { st.lv = st.lv.map((v) => clamp15(v + x[1])); return rhythmVolume(); }
      if (kind === 'fm' || kind === 'opll') {
        const was = st.vol;
        st.vol = clamp15(st.vol + x[1]);
        return fmVolume[st.vol] === fmVolume[was] ? null : { tokens: [`v${fmVolume[st.vol]}`] };
      }
      return { tokens: [`${x[1] > 0 ? ')' : '('}${Math.abs(x[1])}`] };
    case 'rv': if (kind !== 'rhythm' || x[1] > 4) return null; st.lv[x[1]] = x[2]; return rhythmVolume();
    case 'rv+': if (kind !== 'rhythm' || x[1] > 4) return null; st.lv[x[1]] = clamp15(st.lv[x[1]] + x[2]); return rhythmVolume();
    case '@':
      if (kind === 'fm' || kind === 'opll') {
        // The OPLL has one user voice: a number without a definition leaves the registers as
        // they are, so it plays the user voice chosen before it.
        const defined = song.userVoice(x[1]);
        if (defined === true) st.user = x[1];
        st.patch = defined === false ? (st.user >= 0 ? st.user : song.firstUser) : x[1];
        return voice();
      }
      if (kind === 'scc') return song.waves.has(x[1]) ? { tokens: [`@${x[1]}`] } : skip('@ (wave not defined)');
      if (kind === 'psg') { st.env = x[1]; return envelope(true); }
      return null;
    case '@e':
      if (kind === 'psg' || kind === 'scc') { st.env = x[1]; return envelope(true); }
      return skip('@e (FM)');
    case 'k':
      if (kind !== 'psg' && kind !== 'scc') return null;
      st.k = x[1];
      return song.envelope(st.env, kind).usesK ? envelope(false) : null;
    case 'sus':
      if (kind !== 'fm' && kind !== 'opll') return null;
      if (st.sus === x[1]) return null;
      st.sus = x[1];
      return kind === 'opll' ? null : voice();
    case '/': return kind === 'psg' ? { tokens: [`P${x[1]}`] } : skip(kind === 'fm' || kind === 'opll' ? 'keyoff' : '/');
    case 'n': return kind === 'psg' ? { tokens: [`w${x[1]}`] } : null;
    default: return skip(x[0]);
  }
}

let nodeIds = new WeakMap(), nextId = 1;
const idOf = (node) => { if (!nodeIds.has(node)) nodeIds.set(node, nextId++); return nodeIds.get(node); };
const mix = (h, x) => (Math.imul(h ^ x, 0x01000193) + 0x9e3779b9) >>> 0;
const mixText = (h, s) => { for (let i = 0; i < s.length; i++) h = mix(h, s.charCodeAt(i)); return mix(h, 0x7f); };

function convertTrack(cmds, kind, m, song) {
  const report = song.report;
  const items = buildTree(cmds, report);
  const memo = new Map();
  let out = [];
  let sim = startState(kind);                  // MGSDRV's state
  // What the text written so far leaves; nothing is taken for granted at the start (the
  // default length of a part is not a quarter of C192 until l says so).
  // mask (the drums of the rhythm part) and q are set while the song plays, so the text
  // cannot count on them across a repeat: they are written again after every [ / ] and L.
  let txt = { oct: null, len: null, mask: null, q: null };
  const forget = () => { txt.mask = null; txt.q = null; };
  // #psg_tune: the pitch table of the PSG and SCC tracks. Each note moves by the nearest
  // number of semitones to where the table puts it (the fine rest comes with detune).
  const tune = (kind === 'psg' || kind === 'scc') && m.voice?.psgTune
    ? m.voice.psgTune.map((p, i) => (p > 0 ? Math.round(12 * Math.log2(PSG_TUNE[i] / p)) : 0)) : null;

  // ---- the model: a hash of what items[from, to) sound and write from state st
  const run = (list, from, to, st) => {
    let h = 0x811c9dc5;
    for (let i = from; i < to; i++) {
      const x = list[i];
      if (!Array.isArray(x)) { h = mix(h, runLoop(x, st)); continue; }
      const a = act(x, st, kind, song, false);
      if (!a) continue;
      if (a.tokens) for (const t of a.tokens) h = mixText(h, t);
      else h = mix(mix(h, a.drums !== undefined ? 512 + a.drums : a.note === 'r' ? 255 : st.oct * 16 + a.note + (a.gate << 8)), a.len);
    }
    return h;
  };
  // one pass of a repeat (the last one stops at its exit), remembered per entry state
  const pass = (node, partial, st) => {
    const key = `${idOf(node)}:${partial ? 1 : 0}:${stateKey(st)}`;
    let r = memo.get(key);
    if (!r) {
      const s = cloneState(st);
      const h = run(node.body, 0, partial ? node.exit : node.body.length, s);
      memo.set(key, r = { h, st: s });
    }
    Object.assign(st, cloneState(r.st));
    return r.h;
  };
  const runLoop = (node, st) => {
    let h = 0x1234567;
    const n = node.count || 1;
    for (let i = 0; i < n; i++) h = mix(h, pass(node, i === n - 1 && node.exit !== null, st));
    return h;
  };
  // do all passes of the repeat come out as its text, written once from state st, would?
  const stable = (node, st) => {
    const s = cloneState(st);
    const full = pass(node, false, cloneState(st)), part = node.exit !== null ? pass(node, true, cloneState(st)) : 0;
    for (let i = 0; i < node.count; i++) {
      const last = i === node.count - 1 && node.exit !== null;
      if (pass(node, last, s) !== (last ? part : full)) return false;
    }
    return true;
  };

  // ---- writing
  const setOctave = (carry) => {
    const want = Math.min(8, Math.max(1, sim.oct + carry));
    if (txt.oct === want) return;
    out.push(txt.oct !== null && want === txt.oct + 1 ? '>' : txt.oct !== null && want === txt.oct - 1 ? '<' : `o${want}`);
    txt.oct = want;
  };
  // gate: MGSDRV's q (the note sounds for q/8 of its length; 8, or 0 on FM, the whole of it)
  // as MUCOM88's q, the clocks cut from the end of the note.
  const sound = (name, n, auto, carry, gate = 8) => {
    if (auto && n <= 255 && n !== txt.len) { out.push(`l${lengthText(n)}`); txt.len = n; }
    if (carry !== null) setOctave(carry);
    const ps = pieces(n);
    if (carry !== null) {
      const tail = ps[ps.length - 1];
      const cut = gate >= 8 || gate <= 0 ? 0 : Math.min(tail - 1, n - Math.max(1, Math.floor((n * gate) / 8)));
      if (cut !== txt.q) { out.push(`q${cut}`); txt.q = cut; }
    }
    ps.forEach((p, i) => {
      out.push(name + (p === txt.len ? '' : lengthText(p)));
      if (i < ps.length - 1 && name !== 'r') out.push('&');
    });
  };
  // An envelope written again before any note has sounded replaces the one before it.
  const write = (t) => {
    if (t[0] === 'E') {
      for (let j = out.length - 1; j >= 0 && !/^[a-gr[\]/L]/.test(out[j]); j--) {
        if (out[j][0] !== 'E') continue;
        const rest = out[j].indexOf(' ');
        if (t.includes(' ') || rest < 0) { out.splice(j, 1); break; }
        out[j] = t + out[j].slice(rest);            // only its E changes; the P / w it set stay
        return;
      }
    }
    out.push(t);
  };
  const emit = (list, from, to) => {
    for (let i = from; i < to; i++) {
      const x = list[i];
      if (!Array.isArray(x)) { loop(x); continue; }
      const a = act(x, sim, kind, song, true);
      if (!a) continue;
      if (a.tokens) for (const t of a.tokens) write(t);
      else if (a.drums !== undefined) {
        if (a.drums !== txt.mask) { out.push(`@${a.drums}`); txt.mask = a.drums; }
        sound('c', a.len, a.auto, null);
      } else if (a.note === 'r') sound('r', a.len, a.auto, null);
      else {
        const key = a.note + (tune ? tune[a.note] : 0);
        sound(NOTE[((key % 12) + 12) % 12], a.len, a.auto, Math.floor(key / 12), a.gate);
      }
    }
  };
  const asRepeat = (node) => {
    const end = node.exit ?? node.body.length;
    const after = cloneState(sim);
    runLoop(node, after);
    out.push('[');
    forget();
    emit(node.body, 0, end);
    if (node.exit !== null) { out.push('/'); forget(); emit(node.body, end, node.body.length); }
    out.push(`]${node.count}`);
    forget();
    sim = after;
  };
  const loop = (node) => {
    if (node.count === 0) {                       // the rest of the track, for ever
      const s = cloneState(sim);
      const first = pass(node, false, s);         // s is now the state the second pass starts in
      const second = pass(node, false, s);        // ... and now the third
      if (first !== second) {
        // the first pass differs: it is the lead-in, and the second is what repeats
        emit(node.body, 0, node.body.length);
        if (pass(node, false, cloneState(s)) !== second) report.warn('repeatDrifts');
      }
      out.push('L');
      forget();
      emit(node.body, 0, node.body.length);
      return;
    }
    if (stable(node, sim)) { asRepeat(node); return; }
    // its passes differ: write them out, unless that gets long
    const keep = { out, sim: cloneState(sim), txt: { ...txt } };
    out = [];
    const end = node.exit ?? node.body.length;
    let fits = true;
    for (let i = 0; i < node.count && fits; i++) {
      emit(node.body, 0, i === node.count - 1 ? end : node.body.length);
      fits = out.length <= UNROLL_LIMIT;
    }
    if (fits) { keep.out.push(...out); out = keep.out; report.count('repeatsWrittenOut'); return; }
    out = keep.out; sim = keep.sim; txt = keep.txt;
    report.warn('repeatDrifts');
    asRepeat(node);
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

// The volume a PSG / SCC track mostly plays its notes at (its envelopes are fitted there).
function usualVolume(cmds) {
  const seen = new Array(16).fill(0);
  let v = 0;
  for (const c of cmds) {
    if (c[0] === 'v') v = c[1];
    else if (c[0] === 'v+') v = clamp15(v + c[1]);
    else if (c[0] === 'note' && c[1] < 12) seen[v]++;
  }
  const most = seen.indexOf(Math.max(...seen));
  return seen[most] ? Math.max(4, most) : 13;
}

// mgsToMuc(bytes, { fileName }) -> { text, title, report }
// Throws an Error with a plain message for a file that is not MGS, is damaged or becomes too long.
export function mgsToMuc(bytes, { fileName = '' } = {}) {
  const m = parseMgs(bytes);
  nodeIds = new WeakMap(); nextId = 1;
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
  const n0 = timerFor(tempo);
  report.tempo(tempo, n0);
  const active = Object.keys(m.tracks).map(Number).filter((t) => hasNotes(m.tracks[t]) || hasTempo(m.tracks[t]));
  if (!active.length) throw new Error('The MGS file has no notes.');

  // ---- what the tracks share: waves, envelopes, voices (a number defined twice: the later
  // definition is the one in force)
  const maps = new Map((m.voice?.maps || []).map((x) => [x.from, x.to]));
  const romOf = (n) => (maps.has(n) ? maps.get(n) : n >= 15 ? 0 : n + 1);     // 0: the song's own voice
  const userPatch = new Map((m.voice?.opll || []).map((v) => [v.num, v.data]));
  const envelopes = new Map((m.voice?.env || []).map((e) => [e.num, e]));
  const ticksPerFrame = 1 / 60 / (n0 * TIMER_UNIT);      // MUCOM88 clocks in a frame, at the song's tempo
  const fits = new Map(), voiceIds = new Map(), voices = [];
  const song = {
    report,
    waves: new Map((m.voice?.scc || []).map((w) => [w.num, w.data])),
    vref: 13,
    envelope(num) {
      // no envelope chosen, or a number without a definition: the plain level, released at k
      const env = envelopes.get(num) || { type: 'e', mode: 0, noise: 0, cmds: [['v', 15]] };
      const key = `${envelopes.has(num) ? num : -1}:${this.vref}`;
      let f = fits.get(key);
      if (!f) {
        if (env.type === 'r') {
          f = { mode: env.mode, noise: env.noise, off: 0, usesK: false, text: () => envelopeText(env, env.rr, ticksPerFrame) };
        } else {
          const { levels, mode, noise } = envelopeLevels(env);
          const fit = fitEnvelope(levels, this.vref);
          // k: the level falls by one step (16 of 255) every k frames after key off; k0 at once
          f = { mode, noise, off: 15 - fit.peak, usesK: true, text: (k) => envelopeText(fit, k ? 16 / k : 255, ticksPerFrame) };
        }
        fits.set(key, f);
      }
      return f;
    },
    // is n a user voice with a definition (true) or without one (false)? null: a built-in voice
    userVoice: (n) => (romOf(n) ? null : userPatch.has(n)),
    firstUser: userPatch.size ? Math.min(...userPatch.keys()) : 15,
    // the MUC voice of OPLL patch n with sustain on or off
    voice(n, sus, counting, kind) {
      if (!counting) return `@?${n}:${sus}`;
      const rom = romOf(n);
      let data = rom ? OPLL_ROM[rom - 1] : userPatch.get(n);
      if (!data) { data = [0, 0, 0, 0, 0, 0, 0, 0]; report.warn('voiceNotDefined'); }
      const key = `${data.join(',')}:${sus}:${kind}`;
      if (!voiceIds.has(key)) {
        voiceIds.set(key, voices.length);
        voices.push({ data, sus, rom, opll: kind === 'opll', name: rom ? `OPLL ${rom} ${OPLL_NAMES[rom - 1]}` : `@v${n}` });
      }
      return `@${voiceIds.get(key)}`;
    },
  };

  // parts: FM tracks beyond six go to MSX-MUSIC, the ones that only use built-in voices first
  const plain = (t) => !m.tracks[t].cmds.some((c) => (c[0] === '@' && romOf(c[1]) === 0) || c[0] === 'y' || c[0] === '@e');
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

  const parts = [], body = [], tracks = [];
  let firstRow = true;
  for (const t of [...partOf.keys()].sort((a, b) => a - b)) {
    const { part, kind } = partOf.get(t), cmds = m.tracks[t].cmds;
    song.vref = kind === 'psg' || kind === 'scc' ? usualVolume(cmds) : 13;
    const tokens = convertTrack(cmds, kind, m, song);
    if (m.tracks[t].unknown !== null) report.warn('unknownCommand');
    const first = ['C192'];
    if (firstRow) first.push(`t${256 - n0}`);
    firstRow = false;
    if (kind === 'fm' || kind === 'opll') {
      // a note before the first @ plays the first voice
      const firstNote = cmds.findIndex((c) => c[0] === 'note' && c[1] < 12), firstVoice = cmds.findIndex((c) => c[0] === '@');
      if (firstNote >= 0 && (firstVoice < 0 || firstNote < firstVoice)) first.push(song.voice(0, 0, true, kind));
      first.push(`v${(kind === 'opll' ? OPLL_VOLUME : FM_VOLUME)[0]}`);
    } else if (kind === 'psg' || kind === 'scc') first.push('E255,0,0,0,0,255 v0');
    else first.push(`v${RHYTHM_TOTAL},0,0,0,0,0,0`);
    tracks.push({ part, first: first.join(' '), tokens });
    parts.push({ track: t, part });
  }
  // An envelope setting used several times becomes a macro (#*n{...}, called with *n).
  const uses = new Map();
  for (const tr of tracks) for (const t of tr.tokens) if (t[0] === 'E') uses.set(t, (uses.get(t) || 0) + 1);
  const macros = new Map([...uses].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, MAX_MACROS).map(([t], i) => [t, i]));
  for (const tr of tracks) body.push(...rows(tr.part, tr.first, tr.tokens.map((t) => (macros.has(t) ? `*${macros.get(t)}` : t))));

  const title = decodeTitle(m.title, fileName.replace(/\.[^.]*$/, ''));
  const lines = [`#title ${title}`, `#comment Converted from ${fileName || 'an MGS file'} (MGS${m.version}) by MUCPlayground`];
  if (voices.some((v) => !v.opll)) lines.push('#CarrierCorrection Yes');
  lines.push('');
  if (voices.length > 256) throw new Error('The MGS file needs more than 256 FM voices as a MUC.');
  voices.forEach((v, id) => {
    const o = v.opll ? opllSelector(v.data, v.rom) : opllToOpna(v.data, !!v.sus);
    lines.push(`; ${v.name}${v.sus ? ', sustain on' : ''}${v.opll ? ' (for the MSX-MUSIC parts: it selects the built-in voice)' : ''}`, `  @${id}`, `   ${o.fb},${o.alg}`, ...o.ops.map((op) => `   ${op.join(',')}`));
  });
  if (voices.length) lines.push('');
  for (const [num, data] of [...song.waves].sort((a, b) => a[0] - b[0])) lines.push(`  @W${num}:{ ${data.join(',')} }`);
  if (song.waves.size) lines.push('');
  for (const [t, i] of macros) lines.push(`#*${i}{${t}}`);
  if (macros.size) lines.push('');
  lines.push(...body);
  const text = lines.join('\n') + '\n';
  const size = new TextEncoder().encode(text).length;
  if (size > MAX_TEXT) throw new Error(`The MGS file is too long as a MUC (${size.toLocaleString('en-US')} bytes; the limit is ${MAX_TEXT.toLocaleString('en-US')}).`);
  return {
    text, title,
    report: {
      version: m.version, compressed: m.compressed, oldTiming: !m.tempo, parts, voices: voices.length,
      tempo: tempos, skipped: Object.fromEntries(skipped), counts: Object.fromEntries(counts), warnings: [...warnings], size,
    },
  };
}
