// MUCPlayground page logic: editor, examples, attached files and audio plumbing.
// The engine itself runs in engine-worker.js; audio is played by pcm-worklet.js.

const SAMPLE_RATE = 44100;
const STORE_SOURCE = 'mucplayground.source';
const STORE_LANG = 'mucplayground.lang';
const STORE_VOLUME = 'mucplayground.volume';

const T = {
  en: {
    back: '← MUCOMSX', tagline: 'Write MUCOM88 MML, hear it right away',
    play: '▶ Play', stop: '■ Stop', volume: 'Volume', examples: 'Examples', open: 'Open .muc',
    addFiles: 'Add voice / PCM', save: 'Save .muc', nowPlaying: 'Now playing', messages: 'Compiler messages',
    files: 'Voice / PCM files', filesHint: 'Files named by #voice or #pcm. Add them with the button above, or drop them on the page.',
    reference: 'Quick reference', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'Rhythm (v needs 7 values)',
    refPcm: 'ADPCM (needs #pcm)', refTempo: 'Tempo in BPM / raw Timer-B', refOctave: 'Octave, up, down',
    refLength: 'Default length, length, clocks', refVoice: 'Volume, voice', refLoop: 'Repeat, song loop point',
    refComment: 'Comment', manual: 'Full MML guide:',
    credit1: "Compiler, driver and chip emulation are MDPlayer4Mac's, built for the browser: mucomDotNET by kuma4649 and MDSound. GPL-3.0.",
    credit2: 'MUCOM88 © Yuzo Koshiro, CC BY-NC-SA 4.0.', source: 'Source and licenses',
    drop: 'Drop a .muc to open it, or voice / PCM files to attach them',
    loading: 'Loading the engine (about 4.5 MB, first time only)…', ready: 'Ready. Press Play or Ctrl+Enter.',
    loadFailed: 'The engine could not be loaded: ', compiling: 'Compiling…', playing: 'Playing',
    compiled: (ms, size) => `Compiled in ${ms} ms, ${size.toLocaleString()} bytes.`,
    compileFailed: 'Compile error. See the messages on the right.', stopped: 'Stopped.', ended: 'Finished.',
    noMessages: 'No messages.', loop: (n) => `loop ${n}`, missing: 'not attached', remove: 'Remove',
    demo: 'Demo (FM + SSG + rhythm)', yourSong: 'Your song (autosaved)', samples: 'Samples',
    loadingSample: (n) => `Loading ${n}…`, sampleFailed: 'Could not load the sample: ',
    underrun: 'Playback is catching up; this device renders slowly.', row: (r, c) => c > 0 ? `${r}:${c}` : `${r}`,
    confirmReplace: 'Replace the editor contents? Your current text is lost unless you saved it.',
    audioFailed: 'Audio could not start: ', bytes: (n) => `${n.toLocaleString()} bytes`,
  },
  ko: {
    back: '← MUCOMSX', tagline: 'MUCOM88 MML을 쓰고 바로 들어보기',
    play: '▶ 재생', stop: '■ 정지', volume: '음량', examples: '예제', open: '.muc 열기',
    addFiles: '음색 / PCM 추가', save: '.muc 저장', nowPlaying: '재생 중', messages: '컴파일 메시지',
    files: '음색 / PCM 파일', filesHint: '#voice, #pcm으로 지정한 파일입니다. 위 버튼으로 추가하거나 페이지에 끌어다 놓으세요.',
    reference: '빠른 참조', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: '리듬 (v는 값 7개)',
    refPcm: 'ADPCM (#pcm 필요)', refTempo: '템포 BPM / Timer-B 값', refOctave: '옥타브, 올림, 내림',
    refLength: '기본 길이, 길이, 클록', refVoice: '음량, 음색', refLoop: '반복, 곡 루프 지점',
    refComment: '주석', manual: 'MML 전체 설명:',
    credit1: '컴파일러, 드라이버, 칩 에뮬레이션은 MDPlayer4Mac의 것을 브라우저용으로 빌드했습니다: kuma4649의 mucomDotNET, MDSound. GPL-3.0.',
    credit2: 'MUCOM88 © 古代祐三, CC BY-NC-SA 4.0.', source: '소스와 라이선스',
    drop: '.muc는 열고, 음색 / PCM 파일은 첨부합니다',
    loading: '엔진을 불러오는 중 (약 4.5 MB, 처음 한 번만)…', ready: '준비됐습니다. 재생 또는 Ctrl+Enter를 누르세요.',
    loadFailed: '엔진을 불러오지 못했습니다: ', compiling: '컴파일 중…', playing: '재생 중',
    compiled: (ms, size) => `${ms} ms에 컴파일, ${size.toLocaleString()} 바이트.`,
    compileFailed: '컴파일 오류입니다. 오른쪽 메시지를 확인하세요.', stopped: '정지했습니다.', ended: '끝났습니다.',
    noMessages: '메시지 없음.', loop: (n) => `루프 ${n}`, missing: '첨부 안 됨', remove: '제거',
    demo: '데모 (FM + SSG + 리듬)', yourSong: '내 곡 (자동 저장)', samples: '샘플',
    loadingSample: (n) => `${n} 불러오는 중…`, sampleFailed: '샘플을 불러오지 못했습니다: ',
    underrun: '렌더링이 재생을 따라잡는 중입니다. 이 기기에서는 느릴 수 있습니다.', row: (r, c) => c > 0 ? `${r}:${c}` : `${r}`,
    confirmReplace: '에디터 내용을 바꿀까요? 저장하지 않은 현재 내용은 사라집니다.',
    audioFailed: '오디오를 시작하지 못했습니다: ', bytes: (n) => `${n.toLocaleString()} 바이트`,
  },
  ja: {
    back: '← MUCOMSX', tagline: 'MUCOM88のMMLを書いて、すぐに聴く',
    play: '▶ 再生', stop: '■ 停止', volume: '音量', examples: 'サンプル', open: '.mucを開く',
    addFiles: '音色 / PCMを追加', save: '.mucを保存', nowPlaying: '再生中', messages: 'コンパイルメッセージ',
    files: '音色 / PCMファイル', filesHint: '#voice・#pcmで指定したファイルです。上のボタンで追加するか、ページにドロップしてください。',
    reference: 'クイックリファレンス', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'リズム（vは7つの値）',
    refPcm: 'ADPCM（#pcmが必要）', refTempo: 'テンポ BPM / Timer-B値', refOctave: 'オクターブ、上げ、下げ',
    refLength: '基本音長、音長、クロック', refVoice: '音量、音色', refLoop: '繰り返し、曲のループ位置',
    refComment: 'コメント', manual: 'MMLの詳しい説明:',
    credit1: 'コンパイラ・ドライバ・チップエミュレーションはMDPlayer4Macのものをブラウザ向けにビルドしています: kuma4649氏のmucomDotNET、MDSound。GPL-3.0。',
    credit2: 'MUCOM88 © 古代祐三, CC BY-NC-SA 4.0。', source: 'ソースとライセンス',
    drop: '.mucは開き、音色 / PCMファイルは添付します',
    loading: 'エンジンを読み込み中（約4.5 MB、初回のみ）…', ready: '準備完了。再生またはCtrl+Enterを押してください。',
    loadFailed: 'エンジンを読み込めませんでした: ', compiling: 'コンパイル中…', playing: '再生中',
    compiled: (ms, size) => `${ms} msでコンパイル、${size.toLocaleString()}バイト。`,
    compileFailed: 'コンパイルエラーです。右のメッセージを確認してください。', stopped: '停止しました。', ended: '再生が終わりました。',
    noMessages: 'メッセージなし。', loop: (n) => `ループ ${n}`, missing: '未添付', remove: '削除',
    demo: 'デモ（FM + SSG + リズム）', yourSong: '自分の曲（自動保存）', samples: 'サンプル曲',
    loadingSample: (n) => `${n}を読み込み中…`, sampleFailed: 'サンプルを読み込めませんでした: ',
    underrun: 'レンダリングが再生に追いつこうとしています。この端末では遅い場合があります。', row: (r, c) => c > 0 ? `${r}:${c}` : `${r}`,
    confirmReplace: 'エディタの内容を置き換えますか？保存していない現在の内容は失われます。',
    audioFailed: 'オーディオを開始できませんでした: ', bytes: (n) => `${n.toLocaleString()}バイト`,
  },
};

