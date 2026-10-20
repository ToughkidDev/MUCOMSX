// MUCPlayground page logic: editor, examples, attached files and audio plumbing.
// The engine itself runs in engine-worker.js; audio is played by pcm-worklet.js.

import { Highlighter, suggestionsAt, PART_LETTERS, PART_COLORS } from './editor-assist.js';
import { explain, readableText } from './diagnostics.js';
import { silentParts } from './silence-check.js';
import { waveAt, drawWave } from './wave-preview.js';
import { voiceAt, drawVoice, OP_COLORS, ALGS } from './fm-preview.js';
import { WaveEditor } from './wave-editor.js';
import { FmEditor, formatVoice, INIT as INIT_VOICE } from './fm-editor.js';
import { Keyboard } from './keyboard.js';
import { Tracker } from './tracker.js';
import { BankView } from './bank-view.js';
import { mucVoices, voiceLines, writeDat as writeDatSlot, newDat as newDatBytes, readDat, voiceKey, importVoices } from './voice-bank.js';
import { readScwd, writeScwd, isScwd, mucWaves, waveLine, waveKey, waveShape, importWaves } from './scc-bank.js';
import { timeline } from './mml-timeline.js';
import { lineSnippet, playsSomething, partLine } from './line-play.js';
import { ChannelView, SCALES, DEFAULT_SCALE, gunzipIfNeeded } from './chview/channel-view.js';

const SAMPLE_RATE = 44100;
const STORE_SOURCE = 'mucplayground.source';
const STORE_SONG = 'mucplayground.song';      // { name, current }: what the editor holds
const STORE_LANG = 'mucplayground.lang';
const STORE_VOLUME = 'mucplayground.volume';
const STORE_FONT = 'mucplayground.fontSize';
const STORE_UI = 'mucplayground.uiSize';
const STORE_SPLIT = 'mucplayground.split';
const STORE_KEYS = 'mucplayground.keys';      // { open, octave, source }

