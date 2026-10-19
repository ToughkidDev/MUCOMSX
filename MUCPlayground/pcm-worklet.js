// Plays interleaved stereo Float32 PCM streamed from engine-worker.js.
// Reports played frames back to the worker (flow control) and to the page (clock, end).
const PREBUFFER = 44100 * 0.25;

class PcmPlayer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.engine = null;     // MessagePort to the worker
    this.reset(0);
    this.port.onmessage = (e) => {
      if (e.data.type === 'enginePort') {
        this.engine = e.data.port;
        this.engine.onmessage = (m) => this.receive(m.data);
      }
    };
  }

  reset(session) {
    this.session = session;
    this.queue = [];
    this.offset = 0;        // read position (samples) in queue[0]
    this.buffered = 0;      // frames waiting
    this.played = 0;
    this.started = false;
    this.ending = false;
    this.underruns = 0;
    this.reported = 0;
  }

  receive(m) {
    if (m.type === 'reset') {
      this.reset(m.session);
      this.port.postMessage({ type: 'progress', frames: 0, underruns: 0, playing: false });
    } else if (m.type === 'pcm') {
      this.queue.push(m.data);
      this.buffered += m.data.length >> 1;
    } else if (m.type === 'end') {
      this.ending = true;
    }
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const left = out[0];
    const right = out[1] || out[0];
    const n = left.length;
    if (!this.started && (this.buffered >= PREBUFFER || (this.ending && this.buffered > 0))) this.started = true;

    let i = 0;
    if (this.started) {
      while (i < n && this.queue.length) {
        const chunk = this.queue[0];
        while (i < n && this.offset < chunk.length) {
          left[i] = chunk[this.offset];
          right[i] = chunk[this.offset + 1];
          this.offset += 2;
          i++;
        }
        if (this.offset >= chunk.length) { this.queue.shift(); this.offset = 0; }
      }
      this.buffered -= i;
      this.played += i;
      if (i < n && !this.ending) this.underruns++;
    }
    for (; i < n; i++) { left[i] = 0; right[i] = 0; }

    if (this.started && this.played - this.reported >= 2048) {
      this.reported = this.played;
      if (this.engine) this.engine.postMessage({ type: 'played', frames: this.played, session: this.session });
      this.port.postMessage({ type: 'progress', frames: this.played, at: currentTime + n / sampleRate, underruns: this.underruns, playing: true });
    }
    if (this.ending && this.started && this.buffered <= 0) {
      this.port.postMessage({ type: 'ended', frames: this.played });
      this.ending = false;
      this.started = false;
    }
    return true;
  }
}

registerProcessor('pcm-player', PcmPlayer);
