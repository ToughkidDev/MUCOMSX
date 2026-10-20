// Tooltips: a fuller explanation of every button and control, in English, Korean and
// Japanese, kept in one place. applyTips(root, lang) sets the title of the controls it finds
// under root (the page calls it when the language changes and whenever an editor, the
// tracker or the keys build their controls); bankTip(lang, what, kind) gives the voice bank's
// tooltips for its FM / SCC / PCM tabs.

const TIPS = [
  // ---------- header ----------
  ['.lang [data-lang="en"]', 'Show the page in English (remembered in this browser)', '페이지를 영어로 표시합니다 (이 브라우저에 기억됨)', 'ページを英語で表示します（このブラウザに記憶）'],
  ['.lang [data-lang="ko"]', 'Show the page in Korean (remembered in this browser)', '페이지를 한국어로 표시합니다 (이 브라우저에 기억됨)', 'ページを韓国語で表示します（このブラウザに記憶）'],
  ['.lang [data-lang="ja"]', 'Show the page in Japanese (remembered in this browser)', '페이지를 일본어로 표시합니다 (이 브라우저에 기억됨)', 'ページを日本語で表示します（このブラウザに記憶）'],
  ['#fontSize', 'Text size of the MUC editor (10–24 px). Remembered in this browser.', 'MUC 에디터의 글자 크기 (10–24px). 이 브라우저에 기억됩니다.', 'MUCエディタの文字サイズ（10–24px）。このブラウザに記憶されます。'],
  ['#uiSize', 'Size of the menus, buttons and panels (100–200 %; a narrow window allows less). Remembered in this browser.', '메뉴, 버튼, 패널의 크기 (100–200%, 좁은 창에서는 덜 커짐). 이 브라우저에 기억됩니다.', 'メニュー・ボタン・パネルの大きさ（100–200%、狭いウィンドウでは控えめ）。このブラウザに記憶されます。'],

  // ---------- toolbar ----------
  ['#play', 'Compile the MUC and play it from the start. Errors appear under Compiler messages with the place and how to fix them. Pressed while playing, it starts again with the text as it is now. Key: Ctrl+Enter (⌘+Enter); Ctrl+Shift+Enter plays only the caret\'s line.',
    'MUC를 컴파일해서 처음부터 재생합니다. 오류가 있으면 오른쪽 "컴파일 메시지"에 위치와 고치는 법이 나옵니다. 재생 중에 누르면 지금 텍스트로 처음부터 다시 재생합니다. 단축키: Ctrl+Enter (⌘+Enter), 커서가 있는 행만 듣기는 Ctrl+Shift+Enter',
    'MUCをコンパイルして最初から再生します。エラーは右の「コンパイルメッセージ」に場所と直し方が出ます。再生中に押すと今のテキストで最初から再生し直します。キー: Ctrl+Enter（⌘+Enter）、カーソル行だけ試聴は Ctrl+Shift+Enter'],
  ['#stop', 'Stop playing. Key: Esc', '재생을 멈춥니다. 단축키: Esc', '再生を止めます。キー: Esc'],
  ['#viewToggle', 'Switch to the channel view (MDPlayer4Mac\'s look): each chip\'s keyboards, level meters and registers while the song plays. Press again for the editor. Playing a .mub / .vgm file opens it by itself.',
    '채널 뷰(MDPlayer4Mac 모양)로 바꿉니다. 재생 중 칩마다 건반, 레벨 미터, 레지스터가 보입니다. 다시 누르면 에디터로 돌아옵니다. .mub / .vgm 파일을 재생하면 저절로 열립니다.',
    'チャンネルビュー（MDPlayer4Macの見た目）に切り替えます。再生中、チップごとの鍵盤・レベルメーター・レジスタが見えます。もう一度押すとエディタに戻ります。.mub / .vgm を再生すると自動で開きます。'],
  ['#volume', 'Playback volume, also for the editors\' Listen, the bank\'s previews and the keys. Remembered in this browser.', '재생 음량입니다. 편집기의 듣기, 뱅크 미리듣기, 건반 소리에도 적용됩니다. 이 브라우저에 기억됩니다.', '再生音量です。エディタの試聴、バンクの試聴、鍵盤の音にも効きます。このブラウザに記憶されます。'],
  ['#examples', 'Pick a song: "Your song" is the text in the editor (saved in this browser as you type), then the demo and the template; a sample opened from Samples… is listed too. Your own text is not replaced without asking.',
    '곡 고르기: "내 곡"은 지금 에디터의 텍스트(입력하는 대로 이 브라우저에 저장됨)이고, 그 아래 데모와 템플릿, 샘플…에서 연 곡이 있습니다. 내 텍스트는 묻지 않고 바뀌지 않습니다.',
    '曲を選ぶ:「自分の曲」はエディタのテキスト（入力するたびにこのブラウザに保存）、その下にデモとテンプレート、サンプル…で開いた曲があります。自分のテキストは確認なしに置き換わりません。'],
  ['#newSong', 'Start a new song from the template: every part of the OPNA and the MSX chips (PSG, SCC, OPLL, …) with a comment explaining it. Asks first when it would replace your text.',
    '템플릿으로 새 곡을 시작합니다. OPNA와 MSX 칩(PSG, SCC, OPLL …)의 모든 파트가 설명 주석과 함께 들어 있습니다. 내 텍스트를 바꾸게 되면 먼저 묻습니다.',
    'テンプレートで新しい曲を始めます。OPNAとMSXチップ（PSG、SCC、OPLL …）の全パートが説明コメント付きで入っています。自分のテキストを置き換える場合は先に確認します。'],
  ['#browse', 'Browse the sample songs (the repository\'s Samples folder): search by name, click one to open and play it; its voice and PCM files come with it.',
    '샘플 곡(저장소의 Samples 폴더)을 둘러봅니다. 이름으로 검색하고 클릭하면 열어서 재생하며, 곡의 음색·PCM 파일도 함께 불러옵니다.',
    'サンプル曲（リポジトリのSamplesフォルダ）を見ます。名前で検索し、クリックすると開いて再生し、曲の音色・PCMファイルも一緒に読み込みます。'],
  ['#open', 'Open files from your computer: pick the song (.muc goes into the editor, .mub / .vgm / .vgz play at once) together with its voice / PCM files (.dat, .pcm, .bin, .wav) with Ctrl/⌘ or Shift + click, and they are attached with it. A song alone takes its files from the folder opened with Folder…, when it is there. Dropping files on the page does the same.',
    '내 컴퓨터의 파일을 엽니다. 곡(.muc는 에디터로, .mub / .vgm / .vgz는 바로 재생)과 그 음색·PCM 파일(.dat, .pcm, .bin, .wav)을 Ctrl/⌘나 Shift+클릭으로 함께 고르면 같이 첨부됩니다. 곡만 열면 폴더…로 연 폴더에 그 곡이 있을 때 거기서 파일을 가져옵니다. 페이지에 끌어다 놓아도 같습니다.',
    '自分のパソコンのファイルを開きます。曲（.mucはエディタへ、.mub / .vgm / .vgzはすぐ再生）とその音色・PCMファイル（.dat、.pcm、.bin、.wav）をCtrl/⌘やShift+クリックで一緒に選ぶと一緒に添付されます。曲だけを開くと、フォルダ…で開いたフォルダにその曲があればそこからファイルを取り込みます。ページへのドロップでも同じです。'],
  ['#openFolder', 'Open a folder on this computer and choose a song from it: the voice / PCM files the song names (#voice, #sccvoice, #pcm, #@pcm) are found in the folder by name and attached with it. Chrome / Edge remember the folder for next time. Dropping a folder on the page does the same.',
    '내 컴퓨터의 폴더를 열고 그 안의 곡을 고릅니다. 곡이 지정한 음색·PCM 파일(#voice, #sccvoice, #pcm, #@pcm)을 폴더에서 이름으로 찾아 함께 첨부합니다. Chrome / Edge는 폴더를 기억해 다음에 바로 엽니다. 폴더를 페이지에 끌어다 놓아도 됩니다.',
    '自分のパソコンのフォルダを開き、その中の曲を選びます。曲が指定した音色・PCMファイル（#voice、#sccvoice、#pcm、#@pcm）をフォルダから名前で探して一緒に添付します。Chrome / Edgeはフォルダを記憶し次回すぐ開きます。フォルダをページにドロップしても同じです。'],
  ['#folderSearch', 'Type part of a song\'s or folder\'s name to narrow the list', '곡이나 폴더 이름의 일부를 입력하면 목록이 좁혀집니다', '曲やフォルダの名前の一部を入力すると一覧が絞られます'],
  ['#folderPick', 'Choose another folder', '다른 폴더를 고릅니다', '別のフォルダを選びます'],
  ['#folderClose', 'Close the list (Esc)', '목록을 닫습니다 (Esc)', '一覧を閉じます（Esc）'],
  ['#saveLabel', 'Save the song to your computer as .muc (the buttons beside it save .mub or .vgm). Key: Ctrl+S (⌘+S)', '곡을 내 컴퓨터에 .muc로 저장합니다 (옆 버튼으로 .mub, .vgm도 저장). 단축키: Ctrl+S (⌘+S)', '曲を自分のパソコンに.mucで保存します（横のボタンで.mub、.vgmも保存）。キー: Ctrl+S（⌘+S）'],
  ['#save', '.muc: the MML text in Shift-JIS, as MUCOM88 and MUCOMSX read it. Characters Shift-JIS cannot hold are pointed out first. Key: Ctrl+S',
    '.muc: MML 텍스트를 Shift-JIS로 저장합니다 (MUCOM88·MUCOMSX가 읽는 형식). Shift-JIS로 쓸 수 없는 글자가 있으면 먼저 알려 줍니다. 단축키: Ctrl+S',
    '.muc: MMLテキストをShift-JISで保存します（MUCOM88・MUCOMSXが読む形式）。Shift-JISで書けない文字があれば先に知らせます。キー: Ctrl+S'],
  ['#saveMub', '.mub: the compiled song (with its voices and PCM), for MUCOM88 / mucomDotNET players such as MDPlayer.', '.mub: 컴파일한 곡 데이터(음색과 PCM 포함)를 저장합니다. MDPlayer 같은 MUCOM88 / mucomDotNET 플레이어용입니다.', '.mub: コンパイルした曲データ（音色とPCMを含む）を保存します。MDPlayerなどMUCOM88 / mucomDotNETプレイヤー用です。'],
  ['#saveVgm', '.vgm: what the song writes to the chips, register by register, for any VGM player.', '.vgm: 곡이 칩에 쓰는 레지스터 기록을 저장합니다. 어떤 VGM 플레이어로도 재생할 수 있습니다.', '.vgm: 曲がチップに書くレジスタの記録を保存します。どのVGMプレイヤーでも再生できます。'],

  // ---------- under the editor ----------
  ['[data-split="off"]', 'One view of the text', '텍스트를 창 하나로 봅니다', 'テキストを1画面で表示'],
  ['[data-split="side"]', 'Two views of the same text side by side, to edit one place while looking at another', '같은 텍스트를 좌우 두 창으로 봅니다. 한쪽을 보면서 다른 곳을 편집할 때', '同じテキストを左右2画面で表示。一方を見ながら別の場所を編集するときに'],
  ['[data-split="stack"]', 'Two views of the same text, one above the other', '같은 텍스트를 위아래 두 창으로 봅니다', '同じテキストを上下2画面で表示'],
  ['#trackerToggle', 'Tracker mode: the song as a Furnace-style pattern beside the text, every part a column. Edit either side; the pattern scrolls with the playback. Press again to close.',
    '트래커 모드: 곡을 텍스트 옆에 Furnace 같은 패턴으로 보여 줍니다(파트마다 한 열). 양쪽 어디서든 편집하고, 재생하면 패턴이 따라 스크롤됩니다. 다시 누르면 닫힙니다.',
    'トラッカーモード: 曲をテキストの横にFurnace風のパターンで表示します（パートごとに1列）。どちらでも編集でき、再生するとパターンがスクロールします。もう一度押すと閉じます。'],
  ['#keysToggle', 'Keys mode: a piano under the editor, played with the mouse, a finger or the computer keyboard (Z S X D C … / Q 2 W 3 E …), with the sound of the part at the caret. Press again to close.',
    '건반 모드: 에디터 아래에 건반을 열고 마우스, 손가락, 컴퓨터 키보드(Z S X D C … / Q 2 W 3 E …)로 연주합니다. 커서가 있는 파트의 소리가 납니다. 다시 누르면 닫힙니다.',
    '鍵盤モード: エディタの下に鍵盤を出し、マウス・指・キーボード（Z S X D C … / Q 2 W 3 E …）で演奏します。カーソルのあるパートの音が鳴ります。もう一度押すと閉じます。'],
  ['#cvZoom', 'Size of the channel view; each press steps through the sizes (Fit fills the window)', '채널 뷰의 크기. 누를 때마다 크기가 바뀝니다 (화면 맞춤은 창에 꽉 차게)', 'チャンネルビューの大きさ。押すたびに切り替わります（画面に合わせるはウィンドウいっぱい）'],
  ['#follow', 'While playing, scroll the text (and the tracker) to what is playing. Off: the view stays where you put it.', '재생 중에 텍스트(와 트래커)가 연주 위치를 따라 스크롤합니다. 끄면 화면이 그대로 있습니다.', '再生中、テキスト（とトラッカー）が演奏位置に合わせてスクロールします。オフにすると画面は動きません。'],

  // ---------- side panel ----------
  ['#addFiles', 'Attach the files the song names: voice files (#voice), SCC wave files (#sccvoice), PCM banks (#pcm) and WAVs (#@pcm); several at once. They are kept in this browser with the song. Dropping them on the page attaches them too.',
    '곡이 쓰는 파일을 첨부합니다: 음색 파일(#voice), SCC 파형 파일(#sccvoice), PCM 뱅크(#pcm), WAV(#@pcm). 여러 개를 한 번에 고를 수 있고, 이 브라우저에 곡과 함께 보관됩니다. 페이지에 끌어다 놓아도 첨부됩니다.',
    '曲が使うファイルを添付します: 音色ファイル（#voice）、SCC波形ファイル（#sccvoice）、PCMバンク（#pcm）、WAV（#@pcm）。複数まとめて選べ、このブラウザに曲と一緒に保存されます。ページへのドロップでも添付されます。'],
  ['#bankToggle', 'FM voice bank: the song\'s FM voices (voice file and MUC definitions) as a list beside the text, to hear, edit, import, move and save them. Press again to close; ? in the bank lists its keys.',
    'FM 음색 뱅크: 곡의 FM 음색(음색 파일과 MUC 정의)을 텍스트 옆에 목록으로 보여 줍니다. 듣기, 편집, 가져오기, 옮기기, 저장을 합니다. 다시 누르면 닫히고, 뱅크에서 ? 키를 누르면 단축키 목록이 나옵니다.',
    'FM音色バンク: 曲のFM音色（音色ファイルとMUCの定義）をテキストの横に一覧表示し、試聴・編集・インポート・移動・保存をします。もう一度押すと閉じ、バンクで?を押すとキー一覧が出ます。'],
  ['#sccBankToggle', 'SCC wave bank: the song\'s SCC waves (wave file and MUC @Wn definitions) as a list beside the text. Press again to close; ? in the bank lists its keys.',
    'SCC 파형 뱅크: 곡의 SCC 파형(파형 파일과 MUC의 @Wn 정의)을 텍스트 옆에 목록으로 보여 줍니다. 다시 누르면 닫히고, 뱅크에서 ? 키를 누르면 단축키 목록이 나옵니다.',
    'SCC波形バンク: 曲のSCC波形（波形ファイルとMUCの@Wn定義）をテキストの横に一覧表示します。もう一度押すと閉じ、バンクで?を押すとキー一覧が出ます。'],
  ['#pcmBankToggle', 'ADPCM sample bank: the song\'s PCM samples for the K part (#pcm bank file or #@pcm WAVs) as a list beside the text, with a sample editor. Press again to close; ? in the bank lists its keys.',
    'ADPCM 샘플 뱅크: K 파트가 쓰는 PCM 샘플(#pcm 뱅크 파일 또는 #@pcm WAV)을 텍스트 옆에 목록으로 보여 주고 샘플 편집기로 편집합니다. 다시 누르면 닫히고, 뱅크에서 ? 키를 누르면 단축키 목록이 나옵니다.',
    'ADPCMサンプルバンク: Kパートが使うPCMサンプル（#pcmバンクファイルまたは#@pcm WAV）をテキストの横に一覧表示し、サンプルエディタで編集します。もう一度押すと閉じ、バンクで?を押すとキー一覧が出ます。'],
  ['#sampleSearch', 'Type part of a song\'s or folder\'s name to narrow the list', '곡이나 폴더 이름의 일부를 입력하면 목록이 좁혀집니다', '曲やフォルダの名前の一部を入力すると一覧が絞られます'],
  ['#sampleRefresh', 'Read the list of samples from the repository again', '저장소에서 샘플 목록을 다시 읽어 옵니다', 'リポジトリからサンプル一覧を読み直します'],
  ['#sampleClose', 'Close the sample list (Esc)', '샘플 목록을 닫습니다 (Esc)', 'サンプル一覧を閉じます（Esc）'],

  // ---------- SCC wave editor ----------
  ['#waveEditor [data-act="undo"]', 'Undo the last change to the wave (Ctrl+Z)', '파형의 마지막 변경을 되돌립니다 (Ctrl+Z)', '波形の最後の変更を元に戻します（Ctrl+Z）'],
  ['#waveEditor [data-act="redo"]', 'Redo what was undone (Ctrl+Y / Ctrl+Shift+Z)', '되돌린 것을 다시 합니다 (Ctrl+Y / Ctrl+Shift+Z)', '元に戻した操作をやり直します（Ctrl+Y / Ctrl+Shift+Z）'],
  ['#waveEditor [data-style="steps"]', 'Steps: draw each sample as a flat step, the way the chip plays it', '계단: 샘플마다 평평한 칸으로 그립니다 (칩이 내는 모양 그대로)', 'ステップ: サンプルごとに平らな段で描きます（チップが鳴らす形そのまま）'],
  ['#waveEditor [data-style="lines"]', 'Lines: join the samples with lines (only the drawing changes)', '선: 샘플 사이를 선으로 이어 그립니다 (그림만 바뀜)', '線: サンプル間を線でつないで描きます（描画だけ変わる）'],
  ['#waveEditor [data-act="listen"]', 'Play the wave as a held note at the octave beside it; changes are heard at once. Press again to stop.', '파형을 옆에서 고른 옥타브의 음으로 계속 들려줍니다. 고치면 바로 들립니다. 다시 누르면 멈춥니다.', '波形を横で選んだオクターブの音で鳴らし続けます。変更はすぐ聞こえます。もう一度押すと止まります。'],
  ['#waveEditor .we-oct', 'Pitch of Listen (C of o2–o6)', '듣기 음 높이 (o2–o6의 C)', '試聴の高さ（o2–o6のC）'],
  ['#waveEditor [data-act="apply"]', 'Write the wave into the song (or the wave file) and keep editing; Play does this by itself', '파형을 곡(또는 파형 파일)에 쓰고 계속 편집합니다. 재생을 누르면 저절로 적용됩니다', '波形を曲（または波形ファイル）に書き込んで編集を続けます。再生を押すと自動で適用されます'],
  ['#waveEditor [data-act="done"]', 'Write the wave and return to the text (or the bank)', '파형을 쓰고 텍스트(또는 뱅크)로 돌아갑니다', '波形を書き込んでテキスト（またはバンク）に戻ります'],
  ['#waveEditor [data-act="cancel"]', 'Return without writing; what was applied already stays', '쓰지 않고 돌아갑니다. 이미 적용한 것은 남습니다', '書き込まずに戻ります。適用済みのものは残ります'],
  ['#waveEditor [data-tab="shapes"]', 'Shapes: make the wave from a sine, triangle, saw or pulse and 16 harmonics (changing a setting replaces the wave)', '도형: 사인·삼각·톱니·펄스와 16개 배음으로 파형을 만듭니다 (설정을 바꾸면 파형이 새로 만들어짐)', 'シェイプ: サイン・三角・のこぎり・パルスと16倍音で波形を作ります（設定を変えると波形が作り直される）'],
  ['#waveEditor [data-tab="fm"]', 'FM: make the wave with four FM operators (level, multiplier, feedback, waveform, connections)', 'FM: 4개의 FM 오퍼레이터(레벨, 배수, 피드백, 파형, 연결)로 파형을 만듭니다', 'FM: 4つのFMオペレータ（レベル・倍率・フィードバック・波形・接続）で波形を作ります'],
  ['#waveEditor [data-tab="tools"]', 'Tools: reshape the wave there is', '도구: 지금 파형을 다듬습니다', 'ツール: 今の波形を加工します'],
  ['#waveEditor [data-tool="offsetX"]', 'Shift the wave sideways by the number of samples (what goes out comes back in at the other end)', '파형을 입력한 샘플 수만큼 옆으로 밉니다 (밀려난 부분은 반대쪽으로 들어옴)', '波形を入力したサンプル数だけ横にずらします（はみ出た分は反対側に入る）'],
  ['#waveEditor [data-tool="offsetY"]', 'Add the number to every sample (clipped to −128…127)', '모든 샘플에 입력한 값을 더합니다 (−128…127로 잘림)', '全サンプルに値を足します（−128…127で切られる）'],
  ['#waveEditor [data-tool="smooth"]', 'Smooth the wave: each sample becomes the average of that many around it', '파형을 부드럽게: 샘플마다 주변 n개의 평균으로 바꿉니다', '波形を滑らかに: 各サンプルを周りn個の平均にします'],
  ['#waveEditor [data-tool="amplify"]', 'Scale the wave around 0 by the percentage', '파형을 0을 기준으로 입력한 % 크기로 바꿉니다', '波形を0を中心に入力した%の大きさにします'],
  ['#waveEditor [data-tool="normalize"]', 'Make the wave as loud as it can be (its peak to 127 / −128)', '파형을 최대 크기로 (가장 큰 값이 127 / −128에 닿게)', '波形を最大の大きさに（ピークを127 / −128に）'],
  ['#waveEditor [data-tool="invert"]', 'Turn the wave upside down', '파형을 위아래로 뒤집습니다', '波形を上下反転します'],
  ['#waveEditor [data-tool="reverse"]', 'Play the wave backwards (left ↔ right)', '파형을 좌우로 뒤집습니다', '波形を左右反転します'],
  ['#waveEditor [data-tool="half"]', 'Stretch the first half over the whole wave', '앞 절반을 파형 전체 길이로 늘립니다', '前半を波形全体に引き伸ばします'],
  ['#waveEditor [data-tool="double"]', 'Squeeze the wave into half and repeat it twice (an octave up)', '파형을 절반으로 줄여 두 번 반복합니다 (한 옥타브 위)', '波形を半分に縮めて2回繰り返します（1オクターブ上）'],
  ['#waveEditor [data-tool="randomize"]', 'Fill the wave with random values (a noisy sound)', '무작위 값으로 채웁니다 (잡음 같은 소리)', 'ランダムな値で埋めます（ノイズのような音）'],
  ['#waveEditor [data-tool="clear"]', 'Set every sample to 0 (silence)', '모든 샘플을 0으로 (무음)', '全サンプルを0に（無音）'],
  ['#waveEditor [data-g="shape"]', 'Base shape of the wave: sine, triangle, saw or pulse', '파형의 기본 모양: 사인, 삼각, 톱니, 펄스', '波形の基本の形: サイン、三角、のこぎり、パルス'],
  ['#waveEditor [data-g="duty"]', 'Duty: where the shape turns over (pulse width for pulse; 0.5 is symmetrical)', '듀티: 모양이 꺾이는 위치 (펄스는 펄스 폭, 0.5면 대칭)', 'デューティ: 形が折り返す位置（パルスはパルス幅、0.5で対称）'],
  ['#waveEditor [data-g="power"]', 'Exponent: bends the shape (1 straight, higher sharper)', '지수: 모양을 휘게 합니다 (1은 그대로, 클수록 뾰족)', '指数: 形を曲げます（1はそのまま、大きいほど鋭く）'],
  ['#waveEditor [data-g="xor"]', 'XOR point: flips part of the wave for buzzier, Furnace-style tones (1 = off)', 'XOR 지점: 파형 일부를 뒤집어 더 거친 Furnace식 음색을 만듭니다 (1 = 끔)', 'XORポイント: 波形の一部を反転してざらついたFurnace風の音色に（1 = オフ）'],
  ['#waveEditor [data-h="amp"]', 'Amplitude of this harmonic (negative inverts it)', '이 배음의 크기 (음수면 뒤집힘)', 'この倍音の大きさ（負で反転）'],
  ['#waveEditor [data-h="phase"]', 'Phase of this harmonic (where its cycle starts)', '이 배음의 위상 (주기가 시작하는 위치)', 'この倍音の位相（周期の始まる位置）'],
  ['#waveEditor [data-f="tl"]', 'Level of this operator (how much it sounds or modulates)', '이 오퍼레이터의 레벨 (얼마나 크게 울리거나 변조하는지)', 'このオペレータのレベル（どれだけ鳴る・変調するか）'],
  ['#waveEditor [data-f="mult"]', 'Multiplier: this operator runs at n times the wave\'s frequency (1–16)', '배수: 이 오퍼레이터가 파형 주파수의 n배로 돕니다 (1–16)', '倍率: このオペレータが波形の周波数のn倍で回ります（1–16）'],
  ['#waveEditor [data-f="fb"]', 'Feedback: the operator modulates itself (0–7)', '피드백: 오퍼레이터가 자기 자신을 변조합니다 (0–7)', 'フィードバック: オペレータが自分自身を変調します（0–7）'],
  ['#waveEditor [data-f="wave"]', 'Waveform of this operator (Furnace\'s 32)', '이 오퍼레이터의 파형 (Furnace의 32가지)', 'このオペレータの波形（Furnaceの32種）'],
  ['#waveEditor [data-c]', 'Connection: the row\'s operator hears this column\'s operator (1–4), or goes to the output (Out)', '연결: 이 행의 오퍼레이터가 이 열의 오퍼레이터(1–4)를 입력으로 받거나, 출력(Out)으로 나갑니다', '接続: この行のオペレータがこの列のオペレータ（1–4）を入力に受けるか、出力（Out）に出ます'],
  ['#waveEditor [data-radix="dec"]', 'Show and type the values as decimal numbers (−128…127)', '값을 10진수(−128…127)로 보고 입력합니다', '値を10進数（−128…127）で表示・入力します'],
  ['#waveEditor [data-radix="hex"]', 'Show and type the values as hex bytes (00…FF)', '값을 16진수(00…FF)로 보고 입력합니다', '値を16進数（00…FF）で表示・入力します'],

  // ---------- FM voice editor ----------
  ['#fmEditor [data-act="undo"]', 'Undo the last change to the voice (Ctrl+Z)', '음색의 마지막 변경을 되돌립니다 (Ctrl+Z)', '音色の最後の変更を元に戻します（Ctrl+Z）'],
  ['#fmEditor [data-act="redo"]', 'Redo what was undone (Ctrl+Y / Ctrl+Shift+Z)', '되돌린 것을 다시 합니다 (Ctrl+Y / Ctrl+Shift+Z)', '元に戻した操作をやり直します（Ctrl+Y / Ctrl+Shift+Z）'],
  ['#fmEditor [data-act="listen"]', 'Play one note with this voice at the octave beside it (an approximation in the page; Play in the toolbar applies the voice and plays the real chip)', '이 음색으로 옆에서 고른 옥타브의 음 하나를 들려줍니다 (페이지 안의 근사치. 툴바의 재생은 음색을 적용하고 실제 칩으로 연주)', 'この音色で横で選んだオクターブの音を1つ鳴らします（ページ内の近似。ツールバーの再生は音色を適用して実際のチップで演奏）'],
  ['#fmEditor .we-oct', 'Pitch of Listen (C of o1–o7)', '듣기 음 높이 (o1–o7의 C)', '試聴の高さ（o1–o7のC）'],
  ['#fmEditor [data-act="init"]', 'Start again from Furnace\'s default FM voice (undo brings the old one back)', 'Furnace의 기본 FM 음색에서 다시 시작합니다 (되돌리기로 원래 음색 복구 가능)', 'Furnaceの初期FM音色からやり直します（元に戻すで前の音色に戻せる）'],
  ['#fmEditor [data-act="apply"]', 'Write the voice into the song (or the voice file) and keep editing; Play does this by itself', '음색을 곡(또는 음색 파일)에 쓰고 계속 편집합니다. 재생을 누르면 저절로 적용됩니다', '音色を曲（または音色ファイル）に書き込んで編集を続けます。再生を押すと自動で適用されます'],
  ['#fmEditor [data-act="done"]', 'Write the voice and return to the text (or the bank)', '음색을 쓰고 텍스트(또는 뱅크)로 돌아갑니다', '音色を書き込んでテキスト（またはバンク）に戻ります'],
  ['#fmEditor [data-act="cancel"]', 'Return without writing; what was applied already stays', '쓰지 않고 돌아갑니다. 이미 적용한 것은 남습니다', '書き込まずに戻ります。適用済みのものは残ります'],
  ['#fmEditor [data-alg="0"]', 'ALG 0: OP1→OP2→OP3→OP4 in a chain; one carrier (OP4). Hard, metallic, basses.', 'ALG 0: OP1→OP2→OP3→OP4 직렬, 캐리어는 OP4 하나. 단단하고 금속적인 소리, 베이스.', 'ALG 0: OP1→OP2→OP3→OP4の直列、キャリアはOP4のみ。硬く金属的な音、ベース。'],
  ['#fmEditor [data-alg="1"]', 'ALG 1: OP1 and OP2 both into OP3, then OP4; one carrier (OP4).', 'ALG 1: OP1과 OP2가 함께 OP3로, 그다음 OP4. 캐리어는 OP4 하나.', 'ALG 1: OP1とOP2が一緒にOP3へ、次にOP4。キャリアはOP4のみ。'],
  ['#fmEditor [data-alg="2"]', 'ALG 2: OP1 and (OP2→OP3) both into OP4; one carrier (OP4).', 'ALG 2: OP1과 (OP2→OP3)가 함께 OP4로. 캐리어는 OP4 하나.', 'ALG 2: OP1と（OP2→OP3）が一緒にOP4へ。キャリアはOP4のみ。'],
  ['#fmEditor [data-alg="3"]', 'ALG 3: (OP1→OP2) and OP3 both into OP4; one carrier (OP4).', 'ALG 3: (OP1→OP2)와 OP3가 함께 OP4로. 캐리어는 OP4 하나.', 'ALG 3: （OP1→OP2）とOP3が一緒にOP4へ。キャリアはOP4のみ。'],
  ['#fmEditor [data-alg="4"]', 'ALG 4: two pairs, OP1→OP2 and OP3→OP4; carriers OP2 and OP4. Brass, pianos, layered sounds.', 'ALG 4: 두 쌍 OP1→OP2, OP3→OP4. 캐리어는 OP2와 OP4. 브라스, 피아노, 겹친 소리.', 'ALG 4: 2組 OP1→OP2、OP3→OP4。キャリアはOP2とOP4。ブラス、ピアノ、重ねた音。'],
  ['#fmEditor [data-alg="5"]', 'ALG 5: OP1 into each of OP2, OP3, OP4; three carriers. Organs, strings.', 'ALG 5: OP1이 OP2, OP3, OP4 각각으로. 캐리어 셋. 오르간, 스트링.', 'ALG 5: OP1がOP2・OP3・OP4それぞれへ。キャリア3つ。オルガン、ストリングス。'],
  ['#fmEditor [data-alg="6"]', 'ALG 6: OP1→OP2, with OP3 and OP4 on their own; three carriers.', 'ALG 6: OP1→OP2, OP3와 OP4는 단독. 캐리어 셋.', 'ALG 6: OP1→OP2、OP3とOP4は単独。キャリア3つ。'],
  ['#fmEditor [data-alg="7"]', 'ALG 7: all four operators on their own, all carriers (additive). Organs, soft tones.', 'ALG 7: 네 오퍼레이터가 모두 단독, 모두 캐리어 (가산 합성). 오르간, 부드러운 소리.', 'ALG 7: 4つのオペレータすべて単独、すべてキャリア（加算合成）。オルガン、柔らかい音。'],
  ['#fmEditor [data-fb]', 'Feedback of OP1 (0–7): OP1 modulates itself; higher is brighter, 6–7 noisy', 'OP1의 피드백 (0–7): OP1이 자기 자신을 변조합니다. 높을수록 밝고, 6–7은 잡음 같음', 'OP1のフィードバック（0–7）: OP1が自分自身を変調します。高いほど明るく、6–7はノイズ的'],
  ['#fmEditor [data-fb-num]', 'Feedback of OP1 (0–7)', 'OP1의 피드백 (0–7)', 'OP1のフィードバック（0–7）'],
  ['#fmEditor [data-copy]', 'Copy this operator\'s settings', '이 오퍼레이터의 설정을 복사합니다', 'このオペレータの設定をコピーします'],
  ['#fmEditor [data-paste]', 'Paste the copied operator\'s settings over this one', '복사한 오퍼레이터의 설정을 여기에 붙여 넣습니다', 'コピーしたオペレータの設定をここに貼り付けます'],

  // ---------- PCM sample editor ----------
  ['#pcmEditor [data-act="undo"]', 'Undo the last change to the sample (Ctrl+Z)', '샘플의 마지막 변경을 되돌립니다 (Ctrl+Z)', 'サンプルの最後の変更を元に戻します（Ctrl+Z）'],
  ['#pcmEditor [data-act="redo"]', 'Redo what was undone (Ctrl+Y / Ctrl+Shift+Z)', '되돌린 것을 다시 합니다 (Ctrl+Y / Ctrl+Shift+Z)', '元に戻した操作をやり直します（Ctrl+Y / Ctrl+Shift+Z）'],
  ['#pcmEditor [data-act="play"]', 'Play the selection (or the whole sample) at the speed beside it; press again to stop. Key: Space', '선택 구간(없으면 전체)을 옆에서 고른 속도로 재생합니다. 다시 누르면 멈춥니다. 단축키: Space', '選択範囲（なければ全体）を横で選んだ速度で再生します。もう一度押すと止まります。キー: Space'],
  ['#pcmEditor .pe-chip', 'Listen to what the chip plays: the sample encoded to ADPCM-B and decoded again (a little rougher than the original)', '칩이 내는 소리로 듣습니다: ADPCM-B로 인코딩했다가 다시 디코딩한 소리 (원음보다 약간 거칠어짐)', 'チップが鳴らす音で聴きます: ADPCM-Bにエンコードして再デコードした音（原音より少し粗い）'],
  ['#pcmEditor .pe-speed', 'Speed of Listen: the sample\'s own rate, or the speed the driver plays it at on a note (o1 c plays 16.1 kHz; each octave up is half as fast)', '듣기 속도: 샘플 자체 레이트, 또는 드라이버가 그 음에서 재생하는 속도 (o1 c는 16.1 kHz, 한 옥타브 올라갈 때마다 절반 속도)', '試聴の速度: サンプル自体のレート、またはドライバがその音で再生する速度（o1 cは16.1 kHz、1オクターブ上がるごとに半分の速さ）'],
  ['#pcmEditor [data-act="apply"]', 'Encode the sample and write it into the bank (or its #@pcm WAV) and keep editing', '샘플을 인코딩해 뱅크(또는 #@pcm WAV)에 쓰고 계속 편집합니다', 'サンプルをエンコードしてバンク（または#@pcm WAV）に書き込み、編集を続けます'],
  ['#pcmEditor [data-act="done"]', 'Write the sample and return to the bank', '샘플을 쓰고 뱅크로 돌아갑니다', 'サンプルを書き込んでバンクに戻ります'],
  ['#pcmEditor [data-act="cancel"]', 'Return without writing; what was applied already stays (Esc)', '쓰지 않고 돌아갑니다. 이미 적용한 것은 남습니다 (Esc)', '書き込まずに戻ります。適用済みのものは残ります（Esc）'],
  ['#pcmEditor .pe-name', 'The sample\'s name in the bank (up to 16 letters and digits)', '뱅크에서 쓰는 샘플 이름 (영문·숫자 16자까지)', 'バンクでのサンプル名（英数字16文字まで）'],
  ['#pcmEditor .pe-vol', 'The entry\'s volume in the bank (the driver uses it in PCM volume mode); for a #@pcm sample it also scales the WAV in percent (100 = as it is)', '뱅크 항목의 볼륨 (드라이버가 PCM 볼륨 모드에서 사용). #@pcm 샘플에서는 WAV 크기를 %로 조절하기도 합니다 (100 = 그대로)', 'バンク項目のボリューム（ドライバがPCMボリュームモードで使用）。#@pcmサンプルではWAVの大きさを%で調整します（100 = そのまま）'],
  ['#pcmEditor [data-act="selAll"]', 'Select the whole sample (Ctrl+A)', '샘플 전체를 선택합니다 (Ctrl+A)', 'サンプル全体を選択します（Ctrl+A）'],
  ['#pcmEditor [data-act="zoomSel"]', 'Zoom the graph to the selection (the mouse wheel zooms too)', '그래프를 선택 구간으로 확대합니다 (마우스 휠로도 확대·축소)', 'グラフを選択範囲に拡大します（マウスホイールでも拡大・縮小）'],
  ['#pcmEditor [data-act="fit"]', 'Show the whole sample', '샘플 전체를 보여 줍니다', 'サンプル全体を表示します'],
  ['#pcmEditor .pe-canvas', 'Drag to select a part; the mouse wheel zooms. Keys: Space listen · Delete delete the selection · Ctrl+A select all · Ctrl+Z / Ctrl+Y undo / redo · Esc cancel', '드래그해서 구간을 고르고, 마우스 휠로 확대·축소합니다. 키: Space 듣기 · Delete 선택 삭제 · Ctrl+A 전체 선택 · Ctrl+Z / Ctrl+Y 되돌리기 / 다시 · Esc 취소', 'ドラッグで範囲を選び、マウスホイールで拡大・縮小します。キー: Space 試聴 · Delete 選択を削除 · Ctrl+A 全選択 · Ctrl+Z / Ctrl+Y 元に戻す / やり直し · Esc キャンセル'],
  ['#pcmEditor [data-tool="trim"]', 'Keep only the selection, dropping what is before and after it', '선택 구간만 남기고 앞뒤를 잘라 냅니다', '選択範囲だけを残し、前後を切り落とします'],
  ['#pcmEditor [data-tool="del"]', 'Cut the selection out; what follows moves up (Delete)', '선택 구간을 잘라 내고 뒤쪽을 당겨 붙입니다 (Delete)', '選択範囲を切り取り、後ろを詰めます（Delete）'],
  ['#pcmEditor [data-tool="silence"]', 'Make the selection (or everything) silent, keeping its length', '선택 구간(없으면 전체)을 길이는 그대로 두고 무음으로 만듭니다', '選択範囲（なければ全体）を長さはそのまま無音にします'],
  ['#pcmEditor [data-tool="fadeIn"]', 'Fade the selection (or everything) in from silence', '선택 구간(없으면 전체)을 무음에서 점점 커지게 합니다', '選択範囲（なければ全体）を無音から徐々に大きくします'],
  ['#pcmEditor [data-tool="fadeOut"]', 'Fade the selection (or everything) out to silence', '선택 구간(없으면 전체)을 점점 작아져 무음이 되게 합니다', '選択範囲（なければ全体）を徐々に小さくして無音にします'],
  ['#pcmEditor [data-tool="normalize"]', 'Make the selection (or everything) as loud as it can be without clipping', '선택 구간(없으면 전체)을 찌그러지지 않는 최대 크기로 키웁니다', '選択範囲（なければ全体）を歪まない最大の大きさにします'],
  ['#pcmEditor [data-tool="reverse"]', 'Play the selection (or everything) backwards', '선택 구간(없으면 전체)을 거꾸로 재생되게 뒤집습니다', '選択範囲（なければ全体）を逆再生になるよう反転します'],
  ['#pcmEditor [data-tool="invert"]', 'Turn the waveform upside down (sounds the same alone; matters when mixed)', '파형을 위아래로 뒤집습니다 (혼자서는 같은 소리, 다른 소리와 섞일 때 차이)', '波形を上下反転します（単体では同じ音、他の音と混ざるときに違い）'],
  ['#pcmEditor [data-tool="dc"]', 'Remove a DC offset: centre the selection (or everything) on 0, which avoids clicks', 'DC 오프셋 제거: 선택 구간(없으면 전체)의 중심을 0으로 맞춰 딸깍 소리를 막습니다', 'DCオフセット除去: 選択範囲（なければ全体）の中心を0に合わせ、クリックノイズを防ぎます'],
  ['#pcmEditor [data-tool="amplify"]', 'Scale the selection (or everything) by the percentage (over 100 louder, under 100 softer; peaks are clipped)', '선택 구간(없으면 전체)을 입력한 %로 키우거나 줄입니다 (100보다 크면 커지고 작으면 작아짐, 넘치는 부분은 잘림)', '選択範囲（なければ全体）を入力した%で大きく・小さくします（100より大きいと大きく、小さいと小さく、はみ出た部分は切られる）'],
  ['#pcmEditor [data-arg="amplify"]', 'Percentage for Amplify', '증폭 비율 (%)', '増幅の割合（%）'],
  ['#pcmEditor .pe-rate', 'Rate to resample to: o1 c (16.1 kHz) plays the sample at its own pitch on o1 c, o2 c (8.1 kHz) on o2 c at half the size; Hz… for any rate', '리샘플할 레이트: o1 c(16.1 kHz)는 o1 c에서 원래 높이로, o2 c(8.1 kHz)는 o2 c에서 원래 높이로 재생되고 크기는 절반. Hz…는 원하는 값', 'リサンプル先のレート: o1 c（16.1 kHz）はo1 cで元の高さ、o2 c（8.1 kHz）はo2 cで元の高さに鳴り、サイズは半分。Hz…で任意の値'],
  ['#pcmEditor .pe-hz', 'Any rate in Hz (1000–96000)', '원하는 레이트 (Hz, 1000–96000)', '任意のレート（Hz、1000–96000）'],
  ['#pcmEditor [data-tool="resample"]', 'Resample the whole sample to the rate chosen (changes its length and size, keeps its sound)', '샘플 전체를 고른 레이트로 리샘플합니다 (소리는 그대로, 길이와 크기가 바뀜)', 'サンプル全体を選んだレートにリサンプルします（音はそのまま、長さとサイズが変わる）'],

  // ---------- tracker ----------
  ['#tracker .trk-res', 'How long one row is (1/n of a whole note): smaller fractions show more rows per beat', '한 행의 길이 (온음표의 1/n). 분모가 클수록 한 박자가 더 많은 행으로 나뉩니다', '1行の長さ（全音符の1/n）。分母が大きいほど1拍が多くの行に分かれます'],
  ['#tracker [data-oct="-1"]', 'Octave for entering notes, down (numpad /)', '음 입력 옥타브 내림 (숫자패드 /)', '音入力のオクターブを下げる（テンキー /）'],
  ['#tracker [data-oct="1"]', 'Octave for entering notes, up (numpad *)', '음 입력 옥타브 올림 (숫자패드 *)', '音入力のオクターブを上げる（テンキー *）'],
  ['#tracker .trk-input', 'How notes are typed: the way the tracker shows them (C#4, OFF, ... , hex for @ and v), or Furnace\'s quick keys (Z S X D C … / Q 2 W 3 E …, one key per note)', '음 입력 방식: 트래커 표시 형식대로(C#4, OFF, ..., @와 v는 16진수) 또는 Furnace의 빠른 키(Z S X D C … / Q 2 W 3 E …, 키 하나에 음 하나)', '音の入力方式: トラッカーの表示形式どおり（C#4、OFF、...、@とvは16進）またはFurnaceのクイックキー（Z S X D C … / Q 2 W 3 E …、1キー1音）'],
  ['#tracker [data-act="rest"]', 'Turn the note in this cell into a rest (Delete)', '이 칸의 음을 쉼표로 바꿉니다 (Delete)', 'このセルの音を休符にします（Delete）'],
  ['#tracker [data-act="off"]', 'Note off: the note before stops here and a rest follows (key 1)', '노트 오프: 앞의 음이 여기서 끝나고 쉼표가 이어집니다 (키 1)', 'ノートオフ: 前の音がここで止まり休符が続きます（キー 1）'],
  ['#tracker [data-act="keys"]', 'Open the keys mode piano: its keys write notes into the tracker, so it can be edited by touch', '건반 모드를 엽니다. 건반을 누르면 트래커에 음이 입력되어 터치로도 편집할 수 있습니다', '鍵盤モードを開きます。鍵盤を押すとトラッカーに音が入り、タッチでも編集できます'],

  // ---------- keys ----------
  ['#keys .keys-source', 'Sound of the keys: the part at the caret (with its voice), or a chosen voice or wave', '건반 소리: 커서가 있는 파트(그 음색으로), 또는 고른 음색·파형', '鍵盤の音: カーソルのあるパート（その音色で）、または選んだ音色・波形'],
  ['#keys [data-oct="-1"]', 'Octave of the keys, down (↓)', '건반 옥타브 내림 (↓)', '鍵盤のオクターブを下げる（↓）'],
  ['#keys [data-oct="1"]', 'Octave of the keys, up (↑)', '건반 옥타브 올림 (↑)', '鍵盤のオクターブを上げる（↑）'],
  ['#keys .keys-close', 'Close the keys mode', '건반 모드를 닫습니다', '鍵盤モードを閉じます'],
];