const T = {
  en: {
    back: '← MUCOMSX', tagline: 'Write MUCOM88 MML, hear it right away',
    play: '▶ Play', stop: '■ Stop', volume: 'Volume', examples: 'Examples', open: 'Open…',
    addFiles: 'Add voice / PCM', save: 'Save', saveTip: 'Save the song to your computer as .muc (Ctrl+S)', nowPlaying: 'Now playing', messages: 'Compiler messages',
    files: 'Voice / PCM files', filesHint: 'Files named by #voice or #pcm. Add them with the button, or drop them on the page.',
    reference: 'Quick reference', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'Rhythm (v needs 7 values)',
    refPcm: 'ADPCM (needs #pcm)', refScc: 'SCC 1–5, waves @W0:{…}', refTempo: 'Tempo in BPM / raw Timer-B', refOctave: 'Octave, up, down',
    refLength: 'Default length, length, clocks', refVoice: 'Volume, voice', refLoop: 'Repeat, song loop point',
    refComment: 'Comment', manual: 'Full MML guide:',
    credit1: "Compiler, driver and chip emulation are MDPlayer4Mac's, built for the browser: MDPlayer4Mac and MUCOMSX by ToughkidCST, mucomDotNET and MDSound by kuma4649. GPL-3.0.",
    credit2: 'MUCOM88 © Yuzo Koshiro, CC BY-NC-SA 4.0.', source: 'Source and licenses',
    drop: 'Drop .muc / .mub / .vgm / .vgz to play — voice and PCM files are attached',
    loading: 'Loading the engine (about 11 MB, first time only)…', ready: 'Ready. Press Play or Ctrl+Enter.',
    loadFailed: 'The engine could not be loaded: ', compiling: 'Compiling…', playing: 'Playing',
    compiled: (ms, size) => `Compiled in ${ms} ms, ${size.toLocaleString()} bytes.`,
    compileFailed: 'Compile error. See the messages on the right.', stopped: 'Stopped.', ended: 'Finished.',
    silentEnv: (p) => `Part ${p} has no @ or E before its first note, so it makes no sound.`,
    silentVol: (p) => `Part ${p} has no v before its first note, so it makes no sound.`,
    sjisLoss: (chars, n) => `${n} kind(s) of character cannot be written in Shift-JIS and will be saved as "?": ${chars}\nMUC files for the MSX can hold English and Japanese only. Save anyway?`,
    waveInfo: (n, e, lo, hi) => `${n}/${e} samples · min ${lo} · max ${hi}`, wave64: ' · played as 32 (averaged)',
    waveCount: (n, e) => `${e} samples are needed; this has ${n}.`, waveRange: 'Samples must be -128 to 127 (shown in red).',
    waveBad: 'Some samples are not numbers (shown in red).', waveOpen: 'The closing } is missing.', waveEdit: '✎ Edit', waveEditTip: 'Edit this wave in the wave editor (Furnace style)', fmEditTip: 'Edit this voice in the FM voice editor (Furnace style)',
    bankTitle: 'Voice bank', bankTip: 'Voice bank: the song\'s FM voices (voice file and MUC) next to the text', bankTo: 'To',
    bankShowEmpty: 'empty slots', bankAdd: 'Add', bankDel: 'Del', bankEdit: 'Edit', bankRename: 'Name', bankImport: 'Import', bankLoad: 'Load', bankSave: 'Save',
    bankAddTip: 'Add a voice (Furnace\'s default) at the first free number, to the voice file or the MUC (To)', bankDelTip: 'Delete the selected voice (Delete)', bankEditTip: 'Edit the selected voice in the FM voice editor (Enter)',
    bankRenameTip: 'Rename the selected voice (six characters, voice file only)', bankToDatTip: 'Move the selected MUC voice into the voice file (same number)', bankToMucTip: 'Copy the selected voice-file voice into the MUC as a definition',
    bankImportTip: 'Take voices from .dat, .muc, .mub, .vgm / .vgz files and add them after the ones there are', bankLoadTip: 'Use a .dat voice file for this song (#voice)', bankSaveTip: 'Download the voice file (made from the MUC\'s voices if there is none)', bankUndoTip: 'Undo the last change to the voice file',
    bankFile_fm: (name, n) => `${name} · ${n} voices`, bankFile_scc: (name, n) => `${name} · ${n} waves`, bankFileMissing: (name) => `${name}: not attached`, bankNoFile_fm: 'no voice file', bankNoFile_scc: 'no wave file',
    bankEmpty_fm: 'No FM voices yet: Add one, Import from a file, or Load a voice file.', bankEmpty_scc: 'No SCC waves yet: Add one, Import from a file (.dat, .muc, .vgm, Furnace), or Load a wave file (SCWD).', bankHint: 'Click a voice to hear it, double-click to write @n at the caret',
    bankSrc_dat: 'DAT', bankSrc_muc: 'MUC', bankSrc_over: 'MUC▸DAT', bankOverTip: 'defined in the MUC too, which wins over the voice file', bankInline: '(in the MUC)',
    bankInMuc: (row) => `defined in the MUC, line ${row}`, bankInDat: (name) => `in ${name}`, bankUses: (n) => `${n} notes use it`, bankUnused: 'not used in the song',
    bankFull: 'All 255 numbers are taken', bankAdded: (n, to) => `${n} added to the ${to}`, bankDelUsed: (n, k) => `${n} is used by ${k} notes. Delete it anyway?`,
    bankDeleted: (n) => `${n} deleted`, bankDelMucKeepDat: (n) => `${n}'s MUC definition deleted; the voice file's ${n} is used again`,
    bankFormText: 'This voice is written in the @% form: edit it in the text', bankRenameDatOnly: 'Only voice-file voices have names', bankRenamePrompt: 'Name (up to six letters or digits)',
    bankToDatNeedsMuc: 'Pick a voice defined in the MUC', bankToMucNeedsDat: 'Pick a voice from the voice file', bankAlreadyMuc: 'The MUC already defines this number',
    bankMovedToDat: (n, name) => `${n} moved into ${name}`, bankCopiedToMuc: (n) => `${n} copied into the MUC`, bankNotDat_fm: (name) => `${name} is not a voice file`, bankNotDat_scc: (name) => `${name} is not an SCC wave file (SCWD)`,
    bankLoaded_fm: (name, n) => `${name}: ${n} voices`, bankLoaded_scc: (name, n) => `${name}: ${n} waves`, bankSavedFromMuc: 'Saved a voice file made from the MUC\'s voices', bankNothingToUndo: 'Nothing to undo',
    bankImported_fm: (n, to) => `${n} voices added to the ${to}`, bankImported_scc: (n, to) => `${n} waves added to the ${to}`, bankImportSame: (n) => `${n} already in the bank`, bankImportFull: (n) => `${n} left out: no free numbers`, bankImportNone_fm: (names) => `no FM voices in ${names}`, bankImportNone_scc: (names) => `no SCC waves in ${names}`,
    trkTitle: 'Tracker', trkTip: 'Tracker mode: the song as a tracker pattern next to the text, edited from either side', trkRow: 'Row',
    trkHint: 'Click a cell and type: Z S X … / Q 2 W … notes, Delete a rest, 1 a note off; hex digits in @ and v; ↑↓←→ PgUp PgDn move, numpad / * octave',
    trkInput: 'Input', trkInputDisplay: 'As shown (C#4, OFF, 0F)', trkInputTracker: 'Quick keys (Z S X / Q 2 W)',
    trkHintDisplay: 'Click a cell and type it as shown: C#4 / D-5 (note, # or -, octave 1–8), OFF, ... (rest); two hex digits in @ and v; Enter edits what is there, Delete a rest',
    trkTypeNote: 'Note: A–G, then # or -, then the octave 1–8 (C#4, D-5); OFF; ... for a rest. Enter takes C as C at the octave shown above', trkTypeHex: (k) => `${k}: two hex digits (00–FF); Enter takes one`,
    trkRest: 'Rest', trkRestTip: 'Make the note in this cell a rest (Delete)', trkOffTip: 'Note off: a rest from this row on', trkKeysTip: 'Open the keys mode piano: its keys write notes here',
    trkParamNote: 'Voice and volume go on a cell where a note starts', trkParamSet: (k, v) => `${k}${v} set`, trkParamNext: (k, v) => `${k}${v}: type a second hex digit for a two-digit value`,
    trkEnded: 'This part ends with : here; write after it in the text', trkMulti: 'this line is written by several parts (e.g. BC): an edit changes all of them',
    trkWhere: (row, tick, len) => `line ${row} · clock ${tick} · length ${len}`, trkShared: 'written once for every repeat / macro use: edits change all of them',
    trkMacro: 'in a macro', trkPastEnd: 'After the end of this part: write more MML there first', trkCannot: 'Tied, portamento and echo notes are edited in the text',
    trkEmpty: 'no parts',
    keysMode: 'Keys', keysTip: 'Keys mode: a piano under the editor, played with the mouse or the computer keyboard',
    keysSource: 'Sound', keysOctave: 'Octave', keysOctDown: 'Octave down (↓)', keysOctUp: 'Octave up (↑)', keysClose: 'Close keys mode',
    keysHintOn: 'Playing from the keyboard: Z S X D C … (lower), Q 2 W 3 E … (upper), ↑↓ octave',
    keysHintOff: 'Click the keys to play them from the computer keyboard',
    keysAuto: (what) => `Caret's part (${what})`, keysSsg: 'SSG / PSG (square)', keysSine: 'Sine', keysNoise: 'Noise (rhythm)',
    keysFm: (n) => `FM voice @${n}`, keysScc: (n) => `SCC wave @W${n}`, keysDefault: 'default FM voice',
    linePlay: 'Play this line (Ctrl+Shift+Enter); with several lines selected, those lines', lineStop: 'Stop',
    playingLines: (a, b) => (a === b ? `Playing line ${a}` : `Playing lines ${a}–${b}`),
    fmInfo: (alg, fb, car) => `ALG ${alg} · FB ${fb} · carriers ${car}`, fmLegend: 'solid: carrier (heard) · dashed: modulator · envelopes include TL',
    fmCount: (w, n, need) => `${w}: ${need} values are needed; this has ${n}.`, fmRange: (w, f, v, max) => `${w} ${f} ${v} is outside 0–${max}.`,
    noMessages: 'No messages.', loop: (n) => `loop ${n}`, missing: 'not attached', remove: 'Remove',
    demo: 'Demo (FM + SSG + rhythm)', template: 'Template (OPNA + MSX chips)', yourSong: 'Your song (autosaved)', samples: 'Samples',
    loadingSample: (n) => `Loading ${n}…`, sampleFailed: 'Could not load the sample: ',
    underrun: 'Playback is catching up; this device renders slowly.', row: (r, c) => c > 0 ? `${r}:${c}` : `${r}`,
    confirmReplace: 'Replace the editor contents? Your current text is lost unless you saved it.',
    newSong: 'New', newSongTip: 'Start a new MUC from the template (OPNA + MSX chips)', newStarted: 'New song from the template: OPNA and every MSX chip, with comments on each part. Save it as .muc when you are done.',
    confirmNew: 'Start a new song from the template? Your current text and attached files are removed unless you saved them.',
    audioFailed: 'Audio could not start: ', bytes: (n) => `${n.toLocaleString()} bytes`,
    saveMub: 'Save .mub', saveVgm: 'Save .vgm', follow: 'Follow playback', exporting: (k) => `Writing .${k}…`,
    exported: (name, n) => `Saved ${name} (${n.toLocaleString()} bytes).`, exportFailed: 'Could not export: ',
    followPart: (p) => `Follow part ${p}`, hintSuggest: 'suggestions', fontSize: 'Text', fontSizeTip: 'Editor text size',
    uiSize: 'Menus', uiSizeTip: 'Size of the menus, buttons and panels (100–200%; a narrow window allows less)',
    browse: 'Samples…', samplesTitle: 'Samples on GitHub', refresh: 'Refresh', search: 'Search songs…',
    liveSource: (time) => `Live from github.com/ToughkidDev/MUCOMSX (Samples, main branch) · read at ${time}. New files appear as soon as they are committed.`,
    bundledSource: 'GitHub could not be reached, so this is the list built into the page; it may be missing the newest files.',
    loadingList: 'Reading the Samples folder…', noMatch: 'No files match.',
    error: 'Error', warning: 'Warning', counts: (e, w) => `${e} error${e === 1 ? '' : 's'} · ${w} warning${w === 1 ? '' : 's'}`,
    where: (r, c, part, located) => `line ${r}${c > 0 ? `, column ${c}` : ''}${part ? ` · part ${part}` : ''}${located ? ' · found by the playground' : ''}`,
    whatLabel: 'What it means:', fixLabel: 'How to fix:', formLabel: 'Correct form:',
    compileFailedN: (n) => `Could not compile: ${n} error${n === 1 ? '' : 's'}. Details are on the right.`,
    loadingVgm: 'Loading the VGM player (about 20 MB, first time only)…', vgmFailed: 'The VGM player could not be loaded: ',
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
    addFiles: '음색 / PCM 추가', save: '저장', saveTip: '곡을 내 컴퓨터에 .muc로 저장 (Ctrl+S)', nowPlaying: '재생 중', messages: '컴파일 메시지',
    files: '음색 / PCM 파일', filesHint: '#voice, #pcm으로 지정한 파일입니다. 버튼으로 추가하거나 페이지에 끌어다 놓으세요.',
    reference: '빠른 참조', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: '리듬 (v는 값 7개)',
    refPcm: 'ADPCM (#pcm 필요)', refScc: 'SCC 1–5, 파형 @W0:{…}', refTempo: '템포 BPM / Timer-B 값', refOctave: '옥타브, 올림, 내림',
    refLength: '기본 길이, 길이, 클록', refVoice: '음량, 음색', refLoop: '반복, 곡 루프 지점',
    refComment: '주석', manual: 'MML 전체 설명:',
    credit1: '컴파일러, 드라이버, 칩 에뮬레이션은 MDPlayer4Mac의 것을 브라우저용으로 빌드했습니다: ToughkidCST의 MDPlayer4Mac과 MUCOMSX, kuma4649의 mucomDotNET과 MDSound. GPL-3.0.',
    credit2: 'MUCOM88 © 古代祐三, CC BY-NC-SA 4.0.', source: '소스와 라이선스',
    drop: '.muc / .mub / .vgm / .vgz를 놓으면 재생합니다 — 음색·PCM 파일은 첨부됩니다',
    loading: '엔진을 불러오는 중 (약 11 MB, 처음 한 번만)…', ready: '준비됐습니다. 재생 또는 Ctrl+Enter를 누르세요.',
    loadFailed: '엔진을 불러오지 못했습니다: ', compiling: '컴파일 중…', playing: '재생 중',
    compiled: (ms, size) => `${ms} ms에 컴파일, ${size.toLocaleString()} 바이트.`,
    compileFailed: '컴파일 오류입니다. 오른쪽 메시지를 확인하세요.', stopped: '정지했습니다.', ended: '끝났습니다.',
    silentEnv: (p) => `${p} 파트는 첫 음표 앞에 @나 E가 없어서 소리가 나지 않습니다.`,
    silentVol: (p) => `${p} 파트는 첫 음표 앞에 v가 없어서 소리가 나지 않습니다.`,
    sjisLoss: (chars, n) => `Shift-JIS로 쓸 수 없는 문자 ${n}종류가 "?"로 저장됩니다: ${chars}\nMSX용 MUC에는 영어와 일본어만 쓸 수 있습니다. 그래도 저장할까요?`,
    waveInfo: (n, e, lo, hi) => `샘플 ${n}/${e} · 최소 ${lo} · 최대 ${hi}`, wave64: ' · 평균 내어 32개로 연주',
    waveCount: (n, e) => `샘플이 ${e}개 필요한데 ${n}개입니다.`, waveRange: '샘플은 -128~127이어야 합니다(빨간색).',
    waveBad: '숫자가 아닌 샘플이 있습니다(빨간색).', waveOpen: '닫는 }가 없습니다.', waveEdit: '✎ 편집', waveEditTip: '이 파형을 파형 편집기에서 편집 (Furnace 방식)', fmEditTip: '이 음색을 FM 음색 편집기에서 편집 (Furnace 방식)',
    bankTitle: '음색 뱅크', bankTip: '음색 뱅크: 곡의 FM 음색(음색 파일과 MUC)을 텍스트 옆에 표시', bankTo: '대상',
    bankShowEmpty: '빈 칸', bankAdd: '추가', bankDel: '삭제', bankEdit: '편집', bankRename: '이름', bankImport: '가져오기', bankLoad: '로드', bankSave: '저장',
    bankAddTip: '첫 빈 번호에 음색 추가 (Furnace 기본 음색). 대상: 음색 파일 또는 MUC', bankDelTip: '선택한 음색 삭제 (Delete)', bankEditTip: '선택한 음색을 FM 음색 편집기에서 편집 (Enter)',
    bankRenameTip: '선택한 음색 이름 바꾸기 (6자, 음색 파일만)', bankToDatTip: '선택한 MUC 음색을 음색 파일로 옮기기 (같은 번호)', bankToMucTip: '선택한 음색 파일의 음색을 MUC 정의로 복사',
    bankImportTip: '.dat, .muc, .mub, .vgm / .vgz 파일에서 음색을 가져와 뒤에 추가', bankLoadTip: '이 곡에 .dat 음색 파일 사용 (#voice)', bankSaveTip: '음색 파일 내려받기 (없으면 MUC 음색으로 만들어서)', bankUndoTip: '음색 파일의 마지막 변경 되돌리기',
    bankFile_fm: (name, n) => `${name} · 음색 ${n}개`, bankFile_scc: (name, n) => `${name} · 파형 ${n}개`, bankFileMissing: (name) => `${name}: 첨부 안 됨`, bankNoFile_fm: '음색 파일 없음', bankNoFile_scc: '파형 파일 없음',
    bankEmpty_fm: '아직 FM 음색이 없습니다. 추가하거나, 파일에서 가져오거나, 음색 파일을 로드하세요.', bankEmpty_scc: '아직 SCC 파형이 없습니다. 추가하거나, 파일(.dat, .muc, .vgm, Furnace)에서 가져오거나, 파형 파일(SCWD)을 로드하세요.', bankHint: '음색을 클릭하면 들리고, 더블클릭하면 커서 위치에 @n을 씁니다',
    bankSrc_dat: 'DAT', bankSrc_muc: 'MUC', bankSrc_over: 'MUC▸DAT', bankOverTip: 'MUC에도 정의되어 있어 음색 파일보다 우선합니다', bankInline: '(MUC 정의)',
    bankInMuc: (row) => `MUC ${row}행에 정의`, bankInDat: (name) => `${name}에 있음`, bankUses: (n) => `음표 ${n}개가 사용`, bankUnused: '곡에서 사용 안 함',
    bankFull: '255개 번호를 모두 쓰고 있습니다', bankAdded: (n, to) => `${n}을 ${to}에 추가`, bankDelUsed: (n, k) => `${n}은 음표 ${k}개가 사용합니다. 그래도 삭제할까요?`,
    bankDeleted: (n) => `${n} 삭제`, bankDelMucKeepDat: (n) => `${n}의 MUC 정의를 삭제했습니다. 이제 음색 파일의 ${n}이 쓰입니다`,
    bankFormText: '이 음색은 @% 형식이라 텍스트에서 편집하세요', bankRenameDatOnly: '이름은 음색 파일의 음색에만 있습니다', bankRenamePrompt: '이름 (영문·숫자 6자까지)',
    bankToDatNeedsMuc: 'MUC에 정의된 음색을 고르세요', bankToMucNeedsDat: '음색 파일의 음색을 고르세요', bankAlreadyMuc: 'MUC에 이미 이 번호가 정의되어 있습니다',
    bankMovedToDat: (n, name) => `${n}을 ${name}로 옮김`, bankCopiedToMuc: (n) => `${n}을 MUC로 복사`, bankNotDat_fm: (name) => `${name}은 음색 파일이 아닙니다`, bankNotDat_scc: (name) => `${name}은 SCC 파형 파일(SCWD)이 아닙니다`,
    bankLoaded_fm: (name, n) => `${name}: 음색 ${n}개`, bankLoaded_scc: (name, n) => `${name}: 파형 ${n}개`, bankSavedFromMuc: 'MUC 음색으로 만든 음색 파일을 저장했습니다', bankNothingToUndo: '되돌릴 것이 없습니다',
    bankImported_fm: (n, to) => `${to}에 음색 ${n}개 추가`, bankImported_scc: (n, to) => `${to}에 파형 ${n}개 추가`, bankImportSame: (n) => `${n}개는 이미 있음`, bankImportFull: (n) => `${n}개는 빈 번호가 없어 제외`, bankImportNone_fm: (names) => `${names}에 FM 음색 없음`, bankImportNone_scc: (names) => `${names}에 SCC 파형 없음`,
    trkTitle: '트래커', trkTip: '트래커 모드: 곡을 텍스트 옆에 트래커 패턴으로 보여 주고 양쪽 어디서든 편집', trkRow: '행',
    trkHint: '셀을 클릭하고 입력: Z S X … / Q 2 W …는 음, Delete는 쉼표, 1은 노트 오프, @·v 칸은 16진 숫자. ↑↓←→ PgUp PgDn 이동, 숫자패드 / * 옥타브',
    trkInput: '입력', trkInputDisplay: '표시 형식대로 (C#4, OFF, 0F)', trkInputTracker: '빠른 키 (Z S X / Q 2 W)',
    trkHintDisplay: '셀을 클릭하고 표시된 형식대로 입력: C#4 / D-5 (음, # 또는 -, 옥타브 1–8), OFF, ... (쉼표). @·v 칸은 16진 두 자리. Enter는 지금 값을 편집, Delete는 쉼표',
    trkTypeNote: '음: A–G, # 또는 -, 옥타브 1–8 (C#4, D-5). OFF는 노트 오프, ...는 쉼표. Enter로 C만 넣으면 위의 옥타브로', trkTypeHex: (k) => `${k}: 16진 두 자리 (00–FF). 한 자리는 Enter`,
    trkRest: '쉼표', trkRestTip: '이 칸의 음을 쉼표로 (Delete)', trkOffTip: '노트 오프: 이 행부터 쉼표', trkKeysTip: '건반 모드 열기: 건반을 누르면 여기에 음이 입력됩니다',
    trkParamNote: '음색과 볼륨은 음이 시작하는 칸에 넣습니다', trkParamSet: (k, v) => `${k}${v} 설정`, trkParamNext: (k, v) => `${k}${v}: 두 자리 값이면 16진 숫자를 하나 더 입력하세요`,
    trkEnded: '이 파트는 여기서 :로 끝납니다. 텍스트에서 그 뒤에 써 주세요', trkMulti: '여러 파트(예: BC)가 함께 쓰는 줄입니다. 고치면 모두 바뀝니다',
    trkWhere: (row, tick, len) => `${row}행 · ${tick}클록 · 길이 ${len}`, trkShared: '반복/매크로에서 한 번 쓴 음: 고치면 모든 반복에 적용됩니다',
    trkMacro: '매크로 안', trkPastEnd: '이 파트가 끝난 뒤입니다. 먼저 텍스트에 MML을 더 써 주세요', trkCannot: '타이, 포르타멘토, 에코 음은 텍스트에서 고쳐 주세요',
    trkEmpty: '파트 없음',
    keysMode: '건반', keysTip: '건반 모드: 에디터 아래에 건반을 표시하고 마우스나 키보드로 연주',
    keysSource: '음원', keysOctave: '옥타브', keysOctDown: '옥타브 내림 (↓)', keysOctUp: '옥타브 올림 (↑)', keysClose: '건반 모드 닫기',
    keysHintOn: '키보드로 연주 중: Z S X D C … (아래), Q 2 W 3 E … (위), ↑↓ 옥타브',
    keysHintOff: '건반을 클릭하면 키보드로 연주할 수 있습니다',
    keysAuto: (what) => `커서 위치 파트 (${what})`, keysSsg: 'SSG / PSG (사각파)', keysSine: '사인파', keysNoise: '노이즈 (리듬)',
    keysFm: (n) => `FM 음색 @${n}`, keysScc: (n) => `SCC 파형 @W${n}`, keysDefault: '기본 FM 음색',
    linePlay: '이 행 듣기 (Ctrl+Shift+Enter). 여러 행을 선택하면 그 행들', lineStop: '정지',
    playingLines: (a, b) => (a === b ? `${a}행 재생 중` : `${a}–${b}행 재생 중`),
    fmInfo: (alg, fb, car) => `ALG ${alg} · FB ${fb} · 캐리어 ${car}`, fmLegend: '실선: 캐리어(들리는 음) · 점선: 모듈레이터 · 엔벨로프는 TL 포함',
    fmCount: (w, n, need) => `${w}: 값이 ${need}개 필요한데 ${n}개입니다.`, fmRange: (w, f, v, max) => `${w} ${f} ${v}: 0–${max} 범위를 벗어났습니다.`,
    noMessages: '메시지 없음.', loop: (n) => `루프 ${n}`, missing: '첨부 안 됨', remove: '제거',
    demo: '데모 (FM + SSG + 리듬)', template: '템플릿 (OPNA + MSX 칩)', yourSong: '내 곡 (자동 저장)', samples: '샘플',
    loadingSample: (n) => `${n} 불러오는 중…`, sampleFailed: '샘플을 불러오지 못했습니다: ',
    underrun: '렌더링이 재생을 따라잡는 중입니다. 이 기기에서는 느릴 수 있습니다.', row: (r, c) => c > 0 ? `${r}:${c}` : `${r}`,
    confirmReplace: '에디터 내용을 바꿀까요? 저장하지 않은 현재 내용은 사라집니다.',
    newSong: '새로', newSongTip: '템플릿(OPNA + MSX 칩)으로 새 MUC 작성 시작', newStarted: '템플릿으로 새 곡을 시작했습니다. OPNA와 MSX 칩을 모두 쓰고 파트마다 설명이 있습니다. 다 쓰면 .muc로 저장하세요.',
    confirmNew: '템플릿으로 새 곡을 시작할까요? 저장하지 않은 현재 내용과 첨부 파일은 사라집니다.',
    audioFailed: '오디오를 시작하지 못했습니다: ', bytes: (n) => `${n.toLocaleString()} 바이트`,
    saveMub: '.mub 저장', saveVgm: '.vgm 저장', follow: '재생 위치 따라가기', exporting: (k) => `.${k} 만드는 중…`,
    exported: (name, n) => `${name} 저장 (${n.toLocaleString()} 바이트).`, exportFailed: '내보내지 못했습니다: ',
    followPart: (p) => `${p} 파트 따라가기`, hintSuggest: '명령 제안', fontSize: '글자', fontSizeTip: '에디터 글자 크기',
    uiSize: '메뉴', uiSizeTip: '메뉴, 버튼, 패널의 크기 (100–200%, 좁은 창에서는 덜 커짐)',
    browse: '샘플…', samplesTitle: 'GitHub의 샘플', refresh: '새로 고침', search: '곡 검색…',
    liveSource: (time) => `github.com/ToughkidDev/MUCOMSX의 Samples 폴더(main)를 ${time}에 직접 읽었습니다. 새 파일은 커밋하는 즉시 나타납니다.`,
    bundledSource: 'GitHub에 접속하지 못해 페이지에 들어 있는 목록을 보여 줍니다. 최신 파일이 빠져 있을 수 있습니다.',
    loadingList: 'Samples 폴더를 읽는 중…', noMatch: '맞는 파일이 없습니다.',
    error: '오류', warning: '경고', counts: (e, w) => `오류 ${e} · 경고 ${w}`,
    where: (r, c, part, located) => `${r}줄${c > 0 ? ` ${c}칸` : ''}${part ? ` · ${part} 파트` : ''}${located ? ' · 플레이그라운드가 찾은 위치' : ''}`,
    whatLabel: '무슨 뜻:', fixLabel: '고치는 법:', formLabel: '올바른 형태:',
    compileFailedN: (n) => `컴파일하지 못했습니다: 오류 ${n}개. 자세한 내용은 오른쪽에 있습니다.`,
    loadingVgm: 'VGM 플레이어를 불러오는 중 (약 20 MB, 처음 한 번만)…', vgmFailed: 'VGM 플레이어를 불러오지 못했습니다: ',
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
    addFiles: '音色 / PCMを追加', save: '保存', saveTip: '曲を自分のパソコンに.mucで保存 (Ctrl+S)', nowPlaying: '再生中', messages: 'コンパイルメッセージ',
    files: '音色 / PCMファイル', filesHint: '#voice・#pcmで指定したファイルです。ボタンで追加するか、ページにドロップしてください。',
    reference: 'クイックリファレンス', refFm: 'FM 1–6', refSsg: 'SSG 1–3', refRhythm: 'リズム（vは7つの値）',
    refPcm: 'ADPCM（#pcmが必要）', refScc: 'SCC 1–5、波形 @W0:{…}', refTempo: 'テンポ BPM / Timer-B値', refOctave: 'オクターブ、上げ、下げ',
    refLength: '基本音長、音長、クロック', refVoice: '音量、音色', refLoop: '繰り返し、曲のループ位置',
    refComment: 'コメント', manual: 'MMLの詳しい説明:',
    credit1: 'コンパイラ・ドライバ・チップエミュレーションはMDPlayer4Macのものをブラウザ向けにビルドしています: ToughkidCST氏のMDPlayer4MacとMUCOMSX、kuma4649氏のmucomDotNETとMDSound。GPL-3.0。',
    credit2: 'MUCOM88 © 古代祐三, CC BY-NC-SA 4.0。', source: 'ソースとライセンス',
    drop: '.muc / .mub / .vgm / .vgzをドロップすると再生します — 音色・PCMファイルは添付されます',
    loading: 'エンジンを読み込み中（約11 MB、初回のみ）…', ready: '準備完了。再生またはCtrl+Enterを押してください。',
    loadFailed: 'エンジンを読み込めませんでした: ', compiling: 'コンパイル中…', playing: '再生中',
    compiled: (ms, size) => `${ms} msでコンパイル、${size.toLocaleString()}バイト。`,
    compileFailed: 'コンパイルエラーです。右のメッセージを確認してください。', stopped: '停止しました。', ended: '再生が終わりました。',
    silentEnv: (p) => `${p}パートは最初の音符の前に@もEも無いため、鳴りません。`,
    silentVol: (p) => `${p}パートは最初の音符の前にvが無いため、鳴りません。`,
    sjisLoss: (chars, n) => `Shift-JISで書けない文字${n}種類が「?」として保存されます: ${chars}\nMSX用のMUCに使えるのは英語と日本語だけです。それでも保存しますか？`,
    waveInfo: (n, e, lo, hi) => `サンプル ${n}/${e} · 最小 ${lo} · 最大 ${hi}`, wave64: ' · 平均して32個で演奏',
    waveCount: (n, e) => `サンプルが${e}個必要ですが、${n}個です。`, waveRange: 'サンプルは-128~127にします（赤）。',
    waveBad: '数でないサンプルがあります（赤）。', waveOpen: '閉じる}がありません。', waveEdit: '✎ 編集', waveEditTip: 'この波形を波形エディタで編集（Furnace風）', fmEditTip: 'この音色をFM音色エディタで編集（Furnace風）',
    bankTitle: '音色バンク', bankTip: '音色バンク: 曲のFM音色（音色ファイルとMUC）をテキストの横に表示', bankTo: '追加先',
    bankShowEmpty: '空き', bankAdd: '追加', bankDel: '削除', bankEdit: '編集', bankRename: '名前', bankImport: 'インポート', bankLoad: 'ロード', bankSave: '保存',
    bankAddTip: '最初の空き番号に音色を追加（Furnaceの初期音色）。追加先: 音色ファイルかMUC', bankDelTip: '選んだ音色を削除（Delete）', bankEditTip: '選んだ音色をFM音色エディタで編集（Enter）',
    bankRenameTip: '選んだ音色の名前を変える（6文字、音色ファイルのみ）', bankToDatTip: '選んだMUCの音色を音色ファイルへ移す（同じ番号）', bankToMucTip: '選んだ音色ファイルの音色をMUCの定義としてコピー',
    bankImportTip: '.dat, .muc, .mub, .vgm / .vgz から音色を取り込み、後ろに追加', bankLoadTip: 'この曲に .dat 音色ファイルを使う（#voice）', bankSaveTip: '音色ファイルをダウンロード（なければMUCの音色から作成）', bankUndoTip: '音色ファイルの最後の変更を元に戻す',
    bankFile_fm: (name, n) => `${name} · ${n}音色`, bankFile_scc: (name, n) => `${name} · ${n}波形`, bankFileMissing: (name) => `${name}: 未添付`, bankNoFile_fm: '音色ファイルなし', bankNoFile_scc: '波形ファイルなし',
    bankEmpty_fm: 'FM音色がまだありません。追加、ファイルからインポート、または音色ファイルをロードしてください。', bankEmpty_scc: 'SCC波形がまだありません。追加、ファイル（.dat, .muc, .vgm, Furnace）からインポート、または波形ファイル（SCWD）をロードしてください。', bankHint: '音色をクリックで試聴、ダブルクリックでカーソル位置に@nを書きます',
    bankSrc_dat: 'DAT', bankSrc_muc: 'MUC', bankSrc_over: 'MUC▸DAT', bankOverTip: 'MUCにも定義があり、音色ファイルより優先されます', bankInline: '（MUC定義）',
    bankInMuc: (row) => `MUC ${row}行目で定義`, bankInDat: (name) => `${name}内`, bankUses: (n) => `${n}音符が使用`, bankUnused: '曲では未使用',
    bankFull: '255番まで埋まっています', bankAdded: (n, to) => `${n}を${to}に追加`, bankDelUsed: (n, k) => `${n}は${k}音符が使っています。削除しますか？`,
    bankDeleted: (n) => `${n}を削除`, bankDelMucKeepDat: (n) => `${n}のMUC定義を削除しました。音色ファイルの${n}が使われます`,
    bankFormText: 'この音色は@%形式なのでテキストで編集してください', bankRenameDatOnly: '名前は音色ファイルの音色にだけあります', bankRenamePrompt: '名前（英数字6文字まで）',
    bankToDatNeedsMuc: 'MUCで定義された音色を選んでください', bankToMucNeedsDat: '音色ファイルの音色を選んでください', bankAlreadyMuc: 'MUCにすでにこの番号の定義があります',
    bankMovedToDat: (n, name) => `${n}を${name}へ移動`, bankCopiedToMuc: (n) => `${n}をMUCへコピー`, bankNotDat_fm: (name) => `${name}は音色ファイルではありません`, bankNotDat_scc: (name) => `${name}はSCC波形ファイル（SCWD）ではありません`,
    bankLoaded_fm: (name, n) => `${name}: ${n}音色`, bankLoaded_scc: (name, n) => `${name}: ${n}波形`, bankSavedFromMuc: 'MUCの音色から作った音色ファイルを保存しました', bankNothingToUndo: '元に戻すものがありません',
    bankImported_fm: (n, to) => `${to}に${n}音色を追加`, bankImported_scc: (n, to) => `${to}に${n}波形を追加`, bankImportSame: (n) => `${n}個はすでにあり`, bankImportFull: (n) => `${n}個は空き番号がなく除外`, bankImportNone_fm: (names) => `${names}にFM音色なし`, bankImportNone_scc: (names) => `${names}にSCC波形なし`,
    trkTitle: 'トラッカー', trkTip: 'トラッカーモード: 曲をテキストの横にトラッカーのパターンとして表示し、どちらからでも編集', trkRow: '行',
    trkHint: 'セルをクリックして入力: Z S X … / Q 2 W … で音、Deleteで休符、1でノートオフ、@・v欄は16進数字。↑↓←→ PgUp PgDnで移動、テンキー / * でオクターブ',
    trkInput: '入力', trkInputDisplay: '表示どおり (C#4, OFF, 0F)', trkInputTracker: 'クイックキー (Z S X / Q 2 W)',
    trkHintDisplay: 'セルをクリックして表示どおりに入力: C#4 / D-5（音、# か -、オクターブ1–8）、OFF、...（休符）。@・v欄は16進2桁。Enterで今の値を編集、Deleteで休符',
    trkTypeNote: '音: A–G、# か -、オクターブ1–8（C#4, D-5）。OFFはノートオフ、...は休符。EnterでCだけなら上のオクターブで', trkTypeHex: (k) => `${k}: 16進2桁（00–FF）。1桁はEnter`,
    trkRest: '休符', trkRestTip: 'このセルの音を休符に（Delete）', trkOffTip: 'ノートオフ: この行から休符', trkKeysTip: '鍵盤モードを開く: 鍵盤を押すとここに音が入ります',
    trkParamNote: '音色と音量は音が始まるセルに入れます', trkParamSet: (k, v) => `${k}${v} を設定`, trkParamNext: (k, v) => `${k}${v}: 2桁の値ならもう1つ16進数字を入力`,
    trkEnded: 'このパートはここで : で終わります。テキストでその後に書いてください', trkMulti: '複数のパート（例: BC）が共有する行です。直すとすべて変わります',
    trkWhere: (row, tick, len) => `${row}行目 · ${tick}クロック · 長さ ${len}`, trkShared: '繰り返し/マクロで一度だけ書かれた音: 直すとすべての繰り返しに反映されます',
    trkMacro: 'マクロ内', trkPastEnd: 'このパートの終わりより後です。先にテキストにMMLを書いてください', trkCannot: 'タイ、ポルタメント、エコーの音はテキストで直してください',
    trkEmpty: 'パートなし',
    keysMode: '鍵盤', keysTip: '鍵盤モード: エディタの下に鍵盤を出し、マウスやキーボードで演奏',
    keysSource: '音源', keysOctave: 'オクターブ', keysOctDown: 'オクターブ下げ (↓)', keysOctUp: 'オクターブ上げ (↑)', keysClose: '鍵盤モードを閉じる',
    keysHintOn: 'キーボードで演奏中: Z S X D C …（下）、Q 2 W 3 E …（上）、↑↓ オクターブ',
    keysHintOff: '鍵盤をクリックするとキーボードで演奏できます',
    keysAuto: (what) => `カーソル位置のパート（${what}）`, keysSsg: 'SSG / PSG（矩形波）', keysSine: 'サイン波', keysNoise: 'ノイズ（リズム）',
    keysFm: (n) => `FM音色 @${n}`, keysScc: (n) => `SCC波形 @W${n}`, keysDefault: '既定のFM音色',
    linePlay: 'この行を試聴（Ctrl+Shift+Enter）。複数行を選ぶとその行', lineStop: '停止',
    playingLines: (a, b) => (a === b ? `${a}行目を再生中` : `${a}–${b}行目を再生中`),
    fmInfo: (alg, fb, car) => `ALG ${alg} · FB ${fb} · キャリア ${car}`, fmLegend: '実線: キャリア（聞こえる音）・点線: モジュレータ・エンベロープはTL込み',
    fmCount: (w, n, need) => `${w}: 値が${need}個必要ですが、${n}個です。`, fmRange: (w, f, v, max) => `${w} ${f} ${v}は0–${max}の範囲外です。`,
    noMessages: 'メッセージなし。', loop: (n) => `ループ ${n}`, missing: '未添付', remove: '削除',
    demo: 'デモ（FM + SSG + リズム）', template: 'テンプレート（OPNA + MSXチップ）', yourSong: '自分の曲（自動保存）', samples: 'サンプル曲',
    loadingSample: (n) => `${n}を読み込み中…`, sampleFailed: 'サンプルを読み込めませんでした: ',
    underrun: 'レンダリングが再生に追いつこうとしています。この端末では遅い場合があります。', row: (r, c) => c > 0 ? `${r}:${c}` : `${r}`,
    confirmReplace: 'エディタの内容を置き換えますか？保存していない現在の内容は失われます。',
    newSong: '新規', newSongTip: 'テンプレート（OPNA + MSXチップ）で新しいMUCを書き始める', newStarted: 'テンプレートで新しい曲を始めました。OPNAと全MSXチップを使い、パートごとに説明があります。書き終えたら.mucで保存してください。',
    confirmNew: 'テンプレートで新しい曲を始めますか？保存していない現在の内容と添付ファイルは失われます。',
    audioFailed: 'オーディオを開始できませんでした: ', bytes: (n) => `${n.toLocaleString()}バイト`,
    saveMub: '.mubを保存', saveVgm: '.vgmを保存', follow: '再生位置を追う', exporting: (k) => `.${k}を作成中…`,
    exported: (name, n) => `${name}を保存しました（${n.toLocaleString()}バイト）。`, exportFailed: '書き出せませんでした: ',
    followPart: (p) => `${p}パートを追う`, hintSuggest: 'コマンド候補', fontSize: '文字', fontSizeTip: 'エディタの文字サイズ',
    uiSize: 'メニュー', uiSizeTip: 'メニュー・ボタン・パネルの大きさ（100–200%、狭いウィンドウでは控えめ）',
    browse: 'サンプル…', samplesTitle: 'GitHubのサンプル', refresh: '再読み込み', search: '曲を検索…',
    liveSource: (time) => `github.com/ToughkidDev/MUCOMSXのSamplesフォルダー（main）を${time}に直接読み込みました。新しいファイルはコミットするとすぐ表示されます。`,
    bundledSource: 'GitHubに接続できないため、ページ内蔵の一覧を表示しています。最新のファイルがない場合があります。',
    loadingList: 'Samplesフォルダーを読み込み中…', noMatch: '該当するファイルがありません。',
    error: 'エラー', warning: '警告', counts: (e, w) => `エラー ${e} · 警告 ${w}`,
    where: (r, c, part, located) => `${r}行${c > 0 ? ` ${c}桁` : ''}${part ? ` · ${part}パート` : ''}${located ? ' · プレイグラウンドが特定' : ''}`,
    whatLabel: '意味:', fixLabel: '直し方:', formLabel: '正しい形:',
    compileFailedN: (n) => `コンパイルできません: エラー${n}件。詳細は右側にあります。`,
    loadingVgm: 'VGMプレーヤーを読み込み中（約20 MB、初回のみ）…', vgmFailed: 'VGMプレーヤーを読み込めませんでした: ',
    clickToStart: 'ページのどこかをクリックすると音が出ます（ブラウザが最初のクリックを必要とします）。',
    unsupported: (n) => `${n}は開けないファイルです。`, playingFile: (n) => `${n}を再生中`,
    channelView: '▦ チャンネル', channelViewTip: 'チャンネルビュー（MDPlayer4Mac風）/ エディタの切り替え', split: '分割', splitOff: '1画面', splitSide: '左右に分割',
    splitStack: '上下に分割', zoom: 'サイズ', zoomFit: '画面に合わせる',
    cvEmpty: '曲を再生すると、MDPlayerのようにチップごとのチャンネルがここに表示されます。', cvOther: 'チャンネルビューのないチップ: ',
    recovered: (n) => `${n}をSamplesフォルダーから再び添付しました。`,
  },
};

