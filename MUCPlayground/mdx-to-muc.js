// MDX (MXDRV, Sharp X68000) to MUC: an arrangement for the OPNA with what MucoMSX adds to it.
//
//   the eight YM2151 tracks  six on the OPNA's FM (A B C H I J), voices carried over; with
//                            more than six, the two a 32-sample wave holds best go to the SCC
//                            (SCCA, SCCB): the voice's steady tone as a wave, its carrier's
//                            envelope as a software envelope. One of them goes to the
//                            MSX-MUSIC instead (MSXA) where that loses less: the voice as the
//                            nearest patch two operators make (?IU). The OPLL has one such
//                            voice for all its channels, MucoMSX compiles a song with ?IU
//                            another way that takes no more than 14,976 bytes of source and
//                            costs the Z80 more: a longer song stays on the SCC, and so does
//                            one that would need a coarser clock for it (unless asked: spare)
//   the ADPCM track(s)       part K, with the PDX file's samples as a PCM bank; with PCM8 the
//                            tracks are laid on one channel, and where their samples overlap
//                            the overlap is mixed beforehand into a sample of its own
//
// An MDX track is the compiled form of MML that MUCOM88 has nearly all of: notes, rests,
// repeats with an exit, an endless loop, tempo, volume, gate, ties, detune, a vibrato. So a
// track is written out command by command. What needs care:
//   - the clock. MXDRV ticks 60 to 130 times a second, more than MUCPLAY plays in time on a
//     3.58 MHz Z80 with nine parts. A song estimated above the limit (see mgs-to-muc.js) gets
//     one clock for 2 (or 3, 4) ticks. Places, not lengths, are rounded, so parts stay together.
//     MDX songs draw envelopes and slides by hand, as runs of one-tick notes tied together:
//     of those the ones that fall on the same clock leave only their last setting;
//   - a repeat is kept when every pass comes out the same and written out when not (an odd
//     length under a clock of two ticks, a gate set in its second half);
//   - a tie is written after the note, a key-on delay as a rest, the gate as MUCOM88's q
//     (clocks cut from the end), a slide as { } when it reaches another note.
// Not carried over (counted in the report, and said in comment lines at the top of the MUC):
// the YM2151's own LFO (MH) and the level LFO (MA), register writes (y), noise, the fade,
// DT2, waiting for another track (S, W), and the pan of a track that went to the SCC.
//
// mdxToMuc(bytes, { fileName, pdx, div }) -> { text, title, report, pcm }
//   pdx: the bytes of the PDX file the song names (report.pdx tells the name), when there are
//   pcm: { name, bytes } - the PCM bank the MUC's #pcm line names, or null

import { parseMdx, parsePdx, decodeOki } from './mdx-file.js';
import { opmToOpna, sccWave, opllPatch, carrierLevels, VOLUME_TL, volumeOf, usesDt2 } from './mdx-voices.js';
import { fitEnvelope, envelopeText } from './mgs-voices.js';
import {
  TIMER_UNIT, SLOWEST_CLOCK, lengthText, pieces, rows, decodeTitle, writesPerSecond,
} from './mgs-to-muc.js';
import { encodeAdpcm, writePcmBank, writeWav, resample, noteRate, RAM_SIZE, SLOTS } from './pcm-bank.js';
import { nearestDrum, DRUM_NAMES } from './mdx-drums.js';

const NOTE = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];
const OPNA_FM = ['A', 'B', 'C', 'H', 'I', 'J'], SCC = ['SCCA', 'SCCB'], OPLL = ['MSXA', 'MSXB'];
const USER_VOICES = 16;                        // ?IU0 to ?IU15
// A MUC with ?IU is compiled by MucoMSX's other way for the MSX parts, which takes a source of
// 14,976 bytes at most (found by lengthening one; its guide says about 14,900).
const PLAIN_ROWS_SOURCE = 14800;
// ... and costs the Z80 more: with MUCPLAY on the emulated MSX, of four such songs at 118
// clocks a second two fell behind; of a larger set, the four at 106 to 109 fell behind and the
// thirteen up to 98 kept time. A song with ?IU gets no more clocks a second than this.
const PLAIN_ROWS_CLOCK = 100;
// ... and its SCC and MSX-MUSIC rows together compile to one object of 4,096 bytes at most.
// Its size is estimated from the rows (fitted to the engine's sizes for 170 songs, within 13%):
// a note or an octave mark about a byte, a rest 1.2, a tie 7, v 6, q 4.5, D 5.6, M 8.6, MF 3.3,
// ?IU 6.4, a repeat 6, its / 16, a wave 45, 160 for the rest. Above PLAIN_ROWS_OBJECT the SCC
// takes the track (the largest that compiled was 2,656, the smallest that did not 4,522).
const PLAIN_ROWS_OBJECT = 3500;
function plainRowsObject(lines, waves) {
  let n = 160 + 45 * waves;
  for (const l of lines) {
    if (!/^(SCC[A-E]|MSX[A-J]) /.test(l)) continue;
    for (const m of l.slice(l.indexOf(' ') + 1).matchAll(/\?IU\d+|MF\d|M-?\d[-\d,]*|E[\d,]+|D-?\d+|@\d+|[vql][%\d.]+|o\d|[a-g][+-]?[%\d.]*|r[%\d.]*|[[\]/L&<>]/g)) {
      const s = m[0], c = s[0];
      n += s.startsWith('?IU') ? 6.4 : s.startsWith('MF') ? 3.3 : c === 'M' ? 8.6 : c === 'D' ? 5.6 : c === 'v' ? 6 : c === 'q' ? 4.5
        : c === '&' ? 7 : c === '[' || c === ']' ? 3 : c === '/' ? 16 : c === 'r' ? 1.2 + (s.length > 1 ? 0.4 : 0)
        : /[a-g]/.test(c) ? 1 + (/[%\d]/.test(s) ? 0.4 : 0) : c === 'o' || c === '<' || c === '>' ? 1 : 0;
    }
  }
  return Math.round(n);
}
const DIVS = [1, 2, 3, 4];
// ADPCM samples that sound like one of the OPNA's rhythm drums (mdx-drums.js) can be played by
// its rhythm part G instead of part K: they take no room in the PCM bank and sound together
// with each other and with the ADPCM. A sample goes there when its likeness is DRUM_LIKE or
// more (of the 1,050 samples of 88 PDX files 244 are; the six drums are 0.68 at most among
// themselves). Levels, measured with the engine: part K plays a sample's loudest 5 ms at
// K_PEAK of what the sample holds; a drum's loudest 5 ms at rhythm total 63, level 31 is
// RHYTHM_PEAK, and each step of either is 0.75 dB. The part is written at RHYTHM_TOTAL with
// one level a drum for the song: that of most of its hits.
const DRUM_LIKE = 0.85, K_PEAK = 0.35, RHYTHM_TOTAL = 55;
const RHYTHM_PEAK = [0.56, 0.349, 0.267, 0.302, 0.399, 0.335];
// a track's items without some commands (repeats keep their shape)
const without = (items, drop) => items.flatMap((x) => (!Array.isArray(x)
  ? [{ ...x, body: without(x.body, drop), exit: x.exit === null ? null : without(x.body.slice(0, x.exit), drop).length }] : drop(x) ? [] : [x]));
const TEMPO_PARTS = ['D', 'E', 'F'];            // SSG parts that carry the tempo commands of tracks without a part
// The estimate (see convertAt) the clock is chosen by. Of the seventeen songs run with MUCPLAY on
// the emulated MSX at one clock a tick, the fourteen estimated up to 860 kept time and the two
// that fell behind are estimated at 1480 and 1560 (and write about 1950 registers a second).
const MDX_WRITES = 1100;
const DEFAULT_TEMPO = 200;                     // MXDRV's timer B before a song sets one
const tickSeconds = (tempo) => (1024 * (256 - tempo)) / 4000000;
const PAN = [0, 2, 1, 3];                      // MXDRV 1 left, 2 right; MUCOM88 1 right, 2 left
// Pitch in MUCOM88's units, which D and M share: an F-number step on FM (the F-number of the
// part's usual note, a semitone being ln 2 / 12 of it), 1/2268 of the period on the SCC.
const fnumOf = (semi) => 618 * 2 ** ((((semi % 12) + 12) % 12) / 12);
const SCC_PER_SEMITONE = (2268 * Math.LN2) / 12;
// ... and on an MSX-MUSIC part half a step of the OPLL's F-number (345 at c, as measured)
const opllSemitone = (semi) => (690 * 2 ** ((((semi % 12) + 12) % 12) / 12) * Math.LN2) / 12;
const PCM_RATES = [3906.25, 5208.33, 7812.5, 10416.67, 15625];
const PCM8_GAIN = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80].map((x) => x / 16);
// Levels, set against MXDRV (MDPlayer4Mac's port) on eight songs, each group of tracks played
// alone: part K's volume for a sample at its own level (K's volume is linear, and 255 is not
// louder but silent), and the dB an SCC part is raised over what its voice's level works out at.
const PCM_VOLUME = 106, PCM_LOUDEST = 250, SCC_TRIM = 5, OPLL_TRIM = 12;     // OPLL: as the SCC; it has no more to give above its v15

