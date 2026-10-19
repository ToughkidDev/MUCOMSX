// MUCPlayground page logic: editor, examples, attached files and audio plumbing.
// The engine itself runs in engine-worker.js; audio is played by pcm-worklet.js.

import { Highlighter, suggestionsAt, PART_LETTERS, PART_COLORS } from './editor-assist.js';
import { explain, readableText } from './diagnostics.js';

const SAMPLE_RATE = 44100;
const STORE_SOURCE = 'mucplayground.source';
const STORE_LANG = 'mucplayground.lang';
const STORE_VOLUME = 'mucplayground.volume';
const STORE_FONT = 'mucplayground.fontSize';

const T = {
  en: {
    back: '← MUCOMSX', tagline: 'Write MUCOM88 MML, hear it right away',
    play: '▶ Play', stop: '■ Stop', volume: 'Volume', examples: 'Examples', open: 'Open…',
    addFiles: 'Add voice / PCM', save: 'Save', nowPlaying: 'Now playing', messages: 'Compiler messages',
    files: 'Voice / PCM files', filesHint: 'Files named by #voice or #pcm. Add them with the button, or drop them on the page.',
    reference: 'Quick reference', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'Rhythm (v needs 7 values)',
    refPcm: 'ADPCM (needs #pcm)', refTempo: 'Tempo in BPM / raw Timer-B', refOctave: 'Octave, up, down',
    refLength: 'Default length, length, clocks', refVoice: 'Volume, voice', refLoop: 'Repeat, song loop point',
    refComment: 'Comment', manual: 'Full MML guide:',
    credit1: "Compiler, driver and chip emulation are MDPlayer4Mac's, built for the browser: mucomDotNET by kuma4649 and MDSound. GPL-3.0.",
    credit2: 'MUCOM88 © Yuzo Koshiro, CC BY-NC-SA 4.0.', source: 'Source and licenses',
    drop: 'Drop .muc / .mub / .vgm / .vgz to play — voice and PCM files are attached',
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
    saveMub: 'Save .mub', saveVgm: 'Save .vgm', follow: 'Follow playback', exporting: (k) => `Writing .${k}…`,
    exported: (name, n) => `Saved ${name} (${n.toLocaleString()} bytes).`, exportFailed: 'Could not export: ',
    followPart: (p) => `Follow part ${p}`, hintSuggest: 'suggestions', fontSize: 'Text',
    browse: 'Samples…', samplesTitle: 'Samples on GitHub', refresh: 'Refresh', search: 'Search songs…',
    liveSource: (time) => `Live from github.com/ToughkidDev/MUCOMSX (Samples, main branch) · read at ${time}. New files appear as soon as they are committed.`,
    bundledSource: 'GitHub could not be reached, so this is the list built into the page; it may be missing the newest files.',
    loadingList: 'Reading the Samples folder…', noMatch: 'No files match.',
    error: 'Error', warning: 'Warning', counts: (e, w) => `${e} error${e === 1 ? '' : 's'} · ${w} warning${w === 1 ? '' : 's'}`,
    where: (r, c, part, located) => `line ${r}${c > 0 ? `, column ${c}` : ''}${part ? ` · part ${part}` : ''}${located ? ' · found by the playground' : ''}`,
    whatLabel: 'What it means:', fixLabel: 'How to fix:', formLabel: 'Correct form:',
    compileFailedN: (n) => `Could not compile: ${n} error${n === 1 ? '' : 's'}. Details are on the right.`,
    loadingVgm: 'Loading the VGM player (about 6.7 MB, first time only)…', vgmFailed: 'The VGM player could not be loaded: ',
    clickToStart: 'Click anywhere on the page to start the sound (the browser needs a click first).',
    unsupported: (n) => `${n} is not a file this player opens.`, playingFile: (n) => `Playing ${n}`,
  },
  ko: {
    back: '← MUCOMSX', tagline: 'MUCOM88 MML을 쓰고 바로 들어보기',
    play: '▶ 재생', stop: '■ 정지', volume: '음량', examples: '예제', open: '열기…',
    addFiles: '음색 / PCM 추가', save: '저장', nowPlaying: '재생 중', messages: '컴파일 메시지',
    files: '음색 / PCM 파일', filesHint: '#voice, #pcm으로 지정한 파일입니다. 버튼으로 추가하거나 페이지에 끌어다 놓으세요.',
    reference: '빠른 참조', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: '리듬 (v는 값 7개)',
    refPcm: 'ADPCM (#pcm 필요)', refTempo: '템포 BPM / Timer-B 값', refOctave: '옥타브, 올림, 내림',
    refLength: '기본 길이, 길이, 클록', refVoice: '음량, 음색', refLoop: '반복, 곡 루프 지점',
    refComment: '주석', manual: 'MML 전체 설명:',
    credit1: '컴파일러, 드라이버, 칩 에뮬레이션은 MDPlayer4Mac의 것을 브라우저용으로 빌드했습니다: kuma4649의 mucomDotNET, MDSound. GPL-3.0.',
    credit2: 'MUCOM88 © 古代祐三, CC BY-NC-SA 4.0.', source: '소스와 라이선스',
    drop: '.muc / .mub / .vgm / .vgz를 놓으면 재생합니다 — 음색·PCM 파일은 첨부됩니다',
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
    saveMub: '.mub 저장', saveVgm: '.vgm 저장', follow: '재생 위치 따라가기', exporting: (k) => `.${k} 만드는 중…`,
    exported: (name, n) => `${name} 저장 (${n.toLocaleString()} 바이트).`, exportFailed: '내보내지 못했습니다: ',
    followPart: (p) => `${p} 파트 따라가기`, hintSuggest: '명령 제안', fontSize: '글자',
    browse: '샘플…', samplesTitle: 'GitHub의 샘플', refresh: '새로 고침', search: '곡 검색…',
    liveSource: (time) => `github.com/ToughkidDev/MUCOMSX의 Samples 폴더(main)를 ${time}에 직접 읽었습니다. 새 파일은 커밋하는 즉시 나타납니다.`,
    bundledSource: 'GitHub에 접속하지 못해 페이지에 들어 있는 목록을 보여 줍니다. 최신 파일이 빠져 있을 수 있습니다.',
    loadingList: 'Samples 폴더를 읽는 중…', noMatch: '맞는 파일이 없습니다.',
    error: '오류', warning: '경고', counts: (e, w) => `오류 ${e} · 경고 ${w}`,
    where: (r, c, part, located) => `${r}줄${c > 0 ? ` ${c}칸` : ''}${part ? ` · ${part} 파트` : ''}${located ? ' · 플레이그라운드가 찾은 위치' : ''}`,
    whatLabel: '무슨 뜻:', fixLabel: '고치는 법:', formLabel: '올바른 형태:',
    compileFailedN: (n) => `컴파일하지 못했습니다: 오류 ${n}개. 자세한 내용은 오른쪽에 있습니다.`,
    loadingVgm: 'VGM 플레이어를 불러오는 중 (약 6.7 MB, 처음 한 번만)…', vgmFailed: 'VGM 플레이어를 불러오지 못했습니다: ',
    clickToStart: '페이지 아무 곳이나 클릭하면 소리가 나옵니다 (브라우저가 먼저 클릭을 요구합니다).',
    unsupported: (n) => `${n}은(는) 열 수 없는 파일입니다.`, playingFile: (n) => `${n} 재생 중`,
  },
  ja: {
    back: '← MUCOMSX', tagline: 'MUCOM88のMMLを書いて、すぐに聴く',
    play: '▶ 再生', stop: '■ 停止', volume: '音量', examples: 'サンプル', open: '開く…',
    addFiles: '音色 / PCMを追加', save: '保存', nowPlaying: '再生中', messages: 'コンパイルメッセージ',
    files: '音色 / PCMファイル', filesHint: '#voice・#pcmで指定したファイルです。ボタンで追加するか、ページにドロップしてください。',
    reference: 'クイックリファレンス', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'リズム（vは7つの値）',
    refPcm: 'ADPCM（#pcmが必要）', refTempo: 'テンポ BPM / Timer-B値', refOctave: 'オクターブ、上げ、下げ',
    refLength: '基本音長、音長、クロック', refVoice: '音量、音色', refLoop: '繰り返し、曲のループ位置',
    refComment: 'コメント', manual: 'MMLの詳しい説明:',
    credit1: 'コンパイラ・ドライバ・チップエミュレーションはMDPlayer4Macのものをブラウザ向けにビルドしています: kuma4649氏のmucomDotNET、MDSound。GPL-3.0。',
    credit2: 'MUCOM88 © 古代祐三, CC BY-NC-SA 4.0。', source: 'ソースとライセンス',
    drop: '.muc / .mub / .vgm / .vgzをドロップすると再生します — 音色・PCMファイルは添付されます',
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
    saveMub: '.mubを保存', saveVgm: '.vgmを保存', follow: '再生位置を追う', exporting: (k) => `.${k}を作成中…`,
    exported: (name, n) => `${name}を保存しました（${n.toLocaleString()}バイト）。`, exportFailed: '書き出せませんでした: ',
    followPart: (p) => `${p}パートを追う`, hintSuggest: 'コマンド候補', fontSize: '文字',
    browse: 'サンプル…', samplesTitle: 'GitHubのサンプル', refresh: '再読み込み', search: '曲を検索…',
    liveSource: (time) => `github.com/ToughkidDev/MUCOMSXのSamplesフォルダー（main）を${time}に直接読み込みました。新しいファイルはコミットするとすぐ表示されます。`,
    bundledSource: 'GitHubに接続できないため、ページ内蔵の一覧を表示しています。最新のファイルがない場合があります。',
    loadingList: 'Samplesフォルダーを読み込み中…', noMatch: '該当するファイルがありません。',
    error: 'エラー', warning: '警告', counts: (e, w) => `エラー ${e} · 警告 ${w}`,
    where: (r, c, part, located) => `${r}行${c > 0 ? ` ${c}桁` : ''}${part ? ` · ${part}パート` : ''}${located ? ' · プレイグラウンドが特定' : ''}`,
    whatLabel: '意味:', fixLabel: '直し方:', formLabel: '正しい形:',
    compileFailedN: (n) => `コンパイルできません: エラー${n}件。詳細は右側にあります。`,
    loadingVgm: 'VGMプレーヤーを読み込み中（約6.7 MB、初回のみ）…', vgmFailed: 'VGMプレーヤーを読み込めませんでした: ',
    clickToStart: 'ページのどこかをクリックすると音が出ます（ブラウザが最初のクリックを必要とします）。',
    unsupported: (n) => `${n}は開けないファイルです。`, playingFile: (n) => `${n}を再生中`,
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
let markSpots = [];         // { row, col, kind } for the wavy underline

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
  // A wavy underline under the word the compiler points at (its column counts Shift-JIS bytes).
  for (const m of markSpots) {
    const line = lines[m.row - 1];
    if (line === undefined) continue;
    const start = charIndex(line, Math.max(0, m.col - 1));
    const word = /^\S*/.exec(line.slice(start))[0] || ' ';
    const p = textPoint(m.row, start);
    const w = Math.max(measure.measureText(word).width, 8);
    html += `<span class="squiggle ${m.kind}" style="left:${p.x}px;top:${p.y + lh - 4}px;width:${w}px"></span>`;
  }
  marks.innerHTML = html;
  gutter.scrollTop = code.scrollTop;
}

// Pixel position of a character in the editor, relative to the code area.
function textPoint(row, charIdx) {
  const style = getComputedStyle(code);
  measure.font = style.font;
  const lh = parseFloat(style.lineHeight) || 20;
  const line = lines[row - 1] || '';
  return {
    x: (parseFloat(style.paddingLeft) || 14) + measure.measureText(expandTabs(line.slice(0, charIdx))).width - code.scrollLeft,
    y: (parseFloat(style.paddingTop) || 12) + (row - 1) * lh - code.scrollTop,
    lh,
  };
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
code.addEventListener('input', (e) => {
  lines = code.value.split('\n');
  scheduleHighlight();
  scheduleCheck();
  if (!suppressSuggest) {
    if (suggest.open) refreshSuggest(false);
    else if (e.inputType === 'insertText' && /^[A-Za-z@*#]$/.test(e.data || '')) refreshSuggest(false);
  }
  traceStale = true;
  clearTrace();
  holdFollow();
  renderGutter();
  updateBytes();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set(STORE_SOURCE, code.value), 400);
  clearTimeout(scanTimer);
  scanTimer = setTimeout(renderFiles, 400);
  if (current !== 'mine') { current = 'mine'; $('examples').value = 'mine'; }
});
code.addEventListener('scroll', () => { renderMarks(); traceDirty = true; highlighter.scroll(code.scrollLeft, code.scrollTop); closeSuggest(); });
['wheel', 'keydown', 'pointerdown'].forEach((ev) => code.addEventListener(ev, holdFollow));
// Don't lose the last keystrokes to the autosave delay when the tab closes.
const flushSave = () => { clearTimeout(saveTimer); store.set(STORE_SOURCE, code.value); };
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
['keyup', 'click', 'select'].forEach((ev) => code.addEventListener(ev, updateCursor));
window.addEventListener('resize', renderMarks);

function setSource(text) {
  code.value = text;
  lines = text.split('\n');
  highlighter.render(text);
  highlighter.scroll(0, 0);
  markSpots = [];
  scheduleCheck();
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
  markSpots = [];
  const counts = $('msgCount');
  counts.textContent = result.errors.length || result.warnings.length
    ? t('counts', result.errors.length, result.warnings.length) : '';
  counts.className = 'count' + (result.errors.length ? ' err' : result.warnings.length ? ' warn' : '');

  // Each message: severity, code, where, the source line with a caret, the compiler's
  // own words, then what it means and how to fix it.
  const add = (m, kind, index) => {
    const li = document.createElement('li');
    li.className = kind;
    let pos = messagePosition(m);
    let located = false;
    if (!pos && kind === 'err' && index === 0 && result.locatedRow > 0) { pos = { row: result.locatedRow, col: 0 }; located = true; }
    if (!pos && m.code === 'E0519') {
      const row = lines.findIndex((l) => /^#voice\b/i.test(l)) + 1;
      if (row > 0) pos = { row, col: 0 };
    }
    const text = m.text.replace(/^\[(?:row|行):\s*-?\d+\s*(?:column|桁):\s*-?\d+\]\s*/i, '');
    const info = explain({ ...m, text }, lang);
    const head = document.createElement('div');
    head.className = 'm-head';
    head.innerHTML = '<span class="badge"></span><code></code><span class="where"></span>';
    head.querySelector('.badge').textContent = t(kind === 'err' ? 'error' : 'warning');
    head.querySelector('code').textContent = m.code || '';
    if (pos) {
      const line = lines[pos.row - 1] ?? '';
      const part = /^((?:MSX)?[A-K][A-K0-9]*)[ \t]/.exec(line);
      head.querySelector('.where').textContent = t('where', pos.row, pos.col, part ? part[1] : '', located);
      li.dataset.row = pos.row;
      li.addEventListener('click', () => goToRow(pos.row, pos.col || 1));
      if (kind === 'err' || !markRows.has(pos.row)) markRows.set(pos.row, kind);
      if (pos.col > 0) markSpots.push({ row: pos.row, col: pos.col, kind });
    }
    li.appendChild(head);
    const original = document.createElement('p');
    original.className = 'm-text';
    original.textContent = readableText(text);
    li.appendChild(original);
    if (pos) {
      const line = lines[pos.row - 1] ?? '';
      const src = document.createElement('pre');
      src.className = 'm-src';
      const shown = expandTabs(line);
      const caret = pos.col > 0 ? expandTabs(line.slice(0, charIndex(line, pos.col - 1))).length : -1;
      // Long lines: keep the part around the caret in view.
      const from = caret > 48 ? caret - 40 : 0;
      const gutterText = `${pos.row} │ `;
      src.textContent = gutterText + (from ? '…' : '') + shown.slice(from, from + 72) +
        (caret >= 0 ? '\n' + ' '.repeat(gutterText.length + (from ? 1 : 0) + caret - from) + '^' : '');
      li.appendChild(src);
    }
    for (const [label, body] of [['what', info.what], ['fix', info.fix], ['form', info.form]]) {
      if (!body) continue;
      const p = document.createElement('p');
      p.className = 'm-' + label;
      p.innerHTML = '<b></b> <span></span>';
      p.querySelector('b').textContent = t(label + 'Label');
      p.querySelector('span').textContent = body;
      li.appendChild(p);
    }
    list.appendChild(li);
  };
  result.errors.forEach((m, i) => add(m, 'err', i));
  result.warnings.forEach((m, i) => add(m, 'warn', i));
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
  const opt = (value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; sel.appendChild(o); };
  opt('mine', t('yourSong'));
  opt('demo', t('demo'));
  if (current.startsWith('repo:')) opt(current, current.slice(current.lastIndexOf('/') + 1).replace(/\.muc$/i, ''));
  sel.value = [...sel.options].some((o) => o.value === current) ? current : 'mine';
  $('sampleSearch').placeholder = t('search');
}
async function loadExample(value) {
  if (value === current) return;
  if (value === 'mine' || value.startsWith('repo:')) { $('examples').value = current; return; }
  // Only your own text needs protecting; an unedited example can be swapped freely.
  if (current === 'mine' && code.value.trim() && !confirm(t('confirmReplace'))) {
    $('examples').value = 'mine';
    return;
  }
  stop();
  try {
    setStatus(t('loadingSample', 'demo.muc'));
    clearFiles();
    setSource(await (await fetch('demo.muc')).text());
    sourceName = 'DEMO.MUC';
    current = value;
    buildExamples();
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
  if (f) {
    const data = await f.arrayBuffer();
    if (kindOf(f.name, data) === 'muc') openMuc(f.name, data); else playFile(f.name, data);
  }
  e.target.value = '';
});

// What a file is, by its first bytes where they are distinctive, else by its extension.
function kindOf(name, data) {
  const b = new Uint8Array(data, 0, Math.min(4, data.byteLength));
  const magic = String.fromCharCode(...b);
  if (magic === 'Vgm ' || (b[0] === 0x1f && b[1] === 0x8b)) return 'vgm';
  if (/^(MUB8|MUC8|muPb|msPb)$/.test(magic)) return 'mub';
  if (/\.muc$/i.test(name)) return 'muc';
  if (/\.(vgm|vgz)$/i.test(name)) return 'vgm';
  if (/\.mub$/i.test(name)) return 'mub';
  return 'other';
}

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

let exportId = 0;
const pendingExports = new Map();
function exportAs(kind) {
  if (!engineReady) { setStatus(t('loading')); return; }
  const id = ++exportId;
  const name = sourceName.replace(/\.[^.]*$/, '') + (kind === 'vgm' ? '.VGM' : '.MUB');
  pendingExports.set(id, name);
  setStatus(t('exporting', kind));
  worker.postMessage({ type: 'export', id, kind, text: code.value });
}
$('saveMub').addEventListener('click', () => exportAs('mub'));
$('saveVgm').addEventListener('click', () => exportAs('vgm'));

let dragDepth = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('drop').classList.add('on'); });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop').classList.remove('on'); } });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragDepth = 0;
  $('drop').classList.remove('on');
  // Attach voice / PCM files first, so a song dropped together with them finds them.
  let playable = null;
  for (const f of e.dataTransfer.files) {
    const data = await f.arrayBuffer();
    const kind = kindOf(f.name, data);
    if (kind === 'other') attach(f.name, data);
    else if (!playable) playable = { name: f.name, data, kind };
  }
  if (!playable) return;
  if (playable.kind === 'muc') { openMuc(playable.name, playable.data); play(); }
  else playFile(playable.name, playable.data);
});

