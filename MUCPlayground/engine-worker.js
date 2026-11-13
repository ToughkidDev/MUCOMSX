// Runs an engine (MDPlayer4Mac's compiler, driver and chip emulators, compiled to
// WebAssembly) off the main thread. Audio goes straight to the AudioWorklet over a
// MessagePort, so a busy editor never starves playback.
//   engine-worker.js             MUC editor engine: compile, MUB playback, exports
//   engine-worker.js?engine=vgm  VGM/VGZ playback (separate, loaded on first use)
//   a second engine-worker.js   only exportFile: a .mub's VGM for the note views (on first use)
const ENGINE_DIR = new URL(import.meta.url).searchParams.get('engine') === 'vgm' ? './engine-vgm/' : './engine/';

const SAMPLE_RATE = 44100;
const CHUNK = 2048;                 // frames per render call
const AHEAD = SAMPLE_RATE * 1.2;    // keep about this much rendered ahead of playback

let E = null;          // MucPlayground.Interop exports
let audio = null;      // MessagePort to the AudioWorklet
let session = 0;       // bumps on every play/stop so stale loops exit
let rendered = 0;      // frames sent to the worklet in this session
let played = 0;        // frames the worklet reports as played
let wake = null;       // resolves when the worklet reports progress
// The loop button: after this many loops (0: never) the song fades out and ends. With 2,
// a song with a loop plays through, then its loop once more (1+1).
let maxLoops = 2;
const FADE = SAMPLE_RATE * 3;   // frames the fade-out takes

async function boot(language) {
  const { dotnet } = await import(ENGINE_DIR + 'dotnet.js');
  const { getAssemblyExports, getConfig } = await dotnet.create();
  E = (await getAssemblyExports(getConfig().mainAssemblyName)).MucPlayground.Interop;
  E.Init(language);
  postMessage({ type: 'ready' });
}

function stopPlayback() {
  session++;
  if (E) E.Stop();
  if (audio) audio.postMessage({ type: 'reset', session });
  if (wake) { wake(); wake = null; }
}

