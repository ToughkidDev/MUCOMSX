// A song's audio as a file: the PCM the engine renders (44.1 kHz, stereo, 16-bit, in pieces
// as it comes) into an MP3 or a WAV. A classic worker, so LAME (vendor/mp3: LAME 3.100 in
// WebAssembly with the wasm-media-encoders wrapper) is loaded only when an MP3 is asked for.
//   { type: 'start', kind: 'mp3' | 'wav', bitrate?: kbps (CBR) | vbr?: LAME -V quality, title, composer }
//   { type: 'pcm', data: ArrayBuffer of interleaved Int16 }   (as many as there are)
//   { type: 'end' }  ->  { type: 'file', data: ArrayBuffer, bytes, frames }  or { type: 'error', message }
'use strict';

const SAMPLE_RATE = 44100;
let job = null;    // { kind, enc, parts, frames, title, composer, vbr }
let ready = Promise.resolve();

onmessage = (event) => {
  const m = event.data;
  // in order: the encoder may still be loading when the first pieces come
  ready = ready.then(() => handle(m)).catch((e) => postMessage({ type: 'error', message: String(e && e.message || e) }));
};

async function handle(m) {
  if (m.type === 'start') {
    job = { kind: m.kind, parts: [], frames: 0, title: m.title || '', composer: m.composer || '', vbr: m.vbr != null };
    if (m.kind === 'mp3') {
      if (!self.WasmMediaEncoder) importScripts('vendor/mp3/WasmMediaEncoder.min.js');
      job.enc = await self.WasmMediaEncoder.createEncoder('audio/mpeg', new URL('vendor/mp3/mp3.wasm', self.location.href).href);
      job.enc.configure({ channels: 2, sampleRate: SAMPLE_RATE, outputSampleRate: SAMPLE_RATE, ...(m.vbr != null ? { vbrQuality: m.vbr } : { bitrate: m.bitrate || 192 }) });
    }
    return;
  }
  if (!job) return;
  if (m.type === 'pcm') {
    const pcm = new Int16Array(m.data);
    const frames = pcm.length >> 1;
    job.frames += frames;
    if (job.kind === 'wav') { job.parts.push(pcm); return; }
    const l = new Float32Array(frames), r = new Float32Array(frames);
    for (let i = 0; i < frames; i++) { l[i] = pcm[2 * i] / 32768; r[i] = pcm[2 * i + 1] / 32768; }
    const out = job.enc.encode([l, r]);
    if (out.length) job.parts.push(out.slice());   // (the encoder reuses its buffer)
    return;
  }
  if (m.type === 'end') {
    const file = job.kind === 'wav' ? wavFile(job) : mp3File(job);
    postMessage({ type: 'file', data: file.buffer, bytes: file.length, frames: job.frames }, [file.buffer]);
    job = null;
  }
}

const concat = (parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};

// ---- WAV: the PCM as it is, with the song's title and composer in a LIST INFO chunk
function wavFile(j) {
  const data = j.frames * 4;
  const info = infoChunk({ INAM: j.title, IART: j.composer, ISFT: 'MUCPlayground' });
  const out = new Uint8Array(44 + data + info.length);
  const v = new DataView(out.buffer);
  const tag = (at, s) => { for (let i = 0; i < 4; i++) out[at + i] = s.charCodeAt(i); };
  tag(0, 'RIFF'); v.setUint32(4, 36 + data + info.length, true); tag(8, 'WAVE');
  tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, SAMPLE_RATE, true); v.setUint32(28, SAMPLE_RATE * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  tag(36, 'data'); v.setUint32(40, data, true);
  let at = 44;
  for (const p of j.parts) { out.set(new Uint8Array(p.buffer, p.byteOffset, p.byteLength), at); at += p.byteLength; }
  out.set(info, at);
  return out;
}
// RIFF INFO strings are bytes; UTF-8 is what most readers take now.
function infoChunk(fields) {
  const subs = [];
  for (const [id, text] of Object.entries(fields)) {
    if (!text) continue;
    const b = new TextEncoder().encode(text + '\0');
    const s = new Uint8Array(8 + b.length + (b.length & 1));
    for (let i = 0; i < 4; i++) s[i] = id.charCodeAt(i);
    new DataView(s.buffer).setUint32(4, b.length, true);
    s.set(b, 8);
    subs.push(s);
  }
  if (!subs.length) return new Uint8Array(0);
  const body = concat(subs);
  const out = new Uint8Array(12 + body.length);
  out.set([76, 73, 83, 84]);   // LIST
  new DataView(out.buffer).setUint32(4, 4 + body.length, true);
  out.set([73, 78, 70, 79], 8);   // INFO
  out.set(body, 12);
  return out;
}