// ---------- engine ----------
const worker = new Worker('engine-worker.js', { type: 'module' });
let engineReady = false;
let pendingPlay = false;

worker.onmessage = (e) => onEngineMessage(e.data, 'muc');

function onEngineMessage(m, source) {
  switch (m.type) {
    case 'ready':
      if (source === 'vgm') {
        vgmReady = true;
        if (pendingVgm) { connectVgmAudio(); vgmWorker.postMessage({ type: 'playFile', data: pendingVgm }); pendingVgm = null; setStatus(t('playingFile', playingName)); }
        break;
      }
      engineReady = true;
      setStatus(t('ready'));
      if (pendingPlay) { pendingPlay = false; play(); }
      if (pendingFile) { const f = pendingFile; pendingFile = null; playFile(f.name, f.data); }
      break;
    case 'compiled':
      lastResult = m.result;
      renderMessages(m.result);
      if (!m.result.ok) {
        setStatus(t('compileFailedN', m.result.errors.length), true);
        $('nowTitle').textContent = '—';
        $('nowMeta').textContent = '';
        const first = m.result.errors.map(messagePosition).find(Boolean)
          || (m.result.locatedRow > 0 ? { row: m.result.locatedRow, col: 1 } : null);
        if (first) goToRow(first.row, first.col);
      } else {
        setStatus(t('compiled', m.result.ms, m.result.size));
      }
      break;
    case 'started':
      if (source !== active) break;
      $('nowTitle').textContent = m.info.title || playingName || sourceName;
      $('nowMeta').textContent = [m.info.composer, (m.info.chips || '').replace(/=\d+Hz/g, ''), playingName].filter(Boolean).join(' · ');
      if (!playingName) setStatus(`${t('playing')} · ${statusEl.textContent}`);
      if (ctx && ctx.state !== 'running') waitForClick();
      playing = true;
      loopCount = 0;
      traceSession = m.session;
      traceEvents = [];
      traceIndex = 0;
      traceStale = false;
      clockFrames = 0;
      clockAt = ctx ? ctx.currentTime : 0;
      clearTrace();
      break;
    case 'loop':
      if (source === active) loopCount = m.loop;
      break;
    case 'checked':
      // Only the newest check counts; an older one describes text that has since changed.
      if (m.id === checkId) { lastResult = m.result; renderMessages(m.result); }
      break;
    case 'exported': {
      const name = pendingExports.get(m.id);
      pendingExports.delete(m.id);
      if (m.error !== undefined) setStatus(t('exportFailed') + m.error, true);
      else {
        download(name, new Uint8Array(m.data), 'application/octet-stream');
        setStatus(t('exported', name, m.data.byteLength));
      }
      break;
    }
    case 'trace':
      if (m.session === traceSession) for (const v of m.events) traceEvents.push(v);
      break;
    case 'encoded':
      pendingEncodes.get(m.id)?.(new Uint8Array(m.data));
      pendingEncodes.delete(m.id);
      break;
    case 'error':
      if (source === 'vgm' && !vgmReady) setStatus(t('vgmFailed') + m.message, true);
      else if (source === 'muc' && !engineReady) setStatus(t('loadFailed') + m.message, true);
      else setStatus(m.message, true);
      break;
  }
}
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
  node.port.onmessage = (e) => onAudioMessage(e.data, 'muc');
  drawScope();
}

