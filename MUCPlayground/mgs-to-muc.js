// Turns an MGS file (MGSDRV: MSX PSG, SCC, MSX-MUSIC) into a MUC for MUCPlayground, as an
// arrangement for the OPNA with the SCC kept:
//   PSG 1-3    -> OPNA SSG  D E F
//   SCC 1-5    -> SCCA-SCCE
//   FM 1-6     -> OPNA FM   A B C H I J   (a seventh to ninth FM track -> MSX-MUSIC MSXA-C)
//   rhythm     -> OPNA rhythm G
// No ? commands are written, so the song stays in the ordinary grammar (65,536 bytes).
//
// What is carried over: notes, rests, lengths, gates, octaves, ties, repeats, tempo; OPLL
// voices as OPNA voices (with the software envelopes MGSDRV runs on them built in), volumes,
// PSG / SCC envelopes and noise, the rhythm, SCC waves; detune, vibrato, pitch fall and
// portamento. What is left out is counted in the report: register writes (y) other than to the
// user voice, the PSG hardware envelope, and commands for programs around the driver (@m, @f).
//
// Timing: a quarter note is 48 steps in MGS; the MUC uses C192, one clock per step (fewer
// clocks for a song a Z80 could not keep up with: see CLOCK_DIVS). MGSDRV
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
import {
  OPLL_ROM, OPLL_NAMES, opllToOpna, opllSelector, FM_VOLUME, OPLL_VOLUME, envelopeLevels, fitEnvelope, envelopeText, envelopeVoice, rateEnvelopeLevels,
} from './mgs-voices.js';

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
// An OPLL F-number step in OPNA F-number steps (49716 Hz against 55467 Hz, 9 against 11 bits),
// and the F-number in the middle of an octave (for detune given as a fraction of a semitone).
const OPN_PER_OPLL = 3.585, OPLL_FNUM = 240;

const OPNA_FM = ['A', 'B', 'C', 'H', 'I', 'J'], OPLL_FM = ['MSXA', 'MSXB', 'MSXC'];
const PSG = ['D', 'E', 'F'], SCC = ['SCCA', 'SCCB', 'SCCC', 'SCCD', 'SCCE'];

// The clock. MUCOM88 works through every part once a clock, and a part with a vibrato or an
// envelope writes registers on every one. One clock per MGS step is up to 209 clocks a second,
// where a MUCOM88 song has about 60, and an MGS song has up to 17 parts. Measured with MUCPLAY
// on a 3.58 MHz Z80 (the mucoMSX emulator with Makoto, note times against this engine's):
// songs this engine plays with up to about 1400 register writes a second kept time, songs from
// 1540 fell behind once the player's look-ahead ran out (by 7 to 60%). A song estimated above
// Z80_WRITES therefore gets one clock for 2, 3, 4, 6 or 8 steps, the first that fits, stays
// at SLOWEST_CLOCK or above and leaves most note lengths whole clocks. MGSDRV itself only
// moves 60 times a second, so no clock above that is heard as such; below it envelopes and
// vibrato get coarser. Z80_WRITES is from running all 844 songs of a collection on that
// MSX: songs estimated up to 1350 kept time, the two estimated at 1380 and 1510 did not
// (they do at the coarser clock they now get), and one at 1230 fell behind for its vibrato
// (see MOST_VIBRATO).
const CLOCK_DIVS = [1, 2, 3, 4, 6, 8];
const Z80_WRITES = 1300;
const SLOWEST_CLOCK = 30;                    // clocks a second: no coarser clock than this
// The vibrato. Every step of a vibrato or a pitch fall is a calculation and a frequency write.
// The song of the 844 with the most steps (13 of its 16 parts moving on each of 60 clocks a
// second, 780 steps) fell behind on that MSX though its estimate is within Z80_WRITES, and
// keeps time with a step every other clock (the width kept, the period as near as two clocks
// a step allow); the next, at 660, keeps time as it is. Above MOST_VIBRATO steps a second the
// song's vibrato is written that way.
const MOST_VIBRATO = 700;
const MOST_ROUNDED = 0.25;                  // nor one that rounds more than this share of the notes

// Frames MGSDRV takes for a whole note, and the timer-B count nearest to a clock of div steps.
const framesPerWhole = (tempo) => Math.max(1, Math.floor(14400 / Math.max(1, tempo)));
const timerExact = (tempo, div) => (framesPerWhole(tempo) * div) / (192 * 60 * TIMER_UNIT);
const timerFor = (tempo, div) => Math.min(255, Math.max(1, Math.round(timerExact(tempo, div))));

