// MUCPlayground page logic: editor, examples, attached files and audio plumbing.
// The engine itself runs in engine-worker.js; audio is played by pcm-worklet.js.

import { Highlighter, suggestionsAt, PART_LETTERS, PART_COLORS } from './editor-assist.js';
import { explain, readableText } from './diagnostics.js';
import { ChannelView, SCALES, DEFAULT_SCALE, gunzipIfNeeded } from './chview/channel-view.js';

const SAMPLE_RATE = 44100;
const STORE_SOURCE = 'mucplayground.source';
const STORE_SONG = 'mucplayground.song';      // { name, current }: what the editor holds
const STORE_LANG = 'mucplayground.lang';
const STORE_VOLUME = 'mucplayground.volume';
const STORE_FONT = 'mucplayground.fontSize';
const STORE_SPLIT = 'mucplayground.split';

const T = {
  en: {
    back: '← MUCOMSX', tagline: 'Write MUCOM88 MML, hear it right away',
    play: '▶ Play', stop: '■ Stop', volume: 'Volume', examples: 'Examples', open: 'Open…',
    addFiles: 'Add voice / PCM', save: 'Save', nowPlaying: 'Now playing', messages: 'Compiler messages',
    files: 'Voice / PCM files', filesHint: 'Files named by #voice or #pcm. Add them with the button, or drop them on the page.',
    reference: 'Quick reference', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'Rhythm (v needs 7 values)',
    refPcm: 'ADPCM (needs #pcm)', refScc: 'SCC 1–5, waves @W0:{…}', refTempo: 'Tempo in BPM / raw Timer-B', refOctave: 'Octave, up, down',
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
    channelView: '▦ Channels', channelViewTip: 'Channel view (MDPlayer4Mac style) / editor', split: 'Split', splitOff: 'One view', splitSide: 'Two views, side by side',
    splitStack: 'Two views, one above the other', zoom: 'Size', zoomFit: 'Fit',
    cvEmpty: 'Play a song to see its chips here, as in MDPlayer.', cvOther: 'No channel view for: ',
    recovered: (n) => `Attached ${n} again from the Samples folder.`,
  },
  ko: {
    back: '← MUCOMSX', tagline: 'MUCOM88 MML을 쓰고 바로 들어보기',
    play: '▶ 재생', stop: '■ 정지', volume: '음량', examples: '예제', open: '열기…',
    addFiles: '음색 / PCM 추가', save: '저장', nowPlaying: '재생 중', messages: '컴파일 메시지',
    files: '음색 / PCM 파일', filesHint: '#voice, #pcm으로 지정한 파일입니다. 버튼으로 추가하거나 페이지에 끌어다 놓으세요.',
    reference: '빠른 참조', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: '리듬 (v는 값 7개)',
    refPcm: 'ADPCM (#pcm 필요)', refScc: 'SCC 1–5, 파형 @W0:{…}', refTempo: '템포 BPM / Timer-B 값', refOctave: '옥타브, 올림, 내림',
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
    channelView: '▦ 채널 뷰', channelViewTip: '채널 뷰(MDPlayer4Mac 방식) / 에디터 전환', split: '분할', splitOff: '하나로 보기', splitSide: '좌우로 나눠 보기',
    splitStack: '위아래로 나눠 보기', zoom: '크기', zoomFit: '화면 맞춤',
    cvEmpty: '곡을 재생하면 MDPlayer처럼 칩별 채널이 여기에 표시됩니다.', cvOther: '채널 뷰가 없는 칩: ',
    recovered: (n) => `${n}을(를) Samples 폴더에서 다시 첨부했습니다.`,
  },
  ja: {
    back: '← MUCOMSX', tagline: 'MUCOM88のMMLを書いて、すぐに聴く',
    play: '▶ 再生', stop: '■ 停止', volume: '音量', examples: 'サンプル', open: '開く…',
    addFiles: '音色 / PCMを追加', save: '保存', nowPlaying: '再生中', messages: 'コンパイルメッセージ',
    files: '音色 / PCMファイル', filesHint: '#voice・#pcmで指定したファイルです。ボタンで追加するか、ページにドロップしてください。',
    reference: 'クイックリファレンス', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'リズム（vは7つの値）',
    refPcm: 'ADPCM（#pcmが必要）', refScc: 'SCC 1–5、波形 @W0:{…}', refTempo: 'テンポ BPM / Timer-B値', refOctave: 'オクターブ、上げ、下げ',
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
    channelView: '▦ チャンネル', channelViewTip: 'チャンネルビュー（MDPlayer4Mac風）/ エディタの切り替え', split: '分割', splitOff: '1画面', splitSide: '左右に分割',
    splitStack: '上下に分割', zoom: 'サイズ', zoomFit: '画面に合わせる',
    cvEmpty: '曲を再生すると、MDPlayerのようにチップごとのチャンネルがここに表示されます。', cvOther: 'チャンネルビューのないチップ: ',
    recovered: (n) => `${n}をSamplesフォルダーから再び添付しました。`,
  },
};

