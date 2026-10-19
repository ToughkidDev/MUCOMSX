// MUCOM88 MML reference for the editor's suggestions, taken from the MUCEdit manual
// (MUCEdit/MUCEdit*.md) and the MUCOMSX extension guides. Each entry:
//   label   what is shown and matched against what you type (case matters in MML)
//   insert  text inserted; "$0" marks where the caret goes (default: the end)
//   sig     the argument form
//   on      part kinds it applies to: fm, ssg, rhythm, pcm (omitted: all)
//   en/ko/ja  one-line descriptions

export const TAGS = [
  { label: '#mucom88', insert: '#mucom88 1.7', en: 'MUCOM88 version information', ko: 'MUCOM88 버전 정보', ja: 'MUCOM88のバージョン情報' },
  { label: '#title', insert: '#title $0', en: 'Song title', ko: '곡 제목', ja: '曲名' },
  { label: '#composer', insert: '#composer $0', en: 'Composer', ko: '작곡자', ja: '作曲者' },
  { label: '#author', insert: '#author $0', en: 'Who made this MUC (author, arranger)', ko: 'MUC 제작자·편곡자', ja: 'MUCの作者・編曲者' },
  { label: '#date', insert: '#date $0', en: 'Date', ko: '날짜', ja: '日付' },
  { label: '#comment', insert: '#comment $0', en: 'Description or comment', ko: '설명이나 메모', ja: '説明・コメント' },
  { label: '#voice', insert: '#voice $0', en: 'External FM voice file, e.g. VOICE.DAT. Keep it in the header at the top', ko: '외부 FM 음색 파일 (예: VOICE.DAT). 파일 맨 위 헤더에 두세요', ja: '外部FM音色ファイル（例: VOICE.DAT）。先頭のヘッダーに置きます' },
  { label: '#pcm', insert: '#pcm $0', en: 'PCM bank file for part K, e.g. PCM01.BIN', ko: 'K 파트용 PCM 뱅크 파일 (예: PCM01.BIN)', ja: 'Kパート用PCMバンクファイル（例: PCM01.BIN）' },
  { label: '#SSGExtend', insert: '#SSGExtend On', en: 'MUCOMSX: play D/E/F through SCC/SCC+ (needs the cartridge)', ko: 'MUCOMSX: D/E/F를 SCC/SCC+로 연주 (카트리지 필요)', ja: 'MUCOMSX: D/E/FをSCC/SCC+で演奏（カートリッジが必要）' },
  { label: '#PCMInvert', insert: '#PCMInvert On', en: 'MUCOMSX: reverse K\'s relative octave > and < at compile time', ko: 'MUCOMSX: K 파트의 상대 옥타브 >, <를 컴파일 때 반대로', ja: 'MUCOMSX: Kの相対オクターブ>と<をコンパイル時に反転' },
  { label: '#*', insert: '#*$0{}', en: 'Macro definition: #*1{o4 l8 cdef}, called as *1', ko: '매크로 정의: #*1{o4 l8 cdef}, 호출은 *1', ja: 'マクロ定義: #*1{o4 l8 cdef}、呼び出しは*1' },
];