// ---- a track ------------------------------------------------------------------------------------

const lengthOf = (items) => items.reduce((s, x) => s + (Array.isArray(x) ? (x[0] === 'r' ? x[1] : x[0] === 'n' ? x[2] : 0)
  : x.count * lengthOf(x.body) - (x.exit === null ? 0 : lengthOf(x.body.slice(x.exit)))), 0);
const hasNotes = (items) => items.some((x) => (Array.isArray(x) ? x[0] === 'n' : hasNotes(x.body)));
// every command of a track once, repeats entered once
function* walk(items) { for (const x of items) { if (Array.isArray(x)) yield x; else yield* walk(x.body); } }
// ... and as often as it plays, with the ticks it takes
function* play(items, times = 1) {
  for (const x of items) {
    if (Array.isArray(x)) yield [x, times];
    else if (x.exit === null) yield* play(x.body, times * x.count);
    else { yield* play(x.body.slice(0, x.exit), times * x.count); yield* play(x.body.slice(x.exit), times * (x.count - 1)); }
  }
}

// The tokens of one track: strings, and for notes and rests objects the text is made of last.
//   kind 'fm' | 'scc' | 'opll' | 'pcm'; ctx: what the song's tracks share (see convertAt)
function convertTrack(track, kind, ctx) {
  const d = ctx.div, half = d >> 1;
  // S: everything that decides what comes out. A repeat is kept when a pass that starts from
  // the state the pass before left gives the same tokens.
  const fresh = () => ({
    vol: 8, stac: 8, kd: 0, porta: 0, tie: false, tiedIn: false, voice: null, lfoDelay: 0, rate: 4, shift: 0,
    lfo: null, lfoOn: false, lfoEvery: 1,      // the vibrato set (wave, period, depth), whether it runs, clocks a step
    ph: 0, debt: 0, q: null, shown: null, slot: null,
    off: false,                                // pan 0: the track's output is off, its notes are rests
  });
  const semitone = kind === 'scc' ? SCC_PER_SEMITONE : kind === 'opll' ? opllSemitone(ctx.usual) : (fnumOf(ctx.usual) * Math.LN2) / 12;
  // With an MSX-MUSIC part that has a voice of its own (?IU) MucoMSX compiles the SCC and
  // MSX-MUSIC rows another way: no slides there, and repeats two deep at most.
  const plain = ctx.plainRows && (kind === 'scc' || kind === 'opll');
  const whole = (v) => (v === 0 ? 0 : Math.abs(v) < 1 ? Math.sign(v) : Math.round(v));

  // n ticks from here in clocks. The place is rounded, so a run of lengths adds up to its sum;
  // a note that sounds on its own takes one clock at least, and the next lengths give it back.
  const clocks = (S, n, least) => {
    const raw = Math.floor((S.ph + n + half) / d) - Math.floor((S.ph + half) / d);
    S.ph += n;
    const have = raw - S.debt;
    if (have >= least) { S.debt = 0; return have; }
    S.debt = least - have;
    return least;
  };
  const volumeToken = (S) => {
    const att = S.vol < 16 ? VOLUME_TL[S.vol] : S.vol - 128;
    if (kind === 'fm') return `v${S.vol < 16 ? S.vol : volumeOf(att)}`;
    if (kind === 'opll') {                                          // the OPLL's own volume: 3 dB steps, 15 the loudest
      const p = ctx.patch(S.voice);
      return `v${15 - Math.max(0, Math.min(15, Math.round(((att - 2) * 0.75 - (p ? Math.min(0, p.level) : 0) - OPLL_TRIM) / 3)))}`;
    }
    if (kind === 'pcm') return `v${Math.max(1, Math.min(PCM_LOUDEST, Math.round(PCM_VOLUME * (ctx.pcm8 ? PCM8_GAIN[pcmVolume(att)] : 1))))}`;
    const w = ctx.wave(S.voice);                                    // SCC: a linear level 0-15
    const db = (att - 2) * 0.75 - (w ? Math.min(0, w.level) : 0) - ctx.sccTrim;
    return `v${Math.max(1, Math.min(15, Math.round(15 * 10 ** (-db / 20))))}`;
  };
  const vibrato = (S) => {
    const [wave, period, depth] = S.lfo;
    if (!period || !depth) { S.lfoOn = false; return 'MF0'; }
    // one way in `ticks`, at `slope` (1/16384 semitones a tick): the triangle as it is, the saw
    // and the square as the triangle of their period and width
    const [ticks, slope] = wave === 2 ? [period, depth] : wave === 0 ? [period / 2, 2 * depth] : [period, (2 * depth) / period];
    const perClock = (slope * d * semitone) / 16384;
    const rate = Math.max(ctx.vibratoStep, Math.abs(perClock) >= 1 ? 1 : Math.min(255, Math.round(1 / Math.abs(perClock))));
    const count = Math.min(255, Math.max(1, Math.round(ticks / d / rate)));
    S.lfoOn = true; S.lfoEvery = rate;
    return `M${Math.min(255, Math.round(S.lfoDelay / d))},${rate},${whole(perClock * rate)},${count}`;
  };

  // items[from, to) played from state S: { out, tally }
  const emitList = (items, from, to, S, depth = 0) => {
    const out = [], tally = { notes: 0, clocks: 0, gated: 0, lfo: 0 };
    const last = () => out[out.length - 1];
    const untie = () => { if (last() === '&') out.pop(); };
    const rest = (n) => {
      const c = clocks(S, n, 0);
      tally.clocks += c;
      if (!c) return;
      untie();
      const l = last();
      if (l && l.rest && l.len + c <= 255) l.len += c; else for (const p of pieces(c, ctx.clock)) out.push({ rest: true, len: p });
    };
    const note = (n, ticks) => {
      if (S.off) { S.tie = false; S.tiedIn = false; S.porta = 0; rest(ticks); return; }
      const tiedIn = S.tiedIn, tieOut = S.tie;
      S.tie = false; S.tiedIn = tieOut;
      let delay = !tiedIn && S.kd ? Math.min(S.kd, ticks) : 0;
      if (kind === 'pcm' || kind === 'rhythm') delay = 0;
      if (delay) { rest(delay); ticks -= delay; }
      if (ticks <= 0) { S.porta = 0; return; }
      const c = clocks(S, ticks, tiedIn || tieOut ? 0 : 1);
      tally.clocks += c;
      const porta = S.porta; S.porta = 0;
      if (!c) return;                                              // a tied fragment that falls on the clock before
      if (kind === 'rhythm') {
        // a drum of the OPNA's: the mask of the drums that are hit, and c for as long as the note
        const mask = ctx.drum(n, S.rate), ps = pieces(c, ctx.clock);
        if (!mask) { for (const p of ps) { const l = last(); if (l && l.rest && l.len + p <= 255) l.len += p; else out.push({ rest: true, len: p }); } return; }
        if (S.slot !== mask) { out.push(`@${mask}`); S.slot = mask; }
        tally.notes++;
        out.push({ hit: true, len: ps[0] });
        for (const p of ps.slice(1)) out.push({ rest: true, len: p });
        return;
      }
      if (kind === 'pcm') {
        const s = ctx.sample(n, S.rate);
        if (!s) { for (const p of pieces(c, ctx.clock)) { const l = last(); if (l && l.rest && l.len + p <= 255) l.len += p; else out.push({ rest: true, len: p }); } return; }
        if (S.slot !== s.slot) { out.push(`@${s.slot}`); S.slot = s.slot; }
        tally.notes++;
        // MXDRV stops the sample at the key off, as part K does at the end of its note: the
        // note is as long as the gate leaves it, and no longer than the sample
        const gate = S.stac <= 8 ? Math.floor((S.stac * ticks) / 8) : ticks - (256 - S.stac);
        const sounding = Math.max(1, Math.min(c, Math.round(Math.max(1, gate) / d), Math.ceil(s.seconds / ctx.clockSeconds)));
        pieces(sounding, ctx.clock).forEach((p, i, a) => { out.push({ semi: s.note, len: p }); if (i < a.length - 1) out.push('&'); });
        if (c > sounding) for (const p of pieces(c - sounding, ctx.clock)) out.push({ rest: true, len: p });
        return;
      }
      let semi = n + 3 + S.shift + (kind === 'fm' || kind === 'opll' ? 12 : 0);    // 0 is o0 d+; MUCOM88's FM octaves are one lower
      if (kind === 'scc') semi -= 12 * (ctx.wave(S.voice)?.down || 0);
      // the gate: the note sounds stac/8 of its length, or all but 256 - stac ticks
      const on = S.stac <= 8 ? Math.floor((S.stac * ticks) / 8) : ticks - (256 - S.stac);
      const cut = tieOut ? 0 : Math.min(c - 1, Math.max(0, Math.round((ticks - Math.max(1, on)) / d)));
      if (cut !== S.q) { out.push(`q${cut}`); S.q = cut; }
      if (kind === 'fm' || kind === 'opll') tally.gated += Math.min(c, cut);
      if (S.lfoOn) tally.lfo += Math.max(0, c - (tiedIn ? 0 : Math.round(S.lfoDelay / d))) / S.lfoEvery;
      const l = last();
      if (tiedIn && l === '&' && out[out.length - 2]?.semi === semi && !out[out.length - 2].to && !porta && out[out.length - 2].len + c <= 255) {
        out.pop(); out[out.length - 1].len += c;                   // the same note tied on: one note
      } else {
        if (!tiedIn) tally.notes++;
        let to = porta ? semi + Math.round((porta * ticks) / 16384) : semi;
        if (to !== semi && plain) { ctx.skip('slides (SCC and MSX-MUSIC parts)'); to = semi; }
        if (to !== semi && c <= 255 && Math.abs(to - semi) <= 24) { out.push({ semi, to, len: c }); tally.lfo += c; }   // a slide moves on every clock
        else pieces(c, ctx.clock).forEach((p, i, a) => { out.push({ semi, len: p }); if (i < a.length - 1) out.push('&'); });
      }
      if (tieOut) out.push('&');
    };
    const command = (x) => {
      const skip = (name) => { ctx.skip(name); };
      // the rhythm part and a silent part take the notes and rests only (and the ADPCM's rate)
      if (kind === 'rhythm' && x[0] === 'F') { S.rate = Math.min(4, x[1]); return; }
      if ((kind === 'rhythm' || kind === 'silent') && !['r', 'n', 't', 'p'].includes(x[0])) return;
      if (kind === 'rhythm' && x[0] === 'p') { S.off = (x[1] & 3) === 0; return; }
      switch (x[0]) {
        case 'r': rest(x[1]); break;
        case 'n': note(x[1], x[2]); break;
        case 't': out.push(`t${256 - ctx.timer(x[1])}`); break;
        case '@':
          if (kind === 'pcm') break;
          if (!ctx.voices.has(x[1])) { skip('@ (voice not defined)'); break; }
          S.voice = x[1];
          if (kind === 'fm') out.push(`@${ctx.voiceId(x[1])}`);
          else if (kind === 'opll') { const u = ctx.patch(x[1]); out.push(`?IU${u.id}`); const v = volumeToken(S); out.push(v); S.shown = v; }
          else { const w = ctx.wave(x[1]); out.push(`@${w.id}`, w.envelope); const v = volumeToken(S); out.push(v); S.shown = v; }
          break;
        case 'v': case '(': case ')': {
          const mode = S.vol < 16;
          if (x[0] === 'v') S.vol = x[1];
          else if (x[0] === ')') S.vol = mode ? Math.min(15, S.vol + 1) : Math.max(128, S.vol - 1);
          else S.vol = mode ? Math.max(0, S.vol - 1) : Math.min(255, S.vol + 1);
          if (kind === 'pcm' && !ctx.pcm8) break;                  // without PCM8 the ADPCM has one level
          if ((kind === 'scc' || kind === 'opll') && S.voice === null) break;
          const v = volumeToken(S);
          if (x[0] !== 'v' && kind === 'fm' && mode) out.push(x[0]);
          else if (v !== S.shown || x[0] === 'v') out.push(v);
          S.shown = v;
          break;
        }
        case 'q': S.stac = x[1]; break;
        case 'k': S.kd = x[1]; break;
        case '&': S.tie = true; break;
        case '_': S.porta = x[1]; break;
        case 'D':
          // MUCOM88's D is so many F-number steps whatever the note: whole semitones move the
          // notes, and D takes what is left (half a semitone at most)
          if (kind === 'pcm') break;
          S.shift = Math.round(x[1] / 64);
          out.push(`D${Math.round(((x[1] - 64 * S.shift) / 64) * semitone)}`);
          break;
        case 'p':
          // pan 0 is no output at all (MUCOM88's p has no such value): the notes become rests
          S.off = (x[1] & 3) === 0;
          if (S.off) { untie(); break; }
          if (kind === 'scc' || kind === 'opll') skip('pan (SCC and MSX-MUSIC parts)'); else out.push(`p${PAN[x[1] & 3]}`);
          break;
        case 'F': if (kind === 'pcm') S.rate = Math.min(4, x[1]); else if (x[1]) skip('noise'); break;
        case 'MD': S.lfoDelay = x[1]; if (kind !== 'pcm' && S.lfo && S.lfoOn) out.push(vibrato(S)); break;   // M carries the delay
        case 'MP': if (kind !== 'pcm') { S.lfo = [x[1], x[2], x[3]]; out.push(vibrato(S)); } break;
        case 'MPON': if (kind !== 'pcm' && S.lfo) out.push(vibrato(S)); break;
        case 'MPOF': if (kind !== 'pcm') { S.lfoOn = false; out.push('MF0'); } break;
        case 'MA': case 'MAON': skip('level LFO (MA)'); break;
        case 'MH': case 'MHON': skip("the YM2151's LFO (MH)"); break;
        case 'MAOF': case 'MHOF': case 'PCM8': break;
        case 'y': skip('register writes (y)'); break;
        case 'S': case 'W': skip('waiting for another track (S, W)'); break;
        case 'fade': skip('fade out'); break;
        default: skip(x[0]);
      }
    };
    const add = (r, times = 1) => { out.push(...r.out); for (const k of Object.keys(tally)) tally[k] += times * r.tally[k]; };
    // A repeat: the passes from the states they really start in. One whose passes come out the
    // same is written as a repeat. Where the first passes differ from the later ones (a voice
    // or a volume set before it is changed in it, a tie into it), all of them are written out;
    // a repeat too long for that (PEEL_FROM commands) has its first passes written out, up to
    // PEELED of them, and the rest is tried again from there (a tie into a repeat is not kept).
    const repeat = (x, peeled) => {
      const end = x.exit ?? x.body.length, unknown = (T) => { T.q = null; return T; };
      const S0 = unknown(structuredClone(S));
      const a = emitList(x.body, 0, x.body.length, S0, depth + 1); // S0 is now the state after one pass
      const S1 = unknown(structuredClone(S0));
      const b = x.count > 1 ? emitList(x.body, 0, x.body.length, S1, depth + 1) : a;
      const same = (p, q) => JSON.stringify(p) === JSON.stringify(q);
      const settled = x.count <= 2 || same({ ...S0, ph: S0.ph % d }, { ...S1, ph: S1.ph % d });
      if (x.count > 1 && same(a.out, b.out) && settled && S0.debt === 0 && !a.out.includes('L') && !(plain && depth >= 2)) {
        untie();
        const T = unknown(structuredClone(S));
        const headPart = emitList(x.body, 0, end, T, depth + 1), mid = structuredClone(T);
        const tailPart = x.exit === null ? null : emitList(x.body, end, x.body.length, T, depth + 1);
        out.push('[', ...headPart.out);
        if (tailPart) out.push('/', ...tailPart.out);
        out.push(`]${x.count}`);
        for (const k of Object.keys(tally)) tally[k] += x.count * headPart.tally[k] + (tailPart ? (x.count - 1) * tailPart.tally[k] : 0);
        // where the repeat leaves: the state of the pass before its exit, the place it stops at
        Object.assign(S, x.exit === null ? T : mid, { q: null });
        S.ph = (x.exit === null ? T.ph : mid.ph) % d;
      } else if (x.count > 2 && peeled < PEELED && x.count * a.out.length > PEEL_FROM) {
        add(emitList(x.body, 0, x.body.length, S, depth));
        repeat({ ...x, count: x.count - 1 }, peeled + 1);
      } else {
        ctx.count('repeatsWrittenOut');
        for (let k = 0; k < x.count; k++) add(emitList(x.body, 0, k === x.count - 1 ? end : x.body.length, S, depth));
      }
    };
    for (let i = from; i < to; i++) {
      const x = items[i];
      if (Array.isArray(x)) command(x); else repeat(x, 0);
    }
    return { out, tally };
  };

  const S = fresh();
  const head = [], lead = track.loop === null ? track.items.length : track.loop;
  if (kind === 'fm') head.push('v8');
  if (kind === 'pcm') head.push(`v${PCM_VOLUME}`);
  if (kind === 'rhythm') head.push(ctx.drumLevels);
  const a = emitList(track.items, 0, lead, S);
  let tokens = [...head, ...a.out], tally = a.tally;
  if (track.loop !== null) {
    if (tokens[tokens.length - 1] === '&') tokens.pop();
    Object.assign(S, { ph: 0, debt: 0, q: null });                 // the loop counts its clocks from its start
    const b = emitList(track.items, lead, track.items.length, S);
    if (b.out[b.out.length - 1] === '&') b.out.pop();
    tokens.push('L', ...b.out);
    tally = b.tally;                                               // what repeats is what counts
  }
  // MucoMSX's other compiler (the rows of a song with ?IU) takes a tie only with a note after
  // it: one that a rest, a repeat mark, the loop or the end follows (commands in between or
  // not) is left out there.
  if (plain) {
    tokens = tokens.filter((x, i) => {
      if (x !== '&') return true;
      let j = i + 1;
      while (j < tokens.length && typeof tokens[j] === 'string' && !/^[[\]/L&]/.test(tokens[j])) j++;
      return j < tokens.length && typeof tokens[j] !== 'string' && !tokens[j].rest;
    });
  }
  return { tokens: text(tokens, ctx.clock), notes: tally.notes, clocks: tally.clocks, gated: tally.gated, lfo: tally.lfo };
}
const pcmVolume = (att) => (att >= 43 ? 0 : [15, 15, 15, 14, 14, 14, 13, 13, 13, 12, 12, 11, 11, 11, 10, 10, 10, 9, 9, 8, 8, 8, 7, 7, 7, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0][att]);

