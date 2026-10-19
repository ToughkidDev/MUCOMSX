// Runs an engine (MDPlayer4Mac's compiler, driver and chip emulators, compiled to
// WebAssembly) off the main thread. Audio goes straight to the AudioWorklet over a
// MessagePort, so a busy editor never starves playback.
//   engine-worker.js             MUC editor engine: compile, MUB playback, exports
//   engine-worker.js?engine=vgm  VGM/VGZ playback (separate, loaded on first use)
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
  rendered = 0;
  played = 0;
  audio.postMessage({ type: 'reset', session: id });
  let loop = -1;
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
    audio.postMessage({ type: 'pcm', data }, [data.buffer]);
    rendered += frames;
    // Where each part is in the source, for highlighting as the audio is heard.
    const trace = E.TakeTrace();
    if (trace.length) {
      const events = Int32Array.from(trace);
      postMessage({ type: 'trace', session: id, events }, [events.buffer]);
    }
    const status = JSON.parse(E.Status());
    if (status.loop !== loop) {
      loop = status.loop;
      postMessage({ type: 'loop', loop, at: rendered });
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