// Part letters at the start of a line. kind decides which commands are suggested.
export const PARTS = [
  { label: 'A', kind: 'fm', en: 'FM 1', ko: 'FM 1', ja: 'FM 1' },
  { label: 'B', kind: 'fm', en: 'FM 2', ko: 'FM 2', ja: 'FM 2' },
  { label: 'C', kind: 'fm', en: 'FM 3', ko: 'FM 3', ja: 'FM 3' },
  { label: 'D', kind: 'ssg', en: 'SSG 1', ko: 'SSG 1', ja: 'SSG 1' },
  { label: 'E', kind: 'ssg', en: 'SSG 2', ko: 'SSG 2', ja: 'SSG 2' },
  { label: 'F', kind: 'ssg', en: 'SSG 3', ko: 'SSG 3', ja: 'SSG 3' },
  { label: 'G', kind: 'rhythm', en: 'Rhythm (v takes 7 values)', ko: '리듬 (v는 값 7개)', ja: 'リズム（vは7つの値）' },
  { label: 'H', kind: 'fm', en: 'FM 4', ko: 'FM 4', ja: 'FM 4' },
  { label: 'I', kind: 'fm', en: 'FM 5', ko: 'FM 5', ja: 'FM 5' },
  { label: 'J', kind: 'fm', en: 'FM 6', ko: 'FM 6', ja: 'FM 6' },
  { label: 'K', kind: 'pcm', en: 'ADPCM (needs #pcm)', ko: 'ADPCM (#pcm 필요)', ja: 'ADPCM（#pcmが必要）' },
  { label: 'MSXA', kind: 'fm', en: 'MUCOMSX: MSX-MUSIC (YM2413) 1; MSXB/C/H/I/J are 2–6', ko: 'MUCOMSX: MSX-MUSIC(YM2413) 1, MSXB/C/H/I/J는 2–6', ja: 'MUCOMSX: MSX-MUSIC（YM2413）1、MSXB/C/H/I/Jは2–6' },
  { label: 'MSXD', kind: 'ssg', en: 'MUCOMSX: internal MSX PSG 1; MSXE/F are 2–3', ko: 'MUCOMSX: MSX 내장 PSG 1, MSXE/F는 2–3', ja: 'MUCOMSX: MSX内蔵PSG 1、MSXE/Fは2–3' },
  { label: 'MSXG', kind: 'rhythm', en: 'MUCOMSX: MSX-MUSIC rhythm', ko: 'MUCOMSX: MSX-MUSIC 리듬', ja: 'MUCOMSX: MSX-MUSICリズム' },
];