const $ = (id) => document.getElementById(id);
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
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', el.title); });
  $('chview').dataset.empty = t('cvEmpty');
  if (SCALES[zoomIndex] === 'fit') $('cvZoom').textContent = t('zoomFit');
  $('chview').dataset.other = t('cvOther');
  if (!channelView.panels.length && !$('chview').querySelector('canvas')) channelView.empty();
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
// The editor can show the text twice (side by side or one above the other) to work on two
// places of a long song at once. Each pane draws its own line numbers, colouring, marks
// and playback highlights; typing in either changes both. `pane` is the one last used.
class Pane {
  constructor(root) {
    this.root = root;
    this.code = root.querySelector('textarea');
    this.gutter = root.querySelector('.gutter');
    this.marks = root.querySelector('.marks');
    this.trace = root.querySelector('.trace');
    this.area = root.querySelector('.code-area');
    this.highlighter = new Highlighter(root.querySelector('.hl code'));
    this.holdUntil = 0;     // playback following waits while you scroll or type here
  }
  get visible() { return !this.root.hidden; }
}
const panes = [new Pane($('paneA')), new Pane($('paneB'))];
let pane = panes[0];
const code = panes[0].code;   // both panes hold the same text; this one always exists
const shownPanes = () => panes.filter((p) => p.visible);
let splitMode = 'off';

let markRows = new Map();   // row -> 'err' | 'warn'
let markSpots = [];         // { row, col, kind } for the wavy underline
let pickedMark = null;      // { row, kind }: the message last clicked, drawn as a red / yellow line

function lineCount() { let n = 1; for (let i = 0; i < code.value.length; i++) if (code.value.charCodeAt(i) === 10) n++; return n; }

function renderGutter() {
  const n = lineCount();
  let html = '';
  for (let i = 1; i <= n; i++) {
    const m = markRows.get(i);
    html += m ? `<span class="${m}">${i}</span>` : `<span>${i}</span>`;
  }
  for (const p of shownPanes()) p.gutter.innerHTML = html;
  renderMarks();
}

function renderMarks() {
  for (const p of shownPanes()) {
    const style = getComputedStyle(p.code);
    const lh = parseFloat(style.lineHeight) || 20;
    const pad = parseFloat(style.paddingTop) || 12;
    let html = '';
    for (const [row, kind] of markRows) {
      html += `<div class="${kind}" style="top:${pad + (row - 1) * lh - p.code.scrollTop}px"></div>`;
    }
    if (pickedMark) {
      html += `<div class="picked ${pickedMark.kind}" style="top:${pad + (pickedMark.row - 1) * lh - p.code.scrollTop}px"></div>`;
    }
    // A wavy underline under the word the compiler points at (its column counts Shift-JIS bytes).
    for (const m of markSpots) {
      const line = lines[m.row - 1];
      if (line === undefined) continue;
      const start = charIndex(line, Math.max(0, m.col - 1));
      const word = /^\S*/.exec(line.slice(start))[0] || ' ';
      const pt = textPoint(m.row, start, p);
      const w = Math.max(measure.measureText(word).width, 8);
      html += `<span class="squiggle ${m.kind}" style="left:${pt.x}px;top:${pt.y + lh - 4}px;width:${w}px"></span>`;
    }
    p.marks.innerHTML = html;
    p.gutter.scrollTop = p.code.scrollTop;
  }
}