function onAudioMessage(m, source) {
  if (source !== active) return;
  {
    if (m.type === 'progress') {
      clockFrames = m.frames;
      clockAt = m.at ?? ctx.currentTime;
      showClock(m.frames);
      if (m.underruns > underruns + 3 && m.playing) setStatus(t('underrun'));
      underruns = m.underruns;
    } else if (m.type === 'ended') {
      showClock(m.frames);
      playing = false;
      clearTrace();
      setStatus(t('ended'));
    }
  }
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

// Editor text size. Everything drawn over the text (line numbers, colouring, error marks,
// playback highlights, suggestions) reads the editor's font, so it all follows.
function setFontSize(value) {
  const size = Math.min(24, Math.max(10, Number(value) || 13.5));
  const editor = document.querySelector('.editor');
  editor.style.fontSize = `${size}px`;
  editor.style.setProperty('--lh', `${Math.round(size * 1.48)}px`);
  $('fontSize').value = size;
  $('fontSizeOut').textContent = size.toFixed(1);
  closeSuggest();
  renderMarks();
  traceDirty = true;
  store.set(STORE_FONT, String(size));
}
$('fontSize').addEventListener('input', (e) => setFontSize(e.target.value));

async function play() {
  if (!engineReady) { pendingPlay = true; setStatus(t('loading')); return; }
  try {
    await ensureAudio();
  } catch (e) {
    setStatus(t('audioFailed') + e.message, true);
    return;
  }
  flushSave();
  stop();
  active = 'muc';
  playingName = '';
  underruns = 0;
  loopCount = 0;
  showClock(0);
  setStatus(t('compiling'));
  worker.postMessage({ type: 'compile', text: code.value, play: true });
}

function stop() {
  pendingPlay = false;
  pendingFile = null;
  pendingVgm = null;
  if (vgmWorker && vgmReady) vgmWorker.postMessage({ type: 'stop' });
  if (!engineReady) return;
  worker.postMessage({ type: 'stop' });
  if (playing) setStatus(t('stopped'));
  playing = false;
  clearTrace();
}

// ---------- playing .mub / .vgm files ----------
// A .mub plays on the editor's engine; a .vgm/.vgz on a second engine that is only
// downloaded the first time it is needed. Only one plays at a time.
let vgmWorker = null, vgmReady = false, vgmNode = null, pendingVgm = null;
let active = 'muc';          // which engine's audio the clock and status follow
let playingName = '';

function bootVgm() {
  if (vgmWorker) return;
  setStatus(t('loadingVgm'));
  vgmWorker = new Worker('engine-worker.js?engine=vgm', { type: 'module' });
  vgmWorker.onmessage = (e) => onEngineMessage(e.data, 'vgm');
  vgmWorker.onerror = (e) => setStatus(t('vgmFailed') + (e.message || 'worker error'), true);
  vgmWorker.postMessage({ type: 'boot', language: 'en' });
}

function connectVgmAudio() {
  if (vgmNode || !ctx) return;
  vgmNode = new AudioWorkletNode(ctx, 'pcm-player', { numberOfInputs: 0, outputChannelCount: [2] });
  vgmNode.connect(gain);
  const channel = new MessageChannel();
  vgmNode.port.postMessage({ type: 'enginePort', port: channel.port1 }, [channel.port1]);
  vgmWorker.postMessage({ type: 'audioPort', port: channel.port2 }, [channel.port2]);
  vgmNode.port.onmessage = (e) => onAudioMessage(e.data, 'vgm');
}

async function playFile(name, data) {
  const kind = kindOf(name, data);
  if (kind !== 'mub' && kind !== 'vgm') { setStatus(t('unsupported', name), true); return; }
  try { await ensureAudio(); } catch (e) { setStatus(t('audioFailed') + e.message, true); return; }
  stop();
  playingName = name;
  underruns = 0;
  loopCount = 0;
  showClock(0);
  if (kind === 'mub') {
    if (!engineReady) { pendingPlay = false; pendingFile = { name, data }; setStatus(t('loading')); return; }
    active = 'muc';
    worker.postMessage({ type: 'playFile', data: data.slice(0) });
  } else {
    bootVgm();
    active = 'vgm';
    if (!vgmReady) { pendingVgm = data.slice(0); return; }
    connectVgmAudio();
    vgmWorker.postMessage({ type: 'playFile', data: data.slice(0) });
  }
  setStatus(t('playingFile', name));
  if (ctx.state !== 'running') waitForClick();
}
let pendingFile = null;

// Autoplay rules: a page that has not been clicked yet cannot start sound, and a drop
// does not count as a click. Start on the next click or key instead.
function waitForClick() {
  setStatus(t('clickToStart'));
  const resume = () => {
    ctx.resume().then(() => setStatus(t('playingFile', playingName || sourceName)));
    window.removeEventListener('pointerdown', resume, true);
    window.removeEventListener('keydown', resume, true);
  };
  window.addEventListener('pointerdown', resume, true);
  window.addEventListener('keydown', resume, true);
}

$('play').addEventListener('click', play);
$('stop').addEventListener('click', stop);

// ---------- colouring, suggestions and checking while typing ----------
const highlighter = new Highlighter($('hl'));
let highlightQueued = false;
function scheduleHighlight() {
  if (highlightQueued) return;
  highlightQueued = true;
  requestAnimationFrame(() => { highlightQueued = false; highlighter.render(code.value); });
}

let checkTimer = 0, checkId = 0;
function scheduleCheck() {
  clearTimeout(checkTimer);
  checkTimer = setTimeout(() => {
    if (!engineReady || !code.value.trim()) return;
    worker.postMessage({ type: 'check', id: ++checkId, text: code.value });
  }, 700);
}

const suggest = { open: false, items: [], index: 0, prefix: '' };
let suppressSuggest = false;

function refreshSuggest(force) {
  const r = suggestionsAt(code.value, code.selectionStart, lang, force);
  if (!r || !r.items.length) { closeSuggest(); return; }
  Object.assign(suggest, { open: true, items: r.items, index: 0, prefix: r.prefix });
  renderSuggest();
}

function closeSuggest() {
  if (!suggest.open) return;
  suggest.open = false;
  $('ac').hidden = true;
}

function renderSuggest() {
  const box = $('ac');
  const list = box.querySelector('ul');
  list.innerHTML = '';
  suggest.items.slice(0, 40).forEach((item, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === suggest.index));
    li.innerHTML = '<b></b><span></span>';
    li.querySelector('b').textContent = item.label;
    li.querySelector('span').textContent = item.sig || item.desc;
    li.addEventListener('mousedown', (e) => { e.preventDefault(); suggest.index = i; acceptSuggest(); });
    list.appendChild(li);
  });
  box.querySelector('p').textContent = suggest.items[suggest.index].desc || '';
  // Under the caret, or above it when there is no room below.
  const before = code.value.slice(0, code.selectionStart);
  const row = before.split('\n').length;
  const col = before.length - before.lastIndexOf('\n') - 1 - suggest.prefix.length;
  const pt = textPoint(row, Math.max(0, col));
  box.hidden = false;
  const area = box.parentElement;
  const below = pt.y + pt.lh + 4;
  box.style.left = `${Math.max(4, Math.min(pt.x, area.clientWidth - box.offsetWidth - 4))}px`;
  box.style.top = `${below + box.offsetHeight > area.clientHeight ? Math.max(4, pt.y - box.offsetHeight - 4) : below}px`;
  list.children[suggest.index]?.scrollIntoView({ block: 'nearest' });
}