// Tokens as text: octaves (o, or > and < for one up or down), lengths (a default with l where
// it saves text), slides as {start end}.
function text(tokens, clock) {
  const out = [];
  let oct = null, len = null;
  const octave = (want) => {
    want = Math.min(8, Math.max(1, want));
    if (want === oct) return;
    out.push(oct !== null && want === oct + 1 ? '>' : oct !== null && want === oct - 1 ? '<' : `o${want}`);
    oct = want;
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (typeof t === 'string') { out.push(t); continue; }
    if (t.len !== len && t.to === undefined) {
      let same = 0, seen = 0;
      for (let j = i + 1; j < tokens.length && seen < 6; j++) if (typeof tokens[j] !== 'string') { seen++; if (tokens[j].len === t.len) same++; }
      if (same >= 3) { out.push(`l${lengthText(t.len, clock)}`); len = t.len; }
    }
    const lt = t.len === len && t.to === undefined ? '' : lengthText(t.len, clock);
    if (t.rest) { out.push(`r${lt}`); continue; }
    if (t.hit) { out.push(`c${lt}`); continue; }
    const fl = (s) => Math.floor(s / 12), name = (s) => NOTE[((s % 12) + 12) % 12];
    octave(fl(t.semi));
    if (t.to === undefined) { out.push(name(t.semi) + lt); continue; }
    const a = Math.min(8, Math.max(1, fl(t.semi))), b = Math.min(8, Math.max(1, fl(t.to)));
    const slide = (x, ox, y, oy, len) => `{${name(x)}${(oy > ox ? '>' : '<').repeat(Math.abs(oy - ox))}${name(y)}}${lengthText(len, clock)}`;
    // A slide tied on to its own first note: the compilers of MucoMSX and of the playground's
    // engine each join that note to another one, and the driver leaves the pitch where the
    // slide stopped (see mgs-to-muc.js). Written a clock shorter and with a slide of one clock
    // back, it plays as meant with both.
    const next = tokens[i + 1] === '&' ? tokens[i + 2] : null;
    if (next && typeof next !== 'string' && !next.rest && next.to === undefined && next.semi === t.semi) {
      if (t.len < 2) { out.push(name(t.semi) + lengthText(t.len, clock)); continue; }
      out.push(slide(t.semi, a, t.to, b, t.len - 1), '&', slide(t.to, b, t.semi, a, 1));
      continue;
    }
    out.push(slide(t.semi, a, t.to, b, t.len));
    oct = b;
  }
  return out;
}