export const COMMANDS = [
  // notes and lengths
  { label: 'r', sig: 'r[length]', en: 'Rest', ko: '쉼표', ja: '休符' },
  { label: 'o', sig: 'o1–o8', on: ['fm', 'ssg', 'pcm'], en: 'Octave', ko: '옥타브', ja: 'オクターブ' },
  { label: '>', sig: '>', on: ['fm', 'ssg', 'pcm'], en: 'Octave up', ko: '옥타브 올림', ja: 'オクターブを上げる' },
  { label: '<', sig: '<', on: ['fm', 'ssg', 'pcm'], en: 'Octave down', ko: '옥타브 내림', ja: 'オクターブを下げる' },
  { label: 'l', sig: 'l4, l8, l16 …', en: 'Default length for notes written without one (never l0)', ko: '길이를 안 적은 음표의 기본 길이 (l0은 안 됨)', ja: '音長を書かない音符の基本音長（l0は不可）' },
  { label: '%', sig: 'c%12', en: 'Length in clocks instead of a note value', ko: '음표 길이를 클록으로 직접 지정', ja: '音長をクロックで直接指定' },
  { label: '&', sig: 'c4&c4', en: 'Tie to the next note', ko: '다음 음표와 붙임(타이)', ja: '次の音符とつなぐ（タイ）' },
  { label: '^', sig: '^length', en: 'Add to the length of the preceding note', ko: '앞 음표의 길이를 늘림', ja: '直前の音符の音長を足す' },
  { label: 'C', sig: 'C128', en: 'Base clock: clocks per whole note (default 128)', ko: '기준 클록: 온음표 하나의 클록 수 (기본 128)', ja: '基準クロック：全音符のクロック数（既定128）' },
  // tempo
  { label: 'T', sig: 'T120', en: 'Tempo in BPM (converted to Timer-B)', ko: 'BPM 템포 (Timer-B로 변환)', ja: 'BPMのテンポ（Timer-Bに変換）' },
  { label: 't', sig: 't225', en: 'Raw Timer-B value. t225 is not 225 BPM', ko: 'Timer-B 값 직접 지정. t225는 225 BPM이 아님', ja: 'Timer-B値を直接指定。t225は225 BPMではない' },
  // volume, gate, pan, voice
  { label: 'v', sig: 'v0–15 (SSG)', on: ['fm', 'ssg', 'pcm'], en: 'Volume; for SSG 0–15 is easiest. Range differs by part type', ko: '음량. SSG는 0–15가 기준. 파트 종류마다 범위가 다름', ja: '音量。SSGは0–15が目安。パートの種類で範囲が異なる' },
  { label: 'v', insert: 'v63,31,31,31,31,31,31', sig: 'vtotal,BD,SD,TOP,HH,TOM,RIM', on: ['rhythm'], en: 'Rhythm volumes: overall, then each instrument (7 values)', ko: '리듬 음량: 전체, 그다음 악기별 (값 7개)', ja: 'リズム音量：全体、続いて各楽器（7つの値）' },
  { label: ')', sig: ')[n]', on: ['fm', 'ssg', 'pcm'], en: 'Volume up', ko: '음량 올림', ja: '音量を上げる' },
  { label: '(', sig: '([n]', on: ['fm', 'ssg', 'pcm'], en: 'Volume down', ko: '음량 내림', ja: '音量を下げる' },
  { label: 'V', sig: 'Vn', en: 'Overall volume offset', ko: '전체 음량 오프셋', ja: '全体音量オフセット' },
  { label: 'q', sig: 'q0–', on: ['fm', 'ssg', 'pcm'], en: 'Cut the note this much early. q0 holds to the end', ko: '음을 이만큼 일찍 끊음. q0은 끝까지 유지', ja: '音をこれだけ早く切る。q0は最後まで伸ばす' },
  { label: 'p', sig: 'p1 right, p2 left, p3 both', on: ['fm', 'pcm'], en: 'Pan. p0 can silence both sides', ko: '팬. p0은 양쪽이 모두 꺼질 수 있음', ja: 'パン。p0は両方とも消えることがある' },
  { label: '@', sig: '@n', on: ['fm'], en: 'FM voice number (from #voice or an inline definition)', ko: 'FM 음색 번호 (#voice 파일이나 인라인 정의)', ja: 'FM音色番号（#voiceかインライン定義）' },
  { label: '@', sig: '@n', on: ['ssg'], en: 'SSG preset (not an FM voice)', ko: 'SSG 프리셋 (FM 음색과 다름)', ja: 'SSGプリセット（FM音色とは別）' },
  { label: '@', sig: '@n  1 BD 2 SD 4 TOP 8 HH 16 TOM 32 RIM', on: ['rhythm'], en: 'Rhythm instruments; add numbers to hit several (@9 = BD+HH)', ko: '리듬 악기. 숫자를 더하면 동시에 (@9 = BD+HH)', ja: 'リズム楽器。数を足すと同時発音（@9 = BD+HH）' },
  { label: '@', sig: '@n', on: ['pcm'], en: 'PCM sample number in the #pcm bank', ko: '#pcm 뱅크의 PCM 샘플 번호', ja: '#pcmバンクのPCMサンプル番号' },
  // pitch
  { label: 'D', sig: 'Dn', en: 'Detune; the effect differs by sound source', ko: '디튠. 음원 종류에 따라 효과가 다름', ja: 'デチューン。音源で効果が異なる' },
  { label: 'K', sig: 'Kn', en: 'Transpose (absolute)', ko: '조옮김 (절대)', ja: '移調（絶対）' },
  { label: 'k', sig: 'kn', en: 'Transpose (relative)', ko: '조옮김 (상대)', ja: '移調（相対）' },
  { label: 's', sig: 'sn', en: 'Shuffle: alternating note-length adjustment', ko: '셔플: 음 길이를 번갈아 조정', ja: 'シャッフル：音長を交互に調整' },
  { label: '{', insert: '{$0}', sig: '{c>c}4', on: ['fm', 'ssg', 'pcm'], en: 'Portamento: slide between the notes in braces', ko: '포르타멘토: 중괄호 안의 음 사이를 미끄러지듯', ja: 'ポルタメント：括弧内の音の間をなめらかに' },
  // LFO and effects
  { label: 'M', insert: 'M$0,,,', sig: 'Mdelay,speed,depth-step,depth', en: 'Software LFO (four numbers)', ko: '소프트웨어 LFO (숫자 4개)', ja: 'ソフトウェアLFO（4つの数）' },
  { label: 'MF', sig: 'MF0 / MF1', en: 'Software LFO off / on', ko: '소프트웨어 LFO 끔 / 켬', ja: 'ソフトウェアLFOオフ / オン' },
  { label: 'H', sig: 'H…', on: ['fm'], en: 'Hardware LFO (separate from M, channel limits apply)', ko: '하드웨어 LFO (M과 별개, 채널 제한 있음)', ja: 'ハードウェアLFO（Mとは別、チャンネル制限あり）' },
  { label: 'R', sig: 'R / Rm / RF …', en: 'Reverb family', ko: '리버브 계열', ja: 'リバーブ系' },
  { label: 'y', insert: 'y$0,', sig: 'yregister,value', en: 'Direct register write; can change other sound settings', ko: '레지스터 직접 쓰기. 다른 소리 설정까지 바뀔 수 있음', ja: 'レジスタ直接書き込み。他の音色設定も変わり得る' },
  // SSG
  { label: 'P', sig: 'P1 tone, P0 off', on: ['ssg'], en: 'SSG mix: tone / noise output', ko: 'SSG 믹스: 톤·노이즈 출력', ja: 'SSGミックス：トーン・ノイズ出力' },
  { label: 'w', sig: 'wn', on: ['ssg'], en: 'Noise period', ko: '노이즈 주기', ja: 'ノイズ周期' },
  { label: 'E', insert: 'E$0,,,,,', sig: 'E six values', on: ['ssg'], en: 'Software envelope (six values)', ko: '소프트웨어 엔벨로프 (값 6개)', ja: 'ソフトウェアエンベロープ（6つの値）' },
  { label: 'S', sig: 'Sn', on: ['ssg'], en: 'Hardware envelope shape', ko: '하드웨어 엔벨로프 모양', ja: 'ハードウェアエンベロープの形' },
  { label: 'm', sig: 'mn', on: ['ssg'], en: 'Hardware envelope period', ko: '하드웨어 엔벨로프 주기', ja: 'ハードウェアエンベロープ周期' },
  // structure
  { label: '[', insert: '[$0]2', sig: '[ … ]n', en: 'Repeat n times (up to 16 levels)', ko: 'n번 반복 (최대 16단계 중첩)', ja: 'n回繰り返し（16段まで）' },
  { label: '/', sig: '[ … / … ]n', en: 'Leave the repeat here on the last pass', ko: '마지막 반복에서 여기서 빠져나감', ja: '最後の繰り返しでここから抜ける' },
  { label: 'L', sig: 'L', en: 'Song loop point for this part', ko: '이 파트의 곡 루프 지점', ja: 'このパートのループ位置' },
  { label: '*', sig: '*n', en: 'Call macro n (defined with #*n{…})', ko: '매크로 n 호출 (#*n{…}로 정의)', ja: 'マクロnを呼び出す（#*n{…}で定義）' },
  { label: '|', sig: '|', en: 'Separator for readability only', ko: '읽기 쉽게 하는 구분 기호일 뿐', ja: '読みやすくするための区切りのみ' },
  { label: ':', sig: ':', en: 'Stop compiling this part from here', ko: '이 파트는 여기부터 컴파일하지 않음', ja: 'このパートはここから先をコンパイルしない' },
  { label: ';', sig: '; text', en: 'Comment to the end of the line', ko: '줄 끝까지 주석', ja: '行末までコメント' },
];

// Inline FM voice definition, offered at the start of an indented line.
export const VOICE_TEMPLATE = {
  label: '@ voice',
  insert: '  @$0\n   0,7\n   31,8,4,6,8,36,0,1,0\n   31,8,4,6,8,36,0,1,0\n   31,8,4,6,8,36,0,1,0\n   31,8,4,6,8,36,0,1,0',
  sig: '@n / FB,ALG / 4× AR,D1R,D2R,RR,D1L,TL,KS,ML,DT',
  en: 'Inline FM voice definition (no voice file needed)', ko: '인라인 FM 음색 정의 (음색 파일 불필요)', ja: 'インラインFM音色定義（音色ファイル不要）',
};
