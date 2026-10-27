// Detailed explanations for compiler errors and warnings, in English, Korean and Japanese.
// Keys are mucomDotNET message ids (the engine recovers them from the message text).
// Messages without an entry fall back to families: "can only be used in a part" and
// "problem with command X", where X's correct form comes from mml-reference.js.
import { COMMANDS } from './mml-reference.js';

const H = (en, ko, ja) => ({ en, ko, ja });

const HINTS = {
  E0100: { what: H('The compiler stopped at this position.', '컴파일러가 이 위치에서 멈췄습니다.', 'コンパイラがこの位置で止まりました。'),
    fix: H('Look at the command right at the marked spot: a missing number, an unclosed bracket or a typo is the usual cause.', '표시된 위치의 명령을 보세요. 숫자 누락, 닫히지 않은 괄호, 오타가 흔한 원인입니다.', '印の位置のコマンドを確認してください。数値の抜け、閉じていない括弧、打ち間違いがよくある原因です。') },
  E0200: { what: H('The compiled song is larger than 64 KiB.', '컴파일된 곡이 64 KiB를 넘었습니다.', 'コンパイル後の曲が64 KiBを超えました。'),
    fix: H('Use [ ] repeats instead of writing phrases out, and remove unused parts. Macros are expanded, so they do not shrink the output.', '같은 프레이즈는 [ ] 반복으로 쓰고 쓰지 않는 파트를 지우세요. 매크로는 펼쳐지므로 출력 크기를 줄이지 않습니다.', '同じフレーズは[ ]の繰り返しで書き、使わないパートを消してください。マクロは展開されるので出力は小さくなりません。') },
  E0700: { what: H('One part is longer than the 65,535 bytes a part can hold.', '한 파트가 파트당 한도 65,535바이트를 넘었습니다.', '1つのパートが上限65,535バイトを超えました。'),
    fix: H('Shorten that part with [ ] repeats, or move phrases to another part.', '[ ] 반복으로 줄이거나 일부를 다른 파트로 옮기세요.', '[ ]の繰り返しで短くするか、一部を別パートへ移してください。') },
  E0400: { what: H('A macro *n is called but never defined.', '정의되지 않은 매크로 *n을 호출했습니다.', '定義されていないマクロ*nを呼び出しています。'),
    fix: H('Define it near the top, e.g. #*1{o4 l8 cdef}, or correct the number. Macros defined in this song are listed when you type *.', '파일 위쪽에 #*1{o4 l8 cdef}처럼 정의하거나 번호를 고치세요. *를 치면 이 곡에 정의된 매크로가 나옵니다.', '先頭付近で#*1{o4 l8 cdef}のように定義するか番号を直してください。*を入力すると定義済みマクロが表示されます。') },
  E0401: { what: H('A macro could not return to where it was called; macros may be nested too deep or call themselves.', '매크로가 호출 위치로 돌아오지 못했습니다. 너무 깊게 중첩됐거나 자기 자신을 부르는 경우입니다.', 'マクロが呼び出し元へ戻れません。入れ子が深すぎるか自分自身を呼んでいます。'),
    fix: H('Keep macro nesting to 8 levels and make sure no macro calls itself.', '매크로 중첩은 8단계 이내로 하고, 자기 자신을 부르지 않게 하세요.', 'マクロの入れ子は8段以内にし、自分自身を呼ばないようにしてください。') },
  E0403: { what: H('The first note of a portamento { } is not a note.', '포르타멘토 { }의 첫 음이 올바른 음표가 아닙니다.', 'ポルタメント{ }の最初の音が正しい音符ではありません。'), fix: H('Write it as {c>c}4: two notes inside the braces, length after.', '{c>c}4처럼 괄호 안에 음 두 개, 길이는 뒤에 쓰세요.', '{c>c}4のように括弧内に2音、音長は後ろに書きます。') },
  E0404: { what: H('The last note of a portamento { } is not a note.', '포르타멘토 { }의 마지막 음이 올바른 음표가 아닙니다.', 'ポルタメント{ }の最後の音が正しい音符ではありません。'), fix: H('Write it as {c>c}4.', '{c>c}4처럼 쓰세요.', '{c>c}4のように書きます。') },
  E0405: { what: H('A portamento { } has no ending note.', '포르타멘토 { }에 끝 음이 없습니다.', 'ポルタメント{ }に終わりの音がありません。'), fix: H('Put two notes inside the braces: {c>c}4.', '괄호 안에 음을 두 개 넣으세요: {c>c}4', '括弧内に2音入れます: {c>c}4') },
  E0406: { what: H('The portamento slides too far.', '포르타멘토 음정 차이가 너무 큽니다.', 'ポルタメントの音程差が大きすぎます。'), fix: H('Use two notes closer together.', '더 가까운 두 음을 쓰세요.', 'もっと近い2音にしてください。') },
  E0407: { what: H('A portamento is missing its closing }.', '포르타멘토의 닫는 }가 없습니다.', 'ポルタメントの閉じ}がありません。'), fix: H('Close it: {c>c}4.', '{c>c}4처럼 닫으세요.', '{c>c}4のように閉じます。') },
  E0411: { what: H('T0 is not a tempo.', 'T0은 템포가 될 수 없습니다.', 'T0はテンポにできません。'), fix: H('Use a BPM such as T120, or a raw Timer-B value with t.', 'T120 같은 BPM이나 t로 Timer-B 값을 쓰세요.', 'T120のようなBPMか、tでTimer-B値を指定します。') },
  E0419: { what: H('A repeat has more than one /.', '한 반복 안에 /가 두 개 이상 있습니다.', '1つの繰り返しに/が2つ以上あります。'), fix: H('Keep one / per [ ] repeat.', '[ ] 하나에 /는 하나만 쓰세요.', '[ ]1つにつき/は1つだけです。') },
  E0523: { what: H('/ is used outside a [ ] repeat.', '/가 [ ] 반복 밖에 있습니다.', '/が[ ]の繰り返しの外にあります。'), fix: H('Use / only inside [ ]: [c d / e f]2.', '/는 [ ] 안에서만: [c d / e f]2', '/は[ ]の中だけ: [c d / e f]2') },
  E0436: { what: H('A ] has a bad repeat count.', ']의 반복 횟수가 잘못됐습니다.', ']の繰り返し回数が正しくありません。'), fix: H('Write the count right after ]: [cdef]2 (1–255).', ']바로 뒤에 횟수를 쓰세요: [cdef]2 (1–255)', ']の直後に回数を書きます: [cdef]2（1–255）') },
  E0437: { what: H('There is a ] without a matching [.', '짝이 되는 [ 없이 ]가 있습니다.', '対応する[のない]があります。'), fix: H('Add the opening [ or remove the extra ].', '여는 [를 넣거나 남는 ]를 지우세요.', '開き[を足すか、余分な]を消します。') },
  E0438: { what: H('Repeats are nested more than 16 deep.', '반복이 16단계보다 깊게 중첩됐습니다.', '繰り返しの入れ子が16段を超えました。'), fix: H('Flatten the repeats or move a section into a macro.', '반복을 펼치거나 일부를 매크로로 옮기세요.', '繰り返しを展開するか一部をマクロに移します。') },
  E0498: { what: H('A [ repeat is never closed with ].', '[ 반복이 ]로 닫히지 않았습니다.', '[の繰り返しが]で閉じられていません。'), fix: H('Add ] and a count where the repeat should end: [cdef]2. The position shown is often the end of the line, after the open [.', '반복이 끝나는 곳에 ]와 횟수를 넣으세요: [cdef]2. 표시 위치는 흔히 [ 다음의 줄 끝입니다.', '繰り返しの終わりに]と回数を入れます: [cdef]2。表示位置は[の後の行末になることが多いです。') },
  E0439: { what: H('The rest has an invalid length.', '쉼표의 길이가 잘못됐습니다.', '休符の音長が正しくありません。'), fix: H('Write r, r4, r8 … or r%clocks.', 'r, r4, r8 … 또는 r%클록으로 쓰세요.', 'r, r4, r8 …かr%クロックで書きます。') },
  E0528: { what: H('Rests cannot be tied with &.', '쉼표는 &로 이을 수 없습니다.', '休符は&でつなげません。'), fix: H('Write a longer rest instead, e.g. r2 or r%48.', '대신 r2나 r%48처럼 긴 쉼표를 쓰세요.', '代わりにr2やr%48のように長い休符にします。') },
  E0472: { what: H('The v value is out of range.', 'v 값이 범위를 벗어났습니다.', 'vの値が範囲外です。'), fix: H('For SSG start with 0–15; for FM take a working song\'s values as a guide.', 'SSG는 0–15로 시작하고, FM은 잘 되는 곡의 값을 기준으로 하세요.', 'SSGは0–15から、FMは動く曲の値を目安にします。') },
  E0473: { what: H('Rhythm (G) volume needs commas: it takes 7 values.', '리듬(G)의 v는 쉼표로 구분한 값 7개가 필요합니다.', 'リズム（G）のvはカンマ区切りの7つの値が必要です。'), fix: H('Write v63,31,31,31,31,31,31: overall, then BD, SD, TOP, HH, TOM, RIM.', 'v63,31,31,31,31,31,31처럼 쓰세요: 전체, BD, SD, TOP, HH, TOM, RIM 순서.', 'v63,31,31,31,31,31,31のように: 全体、BD、SD、TOP、HH、TOM、RIMの順。') },
  E0474: { what: H('Rhythm (G) volume is written wrongly.', '리듬(G)의 v 형식이 잘못됐습니다.', 'リズム（G）のvの書き方が正しくありません。'), fix: H('Use the 7-value form v63,31,31,31,31,31,31.', '값 7개 형식 v63,31,31,31,31,31,31을 쓰세요.', '7つの値の形v63,31,31,31,31,31,31にします。') },
  E0475: { what: H('A rhythm (G) volume value is out of range.', '리듬(G) 음량 값이 범위를 벗어났습니다.', 'リズム（G）の音量値が範囲外です。'), fix: H('Overall 0–63, each instrument 0–31.', '전체 0–63, 악기별 0–31입니다.', '全体0–63、各楽器0–31です。') },
  E0476: { what: H('The ADPCM (K) volume is out of range.', 'ADPCM(K) 음량이 범위를 벗어났습니다.', 'ADPCM（K）の音量が範囲外です。'), fix: H('K uses byte-level volume (0–255), not the FM/SSG scale.', 'K는 FM/SSG와 다른 바이트 단위 음량(0–255)을 씁니다.', 'KはFM/SSGと違うバイト単位の音量（0–255）です。') },
  E0477: { what: H('A command starting with v is not one the compiler knows.', 'v로 시작하는 알 수 없는 명령입니다.', 'vで始まる不明なコマンドです。'), fix: H('Check for a typo; plain volume is v followed by a number.', '오타인지 보세요. 일반 음량은 v 다음에 숫자입니다.', '打ち間違いを確認してください。通常の音量はvの後に数値です。') },
  E0483: { what: H('The l (default length) value is invalid.', 'l(기본 길이) 값이 잘못됐습니다.', 'l（基本音長）の値が正しくありません。'), fix: H('Use l1, l2, l4, l8, l16 …; l0 is not allowed.', 'l1, l2, l4, l8, l16 …을 쓰세요. l0은 안 됩니다.', 'l1, l2, l4, l8, l16 …を使います。l0は不可です。') },
  E0484: { what: H('A length divides the whole note into more parts than the base clock C has.', '길이가 기준 클록 C보다 잘게 나뉘었습니다.', '音長が基準クロックCより細かく分割されています。'), fix: H('With C128 the shortest is 128 (one clock). Use a larger note value or raise C.', 'C128이면 가장 짧은 길이는 128(1클록)입니다. 더 긴 음표를 쓰거나 C를 올리세요.', 'C128なら最短は128（1クロック）です。長い音符にするかCを上げます。') },
  E0486: { what: H('The octave is outside o1–o8.', '옥타브가 o1–o8 범위를 벗어났습니다.', 'オクターブがo1–o8の範囲外です。'), fix: H('Use o1 to o8. A > or < earlier in the part may have pushed it out of range.', 'o1–o8을 쓰세요. 앞의 > 나 <가 범위를 넘게 만들었을 수 있습니다.', 'o1–o8を使います。前の>や<で範囲を超えたのかもしれません。') },
  E0469: { what: H('> raised the octave above 8.', '>로 옥타브가 8을 넘었습니다.', '>でオクターブが8を超えました。'), fix: H('Remove a > or add a < earlier, or set o explicitly.', '>를 빼거나 앞에 <를 넣거나 o로 직접 정하세요.', '>を減らすか前に<を入れるか、oで直接指定します。') },
  E0471: { what: H('< lowered the octave below 1.', '<로 옥타브가 1보다 낮아졌습니다.', '<でオクターブが1を下回りました。'), fix: H('Remove a < or set o explicitly.', '<를 빼거나 o로 직접 정하세요.', '<を減らすかoで直接指定します。') },
  E0489: { what: H('The @ voice number is invalid.', '@ 음색 번호가 잘못됐습니다.', '@の音色番号が正しくありません。'), fix: H('Use a number that exists in the #voice file or in an inline definition (@n lines near the top).', '#voice 파일이나 인라인 정의(위쪽의 @n 줄)에 있는 번호를 쓰세요.', '#voiceファイルかインライン定義（先頭付近の@n行）にある番号を使います。') },
  E0492: { what: H('This @ voice is neither defined in the song nor in the voice file.', '이 @ 음색이 곡 안에도 음색 파일에도 없습니다.', 'この@音色は曲内にも音色ファイルにもありません。'), fix: H('Attach the voice file named by #voice, or define the voice inline (type @ on an indented line for a template).', '#voice에 적힌 음색 파일을 첨부하거나, 음색을 인라인으로 정의하세요 (들여쓴 줄에서 @를 치면 틀이 나옵니다).', '#voiceの音色ファイルを添付するか、インラインで定義します（字下げした行で@を入力するとひな形が出ます）。') },
  E0508: { what: H('SSG preset @ is outside 0–7.', 'SSG 프리셋 @가 0–7 범위를 벗어났습니다.', 'SSGプリセット@が0–7の範囲外です。'), fix: H('Use @0 to @7 on D, E, F.', 'D, E, F에서는 @0–@7을 쓰세요.', 'D、E、Fでは@0–@7を使います。') },
  E0519: { what: H('The song uses FM voices, but the voice file is missing.', '곡이 FM 음색을 쓰는데 음색 파일이 없습니다.', '曲がFM音色を使っていますが音色ファイルがありません。'),
    fix: H('Attach the file named in #voice (Add voice / PCM, or drop it on the page). With no #voice line, define the voices inline instead.', '#voice에 적힌 파일을 첨부하세요 (음색 / PCM 추가 버튼이나 끌어다 놓기). #voice 줄이 없다면 음색을 인라인으로 정의하세요.', '#voiceのファイルを添付してください（音色 / PCMを追加、またはドロップ）。#voice行がなければ音色をインラインで定義します。') },
  E0800: { what: H('An inline voice definition has the wrong shape.', '인라인 음색 정의의 형식이 잘못됐습니다.', 'インライン音色定義の形が正しくありません。'),
    fix: H('It needs @n, then FB,ALG, then four lines of AR,D1R,D2R,RR,D1L,TL,KS,ML,DT. Check for missing lines and extra spaces or commas.', '@n, 그다음 FB,ALG, 그다음 AR,D1R,D2R,RR,D1L,TL,KS,ML,DT 4줄이 필요합니다. 빠진 줄과 남는 공백·쉼표를 확인하세요.', '@n、FB,ALG、続いてAR,D1R,D2R,RR,D1L,TL,KS,ML,DTの4行が必要です。行の抜けや余分な空白・カンマを確認します。') },
  E0495: { what: H('A macro definition has no number.', '매크로 정의에 번호가 없습니다.', 'マクロ定義に番号がありません。'), fix: H('Write #*1{…}.', '#*1{…}처럼 쓰세요.', '#*1{…}のように書きます。') },
  E0496: { what: H('A macro definition number is invalid.', '매크로 정의 번호가 잘못됐습니다.', 'マクロ定義番号が正しくありません。'), fix: H('Use a number from 0 to 255: #*1{…}.', '0–255 번호를 쓰세요: #*1{…}', '0–255の番号にします: #*1{…}') },
  E0497: { what: H('A macro definition is missing its {.', '매크로 정의에 {가 없습니다.', 'マクロ定義に{がありません。'), fix: H('Write #*1{o4 l8 cdef} with braces around the body.', '#*1{o4 l8 cdef}처럼 본문을 중괄호로 감싸세요.', '#*1{o4 l8 cdef}のように本体を括弧で囲みます。') },
  E0524: { what: H('The pan value is outside 1–6.', '팬 값이 1–6 범위를 벗어났습니다.', 'パンの値が1–6の範囲外です。'), fix: H('p1 right, p2 left, p3 both.', 'p1 오른쪽, p2 왼쪽, p3 양쪽.', 'p1右、p2左、p3両方。') },
  W0406: { what: H('y (register write) does nothing on an SSG part.', 'SSG 파트에서는 y(레지스터 쓰기)가 동작하지 않습니다.', 'SSGパートではy（レジスタ書き込み）は効きません。'), fix: H('Remove it or move it to an FM part.', '지우거나 FM 파트로 옮기세요.', '削除するかFMパートへ移します。') },
  W0407: { what: H('SSG has no hardware pan, so p is ignored here.', 'SSG에는 하드웨어 팬이 없어서 p가 무시됩니다.', 'SSGにはハードウェアパンがないのでpは無視されます。'), fix: H('Remove it; pan works on FM and ADPCM parts.', '지우세요. 팬은 FM과 ADPCM 파트에서 동작합니다.', '削除してください。パンはFMとADPCMパートで効きます。') },
  W0408: { what: H('A carrier operator\'s TL is not 0, so this voice plays quieter than v suggests. This is only a warning.', '캐리어 오퍼레이터의 TL이 0이 아니라서 v보다 작게 들립니다. 경고일 뿐입니다.', 'キャリアのTLが0でないため、vより小さく聞こえます。警告のみです。'),
    fix: H('If that is intended, ignore it. Otherwise set the carrier TL to 0 and control loudness with v.', '의도한 것이면 무시하세요. 아니면 캐리어 TL을 0으로 하고 음량은 v로 조절하세요.', '意図通りなら無視してください。そうでなければキャリアのTLを0にし、音量はvで調整します。') },
  W0410: { what: H('FM voice 0 or 1 is used; mucomDotNET does not reproduce the original\'s mistaken handling of these.', 'FM 음색 0이나 1을 썼습니다. mucomDotNET은 원본의 잘못된 처리를 재현하지 않습니다.', 'FM音色0か1を使っています。mucomDotNETは元の誤った扱いを再現しません。'), fix: H('Prefer voice numbers from 2 up if the song must sound the same in MUCOM88.', 'MUCOM88과 똑같이 들려야 한다면 2번 이상의 음색 번호를 쓰세요.', 'MUCOM88と同じに聞こえる必要があれば2番以降を使います。') },
  W0412: { what: H('t or T on an SSG part changes the tempo of the whole song, at once.', 'SSG 파트의 t나 T는 곡 전체 템포를 즉시 바꿉니다.', 'SSGパートのtやTは曲全体のテンポをすぐに変えます。'), fix: H('Keep tempo commands in one place, usually part A.', '템포는 한 곳(보통 A 파트)에서 관리하세요.', 'テンポは1か所（普通はAパート）で管理します。') },
  // From the page's own check (silence-check.js), not the compiler.
  PG01: { what: H('SSG and PSG parts start with a silent envelope, as in MUCOM88 itself, so this part makes no sound. (MUCPlayground check, not a compiler message.)', 'SSG와 PSG 파트는 MUCOM88 자체 동작대로 무음 엔벨로프로 시작해서, 이 파트는 소리가 나지 않습니다. (컴파일러가 아니라 MUCPlayground의 검사입니다.)', 'SSGとPSGのパートはMUCOM88本来の動作どおり無音のエンベロープで始まるため、このパートは鳴りません。（コンパイラではなくMUCPlaygroundのチェックです。）'),
    fix: H('Before the first note, choose a preset with @0 (a plain tone) or set an envelope, e.g. E255,0,0,0,0,255.', '첫 음표 앞에 @0(기본 음) 같은 프리셋이나 E255,0,0,0,0,255 같은 엔벨로프를 넣으세요.', '最初の音符の前に、@0（基本の音）などのプリセットか、E255,0,0,0,0,255などのエンベロープを入れます。') },
  PG02: { what: H('This part starts at volume 0, so it makes no sound. (MUCPlayground check, not a compiler message.)', '이 파트는 음량 0으로 시작해서 소리가 나지 않습니다. (컴파일러가 아니라 MUCPlayground의 검사입니다.)', 'このパートは音量0で始まるため鳴りません。（コンパイラではなくMUCPlaygroundのチェックです。）'),
    fix: H('Set a volume before the first note: v12 (SSG, PSG and SCC take 0–15), or v63,31,31,31,31,31,31 on MSXG.', '첫 음표 앞에 음량을 넣으세요: v12(SSG, PSG, SCC는 0–15), MSXG는 v63,31,31,31,31,31,31.', '最初の音符の前に音量を入れます: v12（SSG・PSG・SCCは0–15）、MSXGはv63,31,31,31,31,31,31。') },
  PG03: { what: H('A file the song names (#voice, #sccvoice, #pcm or #@pcm) is not attached. The compiler goes on without it, so what it holds is missing from the song. (MUCPlayground check, not a compiler message.)', '곡이 지정한 파일(#voice, #sccvoice, #pcm, #@pcm)이 첨부되지 않았습니다. 컴파일러는 그 파일 없이 계속하므로 그 내용이 곡에서 빠집니다. (컴파일러가 아니라 MUCPlayground의 검사입니다.)', '曲が指定したファイル（#voice、#sccvoice、#pcm、#@pcm）が添付されていません。コンパイラはそのファイルなしで続けるため、その内容が曲から抜けます。（コンパイラではなくMUCPlaygroundのチェックです。）'),
    fix: H('Attach it with the button below or "Add voice / PCM", drop it on the page, or open the song with Folder… so its files come with it. A browser cannot read the files next to a song you open by itself.', '아래 버튼이나 "음색 / PCM 추가"로 첨부하거나, 페이지에 끌어다 놓거나, 폴더…로 곡을 열어 파일이 함께 들어오게 하세요. 브라우저는 곡 하나만 열었을 때 그 옆의 파일을 읽을 수 없습니다.', '下のボタンか「音色 / PCMを追加」で添付するか、ページにドロップするか、フォルダ…で曲を開いてファイルを一緒に読み込んでください。ブラウザは曲を単独で開いたとき、その隣のファイルを読めません。') },
  PG04: { what: H('?WM morphs by reading the wave data from its wave on with a step that grows to 31 bytes, so it walks through about 31 waves. Fewer are defined from there, so the reading wraps to the first waves. (MUCPlayground check, not a compiler message.)', '?WM 모핑은 지정한 파형부터 최대 31바이트까지 커지는 간격으로 파형 데이터를 읽어 약 31개의 파형을 훑습니다. 거기서부터 정의된 파형이 그보다 적어서 처음 파형으로 돌아가 읽습니다. (컴파일러가 아니라 MUCPlayground의 검사입니다.)', '?WMのモーフィングは指定した波形から最大31バイトまで広がる間隔で波形データを読み、約31個の波形をたどります。そこから定義された波形がそれより少ないため、最初の波形に戻って読みます。（コンパイラではなくMUCPlaygroundのチェックです。）'),
    fix: H('For the games\' effect, define about 31 waves from the morph\'s wave on (?WDn={…}), or use a lower wave number. If the wrapped sound is what you want, ignore this.', '게임 같은 효과를 내려면 모핑 파형부터 31개쯤 파형(?WDn={…})을 정의하거나 더 낮은 파형 번호를 쓰세요. 돌아가 읽는 소리를 원하면 무시해도 됩니다.', 'ゲームのような効果には、モーフィングの波形から31個ほど波形（?WDn={…}）を定義するか、もっと小さい波形番号を使ってください。戻って読む音で良ければ無視してかまいません。') },
  W0413: { what: H('A Timer-B value of 253–255 can hang the driver.', 'Timer-B 값 253–255는 드라이버를 멈추게 할 수 있습니다.', 'Timer-B値253–255はドライバを止めることがあります。'), fix: H('Use a lower t value, or T for BPM.', '더 낮은 t 값이나 BPM용 T를 쓰세요.', 'もっと低いt値か、BPM用のTを使います。') },
  W0403: { what: H('A rest length is outside 1–255 clocks.', '쉼표 길이가 1–255 클록을 벗어났습니다.', '休符の長さが1–255クロックの範囲外です。'), fix: H('Split it into several rests.', '여러 개의 쉼표로 나누세요.', '複数の休符に分けます。') },
  W0414: { what: H('The portamento lasts 129 clocks or more.', '포르타멘토가 129클록 이상입니다.', 'ポルタメントが129クロック以上です。'), fix: H('Shorten it to under a whole note at C128.', 'C128 기준 온음표보다 짧게 하세요.', 'C128で全音符未満にします。') },
  W0416: { what: H('A ] repeat count is outside 1–255.', '] 반복 횟수가 1–255를 벗어났습니다.', ']の回数が1–255の範囲外です。'), fix: H('Use a count from 1 to 255.', '1–255 사이로 하세요.', '1–255にします。') },
  W0800: { what: H('This uses mucomDotNET-only syntax; original MUCOM88 may not read it.', 'mucomDotNET 전용 문법이라 원래 MUCOM88은 읽지 못할 수 있습니다.', 'mucomDotNET専用の書き方で、元のMUCOM88では読めないことがあります。'), fix: H('Fine here. Check it with MUC2MUB if the song is meant for the MSX tools.', '여기서는 괜찮습니다. MSX 도구용이라면 MUC2MUB로도 확인하세요.', 'ここでは問題ありません。MSXツール用ならMUC2MUBでも確認します。') },
};