// ---- which tracks go where ------------------------------------------------------------------

// What an OPLL voice would lose of an FM track: how far the tone of the nearest patch is
// from the voice's (a patch follows a tone that moves in a note part of the way), DT2, a pan
// to one side. voices: the voices the track uses (the OPLL has room for USER_VOICES).
function opllLoss(m, t) {
  let total = 0, loss = 0, panned = 0, voice = null, pan = 3, lfo = 0, slides = 0, sliding = false;
  const voices = new Set();
  for (const [x, times] of play(m.tracks[t].items)) {
    if (x[0] === '@') voice = x[1];
    else if (x[0] === 'p') pan = x[1];
    else if (x[0] === 'MH' || x[0] === 'MA') lfo = 0.3;
    else if (x[0] === '_') sliding = x[1] !== 0;
    else if (x[0] === 'n') {
      const n = x[2] * times;
      total += n;
      if (pan !== 3) panned += n;
      if (sliding) slides += n;
      sliding = false;
      if (voice !== null && m.voices.has(voice)) { voices.add(voice); const p = opllPatch(m.voices.get(voice)); loss += n * ((1 - p.match * p.match) + 0.5 * p.moves + (p.dt2 ? 0.5 : 0)); }
    }
  }
  total = Math.max(1, total);
  return { loss: loss / total + (0.3 * panned) / total + lfo, slides: slides / total, voices };
}
// What an SCC wave would lose of each FM track, lowest first: the tone its voices have beyond
// fifteen harmonics and how far it moves in a note, DT2, a pan to one side, high notes.
function sccOrder(m, tracks, waves) {
  return tracks.map((t) => {
    let total = 0, loss = 0, panned = 0, pitch = 0, voice = null, pan = 3, lfo = 0;
    for (const [x, times] of play(m.tracks[t].items)) {
      if (x[0] === '@') voice = x[1];
      else if (x[0] === 'p') pan = x[1];
      else if (x[0] === 'MH' || x[0] === 'MA') lfo = 0.3;
      else if (x[0] === 'n') {
        const w = waves(voice), n = x[2] * times;
        total += n; pitch += x[1] * n;
        if (pan !== 3) panned += n;
        if (w) loss += n * ((1 - w.kept) + w.moves + (w.dt2 ? 0.5 : 0));
        if (x[1] + 3 < 12) loss += 2 * n;                           // under the SCC's lowest note
      }
    }
    total = Math.max(1, total);
    return { t, loss: loss / total + (0.3 * panned) / total + 0.03 * Math.max(0, (pitch / total + 3) / 12 - 4) + lfo };
  }).sort((a, b) => a.loss - b.loss);
}

// ---- the ADPCM tracks ---------------------------------------------------------------------------

// The lowest note of part K that plays data at `rate` or faster, and the rate it plays at.
function pcmNote(rate) {
  let best = null;
  for (let o = 1; o <= 6; o++) for (let s = 0; s < 12; s++) {
    const r = noteRate(o, s);
    if (r >= rate * 0.999 && (!best || r < best.rate)) best = { semi: o * 12 + s, rate: r };
  }
  return best || { semi: 12, rate: noteRate(1, 0) };
}

// The PCM tracks laid on one: [{ at (ticks), sounds: [{ n, rate, gain, from (seconds) }] }] for
// every hit, with what still sounds from the other tracks then. loopAt, end: ticks (null: no loop).
function mergePcm(m, tracks, seconds, pcmBytes, drumOf = () => null) {
  const hits = [], drums = [];
  let loopAt = null, end = 0;
  for (const t of tracks) {
    const tr = m.tracks[t];
    let at = 0, rate = 4, vol = 8, k = 0;
    const lead = tr.loop === null ? tr.items.length : tr.loop;
    const run = (items) => {
      for (const [x] of play(unroll(items))) {
        if (x[0] === 'r') at += x[1];
        else if (x[0] === 'F') rate = Math.min(4, x[1]);
        else if (x[0] === 'v') vol = x[1];
        else if (x[0] === '(') vol = vol < 16 ? Math.max(0, vol - 1) : Math.min(255, vol + 1);
        else if (x[0] === ')') vol = vol < 16 ? Math.min(15, vol + 1) : Math.max(128, vol - 1);
        else if (x[0] === 'n') {
          const d = drumOf(x[1], rate);
          if (d) drums.push({ at, drum: d.drum });
          else if (pcmBytes[x[1]]) hits.push({ at, track: t, n: x[1], rate, gain: PCM8_GAIN[pcmVolume(vol < 16 ? VOLUME_TL[vol] : vol - 128)], order: k++ });
          at += x[2];
        }
      }
    };
    run(tr.items.slice(0, lead));
    if (tr.loop !== null) { if (loopAt === null || at > loopAt) loopAt = at; run(tr.items.slice(lead)); }
    end = Math.max(end, at);
  }
  hits.sort((a, b) => a.at - b.at || a.track - b.track);
  const duration = (h) => (pcmBytes[h.n].length * 2) / PCM_RATES[h.rate];
  const sounding = new Map(), out = [];
  for (const h of hits) {
    sounding.set(h.track, h);
    const now = seconds(h.at), sounds = [];
    for (const s of sounding.values()) {
      const from = now - seconds(s.at);
      if (from < duration(s) - 0.004) sounds.push({ n: s.n, rate: s.rate, gain: s.gain, from: Math.round(from * 250) / 250 });
    }
    const lastOut = out[out.length - 1];
    if (lastOut && lastOut.at === h.at) lastOut.sounds = sounds; else out.push({ at: h.at, sounds });
  }
  return { hits: out, drums, loopAt, end };
}
// a list of items with every repeat written out (play() then gives each command once per pass)
const unroll = (items) => items.flatMap((x) => {
  if (Array.isArray(x)) return [x];
  const full = unroll(x.body), lastPass = x.exit === null ? full : unroll(x.body.slice(0, x.exit));
  // (not out.push(...full): a long pass is more arguments than a call takes)
  const out = [];
  for (let k = 0; k < x.count; k++) {
    for (const y of k === x.count - 1 ? lastPass : full) out.push(y);
    if (out.length > UNROLLED) throw new Error('The MDX file is too long: its repeats play more than a million commands.');
  }
  return out;
});
const UNROLLED = 1000000;
const PEEL_FROM = 400;                         // commands a repeat is when written out, from which it is peeled instead
const PEELED = 3;                              // passes of a repeat written out before the rest is given up as one