export function applyTips(root, lang) {
  const k = lang === 'ko' ? 2 : lang === 'ja' ? 3 : 1;
  for (const entry of TIPS) {
    const els = root.matches?.(entry[0]) ? [root] : root.querySelectorAll(entry[0]);
    for (const el of els) {
      el.title = entry[k];
      // A checkbox / range inside a label: the label shows the tooltip too.
      const label = el.closest('label');
      if (label && el.matches('input, select')) label.title = entry[k];
    }
  }
}

// ---------- the voice bank ----------
// Words for each kind, then one sentence per button built from them.
const WORDS = {
  en: {
    fm: { noun: 'voice', nouns: 'voices', file: 'voice file', label: 'DAT', tag: '#voice', ext: '.dat', editor: 'the FM voice editor', add: "Furnace's default FM voice", name: 'up to 6 characters, voice file only', from: '.dat voice files, .muc songs, .mub, .vgm / .vgz (the voice of every key on, YM2203/2608/2610/2612/2151)' },
    scc: { noun: 'wave', nouns: 'waves', file: 'wave file', label: 'DAT', tag: '#sccvoice', ext: '.dat (SCWD)', editor: 'the SCC wave editor', add: 'a sine wave', name: '', from: '.dat (SCWD), .muc, .vgm / .vgz (what the SCC plays) and Furnace .fur / .fuw' },
    pcm: { noun: 'sample', nouns: 'samples', file: 'PCM bank file', label: 'BIN', tag: '#pcm', ext: '.bin', editor: 'the PCM sample editor', add: 'a short blip', name: 'up to 16 characters, bank file only', from: '.wav, mp3 / ogg / flac, PCM banks (.bin), .mub, .vgm / .vgz (YM2608 / YM2610 / Y8950 ADPCM)' },
  },
  ko: {
    fm: { noun: '음색', file: '음색 파일', label: 'DAT', tag: '#voice', ext: '.dat', editor: 'FM 음색 편집기', add: 'Furnace 기본 FM 음색', name: '6자까지, 음색 파일만', from: '.dat 음색 파일, .muc 곡, .mub, .vgm / .vgz (키 온마다의 음색, YM2203/2608/2610/2612/2151)' },
    scc: { noun: '파형', file: '파형 파일', label: 'DAT', tag: '#sccvoice', ext: '.dat (SCWD)', editor: 'SCC 파형 편집기', add: '사인파', name: '', from: '.dat (SCWD), .muc, .vgm / .vgz (SCC가 재생한 파형), Furnace .fur / .fuw' },
    pcm: { noun: '샘플', file: 'PCM 뱅크 파일', label: 'BIN', tag: '#pcm', ext: '.bin', editor: 'PCM 샘플 편집기', add: '짧은 삑 소리', name: '16자까지, 뱅크 파일만', from: '.wav, mp3 / ogg / flac, PCM 뱅크(.bin), .mub, .vgm / .vgz (YM2608 / YM2610 / Y8950 ADPCM)' },
  },
  ja: {
    fm: { noun: '音色', file: '音色ファイル', label: 'DAT', tag: '#voice', ext: '.dat', editor: 'FM音色エディタ', add: 'Furnaceの初期FM音色', name: '6文字まで、音色ファイルのみ', from: '.dat音色ファイル、.muc曲、.mub、.vgm / .vgz（キーオンごとの音色、YM2203/2608/2610/2612/2151）' },
    scc: { noun: '波形', file: '波形ファイル', label: 'DAT', tag: '#sccvoice', ext: '.dat（SCWD）', editor: 'SCC波形エディタ', add: 'サイン波', name: '', from: '.dat（SCWD）、.muc、.vgm / .vgz（SCCが鳴らした波形）、Furnace .fur / .fuw' },
    pcm: { noun: 'サンプル', file: 'PCMバンクファイル', label: 'BIN', tag: '#pcm', ext: '.bin', editor: 'PCMサンプルエディタ', add: '短いビープ音', name: '16文字まで、バンクファイルのみ', from: '.wav、mp3 / ogg / flac、PCMバンク（.bin）、.mub、.vgm / .vgz（YM2608 / YM2610 / Y8950 ADPCM）' },
  },
};