// The compiler crashed instead of reporting (e.g. "Attempted to divide by zero").
const CRASH = { what: H('The compiler could not handle something in the song and stopped without saying where.', '컴파일러가 곡의 어떤 부분을 처리하지 못하고 위치를 알려주지 않은 채 멈췄습니다.', 'コンパイラが曲のどこかを処理できず、位置を示さずに止まりました。'),
  fix: H('Common causes: a zero length (l0, c0), a character MML does not use ($, !, full-width letters), or a command missing its number. Check the line shown, starting with your most recent edit.', '흔한 원인: 길이 0 (l0, c0), MML에서 쓰지 않는 문자 ($, !, 전각 문자), 숫자가 빠진 명령. 표시된 줄부터, 최근에 고친 곳을 먼저 보세요.', 'よくある原因: 長さ0（l0、c0）、MMLで使わない文字（$、!、全角文字）、数値の抜けたコマンド。表示された行と、最近直した所から確認します。') };

const WRONG_PART = { what: H('This command does not work on this kind of part.', '이 명령은 이 종류의 파트에서 쓸 수 없습니다.', 'このコマンドはこの種類のパートでは使えません。'),
  fix: H('Parts: A B C H I J are FM, D E F are SSG, G is rhythm, K is ADPCM. Move the command to a part it applies to, or remove it.', '파트: A B C H I J는 FM, D E F는 SSG, G는 리듬, K는 ADPCM입니다. 맞는 파트로 옮기거나 지우세요.', 'パート: A B C H I JはFM、D E FはSSG、Gはリズム、KはADPCMです。対応するパートへ移すか削除します。') };

