// The notes a song's chips play, read from its register writes (a VGM file, or the VGM the
// MUC engine writes from a .mub), for the views that show notes (tracker, keys) when there is
// no MML text to read them from. The writes are replayed once, without sound, through the
// channel view's chip models (chview/*.js), and every 1/60 s each channel's note is read the
// way MDPlayer's channel view reads it: from the frequency registers while the channel is
// keyed on. Key-ons (OPN 0x28, OPM 0x08, OPLL 0x2n) start a new note even at the same pitch;
// rhythm key-ons (OPNA 0x10, OPNB ADPCM-A 0x00, OPLL 0x0E) become hits on drum tracks.
//
// Result: { tracks, tickFrames, total, loopStart, loopLen } where a track is like
// mml-timeline's ({ name, chip, color?, clock, end, events: [{ tick, len, kind, midi }] }),
// a drum track's notes carrying pads (indices into track.pads) and a label instead of a pitch.
// A tick is 1/60 s; frames are 44.1 kHz samples, the VGM's own.

import { VgmReader, PANELS } from './chview/channel-view.js';

const TICK_FRAMES = 735;    // 44100 / 60
const CLOCK = 96;           // ticks per "whole note" for the tracker's Row setting (1.6 s)
const MAX_TICKS = 60 * 60 * 15;

// Which of a chip model's channels carry a pitch, and their names.
const range = (prefix, from, n) => Array.from({ length: n }, (_, i) => [from + i, `${prefix}${i + 1}`]);
const PITCHED = {
  YM2608: [...range('FM', 0, 6), ...range('FX', 6, 3), ...range('SSG', 9, 3), [12, 'ADPCM']],
  YM2610: [...range('FM', 0, 6), ...range('FX', 6, 3), ...range('SSG', 9, 3), [12, 'ADPCMB']],
  YM2203: [...range('FM', 0, 3), ...range('FX', 3, 3), ...range('SSG', 6, 3)],
  YM2612: [...range('FM', 0, 6), ...range('FX', 6, 3)],
  YM2151: range('FM', 0, 8),
  YM2413: range('FM', 0, 9),
  SN76489: range('PSG', 0, 3),
  AY8910: range('PSG', 0, 3),
  K051649: range('SCC', 0, 5),
};
const CHIP_KIND = { FM: 'FM', FX: 'FM', SSG: 'SSG', PSG: 'PSG', SCC: 'SCC', ADPCM: 'ADPCM', ADPCMB: 'ADPCM' };
// Drum pads and the key-on bit of each.
const DRUMS = {
  YM2608: [['BD', 0], ['SD', 1], ['TOP', 2], ['HH', 3], ['TOM', 4], ['RIM', 5]],
  YM2610: [['A1', 0], ['A2', 1], ['A3', 2], ['A4', 3], ['A5', 4], ['A6', 5]],
  YM2413: [['BD', 4], ['SD', 3], ['TOM', 2], ['TOP', 1], ['HH', 0]],   // register 0x0E
  SN76489: [['NOISE', 0]],
};
const SHORT = { YM2608: 'OPNA', YM2610: 'OPNB', YM2203: 'OPN', YM2612: 'OPN2', YM2151: 'OPM', YM2413: 'OPLL', SN76489: 'DCSG', AY8910: 'PSG', K051649: 'SCC' };