function acceptSuggest() {
  const item = suggest.items[suggest.index];
  closeSuggest();
  if (!item) return;
  const end = code.selectionStart;
  const start = end - suggest.prefix.length;
  const caretAt = item.insert.indexOf('$0');
  const text = item.insert.replace('$0', '');
  suppressSuggest = true;
  code.setSelectionRange(start, end);
  // execCommand keeps the browser's own undo history; setRangeText is the fallback.
  if (!document.execCommand('insertText', false, text)) {
    code.setRangeText(text, start, end, 'end');
    code.dispatchEvent(new Event('input'));
  }
  suppressSuggest = false;
  if (caretAt >= 0) code.setSelectionRange(start + caretAt, start + caretAt);
  updateCursor();
}

code.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'Space') { e.preventDefault(); refreshSuggest(true); return; }
  if (!suggest.open) return;
  const n = Math.min(suggest.items.length, 40);
  if (e.key === 'ArrowDown') { e.preventDefault(); suggest.index = (suggest.index + 1) % n; renderSuggest(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); suggest.index = (suggest.index + n - 1) % n; renderSuggest(); }
  else if (e.key === 'Tab') { e.preventDefault(); acceptSuggest(); }
  else if (e.key === 'Enter') {
    // Nothing to add (the command is already typed in full): let Enter make a new line.
    const item = suggest.items[suggest.index];
    if (item && item.insert === suggest.prefix) { closeSuggest(); return; }
    e.preventDefault();
    acceptSuggest();
  }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSuggest(); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') closeSuggest();
});
code.addEventListener('blur', closeSuggest);
code.addEventListener('click', closeSuggest);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); play(); }
  else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveMuc(); }
  else if (e.key === 'Escape' && !$('samplesDlg').open) { stop(); }
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
    updateTrace();
    requestAnimationFrame(frame);
  };
  frame();
}