// ---- MP3: an ID3v2.3 tag (title, composer), for VBR a Xing frame (frames, bytes, seek table:
// without it players guess the length from the first frame's bitrate), then LAME's frames.
function mp3File(j) {
  j.parts.push(j.enc.finalize().slice());
  const audio = concat(j.parts);
  const xing = j.vbr ? xingFrame(audio) : new Uint8Array(0);
  return concat([id3({ TIT2: j.title, TPE1: j.composer, TCOM: j.composer, TSSE: 'MUCPlayground (LAME 3.100)' }), xing, audio]);
}

function id3(fields) {
  const frames = [];
  for (const [id, text] of Object.entries(fields)) {
    if (!text) continue;
    // encoding 1: UTF-16 with a byte order mark, so Japanese titles survive
    const body = new Uint8Array(1 + 2 + text.length * 2 + 2);
    body[0] = 1; body[1] = 0xff; body[2] = 0xfe;
    for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); body[3 + 2 * i] = c & 255; body[4 + 2 * i] = c >> 8; }
    const f = new Uint8Array(10 + body.length);
    for (let i = 0; i < 4; i++) f[i] = id.charCodeAt(i);
    new DataView(f.buffer).setUint32(4, body.length);
    f.set(body, 10);
    frames.push(f);
  }
  if (!frames.length) return new Uint8Array(0);
  const body = concat(frames), n = body.length;
  const head = new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, (n >> 21) & 127, (n >> 14) & 127, (n >> 7) & 127, n & 127]);
  return concat([head, body]);
}

// MPEG-1 layer III frames at 44.1 kHz: where each starts.
const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
function frameStarts(a) {
  const starts = [];
  for (let p = 0; p + 4 <= a.length;) {
    if (a[p] !== 0xff || (a[p + 1] & 0xfe) !== 0xfa) { p++; continue; }
    const kbps = BITRATES[a[p + 2] >> 4], pad = (a[p + 2] >> 1) & 1;
    if (!kbps || ((a[p + 2] >> 2) & 3) !== 0) { p++; continue; }
    starts.push(p);
    p += Math.floor(144000 * kbps / SAMPLE_RATE) + pad;
  }
  return starts;
}
function xingFrame(audio) {
  const starts = frameStarts(audio);
  // a 128 kbps frame (417 bytes) holds the tag; its channel mode is the song's
  const size = Math.floor(144000 * 128 / SAMPLE_RATE);
  const f = new Uint8Array(size);
  f[0] = 0xff; f[1] = 0xfb; f[2] = (9 << 4) | (0 << 2); f[3] = starts.length ? audio[starts[0] + 3] & 0xf0 : 0x40;
  const mono = (f[3] >> 6) === 3, at = 4 + (mono ? 17 : 32);
  const v = new DataView(f.buffer);
  f.set([88, 105, 110, 103], at);            // Xing
  v.setUint32(at + 4, 0x7);                  // frames, bytes and the seek table are there
  v.setUint32(at + 8, starts.length);
  v.setUint32(at + 12, size + audio.length);
  for (let i = 0; i < 100; i++) {
    const k = Math.min(starts.length - 1, Math.floor((i / 100) * starts.length));
    f[at + 16 + i] = starts.length ? Math.min(255, Math.floor(((size + starts[k]) / (size + audio.length)) * 256)) : 0;
  }
  return f;
}