const $ = (id) => document.getElementById(id);
const code = $('code'), gutter = $('gutter'), marks = $('marks');
const statusEl = $('status'), clockEl = $('clock');

// ---------- small helpers ----------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode or blocked */ } },
};

let lang = store.get(STORE_LANG)
  || ((navigator.language || '').startsWith('ko') ? 'ko' : (navigator.language || '').startsWith('ja') ? 'ja' : 'en');
const t = (key, ...args) => { const v = T[lang][key] ?? T.en[key]; return typeof v === 'function' ? v(...args) : v; };

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('err', isError);
}

function decodeText(buffer) {
  const bytes = new Uint8Array(buffer);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, ''); }
  catch { return new TextDecoder('shift_jis').decode(bytes); }
}

function download(name, bytes, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- language ----------
function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  buildExamples();
  renderFiles();
  if (lastResult) renderMessages(lastResult);
}
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
  lang = b.dataset.lang;
  store.set(STORE_LANG, lang);
  applyLanguage();
  if (engineReady) worker.postMessage({ type: 'language', language: lang === 'ja' ? 'ja' : 'en' });
}));

// ---------- editor ----------
let markRows = new Map();   // row -> 'err' | 'warn'

function lineCount() { let n = 1; for (let i = 0; i < code.value.length; i++) if (code.value.charCodeAt(i) === 10) n++; return n; }