const $ = (id) => document.getElementById(id);

// iOS zooms the whole page into any text field under 16px when it is tapped (the editor
// included). maximum-scale stops that automatic zoom; iOS still lets you pinch to zoom.
if (/iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) {
  document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
}
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
  if (typeof waveEditor !== 'undefined') for (const ed of [waveEditor, fmEditor]) if (ed.isOpen) { ed.build(); ed.render(); }
  if (typeof keyboard !== 'undefined') { keyboard.build(); refreshKeySources(); }
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
let playingRows = null;     // [from, to] while only those rows play (line-play.js)
let bankReady = false;      // the voice bank view exists (it is made further down)
let waveEdit = null;        // { row, fm } of the definition open in the wave / FM editor

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
  updateWave(row);
  if (keysOpen) refreshKeySources();
  if (splitMode === 'tracker' && document.activeElement === code) tracker.caretAt(row, col - 1);
}

// Definition previews: with the caret on an SCC wave (@Wn) the wave is drawn under it;
// on an FM voice (@n and its five lines) the algorithm, output wave and envelopes.
function cssColor(name, alpha = 1) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m || alpha === 1) return v;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}
function hideWave() { $('wave').hidden = true; }
function updateWave(row) {
  const box = $('wave');
  const code = pane.code;
  if (row === undefined) row = code.value.slice(0, code.selectionStart).split('\n').length;
  updateLinePlay(row);
  const active = document.activeElement === code && !suggest.open && viewMode !== 'channels';
  const def = active ? waveAt(lines, row, code.value) || voiceAt(lines, row) : null;
  if (!def) { hideWave(); return; }
  if (box.parentElement !== pane.area) pane.area.appendChild(box);
  const fm = def.ops !== undefined;
  box.classList.toggle('fm', fm);
  const head = box.querySelector('.wave-head');
  head.innerHTML = '<b></b><span></span>';
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'btn small wave-edit';
  edit.textContent = t('waveEdit');
  edit.title = t(fm ? 'fmEditTip' : 'waveEditTip');
  // Keep the caret (and so the preview) in the text while the button is pressed.
  edit.addEventListener('pointerdown', (e) => e.preventDefault());
  edit.addEventListener('mousedown', (e) => e.preventDefault());
  edit.addEventListener('click', () => (fm ? openFmEditor(def) : openWaveEditor(def)));
  head.prepend(edit);
  const notes = [];
  const colors = {
    line: cssColor('--accent2'), fill: cssColor('--accent2', 0.22), axis: cssColor('--muted'), grid: cssColor('--line'),
    bad: cssColor('--err-line'), badFill: cssColor('--err-line', 0.25), muted: cssColor('--muted'), panel: cssColor('--panel'), bg: cssColor('--code-bg'),
  };
  if (fm) {
    const carriers = { 0: '4', 1: '4', 2: '4', 3: '4', 4: '2, 4', 5: '2, 3, 4', 6: '2, 3, 4', 7: '1, 2, 3, 4' }[def.alg] ?? '?';
    head.querySelector('b').textContent = `@${def.id}`;
    head.querySelector('span').textContent = t('fmInfo', def.alg ?? '?', def.fb ?? '?', carriers);
    const legend = document.createElement('span');
    legend.className = 'fm-legend';
    legend.innerHTML = OP_COLORS.map((c, k) => `<i style="color:${c}">OP${k + 1}</i>`).join(' ') + ' · ';
    legend.append(t('fmLegend'));
    head.appendChild(legend);
    for (const p of def.problems) {
      const where = p.op < 0 ? 'FB,ALG' : `OP${p.op + 1}`;
      notes.push(p.count !== undefined ? t('fmCount', where, p.count, p.need) : t('fmRange', where, p.field, p.value, p.max ?? 7));
    }
  } else {
    const nums = def.values.filter(Number.isFinite);
    head.querySelector('b').textContent = `@W${def.id}`;
    head.querySelector('span').textContent = t('waveInfo', def.values.length, def.expected,
      nums.length ? Math.min(...nums) : '-', nums.length ? Math.max(...nums) : '-') + (def.expected === 64 ? t('wave64') : '');
    if (def.values.length !== def.expected) notes.push(t('waveCount', def.values.length, def.expected));
    if (def.values.some((v) => !Number.isFinite(v))) notes.push(t('waveBad'));
    if (nums.some((v) => v < -128 || v > 127)) notes.push(t('waveRange'));
    if (def.expected === 32 && !def.closed && def.values.length <= 32 && /\{/.test(lines[def.row - 1])) notes.push(t('waveOpen'));
  }
  box.querySelector('.wave-note').textContent = notes.join(' ');
  box.hidden = false;
  if (fm) drawVoice(box.querySelector('canvas'), def, colors);
  else drawWave(box.querySelector('canvas'), def.values, def.expected, colors);
  // Under the definition, or above it when there is no room below; hidden while the
  // definition is scrolled out of view.
  const area = box.parentElement;
  const first = textPoint(def.row, 0), last = textPoint(def.endRow, 0);
  if (last.y + last.lh < 0 || first.y > area.clientHeight) { hideWave(); return; }
  const below = last.y + last.lh + 4;
  const above = first.y - box.offsetHeight - 4;
  const x = textPoint(def.row, def.col).x;
  box.style.left = `${Math.max(4, Math.min(x, area.clientWidth - box.offsetWidth - 4))}px`;
  box.style.top = `${below + box.offsetHeight > area.clientHeight && above >= 4 ? above : below}px`;
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
  updateWave();
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
    if (p === pane) { closeSuggest(); updateWave(); }
  });
  ['wheel', 'keydown', 'pointerdown'].forEach((ev) => p.code.addEventListener(ev, () => holdFollow(p)));
  ['keyup', 'click', 'select'].forEach((ev) => p.code.addEventListener(ev, updateCursor));
  p.code.addEventListener('focus', () => {
    if (pane !== p) closeSuggest();
    pane = p;
    for (const o of panes) o.root.classList.toggle('focused', o === p && !panes[1].root.hidden);
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
  if (waveEdit) { waveEdit = null; waveEditor.close(); fmEditor.close(); $('panes').hidden = viewMode === 'channels'; }
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
  scheduleTracker();
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

// Compiler messages plus the page's own warnings about parts that cannot sound.
function withSilenceWarnings(result) {
  const extra = silentParts(code.value).flatMap((s) => s.missing.map((what) => ({
    row: s.row, col: s.col, code: what === 'env' ? 'PG01' : 'PG02',
    text: t(what === 'env' ? 'silentEnv' : 'silentVol', s.part),
  })));
  return extra.length ? { ...result, warnings: [...result.warnings, ...extra] } : result;
}

function renderMessages(result) {
  result = withSilenceWarnings(result);
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
  if (bankReady) scheduleBank();
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
let current = 'mine';   // what the editor holds: 'mine', 'demo', 'template' or 's:<group>:<song>'
const BUILT_IN = { demo: ['demo.muc', 'DEMO.MUC'], template: ['template.muc', 'SONG.MUC'] };

function buildExamples() {
  const sel = $('examples');
  sel.innerHTML = '';
  const opt = (value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; sel.appendChild(o); };
  opt('mine', t('yourSong'));
  opt('demo', t('demo'));
  opt('template', t('template'));
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
    const [file, name] = BUILT_IN[value];
    setStatus(t('loadingSample', file));
    const text = decodeText(await (await fetch(file)).arrayBuffer());
    clearFiles();
    setSource(text);
    sourceName = name;
    current = value;
    saveSong();
    buildExamples();
    setStatus(engineReady ? t('ready') : t('loading'));
  } catch (e) {
    setStatus(t('sampleFailed') + e.message, true);
  }
}
$('examples').addEventListener('change', (e) => loadExample(e.target.value));

// New: the template (OPNA plus every MSX chip, commented) and no attached files.
// It counts as an unedited example until the first keystroke makes it 'mine'.
async function newSong() {
  if (current === 'mine' && code.value.trim() && !confirm(t('confirmNew'))) return;
  let text;
  try { text = decodeText(await (await fetch(BUILT_IN.template[0])).arrayBuffer()); } catch (e) { setStatus(t('sampleFailed') + e.message, true); return; }
  stopByUser();
  clearFiles();
  setSource(text);
  sourceName = BUILT_IN.template[1];
  current = 'template';
  saveSong();
  buildExamples();
  lastResult = null;
  renderMessages({ errors: [], warnings: [] });
  $('nowTitle').textContent = '—';
  $('nowMeta').textContent = '';
  setView('editor');
  if (!matchMedia('(pointer: coarse)').matches) panes[0].code.focus();
  setStatus(t('newStarted'));
}
$('newSong').addEventListener('click', newSong);

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
const encodeSjis = (text) => new Promise((resolve) => {
  const id = ++encodeId;
  pendingEncodes.set(id, resolve);
  worker.postMessage({ type: 'encode', id, text });
});

// Characters Shift-JIS cannot hold (Hangul, emoji …) would be saved as "?". Each distinct
// non-ASCII character is encoded on its own line; the ones that come back as "?" are lost.
async function sjisLosses(text) {
  const chars = [...new Set(text)].filter((c) => c.codePointAt(0) > 0x7f);
  if (!chars.length) return [];
  const back = new TextDecoder('shift_jis').decode(await encodeSjis(chars.join('\n'))).split('\n');
  return chars.filter((c, i) => /^\?+$/.test(back[i]));
}

async function saveMuc() {
  const text = code.value.replace(/\r?\n/g, '\r\n');
  if (!engineReady) { download(sourceName, new TextEncoder().encode(text), 'text/plain'); return; }
  const lost = await sjisLosses(text);
  if (lost.length && !confirm(t('sjisLoss', lost.slice(0, 12).join(' ') + (lost.length > 12 ? ' …' : ''), lost.length))) return;
  download(sourceName, await encodeSjis(text), 'application/octet-stream');
}
$('save').addEventListener('click', saveMuc);
$('saveLabel').addEventListener('click', saveMuc);

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
      // A line being played is checked as part of the whole song; keep its messages.
      if (!(playingRows && m.result.ok)) { lastResult = m.result; renderMessages(m.result); }
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
      if (!playingName) setStatus(`${playingRows ? t('playingLines', ...playingRows) : t('playing')} · ${statusEl.textContent}`);
      if (ctx && ctx.state !== 'running') waitForClick();
      playing = true;
      updateLinePlay();
      loopCount = 0;
      traceSession = m.session;
      traceMsx = !!m.info.msx;
      trkPlay.clear();
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

// iPhone / iPad: Web Audio is silenced by the ringer switch (or iPad's silent mode) unless
// the page declares it plays media, and sound may only start inside a tap. unlockAudio runs
// synchronously at the start of every tap that plays something: it marks the page as a
// media player (navigator.audioSession on Safari 17+, else a silent looping <audio>, which
// moves older iOS to the playback session), then creates or resumes the audio context.
let silentAudio = null;
function silentWavUrl() {
  const frames = 4410, bytes = new Uint8Array(44 + frames);
  const v = new DataView(bytes.buffer);
  const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + frames, true); str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 44100, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, frames, true); bytes.fill(128, 44);
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
}
const isAppleTouch = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

function unlockAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older Safari */ }
  if (isAppleTouch && !navigator.audioSession) {
    if (!silentAudio) { silentAudio = new Audio(silentWavUrl()); silentAudio.loop = true; silentAudio.setAttribute('playsinline', ''); }
    silentAudio.play().catch(() => {});
  }
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE, latencyHint: 'playback' });
  // 'suspended' before the first tap; iOS also uses 'interrupted' (calls, other apps).
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
}

async function ensureAudio() {
  unlockAudio();
  // Not awaiting resume(): outside a tap it waits for one, and 'started' asks for it instead.
  if (node) return;
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
      playingRows = null;
      clearTrace();
      channelView.stop();
      silentAudio?.pause();
      setStatus(t('ended'));
      updateLinePlay();
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
  keysNode?.port.postMessage({ type: 'gain', value: 0.35 * v * v });
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

// Menus size: scales the header, toolbar, side panel, editor footer, footer and the
// samples dialog (CSS --ui). Applied when the slider is released, so the slider does not
// move away from under the pointer while it is dragged.
// A narrow window gets less, so the panels still fit: 100% per 640 px of width (a phone
// stays at 100%, 1280 px and wider allow 200%). The output shows what is applied.
let uiSize = 100;
function applyUiSize() {
  const fits = Math.max(100, Math.floor(window.innerWidth / 640 * 10) * 10);
  const pct = Math.min(uiSize, fits);
  if (document.documentElement.style.getPropertyValue('--ui') !== String(pct / 100)) {
    document.documentElement.style.setProperty('--ui', String(pct / 100));
    // The editor and the channel view get a different width: let them measure again.
    window.dispatchEvent(new Event('resize'));
  }
  $('uiSizeOut').textContent = `${pct}%`;
}
function setUiSize(value) {
  uiSize = Math.min(200, Math.max(100, Math.round((Number(value) || 100) / 10) * 10));
  $('uiSize').value = uiSize;
  store.set(STORE_UI, String(uiSize));
  applyUiSize();
}
$('uiSize').addEventListener('input', (e) => { $('uiSizeOut').textContent = `${e.target.value}%`; });
$('uiSize').addEventListener('change', (e) => setUiSize(e.target.value));
window.addEventListener('resize', applyUiSize);

// rows: [from, to] to play only those rows of the song (see line-play.js).
async function play(rows = null) {
  if (!Array.isArray(rows)) rows = null;   // a click event when bound to the button
  unlockAudio();   // in the tap itself, even while the engine is still loading
  writeEdit();   // hear what is being edited
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
  playingRows = rows;
  updateLinePlay();
  worker.postMessage({ type: 'compile', text: rows ? lineSnippet(code.value, rows[0], rows[1]) : code.value, play: true });
}

// ---------- playing a line ----------
// A ▶ at the end of the part line the caret is on plays that line, or the selected lines,
// with the settings the part has there (line-play.js); while it plays it stops instead.
function caretRows() {
  const c = pane.code;
  const from = c.value.slice(0, c.selectionStart).split('\n').length;
  let end = c.selectionEnd;
  // A selection that ends at the start of a line does not include that line.
  if (end > c.selectionStart && c.value[end - 1] === '\n') end--;
  return [from, Math.max(from, c.value.slice(0, end).split('\n').length)];
}
function playLines() {
  const [from, to] = caretRows();
  if (!lines.slice(from - 1, to).some(playsSomething)) return;
  play([from, to]);
}
function updateLinePlay(row) {
  const btn = $('linePlay');
  const code = pane.code;
  if (row === undefined) row = code.value.slice(0, code.selectionStart).split('\n').length;
  const focused = document.activeElement === code || btn.matches(':hover') || document.activeElement === btn;
  const show = focused && viewMode !== 'channels' && !waveEdit && playsSomething(lines[row - 1]);
  if (!show) { btn.hidden = true; return; }
  if (btn.parentElement !== pane.area) pane.area.appendChild(btn);
  const stop = playing && !!playingRows;
  btn.textContent = stop ? '■' : '▶';
  btn.title = stop ? t('lineStop') : t('linePlay');
  btn.setAttribute('aria-label', btn.title);
  btn.classList.toggle('stop', stop);
  const area = btn.parentElement;
  const pt = textPoint(row, (lines[row - 1] || '').length);
  btn.hidden = false;
  if (pt.y + pt.lh < 0 || pt.y > area.clientHeight) { btn.hidden = true; return; }
  btn.style.left = `${Math.max(4, Math.min(pt.x + 10, area.clientWidth - btn.offsetWidth - 6))}px`;
  btn.style.top = `${pt.y + (pt.lh - btn.offsetHeight) / 2}px`;
}
$('linePlay').addEventListener('pointerdown', (e) => e.preventDefault());   // keep the caret in the text
$('linePlay').addEventListener('mousedown', (e) => e.preventDefault());
$('linePlay').addEventListener('click', () => {
  if (playing && playingRows) stopByUser();
  else playLines();
});

function stop() {
  pendingPlay = false;
  pendingFile = null;
  pendingVgm = null;
  if (vgmWorker && vgmReady) vgmWorker.postMessage({ type: 'stop' });
  if (!engineReady) return;
  worker.postMessage({ type: 'stop' });
  if (playing) setStatus(t('stopped'));
  playing = false;
  playingRows = null;
  clearTrace();
  channelView.stop();
  cvSession = -1;
  updateLinePlay();
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
  unlockAudio();
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
// iOS Safari only counts touchend / click as a tap that may start sound, not pointerdown.
const TAP_EVENTS = ['touchend', 'click', 'keydown'];
function waitForClick() {
  setStatus(t('clickToStart'));
  const resume = () => {
    unlockAudio();
    ctx.resume().then(() => {
      if (ctx.state !== 'running') return;
      setStatus(t('playingFile', playingName || sourceName));
      TAP_EVENTS.forEach((ev) => window.removeEventListener(ev, resume, true));
    });
  };
  TAP_EVENTS.forEach((ev) => window.addEventListener(ev, resume, true));
}

$('play').addEventListener('click', play);
// Stopping by hand also releases the iOS media session (play() starts a new one).
function stopByUser() { stop(); silentAudio?.pause(); }
$('stop').addEventListener('click', stopByUser);

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
  hideWave();
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
  p.code.addEventListener('blur', () => { closeSuggest(); if (!$('wave').matches(':hover')) hideWave(); updateLinePlay(); });
  p.code.addEventListener('click', closeSuggest);
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') { e.preventDefault(); playLines(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); play(); }
  else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveMuc(); }
  else if (e.key === 'Escape' && !$('samplesDlg').open) { stopByUser(); }
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
    if (splitMode === 'tracker') updateTrackerPlayhead();
    if (viewMode === 'channels') channelView.update(playedFrame());
    requestAnimationFrame(frame);
  };
  frame();
}