// Pixel position of a character in a pane, relative to its code area.
function textPoint(row, charIdx, p = pane) {
  const style = getComputedStyle(p.code);
  measure.font = style.font;
  const lh = parseFloat(style.lineHeight) || 20;
  const line = lines[row - 1] || '';
  return {
    x: (parseFloat(style.paddingLeft) || 14) + measure.measureText(expandTabs(line.slice(0, charIdx))).width - p.code.scrollLeft,
    y: (parseFloat(style.paddingTop) || 12) + (row - 1) * lh - p.code.scrollTop,
    lh,
  };
}

function updateCursor() {
  const code = pane.code;
  const before = code.value.slice(0, code.selectionStart);
  const row = before.split('\n').length;
  const col = before.length - before.lastIndexOf('\n');
  $('cursor').textContent = `Ln ${row}, Col ${col}`;
}

function updateBytes() { $('bytes').textContent = t('bytes', new Blob([code.value]).size); }

// `kind` ('err' / 'warn') also marks the row with a red or yellow line, as when a
// compiler message is clicked; the line stays until the text is edited.
function goToRow(row, col = 1, kind = null) {
  if (viewMode === 'channels') setView('editor');
  pickedMark = kind ? { row, kind } : null;
  document.querySelectorAll('#messages li.picked').forEach((li) => li.classList.remove('picked'));
  const code = pane.visible ? pane.code : panes[0].code;
  const lines = code.value.split('\n');
  let pos = 0;
  for (let i = 0; i < row - 1 && i < lines.length; i++) pos += lines[i].length + 1;
  pos += Math.max(0, Math.min((col || 1) - 1, (lines[row - 1] || '').length));
  code.focus();
  code.setSelectionRange(pos, pos);
  const lh = parseFloat(getComputedStyle(code).lineHeight) || 20;
  code.scrollTop = Math.max(0, (row - 1) * lh - code.clientHeight / 3);
  updateCursor();
  renderMarks();
}