function renderGutter() {
  const n = lineCount();
  let html = '';
  for (let i = 1; i <= n; i++) {
    const m = markRows.get(i);
    html += m ? `<span class="${m}">${i}</span>` : `<span>${i}</span>`;
  }
  gutter.innerHTML = html;
  renderMarks();
}

function renderMarks() {
  const lh = parseFloat(getComputedStyle(code).lineHeight) || 20;
  const pad = parseFloat(getComputedStyle(code).paddingTop) || 12;
  let html = '';
  for (const [row, kind] of markRows) {
    html += `<div class="${kind}" style="top:${pad + (row - 1) * lh - code.scrollTop}px"></div>`;
  }
  marks.innerHTML = html;
  gutter.scrollTop = code.scrollTop;
}

function updateCursor() {
  const before = code.value.slice(0, code.selectionStart);
  const row = before.split('\n').length;
  const col = before.length - before.lastIndexOf('\n');
  $('cursor').textContent = `Ln ${row}, Col ${col}`;
}

function updateBytes() { $('bytes').textContent = t('bytes', new Blob([code.value]).size); }

function goToRow(row, col = 1) {
  const lines = code.value.split('\n');
  let pos = 0;
  for (let i = 0; i < row - 1 && i < lines.length; i++) pos += lines[i].length + 1;
  pos += Math.max(0, Math.min((col || 1) - 1, (lines[row - 1] || '').length));
  code.focus();
  code.setSelectionRange(pos, pos);
  const lh = parseFloat(getComputedStyle(code).lineHeight) || 20;
  code.scrollTop = Math.max(0, (row - 1) * lh - code.clientHeight / 3);
  updateCursor();
}

let saveTimer = 0, scanTimer = 0;
code.addEventListener('input', () => {
  if (markRows.size) { markRows = new Map(); }
  renderGutter();
  updateBytes();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set(STORE_SOURCE, code.value), 400);
  clearTimeout(scanTimer);
  scanTimer = setTimeout(renderFiles, 400);
  if (current !== 'mine') { current = 'mine'; $('examples').value = 'mine'; }
});
code.addEventListener('scroll', renderMarks);
// Don't lose the last keystrokes to the autosave delay when the tab closes.
const flushSave = () => { clearTimeout(saveTimer); store.set(STORE_SOURCE, code.value); };
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
['keyup', 'click', 'select'].forEach((ev) => code.addEventListener(ev, updateCursor));
window.addEventListener('resize', renderMarks);

function setSource(text) {
  code.value = text;
  markRows = new Map();
  renderGutter();
  updateBytes();
  updateCursor();
  code.scrollTop = 0;
  store.set(STORE_SOURCE, text);
  renderFiles();
}

// ---------- messages ----------
let lastResult = null;
// English "[row:4 column:13]" / "row:4 col:13", Japanese "[行:4 桁:13]" / "row:4 col:13".
const POS = /(?:row|行):\s*(-?\d+)\s*(?:col(?:umn)?|桁):\s*(-?\d+)/i;