// A length in clocks as MML, with clock clocks to the whole note: 4, 8., %7 ...
function lengthText(n, clock) {
  if (clock % n === 0) return String(clock / n);
  if (n % 3 === 0 && clock % (n / 3 * 2) === 0) return `${clock / (n / 3 * 2)}.`;
  return `%${n}`;
}
// A length of any size in pieces of at most 255 clocks (whole notes first).
function pieces(n, clock) {
  const out = [], big = clock * Math.floor(255 / clock);
  while (n > 255) { out.push(big); n -= big; }
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
// state: oct, len, gate, detune (dc coarse, df fine), LFO (lon, ld delay, lp depth, ls speed,
// lt step in 1/8), pf pitch fall, pp / po a portamento's start, ph / debt the place within a
// clock (see clocks() in act) (all);
// env, k, off (psg, scc); patch, user, sus, vol, fenv (the envelope on the voice), penv (the
// envelopes given to voices so far), ymod (user voice registers written with y) (fm, opll);
// lv (rhythm)
const clamp15 = (v) => Math.min(15, Math.max(0, v));
const startState = (kind, song) => ({
  oct: 4, len: 48, gate: 8, dc: 0, df: 0, lon: 0, ld: 0, lp: 0, ls: 0, lt: 0, pf: 0, pp: -1, po: 0, ph: 0, debt: 0,
  env: -1, k: 0, off: 0, patch: 0, user: -1, sus: 0, vol: 0, fenv: song.voiceEnvelopes.get(0) ?? -1, penv: '', ymod: '',
  lv: kind === 'rhythm' ? [0, 0, 0, 0, 0] : null,
});
const cloneState = (st) => ({ ...st, lv: st.lv && [...st.lv] });
const stateKey = (st) => Object.values(st).join(';');

// What command x does from state st (changed in place): null, { note, len, key } for a note or
// rest, { drums, len } for a rhythm hit (len in clocks), or { tokens: [...] } to write.
// song.skip counts what is left out (only when counting).
function act(x, st, kind, song, counting) {
  const skip = (name) => { if (counting) song.report.skip(name); return null; };
  const fmVolume = kind === 'opll' ? OPLL_VOLUME : FM_VOLUME;
  const melodic = kind === 'psg' || kind === 'scc', fmLike = kind === 'fm' || kind === 'opll';
  // n steps from here in clocks of song.div steps. The place in the track is rounded, not the
  // length, so a part never drifts from the others: st.ph is the steps into the current clock.
  // A note or drum hit sounds for at least one clock; st.debt is what the next lengths give back.
  const clocks = (n, sounding) => {
    const d = song.div, half = d >> 1, least = sounding && n > 0 ? 1 : 0;
    const c = Math.floor((st.ph + n + half) / d) - Math.floor((st.ph + half) / d) - st.debt;
    st.ph = (st.ph + n) % d;
    st.debt = Math.max(0, least - c);
    return Math.max(least, c);
  };
  // a length left to the default (l) stays so in the text when it is whole clocks
  const timed = (a, len, given, sounding) => {
    if (counting && sounding) { song.lengths.all++; if (len % song.div) song.lengths.rounded++; }
    return Object.assign(a, { len: clocks(len, sounding), auto: given === null && len % song.div === 0 });
  };
  // An MSX-MUSIC part plays a built-in voice as it is: no longer release, no envelope, no y.
  const voice = () => ({ tokens: [kind === 'opll' ? song.voice(st.patch, 0, counting, kind, -1, '') : song.voice(st.patch, st.sus, counting, kind, st.fenv, st.ymod)] });
  // Pitch in MUCOM88's units, which D and M share: 1/2268 of the period on SSG and SCC (up is
  // higher), an OPNA F-number step on FM parts (MSX-MUSIC parts take the same and scale it).
  const perPeriod = -2268 / song.period, perFnum = OPN_PER_OPLL;
  const detune = () => {
    const n = melodic ? -2268 * (((song.period + st.dc) / song.period) * 2 ** (st.df / 1536) - 1)
      : perFnum * (st.dc + OPLL_FNUM * (2 ** (st.df / 3060) - 1));
    return { tokens: [`D${Math.round(n)}`] };
  };
  // MGSDRV's vibrato: after ld + 2 frames the pitch moves lt/8 units every ls + 1 frames, lp/2
  // steps out and then lp + 1 steps (lp with #lfo_mode 1) each way. MUCOM88's M does the same
  // with a rate in clocks, so the step count and depth are set to keep period and width.
  const whole = (v) => (v === 0 ? 0 : Math.abs(v) < 1 ? Math.sign(v) : Math.round(v));
  const lfo = () => {
    const half = st.lp + (song.lfoMode ? 0 : 1), frames = st.ls + 1;
    if (!st.lp || !st.lt) return { tokens: ['MF0'] };
    const rate = Math.min(255, Math.max(song.vibratoStep, Math.round(frames * song.ticksPerFrame)));
    const count = Math.min(255, Math.max(1, Math.round((half * frames * song.ticksPerFrame) / rate)));
    const depth = whole(((half * st.lt) / 8) * (melodic ? perPeriod : perFnum) / count);
    return { tokens: [`M${Math.min(255, Math.round((st.ld + 2) * song.ticksPerFrame))},${rate},${depth},${count}`] };
  };
  // p: the period grows every frame, by n/4 of 0.39% of it below 128 and by (n - 128) steps of
  // the octave's size above: MUCOM88's M with a long first leg does a one-way slide.
  const fall = () => {
    if (!st.pf || st.pf === 128) return { tokens: ['MF0'] };
    const perFrame = st.pf < 128 ? -2.232 * st.pf : (st.pf - 128) * Math.max(1, 9 - song.octave) * perPeriod;
    const perTick = perFrame / song.ticksPerFrame;
    const rate = Math.max(song.vibratoStep, Math.abs(perTick) >= 1 ? 1 : Math.min(255, Math.round(1 / Math.abs(perTick))));
    return { tokens: [`M0,${rate},${whole(perTick * rate)},255`] };
  };
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
    case 'note': {
      if (kind === 'rhythm' || x[1] >= 12) return timed({ note: 'r' }, x[2] ?? st.len, x[2], false);
      // from: where a portamento (_) starts; legato: MGSDRV's q0 on FM keeps the key down
      const a = { note: x[1], gate: st.gate, from: st.pp < 0 ? null : [st.pp, st.po], legato: fmLike && st.gate === 0 };
      st.pp = -1;
      return timed(a, x[2] ?? st.len, x[2], true);
    }
    case '_': st.pp = Math.min(11, x[1]); st.po = st.oct; return null;
    case '\\': st.dc = x[1]; return detune();
    case '@\\': st.df = x[1]; return detune();
    case 'h': st.ld = Math.max(0, x[1]); st.lp = x[2]; st.ls = Math.max(0, x[3]); st.lt = x[4] * 8; st.pf = 0; st.lon = 1; return lfo();
    case '@p': if (!melodic || !st.lp) return null; st.lt = x[1]; return lfo();
    case 'lfo': if (!st.lp || st.lon === x[1]) return null; st.lon = x[1]; return { tokens: [`MF${x[1]}`] };
    case 'hi': return null;
    case 'p': if (!melodic) return null; st.pf = x[1]; st.lp = 0; return fall();
    case 'rh': {
      if (kind !== 'rhythm' || !x[1]) return timed({ note: 'r' }, x[2] ?? st.len, x[2], false);
      // MGS: 16 B, 8 S, 4 tom, 2 cymbal, 1 hi-hat; G part: 1 BD, 2 SD, 4 TOP, 8 HH, 16 TOM
      const f = x[1];
      return timed({ drums: (f & 16 ? 1 : 0) | (f & 8 ? 2 : 0) | (f & 2 ? 4 : 0) | (f & 1 ? 8 : 0) | (f & 4 ? 16 : 0) }, x[2] ?? st.len, x[2], true);
    }
    case '&': return { tokens: ['&'] };
    case 't': { const n = timerFor(x[1], song.div); if (counting) song.report.tempo(x[1], n); return { tokens: [`t${256 - n}`] }; }
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
        // the envelope a voice was given stays with the voice; choosing a user voice loads it afresh
        st.fenv = new Map(st.penv ? st.penv.split(',').map((e) => e.split(':').map(Number)) : []).get(st.patch) ?? song.voiceEnvelopes.get(st.patch) ?? -1;
        if (defined !== null) st.ymod = '';
        return voice();
      }
      if (kind === 'scc') return song.waves.has(x[1]) ? { tokens: [`@${x[1]}`] } : skip('@ (wave not defined)');
      if (kind === 'psg') { st.env = x[1]; return envelope(true); }
      return null;
    case '@e':
      if (melodic) { st.env = x[1]; return envelope(true); }
      if (kind !== 'fm') return skip('@e (MSX-MUSIC part)');
      st.fenv = x[1];
      st.penv = [...new Map([...(st.penv ? st.penv.split(',').map((e) => e.split(':').map(Number)) : []), [st.patch, x[1]]])].map((e) => e.join(':')).sort().join(',');
      return voice();
    case 'y': {
      // registers 0-7 are the OPLL's user voice: a change to the voice being played
      if (kind !== 'fm' || x[1] > 7 || song.userVoice(st.patch) === null) return skip('y');
      st.ymod = [...new Map([...(st.ymod ? st.ymod.split(',').map((e) => e.split(':').map(Number)) : []), [x[1], x[2]]])].map((e) => e.join(':')).sort().join(',');
      return voice();
    }
    case 'k':
      if (kind !== 'psg' && kind !== 'scc') return null;
      st.k = x[1];
      return song.envelope(st.env, kind).usesK ? envelope(false) : null;
    case 'sus':
      if (kind !== 'fm' && kind !== 'opll') return null;
      if (st.sus === x[1]) return null;
      st.sus = x[1];
      return kind === 'opll' ? null : voice();
    case '/': return kind === 'psg' ? { tokens: [`P${x[1]}`] } : skip('/');
    case 'keyoff': return fmLike ? { keyoff: true } : null;
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
  let sim = startState(kind, song);            // MGSDRV's state
  // What the text written so far leaves; nothing is taken for granted at the start (the
  // default length of a part is not a quarter until l says so).
  // mask (the drums of the rhythm part) and q are set while the song plays, so the text
  // cannot count on them across a repeat: they are written again after every [ / ] and L.
  let txt = { oct: null, len: null, mask: null, q: null, gate: 0 };   // gate: the q in force, known or not
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
      else if (a.keyoff) h = mix(h, 0x4a);
      else h = mix(mix(h, a.drums !== undefined ? 512 + a.drums : a.note === 'r' ? 255 : st.oct * 16 + a.note + (a.gate << 8) + (a.from ? (a.from[0] + a.from[1] * 16 + 1) << 12 : 0)), a.len);
    }
    return h;
  };
  // one pass of a repeat (the last one stops at its exit), remembered per entry state
  const pass = (node, partial, st) => {
    if (node.count === 0) st.ph = 0;            // the endless repeat counts its clocks from its start
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
  const setOctave = (carry, oct = sim.oct) => {
    const want = Math.min(8, Math.max(1, oct + carry));
    if (txt.oct === want) return;
    out.push(txt.oct !== null && want === txt.oct + 1 ? '>' : txt.oct !== null && want === txt.oct - 1 ? '<' : `o${want}`);
    txt.oct = want;
  };
  // gate: MGSDRV's q (the note sounds for q/8 of its length; 8, or 0 on FM, the whole of it)
  // as MUCOM88's q, the clocks cut from the end of the note.
  const gateFor = (n, tail, gate) => {
    const cut = gate >= 8 || gate <= 0 ? 0 : Math.min(tail - 1, n - Math.max(1, Math.floor((n * gate) / 8)));
    if (cut !== txt.q) { out.push(`q${cut}`); txt.q = cut; }
    txt.gate = cut;
  };
  let legatoAt = -1;                           // where the & of a q0 note was written
  // notes and clocks written, with repeats counted as often as they play (for the song's load);
  // gated: the clocks that fall within q of the end of a note or a rest
  let tally = { notes: 0, clocks: 0, gated: 0 };
  const played = (n, sounding) => { tally.clocks += n; if (sounding && n > 0) tally.notes++; };
  const gated = (n) => { tally.gated += Math.min(n, txt.gate); };
  const clock = song.clock;
  const sound = (name, n, auto, carry, gate = 8) => {
    if (auto && n > 0 && n <= 255 && n !== txt.len) { out.push(`l${lengthText(n, clock)}`); txt.len = n; }
    if (carry !== null) setOctave(carry);
    played(n, name !== 'r');
    const ps = pieces(n, clock);
    if (carry !== null) gateFor(n, ps[ps.length - 1], gate);
    gated(n);
    ps.forEach((p, i) => {
      out.push(name + (p === txt.len ? '' : lengthText(p, clock)));
      if (i < ps.length - 1 && name !== 'r') out.push('&');
    });
  };
  // A setting written again before any note has sounded replaces the one before it: an
  // envelope (only its E changes; the P / w it set stay), a detune, a vibrato, a volume, a voice.
  const kindOfToken = (t) => (t[0] === 'E' || t[0] === 'D' || t[0] === 'v' ? t[0] : t[0] === 'M' && t[1] !== 'F' ? 'M'
    : t[0] === '@' && (kind === 'fm' || kind === 'opll') ? '@' : null);
  const write = (t) => {
    const k = kindOfToken(t);
    if (k) {
      for (let j = out.length - 1; j >= 0 && !/^[a-gr[\]/L{]/.test(out[j]); j--) {
        if (kindOfToken(out[j]) !== k) continue;
        const rest = k === 'E' ? out[j].indexOf(' ') : -1;
        if (k !== 'E' || t.includes(' ') || rest < 0) { out.splice(j, 1); break; }
        out[j] = t + out[j].slice(rest);
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
      else if (a.keyoff) { if (out[out.length - 1] === '&' && legatoAt === out.length - 1) out.pop(); }
      else {
        const key = a.note + (tune ? tune[a.note] : 0), name = NOTE[((key % 12) + 12) % 12], carry = Math.floor(key / 12);
        const from = a.from && a.from[0] + (tune ? tune[a.from[0]] : 0);
        const startOct = a.from && Math.min(8, Math.max(1, a.from[1] + Math.floor(from / 12))), endOct = Math.min(8, Math.max(1, sim.oct + carry));
        if (a.from && (startOct !== endOct || ((from % 12) + 12) % 12 !== ((key % 12) + 12) % 12) && a.len <= 255) {
          // a portamento: {start end}length; between the braces only > and < may move the octave
          setOctave(Math.floor(from / 12), a.from[1]);
          gateFor(a.len, a.len, a.gate);
          played(a.len, true);
          gated(a.len);
          out.push(`{${NOTE[((from % 12) + 12) % 12]}${(endOct > startOct ? '>' : '<').repeat(Math.abs(endOct - startOct))}${name}}${lengthText(a.len, clock)}`);
          txt.oct = endOct;
        } else sound(name, a.len, a.auto, carry, a.gate);
        if (a.legato) { out.push('&'); legatoAt = out.length - 1; }
      }
    }
  };
  const asRepeat = (node) => {
    const end = node.exit ?? node.body.length;
    const after = cloneState(sim);
    runLoop(node, after);
    const outer = tally, head = tally = { notes: 0, clocks: 0, gated: 0 }, tail = { notes: 0, clocks: 0, gated: 0 };
    out.push('[');
    forget();
    emit(node.body, 0, end);
    if (node.exit !== null) { out.push('/'); forget(); tally = tail; emit(node.body, end, node.body.length); }
    out.push(`]${node.count}`);
    forget();
    tally = outer;
    for (const k of ['notes', 'clocks', 'gated']) tally[k] += node.count * head[k] + (node.count - 1) * tail[k];
    sim = after;
  };
  const loop = (node) => {
    if (node.count === 0) {                       // the rest of the track, for ever
      const s = cloneState(sim);
      const first = pass(node, false, s);         // s is now the state the second pass starts in
      const second = pass(node, false, s);        // ... and now the third
      if (first !== second) {
        // the first pass differs: it is the lead-in, and the second is what repeats
        sim.ph = 0;
        emit(node.body, 0, node.body.length);
        if (pass(node, false, cloneState(s)) !== second) report.warn('repeatDrifts');
      }
      out.push('L');
      forget();
      sim.ph = 0;
      tally = { notes: 0, clocks: 0, gated: 0 };  // what repeats is what counts
      emit(node.body, 0, node.body.length);
      return;
    }
    if (stable(node, sim)) { asRepeat(node); return; }
    // its passes differ: write them out, unless that gets long
    const keep = { out, sim: cloneState(sim), txt: { ...txt }, tally: { ...tally } };
    out = [];
    const end = node.exit ?? node.body.length;
    let fits = true;
    for (let i = 0; i < node.count && fits; i++) {
      emit(node.body, 0, i === node.count - 1 ? end : node.body.length);
      fits = out.length <= UNROLL_LIMIT;
    }
    if (fits) { keep.out.push(...out); out = keep.out; report.count('repeatsWrittenOut'); return; }
    out = keep.out; sim = keep.sim; txt = keep.txt; tally = keep.tally;
    report.warn('repeatDrifts');
    asRepeat(node);
  };
  emit(items, 0, items.length);
  return { tokens: out, notes: tally.notes, clocks: tally.clocks, gated: tally.gated };
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

// The note a track mostly plays: its PSG period (MGSDRV's table) and its octave.
function usualNote(cmds) {
  const periods = [];
  let oct = 4;
  for (const c of cmds) {
    if (c[0] === 'o') oct = c[1];
    else if (c[0] === '>') oct = Math.min(8, oct + 1);
    else if (c[0] === '<') oct = Math.max(1, oct - 1);
    else if (c[0] === 'note' && c[1] < 12) periods.push([PSG_TUNE[c[1]] / 2 ** (oct - 1), oct]);
  }
  if (!periods.length) return [254, 4];
  periods.sort((a, b) => a[0] - b[0]);
  return periods[periods.length >> 1];
}

// What a part costs: its notes a second, whether it runs a vibrato (M) or, on the SSG and
// SCC, an envelope that keeps moving (every clock of those writes registers), and on FM the
// clocks a second that fall within q of the end of a note or a rest (MUCOM88 writes the key
// off again on each of those).
const partLoad = (tr, clockRate) => ({
  kind: tr.kind,
  notes: tr.clocks ? (tr.notes / tr.clocks) * clockRate : 0,
  gated: tr.clocks && (tr.kind === 'fm' || tr.kind === 'opll') ? (tr.gated / tr.clocks) * clockRate : 0,
  lfo: tr.tokens.some((t) => /^M\d+,\d+,-?[1-9]/.test(t)),
  env: (tr.kind === 'psg' || tr.kind === 'scc') && tr.tokens.some((t) => /^E\d+,\d+,(?!0,\d+,0,)/.test(t)),
});
// The register writes a second the song makes at its busiest, estimated from that: per note of
// each kind of part, and per clock of a part for its vibrato, its envelope and (SSG, SCC) its
// level. Those numbers are fitted to what this engine writes for 600 converted songs (the
// busiest 10 s of each; correlation 0.94, and one song in twenty writes over half as much
// again as its estimate); the one write per gated clock is counted from the engine.
const WRITES = {
  note: { fm: 7.8, opll: 3.3, psg: 4.6, scc: 6.4, rhythm: 4.5 },
  clock: { fm: 0.2, opll: 0.2, psg: 1.25, scc: 1.25, rhythm: 0 }, lfoFm: 0.5, lfoMelodic: 0.6, envelope: 0.1, gated: 1,
};
// Vibrato (and pitch fall) steps a second, all parts together: a part steps every so many
// clocks as the fastest M it sets.
const vibratoSteps = (tracks, clockRate) => tracks.reduce((sum, tr) => {
  const rates = tr.tokens.filter((t) => /^M\d+,\d+,-?[1-9]/.test(t)).map((t) => +t.split(',')[1]);
  return sum + (rates.length ? clockRate / Math.min(...rates) : 0);
}, 0);
const writesPerSecond = (tracks, clockRate) => tracks.map((tr) => partLoad(tr, clockRate)).reduce((sum, p) => {
  const melodic = p.kind === 'psg' || p.kind === 'scc';
  return sum + p.notes * WRITES.note[p.kind] + p.gated * WRITES.gated
    + clockRate * (WRITES.clock[p.kind] + (p.lfo ? (melodic ? WRITES.lfoMelodic : WRITES.lfoFm) : 0) + (p.env ? WRITES.envelope : 0));
}, 0);

// The parsed file m as a MUC with one clock for div steps: { text, title, report }, or null when
// the timer cannot count a clock that long at the song's slowest tempo.
function convertAt(m, fileName, div, vibratoStep = 1) {
  nodeIds = new WeakMap(); nextId = 1;
  const skipped = new Map(), counts = new Map(), warnings = new Set();
  const tempos = [];
  const report = {
    skip: (name) => skipped.set(name, (skipped.get(name) || 0) + 1),
    count: (name) => counts.set(name, (counts.get(name) || 0) + 1),
    warn: (name) => warnings.add(name),
    // written in the file, as MGSDRV plays it, as the MUC plays it
    tempo: (bpm, n) => tempos.push({ bpm, driver: 14400 / framesPerWhole(bpm), actual: (1.25 * div) / (n * TIMER_UNIT) }),
  };

  const tempo = m.tempo || 75;
  const active = Object.keys(m.tracks).map(Number).filter((t) => hasNotes(m.tracks[t]) || hasTempo(m.tracks[t]));
  if (!active.length) throw new Error('The MGS file has no notes.');

  // ---- what the tracks share: waves, envelopes, voices (a number defined twice: the later
  // definition is the one in force)
  const maps = new Map((m.voice?.maps || []).map((x) => [x.from, x.to]));
  const romOf = (n) => (maps.has(n) ? maps.get(n) : n >= 15 ? 0 : n + 1);     // 0: the song's own voice
  const userPatch = new Map((m.voice?.opll || []).map((v) => [v.num, v.data]));
  const envelopes = new Map((m.voice?.env || []).map((e) => [e.num, e]));

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


  // the clock, at the song's fastest tempo; the timer has to reach its slowest
  const tempi = [tempo, ...[...partOf.keys()].flatMap((t) => m.tracks[t].cmds.filter((c) => c[0] === 't').map((c) => c[1]))];
  if (div > 1 && timerExact(Math.min(...tempi), div) > 255) return null;
  const clockRate = (192 * 60) / framesPerWhole(Math.max(...tempi)) / div;
  const n0 = timerFor(tempo, div);
  report.tempo(tempo, n0);
  const ticksPerFrame = 1 / 60 / (n0 * TIMER_UNIT);      // MUCOM88 clocks in a frame, at the song's tempo
  const fits = new Map(), voiceIds = new Map(), voices = [];
  // An envelope given to a voice (@e on an FM track) stays with that voice number, for every
  // track. A number that is only ever given one envelope has it from the start.
  const given = new Map();
  for (const t of active) {
    if (kindOf(m, t) !== 'fm') continue;
    let cur = 0;
    for (const c of m.tracks[t].cmds) {
      if (c[0] === '@') cur = c[1];
      else if (c[0] === '@e') given.set(cur, (given.get(cur) || new Set()).add(c[1]));
    }
  }
  const voiceEnvelopes = new Map([...given].filter(([, set]) => set.size === 1).map(([n, set]) => [n, [...set][0]]));
  const song = {
    report,
    waves: new Map((m.voice?.scc || []).map((w) => [w.num, w.data])),
    vref: 13,
    div, clock: 192 / div,
    lengths: { all: 0, rounded: 0 },   // notes written, and those whose length is not whole clocks
    ticksPerFrame,
    vibratoStep,                       // a vibrato or a pitch fall moves no oftener than every so many clocks
    lfoMode: m.lfoMode,
    period: 254, octave: 4,            // the track's usual note: its PSG period and octave
    voiceEnvelopes,
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
    // The MUC voice of OPLL patch n: with sustain on or off, with the software envelope fenv
    // on it and the user voice registers ymod ("reg:value,...") written over it.
    voice(n, sus, counting, kind, fenv = -1, ymod = '') {
      if (!counting) return `@?${n}:${sus}:${fenv}:${ymod}`;
      const env = fenv >= 0 ? envelopes.get(fenv) : null;
      let levels = null;
      if (env) {
        const inner = env.type === 'e' ? envelopeVoice(env) : null;     // a voice the envelope itself chooses
        if (inner !== null && (romOf(inner) || userPatch.has(inner))) { n = inner; ymod = ''; }
        levels = env.type === 'e' ? envelopeLevels(env, 90).levels : rateEnvelopeLevels(env, 90);
        if (levels.every((l) => l === levels[0]) && levels[0] >= 15) levels = null;
      }
      let rom = romOf(n);
      let data = rom ? OPLL_ROM[rom - 1] : userPatch.get(n);
      if (!data) { data = [0, 0, 0, 0, 0, 0, 0, 0]; report.warn('voiceNotDefined'); }
      let name = rom ? `OPLL ${rom} ${OPLL_NAMES[rom - 1]}` : `@v${n}`;
      if (ymod && !rom) {
        data = [...data];
        for (const e of ymod.split(',')) { const [r, v] = e.split(':').map(Number); data[r] = v; }
        name += ' with y';
      }
      const key = `${data.join(',')}:${sus}:${kind}:${levels ? levels.map((l) => Math.round(l)).join('') : ''}`;
      if (!voiceIds.has(key)) {
        voiceIds.set(key, voices.length);
        voices.push({ data, sus, rom, levels, opll: kind === 'opll', name: name + (levels ? ` with envelope ${fenv}` : '') });
      }
      return `@${voiceIds.get(key)}`;
    },
  };

  const parts = [], body = [], tracks = [];
  let firstRow = true;
  for (const t of [...partOf.keys()].sort((a, b) => a - b)) {
    const { part, kind } = partOf.get(t), cmds = m.tracks[t].cmds;
    song.vref = kind === 'psg' || kind === 'scc' ? usualVolume(cmds) : 13;
    [song.period, song.octave] = usualNote(cmds);
    const { tokens, notes, clocks, gated } = convertTrack(cmds, kind, m, song);
    if (m.tracks[t].unknown !== null) report.warn('unknownCommand');
    const first = [`C${song.clock}`];
    if (firstRow) first.push(`t${256 - n0}`);
    firstRow = false;
    if (kind === 'fm' || kind === 'opll') {
      // a note before the first @ plays the first voice
      const firstNote = cmds.findIndex((c) => c[0] === 'note' && c[1] < 12), firstVoice = cmds.findIndex((c) => c[0] === '@');
      if (firstNote >= 0 && (firstVoice < 0 || firstNote < firstVoice)) first.push(song.voice(0, 0, true, kind, kind === 'fm' ? voiceEnvelopes.get(0) ?? -1 : -1));
      first.push(`v${(kind === 'opll' ? OPLL_VOLUME : FM_VOLUME)[0]}`);
    } else if (kind === 'psg' || kind === 'scc') first.push('E255,0,0,0,0,255 v0');
    else first.push(`v${RHYTHM_TOTAL},0,0,0,0,0,0`);
    tracks.push({ part, kind, first: first.join(' '), tokens, notes, clocks, gated });
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
  lines.push('', '; An arrangement of the MGSDRV song for the OPNA: PSG on the SSG, MSX-MUSIC voices as OPNA', '; voices, its rhythm on the OPNA rhythm, the SCC as it is. Voices and envelopes are approximations.');
  const load = writesPerSecond(tracks, clockRate), vibrato = vibratoSteps(tracks, clockRate);
  if (vibratoStep === 1 && vibrato > MOST_VIBRATO) return convertAt(m, fileName, div, 2);
  if (div > 1) {
    lines.push(`; Clock: C${song.clock}, one clock for ${div} MGS steps (${Math.round(clockRate)} a second at the fastest tempo), so that`,
      '; MUCPLAY and MUBPLAY keep time on a 3.58 MHz Z80. Lengths that are not whole clocks are rounded in place.');
  }
  if (vibratoStep > 1) {
    lines.push(`; Vibrato: a step every ${vibratoStep} clocks, not every clock (the parts together would step it over ${MOST_VIBRATO} times a`,
      '; second), so that MUCPLAY and MUBPLAY keep time on a 3.58 MHz Z80. Its width stays, its period as near as that allows.');
  }
  if (load > Z80_WRITES) lines.push('; The song may still be too much for MUCPLAY and MUBPLAY on a 3.58 MHz Z80 (they would fall behind).');
  // what could not be carried over, for whoever edits the song next
  const left = [];
  const leftOut = (...names) => names.reduce((sum, k) => sum + (skipped.get(k) || 0), 0);
  if (leftOut('y')) left.push(`register writes (y) x${leftOut('y')}`);
  if (leftOut('s', 'm')) left.push(`the PSG hardware envelope (s, m) x${leftOut('s', 'm')}`);
  if (leftOut('@e (MSX-MUSIC part)')) left.push(`envelopes on the MSX-MUSIC parts x${leftOut('@e (MSX-MUSIC part)')}`);
  if (leftOut('@ (wave not defined)')) left.push(`an SCC wave without a definition x${leftOut('@ (wave not defined)')}`);
  if (warnings.has('repeatDrifts')) left.push('a repeat whose passes differ (written once)');
  if (warnings.has('fmTracksDropped')) left.push('FM tracks beyond nine');
  if (warnings.has('unknownCommand')) left.push('a command this reader does not know (the track ends there)');
  if (left.length) lines.push(...rows(';', 'Not carried over:', left.map((x, i) => x + (i < left.length - 1 ? ',' : '')).join(' ').split(' ')));
  lines.push('');
  if (voices.length > 256) throw new Error('The MGS file needs more than 256 FM voices as a MUC.');
  voices.forEach((v, id) => {
    const o = v.opll ? opllSelector(v.data, v.rom) : opllToOpna(v.data, !!v.sus, v.levels);
    lines.push(`; ${v.name}${v.sus ? ', sustain on' : ''}${v.opll ? ' (for the MSX-MUSIC parts: it selects the built-in voice)' : ''}`, `  @${id}`, `   ${o.fb},${o.alg}`, ...o.ops.map((op) => `   ${op.join(',')}`));
  });
  if (voices.length) lines.push('');
  for (const [num, data] of [...song.waves].sort((a, b) => a[0] - b[0])) lines.push(`  @W${num}:{ ${data.join(',')} }`);
  if (!song.waves.size && tracks.some((tr) => tr.kind === 'scc')) {
    // MUCPLAY and MUC2MUB on the MSX refuse SCC rows in a song without a wave ("Invalid parameter")
    lines.push('; The MGS defines no SCC wave: a silent one, as the MSX compiler wants a wave in a song with SCC rows.', `  @W0:{ ${new Array(32).fill(0).join(',')} }`);
  }
  if (song.waves.size || tracks.some((tr) => tr.kind === 'scc')) lines.push('');
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
      // the clock: per whole note, MGS steps in one, clocks a second (fastest tempo), the
      // register writes a second the song is estimated to make (heavy: more than a 3.58 MHz
      // Z80 is known to keep up with), the share of the notes whose length is not whole clocks
      clock: { perWhole: song.clock, div, rate: clockRate, load, heavy: load > Z80_WRITES, rounded: song.lengths.rounded / Math.max(1, song.lengths.all) },
      // vibrato steps a second of all parts together, and the clocks between two steps at least
      vibrato: { steps: vibrato, every: vibratoStep },
      tempo: tempos, skipped: Object.fromEntries(skipped), counts: Object.fromEntries(counts), warnings: [...warnings], size,
    },
  };
}

// mgsToMuc(bytes, { fileName, div }) -> { text, title, report }
// Throws an Error with a plain message for a file that is not MGS, is damaged or becomes too long.
// The clock is the finest (one for 1, 2, 3 ... MGS steps) that keeps the song within Z80_WRITES;
// div asks for one clock for that many steps whatever the song costs.
export function mgsToMuc(bytes, { fileName = '', div: only = 0 } = {}) {
  const m = parseMgs(bytes);
  let best = null;
  for (const div of only ? [only] : CLOCK_DIVS) {
    if (best && (best.report.clock.rate * best.report.clock.div) / div < SLOWEST_CLOCK) break;
    let r;
    try { r = convertAt(m, fileName, div); } catch (e) { if (!best) throw e; break; }
    if (!r) break;
    if (best && !only && r.report.clock.rounded > MOST_ROUNDED) continue;
    best = r;
    if (r.report.clock.load <= Z80_WRITES) break;
  }
  return best;
}