export async function chipNotes(vgm) {
  const reader = new VgmReader(vgm);
  const u32 = (o) => (o + 4 <= vgm.length ? reader.v.getUint32(o, true) : 0);
  const total = u32(0x18), loopLen = reader.loop ? u32(0x20) : 0;
  reader.loop = 0;          // one pass: the loop is followed when the position wraps
  const chips = [];
  for (const c of reader.chips) {
    const panel = PANELS[c.type];
    if (!panel || !PITCHED[c.type]) continue;
    try {
      const Cls = (await import(new URL(`./chview/${panel[0].slice(2)}`, import.meta.url)))[panel[1]];
      chips.push({ ...c, model: new Cls(c.clock), keyed: new Set(), hits: 0, opll: 0, chans: new Map(), drum: null });
    } catch { /* no model: not shown */ }
  }
  const twice = new Set(chips.filter((c) => c.id === 1).map((c) => c.type));
  const find = (type, id) => chips.find((c) => c.type === type && c.id === id);
  const emit = (f, type, id, port, addr, data) => {
    const c = find(type, id);
    if (!c) return;
    c.model.write(port, addr, data);
    // key-ons and rhythm hits, which the models only keep as levels
    const opn = type === 'YM2608' || type === 'YM2610' || type === 'YM2203' || type === 'YM2612';
    if (opn && port === 0 && addr === 0x28 && (data & 0xf0)) c.keyed.add((data & 3) + (data & 4 ? 3 : 0));
    else if (type === 'YM2151' && addr === 0x08 && (data & 0x78)) c.keyed.add(data & 7);
    else if (type === 'YM2413' && addr >= 0x20 && addr <= 0x28 && (data & 0x10)) c.keyed.add(addr - 0x20);
    if (type === 'YM2608' && port === 0 && addr === 0x10 && !(data & 0x80)) c.hits |= data & 0x3f;
    else if (type === 'YM2610' && port === 1 && addr === 0x00 && !(data & 0x80)) c.hits |= data & 0x3f;
    else if (type === 'YM2413' && addr === 0x0e) {
      if (data & 0x20) c.hits |= data & ~c.opll & 0x1f;
      c.opll = data & 0x20 ? data & 0x1f : 0;
    } else if (type === 'SN76489' && port === 0 && (data & 0xf0) === 0xf0 && (data & 0x0f) !== 0x0f) c.hits |= 1;
  };

  let tick = 0;
  for (; tick < MAX_TICKS && !reader.ended; tick++) {
    reader.readUntil((tick + 1) * TICK_FRAMES - 1, emit);
    for (const c of chips) {
      c.model.screenChangeParams();
      c.model.updateVol?.();
      const chans = c.model.newParam.channels;
      for (const [index, name] of PITCHED[c.type]) {
        let ch = c.chans.get(index);
        if (!ch) { ch = { name, events: [], cur: null }; c.chans.set(index, ch); }
        const n = chans[index]?.note;
        const midi = Number.isInteger(n) && n >= 0 ? n + 24 : null;
        const fm = c.type === 'YM2203' ? index < 3 : c.type === 'YM2151' || c.type === 'YM2413' || index < 6;
        const again = fm && c.keyed.has(index);
        if (ch.cur && (midi === null || midi !== ch.cur.midi || again)) { ch.cur.len = tick - ch.cur.tick; ch.cur = null; }
        if (midi !== null && !ch.cur) { ch.cur = { tick, len: 1, kind: 'note', midi }; ch.events.push(ch.cur); }
      }
      c.keyed.clear();
      if (c.hits && DRUMS[c.type]) {
        if (!c.drum) c.drum = [];
        const pads = DRUMS[c.type].flatMap(([, bit], i) => (c.hits & (1 << bit) ? [i] : []));
        c.drum.push({ tick, len: 1, kind: 'note', pads });
      }
      c.hits = 0;
    }
  }
  const end = tick;
  const tracks = [];
  for (const c of chips) {
    const suffix = twice.has(c.type) ? `#${c.id + 1}` : '';
    const many = chips.filter((x) => x.type !== c.type).length > 0;
    const prefix = many ? `${SHORT[c.type]}${suffix} ` : suffix ? `${suffix} ` : '';
    for (const ch of c.chans.values()) {
      if (!ch.events.length) continue;
      if (ch.cur) ch.cur.len = end - ch.cur.tick;
      tracks.push({ name: prefix + ch.name, chip: CHIP_KIND[ch.name.replace(/\d+$/, '')] || '', events: withRests(ch.events, end), clock: CLOCK, end });
    }
    if (c.drum) {
      const pads = DRUMS[c.type].map(([name]) => name);
      // a drum hit lasts until the next one (at most a quarter of a second)
      c.drum.forEach((ev, i) => { ev.len = Math.min(15, (c.drum[i + 1]?.tick ?? end) - ev.tick); ev.label = ev.pads.map((p) => pads[p]).join('+'); });
      tracks.push({ name: prefix + (c.type === 'SN76489' ? 'NOISE' : c.type === 'YM2610' ? 'ADPCMA' : 'RHY'), chip: c.type === 'SN76489' ? 'NOISE' : 'RHY', drum: true, pads, events: c.drum, clock: CLOCK, end });
    }
  }
  // the drums under the others
  tracks.sort((a, b) => !!a.drum - !!b.drum);
  return {
    tracks,
    tickFrames: TICK_FRAMES,
    total: total || end * TICK_FRAMES,
    loopLen: loopLen && loopLen <= (total || Infinity) ? loopLen : 0,
  };
}

// Rests between the notes, so a note's end shows (OFF in the tracker).
function withRests(events, end) {
  const out = [];
  let at = 0;
  for (const ev of events) {
    if (ev.tick > at) out.push({ tick: at, len: ev.tick - at, kind: 'rest' });
    out.push(ev);
    at = ev.tick + ev.len;
  }
  if (out.length && at < end) out.push({ tick: at, len: end - at, kind: 'rest' });
  // a rest before the first note is not a note off
  if (out[0]?.kind === 'rest') out.shift();
  return out;
}

// The song position, in ticks, of a heard VGM frame (the loop followed).
export function tickOf(notes, frame) {
  let f = frame;
  if (notes.loopLen && f >= notes.total) f = notes.total - notes.loopLen + ((f - notes.total) % notes.loopLen);
  return f / notes.tickFrames;
}