function messagePosition(m) {
  if (m.row > 0) return { row: m.row, col: m.col };
  const p = POS.exec(m.text);
  return p && +p[1] > 0 ? { row: +p[1], col: +p[2] } : null;
}

function renderMessages(result) {
  const list = $('messages');
  list.innerHTML = '';
  markRows = new Map();
  const add = (m, kind) => {
    const li = document.createElement('li');
    li.className = kind;
    const pos = messagePosition(m);
    const text = m.text.replace(/^\[(?:row|行):\s*-?\d+\s*(?:column|桁):\s*-?\d+\]\s*/i, '');
    if (pos) {
      li.dataset.row = pos.row;
      const span = document.createElement('span');
      span.className = 'pos';
      span.textContent = t('row', pos.row, pos.col);
      li.appendChild(span);
      li.addEventListener('click', () => goToRow(pos.row, pos.col));
      if (kind === 'err' || !markRows.has(pos.row)) markRows.set(pos.row, kind);
    }
    li.appendChild(document.createTextNode(text));
    list.appendChild(li);
  };
  result.errors.forEach((m) => add(m, 'err'));
  result.warnings.forEach((m) => add(m, 'warn'));
  if (!result.errors.length && !result.warnings.length) {
    const li = document.createElement('li');
    li.className = 'ok';
    li.textContent = t('noMessages');
    list.appendChild(li);
  }
  renderGutter();
}

// ---------- attached files ----------
const files = new Map();   // lower-case name -> { name, data:ArrayBuffer }

function referencedFiles() {
  const names = [];
  const re = /^#(voice|pcm)[ \t]+([^\s;]+)/gim;
  let m;
  while ((m = re.exec(code.value))) names.push(m[2].replace(/^"|"$/g, ''));
  return names;
}

function attach(name, data) {
  const base = name.split(/[\\/]/).pop();
  files.set(base.toLowerCase(), { name: base, data });
  worker.postMessage({ type: 'setFile', name: base, data: data.slice(0) });
  renderFiles();
}

function detach(key) {
  const f = files.get(key);
  if (!f) return;
  files.delete(key);
  worker.postMessage({ type: 'removeFile', name: f.name });
  renderFiles();
}

function clearFiles() {
  files.clear();
  worker.postMessage({ type: 'clearFiles' });
  renderFiles();
}

function renderFiles() {
  const list = $('files');
  list.innerHTML = '';
  const shown = new Set();
  for (const [key, f] of files) {
    shown.add(key);
    const li = document.createElement('li');
    li.innerHTML = '<span class="name"></span><span class="size"></span><button type="button">×</button>';
    li.querySelector('.name').textContent = f.name;
    li.querySelector('.size').textContent = t('bytes', f.data.byteLength);
    const b = li.querySelector('button');
    b.title = t('remove');
    b.setAttribute('aria-label', `${t('remove')} ${f.name}`);
    b.addEventListener('click', () => detach(key));
    list.appendChild(li);
  }
  for (const name of referencedFiles()) {
    if (shown.has(name.toLowerCase())) continue;
    shown.add(name.toLowerCase());
    const li = document.createElement('li');
    li.className = 'missing';
    li.innerHTML = '<span class="name"></span><span class="size"></span>';
    li.querySelector('.name').textContent = name;
    li.querySelector('.size').textContent = t('missing');
    list.appendChild(li);
  }
}

$('addFiles').addEventListener('click', () => $('filesInput').click());
$('filesInput').addEventListener('change', async (e) => {
  for (const f of e.target.files) attach(f.name, await f.arrayBuffer());
  e.target.value = '';
});

// ---------- examples ----------
let samples = [];
let current = 'mine';   // what the editor holds: 'mine', 'demo' or 's:<group>:<song>'

function buildExamples() {
  const sel = $('examples');
  sel.innerHTML = '';
  const opt = (value, label, parent = sel) => { const o = document.createElement('option'); o.value = value; o.textContent = label; parent.appendChild(o); };
  opt('mine', t('yourSong'));
  opt('demo', t('demo'));
  samples.forEach((g, gi) => {
    const group = document.createElement('optgroup');
    group.label = `${t('samples')}: ${g.name}`;
    g.songs.forEach((s, si) => opt(`s:${gi}:${si}`, s.replace(/\.muc$/i, ''), group));
    sel.appendChild(group);
  });
  sel.value = [...sel.options].some((o) => o.value === current) ? current : 'mine';
}