let saveTimer = 0, scanTimer = 0;
function onInput(p, e) {
  // Keep the other pane's text, caret and scroll position as they were.
  for (const o of panes) {
    if (o === p || !o.visible || o.code.value === p.code.value) continue;   // a hidden pane catches up in setSplit
    const { scrollTop, scrollLeft, selectionStart, selectionEnd } = o.code;
    o.code.value = p.code.value;
    o.code.setSelectionRange(selectionStart, selectionEnd);
    o.code.scrollTop = scrollTop;
    o.code.scrollLeft = scrollLeft;
  }
  lines = code.value.split('\n');
  scheduleHighlight();
  scheduleCheck();
  if (!suppressSuggest) {
    if (suggest.open) refreshSuggest(false);
    else if (e.inputType === 'insertText' && /^[A-Za-z@*#]$/.test(e.data || '')) refreshSuggest(false);
  }
  traceStale = true;
  clearTrace();
  if (pickedMark) { pickedMark = null; document.querySelectorAll('#messages li.picked').forEach((li) => li.classList.remove('picked')); }
  holdFollow(p);
  renderGutter();
  updateBytes();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { store.set(STORE_SOURCE, code.value); saveSong(); }, 400);
  clearTimeout(scanTimer);
  scanTimer = setTimeout(renderFiles, 400);
  if (current !== 'mine') { current = 'mine'; $('examples').value = 'mine'; }
}
for (const p of panes) {
  p.code.addEventListener('input', (e) => onInput(p, e));
  p.code.addEventListener('scroll', () => {
    renderMarks();
    traceDirty = true;
    p.highlighter.scroll(p.code.scrollLeft, p.code.scrollTop);
    if (p === pane) closeSuggest();
  });
  ['wheel', 'keydown', 'pointerdown'].forEach((ev) => p.code.addEventListener(ev, () => holdFollow(p)));
  ['keyup', 'click', 'select'].forEach((ev) => p.code.addEventListener(ev, updateCursor));
  p.code.addEventListener('focus', () => {
    if (pane !== p) closeSuggest();
    pane = p;
    for (const o of panes) o.root.classList.toggle('focused', o === p && splitMode !== 'off');
    updateCursor();
  });
}
// Don't lose the last keystrokes to the autosave delay when the tab closes.
const saveSong = () => store.set(STORE_SONG, JSON.stringify({ name: sourceName, current }));
const flushSave = () => { clearTimeout(saveTimer); store.set(STORE_SOURCE, code.value); saveSong(); };
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
window.addEventListener('resize', renderMarks);

function setSource(text) {
  for (const p of panes) {
    p.code.value = text;
    p.code.scrollTop = 0;
    p.code.scrollLeft = 0;
    p.highlighter.scroll(0, 0);
  }
  lines = text.split('\n');
  renderHighlight();
  markSpots = [];
  scheduleCheck();
  markRows = new Map();
  renderGutter();
  updateBytes();
  updateCursor();
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
    if (!pos) {
      // Voice messages (W0408 …) name the voice number but no line: point at the voice.
      const voice = /instrument number:\s*(\d+)|FM音色番号\s*(\d+)/i.exec(m.text);
      if (voice) { pos = voiceRow(Number(voice[1] ?? voice[2])); located = !!pos; }
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
      const part = /^((?:MSX)?[A-K][A-K0-9]*|SCC(?:[A-E][0-9]?)+)[ \t]/.exec(line);
      head.querySelector('.where').textContent = t('where', pos.row, pos.col, part ? part[1] : '', located);
      li.dataset.row = pos.row;
      li.addEventListener('click', () => { goToRow(pos.row, pos.col || 1, kind); li.classList.add('picked'); });
      if (pickedMark && pickedMark.row === pos.row && pickedMark.kind === kind) li.classList.add('picked');
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
// Where voice `n` is defined in the song (a line starting with spaces and @n), else the
// first part line that selects it.
function voiceRow(n) {
  const code = (line) => line.replace(/;.*$/, '');
  const at = new RegExp(`@%?${n}(?!\\d)`);
  let i = lines.findIndex((l) => new RegExp(`^\\s+@%?${n}(?!\\d)`).test(code(l)));
  if (i < 0) i = lines.findIndex((l) => /^(?:(?:MSX)?[A-K][A-K0-9]*|SCC(?:[A-E][0-9]?)+)[ \t]/.test(l) && at.test(code(l)));
  if (i < 0) return null;
  const col = code(lines[i]).search(at);
  return { row: i + 1, col: sjisBytes(lines[i].slice(0, col)) + 1 };
}

const sjisBytes = (text) => { let b = 0; for (const ch of text) { const c = ch.charCodeAt(0); b += c < 0x80 || (c >= 0xff61 && c <= 0xff9f) ? 1 : 2; } return b; };

// ---------- attached files ----------
const files = new Map();   // lower-case name -> { name, data:ArrayBuffer }

function referencedFiles() {
  const names = [];
  const re = /^#(voice|pcm|sccvoice)[ \t]+([^\s;]+)/gim;
  let m;
  while ((m = re.exec(code.value))) names.push(m[2].replace(/^"|"$/g, ''));
  return names;
}

// Attached files are also kept in the browser (IndexedDB), so a song restored on the next
// visit comes back with its voice / PCM files and plays as before.
const fileStore = (() => {
  let db = null;
  const open = () => (db ||= new Promise((resolve, reject) => {
    const r = indexedDB.open('mucplayground', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
  const run = async (mode, op) => {
    const store = (await open()).transaction('files', mode).objectStore('files');
    return new Promise((resolve, reject) => {
      const req = op(store);
      store.transaction.oncomplete = () => resolve(req.result);
      store.transaction.onerror = store.transaction.onabort = () => reject(store.transaction.error);
    });
  };
  // Storage can be unavailable (private windows, blocked site data): then files just aren't kept.
  return {
    put: (key, value) => run('readwrite', (s) => s.put(value, key)).catch(() => {}),
    delete: (key) => run('readwrite', (s) => s.delete(key)).catch(() => {}),
    clear: () => run('readwrite', (s) => s.clear()).catch(() => {}),
    all: () => run('readonly', (s) => s.getAll()).catch(() => []),
  };
})();
let fileGeneration = 0;   // bumps when the attached set is replaced, so a late restore stands down

function attach(name, data, keep = true) {
  const base = name.split(/[\\/]/).pop();
  files.set(base.toLowerCase(), { name: base, data });
  worker.postMessage({ type: 'setFile', name: base, data: data.slice(0) });
  if (keep) fileStore.put(base.toLowerCase(), { name: base, data: data.slice(0) });
  renderFiles();
}

function detach(key) {
  const f = files.get(key);
  if (!f) return;
  files.delete(key);
  worker.postMessage({ type: 'removeFile', name: f.name });
  fileStore.delete(key);
  renderFiles();
}

function clearFiles() {
  fileGeneration++;
  files.clear();
  worker.postMessage({ type: 'clearFiles' });
  fileStore.clear();
  renderFiles();
}

// Files a restored song names but that were not kept (for example from before files were
// saved): fetched from the song's Samples folder, or, if exactly one file in Samples has
// that name, from there.
async function recoverMissingFiles() {
  const missing = referencedFiles().filter((n) => !files.has(n.toLowerCase().split(/[\\/]/).pop()));
  if (!missing.length) return;
  const generation = fileGeneration;
  const tree = await readSampleTree(false);
  const dir = current.startsWith('repo:') ? current.slice(5, current.lastIndexOf('/') + 1) : null;
  const found = [];
  for (const ref of missing) {
    const base = ref.split(/[\\/]/).pop().toLowerCase();
    const named = tree.files.filter((f) => f.slice(f.lastIndexOf('/') + 1).toLowerCase() === base);
    const paths = [];
    if (dir) paths.push(tree.files.find((f) => f.toLowerCase() === (dir + ref).toLowerCase()) || dir + ref);
    if (named.length === 1) paths.push(named[0]);
    for (const path of paths) {
      try {
        const data = await fetchRepoFile(path);
        if (generation !== fileGeneration) return;
        attach(ref, data);
        found.push(ref);
        break;
      } catch { /* try the next place */ }
    }
  }
  if (found.length) { setStatus(t('recovered', found.join(', '))); scheduleCheck(); }
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
    saveSong();
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
  saveSong();
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
        if (first) goToRow(first.row, first.col, 'err');
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
      startChannelView(m, source);
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
    case 'chips':
      if (source === cvSource && m.session === cvSession) channelView.push(m.events);
      break;
    case 'levels':
      if (source === cvSource && m.session === cvSession) channelView.pushLevels(m.events);
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
      channelView.stop();
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
  const editor = $('panes');
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
  await filesRestored;
  try {
    await ensureAudio();
  } catch (e) {
    setStatus(t('audioFailed') + e.message, true);
    return;
  }
  flushSave();
  stop();
  if (autoChannels) setView('editor');
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
  channelView.stop();
  cvSession = -1;
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
  setView('channels', true);
  if (kind === 'mub') {
    if (!engineReady) { pendingPlay = false; pendingFile = { name, data }; setStatus(t('loading')); return; }
    active = 'muc';
    worker.postMessage({ type: 'playFile', data: data.slice(0) });
  } else {
    try { vgmForView = await gunzipIfNeeded(new Uint8Array(data)); } catch { vgmForView = null; }
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
let highlightQueued = false;
function renderHighlight() {
  for (const p of shownPanes()) p.highlighter.render(code.value);
}
function scheduleHighlight() {
  if (highlightQueued) return;
  highlightQueued = true;
  requestAnimationFrame(() => { highlightQueued = false; renderHighlight(); });
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
  const code = pane.code;
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
  const code = pane.code;
  const box = $('ac');
  if (box.parentElement !== pane.area) pane.area.appendChild(box);
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
  const code = pane.code;
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

function onEditorKey(e) {
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
}
for (const p of panes) {
  p.code.addEventListener('keydown', onEditorKey);
  p.code.addEventListener('blur', closeSuggest);
  p.code.addEventListener('click', closeSuggest);
}
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
    if (viewMode === 'channels') channelView.update(playedFrame());
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
let followKey = null;
const measure = document.createElement('canvas').getContext('2d');

function partInfo(key) {
  const chip = Math.floor(key / 1000), ch = key % 1000, part = Math.floor(ch / 10), page = ch % 10;
  const letter = PART_LETTERS[part] || '?';
  return {
    label: (chip ? `${chip + 1}` : '') + letter + (page ? page : ''),
    color: PART_COLORS[(part + chip * 4) % PART_COLORS.length],
  };
}

function holdFollow(p = pane) { p.holdUntil = performance.now() + 4000; }

function clearTrace() {
  positions.clear();
  for (const p of panes) p.trace.innerHTML = '';
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

// With the editor split, the pane you are working in stays put and the other one follows.
function follow(changed) {
  if (!$('follow').checked || !positions.size) return;
  const key = followKey !== null && positions.has(followKey) ? followKey : Math.min(...positions.keys());
  if (!changed.includes(key)) return;
  const now = performance.now();
  for (const p of splitMode === 'off' ? [panes[0]] : panes.filter((o) => o !== pane)) {
    if (now < p.holdUntil) continue;
    const code = p.code;
    const lh = parseFloat(getComputedStyle(code).lineHeight) || 20;
    const y = (positions.get(key).row - 1) * lh;
    if (y < code.scrollTop || y > code.scrollTop + code.clientHeight - lh * 2) {
      code.scrollTop = Math.max(0, y - code.clientHeight / 3);
    }
  }
}

function renderTrace() {
  for (const pn of shownPanes()) {
    const code = pn.code;
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
    pn.trace.innerHTML = html;
  }
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
      for (const p of panes) p.holdUntil = 0;
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
    saveSong();
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

// ---------- split editor ----------
function setSplit(mode) {
  splitMode = ['side', 'stack'].includes(mode) ? mode : 'off';
  const box = $('panes');
  box.classList.toggle('split-side', splitMode === 'side');
  box.classList.toggle('split-stack', splitMode === 'stack');
  panes[1].root.hidden = splitMode === 'off';
  $('splitter').hidden = splitMode === 'off';
  $('splitter').setAttribute('aria-orientation', splitMode === 'stack' ? 'horizontal' : 'vertical');
  $('splitModes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.split === splitMode)));
  if (splitMode === 'off' && pane === panes[1]) { closeSuggest(); pane = panes[0]; }
  for (const o of panes) o.root.classList.toggle('focused', o === pane && splitMode !== 'off');
  if (panes[1].code.value !== code.value) panes[1].code.value = code.value;
  renderGutter();
  renderHighlight();
  for (const p of panes) p.highlighter.scroll(p.code.scrollLeft, p.code.scrollTop);
  traceDirty = true;
  store.set(STORE_SPLIT, splitMode);
}
$('splitModes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setSplit(b.dataset.split); });

// Drag the bar between the panes to share the space differently; double-click to even it.
$('splitter').addEventListener('pointerdown', (e) => {
  const bar = e.currentTarget;
  bar.setPointerCapture(e.pointerId);
  bar.classList.add('drag');
  const box = $('panes').getBoundingClientRect();
  const move = (ev) => {
    const f = splitMode === 'side' ? (ev.clientX - box.left) / box.width : (ev.clientY - box.top) / box.height;
    $('panes').style.setProperty('--split', `${Math.round(Math.min(0.85, Math.max(0.15, f)) * 1000) / 10}%`);
    renderMarks();
    traceDirty = true;
  };
  const up = () => {
    bar.classList.remove('drag');
    bar.removeEventListener('pointermove', move);
    bar.removeEventListener('pointerup', up);
  };
  bar.addEventListener('pointermove', move);
  bar.addEventListener('pointerup', up);
});
$('splitter').addEventListener('dblclick', () => { $('panes').style.setProperty('--split', '50%'); renderMarks(); traceDirty = true; });

// ---------- channel view ----------
// MDPlayer4Mac's channel view in place of the editor. Playing a .mub or .vgm switches to
// it; while a MUC plays, the button switches between it and the editor.
const channelView = new ChannelView($('chview'));
let viewMode = 'editor';
let autoChannels = false;          // opened by playing a file, so a MUC play returns to the editor
let cvSource = null, cvSession = -1;
let vgmForView = null;             // the (decompressed) VGM that is playing, read for the view

function setView(mode, auto = false) {
  // The channel view always opens fitted to the frame; Size changes it from there.
  if (mode === 'channels' && viewMode !== 'channels') setZoom(DEFAULT_SCALE);
  viewMode = mode === 'channels' ? 'channels' : 'editor';
  autoChannels = viewMode === 'channels' && auto;
  const channels = viewMode === 'channels';
  if (channels) closeSuggest();
  $('panes').hidden = channels;
  $('chview').hidden = !channels;
  $('viewToggle').setAttribute('aria-pressed', String(channels));
  document.querySelectorAll('.editor-foot .ed').forEach((el) => { el.hidden = channels; });
  document.querySelector('.editor-foot .cv').hidden = !channels;
  if (!channels) {
    renderGutter();
    renderHighlight();
    traceDirty = true;
  }
}
$('viewToggle').addEventListener('click', () => setView(viewMode === 'channels' ? 'editor' : 'channels'));

let zoomIndex = DEFAULT_SCALE;
function setZoom(index) {
  zoomIndex = index >= 0 && index < SCALES.length ? index : DEFAULT_SCALE;
  channelView.setScale(SCALES[zoomIndex]);
  $('cvZoom').textContent = SCALES[zoomIndex] === 'fit' ? t('zoomFit') : `${SCALES[zoomIndex]}%`;
}
$('cvZoom').addEventListener('click', () => setZoom((zoomIndex + 1) % SCALES.length));

// "YM2608:0:7987200;AY8910:0:1789773" from the MUC engine.
const parseChipList = (text) => (text || '').split(';').filter(Boolean).map((entry) => {
  const [type, id, clock] = entry.split(':');
  return { type, id: Number(id) || 0, clock: Number(clock) || 0 };
});

function startChannelView(m, source) {
  cvSource = source;
  cvSession = m.session;
  if (source === 'vgm') channelView.start([], [], vgmForView);
  else {
    // The MUC engine names SCC+ in its description; the chip list says K051649 either way.
    const plus = /SCC\+/.test(m.info.chips || '');
    channelView.start(parseChipList(m.info.chipList).map((c) => (c.type === 'K051649' && plus ? { ...c, label: 'K052539' } : c)));
  }
}

// ---------- start ----------
{
  const savedVolume = store.get(STORE_VOLUME);
  if (savedVolume !== null) $('volume').value = savedVolume;
  const savedFont = store.get(STORE_FONT);
  if (savedFont !== null) setFontSize(savedFont);
  setZoom(DEFAULT_SCALE);
  // Restore your text synchronously so nothing loaded later can overwrite what you type.
  const saved = store.get(STORE_SOURCE);
  if (saved && saved.trim()) {
    setSource(saved);
    try {
      const song = JSON.parse(store.get(STORE_SONG) || 'null');
      if (song?.name) sourceName = song.name;
      if (typeof song?.current === 'string' && song.current !== 'demo') current = song.current;
    } catch { /* keep the defaults */ }
  } else renderGutter();
  setSplit(store.get(STORE_SPLIT) || 'off');
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

// The voice / PCM files that went with the restored song. Play waits for this.
const filesRestored = (async () => {
  const generation = fileGeneration;
  const kept = await fileStore.all();
  if (generation !== fileGeneration) return;
  for (const f of kept) if (f && f.name && f.data && !files.has(f.name.toLowerCase())) attach(f.name, f.data, false);
  if (kept.length) scheduleCheck();
  try { await recoverMissingFiles(); } catch { /* listed as not attached */ }
})();