const GENERIC = { what: H('The compiler rejected the command at this position.', '컴파일러가 이 위치의 명령을 받아들이지 않았습니다.', 'コンパイラがこの位置のコマンドを受け付けませんでした。'),
  fix: H('Check its value and form against the quick reference or the MUCEdit manual.', '빠른 참조나 MUCEdit 설명서에서 값과 형태를 확인하세요.', 'クイックリファレンスかMUCEdit説明書で値と形を確認します。') };

// The trimmed browser engine reports .NET exceptions by resource key (Arg_DivideByZero);
// say what they are. These mean the compiler crashed on the input instead of reporting it.
const EXCEPTIONS = {
  Arg_DivideByZero: 'Division by zero inside the compiler',
  Arg_IndexOutOfRangeException: 'Index outside the bounds of an array inside the compiler',
  IndexOutOfRange: 'Index outside the bounds of an array inside the compiler',
  Arg_NullReferenceException: 'Missing value inside the compiler (null reference)',
  Arg_OverflowException: 'Number too large inside the compiler',
  Arg_KeyNotFound: 'Missing entry inside the compiler',
  Format_InvalidString: 'Unreadable number inside the compiler',
};
const CRASH_TEXT = /divide by zero|index was outside|object reference|exception|^Arg_|^ArgumentOutOfRange_|^Format_|^IndexOutOfRange/i;

export function readableText(text) {
  const key = Object.keys(EXCEPTIONS).find((k) => text === k || text.startsWith(k + ','));
  return key ? `${EXCEPTIONS[key]} (${key})` : text;
}

// Explanation for one message: { what, fix, form }, where form is the command's correct
// argument form from the reference when the message names a command.
export function explain(message, language) {
  const pick = (h) => h[language] || h.en;
  const text = message.text || '';
  let hint = HINTS[message.code];
  if (!hint && !message.code && CRASH_TEXT.test(text)) hint = CRASH;
  if (!hint && /can only be used|can't be used|can't use|使用できません|使えません/i.test(text)) hint = WRONG_PART;
  const quoted = /'([^']{1,4})'/.exec(text);
  const command = quoted ? COMMANDS.find((c) => c.label === quoted[1]) : null;
  if (!hint) hint = GENERIC;
  return {
    what: pick(hint.what),
    fix: pick(hint.fix),
    form: command ? `${command.sig || command.label} — ${pick(command)}` : '',
  };
}