async function loadExample(value) {
  if (value === current) return;
  if (value === 'mine') { $('examples').value = current; return; }
  // Only your own text needs protecting; an unedited example can be swapped freely.
  if (current === 'mine' && code.value.trim() && !confirm(t('confirmReplace'))) {
    $('examples').value = 'mine';
    return;
  }
  stop();
  try {
    if (value === 'demo') {
      setStatus(t('loadingSample', 'demo.muc'));
      clearFiles();
      setSource(await (await fetch('demo.muc')).text());
      sourceName = 'DEMO.MUC';
    } else {
      const [, gi, si] = value.split(':').map(Number);
      const g = samples[gi], song = g.songs[si];
      setStatus(t('loadingSample', song));
      const res = await fetch(g.dir + encodeURIComponent(song));
      if (!res.ok) throw new Error(`${res.status} ${song}`);
      clearFiles();
      setSource(decodeText(await res.arrayBuffer()));
      sourceName = song;
      for (const name of referencedFiles()) {
        const r = await fetch(g.dir + encodeURIComponent(name));
        if (r.ok) attach(name, await r.arrayBuffer());
      }
    }
    current = value;
    $('examples').value = value;
    setStatus(engineReady ? t('ready') : t('loading'));
  } catch (e) {
    setStatus(t('sampleFailed') + e.message, true);
  }
}
$('examples').addEventListener('change', (e) => loadExample(e.target.value));

// ---------- open / save / drop ----------
$('open').addEventListener('click', () => $('openInput').click());
$('openInput').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (f) openMuc(f.name, await f.arrayBuffer());
  e.target.value = '';
});

let sourceName = 'SONG.MUC';
function openMuc(name, buffer) {
  stop();
  sourceName = name;
  setSource(decodeText(buffer));
  current = 'mine';
  $('examples').value = 'mine';
}

let encodeId = 0;
const pendingEncodes = new Map();
function saveMuc() {
  const text = code.value.replace(/\r?\n/g, '\r\n');
  if (!engineReady) { download(sourceName, new TextEncoder().encode(text), 'text/plain'); return; }
  const id = ++encodeId;
  pendingEncodes.set(id, (bytes) => download(sourceName, bytes, 'application/octet-stream'));
  worker.postMessage({ type: 'encode', id, text });
}
$('save').addEventListener('click', saveMuc);

let dragDepth = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('drop').classList.add('on'); });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop').classList.remove('on'); } });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragDepth = 0;
  $('drop').classList.remove('on');
  for (const f of e.dataTransfer.files) {
    const data = await f.arrayBuffer();
    if (/\.muc$/i.test(f.name)) openMuc(f.name, data); else attach(f.name, data);
  }
});

// ---------- engine ----------
const worker = new Worker('engine-worker.js', { type: 'module' });
let engineReady = false;
let pendingPlay = false;

worker.onmessage = (e) => {
  const m = e.data;
  switch (m.type) {
    case 'ready':
      engineReady = true;
      setStatus(t('ready'));
      if (pendingPlay) { pendingPlay = false; play(); }
      break;
    case 'compiled':
      lastResult = m.result;
      renderMessages(m.result);
      if (!m.result.ok) {
        setStatus(t('compileFailed'), true);
        $('nowTitle').textContent = '—';
        $('nowMeta').textContent = '';
        const first = m.result.errors.map(messagePosition).find(Boolean);
        if (first) goToRow(first.row, first.col);
      } else {
        setStatus(t('compiled', m.result.ms, m.result.size));
      }
      break;
    case 'started':
      $('nowTitle').textContent = m.info.title || sourceName;
      $('nowMeta').textContent = [m.info.composer, m.info.chips].filter(Boolean).join(' · ');
      setStatus(`${t('playing')} · ${statusEl.textContent}`);
      playing = true;
      loopCount = 0;
      break;
    case 'loop':
      loopCount = m.loop;
      break;
    case 'encoded':
      pendingEncodes.get(m.id)?.(new Uint8Array(m.data));
      pendingEncodes.delete(m.id);
      break;
    case 'error':
      setStatus(m.message, true);
      if (!engineReady) setStatus(t('loadFailed') + m.message, true);
      break;
  }
};
worker.onerror = (e) => setStatus(t('loadFailed') + (e.message || 'worker error'), true);
worker.postMessage({ type: 'boot', language: lang === 'ja' ? 'ja' : 'en' });