// ---- the song at one clock ----------------------------------------------------------------------

// Rows without the blanks between commands (MUCOM88 needs none: "v10d&v12d"), for a song whose
// MUC would be over 65,536 bytes with them. A ? command keeps its blanks.
function tightRows(part, first, tokens, width = 96) {
  const lines = [];
  let cur = `${part} ${first}`.trimEnd(), open = true;         // open: a blank must come before the next token
  for (const t of tokens) {
    const sep = open || t[0] === '?' ? ' ' : '';
    if (cur.length + sep.length + t.length > width) { lines.push(cur); cur = `${part} ${t}`; } else cur += sep + t;
    open = t[0] === '?';
  }
  lines.push(cur);
  return lines;
}
let keptFor = null, kept = new Map();
function convertAt(m, fileName, pdx, div, spare = 'auto', useDrums = false, tight = 0) {
  // tight 1: no blanks between commands; 2: rows of 240 columns as well
  const layOut = tight ? (part, first, tokens) => tightRows(part, first, tokens, tight > 1 ? 240 : 96) : rows;
  const vibratoStep = 1;
  const skipped = new Map(), counts = new Map(), warnings = new Set(), tempos = [];
  if (m.endless?.length) warnings.add('trackTooLong');
  const fm = [], pcmTracks = [];
  m.tracks.forEach((t, i) => { if (hasNotes(t.items)) (i < 8 ? fm : pcmTracks).push(i); });
  if (!fm.length && !pcmTracks.length) throw new Error('The MDX file has no notes.');
  const pcm8 = m.tracks.some((t) => [...walk(t.items)].some((x) => x[0] === 'PCM8'));

  // tempo: the fastest and slowest tick, and the timer count of a clock of div ticks
  const tempoList = [];
  for (const t of m.tracks) for (const x of walk(t.items)) if (x[0] === 't') tempoList.push(x[1]);
  // the tempo over the song's ticks (once through): every track's tempo commands are the
  // song's. Until the first of them MXDRV plays at its own tempo; of those at tick 0 the last
  // track's is the one that stays.
  const marksOf = (tr) => { const out = []; let at = 0; for (const [x] of play(unroll(tr.items))) { if (x[0] === 'r') at += x[1]; else if (x[0] === 'n') at += x[2]; else if (x[0] === 't') out.push([at, x[1]]); } return out; };
  const marks = m.tracks.flatMap(marksOf);
  marks.sort((a, b) => a[0] - b[0]);
  const atStart = marks.filter(([at]) => at === 0);
  const firstTempo = atStart.length ? atStart[atStart.length - 1][1] : DEFAULT_TEMPO;
  const all = [...tempoList, ...(atStart.length ? [] : [DEFAULT_TEMPO])];
  const exact = (tempo) => (tickSeconds(tempo) * div) / TIMER_UNIT;
  if (div > 1 && exact(Math.min(...all)) > 255) return null;      // the timer cannot count a clock that long
  const timer = (tempo) => {
    const n = Math.min(255, Math.max(1, Math.round(exact(tempo))));
    if (!tempos.some((x) => x.timer === tempo)) tempos.push({ timer: tempo, ticks: 1 / tickSeconds(tempo), actual: div / (n * TIMER_UNIT) });
    return n;
  };
  const clockRate = 1 / tickSeconds(Math.max(...all)) / div, clock = 192 / div;
  const clockSeconds = (timer(firstTempo) * TIMER_UNIT);

  // where the song loops
  const looping = m.tracks.find((t) => t.loop !== null && hasNotes(t.items));
  const timeline = { marks, loopAt: looping ? lengthOf(looping.items.slice(0, looping.loop)) : null, end: Math.max(...m.tracks.map((t) => lengthOf(t.items))) };

  // voices: OPNA voices by first use, SCC waves by first use, OPLL patches by first use
  const voiceIds = new Map(), waves = new Map(), patches = new Map();
  const measured = new Map();
  const measure = (n) => { if (!m.voices.has(n)) return null; if (!measured.has(n)) measured.set(n, sccWave(m.voices.get(n))); return measured.get(n); };
  const ctxBase = {
    div, clock, clockSeconds, vibratoStep, pcm8, voices: m.voices, sccTrim: SCC_TRIM,
    timer, skip: (name) => skipped.set(name, (skipped.get(name) || 0) + 1), count: (name) => counts.set(name, (counts.get(name) || 0) + 1),
    voiceId: (n) => { if (!voiceIds.has(n)) voiceIds.set(n, voiceIds.size); return voiceIds.get(n); },
    patch: (n) => {
      if (n === null || !m.voices.has(n)) return null;
      if (!patches.has(n)) patches.set(n, { ...opllPatch(m.voices.get(n)), id: Math.min(USER_VOICES - 1, patches.size) });
      return patches.get(n);
    },
    wave: (n) => {
      if (n === null || !m.voices.has(n)) return null;
      if (!waves.has(n)) {
        let w = measure(n);
        if (w.down && tooLow.has(n)) w = { ...w, ...w.flat, down: 0 };
        const env = carrierLevels(m.voices.get(n));
        const fit = fitEnvelope(env.levels, 15, Math.floor(60 / clockRate + 0.25));     // the clock in frames, as in mgs-to-muc.js
        waves.set(n, { ...w, id: waves.size, envelope: envelopeText(fit, env.release, clockRate / 60) });
      }
      return waves.get(n);
    },
  };

  // parts: six FM tracks on the OPNA; the rest (two at most), the ones an SCC wave holds best,
  // on the SCC or on the MSX-MUSIC with a voice of its own - whichever loses less. The OPLL has
  // one such voice for all its channels, so one track goes there, or two that play the same voice.
  // spare: 'scc' and 'opll' ask for one of the two whatever is lost.
  const spared = fm.length > 6 ? sccOrder(m, fm, measure).slice(0, Math.min(2, fm.length - 6)) : [];
  let toOpll = [];
  if (spared.length && spare !== 'scc') {
    const o = spared.map((x) => opllLoss(m, x.t)), fits = (i) => o[i].voices.size <= USER_VOICES && o[i].voices.size > 0;
    // with ?IU the SCC rows take no slides either
    const slides = o.reduce((s, x) => s + 0.5 * x.slides, 0);
    const options = [{ opll: [], loss: spared.reduce((s, x) => s + x.loss, 0) }];
    spared.forEach((x, i) => { if (fits(i)) options.push({ opll: [x.t], loss: o[i].loss + spared.reduce((s, y, k) => s + (k === i ? 0 : y.loss), 0) + slides }); });
    if (spared.length === 2 && fits(0) && o[0].voices.size === 1 && [...o[0].voices][0] === [...o[1].voices][0] && o[1].voices.size === 1) options.push({ opll: spared.map((x) => x.t), loss: o[0].loss + o[1].loss + slides });
    const pick = (spare === 'opll' ? options.filter((x) => x.opll.length) : options).sort((a, b) => a.loss - b.loss || b.opll.length - a.opll.length)[0];
    if (pick) toOpll = pick.opll;
  }
  const toScc = spared.map((x) => x.t).filter((t) => !toOpll.includes(t));
  const onOpna = fm.filter((t) => !toScc.includes(t) && !toOpll.includes(t));
  if (onOpna.length > 6) { warnings.add('fmTracksDropped'); onOpna.length = 6; }
  const partOf = new Map();
  onOpna.forEach((t, i) => partOf.set(t, { part: OPNA_FM[i], kind: 'fm' }));
  toScc.sort((a, b) => a - b).forEach((t, i) => partOf.set(t, { part: SCC[i], kind: 'scc' }));
  toOpll.sort((a, b) => a - b).forEach((t, i) => partOf.set(t, { part: OPLL[i], kind: 'opll' }));
  ctxBase.plainRows = toOpll.length > 0;
  // voices whose wave plays an octave down, with notes that would then be under the SCC's o1 c
  const tooLow = new Set();
  for (const t of toScc) { let voice = null, shift = 0; for (const x of walk(m.tracks[t].items)) { if (x[0] === '@') voice = x[1]; else if (x[0] === 'D') shift = Math.round(x[1] / 64); else if (x[0] === 'n' && x[1] + 3 + shift - 12 < 12) tooLow.add(voice); } }

  // the PDX samples as a PCM bank
  let bank = null, pcmInfo = null, sources = [];
  const outside = [], mixUses = new Map();       // samples that are not in the bank (as WAV files); how often each mix is hit
  const bankBase = (fileName.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 8) || 'MDX').toUpperCase();
  const pcmBytes = pdx ? parsePdx(pdx) : null;
  const slots = new Map();                       // key -> { slot, note, seconds, data (Float32Array at the note's rate) }
  // A sample decoded and at a note's rate, and what drum it is like: worked out once for a PDX
  // (a song is converted several times over: for each clock, with and without the drums).
  if (keptFor !== pdx) { keptFor = pdx; kept = new Map(); }
  const audioOf = (n, rate, to) => {
    const key = `${n}:${rate}:${to}`;
    if (!kept.has(key)) kept.set(key, resample(decodeOki(pcmBytes[n]), PCM_RATES[rate], to));
    return kept.get(key);
  };
  // the samples that go to the rhythm part, and the level of each drum there
  const likeDrum = new Map();                    // "n:rate" -> { drum, like, peak } | null
  const drumOf = (n, rate) => {
    if (!useDrums || !pcmBytes?.[n]) return null;
    const key = `${n}:${rate}`;
    if (!likeDrum.has(key)) {
      if (!kept.has(`drum:${key}`)) kept.set(`drum:${key}`, nearestDrum(decodeOki(pcmBytes[n]), PCM_RATES[rate]));
      const r = kept.get(`drum:${key}`);
      likeDrum.set(key, r && r.like >= DRUM_LIKE ? r : null);
    }
    return likeDrum.get(key);
  };
  const drumHits = DRUM_NAMES.map(() => new Map());   // per drum: the level a hit asks for -> how often
  if (useDrums && pcmBytes) for (const t of pcmTracks) {
    let rate = 4, vol = 8;
    for (const [x, times] of play(m.tracks[t].items)) {
      if (x[0] === 'F') rate = Math.min(4, x[1]);
      else if (x[0] === 'v') vol = x[1];
      else if (x[0] === '(') vol = vol < 16 ? Math.max(0, vol - 1) : Math.min(255, vol + 1);
      else if (x[0] === ')') vol = vol < 16 ? Math.min(15, vol + 1) : Math.max(128, vol - 1);
      else if (x[0] === 'n') {
        const d = drumOf(x[1], rate);
        if (!d) continue;
        // what part K would have made of it, against the drum at RHYTHM_TOTAL: steps of 0.75 dB under level 31
        const wanted = K_PEAK * d.peak * (pcm8 ? PCM8_GAIN[pcmVolume(vol < 16 ? VOLUME_TL[vol] : vol - 128)] : 1);
        const steps = Math.round((20 * Math.log10((RHYTHM_PEAK[d.drum] * 10 ** ((-(63 - RHYTHM_TOTAL) * 0.75) / 20)) / wanted)) / 0.75);
        const level = Math.max(0, Math.min(31, 31 - steps));
        drumHits[d.drum].set(level, (drumHits[d.drum].get(level) || 0) + times);
      }
    }
  }
  const drumCount = drumHits.reduce((n, h) => n + [...h.values()].reduce((a, b) => a + b, 0), 0);
  const drumLevels = `v${RHYTHM_TOTAL},${drumHits.map((h) => (h.size ? [...h].sort((a, b) => b[1] - a[1])[0][0] : 0)).join(',')}`;
  const noSlot = new Map();                      // "n:rate" of the samples the bank had no number for
  const single = (n, rate) => {
    if (drumOf(n, rate)) return null;
    const key = `${n}:${rate}`;
    if (!slots.has(key)) {
      if (!pcmBytes?.[n] || slots.size >= SLOTS) { if (pcmBytes?.[n]) { warnings.add('pcmSlots'); noSlot.set(key, { n, rate }); } return null; }
      const note = pcmNote(PCM_RATES[rate]);
      slots.set(key, { slot: slots.size + 1, note: note.semi, seconds: (pcmBytes[n].length * 2) / PCM_RATES[rate], data: audioOf(n, rate, note.rate) });
    }
    return slots.get(key);
  };

  const tracks = [], body = [];
  let first = true;
  const convert = (t, part, kind, extra = {}) => {
    let usual = 9;
    if (kind === 'fm' || kind === 'opll') { const n = new Map(); for (const [x, times] of play(m.tracks[t].items)) if (x[0] === 'n') n.set((x[1] + 3) % 12, (n.get((x[1] + 3) % 12) || 0) + x[2] * times); usual = [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 9; }
    const r = convertTrack(extra.track || m.tracks[t], kind, { ...ctxBase, usual, sample: single, ...extra });
    const startsWithTempo = r.tokens.some((x, i) => /^t\d/.test(x) && !r.tokens.slice(0, i).some((y) => /^[a-gr{]/.test(y)));
    const head = [`C${clock}`];
    if (first && !startsWithTempo) head.push(`t${256 - timer(firstTempo)}`);
    first = false;
    tracks.push({ part, kind: kind === 'pcm' ? 'rhythm' : kind, tokens: r.tokens, notes: r.notes, clocks: r.clocks, gated: r.gated, lfo: r.lfo });
    body.push(...layOut(part, head.join(' '), r.tokens));
  };
  for (const t of [...partOf.keys()].sort((a, b) => a - b)) convert(t, partOf.get(t).part, partOf.get(t).kind);

  if (pcmTracks.length && pcmBytes) {
    const rhythm = (track) => convert(pcmTracks[0], 'G', 'rhythm', { track, drumLevels, drum: (n, rate) => (typeof n === 'object' ? n.mask : drumOf(n, rate) ? 1 << drumOf(n, rate).drum : 0) });
    if (pcmTracks.length === 1) {
      convert(pcmTracks[0], 'K', 'pcm');
      // the same track again for the drums, without its tempo commands (part K has them)
      if (drumCount) {
        const tr = m.tracks[pcmTracks[0]], lead = tr.loop === null ? tr.items.length : tr.loop, tempo = (x) => x[0] === 't';
        rhythm({ items: without(tr.items, tempo), loop: tr.loop === null ? null : without(tr.items.slice(0, lead), tempo).length });
      }
    } else {
      // how long a sample has sounded when the next one starts: by the tempo over the song's ticks
      const seconds = (tick) => { let s = 0, at = 0, tempo = DEFAULT_TEMPO; for (const [k, v] of marks) { if (k >= tick) break; s += (k - at) * tickSeconds(tempo); at = k; tempo = v; } return s + (tick - at) * tickSeconds(tempo); };
      const merged = mergePcm(m, pcmTracks, seconds, pcmBytes, drumOf);
      // a mix for every kind of overlap, the most used first, while the bank has room
      const keyOf = (s) => s.map((x) => `${x.n}:${x.rate}:${x.gain}:${x.from}`).sort().join('|');
      const uses = new Map();
      for (const h of merged.hits) if (h.sounds.length > 1) uses.set(keyOf(h.sounds), (uses.get(keyOf(h.sounds)) || 0) + 1);
      for (const [k, v] of uses) mixUses.set(k, v);
      for (const h of merged.hits) for (const s of h.sounds) if (s.from === 0) single(s.n, s.rate);
      const mixes = new Map();
      // a mix is made while the bank has a number and the room for it (4 bits a sample, 64 KB a number)
      const adpcmBytes = (data) => Math.ceil(data.length / 8) * 4;
      let room = RAM_SIZE - [...slots.values()].reduce((n, s) => n + adpcmBytes(s.data), 0);
      const soundsOf = new Map();
      for (const h of merged.hits) if (h.sounds.length > 1 && !soundsOf.has(keyOf(h.sounds))) soundsOf.set(keyOf(h.sounds), h.sounds);
      for (const [key] of [...uses].sort((a, b) => b[1] - a[1])) {
        if (slots.size + mixes.size >= SLOTS || room < 64) { warnings.add('pcmSlots'); break; }
        const sounds = soundsOf.get(key);
        const note = pcmNote(Math.max(...sounds.map((s) => PCM_RATES[s.rate])));
        // how long it would be, before it is made: one that does not fit is not made
        const ahead = Math.max(0, ...sounds.map((s) => Math.ceil((pcmBytes[s.n].length * 2 * note.rate) / PCM_RATES[s.rate]) - Math.round(s.from * note.rate)));
        if (Math.ceil(ahead / 8) * 4 > room || Math.ceil(ahead / 8) * 4 - 4 > 0xffff) { warnings.add('pcmSlots'); continue; }
        let len = 0;
        const partsOf = sounds.map((s) => { const x = audioOf(s.n, s.rate, note.rate), skip = Math.round(s.from * note.rate); len = Math.max(len, x.length - skip); return [x, skip, s.gain]; });
        const data = new Float32Array(Math.max(0, len));
        for (const [x, skip, gain] of partsOf) for (let i = skip; i < x.length; i++) data[i - skip] += x[i] * gain;
        for (let i = 0; i < data.length; i++) data[i] = Math.max(-1, Math.min(1, data[i]));
        if (adpcmBytes(data) > room || adpcmBytes(data) - 4 > 0xffff) { warnings.add('pcmSlots'); continue; }
        room -= adpcmBytes(data);
        mixes.set(key, { slot: slots.size + mixes.size + 1, note: note.semi, seconds: data.length / note.rate, data });
      }
      for (const [key, v] of mixes) slots.set(`mix:${key}`, v);
      // the one track: every hit a note, the sample (or mix) that is to sound from there
      const items = [];
      let at = 0;
      const upTo = (tick) => { if (tick > at) { items.push(['r', tick - at]); at = tick; } };
      const loopIndex = () => { upTo(merged.loopAt); return items.length; };
      let loop = null;
      merged.hits.forEach((h, i) => {
        if (merged.loopAt !== null && loop === null && h.at >= merged.loopAt) loop = loopIndex();
        upTo(h.at);
        const next = i + 1 < merged.hits.length ? merged.hits[i + 1].at : merged.end;
        const mix = h.sounds.length > 1 ? mixes.get(keyOf(h.sounds)) : null;
        const newest = h.sounds.find((s) => s.from === 0) || h.sounds[0];
        if (h.sounds.length > 1 && !mix) counts.set('pcmOverlapsCut', (counts.get('pcmOverlapsCut') || 0) + 1);
        items.push(['hit', mix || (newest ? single(newest.n, newest.rate) : null), Math.max(1, next - h.at)]);
        at = Math.max(at + 1, next);
      });
      if (merged.loopAt !== null && loop === null) loop = loopIndex();
      upTo(merged.end);
      const track = { items: items.map((x) => (x[0] === 'hit' ? ['n', x[1], x[2]] : x)), loop };
      convert(pcmTracks[0], 'K', 'pcm', { track, pcm8: false, sample: (s) => s });
      pcmInfo = { tracks: pcmTracks.length, mixes: mixes.size };
      // the drums of all the tracks as one: every tick with a hit is a note of the drums hit there
      if (merged.drums.length) {
        const at = new Map();
        for (const d of merged.drums) at.set(d.at, (at.get(d.at) || 0) | (1 << d.drum));
        const ticks = [...at.keys()].sort((a, b) => a - b), gItems = [];
        let pos = 0, gLoop = null;
        const reach = (tick) => { if (tick > pos) { gItems.push(['r', tick - pos]); pos = tick; } };
        ticks.forEach((tick, i) => {
          if (merged.loopAt !== null && gLoop === null && tick >= merged.loopAt) { reach(merged.loopAt); gLoop = gItems.length; }
          reach(tick);
          const next = i + 1 < ticks.length ? ticks[i + 1] : merged.end;
          const len = Math.max(1, (merged.loopAt !== null && gLoop === null ? Math.min(next, merged.loopAt) : next) - tick);
          gItems.push(['n', { mask: at.get(tick) }, len]);
          pos = tick + len;
        });
        if (merged.loopAt !== null && gLoop === null) { reach(merged.loopAt); gLoop = gItems.length; }
        reach(merged.end);
        rhythm({ items: gItems, loop: gLoop });
      }
    }
    const entries = [...slots].map(([key, s]) => ({ n: s.slot, name: `S${s.slot}`, volume: 0, adpcm: encodeAdpcm(s.data), key, s }));
    const bytesOf = (e) => Math.ceil(e.adpcm.length / 4) * 4;
    const size = entries.reduce((n, e) => n + bytesOf(e), 0);
    // More than the bank holds: the song is converted all the same. The samples played most
    // go into the bank while they fit; the others keep their number with a moment of silence,
    // and their audio is handed over as WAV files, to be cut or slowed down and put in by hand.
    const wavOf = (e) => writeWav(e.s.data, noteRate(Math.floor(e.s.note / 12), e.s.note % 12));
    // one number of a bank is 65,536 bytes at most (about eight seconds): a longer sample is left out the same way
    const long = entries.filter((e) => bytesOf(e) - 4 > 0xffff);
    for (const e of long) outside.push({ slot: e.n, bytes: bytesOf(e), long: true, file: `${bankBase}_S${e.n}.WAV`, wav: wavOf(e) });
    if (long.length) warnings.add('pcmTooLong');
    let inBank = entries.filter((e) => !long.includes(e));
    if (size - long.reduce((n, e) => n + bytesOf(e), 0) > RAM_SIZE) {
      warnings.add('pcmTooLarge');
      const used = new Map();
      for (const t of pcmTracks) { let rate = 4; for (const [x, times] of play(m.tracks[t].items)) { if (x[0] === 'F') rate = Math.min(4, x[1]); else if (x[0] === 'n') used.set(`${x[1]}:${rate}`, (used.get(`${x[1]}:${rate}`) || 0) + times); } }
      const useOf = (e) => (e.key.startsWith('mix:') ? mixUses.get(e.key.slice(4)) || 0 : used.get(e.key) || 0);
      let room = RAM_SIZE - 8 * entries.length;
      const fit = [];
      for (const e of [...inBank].sort((a, b) => useOf(b) - useOf(a) || a.n - b.n)) {
        if (bytesOf(e) <= room) { fit.push(e); room -= bytesOf(e) - 8; } else outside.push({ slot: e.n, bytes: bytesOf(e), file: `${bankBase}_S${e.n}.WAV`, wav: wavOf(e) });
      }
      inBank = fit;
    }
    const real = inBank;
    inBank = [...inBank, ...outside.map((l) => ({ n: l.slot, name: `(S${l.slot})`, volume: 0, adpcm: new Uint8Array(8).fill(0x80) }))];
    outside.sort((a, b) => a.slot - b.slot);
    // samples the bank had no number for (it has 32): their audio as it is in the PDX
    for (const { n, rate } of noSlot.values()) outside.push({ slot: null, sample: n, bytes: pcmBytes[n].length, file: `${bankBase}_P${n}.WAV`, wav: writeWav(decodeOki(pcmBytes[n]), PCM_RATES[rate]) });
    bank = inBank.length ? writePcmBank(inBank) : null;
    sources = real.map((e) => ({ adpcm: e.adpcm, samples: e.s.data, rate: noteRate(Math.floor(e.s.note / 12), e.s.note % 12) }));
    pcmInfo = { ...(pcmInfo || { tracks: 1, mixes: 0 }), samples: entries.length, bytes: size, drums: [...likeDrum.values()].filter(Boolean).length, drumHits: drumCount,
      leftOut: outside.filter((l) => l.slot !== null).map((l) => l.slot), noSlot: noSlot.size, room: RAM_SIZE };
  } else if (pcmTracks.length) warnings.add('noPdx');

  // Tempo commands of tracks that are not a part of their own (a track without notes, the
  // ADPCM tracks of a song without its PDX or with several of them laid on part K) are the
  // song's all the same: such a track becomes a silent SSG part, its notes rests, unless
  // every tempo it sets is set at the same tick by a part that is written.
  const own = new Set([...partOf.keys(), ...(pcmTracks.length === 1 && pcmBytes ? pcmTracks : [])]);
  const written = new Set([...own].flatMap((t) => marksOf(m.tracks[t]).map(([at, v]) => `${at}:${v}`)));
  const silent = (items) => items.flatMap((x) => (!Array.isArray(x) ? [{ ...x, body: silent(x.body), exit: x.exit === null ? null : silent(x.body.slice(0, x.exit)).length }]
    : x[0] === 'n' ? [['r', x[2]]] : x[0] === 'r' || x[0] === 't' ? [x] : []));
  const carriers = m.tracks.map((tr, t) => t).filter((t) => !own.has(t) && marksOf(m.tracks[t]).some(([at, v]) => !written.has(`${at}:${v}`) && !(at === 0 && v === firstTempo)));
  carriers.slice(0, TEMPO_PARTS.length).forEach((t, i) => {
    const tr = m.tracks[t], lead = tr.loop === null ? tr.items.length : tr.loop;
    const track = { items: silent(tr.items), loop: tr.loop === null ? null : silent(tr.items.slice(0, lead)).length };
    const r = convertTrack(track, 'silent', { ...ctxBase, usual: 9, sample: single });
    body.push(...layOut(TEMPO_PARTS[i], `C${clock}`, r.tokens));
  });
  if (carriers.length > TEMPO_PARTS.length) warnings.add('tempoTracks');

  // ---- the text
  const title = decodeTitle(m.title, fileName.replace(/\.[^.]*$/, ''));
  const bankName = `${bankBase}.BIN`;
  const lines = [`#title ${title}`, `#comment Converted from ${fileName || 'an MDX file'} (MXDRV) by MUCPlayground`, '#CarrierCorrection Yes'];
  if (bank) lines.push(`#pcm ${bankName}`);
  lines.push('', "; An arrangement of the MXDRV song for the OPNA: six FM tracks with their voices, the ADPCM track's",
    '; samples as a PCM bank for part K. A seventh and eighth FM track are on the SCC, their voice as a wave,',
    '; or on the MSX-MUSIC, their voice as the nearest one its two operators make.');
  if (outside.length) {
    const silent = outside.filter((l) => l.slot !== null), none = outside.filter((l) => l.slot === null);
    if (silent.length) lines.push(`; PCM: the samples take ${Math.round(pcmInfo.bytes / 1024)} KB; a bank holds ${RAM_SIZE >> 10} KB, and 64 KB (about 8 s) under one number. Left out, and silent until they are put in:`,
      `;   ${silent.map((l) => `@${l.slot} (${Math.round(l.bytes / 1024)} KB${l.long ? ', too long' : ''}, ${l.file})`).join(', ')}`);
    if (none.length) lines.push(`; PCM: a bank has ${SLOTS} samples. Without a number, and not played: ${none.map((l) => `PDX sample ${l.sample} (${l.file})`).join(', ')}`);
    lines.push('; Their audio comes with the song as WAV files: make room in the PCM bank (cut or slow down samples) and import them.');
  }
  if (pcmInfo?.drums) lines.push(`; ${pcmInfo.drums} of the ADPCM samples sound like the OPNA's own drums and are played by its rhythm part (G).`);
  // What the song costs: the estimate of mgs-to-muc.js for everything but the vibrato, and
  // for the vibrato what it writes: every step the frequency, on the SCC twice.
  const vibrato = tracks.reduce((s, t) => s + (t.clocks ? (t.lfo / t.clocks) * clockRate : 0), 0);
  const load = writesPerSecond(tracks.map((t) => ({ ...t, tokens: t.tokens.filter((x) => !/^M\d/.test(x)) })), clockRate)
    + tracks.reduce((s, t) => s + (t.clocks ? (t.lfo / t.clocks) * clockRate * (t.kind === 'scc' ? 4 : 2) : 0), 0);
  if (div > 1) lines.push(`; Clock: C${clock}, one clock for ${div} MXDRV ticks (${Math.round(clockRate)} a second at the fastest tempo), so that`,
    '; MUCPLAY and MUBPLAY keep time on a 3.58 MHz Z80. What falls between two clocks is rounded in place.');
  if (vibratoStep > 1) lines.push(`; Vibrato: a step every ${vibratoStep} clocks, not every clock, so that MUCPLAY and MUBPLAY keep time on a 3.58 MHz Z80.`);
  if (load > MDX_WRITES) lines.push('; The song may still be too much for MUCPLAY and MUBPLAY on a 3.58 MHz Z80 (they would fall behind).');
  const left = [...skipped].map(([k, n]) => `${k} x${n}`);
  if ([...voiceIds.keys(), ...waves.keys(), ...patches.keys()].some((n) => usesDt2(m.voices.get(n)))) left.push('DT2 of the voices');
  if (patches.size > USER_VOICES) left.push(`MSX-MUSIC voices beyond ${USER_VOICES}`);
  if (warnings.has('fmTracksDropped')) left.push('FM tracks beyond eight');
  if (warnings.has('noPdx')) left.push(`the ADPCM track (no PDX file${m.pdx ? `: ${m.pdx}` : ''})`);
  if (warnings.has('pcmSlots')) left.push(`samples beyond the ${SLOTS} a PCM bank holds`);
  if (m.endless?.length) left.push(`track${m.endless.length > 1 ? 's' : ''} ${m.endless.map((i) => i + 1).join(', ')} (more than a million commands with the repeats)`);
  if (warnings.has('tempoTracks')) left.push(`tempo commands of more than ${TEMPO_PARTS.length} tracks without a part`);
  if (left.length) lines.push(`; Not carried over: ${left.join(', ')}`);
  lines.push('');
  for (const [n, id] of [...voiceIds].sort((a, b) => a[1] - b[1])) {
    const v = opmToOpna(m.voices.get(n));
    lines.push(`; MXDRV voice ${n}${usesDt2(m.voices.get(n)) ? ' (without its DT2)' : ''}`, `  @${id}`, `   ${v.fb},${v.alg}`, ...v.ops.map((o) => `   ${o.join(',')}`));
  }
  for (const [n, w] of [...waves].sort((a, b) => a[1].id - b[1].id)) {
    lines.push(`; MXDRV voice ${n} as a wave (${Math.round(w.kept * 100)}% of its tone${w.down ? ', an octave down for the operator at half the note' : ''})`, `  @W${w.id}:{ ${w.wave.join(',')} }`);
  }
  // the OPLL patches come before every row (they are global, ?IU0 to ?IU15)
  for (const [n, u] of [...patches].sort((a, b) => a[1].id - b[1].id)) {
    if (u.id === USER_VOICES - 1 && [...patches.values()].filter((x) => x.id === u.id)[0] !== u) continue;
    lines.push(`; MXDRV voice ${n} as an MSX-MUSIC voice (its tone ${Math.round(u.match * 100)}% alike)`, `  ?IU${u.id}={${u.bytes.join(',')}}`);
  }
  lines.push('', ...body, '');
  const out = lines.join('\n');
  const size = new TextEncoder().encode(out).length;
  // too long for a song with a voice of the MSX-MUSIC's own (in Shift-JIS, two bytes at most
  // for what is not ASCII): the SCC takes the track instead
  if (toOpll.length && ([...out].reduce((n, c) => n + (c.charCodeAt(0) < 128 ? 1 : 2), 0) > PLAIN_ROWS_SOURCE
    || plainRowsObject(body, waves.size) > PLAIN_ROWS_OBJECT)) {
    const r = convertAt(m, fileName, pdx, div, 'scc', useDrums, tight);
    if (r) r.report.warnings.push('msxMusicTooLong');
    return r;
  }
  if (size > 65536 && tight < 2) return convertAt(m, fileName, pdx, div, spare, useDrums, tight + 1);
  if (size > 65536) throw new Error(`The MDX file becomes a ${size}-byte MUC (at most 65,536).`);
  return {
    text: out, title,
    pcm: bank ? { name: bankName, bytes: bank, sources, leftOut: outside.map((l) => ({ name: l.file, bytes: l.wav, slot: l.slot })) } : null,
    report: {
      parts: [...[...partOf].map(([track, p]) => ({ track, part: p.part })), ...(tracks.some((t) => t.part === 'K') ? [{ track: 8, part: 'K' }] : [])],
      voices: voiceIds.size, waves: waves.size, patches: Math.min(USER_VOICES, patches.size), pdx: m.pdx, pcm: pcmInfo,
      clock: { perWhole: clock, div, rate: clockRate, load, heavy: load > MDX_WRITES },
      vibrato: { steps: vibrato, every: vibratoStep },
      tempo: tempos, timeline, skipped: Object.fromEntries(skipped), counts: Object.fromEntries(counts), warnings: [...warnings], size,
    },
  };
}

// mdxToMuc(bytes, { fileName, pdx, div, spare, drums }) -> { text, title, report, pcm }
// Throws an Error with a plain message for a file that is not MDX, is packed or becomes too long.
// The clock is the finest (one for 1, 2, 3 or 4 ticks) that keeps the song within what a Z80
// plays in time; div asks for one clock for that many ticks whatever the song costs.
// drums: 'auto' sends the samples that sound like the OPNA's drums to its rhythm part when the
// song gains by it (it has more samples than a PCM bank holds or more than its 256 KB, or
// ADPCM hits that overlap and were cut); 'always' whenever there are such samples; 'never'.
// A song whose samples are more than a PCM bank holds is converted all the same: the result's
// pcm.leftOut are the samples that are not in the bank ({ name, bytes: a WAV file, slot | null }),
// report.pcm.leftOut the numbers that are silent, and warnings has 'pcmTooLarge'.
export function mdxToMuc(bytes, { fileName = '', pdx = null, div: only = 0, spare = 'auto', drums = 'auto' } = {}) {
  const m = parseMdx(bytes);
  // A track whose repeats play more than a million commands (stray data, or a loop made of
  // repeats within repeats) is left out; the others are the song.
  const playedBy = (items, limit) => { let n = 0; for (const x of items) { n += Array.isArray(x) ? 1 : x.count * playedBy(x.body, limit); if (n > limit) return n; } return n; };
  m.endless = [];
  m.tracks = m.tracks.map((tr, i) => { if (playedBy(tr.items, UNROLLED) <= UNROLLED) return tr; m.endless.push(i); return { items: [], loop: null }; });
  const attempt = (useDrums) => {
    let best = null;
    for (const div of only ? [only] : DIVS) {
      if (best && (best.report.clock.rate * best.report.clock.div) / div < SLOWEST_CLOCK) break;
      let r;
      try { r = convertAt(m, fileName, pdx, div, spare, useDrums); } catch (e) { if (!best) throw e; break; }
      if (!r) break;
      const tooFast = (x) => x.report.parts.some((p) => p.part.startsWith('MSX')) && x.report.clock.rate > PLAIN_ROWS_CLOCK;
      // an MSX-MUSIC voice that would need a coarser clock: the SCC takes the track at this one,
      // unless the MSX-MUSIC was asked for
      if (tooFast(r) && spare === 'auto') r = convertAt(m, fileName, pdx, div, 'scc', useDrums);
      best = r;
      if (r.report.clock.load <= MDX_WRITES && !tooFast(r)) break;
    }
    return best;
  };
  if (drums === 'never' || !pdx) return attempt(false);
  if (drums === 'always') return attempt(true);
  const plain = attempt(false), w = plain.report.warnings;
  if (w.includes('pcmTooLarge') || w.includes('pcmTooLong') || w.includes('pcmSlots') || plain.report.counts.pcmOverlapsCut > 0) {
    try { const r = attempt(true); if (r?.report.pcm?.drums) return r; } catch { /* no better with the drums: as without them */ }
  }
  return plain;
}