// ---------- playback position highlighting ----------
// The engine reports, per part, which command in the source it is playing and at which
// audio frame. Those are applied when that frame is actually heard.
let lines = [];
let traceSession = -1, traceEvents = [], traceIndex = 0, traceStale = false, traceDirty = false, traceMsx = false;
let clockFrames = 0, clockAt = 0;
const positions = new Map();     // channel key -> { row, col, len }
let followKey = null;
const measure = document.createElement('canvas').getContext('2d');

function partInfo(key) {
  const chip = Math.floor(key / 1000), ch = key % 1000, part = Math.floor(ch / 10), page = ch % 10;
  const letter = PART_LETTERS[part] || '?';
  // A MUCOMSX song plays its second chip's parts on MSX-MUSIC / PSG and its third's on SCC.
  const prefix = !chip ? '' : traceMsx ? (chip === 1 ? 'MSX' : 'SCC') : `${chip + 1}`;
  return {
    label: prefix + letter + (page ? page : ''),
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
    const key = traceEvents[traceIndex + 1], row = traceEvents[traceIndex + 2];
    traceIndex += 5;
    // Playing some lines: the other part rows only set things up, so they are not shown.
    if (playingRows && (row < playingRows[0] || row > playingRows[1]) && partLine(lines[row - 1])) continue;
    positions.set(key, { row, col: traceEvents[traceIndex - 2], len: traceEvents[traceIndex - 1] });
    if (splitMode === 'tracker') trackerTrace(key, row, traceEvents[traceIndex - 2], traceEvents[traceIndex - 5] / SAMPLE_RATE);
    changed.push(key);
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
  for (const p of panes[1].root.hidden ? [panes[0]] : panes.filter((o) => o !== pane)) {
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
  // Templates come first: they are where a new song usually starts.
  const order = (d) => (d.startsWith('Muc/Templates') ? '0' : '1') + d;
  for (const dir of [...groups.keys()].sort((a, b) => order(a).localeCompare(order(b)))) {
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
  if (!dlg.open) {
    dlg.showModal();
    // A dialog focuses its first field, the search box; on a touch screen that brings up
    // the keyboard over the list, so start on the close button there instead.
    if (matchMedia('(pointer: coarse)').matches) $('sampleClose').focus();
  }
  $('sampleSource').textContent = t('loadingList');
  if (force) sampleTree = null;
  await readSampleTree(force);
  $('sampleSource').textContent = sampleTree.live
    ? t('liveSource', new Date(sampleTree.at).toLocaleTimeString()) : t('bundledSource');
  renderSampleList();
  // Not on touch screens: the on-screen keyboard would cover most of the list.
  if (!matchMedia('(pointer: coarse)').matches) $('sampleSearch').focus();
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
  splitMode = ['side', 'stack', 'tracker', 'bank'].includes(mode) ? mode : 'off';
  const box = $('panes');
  const right = splitMode === 'tracker' || splitMode === 'bank';
  box.classList.toggle('split-side', splitMode === 'side' || right);
  box.classList.toggle('split-stack', splitMode === 'stack');
  box.classList.toggle('split-tracker', right);
  // Tracker / voice bank: the text on the left, the tracker (tracker.js) or the voice bank
  // (bank-view.js) on the right.
  panes[1].root.hidden = splitMode === 'off' || right;
  $('tracker').hidden = splitMode !== 'tracker';
  $('bank').hidden = splitMode !== 'bank';
  $('trackerToggle').setAttribute('aria-pressed', String(splitMode === 'tracker'));
  $('bankToggle').setAttribute('aria-pressed', String(splitMode === 'bank'));
  if (splitMode === 'tracker') { tracker.setText(code.value); tracker.layout(); }
  if (splitMode === 'bank') {
    // A song with SCC parts and no FM voices opens on the SCC tab.
    if (mode === 'bank' && /^[ \t]*SCC[A-E]/m.test(code.value) && !mucVoices(code.value).length && !/^#voice/im.test(code.value)) bank.kind = 'scc';
    bank.refresh();
  }
  $('splitter').hidden = splitMode === 'off';
  $('splitter').setAttribute('aria-orientation', splitMode === 'stack' ? 'horizontal' : 'vertical');
  $('splitModes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.split === splitMode)));
  if (panes[1].root.hidden && pane === panes[1]) { closeSuggest(); pane = panes[0]; }
  for (const o of panes) o.root.classList.toggle('focused', o === pane && !panes[1].root.hidden);
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
    const across = getComputedStyle($('panes')).flexDirection !== 'column';
    const f = across ? (ev.clientX - box.left) / box.width : (ev.clientY - box.top) / box.height;
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

// ---------- SCC wave editor and FM voice editor ----------
// Open in place of the text; Apply / Done write the definition back (as one @Wn:{…}
// line, or @Wn and four rows for a 64-sample #SSGExtend wave; the five value lines of an
// FM voice).
const waveEditor = new WaveEditor($('waveEditor'), {
  lang: () => lang,
  onApply: (values) => writeWave(values),
  onClose: () => closeWaveEditor(),
  audio: () => { unlockAudio(); return ctx; },
  volume: () => (+$('volume').value / 100) ** 2,
});

const fmEditor = new FmEditor($('fmEditor'), {
  lang: () => lang,
  onApply: (voice) => writeVoice(voice),
  onClose: () => closeWaveEditor(),
  audio: () => { unlockAudio(); return ctx; },
  volume: () => (+$('volume').value / 100) ** 2,
  colors: () => ({
    line: cssColor('--accent2'), axis: cssColor('--muted'), grid: cssColor('--line'), muted: cssColor('--muted'),
    panel: cssColor('--panel'), bg: cssColor('--code-bg'),
  }),
});

function startEdit(def, fm) {
  if (viewMode === 'channels') setView('editor');
  hideWave();
  closeSuggest();
  waveEdit = { row: def.row, fm };
  $('panes').hidden = true;
  document.querySelectorAll('.editor-foot .ed').forEach((el) => { el.hidden = true; });
}
function openWaveEditor(def) {
  startEdit(def, false);
  const header = lines[def.row - 1] || '';
  waveEditor.open({ ...def, indent: header.slice(0, def.col) || '  ' });
  $('waveEditor').querySelector('.we-canvas').focus?.();
}
function openFmEditor(def) {
  startEdit(def, true);
  fmEditor.open({ ...def, oldLines: lines.slice(def.row, def.row + 5) });
  $('fmEditor').querySelector('.we-bar button')?.focus?.();
}
// Writes what the open editor holds into the song.
function writeEdit() {
  if (!waveEdit) return;
  if (waveEdit.fm) writeVoice(fmEditor.voice);
  else writeWave(waveEditor.values.slice());
}

function writeVoice(voice) {
  if (!waveEdit) return;
  if (waveEdit.dat) { bankWriteVoice(waveEdit.dat, voice, waveEdit.name); return; }
  const def = voiceAt(lines, waveEdit.row);
  if (!def || def.row !== waveEdit.row) return;
  const old = lines.slice(def.row, def.row + 5);
  const text = formatVoice(voice, old).join('\n');
  const starts = [0];
  for (let i = 0; i < lines.length; i++) starts.push(starts[i] + lines[i].length + 1);
  // The five value lines; a song that ends early gets the missing lines added.
  let from, to, put = text;
  if (def.row < lines.length) {
    const last = Math.min(lines.length, def.row + 5);
    from = starts[def.row];
    to = starts[last - 1] + lines[last - 1].length;
  } else {
    from = to = code.value.length;
    put = '\n' + text;
  }
  if (code.value.slice(from, to) === put) return;
  code.setRangeText(put, from, to, 'preserve');
  code.dispatchEvent(new Event('input'));
}

function writeWave(values) {
  if (!waveEdit) return;
  if (waveEdit.scc !== undefined) { bankWriteWave(waveEdit.scc, values); return; }
  const def = waveAt(lines, waveEdit.row, code.value);
  if (!def) return;
  // Keep a comment after the definition's last value.
  const last = lines[def.endRow - 1] || '';
  const comment = /;.*$/.exec(last.replace(/^[^;]*?\}/, ''))?.[0] || '';
  const indent = (lines[def.row - 1] || '').slice(0, def.col) || '  ';
  const text = waveEditor.serialize(indent) + (comment ? ' ' + comment : '');
  const starts = [0];
  for (let i = 0; i < lines.length; i++) starts.push(starts[i] + lines[i].length + 1);
  const from = starts[def.row - 1], to = starts[def.endRow - 1] + last.length;
  if (code.value.slice(from, to) === text) return;
  code.setRangeText(text, from, to, 'preserve');
  code.dispatchEvent(new Event('input'));
}

function closeWaveEditor() {
  if (!waveEdit) return;
  const row = waveEdit.row, wasDat = !!waveEdit.dat || waveEdit.scc !== undefined;
  waveEdit = null;
  if (waveEditor.isOpen) waveEditor.close();
  if (fmEditor.isOpen) fmEditor.close();
  $('panes').hidden = viewMode === 'channels';
  document.querySelectorAll('.editor-foot .ed').forEach((el) => { el.hidden = viewMode === 'channels'; });
  renderGutter();
  renderHighlight();
  traceDirty = true;
  if (wasDat) { bank.refresh(); bank.root.querySelector('.bank-list').focus(); return; }
  if (viewMode !== 'channels') {
    const at = lines.slice(0, row - 1).reduce((n, l) => n + l.length + 1, 0);
    code.focus();
    code.setSelectionRange(at, at);
    updateCursor();
  }
}
// Leaving the editor any other way keeps what was drawn.
function leaveWaveEditor() {
  if (!waveEdit) return;
  writeEdit();
  closeWaveEditor();
}

function setView(mode, auto = false) {
  // The channel view always opens fitted to the frame; Size changes it from there.
  if (mode === 'channels' && viewMode !== 'channels') setZoom(DEFAULT_SCALE);
  if (mode === 'channels') leaveWaveEditor();
  viewMode = mode === 'channels' ? 'channels' : 'editor';
  autoChannels = viewMode === 'channels' && auto;
  const channels = viewMode === 'channels';
  if (channels) closeSuggest();
  $('panes').hidden = channels;
  $('chview').hidden = !channels;
  $('keys').hidden = channels || !keysOpen;
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

// ---------- keys mode ----------
// A piano under the editor (keyboard.js), sounding through its own low-latency
// AudioContext and synthesizer (keys-worklet.js). The sound follows the part the caret is
// in: its FM voice (inline definition), SCC wave, the SSG square or noise for rhythm; or
// pick a voice / wave of the song.
let keysOpen = false, keysCtx = null, keysNode = null, keysReady = null, keysSource = 'auto';
const keyboard = new Keyboard($('keys'), {
  t,
  onNote: (on, midi) => keyNote(on, midi),
  onClose: () => setKeys(false),
  onSource: (v) => { keysSource = v; saveKeys(); },
  onFocus: (focused) => { if (focused) keysCtx?.resume().catch(() => {}); },
});

function saveKeys() { store.set(STORE_KEYS, JSON.stringify({ open: keysOpen, octave: keyboard.octave, source: keysSource })); }

function ensureKeysAudio() {
  if (keysReady) return keysReady;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older Safari */ }
  keysCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  keysReady = keysCtx.audioWorklet.addModule('keys-worklet.js').then(() => {
    keysNode = new AudioWorkletNode(keysCtx, 'keys-synth', { numberOfInputs: 0, outputChannelCount: [2] });
    keysNode.connect(keysCtx.destination);
    setVolume();
  }).catch((e) => { keysReady = null; setStatus(t('audioFailed') + e.message, true); });
  return keysReady;
}

function setKeys(open) {
  keysOpen = open;
  $('keysToggle').setAttribute('aria-pressed', String(open));
  $('keys').hidden = !open || viewMode === 'channels';
  if (open) {
    ensureKeysAudio();
    keysCtx?.resume().catch(() => {});
    refreshKeySources();
    keyboard.focus();
  } else {
    keyboard.releaseAll();
    keysNode?.port.postMessage({ type: 'allOff' });
  }
  saveKeys();
  // The editor got shorter or taller.
  renderMarks();
  traceDirty = true;
  updateWave();
}
$('keysToggle').addEventListener('click', () => setKeys(!keysOpen));

// The parts a part name plays (as silence-check.js reads them): 'A', 'MSXD', 'SCCB' …
function partTokens(name) {
  if (name.startsWith('SCC')) return [...name.slice(3).replace(/[0-9]/g, '')].map((l) => 'SCC' + l);
  if (name.startsWith('MSX')) return [...name.slice(3).replace(/[0-9]/g, '')].map((l) => 'MSX' + l);
  return [...name.replace(/[0-9]/g, '')];
}

function inlineVoices() {
  const found = new Map();
  lines.forEach((l, i) => {
    if (!/^ .@\d+[ \t]*(?:;.*)?$/.test(l)) return;
    const v = voiceAt(lines, i + 1);
    if (v && !v.problems.length && !found.has(v.id)) found.set(v.id, { fb: v.fb, alg: v.alg, ops: v.ops });
  });
  return found;
}

function songWaves() {
  const found = new Map();
  const text = code.value;
  lines.forEach((l, i) => {
    if (!/^[ \t]+@W\d+/.test(l)) return;
    const w = waveAt(lines, i + 1, text);
    if (!w || found.has(w.id) || w.values.length !== w.expected || !w.values.every(Number.isFinite)) return;
    // A 64-sample #SSGExtend wave is played as 32, averaging pairs like the player.
    const v = w.expected === 64 ? Array.from({ length: 32 }, (_, k) => (w.values[2 * k] + w.values[2 * k + 1]) / 2) : w.values;
    found.set(w.id, v.map((x) => Math.max(-128, Math.min(127, x)) / 128));
  });
  return found;
}

const SQUARE = Array.from({ length: 32 }, (_, i) => (i < 16 ? 0.6 : -0.6));

// What the caret's part sounds like: { inst, label }.
function caretInstrument(voices, waves) {
  const c = pane.code;
  let row = c.value.slice(0, c.selectionStart).split('\n').length;
  let p = null;
  for (; row >= 1 && !p; row--) p = partLine(lines[row - 1]);
  if (!p) return { inst: { kind: 'fm', voice: INIT_VOICE }, label: t('keysDefault') };
  return partInstrument(partTokens(p.name)[0], row + 1, voices, waves);
}

// What a part (token: 'A', 'MSXD', 'SCCB' …) sounds like at a row: { inst, label }.
function partInstrument(token, at, voices, waves) {  // The last @n this part used up to the caret's line.
  let id = null;
  for (let r = 1; r <= at; r++) {
    const q = partLine(lines[r - 1]);
    if (!q || !partTokens(q.name).includes(token)) continue;
    for (const m of q.body.split(';')[0].matchAll(/@(\d+)/g)) id = +m[1];
  }
  const letter = token.startsWith('SCC') || token.startsWith('MSX') ? token[3] : token;
  if (token.startsWith('SCC')) {
    const wave = id !== null ? waves.get(id) : null;
    return wave ? { inst: { kind: 'wave', table: wave }, label: `${token} · @W${id}` } : { inst: { kind: 'wave', table: SQUARE }, label: `${token} · ${t('keysSsg')}` };
  }
  if ('DEF'.includes(letter)) return { inst: { kind: 'wave', table: SQUARE }, label: `${token} · SSG` };
  if (letter === 'G') return { inst: { kind: 'noise' }, label: `${token} · ${t('keysNoise')}` };
  if (letter === 'K') return { inst: { kind: 'sine' }, label: `${token} · ${t('keysSine')}` };
  // FM; MSX-MUSIC's built-in voices are not modelled, so they get the default voice too.
  const voice = !token.startsWith('MSX') && id !== null ? voices.get(id) : null;
  return voice ? { inst: { kind: 'fm', voice }, label: `${token} · FM @${id}` } : { inst: { kind: 'fm', voice: INIT_VOICE }, label: `${token} · ${t('keysDefault')}` };
}

let keysInstruments = new Map();
function refreshKeySources() {
  const voices = inlineVoices(), waves = songWaves();
  const auto = caretInstrument(voices, waves);
  keysInstruments = new Map([['auto', auto.inst]]);
  const options = [['auto', t('keysAuto', auto.label)]];
  for (const [id, voice] of [...voices].sort((a, b) => a[0] - b[0])) { keysInstruments.set(`fm${id}`, { kind: 'fm', voice }); options.push([`fm${id}`, t('keysFm', id)]); }
  for (const [id, table] of [...waves].sort((a, b) => a[0] - b[0])) { keysInstruments.set(`scc${id}`, { kind: 'wave', table }); options.push([`scc${id}`, t('keysScc', id)]); }
  keysInstruments.set('ssg', { kind: 'wave', table: SQUARE }); options.push(['ssg', t('keysSsg')]);
  keysInstruments.set('sine', { kind: 'sine' }); options.push(['sine', t('keysSine')]);
  keysInstruments.set('noise', { kind: 'noise' }); options.push(['noise', t('keysNoise')]);
  keysSource = keyboard.setSources(options, keysSource);
}

function keyNote(on, midi) {
  // With the tracker the last place written in, the piano writes notes there too.
  if (on && splitMode === 'tracker' && tracker.armed) tracker.enterNote(midi);
  if (!keysNode) { ensureKeysAudio(); return; }
  if (keysCtx.state !== 'running') keysCtx.resume().catch(() => {});
  if (!on) { keysNode.port.postMessage({ type: 'off', id: midi }); return; }
  const inst = keysInstruments.get(keysSource) || keysInstruments.get('auto');
  keysNode.port.postMessage({ type: 'on', id: midi, freq: 440 * 2 ** ((midi - 69) / 12), inst });
}

{
  let saved = {};
  try { saved = JSON.parse(store.get(STORE_KEYS) || '{}'); } catch { /* ignore */ }
  if (saved.octave) keyboard.octave = Math.max(1, Math.min(6, saved.octave));
  if (saved.source) keysSource = saved.source;
  keyboard.drawKeys();
  // Reopened without a tap: the audio starts on the first key.
  if (saved.open) { keysOpen = true; $('keysToggle').setAttribute('aria-pressed', 'true'); $('keys').hidden = viewMode === 'channels'; refreshKeySources(); }
}

// ---------- tracker mode ----------
// The text on the left, the song as a tracker pattern on the right (tracker.js); an edit on
// either side shows on the other, and while a song plays the rows follow it.
const TRACK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUV';
const tracker = new Tracker($('tracker'), {
  t,
  colors: (name) => {
    const prefix = name.startsWith('SCC') ? 2 : name.startsWith('MSX') ? 1 : 0;
    return PART_COLORS[(TRACK_LETTERS.indexOf(name[prefix ? 3 : 0]) + prefix * 4) % PART_COLORS.length];
  },
  sourceText: (row, col, len) => (lines[row - 1] || '').slice(col, col + len),
  edit: (edits) => {
    // Right to left, so earlier positions stay valid.
    edits.sort((a, b) => b.row - a.row || b.col - a.col);
    const starts = [0];
    for (let i = 0; i < lines.length; i++) starts.push(starts[i] + lines[i].length + 1);
    for (const e of edits) {
      // > and < next to each other cancel: <g8.>< becomes <g8. (also across the edit's ends).
      const line = lines[e.row - 1] || '';
      let { text, col, len } = e;
      for (let again = true; again;) {
        again = false;
        const before = text;
        text = text.replace(/><|<>/g, '');
        if (/[<>]$/.test(text) && line[col + len] === (text.endsWith('>') ? '<' : '>')) { text = text.slice(0, -1); len++; }
        if (/^[<>]/.test(text) && col > 0 && line[col - 1] === (text.startsWith('>') ? '<' : '>')) { text = text.slice(1); col--; len++; }
        again = text !== before;
      }
      const at = starts[e.row - 1] + col;
      code.setRangeText(text, at, at + len, 'end');
    }
    code.dispatchEvent(new Event('input'));
    tracker.setText(code.value);
    const first = edits[edits.length - 1];
    if (first) revealSource({ row: first.row, col: first.col, len: first.text.length });
  },
  reveal: (src) => revealSource(src),
  keys: () => setKeys(true),
  preview: (on, midi, name) => {
    ensureKeysAudio();
    if (!keysNode) return;
    if (!on) { keysNode.port.postMessage({ type: 'off', id: 1000 + midi }); return; }
    keysCtx.resume().catch(() => {});
    const token = name ? name.replace(/[0-9]/g, '') : 'A';
    const row = tracker.tracks[tracker.cursor.track]?.events[0]?.src.row || 1;
    const inst = partInstrument(token, Math.max(row, linkRow || row), inlineVoices(), songWaves()).inst;
    keysNode.port.postMessage({ type: 'on', id: 1000 + midi, freq: 440 * 2 ** ((midi - 69) / 12), inst });
  },
});
let trackerTimer = 0, linkRow = 0;
function scheduleTracker() {
  if (splitMode !== 'tracker') return;
  clearTimeout(trackerTimer);
  trackerTimer = setTimeout(() => tracker.setText(code.value), 150);
}
// Shows where a tracker cell is written in the text: the row scrolled into view and the
// token marked, without taking the focus from the tracker.
function revealSource(src) {
  const p = panes[0];
  p.root.querySelector('.tlink')?.remove();
  if (!src) return;
  linkRow = src.row;
  const lh = parseFloat(getComputedStyle(p.code).lineHeight) || 20;
  const y = (src.row - 1) * lh;
  if (y < p.code.scrollTop || y > p.code.scrollTop + p.code.clientHeight - lh * 2) {
    p.code.scrollTop = Math.max(0, y - p.code.clientHeight / 3);
    p.code.dispatchEvent(new Event('scroll'));
  }
  const line = lines[src.row - 1] || '';
  const a = textPoint(src.row, src.col, p), b = textPoint(src.row, Math.min(line.length, src.col + Math.max(1, src.len)), p);
  const mark = document.createElement('div');
  mark.className = 'tlink';
  mark.style.cssText = `left:${a.x - 1}px;top:${a.y}px;width:${Math.max(6, b.x - a.x) + 2}px;height:${a.lh}px`;
  p.root.querySelector('.code-area').appendChild(mark);
  p.code.addEventListener('scroll', () => mark.remove(), { once: true });
}
// Where each playing part is in the tracker, from the engine's trace: the event with that
// source (the next one after the last, for repeats), and how fast clocks go by.
const trkPlay = new Map();   // trace key -> { track, index, tick, len, at }
let trkRate = 0;             // clocks per second
function trackerTrace(key, row, col, at) {
  const list = tracker.bySource?.get(`${row}:${col}`);
  if (!list) return;
  const prev = trkPlay.get(key);
  let pick = null;
  if (prev) pick = list.find(([k, i]) => k === prev.track && i > prev.index) || list.find(([k]) => k === prev.track);
  if (!pick) pick = list[0];
  const ev = tracker.tracks[pick[0]].events[pick[1]];
  if (prev && pick[0] === prev.track && ev.tick > prev.tick && at > prev.at) {
    const rate = (ev.tick - prev.tick) / (at - prev.at);
    trkRate = trkRate ? trkRate * 0.8 + rate * 0.2 : rate;
  }
  trkPlay.set(key, { track: pick[0], index: pick[1], tick: ev.tick, len: ev.len, at });
}
let trkShown = null;
function updateTrackerPlayhead() {
  let tick = null;
  if (playing && !traceStale && trkPlay.size) {
    const now = playedFrame() / SAMPLE_RATE;
    for (const p of trkPlay.values()) {
      const at = Math.min(p.tick + p.len, p.tick + Math.max(0, now - p.at) * trkRate);
      tick = tick === null ? at : Math.max(tick, at);
    }
  }
  if (!playing && trkPlay.size) { trkPlay.clear(); trkRate = 0; }
  if (tick !== trkShown) { trkShown = tick; tracker.setPlayhead(tick); }
}
$('trackerToggle').addEventListener('click', () => setSplit(splitMode === 'tracker' ? 'off' : 'tracker'));
for (const p of panes) {
  p.code.addEventListener('input', scheduleTracker);
  p.code.addEventListener('focus', () => { if (tracker.armed) { tracker.armed = false; tracker.draw(); } });
}

// ---------- voice bank ----------
// The song's FM voices and SCC waves next to the text (bank-view.js), on two tabs: the file
// the song uses (#voice / VOICE.DAT, #sccvoice / SCCVOICE.DAT) and the MUC's own
// definitions; changes go to the attached file or the text.
function attachedTagFile(tag, fallback) {
  const m = new RegExp(`^#${tag}[ \\t]+([^\\s;]+)`, 'im').exec(code.value);
  const name = (m ? m[1].replace(/^"|"$/g, '') : fallback).split(/[\\/]/).pop();
  const f = files.get(name.toLowerCase());
  return { tagged: !!m, name, file: f };
}
function usageFor(parts) {
  // Notes per @n in the parts the bank is for.
  const count = new Map();
  try {
    for (const tr of timeline(code.value)) {
      if (!parts.test(tr.name)) continue;
      for (const ev of tr.events) if (ev.kind === 'note' && ev.inst !== null && ev.inst !== undefined) count.set(ev.inst, (count.get(ev.inst) || 0) + 1);
    }
  } catch { /* a song the reading cannot follow: no counts */ }
  return count;
}
async function previewInst(inst) {
  await ensureKeysAudio();
  if (!keysNode) return;
  keysCtx.resume().catch(() => {});
  keysNode.port.postMessage({ type: 'on', id: 2000, freq: 261.63, inst });
  setTimeout(() => keysNode.port.postMessage({ type: 'off', id: 2000 }), 450);
}
function setupMini(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 44 * dpr; canvas.height = 20 * dpr;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}
function drawAlgMini(canvas, v) {
  const g = setupMini(canvas), w = 44, h = 20;
  const alg = ALGS[v.alg] || ALGS[0];
  const cols = Math.max(...alg.pos.map((p) => p[0])) + 1, rows = Math.max(...alg.pos.map((p) => p[1])) + 1;
  const at = (k) => ({ x: 4 + (alg.pos[k][0] + 0.5) * ((w - 10) / cols), y: (alg.pos[k][1] + 0.5) * (h / rows) });
  g.strokeStyle = cssColor('--muted'); g.lineWidth = 1;
  for (const [a, b] of alg.edges) { const A = at(a), B = at(b); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
  for (const k of alg.out) { const A = at(k); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(w - 1, A.y); g.stroke(); }
  const box = Math.min(6, h / rows - 1);
  for (let k = 0; k < 4; k++) {
    const A = at(k);
    g.fillStyle = alg.out.includes(k) ? OP_COLORS[k] : cssColor('--panel');
    g.strokeStyle = OP_COLORS[k];
    g.fillRect(A.x - box / 2, A.y - box / 2, box, box);
    g.strokeRect(A.x - box / 2 + .5, A.y - box / 2 + .5, box - 1, box - 1);
  }
}
function drawWaveMini(canvas, wave) {
  const g = setupMini(canvas), w = 44, h = 20;
  g.strokeStyle = cssColor('--line');
  g.beginPath(); g.moveTo(0, h / 2 + .5); g.lineTo(w, h / 2 + .5); g.stroke();
  g.strokeStyle = cssColor('--accent2'); g.lineWidth = 1.4;
  g.beginPath();
  wave.forEach((v, i) => { const x = (i / 32) * w, y = h / 2 - (v / 128) * (h / 2 - 1); if (i) g.lineTo(x, y); else g.moveTo(x, y); g.lineTo(((i + 1) / 32) * w, y); });
  g.stroke();
}
// The bank's file for the FM editor / wave editor writing a file entry.
function bankWriteVoice(n, voice, name) {
  const s = bank.state.fm;
  bank.kind = 'fm';
  bank.put(n, voice, name);
  bank.refresh();
}
function bankWriteWave(n, values) {
  bank.kind = 'scc';
  bank.put(n, values.slice());
  bank.refresh();
}
const bank = new BankView($('bank'), {
  t,
  insertAt: (text) => {
    const c = pane.code;
    c.focus();
    c.setRangeText(text, c.selectionStart, c.selectionEnd, 'end');
    c.dispatchEvent(new Event('input'));
  },
  download: (name, bytes) => download(name, bytes, 'application/octet-stream'),
  kinds: {
    fm: {
      id: 'fm', label: 'FM', first: 1, mark: '@', hasNames: true, defaultFile: 'VOICE.DAT', accept: '.dat,.muc,.mub,.vgm,.vgz,.txt',
      file: () => {
        const f = attachedTagFile('voice', 'voice.dat');
        const bytes = f.file ? new Uint8Array(f.file.data) : null;
        return { name: f.tagged ? f.name : f.file ? f.file.name : '', bytes: bytes && !isScwd(bytes) ? bytes : null };
      },
      setFile: (bytes, { name, link }) => {
        attach(name, bytes.slice().buffer);
        if (link) setFileTag('voice', name);
        scheduleCheck();
      },
      read: (bytes) => readDat(bytes).map((d) => ({ n: d.n, data: d.voice, name: d.name })),
      put: (bytes, n, data, name) => writeDatSlot(bytes || newDatBytes(), n, data, name),
      validFile: (b) => b.length % 32 === 0 && b.length >= 64 && b.length <= 8192 && !isScwd(b),
      muc: () => mucVoices(code.value).map((m) => ({ ...m, data: m.voice, editable: m.form === 'plain' })),
      key: voiceKey,
      usage: () => usageFor(/^[ABCHIJLMNQRS][0-9]?$/),
      describe: (v) => `ALG ${v.alg} FB ${v.fb}`,
      drawMini: drawAlgMini,
      preview: (v) => previewInst({ kind: 'fm', voice: v }),
      initData: () => JSON.parse(JSON.stringify(INIT_VOICE)),
      removeMuc: (m) => replaceRows(m.row, m.endRow, null),
      addMuc: (n, v, name) => addDefinition(voiceLines(n, v, name), mucVoices(code.value)),
      editMuc: (m) => { const def = voiceAt(lines, m.row); if (def) openFmEditor(def); },
      editFile: (n, v, name) => {
        startEdit({ row: 0 }, true);
        waveEdit.dat = n;
        waveEdit.name = name;
        fmEditor.open({ id: n, fb: v.fb, alg: v.alg, ops: v.ops, row: 0, endRow: 0, col: 0, focus: -1, problems: [], oldLines: [] });
      },
      importFile: async (name, bytes) => (await importVoices(name, bytes)).voices.map((x) => ({ data: x.voice, name: x.name })),
    },
    scc: {
      id: 'scc', label: 'SCC', first: 0, mark: '@W', hasNames: false, defaultFile: 'SCCVOICE.DAT', accept: '.dat,.muc,.vgm,.vgz,.fur,.fuw,.txt',
      file: () => {
        const f = attachedTagFile('sccvoice', 'SCCVOICE.DAT');
        const bytes = f.file ? new Uint8Array(f.file.data) : null;
        return { name: f.tagged ? f.name : f.file ? f.file.name : '', bytes: bytes && isScwd(bytes) ? bytes : null };
      },
      // A wave file holds at least one wave: with none left, it and its tag go.
      setFile: (bytes, { name, link }) => {
        if (bytes) { attach(name, bytes.slice().buffer); if (link) setFileTag('sccvoice', name); }
        else { detach(name.toLowerCase()); removeFileTag('sccvoice'); }
        scheduleCheck();
      },
      read: (bytes) => (readScwd(bytes) || []).map((w) => ({ n: w.n, data: w.wave, name: '' })),
      put: (bytes, n, data) => {
        const list = ((bytes && readScwd(bytes)) || []).filter((w) => w.n !== n);
        if (data) list.push({ n, wave: data });
        return writeScwd(list);
      },
      validFile: (b) => !!readScwd(b),
      muc: () => mucWaves(code.value).map((m) => ({ ...m, data: m.wave, editable: true })),
      key: waveKey,
      usage: () => usageFor(/^SCC[A-E][0-9]?$/),
      describe: (w) => waveShape(w) || `${Math.min(...w)}…${Math.max(...w)}`,
      drawMini: drawWaveMini,
      preview: (w) => previewInst({ kind: 'wave', table: w.map((x) => x / 128) }),
      initData: () => Array.from({ length: 32 }, (_, i) => Math.round(127 * Math.sin((2 * Math.PI * (i + 0.5)) / 32))),
      removeMuc: (m) => replaceRows(m.row, m.endRow, null),
      addMuc: (n, w) => addDefinition([waveLine(n, w)], mucWaves(code.value), true),
      editMuc: (m) => { const def = waveAt(lines, m.row, code.value); if (def) openWaveEditor(def); },
      editFile: (n, w) => {
        startEdit({ row: 0 }, false);
        waveEdit.scc = n;
        waveEditor.open({ id: n, values: w.slice(), expected: 32, row: 0, endRow: 0, col: 2, closed: true, indent: '  ' });
      },
      importFile: async (name, bytes) => (await importWaves(name, bytes)).waves.map((x) => ({ data: x.wave })),
    },
  },
});
bankReady = true;
let bankTimer = 0;
function scheduleBank() {
  if (splitMode !== 'bank') return;
  clearTimeout(bankTimer);
  bankTimer = setTimeout(() => bank.refresh(), 200);
}
// Replaces rows from..to (1-based) of the text with `rows` (null: removes them).
function replaceRows(from, to, rows) {
  const starts = [0];
  for (let i = 0; i < lines.length; i++) starts.push(starts[i] + lines[i].length + 1);
  const a = starts[from - 1];
  let b = to < lines.length ? starts[to] : code.value.length;
  const text = rows ? rows.join('\n') + '\n' : '';
  // Removing a definition takes the blank line after it too.
  if (!rows && lines[to] === '' && to < lines.length) b = starts[to + 1] ?? code.value.length;
  code.setRangeText(text, a, b, 'preserve');
  code.dispatchEvent(new Event('input'));
}
// A new definition: after the last one of its kind, or (waves) before the first part line,
// or at the end.
function addDefinition(rows, defs, beforeMusic = false) {
  let after = defs.length ? defs[defs.length - 1].endRow : lines.length;
  if (!defs.length && beforeMusic) {
    const first = lines.findIndex((l) => partLine(l));
    if (first >= 0) after = first;
  }
  const starts = [0];
  for (let i = 0; i < lines.length; i++) starts.push(starts[i] + lines[i].length + 1);
  const at = after < lines.length ? starts[after] : code.value.length;
  const text = (at === code.value.length && !code.value.endsWith('\n') ? '\n' : '') + (defs.length ? '' : '\n') + rows.join('\n') + '\n' + (defs.length || at === code.value.length ? '' : '\n');
  code.setRangeText(text, at, at, 'preserve');
  code.dispatchEvent(new Event('input'));
}
// #voice / #sccvoice: the existing tag gets the new name, or one is added after the first
// header tags (before the music, where MUCOMSX wants #sccvoice).
function setFileTag(tag, name) {
  const m = new RegExp(`^#${tag}[ \\t]+([^\\s;]+)`, 'im').exec(code.value);
  if (m) {
    const at = m.index + m[0].length - m[1].length;
    if (m[1] !== name) { code.setRangeText(name, at, at + m[1].length, 'preserve'); code.dispatchEvent(new Event('input')); }
    return;
  }
  let row = 0;
  while (row < lines.length && /^#/.test(lines[row]) && !/^#\s*\*/.test(lines[row])) row++;
  const starts = [0];
  for (let i = 0; i < lines.length; i++) starts.push(starts[i] + lines[i].length + 1);
  const at = row < lines.length ? starts[row] : code.value.length;
  code.setRangeText(`#${tag} ${name}\n`, at, at, 'preserve');
  code.dispatchEvent(new Event('input'));
}
function removeFileTag(tag) {
  const m = new RegExp(`^#${tag}[ \\t]+[^\\n]*\\n?`, 'im').exec(code.value);
  if (!m) return;
  code.setRangeText('', m.index, m.index + m[0].length, 'preserve');
  code.dispatchEvent(new Event('input'));
}
// In the voice / PCM files card; opening it from the channel view goes back to the editor.
$('bankToggle').addEventListener('click', () => {
  if (splitMode !== 'bank' && viewMode === 'channels') setView('editor');
  setSplit(splitMode === 'bank' ? 'off' : 'bank');
});
for (const p of panes) p.code.addEventListener('input', scheduleBank);

// ---------- start ----------
{
  const savedVolume = store.get(STORE_VOLUME);
  if (savedVolume !== null) $('volume').value = savedVolume;
  const savedFont = store.get(STORE_FONT);
  if (savedFont !== null) setFontSize(savedFont);
  const savedUi = store.get(STORE_UI);
  if (savedUi !== null) setUiSize(savedUi);
  setZoom(DEFAULT_SCALE);
  // Restore your text synchronously so nothing loaded later can overwrite what you type.
  // An empty editor stays empty (New); only a first visit gets the demo.
  const saved = store.get(STORE_SOURCE);
  if (saved !== null) {
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
    if (saved === null && !code.value) {
      const demo = decodeText(await (await fetch('demo.muc')).arrayBuffer());
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