// ---------- playback position highlighting ----------
// The engine reports, per part, which command in the source it is playing and at which
// audio frame. Those are applied when that frame is actually heard.
let lines = [];
let traceSession = -1, traceEvents = [], traceIndex = 0, traceStale = false, traceDirty = false;
let clockFrames = 0, clockAt = 0;
const positions = new Map();     // channel key -> { row, col, len }
let followKey = null, followHoldUntil = 0;
const measure = document.createElement('canvas').getContext('2d');

function partInfo(key) {
  const chip = Math.floor(key / 1000), ch = key % 1000, part = Math.floor(ch / 10), page = ch % 10;
  const letter = PART_LETTERS[part] || '?';
  return {
    label: (chip ? `${chip + 1}` : '') + letter + (page ? page : ''),
    color: PART_COLORS[(part + chip * 4) % PART_COLORS.length],
  };
}

function holdFollow() { followHoldUntil = performance.now() + 4000; }

function clearTrace() {
  positions.clear();
  $('trace').innerHTML = '';
  renderParts();
}

// Compiler columns count Shift-JIS bytes; convert to a character index in the line.
function charIndex(line, bytes) {
  let b = 0, i = 0;
  while (i < line.length && b < bytes) {
    const c = line.charCodeAt(i);
    b += c < 0x80 || (c >= 0xff61 && c <= 0xff9f) ? 1 : 2;
    i++;
  }
  return i;
}