// `start` begins the song in the engine and returns its JSON status.
async function play(id, start) {
  start = JSON.parse(start());
  if (!start.ok) { postMessage({ type: 'error', message: start.error }); return; }
  postMessage({ type: 'started', info: start, session: id });
  // The channels the oscilloscope view can show (none for a VGM file).
  postMessage({ type: 'scopeChannels', session: id, channels: E.ScopeChannels ? JSON.parse(E.ScopeChannels()) : null });
  rendered = 0;
  played = 0;
  audio.postMessage({ type: 'reset', session: id });
  let loop = -1;
  let fadeFrom = -1;   // the rendered frame the fade-out starts at
  while (id === session) {
    if (rendered - played >= AHEAD) {
      await new Promise((resolve) => { wake = resolve; setTimeout(resolve, 50); });
      continue;
    }
    const bytes = E.Render(CHUNK);
    if (id !== session) return;
    if (bytes.length === 0) {
      audio.postMessage({ type: 'end' });
      const status = JSON.parse(E.Status());
      if (status.error) postMessage({ type: 'error', message: status.error });
      return;
    }
    const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length >> 1);
    const frames = pcm.length >> 1;
    const data = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 32768;
    let faded = false;
    if (fadeFrom >= 0) {
      for (let f = 0; f < frames; f++) {
        const g = Math.max(0, 1 - (rendered + f - fadeFrom) / FADE);
        data[f * 2] *= g; data[f * 2 + 1] *= g;
      }
      faded = rendered + frames - fadeFrom >= FADE;
    }
    audio.postMessage({ type: 'pcm', data }, [data.buffer]);
    rendered += frames;
    if (faded) { audio.postMessage({ type: 'end' }); return; }
    // Where each part is in the source, for highlighting as the audio is heard.
    const trace = E.TakeTrace();
    if (trace.length) {
      const events = Int32Array.from(trace);
      postMessage({ type: 'trace', session: id, events }, [events.buffer]);
    }
    // Each channel's own output, for the oscilloscope view (only while it is open).
    if (E.TakeScope) {
      const scope = E.TakeScope();
      if (scope.length) {
        const copy = scope.slice();
        postMessage({ type: 'scope', session: id, data: copy.buffer }, [copy.buffer]);
      }
    }
    // Chip register writes and live output levels, for the channel view.
    for (const [type, take] of [['chips', E.TakeChipLog], ['levels', E.TakeLevels]]) {
      if (!take) continue;
      const log = take();
      if (log.length) {
        const events = Int32Array.from(log);
        postMessage({ type, session: id, events }, [events.buffer]);
      }
    }
    const status = JSON.parse(E.Status());
    if (status.loop !== loop) {
      loop = status.loop;
      postMessage({ type: 'loop', loop, at: rendered });
      // at a loop point: enough loops played, fade out from here
      if (maxLoops && loop >= maxLoops && fadeFrom < 0) fadeFrom = rendered;
    }
    // Yield so stop/compile messages are handled between chunks.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

let booted = null;

onmessage = async (event) => {
  const m = event.data;
  try {
    if (m.type === 'boot') {
      booted = boot(m.language);
      await booted;
      return;
    }
    // Messages sent while the runtime is still loading wait for it, in order.
    await booted;
    switch (m.type) {
      case 'language':
        E.Init(m.language);
        break;
      case 'audioPort':
        audio = m.port;
        audio.onmessage = (e) => {
          if (e.data.type === 'played' && e.data.session === session) {
            played = e.data.frames;
            if (wake) { wake(); wake = null; }
          }
        };
        break;
      case 'setFile':
        E.SetFile(m.name, new Uint8Array(m.data));
        break;
      case 'removeFile':
        E.RemoveFile(m.name);
        break;
      case 'clearFiles':
        E.ClearFiles();
        break;
      case 'compile': {
        stopPlayback();
        const t = performance.now();
        const result = JSON.parse(E.Compile(m.text));
        result.ms = Math.round(performance.now() - t);
        postMessage({ type: 'compiled', result, play: m.play });
        if (result.ok && m.play) play(session, () => E.Start());
        break;
      }
      case 'playFile': {
        stopPlayback();
        const data = new Uint8Array(m.data);
        play(session, () => E.StartFile(data));
        break;
      }
      case 'scope':
        E.SetScope?.(m.on);
        break;
      case 'channelVolume':
        E.SetChannelVolume(m.chip, m.id, m.ch, m.vol);
        break;
      case 'loops':
        maxLoops = Math.max(0, m.value | 0);
        break;
      case 'speed':
        E.SetSpeed(m.value);
        break;
      case 'check':
        postMessage({ type: 'checked', id: m.id, result: JSON.parse(E.Check(m.text)) });
        break;
      case 'stop':
        stopPlayback();
        postMessage({ type: 'stopped' });
        break;
      case 'export': {
        const bytes = m.kind === 'vgm' ? E.ExportVgm(m.text, 600) : E.ExportMub(m.text);
        if (!bytes) {
          postMessage({ type: 'exported', id: m.id, kind: m.kind, error: E.ExportError() });
        } else {
          const copy = bytes.slice();
          postMessage({ type: 'exported', id: m.id, kind: m.kind, data: copy.buffer }, [copy.buffer]);
        }
        break;
      }
      // A .mub's chip writes as VGM, for the note views (chip-notes.js). Asked of a second
      // copy of this worker, so the one playing is never held up by it.
      case 'exportFile': {
        let vgm = null;
        try { vgm = E.ExportVgmFile ? E.ExportVgmFile(new Uint8Array(m.data), 600) : null; } catch { vgm = null; }
        const copy = vgm ? vgm.slice() : null;
        postMessage({ type: 'exportedFile', id: m.id, data: copy?.buffer || null }, copy ? [copy.buffer] : []);
        break;
      }
      case 'encode': {
        const bytes = E.EncodeShiftJis(m.text);
        const copy = bytes.slice();
        postMessage({ type: 'encoded', id: m.id, data: copy.buffer }, [copy.buffer]);
        break;
      }
    }
  } catch (error) {
    postMessage({ type: 'error', message: String(error && error.message || error) });
  }
};