// ---------- audio ----------
let ctx = null, node = null, gain = null, analyser = null;
let playing = false, loopCount = 0, underruns = 0;

async function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') await ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE, latencyHint: 'playback' });
  await ctx.audioWorklet.addModule('pcm-worklet.js');
  node = new AudioWorkletNode(ctx, 'pcm-player', { numberOfInputs: 0, outputChannelCount: [2] });
  gain = ctx.createGain();
  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  node.connect(gain).connect(analyser).connect(ctx.destination);
  setVolume();
  const channel = new MessageChannel();
  node.port.postMessage({ type: 'enginePort', port: channel.port1 }, [channel.port1]);
  worker.postMessage({ type: 'audioPort', port: channel.port2 }, [channel.port2]);
  node.port.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'progress') {
      showClock(m.frames);
      if (m.underruns > underruns + 3 && m.playing) setStatus(t('underrun'));
      underruns = m.underruns;
    } else if (m.type === 'ended') {
      showClock(m.frames);
      playing = false;
      setStatus(t('ended'));
    }
  };
  drawScope();
}

function showClock(frames) {
  const s = frames / SAMPLE_RATE;
  const text = `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  clockEl.textContent = loopCount > 0 ? `${text} · ${t('loop', loopCount)}` : text;
}

function setVolume() {
  const v = +$('volume').value / 100;
  if (gain) gain.gain.value = v * v;
  store.set(STORE_VOLUME, $('volume').value);
}
$('volume').addEventListener('input', setVolume);

async function play() {
  if (!engineReady) { pendingPlay = true; setStatus(t('loading')); return; }
  try {
    await ensureAudio();
  } catch (e) {
    setStatus(t('audioFailed') + e.message, true);
    return;
  }
  flushSave();
  underruns = 0;
  loopCount = 0;
  showClock(0);
  setStatus(t('compiling'));
  worker.postMessage({ type: 'compile', text: code.value, play: true });
}

function stop() {
  pendingPlay = false;
  if (!engineReady) return;
  worker.postMessage({ type: 'stop' });
  if (playing) setStatus(t('stopped'));
  playing = false;
}

$('play').addEventListener('click', play);
$('stop').addEventListener('click', stop);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); play(); }
  else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveMuc(); }
  else if (e.key === 'Escape') { stop(); }
});

function drawScope() {
  const canvas = $('scope');
  const g = canvas.getContext('2d');
  const data = new Float32Array(analyser.fftSize);
  const frame = () => {
    const w = canvas.width, h = canvas.height;
    g.clearRect(0, 0, w, h);
    analyser.getFloatTimeDomainData(data);
    g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--scope').trim() || '#1f5f7a';
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < w; i++) {
      const v = data[Math.floor(i * data.length / w)];
      const y = h / 2 - v * h * 0.9;
      if (i === 0) g.moveTo(i, y); else g.lineTo(i, y);
    }
    g.stroke();
    requestAnimationFrame(frame);
  };
  frame();
}

// ---------- start ----------
{
  const savedVolume = store.get(STORE_VOLUME);
  if (savedVolume !== null) $('volume').value = savedVolume;
  // Restore your text synchronously so nothing loaded later can overwrite what you type.
  const saved = store.get(STORE_SOURCE);
  if (saved && saved.trim()) setSource(saved);
  else renderGutter();
  applyLanguage();
  if (!engineReady) setStatus(t('loading'));
  (async () => {
    try { samples = await (await fetch('samples.json')).json(); } catch { samples = []; }
    if (!code.value) {
      const demo = await (await fetch('demo.muc')).text();
      if (!code.value) {   // still untouched while the demo was loading
        setSource(demo);
        sourceName = 'DEMO.MUC';
        current = 'demo';
      }
    }
    buildExamples();
  })();
}