function expandTabs(text) {
  let out = '';
  for (const ch of text) out += ch === '\t' ? ' '.repeat(4 - (out.length % 4)) : ch;
  return out;
}

function tokenAt(p) {
  const line = lines[p.row - 1] || '';
  const start = charIndex(line, p.col - 1);
  const end = Math.max(start + 1, charIndex(line, p.col - 1 + Math.max(1, p.len)));
  return { line, start, end, text: line.slice(start, end) };
}

function playedFrame() {
  if (!ctx) return 0;
  const latency = ctx.outputLatency || ctx.baseLatency || 0;
  const ahead = (ctx.currentTime - clockAt - latency) * SAMPLE_RATE;
  return clockFrames + Math.min(ahead, SAMPLE_RATE * 0.25);
}

function updateTrace() {
  if (!playing || traceStale) return;
  const now = playedFrame();
  const changed = [];
  while (traceIndex + 4 < traceEvents.length && traceEvents[traceIndex] <= now) {
    const key = traceEvents[traceIndex + 1];
    positions.set(key, { row: traceEvents[traceIndex + 2], col: traceEvents[traceIndex + 3], len: traceEvents[traceIndex + 4] });
    changed.push(key);
    traceIndex += 5;
  }
  if (traceIndex > 50000) { traceEvents = traceEvents.slice(traceIndex); traceIndex = 0; }
  if (changed.length) { follow(changed); renderParts(); traceDirty = true; }
  if (traceDirty) { traceDirty = false; renderTrace(); }
}

