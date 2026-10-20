// The keyboard's synthesizer (keys mode): a few voices played live, in their own low-latency
// AudioContext. Not the chips' emulation: a sketch to try notes with.
//   fm     four OPN operators (phase modulation, OP1 feedback), each following its
//          envelope (AR D1R D1L D2R RR with TL, key scaling) the way fm-preview.js draws it
//   wave   a 32-step wave table (SCC, or the SSG's square), held while the key is down
//   sine   a plain sine
//   noise  a short burst of noise (rhythm parts)
// Messages: { type: 'on', id, freq, inst }, { type: 'off', id }, { type: 'allOff' },
// { type: 'gain', value }.

import { ALGS, envelope } from './fm-preview.js';

const MAX_VOICES = 12;
const STEP = 32;                 // envelope levels are worked out every STEP samples
const RELEASE = 0.12;            // seconds, for wave / sine

class KeysSynth extends AudioWorkletProcessor {
  constructor() {
    super();
    this.voices = [];
    this.gain = 0.3;
    this.port.onmessage = (e) => this.message(e.data);
  }

  message(m) {
    if (m.type === 'on') {
      const v = { id: m.id, freq: m.freq, inst: m.inst, t: 0, off: Infinity, phase: [0, 0, 0, 0], p1: 0, p2: 0, amp: [0, 0, 0, 0], next: [0, 0, 0, 0] };
      if (m.inst.kind === 'fm') {
        const alg = ALGS[m.inst.voice.alg] || ALGS[0];
        v.alg = alg;
        v.into = [[], [], [], []];
        for (const [a, b] of alg.edges) v.into[b].push(a);
        // Key scaling: the note's key code (block and top F-number bits), shifted by KS.
        const kc = Math.max(0, Math.min(31, Math.round(4 * Math.log2(m.freq / 16.35) + 1)));
        v.rks = m.inst.voice.ops.map((o) => kc >> (3 - (o.KS | 0)));
        v.mul = m.inst.voice.ops.map((o) => (o.ML ? o.ML : 0.5));
      }
      this.voices.push(v);
      if (this.voices.length > MAX_VOICES) this.voices.shift();
    } else if (m.type === 'off') {
      for (const v of this.voices) if (v.id === m.id && v.off === Infinity) v.off = v.t;
    } else if (m.type === 'allOff') {
      for (const v of this.voices) if (v.off === Infinity) v.off = v.t;
    } else if (m.type === 'gain') {
      this.gain = m.value;
    }
  }

  // Attenuation of every operator at time t, as linear levels; also whether all carriers
  // have died away after key off.
  levels(v, t, into) {
    let silent = true;
    const ops = v.inst.voice.ops;
    for (let k = 0; k < 4; k++) {
      const db = envelope(ops[k], t, v.off, v.rks[k]);
      into[k] = 10 ** (-db / 20);
      if (v.alg.out.includes(k) && db < 90) silent = false;
    }
    return silent && t > v.off;
  }

  renderFm(v, out, n, dt) {
    const fb = v.inst.voice.fb | 0;
    const o = [0, 0, 0, 0];
    let done = false;
    for (let s = 0; s < n; s++) {
      if (s % STEP === 0) {
        done = this.levels(v, v.t, v.amp);
        this.levels(v, v.t + STEP * dt, v.next);
      }
      const f = (s % STEP) / STEP;
      for (let k = 0; k < 4; k++) {
        let mod = 0;
        if (k === 0 && fb) mod = 2 * Math.PI * (v.p1 + v.p2) * 2 ** (fb - 7);
        for (const m of v.into[k]) mod += 8 * Math.PI * o[m];
        o[k] = (v.amp[k] + (v.next[k] - v.amp[k]) * f) * Math.sin(2 * Math.PI * v.phase[k] + mod);
        v.phase[k] = (v.phase[k] + v.freq * v.mul[k] * dt) % 1;
      }
      v.p2 = v.p1; v.p1 = o[0];
      let sum = 0;
      for (const k of v.alg.out) sum += o[k];
      out[s] += sum / Math.sqrt(v.alg.out.length);
      v.t += dt;
    }
    return done;
  }

  renderSimple(v, out, n, dt) {
    const inst = v.inst;
    for (let s = 0; s < n; s++) {
      let level;
      if (inst.kind === 'noise') level = Math.exp(-v.t / 0.07) * (v.t < 0.002 ? v.t / 0.002 : 1);
      else {
        level = Math.min(1, v.t / 0.003);
        if (v.t > v.off) level *= Math.max(0, 1 - (v.t - v.off) / RELEASE);
      }
      let x;
      if (inst.kind === 'wave') x = inst.table[Math.floor(v.phase[0] * inst.table.length) % inst.table.length];
      else if (inst.kind === 'noise') x = Math.random() * 2 - 1;
      else x = Math.sin(2 * Math.PI * v.phase[0]);
      out[s] += x * level * 0.7;
      v.phase[0] = (v.phase[0] + v.freq * dt) % 1;
      v.t += dt;
    }
    if (inst.kind === 'noise') return v.t > 0.5;
    return v.t > v.off + RELEASE;
  }

  process(inputs, outputs) {
    const left = outputs[0][0], right = outputs[0][1];
    const n = left.length, dt = 1 / sampleRate;
    left.fill(0);
    this.voices = this.voices.filter((v) => !(v.inst.kind === 'fm' ? this.renderFm(v, left, n, dt) : this.renderSimple(v, left, n, dt)));
    for (let s = 0; s < n; s++) left[s] = Math.max(-1, Math.min(1, left[s] * this.gain));
    if (right) right.set(left);
    return true;
  }
}

registerProcessor('keys-synth', KeysSynth);