const BANK = {
  en: {
    tab: (w) => `Show the song's ${w.nouns} (${w.file} and MUC). Keys 1 / 2 / 3 switch tabs.`,
    target: (w) => `Where Add and Import put new ${w.nouns}: the ${w.file} (${w.label}; one is made, with a ${w.tag} tag, if the song has none) or the MUC text as definitions. Key: T`,
    empty: (w) => `Also list the free numbers, to see where new ${w.nouns} go. Key: B`,
    list: (w) => `Click: pick and hear · Ctrl/⌘+click: pick more · Shift+click: pick a range · double-click or @: write @n at the caret · ↑↓ move · Enter edit · Delete delete · ? all keys`,
    add: (w, whole) => `Add a new ${w.noun} (${w.add}) at the first free number, to the ${w.file} or the MUC, whichever "To" says.` + (whole ? ' With #@pcm in the MUC the compiler ignores the bank file, so adding to the MUC first copies the file\'s samples there.' : '') + ' Key: Insert or N',
    del: (w) => `Delete the picked ${w.nouns} (pick several with Ctrl/⌘+click or Shift+click to delete them together). Asks first when the song uses them or when there are several. One in both the MUC and the ${w.file} loses only its MUC definition. Key: Delete`,
    edit: (w) => `Edit the selected ${w.noun} in ${w.editor}; Apply / Done write it back where it came from (${w.label} or MUC). Key: Enter or E`,
    rename: (w) => `Rename the selected ${w.noun} (${w.name}). Key: F2 or R`,
    toDat: (w, whole) => (whole ? `Move all the MUC's #@pcm samples into the ${w.file} under the same numbers (one left in the MUC would keep the file unused); the #@pcm lines go and a ${w.tag} tag is added if needed.` : `Move the picked MUC ${w.nouns} into the ${w.file} under the same numbers; their definitions leave the text.`) + ' Key: D',
    toMuc: (w, whole) => (whole ? `Copy every sample of the ${w.file} into the MUC as #@pcm lines with WAV files (then the compiler uses the MUC's).` : `Copy the picked ${w.file} ${w.nouns} into the MUC as definitions (the MUC's wins over the file's).`) + ' Key: M',
    import: (w) => `Take ${w.nouns} from other files: ${w.from}. New ones are added at free numbers (to "To"), ones the bank has already are skipped; several files at once. Key: I`,
    load: (w) => `Use a ${w.ext} ${w.file} for this song (writes the ${w.tag} tag). Key: L`,
    save: (w) => `Download the ${w.file}; with none, one is made from the MUC's ${w.nouns} (same numbers). Key: S`,
    undo: (w) => `Undo the last change to the ${w.file} (changes to the text are undone in the text with Ctrl+Z). Key: U or Ctrl/⌘+Z`,
    keys: () => 'List the keys of the bank (?)',
  },
  ko: {
    tab: (w) => `곡의 ${w.noun}(${w.file}과 MUC)을 보여 줍니다. 1 / 2 / 3 키로 탭을 바꿉니다.`,
    target: (w) => `추가·가져오기한 새 ${w.noun}이 들어갈 곳: ${w.file}(${w.label}. 없으면 새로 만들고 ${w.tag} 태그를 넣음) 또는 MUC 텍스트의 정의. 단축키: T`,
    empty: (w) => `빈 번호도 목록에 보여 줍니다 (새 ${w.noun}이 들어갈 자리 확인). 단축키: B`,
    list: () => '클릭: 선택하고 듣기 · Ctrl/⌘+클릭: 추가 선택 · Shift+클릭: 범위 선택 · 더블클릭 또는 @: 커서 위치에 @n 쓰기 · ↑↓ 이동 · Enter 편집 · Delete 삭제 · ? 모든 단축키',
    add: (w, whole) => `첫 빈 번호에 새 ${w.noun}(${w.add})을 추가합니다. '대상'에 따라 ${w.file} 또는 MUC에 들어갑니다.` + (whole ? ' MUC에 #@pcm이 있으면 컴파일러가 뱅크 파일을 무시하므로, MUC에 처음 추가할 때 파일의 샘플을 먼저 MUC로 복사합니다.' : '') + ' 단축키: Insert 또는 N',
    del: (w) => `선택한 ${w.noun}을 삭제합니다 (Ctrl/⌘+클릭이나 Shift+클릭으로 여러 개를 골라 한꺼번에 삭제). 곡에서 쓰는 것이거나 여러 개면 먼저 묻습니다. MUC와 ${w.file}에 둘 다 있는 것은 MUC 정의만 지웁니다. 단축키: Delete`,
    edit: (w) => `선택한 ${w.noun}을 ${w.editor}에서 편집합니다. 적용 / 완료하면 원래 있던 곳(${w.label} 또는 MUC)에 다시 씁니다. 단축키: Enter 또는 E`,
    rename: (w) => `선택한 ${w.noun}의 이름을 바꿉니다 (${w.name}). 단축키: F2 또는 R`,
    toDat: (w, whole) => (whole ? `MUC의 #@pcm 샘플을 모두 같은 번호로 ${w.file}에 옮깁니다 (하나라도 MUC에 남으면 파일이 쓰이지 않으므로). #@pcm 줄은 지워지고 필요하면 ${w.tag} 태그가 들어갑니다.` : `선택한 MUC ${w.noun}을 같은 번호로 ${w.file}에 옮기고 텍스트의 정의는 지웁니다 (여러 개 선택 가능).`) + ' 단축키: D',
    toMuc: (w, whole) => (whole ? `${w.file}의 샘플을 모두 WAV 파일과 #@pcm 줄로 MUC에 복사합니다 (그다음부터 컴파일러는 MUC 것을 씀).` : `선택한 ${w.file}의 ${w.noun}을 MUC 텍스트에 정의로 복사합니다 (MUC 쪽이 파일보다 우선, 여러 개 선택 가능).`) + ' 단축키: M',
    import: (w) => `다른 파일에서 ${w.noun}을 가져옵니다: ${w.from}. 새것만 빈 번호에 ('대상'으로) 추가하고 이미 있는 것은 건너뜁니다. 여러 파일을 한 번에 고를 수 있습니다. 단축키: I`,
    load: (w) => `${w.ext} ${w.file}을 이 곡에 사용합니다 (${w.tag} 태그를 씀). 단축키: L`,
    save: (w) => `${w.file}을 내려받습니다. 파일이 없으면 MUC의 ${w.noun}으로 (같은 번호로) 만들어서 받습니다. 단축키: S`,
    undo: (w) => `${w.file}의 마지막 변경을 되돌립니다 (텍스트의 변경은 텍스트에서 Ctrl+Z). 단축키: U 또는 Ctrl/⌘+Z`,
    keys: () => '뱅크의 단축키 목록을 보여 줍니다 (?)',
  },
  ja: {
    tab: (w) => `曲の${w.noun}（${w.file}とMUC）を表示します。1 / 2 / 3キーでタブを切り替えます。`,
    target: (w) => `追加・インポートした新しい${w.noun}の入る先: ${w.file}（${w.label}。なければ作って${w.tag}タグを入れる）またはMUCテキストの定義。キー: T`,
    empty: (w) => `空き番号も一覧に出します（新しい${w.noun}の入る場所の確認）。キー: B`,
    list: () => 'クリック: 選択して試聴 · Ctrl/⌘+クリック: 追加選択 · Shift+クリック: 範囲選択 · ダブルクリックまたは@: カーソル位置に@nを書く · ↑↓ 移動 · Enter 編集 · Delete 削除 · ? 全キー',
    add: (w, whole) => `最初の空き番号に新しい${w.noun}（${w.add}）を追加します。「追加先」に従って${w.file}かMUCに入ります。` + (whole ? ' MUCに#@pcmがあるとコンパイラはバンクファイルを無視するため、MUCへ最初に追加するときファイルのサンプルを先にMUCへコピーします。' : '') + ' キー: Insert または N',
    del: (w) => `選んだ${w.noun}を削除します（Ctrl/⌘+クリックやShift+クリックで複数選んでまとめて削除）。曲で使われているものや複数のときは先に確認します。MUCと${w.file}の両方にあるものはMUCの定義だけ消します。キー: Delete`,
    edit: (w) => `選んだ${w.noun}を${w.editor}で編集します。適用 / 完了で元の場所（${w.label}かMUC）に書き戻します。キー: Enter または E`,
    rename: (w) => `選んだ${w.noun}の名前を変えます（${w.name}）。キー: F2 または R`,
    toDat: (w, whole) => (whole ? `MUCの#@pcmサンプルをすべて同じ番号で${w.file}へ移します（1つでもMUCに残るとファイルが使われないため）。#@pcm行は消え、必要なら${w.tag}タグが入ります。` : `選んだMUCの${w.noun}を同じ番号で${w.file}へ移し、テキストの定義は消します（複数選択可）。`) + ' キー: D',
    toMuc: (w, whole) => (whole ? `${w.file}のサンプルをすべてWAVファイルと#@pcm行でMUCへコピーします（以後コンパイラはMUCのものを使う）。` : `選んだ${w.file}の${w.noun}をMUCテキストに定義としてコピーします（MUCがファイルより優先、複数選択可）。`) + ' キー: M',
    import: (w) => `他のファイルから${w.noun}を取り込みます: ${w.from}。新しいものだけ空き番号に（追加先へ）追加し、既にあるものは飛ばします。複数ファイルをまとめて選べます。キー: I`,
    load: (w) => `${w.ext}の${w.file}をこの曲に使います（${w.tag}タグを書く）。キー: L`,
    save: (w) => `${w.file}をダウンロードします。なければMUCの${w.noun}から（同じ番号で）作ってダウンロードします。キー: S`,
    undo: (w) => `${w.file}の最後の変更を元に戻します（テキストの変更はテキストでCtrl+Z）。キー: U または Ctrl/⌘+Z`,
    keys: () => 'バンクのキー一覧を表示します（?）',
  },
};

export function bankTip(lang, what, kind) {
  const L = BANK[lang] ? lang : 'en';
  const w = WORDS[L][kind] || WORDS[L].fm;
  const words = { ...w, nouns: w.nouns || w.noun };
  const f = BANK[L][what];
  return f ? f(words, kind === 'pcm') : '';
}