function follow(changed) {
  if (!$('follow').checked || performance.now() < followHoldUntil || !positions.size) return;
  const key = followKey !== null && positions.has(followKey) ? followKey : Math.min(...positions.keys());
  if (!changed.includes(key)) return;
  const lh = parseFloat(getComputedStyle(code).lineHeight) || 20;
  const y = (positions.get(key).row - 1) * lh;
  if (y < code.scrollTop || y > code.scrollTop + code.clientHeight - lh * 2) {
    code.scrollTop = Math.max(0, y - code.clientHeight / 3);
  }
}

function renderTrace() {
  const style = getComputedStyle(code);
  measure.font = style.font;
  const lh = parseFloat(style.lineHeight) || 20;
  const padTop = parseFloat(style.paddingTop) || 12, padLeft = parseFloat(style.paddingLeft) || 14;
  let html = '';
  for (const [key, p] of positions) {
    const tok = tokenAt(p);
    const x = padLeft + measure.measureText(expandTabs(tok.line.slice(0, tok.start))).width - code.scrollLeft;
    const w = Math.max(measure.measureText(tok.text).width, 6);
    const y = padTop + (p.row - 1) * lh - code.scrollTop;
    if (y < -lh || y > code.clientHeight) continue;
    html += `<div style="--c:${partInfo(key).color};left:${x - 1}px;top:${y}px;width:${w + 2}px"></div>`;
  }
  $('trace').innerHTML = html;
}

function renderParts() {
  const list = $('parts');
  list.innerHTML = '';
  for (const key of [...positions.keys()].sort((a, b) => a - b)) {
    const info = partInfo(key);
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.style.setProperty('--c', info.color);
    b.setAttribute('aria-pressed', String(key === followKey));
    b.title = t('followPart', info.label);
    b.innerHTML = '<b></b><code></code>';
    b.querySelector('b').textContent = info.label;
    b.querySelector('code').textContent = tokenAt(positions.get(key)).text.trim();
    b.addEventListener('click', () => {
      followKey = followKey === key ? null : key;
      followHoldUntil = 0;
      renderParts();
    });
    li.appendChild(b);
    list.appendChild(li);
  }
}
window.addEventListener('resize', () => { traceDirty = true; });

// ---------- samples, read live from the repository ----------
// The Samples folder is listed through the GitHub API and files come from
// raw.githubusercontent.com, so songs appear as soon as they are committed, without
// waiting for the Pages build. The list is cached for 10 minutes (the API allows about
// 60 anonymous requests an hour); samples.json is the fallback when GitHub is unreachable.
const REPO = 'ToughkidDev/MUCOMSX', BRANCH = 'main', SAMPLES_ROOT = 'Samples/';
const TREE_URL = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const rawUrl = (path) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path.split('/').map(encodeURIComponent).join('/')}`;
const PLAYABLE = /\.(muc|mub|vgm|vgz)$/i;
let sampleTree = null;   // { live, at, files: [path] }

async function readSampleTree(force) {
  if (!force && sampleTree) return sampleTree;
  if (!force) {
    try {
      const cached = JSON.parse(sessionStorage.getItem('mucplayground.tree') || 'null');
      if (cached && Date.now() - cached.at < 10 * 60 * 1000) return (sampleTree = cached);
    } catch { /* storage unavailable */ }
  }
  try {
    const res = await fetch(TREE_URL, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(res.status);
    const tree = await res.json();
    const files = tree.tree.filter((e) => e.type === 'blob' && e.path.startsWith(SAMPLES_ROOT)).map((e) => e.path);
    sampleTree = { live: true, at: Date.now(), files };
    try { sessionStorage.setItem('mucplayground.tree', JSON.stringify(sampleTree)); } catch { /* ignore */ }
  } catch {
    const files = [];
    for (const g of samples) for (const song of g.songs) files.push(g.dir.replace(/^\.\.\//, '') + song);
    sampleTree = { live: false, at: Date.now(), files };
  }
  return sampleTree;
}

function renderSampleList() {
  const list = $('sampleList');
  const query = $('sampleSearch').value.trim().toLowerCase();
  list.innerHTML = '';
  const groups = new Map();
  for (const path of sampleTree.files) {
    if (!PLAYABLE.test(path) || (query && !path.toLowerCase().includes(query))) continue;
    const dir = path.slice(SAMPLES_ROOT.length, path.lastIndexOf('/'));
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(path);
  }
  if (!groups.size) { list.innerHTML = `<p class="s-empty">${t('noMatch')}</p>`; return; }
  for (const dir of [...groups.keys()].sort()) {
    const d = document.createElement('details');
    d.open = !!query || groups.size <= 3;
    d.innerHTML = '<summary></summary><ul></ul>';
    d.querySelector('summary').innerHTML = '<span></span><small></small>';
    d.querySelector('summary span').textContent = dir || '/';
    d.querySelector('summary small').textContent = groups.get(dir).length;
    for (const path of groups.get(dir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
      const name = path.slice(path.lastIndexOf('/') + 1);
      const li = document.createElement('li');
      li.innerHTML = '<button type="button"><span></span><span class="ext"></span></button>';
      li.querySelector('span').textContent = name.replace(PLAYABLE, '');
      li.querySelector('.ext').textContent = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
      li.querySelector('button').addEventListener('click', () => { $('samplesDlg').close(); loadRepoFile(path); });
      d.querySelector('ul').appendChild(li);
    }
    list.appendChild(d);
  }
}

async function openSamples(force) {
  const dlg = $('samplesDlg');
  if (!dlg.open) dlg.showModal();
  $('sampleSource').textContent = t('loadingList');
  if (force) sampleTree = null;
  await readSampleTree(force);
  $('sampleSource').textContent = sampleTree.live
    ? t('liveSource', new Date(sampleTree.at).toLocaleTimeString()) : t('bundledSource');
  renderSampleList();
  $('sampleSearch').focus();
}
$('browse').addEventListener('click', () => openSamples(false));
$('sampleRefresh').addEventListener('click', () => openSamples(true));
$('sampleClose').addEventListener('click', () => $('samplesDlg').close());
$('sampleSearch').addEventListener('input', renderSampleList);

async function fetchRepoFile(path) {
  // Latest commit first; the Pages copy is the fallback.
  for (const url of [rawUrl(path), '../' + path.split('/').map(encodeURIComponent).join('/')]) {
    try { const r = await fetch(url, { cache: 'no-cache' }); if (r.ok) return await r.arrayBuffer(); } catch { /* next */ }
  }
  throw new Error(path);
}

async function loadRepoFile(path) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  try {
    setStatus(t('loadingSample', name));
    const data = await fetchRepoFile(path);
    if (kindOf(name, data) !== 'muc') { playFile(name, data); return; }
    if (current === 'mine' && code.value.trim() && !confirm(t('confirmReplace'))) { setStatus(engineReady ? t('ready') : t('loading')); return; }
    stop();
    clearFiles();
    setSource(decodeText(data));
    sourceName = name;
    current = 'repo:' + path;
    buildExamples();
    // #voice / #pcm files from the same folder, matched without regard to case.
    const dir = path.slice(0, path.lastIndexOf('/') + 1);
    for (const ref of referencedFiles()) {
      const match = (sampleTree?.files || []).find((f) => f.toLowerCase() === (dir + ref).toLowerCase()) || dir + ref;
      try { attach(ref, await fetchRepoFile(match)); } catch { /* listed as missing */ }
    }
    setStatus(engineReady ? t('ready') : t('loading'));
  } catch (e) {
    setStatus(t('sampleFailed') + e.message, true);
  }
}

// ---------- start ----------
{
  const savedVolume = store.get(STORE_VOLUME);
  if (savedVolume !== null) $('volume').value = savedVolume;
  const savedFont = store.get(STORE_FONT);
  if (savedFont !== null) setFontSize(savedFont);
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
