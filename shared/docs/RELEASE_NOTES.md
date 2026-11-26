# MUCOMSX 변경 내역

2026-10-13 업데이트 안내(기록): [한국어](RELEASE_UPDATE_261013.md) · [English](RELEASE_UPDATE_261013.en.md) · [日本語](RELEASE_UPDATE_261013.ja.md)

**MucoMSX v1.5-Stable은 2026-11-22에 게시되었습니다.** 아래 "MucoMSX v1.5-Stable" 절부터 "2026-11-22 업데이트" 절까지의 내용이 모두 v1.5-Stable에 들어 있습니다. 절 제목의 날짜는 그 내용이 만들어진 날입니다. [v1.5-Stable 업데이트 안내](https://github.com/ToughkidDev/MUCOMSX/releases/tag/v1.5-Stable)

**MucoMSX v1.5-Stable was published on 2026-11-22.** It contains everything from the section "MucoMSX v1.5-Stable" up to "2026-11-22 업데이트" below. The dates in the section titles are the dates of the work. [v1.5-Stable update guide](https://github.com/ToughkidDev/MUCOMSX/releases/tag/v1.5-Stable)

**MucoMSX v1.5-Stableは2026-11-22に公開されました。**下の「MucoMSX v1.5-Stable」節から「2026-11-22 업데이트」節までの内容がすべてv1.5-Stableに入っています。節の見出しの日付は作業日です。[v1.5-Stable更新案内](https://github.com/ToughkidDev/MUCOMSX/releases/tag/v1.5-Stable)

## 2026-11-26 업데이트 — MSX-MUSIC 줄의 타이·비브라토 음높이, MUBScope·MUCScope의 채널 표시 (v1.5-Stable 이후)

v1.5-Stable(2026-11-22 게시) 뒤의 변경이며, 게시된 ZIP에는 들어 있지 않습니다. 바뀐 프로그램은
MUBPLAY, MUCPLAY, MUBScope, MUCScope입니다. MUC2MUB과 MUCEDIT은 그대로이고 MUB 파일도 바뀌지 않습니다.

칩 확장 명령(`?IU` 등)을 쓰는 곡의 MSX-MUSIC 줄에서, 타이(`&`)로 다른 블록의 음에 잇거나
(`c& g`: 블록은 f+와 g 사이에서 바뀝니다) `M` 비브라토가 그 경계를 넘으면 옥타브가 어긋난 음이
나던 문제를 고쳤습니다. 이전 판은 음이 이어지는 동안 F-number의 아래 바이트만 다시 쓰고, 블록은
키온·키오프 때만 썼습니다. `c& g`는 키오프까지 한 옥타브 낮은 g로 울렸고, g에 건 얕은 비브라토도
F-number가 100H 아래로 내려가는 틱마다 거의 한 옥타브 위로 튀었습니다. 이제 블록이 바뀌면 키를
누른 채로 함께 씁니다. 확장 명령이 없는 곡은 이전에도 맞게 연주되었고 바뀌지 않습니다.

MUBScope와 MUCScope에도 같은 수정이 들어갔고, 채널 표시가 다음과 같이 바뀌었습니다. 음 이름은 모든
행에서 실제로 울리는 음높이(C4 = 261.6Hz)로 표시합니다. 이전 빌드는 PSG 행을 반음 높게, SCC·MSX-MUSIC·
SSG 행을 한 옥타브 낮게 표시했습니다(SSG 행은 이전보다 한 옥타브 높은 이름으로 보입니다). OPNA FM과
MSX PSG, MSX-MUSIC과 OPNA SSG, SCC와 OPNA SSG를 쓰는 곡은 칩 페이지를 바꾸지 않아도 한 화면에
나옵니다. 곡의 첫 음이 FM 행에 `C0`로 나오던 것, OPNA 파트와 MSX 칩 파트를 함께 쓰는 곡에서 FM 행의
키온·키오프가 빠지던 것, PN6 칩 확장 형식 곡에서 PSG 행이 비어 있던 것도 고쳤습니다. 일반 Z80(3.58MHz)은
연주 중 채널 화면을 그리지 않으므로 표시 변경은 해당이 없습니다. 자세한 내용은 두 스코프의 사용
설명서 "채널뷰와 스펙트럼"에 있습니다.

These changes come after v1.5-Stable (published 2026-11-22) and are not in the published ZIPs.
MUBPLAY, MUCPLAY, MUBScope and MUCScope changed; MUC2MUB and MUCEDIT are the same, and so are MUB files.

In a song that uses chip extension commands (`?IU` and the like), an MSX-MUSIC row that ties
(`&`) into a note of another block (`c& g`: the block changes between f+ and g), or whose `M`
vibrato crosses that boundary, sounded in the wrong octave. Earlier versions rewrote only the low
F-number byte while a note was held and sent the block on key-on and key-off only: `c& g` sounded
a g one octave low until the key-off, and even a shallow vibrato on g jumped almost an octave up on
every tick where the F-number went below 100H. The block is now sent whenever it changes, with the
key held. Songs without extension commands already played correctly and are unchanged.

MUBScope and MUCScope carry the same correction, and their channel display changed. Note names
show the pitch that sounds on every row (C4 = 261.6 Hz); earlier builds showed PSG rows a semitone
high and SCC, MSX-MUSIC and SSG rows an octave low, so SSG rows now read an octave higher than
before. Songs that use OPNA FM with the MSX PSG, MSX-MUSIC with the OPNA SSG, or SCC with the OPNA
SSG are shown on one page without changing chip pages. Also corrected: the first note of a song
showing as `C0` on FM rows, missing key-ons and key-offs on FM rows in songs that mix OPNA parts
with MSX chip parts, and empty PSG rows in PN6 chip-extension songs. An ordinary Z80 (3.58 MHz)
draws no channel view during playback, so the display changes do not apply there. The user guides
of both scopes describe this under "Channel view and spectrum".

v1.5-Stable（2026-11-22公開）より後の変更で、公開済みのZIPには入っていません。変わったプログラムは
MUBPLAY、MUCPLAY、MUBScope、MUCScopeです。MUC2MUBとMUCEDITはそのままで、MUBファイルも変わりません。

チップ拡張コマンド（`?IU`など）を使う曲のMSX-MUSIC行で、タイ（`&`）で別のブロックの音につなぐ
（`c& g`：ブロックはf+とgの間で変わります）か、`M`ビブラートがその境界を越えると、オクターブの
ずれた音が出る問題を直しました。以前の版は、音が続いている間F-numberの下位バイトだけを書き直し、
ブロックはキーオンとキーオフのときだけ書いていました。`c& g`はキーオフまで1オクターブ低いgで鳴り、
gにかけた浅いビブラートも、F-numberが100Hより下がるティックごとにほぼ1オクターブ上へ跳ねました。
今はブロックが変わると、キーを押したまま一緒に書きます。拡張コマンドのない曲は以前から正しく
演奏されており、変わりません。

MUBScopeとMUCScopeにも同じ修正が入り、チャンネル表示が次のように変わりました。音名は、すべての行で
実際に鳴っている音の高さ（C4 = 261.6Hz）で表示します。以前のビルドは、PSG行を半音高く、SCC・MSX-MUSIC・
SSG行を1オクターブ低く表示していました（SSG行は以前より1オクターブ高い名前で表示されます）。OPNA FMと
MSX PSG、MSX-MUSICとOPNA SSG、SCCとOPNA SSGを使う曲は、音源ページを切り替えなくても1画面に表示されます。
曲の最初の音がFM行に`C0`と出ていたこと、OPNAパートとMSXチップのパートを併用する曲でFM行のキーオン・
キーオフが抜けていたこと、PN6チップ拡張形式の曲でPSG行が空だったことも直しました。通常Z80（3.58MHz）は
演奏中にチャンネル画面を描かないため、表示の変更は当てはまりません。詳しくは両スコープのユーザーガイドの
チャンネル表示の節にあります。

## 2026-11-22 업데이트 — MUBPLAY의 CPU 가속 시점, 툴체인 ZIP에 샘플 폴더

MUBPLAY가 Panasonic MSX2+(5.37MHz)와 turbo R(R800)의 자동 가속을 실행 직후에 시작합니다.
이전 판은 곡과 PCM을 다 읽은 뒤, 버퍼를 채우기 직전에야 CPU를 바꿨습니다. 이제 곡 읽기와
PCM 전송도 빠른 CPU로 돌아 연주 시작까지의 시간이 줄어듭니다. MUCPLAY는 2026-11-20부터
이렇게 동작합니다. `/N`을 붙이면 가속하지 않고, 끝나면 원래 CPU로 되돌리는 것은 그대로입니다.

툴체인 ZIP(`MucoMSX_261122.zip`부터)에 샘플 곡 폴더 `MUCs`가 들어갑니다. MUC 53곡과
그 곡들이 쓰는 `#voice`·`#pcm` 파일이 폴더별로 들어 있어, 풀어서 바로 MUCPLAY·MUC2MUB·
MUBPLAY·MUCEDIT·MUCVIEW를 돌려 볼 수 있습니다. MUCScope 패키지의 샘플과 같은 구성입니다
(코시로 유조의 MUCOM88 샘플 곡과 MucoMSX 칩 확장 명령으로 쓴 3곡). 실행 방법은 ZIP의
`README.TXT`에 있습니다. 긴 폴더·파일 이름은 MSX에서 `BOSCON~1` 같은 8.3 이름으로 보입니다.
컴파일된 MUB 49곡을 담은 `MUBs` 폴더도 들어갑니다. MUBScope 패키지의 샘플과 같은 구성이고,
PCM이 MUB 안에 들어 있어 MUBPLAY로 바로 연주할 수 있습니다.

이전 ZIP에 있던 기본 음색 파일 `FMVOICE.DAT`·`SCCVOICE.DAT`·`INIT.TFI`는 넣지 않습니다.
새 음색·파형 뱅크는 MUCPlayground에서 만듭니다.

MUBPLAY now takes the faster CPU of a Panasonic MSX2+ (5.37 MHz) or a turbo R (R800) as
soon as it starts. Earlier versions switched only after the song and its PCM had been read,
just before the buffer fill. Reading the song and uploading the PCM run on the faster CPU
too, so playback starts sooner. MUCPLAY has worked this way since 2026-11-20. `/N` still
leaves the CPU alone, and the original CPU is restored at exit.

From `MucoMSX_261122.zip` the toolchain ZIP carries a sample song folder, `MUCs`:
53 MUC songs, each folder with the `#voice` and `#pcm` files its songs use, so MUCPLAY,
MUC2MUB, MUBPLAY, MUCEDIT and MUCVIEW can be tried right after unpacking. It is the same
sample set as the MUCScope package (Yuzo Koshiro's MUCOM88 sample songs and three songs
written with the MucoMSX chip extension commands). `README.TXT` in the ZIP shows how to run
them. Long folder and file names show as 8.3 names such as `BOSCON~1` on the MSX.
A second folder, `MUBs`, holds 49 compiled MUB songs, the sample set of the MUBScope
package; their PCM is inside the MUB, so MUBPLAY plays them as they are.

The starter voice files `FMVOICE.DAT`, `SCCVOICE.DAT` and `INIT.TFI` of earlier ZIPs are no
longer included; new voice and wave banks start in MUCPlayground.

MUBPLAYは、Panasonic MSX2+（5.37MHz）とturbo R（R800）の自動高速化を起動直後に始めます。
以前の版は、曲とPCMを読み終えた後、バッファーを埋める直前にCPUを切り替えていました。曲の
読み込みとPCM転送も速いCPUで動くため、演奏開始までの時間が短くなります。MUCPLAYは
2026-11-20からこの動作です。`/N`で高速化しないこと、終了時に元のCPUへ戻すことは変わりません。

`MucoMSX_261122.zip`から、ツールチェーンZIPにサンプル曲フォルダ`MUCs`が入ります。MUC 53曲と、
その曲が使う`#voice`・`#pcm`のファイルがフォルダごとに入っており、展開してすぐMUCPLAY・
MUC2MUB・MUBPLAY・MUCEDIT・MUCVIEWを試せます。MUCScopeパッケージのサンプルと同じ構成です
（古代祐三氏のMUCOM88サンプル曲と、MucoMSXチップ拡張コマンドで書いた3曲）。実行方法はZIPの
`README.TXT`にあります。長いフォルダ名・ファイル名は、MSXでは`BOSCON~1`のような8.3形式の
名前で表示されます。コンパイル済みのMUB 49曲を収めた`MUBs`フォルダも入ります。MUBScope
パッケージのサンプルと同じ構成で、PCMがMUBの中にあるため、MUBPLAYでそのまま演奏できます。

以前のZIPにあった初期音色ファイル`FMVOICE.DAT`・`SCCVOICE.DAT`・`INIT.TFI`は同梱しません。
新しい音色・波形バンクはMUCPlaygroundで作ります。

## 2026-11-21 업데이트 — MSX1의 빠르기, Makoto 필수, `/L` 반복 횟수

MSX1에서 초당 60틱(50Hz 기종은 50틱)보다 빠른 곡이 MUBPLAY·MUCPLAY에서 느리게
연주되던 문제를 고쳤습니다. 이전 판은 MSX1에서 화면 주사(VBlank)마다 한 틱씩만
연주해, 템포가 빠른 곡은 길게 늘어졌습니다(예: 초당 약 93틱인 곡은 1.5배 길이).
이제 MSX1에서는 Makoto(YM2608)의 내부 타이머(Timer B)로 박자를 맞춥니다. 50Hz
기종과 60Hz 기종의 빠르기도 같아집니다. MSX2 이상과 turbo R의 동작은 바뀌지
않았습니다. MSX1은 미리 계산 없이 직접 출력하므로, 3.58MHz로 계산이 벅찬 곡은
조금 늘어질 수 있습니다.

MucoMSX는 Makoto(YM2608) 카트리지를 기본 사양으로 합니다. MUBPLAY와 MUCPLAY는
Makoto가 없으면 `ERROR: YM2608 (Makoto) not detected.`를 표시하고 끝납니다.
PSG·SCC·OPLL만 쓰는 곡도 마찬가지입니다. MUC2MUB의 컴파일에는 필요하지 않습니다.

파트마다 반복 길이나 반복 시작점이 다른 곡에서 MUBPLAY·MUCPLAY의 `/L<n>`이
일찍 끝나던 문제를 고쳤습니다. 이전 판은 반복점이 있는 첫 파트만 세었습니다.
이제 반복하는 파트가 모두 한 번씩 되돌아갔을 때를 한 번으로 셉니다. 모든
파트가 함께 반복하는 곡은 이전과 같은 시점에 끝납니다.

On an MSX1, songs faster than 60 ticks per second (50 on a 50 Hz machine) no
longer play slowly in MUBPLAY and MUCPLAY. Earlier versions played one tick per
video frame (VBlank) there, so fast songs were stretched (a song of about 93
ticks per second took 1.5 times as long). On an MSX1 the tempo now comes from
Makoto's own timer (YM2608 Timer B), and 50 Hz and 60 Hz machines play at the
same speed. MSX2 or later and turbo R are unchanged. An MSX1 plays with direct
output, without computing ahead, so a song that is too heavy for 3.58 MHz can
still stretch a little.

MucoMSX takes the Makoto (YM2608) cartridge as its base hardware. Without it
MUBPLAY and MUCPLAY show `ERROR: YM2608 (Makoto) not detected.` and end, also
for songs that use only PSG, SCC or OPLL. MUC2MUB compiles without it.

`/L<n>` in MUBPLAY and MUCPLAY no longer ends early in songs whose parts loop
with different lengths or from different points. Earlier versions counted only
the first part that has a loop point. A pass now counts when every looping part
has come round once more. Songs whose parts all loop together end at the same
point as before.

MSX1で、毎秒60ティック（50Hz機は50ティック）より速い曲がMUBPLAY・MUCPLAYで遅く
演奏される問題を直しました。以前の版はMSX1で画面の垂直帰線（VBlank）ごとに
1ティックずつしか演奏せず、テンポの速い曲は長く伸びていました（毎秒約93ティックの
曲は1.5倍の長さ）。MSX1ではMakoto（YM2608）の内部タイマー（Timer B）で拍を刻む
ようになり、50Hz機と60Hz機の速さも同じになります。MSX2以降とturbo Rの動作は
変わりません。MSX1は先の計算をせず直接出力するため、3.58MHzでは計算が追いつか
ない重い曲は少し伸びることがあります。

MucoMSXはMakoto（YM2608）カートリッジを基本仕様とします。MUBPLAYとMUCPLAYは
Makotoがないと`ERROR: YM2608 (Makoto) not detected.`を表示して終了します。
PSG・SCC・OPLLだけを使う曲でも同じです。MUC2MUBのコンパイルには不要です。

パートごとにループの長さや開始位置が違う曲で、MUBPLAY・MUCPLAYの`/L<n>`が
早く終わる問題を直しました。以前の版はループ点のある最初のパートだけを数えて
いました。ループするパートがすべて一度ずつ戻った時点を1回と数えるように
なりました。すべてのパートが同時にループする曲は、以前と同じ位置で終わります。

## 2026-11-20 업데이트 — 세션 기록을 RAM으로, CPU 자동 전환 확대

MUCPLAY가 세션 위치를 적어 두던 `MUCPLAY.SES` 파일을 없애고, 시스템 RAM(F600h)의
11바이트 기록으로 바꿨습니다. MUCPLAY의 `/LOAD`·`/COMPILE`·`/PLAY`·`/RELEASE`는
디스크에 쓰지 않고(`/MUB`로 내보낸 파일만 씁니다), MUC2MUB·MUBPLAY·MUCPLAY를 시작할
때마다 하던 파일 확인도 없어졌습니다. MUCEDIT이 편집 상태를 넘기려고 쓰는 자기 파일은
그대로입니다. 세션은 작업 폴더와 무관하게
찾으며, 리셋하면 기록과 함께 사라집니다. MUCPLAY·MUCEDIT은 같은 릴리스끼리 써야 하고,
맞지 않으면 `Use the matching /E3 MUCPLAY.COM.`을 표시합니다. 예전 버전이 남긴
`MUCPLAY.SES` 파일은 지워도 됩니다. 곡 폴더에 예전 MUCPLAY.COM·MXR이 남아 있어도 PATH에
같은 릴리스의 한 쌍이 있으면 그것을 찾아 씁니다. MUB 출력은 바뀌지 않았습니다.

같은 날, Panasonic MSX2+의 5.37MHz와 turbo R의 R800 자동 전환을 연주 밖으로 넓혔습니다.
MUC2MUB는 시작부터 종료까지, MUCPLAY는 적재·컴파일을 포함해 실행하는 동안 내내, MUCEDIT은
편집하는 동안 빠른 CPU로 돌고, 끝나면 원래대로 되돌립니다. One Chip MSX의 8.06MHz 전환은
전과 같습니다.

MUBPLAY·MUCPLAY는 연주를 준비하는 동안 진행 상황을 한 줄로 보여 줍니다: `PCM 45% Buffer 0%`처럼
PCM을 Makoto로 전송하는 과정(`PCM`)과 곡의 앞부분을 미리 계산하는 과정(`Buffer`)이 5% 단위로
같은 자리에서 바뀝니다. MUBPLAY는 곡 정보를 PCM 전송 전에 먼저 표시합니다.

같은 날 두 번째 빌드에서 MUCPLAY의 메모리 부족 대처를 다듬었습니다. `MUCPLAY /RELEASE`는 빈 매퍼
메모리가 없어도 세션을 해제합니다(전에는 빈 세그먼트가 7개보다 적으면 `Not enough mapper memory
to start.`가 나와 해제할 수 없었습니다). `/RELEASE`만 적었을 때는 프로그램 이름 없이 결과 한 줄만
표시합니다. 끝까지 가지 못한 `/LOAD`는 세션을 남기지 않고 쓰던 메모리를 모두 돌려줍니다.
`/COMPILE`이 메모리 부족으로 실패하면 `Error: not enough mapper memory.`를 함께 표시합니다.
중단했을 때 오류 문구가 진행률 줄 뒤에 붙던 것을 새 줄에서 시작하게 했고, 편집기·뷰어로 돌아가기
전의 안내를 `Press a key to return.`으로 바꿨습니다. MUCEDIT은 디스크가 가득 차 상태 파일을 쓰지
못했을 때 0바이트 `MUCEDIT.RET`를 남기지 않습니다. MUB 출력은 바뀌지 않았습니다.

MUC를 열어 보고 그 자리에서 컴파일·연주·MUB 내보내기를 하는 뷰어 MUCVIEW(v0.2)를 추가했습니다.
편집 기능이 없고 디스크에 상태 파일을 쓰지 않습니다. 2026-11-21부터 릴리스 패키지에 들어 있으며,
설명서는 문서 ZIP의 `MUCView/`에 있습니다(한국어·English·日本語).

MUCPLAY no longer writes the `MUCPLAY.SES` file; the session location is an 11-byte
record in system RAM (F600h). MUCPLAY's `/LOAD`, `/COMPILE`, `/PLAY` and `/RELEASE`
no longer write to disk (only the file exported with `/MUB` is written), and
MUC2MUB, MUBPLAY and MUCPLAY no longer look for that file at every start. The
files MUCEDIT writes to hand over its own editing state are unchanged. The
session is found from any folder and disappears with the record at reset. MUCPLAY
and MUCEDIT must be of the same release; otherwise `Use the matching /E3
MUCPLAY.COM.` is shown. A `MUCPLAY.SES` file left by an earlier version can be
deleted. An older MUCPLAY.COM/MXR pair left in a song folder is passed over when a
pair of the same release is on the PATH. MUB output is unchanged.

On the same day the automatic switch to 5.37 MHz (Panasonic MSX2+) and to the R800
(turbo R) was extended beyond playback: MUC2MUB runs fast from start to exit,
MUCPLAY for its whole run including loading and compiling, and MUCEDIT while
editing; each puts the CPU back when it ends. The One Chip MSX 8.06 MHz handling
is unchanged.

MUBPLAY and MUCPLAY show one status line while they prepare to play, for example
`PCM 45% Buffer 0%`: the transfer of the PCM to Makoto (`PCM`) and the computing ahead
of the start of the song (`Buffer`), rewritten in place in steps of 5%. MUBPLAY
prints the song information before the PCM transfer.

A second build on the same day tidied up what MUCPLAY does when memory is short.
`MUCPLAY /RELEASE` releases the session even with no free mapper memory (before,
with fewer than 7 free segments it stopped with `Not enough mapper memory to
start.` and the session could not be released). With `/RELEASE` alone on the
command line only the result line is shown, without the program name. A `/LOAD`
that does not finish leaves no session and gives back all the memory it used. A
`/COMPILE` that fails for lack of memory also prints `Error: not enough mapper
memory.` After an interruption the error text starts on a new line instead of
after the progress line, and the prompt before going back to the editor or viewer
now reads `Press a key to return.` MUCEDIT no longer leaves a 0-byte `MUCEDIT.RET`
when the disk is full and its state file cannot be written. MUB output is unchanged.

MUCVIEW (v0.2) is new: a viewer that opens a MUC and compiles, plays and exports
it to MUB on the spot. It has no editing functions and writes no state file.
It is part of the release package from 2026-11-21; its manuals are in `MUCView/` of the
documentation ZIP (Korean, English, Japanese).

MUCPLAYは`MUCPLAY.SES`ファイルを作らなくなり、セッションの場所はシステムRAM(F600h)の
11バイトの記録になりました。MUCPLAYの`/LOAD`・`/COMPILE`・`/PLAY`・`/RELEASE`は
ディスクに書き込みません(`/MUB`で書き出すファイルだけを書きます)。MUC2MUB・MUBPLAY・
MUCPLAYが起動のたびに行っていたファイル確認もなくなりました。MUCEDITが編集状態を
引き継ぐために書く自分のファイルはそのままです。セッションは
どのフォルダからでも見つかり、リセットすると記録とともに消えます。MUCPLAYとMUCEDITは
同じリリースのものを使ってください。合わない場合は`Use the matching /E3 MUCPLAY.COM.`
と表示します。以前のバージョンが残した`MUCPLAY.SES`ファイルは削除してかまいません。
曲フォルダに古いMUCPLAY.COM・MXRが残っていても、PATHに同じリリースの一組があれば
そちらを使います。MUBの出力は変わりません。

同じ日に、Panasonic MSX2+の5.37MHzとturbo RのR800への自動切り替えを演奏以外にも広げました。
MUC2MUBは起動から終了まで、MUCPLAYは読み込み・コンパイルを含む実行中ずっと、MUCEDITは
編集中に高速CPUで動き、終わると元に戻します。One Chip MSXの8.06MHzの扱いは変わりません。

MUBPLAY・MUCPLAYは演奏の準備中に進み具合を1行で表示します。`PCM 45% Buffer 0%`のように、
PCMをMakotoへ転送する処理(`PCM`)と曲の冒頭を先に計算する処理(`Buffer`)が5%刻みで
同じ位置に書き換えられます。MUBPLAYは曲情報をPCM転送の前に表示します。

同じ日の2つ目のビルドで、メモリ不足時のMUCPLAYの動作を整えました。`MUCPLAY /RELEASE`は
空きマッパーメモリがなくてもセッションを解放します(以前は空きセグメントが7個より少ないと
`Not enough mapper memory to start.`と表示され、解放できませんでした)。`/RELEASE`だけを
指定したときは、プログラム名を表示せず結果の1行だけを表示します。最後まで進まなかった`/LOAD`は
セッションを残さず、使っていたメモリをすべて返します。`/COMPILE`がメモリ不足で失敗したときは
`Error: not enough mapper memory.`も表示します。中断したときにエラー文が進行表示の行の
後ろに続いていたのを新しい行から始めるようにし、エディタ・ビューアへ戻る前の案内を
`Press a key to return.`に変えました。MUCEDITは、ディスクがいっぱいで状態ファイルを書けなかった
ときに0バイトの`MUCEDIT.RET`を残しません。MUBの出力は変わりません。

MUCを開いて、その場でコンパイル・演奏・MUB書き出しを行うビューアMUCVIEW(v0.2)を追加しました。
編集機能はなく、ディスクに状態ファイルを書きません。2026-11-21からリリースパッケージに含まれ、
説明書は文書ZIPの`MUCView/`にあります(韓国語・English・日本語)。

## 2026-11-18 업데이트 — 2026-11-15 빌드 이후 변경

- PCM 포함 옵션: 컴파일할 때 `#pcm` 파일을 MUB에 넣을지 고릅니다. MUC2MUB는 `/P`, MUCPLAY는 `/MUB 이름 /P`, MUCEDIT는 내보낼 때 `Include the PCM file in the MUB? (Y/N)`에 `Y`. **옵션이 없으면 MUB에 PCM을 넣지 않습니다**(이전 판은 늘 넣었습니다). 예전처럼 한 파일로 만들려면 `/P`를 쓰세요. `/P`로 만든 MUB는 이전 판의 출력과 같습니다.
- PCM이 들어 있지 않은 MUB의 연주: MUBPLAY는 MUB와 같은 폴더에서 `#pcm` 파일을 찾아 읽습니다. 없으면 `PCM file not found:`와 파일 이름, `Playing without PCM.`을 표시하고 PCM 없이 연주합니다.
- `#pcm` 규칙: K 파트(ADPCM)에 음표가 있는 곡은 `#pcm` 태그가 꼭 있어야 합니다(없으면 새 오류 20 "K part needs a #pcm tag"). `#pcm` 뒤에 이름을 적지 않으면 `MUCOMPCM.BIN`을 쓰고, 그 파일이 없으면 오류 19입니다. `#pcm` 태그가 없는 곡에서는 `MUCOMPCM.BIN`을 찾지 않으며, 예전의 `Warning: PCM not found` 경고는 없어졌습니다. `#pcm`에는 폴더 없이 파일 이름만 씁니다.
- 태그의 파일 이름은 8.3만(2026-11-19): `#pcm`과 `#voice`에는 8.3 형식의 파일 이름만 쓸 수 있습니다(이름 8자, 확장자 3자까지). 더 긴 이름이나 `?`·`*`가 든 이름은 새 오류 21 "Name not 8.3"로 컴파일하지 않습니다. 이전 판은 긴 `#voice` 이름을 앞 8자로 잘라서 열었습니다. 긴 이름을 쓰던 곡은 태그와 실제 파일 이름을 8.3으로 바꿔 주세요. MUBPLAY도 MUB의 `#pcm` 이름이 8.3 형식이 아니면 그 파일을 찾지 않고 PCM 없이 연주합니다. 입력 MUC 이름과 태그의 이름에 `~`를 쓸 수 있습니다(`LONGSO~1.MUC`).
- MSX-DOS 2 지원: 네 도구가 Nextor뿐 아니라 MSX-DOS 2(2.20에서 확인)에서도 동작합니다. 이전 판은 메모리 끝이 512바이트 낮은 MSX-DOS 2에서 시작하지 못했습니다.
- MM에서 바로 실행: MUBPLAY·MUCPLAY·MUC2MUB·MUCEDIT를 MM(Multi Mente) 같은 파일 관리자에서 바로 실행할 수 있습니다. `MMRET.DAT`에 `.MUB<탭>MUBPLAY $C`, `.MUC<탭>MUCPLAY $C`를 넣으세요. MUCOMSXE.COM은 필요하지 않아 2026-11-19에 패키지에서 뺐습니다(`MMRET.DAT`에 MUCOMSXE를 적어 두었다면 위 두 줄로 바꾸세요). 오류 문구로 끝났을 때는 `Press any key to return.`에서 키를 기다린 뒤 돌아갑니다.
- `#CarrierCorrection`이 MUC를 바로 연주할 때(MUCPLAY, MUCEDIT의 연주) 적용되지 않던 문제를 고쳤습니다.
- 일부 60Hz MSX1(예: Sony HB-10)에서 MUBPLAY·MUCPLAY가 약 20% 빠르게 연주하던 문제를 고쳤습니다.
- 512KiB 매퍼에서 MUCEDIT로 컴파일한 뒤 연주나 MUBPLAY가 "Not enough mapper memory to start."로 시작하지 못하던 문제를 고쳤습니다(시작할 때 쓰지 않는 64KiB를 더 요구하지 않습니다).

### 알려진 제한 (2026-11-18)

- 8.3 이름의 음색 파일을 열지 못하면 `Warning: voice not found:` 경고 뒤 음색 없이 컴파일을 계속합니다(오류가 아닙니다).
- MSX 칩 확장 문법 MUC의 원본 한도는 14,976바이트입니다(v1.5-Stable 안내의 "약 14,900바이트"를 다시 잰 값). 넘으면 code 9입니다.
- MUC2MUB와 MUCPLAY는 곡 파일을 경로 없이 이름만 받습니다. 다른 드라이브·폴더의 곡은 그 폴더로 가서 실행하세요. MUBPLAY는 경로를 받습니다.
- MM에서 `MUC2MUB.COM` 자체를 실행하면 끝날 때 키를 두 번 누릅니다(프로그램의 대기와 MM의 대기).

### English

- PCM option: choose at compile time whether the `#pcm` file goes into the MUB. `/P` in MUC2MUB, `/MUB name /P` in MUCPLAY, and `Y` at `Include the PCM file in the MUB? (Y/N)` when exporting from MUCEDIT. **Without the option the MUB carries no PCM** (earlier versions always embedded it). Use `/P` to get a single file as before; a MUB built with `/P` is the same as the earlier output.
- Playing a MUB without embedded PCM: MUBPLAY looks up the `#pcm` file in the MUB's folder. If it is missing it prints `PCM file not found:`, the file name and `Playing without PCM.`, and plays without PCM.
- `#pcm` rules: a song whose K part (ADPCM) has a note must have a `#pcm` tag (new error 20, "K part needs a #pcm tag"). A `#pcm` tag without a name means `MUCOMPCM.BIN`, and error 19 when that file is missing. A song without a `#pcm` tag never looks for `MUCOMPCM.BIN`, and the old `Warning: PCM not found` is gone. `#pcm` takes a file name only, without a folder.
- Tag file names are 8.3 only (2026-11-19): `#pcm` and `#voice` take 8.3 file names only (a stem of up to 8 characters and an extension of up to 3). A longer name, or one with `?` or `*`, is refused with the new error 21, "Name not 8.3". Earlier versions opened a long `#voice` name cut to its first 8 characters. A song that used long names needs its tags and the actual files renamed to 8.3. MUBPLAY likewise does not look up a `#pcm` name in a MUB that is not an 8.3 name, and plays without PCM. `~` is accepted in the input MUC name and in tag names (`LONGSO~1.MUC`).
- MSX-DOS 2: the four tools run on MSX-DOS 2 (verified on 2.20) as well as on Nextor. Earlier versions could not start on MSX-DOS 2, where the top of memory is 512 bytes lower.
- Running from MM: MUBPLAY, MUCPLAY, MUC2MUB and MUCEDIT start directly from a file manager such as MM (Multi Mente). Put `.MUB<TAB>MUBPLAY $C` and `.MUC<TAB>MUCPLAY $C` in `MMRET.DAT`. MUCOMSXE.COM is not needed and was removed from the package on 2026-11-19 (if your `MMRET.DAT` names MUCOMSXE, change it to the two lines above). After an error message the program waits at `Press any key to return.` before going back.
- `#CarrierCorrection` was not applied when a MUC was played directly (MUCPLAY, Play in MUCEDIT); fixed.
- MUBPLAY and MUCPLAY no longer play about 20% fast on some 60 Hz MSX1 machines (for example the Sony HB-10).
- On a 512 KiB mapper, Play after compiling in MUCEDIT, or MUBPLAY afterwards, no longer fails with "Not enough mapper memory to start." (64 KiB that was not used is no longer requested at start).

### Known limits (2026-11-18)

- When a voice file with an 8.3 name cannot be opened, `Warning: voice not found:` is shown and the compile continues without those voices (it is not an error).
- The source limit of a MUC in the MSX chip extension grammar is 14,976 bytes (a re-measurement of the "about 14,900 bytes" in the v1.5-Stable notes). Beyond it: code 9.
- MUC2MUB and MUCPLAY take the song as a bare file name, without a path; change to the song's folder first. MUBPLAY accepts a path.
- Starting `MUC2MUB.COM` itself from MM needs two key presses at the end (the program's wait and MM's own).

### 日本語

- PCM同梱オプション: コンパイル時に`#pcm`のファイルをMUBに入れるかどうかを選びます。MUC2MUBは`/P`、MUCPLAYは`/MUB 名前 /P`、MUCEDITは書き出し時の`Include the PCM file in the MUB? (Y/N)`に`Y`。**オプションがなければMUBにPCMを入れません**（以前の版は常に入れていました）。従来どおり1ファイルにするには`/P`を使ってください。`/P`で作ったMUBは以前の版の出力と同じです。
- PCMが入っていないMUBの演奏: MUBPLAYはMUBと同じフォルダーで`#pcm`ファイルを探して読みます。なければ`PCM file not found:`とファイル名、`Playing without PCM.`を表示し、PCMなしで演奏します。
- `#pcm`の規則: Kパート（ADPCM）に音符がある曲には`#pcm`タグが必要です（なければ新しいエラー20「K part needs a #pcm tag」）。`#pcm`のあとに名前を書かなければ`MUCOMPCM.BIN`を使い、そのファイルがなければエラー19です。`#pcm`タグのない曲では`MUCOMPCM.BIN`を探さず、以前の`Warning: PCM not found`の警告はなくなりました。`#pcm`にはフォルダーを付けず、ファイル名だけを書きます。
- タグのファイル名は8.3のみ（2026-11-19）: `#pcm`と`#voice`には8.3形式のファイル名だけを書けます（主名8文字まで、拡張子3文字まで）。それより長い名前や`?`・`*`を含む名前は、新しいエラー21「Name not 8.3」となり、コンパイルしません。以前の版は長い`#voice`名を先頭8文字に切り詰めて開いていました。長い名前を使っていた曲は、タグと実際のファイル名を8.3に変えてください。MUBPLAYも、MUBの`#pcm`の名前が8.3形式でなければそのファイルを探さず、PCMなしで演奏します。入力MUCの名前とタグの名前に`~`を使えます（`LONGSO~1.MUC`）。
- MSX-DOS 2対応: 4ツールがNextorだけでなくMSX-DOS 2（2.20で確認）でも動作します。以前の版は、メモリーの上端が512バイト低いMSX-DOS 2では起動できませんでした。
- MMからの直接起動: MUBPLAY・MUCPLAY・MUC2MUB・MUCEDITを、MM（Multi Mente）などのファイル管理ソフトから直接起動できます。`MMRET.DAT`に`.MUB<タブ>MUBPLAY $C`、`.MUC<タブ>MUCPLAY $C`を入れてください。MUCOMSXE.COMは不要なため、2026-11-19にパッケージから外しました（`MMRET.DAT`にMUCOMSXEを書いている場合は、上の2行に変えてください）。エラーの文言で終了したときは`Press any key to return.`でキーを待ってから戻ります。
- MUCを直接演奏するとき（MUCPLAY、MUCEDITの演奏）に`#CarrierCorrection`が適用されなかった問題を直しました。
- 一部の60Hz MSX1（例: Sony HB-10）でMUBPLAY・MUCPLAYが約20%速く演奏する問題を直しました。
- 512KiBマッパーで、MUCEDITでコンパイルしたあとの演奏やMUBPLAYが「Not enough mapper memory to start.」で起動できなかった問題を直しました（起動時に使わない64KiBを要求しなくなりました）。

### 既知の制限 (2026-11-18)

- 8.3の名前の音色ファイルを開けないときは、`Warning: voice not found:`の警告のあと、音色なしでコンパイルを続けます（エラーではありません）。
- MSXチップ拡張文法のMUCのソースの上限は14,976バイトです（v1.5-Stableの案内の「約14,900バイト」を測り直した値）。超えるとcode 9です。
- MUC2MUBとMUCPLAYは、曲ファイルをパスなしの名前だけで受け取ります。別のドライブ・フォルダーの曲は、そのフォルダーへ移動して実行してください。MUBPLAYはパスを受け取ります。
- MMから`MUC2MUB.COM`自体を起動すると、終了時にキーを2回押します（プログラムの待ちとMMの待ち）。

## MucoMSX v1.5-Stable — v1.0-Stable(2026-10-16 배포) 이후 변경 (2026-11-15 빌드까지)

- MUCVOICE 제거: 툴체인 ZIP은 MUCEDIT·MUCPLAY·MUC2MUB·MUBPLAY 네 도구를 담습니다. FM 음색, SCC/SCC+ 파형, ADPCM PCM 뱅크 편집은 [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)가 맡습니다(FM·SCC·PCM 뱅크 읽기·저장, FM 음색·SCC 파형·PCM 편집기). 기본 데이터 FMVOICE.DAT·SCCVOICE.DAT·INIT.TFI는 그대로 들어 있습니다. 순서와 화면은 문서 ZIP의 MUCPlayground 편집 가이드(`shared/docs/MUCPLAYGROUND.md`)와 [공식 사용 설명서](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=ko#banks)를 보세요.
- 실행 파일 구성: MUC2MUB·MUCPLAY·MUBPLAY는 같은 빌드의 COM과 MXR을 함께 설치합니다. MXR은 현재 폴더, 프로그램 폴더, `PATH` 순서로 찾습니다.
- MUBPLAY·MUCPLAY의 VGM 출력(`/V`)을 없앴습니다(2026-10-30). `/V`는 무시합니다.
- One Chip MSX: 네 도구가 카트리지 슬롯 3.58MHz, CPU 8.06MHz로 실행하고 종료 때 되돌립니다.
- 메모리: 내장·외장 매퍼 중 빈 메모리가 더 많은 매퍼를 골라 씁니다.
- MSX2 이상과 turbo R에서는 연주 전에 곡의 앞부분을 미리 계산해 두고 연주합니다. MSX1에서는 미리 계산 없이 직접 출력 방식으로 연주합니다.
- 네이티브 MSX 악보(msPb0103~0109)도 `/L<n>`으로 정해진 횟수 뒤에 끝납니다. 반복은 채널마다 셉니다.
- MUBPLAY: PCM이 내장되지 않은 MUB는 `#pcm` 태그의 파일을 MUB와 같은 폴더에서 읽습니다. 파일이 없으면 ADPCM만 무음입니다.
- MUCPLAY·MUCEDIT·MUC2MUB: `#pcm`에 적힌 파일이 없으면 컴파일하지 않고 오류 19를 냅니다. `#pcm`이 없고 `MUCOMPCM.BIN`도 없는 곡은 경고 뒤 ADPCM 없이 연주합니다.
- PCM이 없는 곡에서 앞 곡의 PCM이 울리던 문제, OPNA `!`에서 채널 끝 표시가 빠지던 문제, `#sccvoice`와 제목·OPNA 파트가 함께 있는 곡의 컴파일이 끝나지 않던 문제, turbo R에서 MUCPLAY가 일부 msPb0102 곡을 시작하지 못하던 문제를 고쳤습니다.
- OPNA 문법 OPLL 파트의 첫 음이 늦게 들리던 문제, SSG·SCC 타이 음에서 LFO가 다시 시작되던 문제를 고쳤습니다.
- SCC 파형(`#sccvoice` 파일·인라인 파형)을 쓰는 일부 곡이 메모리가 있는데도 "Mapper unavailable" 오류로 실패하거나 컴파일이 끝나지 않던 문제를 고쳤습니다(예: `MSX_All_Chips`, City pop demo, ARG011).
- 컴파일 중 Ctrl-STOP을 눌러도 정상 프롬프트나 MUCEDIT로 돌아옵니다. MUCEDIT에서 Ç·ü·é 같은 문자와 CP932 문자를 입력할 수 있고, `MEDSAVE.BAK`·`MEDSAVE.$$$`가 남아 있으면 이름을 바꾸라고 알려 줍니다. 줄바꿈 없이 1,023바이트를 넘는 줄은 code 17, `#pcm`의 빈 값은 경고로 처리합니다.
- 복귀 명령으로 되도는 네이티브 곡(예: GOFER MUS0042)도 `/L<n>` 뒤에 끝납니다.
- 실행기 MUCOMSXE.COM (2026-11-15에 넣었고 2026-11-19에 뺌): MM(Multi Mente) 같은 파일 관리자에서 `.MUC`·`.MUB`를 MUCPLAY·MUBPLAY로 여는 실행기였습니다. 지금은 도구가 MM에서 바로 실행되므로 패키지와 문서에서 뺐습니다. 위 "2026-11-18 업데이트"의 "MM에서 바로 실행"을 보세요.
- MSX1 지원 (2026-11-15): MUBPLAY·MUCPLAY·MUC2MUB는 MSX1에서도 동작합니다(MSX-DOS2 또는 Nextor와 512KiB 이상 매퍼 필요). 60Hz MSX1에서 SCC를 쓰는 곡이 "An exception occurred."로 바로 끝나던 문제를 고쳤습니다. MUCEDIT는 80컬럼 화면이 필요해 MSX2 이상에서 동작하며, MSX1에서는 "MUCEDIT: MSX2 required."를 보여 주고 바로 끝납니다.
- 40컬럼 메시지 (2026-11-15): DOS 프롬프트에 나오는 메시지를 한 줄 36자 이하로 다듬어, MSX1의 40컬럼 화면에서도 줄이 넘치지 않습니다. 그래서 일부 오류·경고 문구가 짧아졌습니다(예: `Error: not enough mapper memory.`, `Bad channel prefix (use A-K+space)`).

### 알려진 제한

- MSX 칩 확장 문법(`SCCA`~`SCCE`·`MSXx`·`PSGS` 행, `?` 명령)을 쓰는 MUC는 원본을 입력 창 하나로 읽습니다. 실측 한도는 주석을 포함해 약 14,900바이트이고, 넘으면 원인과 다른 code 9 "Command not valid for this channel"이 납니다. 주석을 줄이세요.
- 매크로 호출 중첩은 8단까지입니다(넘으면 code 16).
- 3.58MHz Z80에서 아주 무거운 곡(예: Gradius III의 Aqua Illusion, Boss 4)은 재생이 늦어질 수 있습니다. Panasonic 고속 Z80이나 turbo R을 권합니다.
- turbo R에서 긴 곡은 시간축이 약 0.35% 늦게 누적됩니다(원인 조사 중).
- MUCPLAY에 경로를 붙인 MUC 인자(`MUCPLAY C:\SONGS\SONG.MUC`)는 실패할 수 있습니다. 곡 폴더로 이동해 실행하세요.

### English

- MUCVOICE removed: the toolchain ZIP contains the four tools MUCEDIT, MUCPLAY, MUC2MUB and MUBPLAY. Edit FM voices, SCC/SCC+ waves and ADPCM PCM banks in [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) (FM/SCC/PCM banks that read and save the files, plus FM voice, SCC wave and PCM editors). The starter data FMVOICE.DAT, SCCVOICE.DAT and INIT.TFI are still included. See the MUCPlayground editing guide (`shared/docs/MUCPLAYGROUND.en.md` in the documentation ZIP) and the [official user's guide](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=en#banks).
- Package: install each COM with the MXR of the same build for MUC2MUB, MUCPLAY and MUBPLAY. The MXR is looked up in the current folder, the program folder, then `PATH`.
- VGM output (`/V`) was removed from MUBPLAY and MUCPLAY (2026-10-30); `/V` is ignored.
- One Chip MSX: all four tools run with the cartridge slots at 3.58 MHz and the CPU at 8.06 MHz, restored at exit.
- Memory: the mapper (internal or external) with more free memory is used.
- On MSX2 or later and turbo R, the start of the song is computed ahead before playback. On an MSX1 the song plays with direct output, without computing ahead.
- Native MSX scores (msPb0103–0109) now end after `/L<n>` passes; repeats are counted per channel.
- MUBPLAY: a MUB without embedded PCM loads the file named by its `#pcm` tag from the MUB's folder; without it only the ADPCM part is silent.
- MUCPLAY/MUCEDIT/MUC2MUB: a missing `#pcm` file stops compilation with error 19; a song without `#pcm` and without `MUCOMPCM.BIN` plays without ADPCM after a warning.
- Fixed: a PCM-less song playing the previous song's PCM; the missing channel end after OPNA `!`; compilation never finishing for songs with `#sccvoice`, a title and OPNA parts; MUCPLAY failing to start some msPb0102 songs on turbo R; the late first note of OPLL parts written in OPNA syntax; LFO restarting on tied SSG/SCC notes.
- Fixed songs that use SCC waves (a `#sccvoice` file or inline waves) failing with "Mapper unavailable" although memory was free, or never finishing compilation (for example `MSX_All_Chips`, the City pop demo, ARG011).
- Ctrl-STOP during compilation now returns to the prompt or to MUCEDIT. MUCEDIT accepts characters such as Ç, ü, é and CP932 text, and asks you to rename a leftover `MEDSAVE.BAK` or `MEDSAVE.$$$`. A line longer than 1,023 bytes without a line break gives code 17; an empty `#pcm` value is a warning.
- Native songs that loop through a return command (for example GOFER MUS0042) also end after `/L<n>`.
- Launcher MUCOMSXE.COM (added on 2026-11-15, removed on 2026-11-19): it opened `.MUC` and `.MUB` files with MUCPLAY and MUBPLAY from file managers such as MM (Multi Mente). The tools now start directly from MM, so the launcher and its manual are no longer in the packages. See "Running from MM" in the 2026-11-18 update above.
- MSX1 support (2026-11-15): MUBPLAY, MUCPLAY and MUC2MUB also run on an MSX1 (MSX-DOS2 or Nextor and at least 512 KiB of mapper RAM). Songs that use SCC no longer end at once with "An exception occurred." on a 60 Hz MSX1. MUCEDIT needs an 80-column screen and runs on an MSX2 or later; on an MSX1 it shows "MUCEDIT: MSX2 required." and ends at once.
- 40-column messages (2026-11-15): messages at the DOS prompt fit in 36 characters per line, so they no longer wrap on the 40-column screen of an MSX1. Some error and warning texts became shorter (for example `Error: not enough mapper memory.` and `Bad channel prefix (use A-K+space)`).

### Known limits

- A MUC that uses the MSX chip extension syntax (`SCCA`–`SCCE`, `MSXx`, `PSGS` rows, `?` commands) is read in one input window. The measured limit is about 14,900 bytes including comments; a larger source fails with code 9 "Command not valid for this channel", which does not name the cause. Shorten the comments.
- Macro calls nest at most 8 deep (deeper gives code 16).
- On a 3.58 MHz Z80, very heavy songs (for example Gradius III's Aqua Illusion and Boss 4) can fall behind. A Panasonic fast Z80 or a turbo R is recommended.
- On turbo R, long songs drift about 0.35% late (under investigation).
- A MUC argument with a path (`MUCPLAY C:\SONGS\SONG.MUC`) can fail. Change to the song's folder first.

### 日本語

- MUCVOICE削除：ツールチェーンZIPはMUCEDIT・MUCPLAY・MUC2MUB・MUBPLAYの4ツールです。FM音色、SCC/SCC+波形、ADPCMのPCMバンクの編集は[MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)で行います（FM・SCC・PCMバンクの読み込み・保存、FM音色・SCC波形・PCMエディター）。初期データFMVOICE.DAT・SCCVOICE.DAT・INIT.TFIは引き続き同梱します。手順と画面は文書ZIPのMUCPlayground編集ガイド（`shared/docs/MUCPLAYGROUND.ja.md`）と[公式ユーザーガイド](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=ja#banks)を参照してください。
- 構成：MUC2MUB・MUCPLAY・MUBPLAYは同じビルドのCOMとMXRを一緒に置きます。MXRは現在のフォルダー、プログラムのフォルダー、`PATH`の順に探します。
- MUBPLAY・MUCPLAYのVGM出力（`/V`）を削除しました（2026-10-30）。`/V`は無視します。
- One Chip MSX：4ツールともカートリッジスロット3.58MHz、CPU 8.06MHzで動作し、終了時に戻します。
- メモリー：内蔵・外付けマッパーのうち空きメモリーの多い方を使います。
- MSX2以降とturbo Rでは、演奏前に曲の冒頭を先に計算してから演奏します。MSX1では先の計算をせず、直接出力方式で演奏します。
- ネイティブMSX楽譜（msPb0103〜0109）も`/L<n>`の回数で終わります。繰り返しはチャンネルごとに数えます。
- MUBPLAY：PCMを内蔵しないMUBは、`#pcm`タグのファイルをMUBと同じフォルダーから読みます。ファイルがなければADPCMだけ無音です。
- MUCPLAY・MUCEDIT・MUC2MUB：`#pcm`のファイルがないとコンパイルせずエラー19を出します。`#pcm`がなく`MUCOMPCM.BIN`もない曲は警告のあとADPCMなしで演奏します。
- 修正：PCMのない曲で前の曲のPCMが鳴る問題、OPNAの`!`でチャンネル終端が抜ける問題、`#sccvoice`とタイトル・OPNAパートを含む曲のコンパイルが終わらない問題、turbo RでMUCPLAYが一部のmsPb0102曲を開始できない問題、OPNA文法のOPLLパートの最初の音が遅れる問題、SSG・SCCのタイでLFOがやり直される問題。
- SCC波形（`#sccvoice`ファイル・インライン波形）を使う一部の曲が、メモリに空きがあるのに"Mapper unavailable"で失敗したり、コンパイルが終わらなかったりする問題を修正しました（例: `MSX_All_Chips`、City pop demo、ARG011）。
- コンパイル中にCtrl-STOPを押しても、プロンプトやMUCEDITへ正常に戻ります。MUCEDITでÇ・ü・éなどの文字とCP932文字を入力でき、`MEDSAVE.BAK`・`MEDSAVE.$$$`が残っていると名前の変更を促します。改行なしで1,023バイトを超える行はcode 17、`#pcm`の空の値は警告になります。
- 戻り命令で繰り返すネイティブ曲（例: GOFER MUS0042）も`/L<n>`のあとに終わります。
- 起動ツールMUCOMSXE.COM（2026-11-15に追加、2026-11-19に削除）：MM（Multi Mente）などのファイル管理ソフトから`.MUC`・`.MUB`をMUCPLAY・MUBPLAYで開くツールでした。現在はツールをMMから直接起動できるため、パッケージと文書から外しました。上の「2026-11-18の更新」の「MMからの直接起動」を参照してください。
- MSX1対応（2026-11-15）：MUBPLAY・MUCPLAY・MUC2MUBはMSX1でも動作します（MSX-DOS2またはNextorと512KiB以上のマッパーが必要）。60HzのMSX1でSCCを使う曲が「An exception occurred.」ですぐに終了する問題を直しました。MUCEDITは80桁画面が必要なためMSX2以上で動作し、MSX1では「MUCEDIT: MSX2 required.」を表示してすぐに終了します。
- 40桁メッセージ（2026-11-15）：DOSプロンプトに出るメッセージを1行36文字以内に整え、MSX1の40桁画面でも行があふれないようにしました。そのため一部のエラー・警告の文言が短くなりました（例：`Error: not enough mapper memory.`、`Bad channel prefix (use A-K+space)`）。

### 既知の制限

- MSXチップ拡張文法（`SCCA`〜`SCCE`・`MSXx`・`PSGS`行、`?`命令）を使うMUCは、原文を入力1窓で読みます。実測の上限はコメント込みで約14,900バイトで、超えると原因と異なるcode 9 "Command not valid for this channel"になります。コメントを減らしてください。
- マクロ呼び出しのネストは8段までです（超えるとcode 16）。
- 3.58MHzのZ80では非常に重い曲（例: グラディウスIIIのAqua Illusion、Boss 4）の再生が遅れることがあります。Panasonicの高速Z80かturbo Rを推奨します。
- turbo Rでは長い曲の時間軸が約0.35%遅れて累積します（原因調査中）。
- MUCPLAYにパス付きのMUC引数（`MUCPLAY C:\SONGS\SONG.MUC`）を渡すと失敗することがあります。曲のフォルダに移動して実行してください。

## Z80 재생 처리 최적화 (2026-10-28)

MUCPLAY와 MUBPLAY의 반복 카운터 조회·갱신, 작은 악보의 반복값 읽기,
FM 음색 전송과 확장 기능의 비활성 상태 처리를 개선했습니다. 음악 DATA를
수정하거나 음원 쓰기를 생략하지 않으며, 기존 MUC/MUB 문법과 MSX·OPNA
혼합 경로를 유지합니다. 96KiB DATA 상한과 mapper 할당 수는 그대로입니다.
부하가 집중되는 악보에는 처리시간 초과가 여전히 남을 수 있습니다.

MUCPLAY and MUBPLAY now reduce repeat-state lookup/update work, small-score
repeat reads, FM instrument dispatch and inactive extension processing. Music
DATA remains immutable and chip writes retain their order and values. Existing
syntax, MSX/OPNA mixed playback, the 96KiB DATA limit and mapper allocations
remain unchanged. Dense scores can still exceed a playback tick's time budget.

MUCPLAYとMUBPLAYの反復カウンター参照・更新、小さな楽譜の反復値読み出し、
FM音色転送、未使用の拡張機能の処理を改善しました。音楽DATAを書き換えず、
音源への書き込みの順序と値を維持します。既存構文、MSX・OPNA混合演奏、
96KiBのDATA上限、mapper割り当て数は変更していません。処理が集中する楽譜では
演奏tickの時間超過が残る場合があります。

## 현재 MSX 확장과 실행 조건

PSG·SCC/SCC+·OPLL 채널에는 기능 이름을 나타내는 `?` 두 글자 명령을 사용합니다.
기존 한 글자 `?`·`@` 별칭과 OPNA 문법은 유지합니다. 음고·음색 표 선택,
효과 프로그램의 유지·중지·재시작, MSX 전역 페이드와 `?WG` 공유 게이트 연동은
[한국어 제어 가이드](SCC_CONTROL.md),
[English guide](SCC_CONTROL.en.md),
[日本語ガイド](SCC_CONTROL.ja.md)와 문서 ZIP의 `docs/MSX_MML_*.TXT`에 설명되어 있습니다.

MUC2MUB·MUCPLAY·MUBPLAY는 같은 빌드의 COM과 MXR을 함께 설치합니다.
음악 DATA 상한은 현재 96KiB(98,304바이트)입니다. 기본 OPNA A..K와 MSX 채널의
동시 연주를 지원하며, compact MSX와 OPNA 다중 페이지·확장 FM3 디렉터리의
혼합은 지원하지 않습니다. 해당 조합은 컴파일 오류로 중단되며 일반 OPNA 다중
페이지 악보는 기존 경로를 사용합니다. 높은 처리량의 곡은 일반 Z80에서 순간
지연이 남을 수 있습니다. 이 배포물에 시험용 준비 실행 캐시는 포함되지 않습니다.

SCC 출력 준비와 짧은 음표 길이 처리를 개선하고, PN6 효과 처리 뒤 다른 곡을
초기화할 때 보조 코드와 임시 변수가 겹치던 문제를 수정했습니다.
음고·음색 표를 사용하는 PN6 곡에서 일반 음표와 `?EP3` 엔벌로프를 함께 쓰면
종료되지 않을 수 있던 호출 오류도 수정했습니다. 기존 MUC/MUB 문법은 바뀌지 않습니다.
MXR 로더가 DOS `PATH` 항목 앞뒤의 공백·탭을 처리하도록 수정했습니다.
하위 악보 폴더에서 PATH로 실행할 때 모듈을 찾지 못하던 문제를 해결합니다.
같은 tick 안에서 SCC 파형 슬롯을 재사용할 때는 중간 전송 후 Page1 매핑과
프레임 상태를 보존합니다. PN6 곡의 파형 불일치·재생 정지를 수정했습니다.

Current native MSX commands use two-letter `?` names; existing one-letter `?`/`@`
aliases and OPNA syntax remain supported. Install each COM with its matching MXR.
Music DATA is limited to 96KiB (98,304 bytes). Basic OPNA A..K can play with MSX
channels. Compact MSX cannot be combined with OPNA multipage/extended FM3
directories; compile such OPNA scores through their existing standalone path.
Heavy scores can still exceed a normal Z80 playback tick. Experimental prepared
execution caches are not included. SCC output preparation, short note durations,
and PN6-to-other-score helper memory ownership have been corrected.
Fixed a wrong envelope call that could prevent PN6 songs using ordinary notes
and `?EP3` from ending. Existing MUC/MUB syntax is unchanged.
The MXR loader now trims spaces/tabs around DOS PATH components, fixing module
lookup when tools are launched through PATH from a song directory.
Mid-tick SCC wave-slot reuse now preserves Page1 mapping and frame ownership
after committing queued writes, fixing wrong waveforms or stalled PN6 playback.

MSX拡張は機能名を表す2文字の`?`命令を使い、旧1文字の`?`/`@`別名とOPNA構文を
維持します。COMと対応する同一ビルドのMXRを一緒に導入してください。音楽DATAの
上限は96KiB（98,304バイト）です。基本OPNA A..KとMSXは併用できますが、compact
MSXとOPNA複数ページ・拡張FM3ディレクトリーの混在はコンパイルエラーになります。
通常のOPNA複数ページ楽譜は従来の単独経路を使用します。負荷の高い曲では通常Z80の
処理時間超過が残ります。試験用の事前実行キャッシュは同梱していません。SCC出力準備・
短い音長処理と、PN6演奏後の別楽譜初期化で補助コードと一時変数が重なる問題を修正しました。
PN6楽譜で通常音符と`?EP3`を併用すると演奏が終了しない場合がある呼び出し不具合も
修正しました。既存のMUC/MUB構文は変更していません。
MXRローダーはDOS PATH各項目の前後の空白・タブを除去します。楽譜フォルダーから
PATH経由で起動するとモジュールが見つからない問題を修正しました。
同一tick内でSCC波形スロットを再使用する際、中間転送後もPage1のマッピングと
フレーム状態を保持し、PN6の波形不一致や再生停止を修正しました。

## v0.81-beta 이후 추가·수정

- 반복 뒤의 타이·길이 연장에서 음악 DATA를 잘못 덮어쓰던 결함과 255클록 분할을 수정했습니다. 중괄호 뒤의 포르타멘토 길이·점음표·`%클록` 지정도 지원합니다. 영향 받은 MUB는 원본 MUC에서 다시 컴파일하세요.
- SCC/SCC+ SSG 확장: `#SSGExtend On/Off`, `@I0..9`, `@W0..255`, `peL,R`. D/E/F의 톤을 SCC/SCC+로 근사하며 노이즈·하드웨어 엔벌로프는 MAKOTO를 사용합니다.
- msPb0101: SSG 확장과 네이티브 혼합을 식별합니다. 기존 MUB8·muPb·msPb0100도 지원합니다.
- 일반 SCC 지원: SCC+ 우선 자동 탐색 후 일반 SCC로 대체합니다. 공통 SCC VGM 출력을 지원합니다.
- `#PCMInvert On/Off`: K의 상대 옥타브 방향을 컴파일 단계에서 변경합니다. PCM 바이트를 변환하지 않습니다.
- 컴파일 최적화: 빈 페이지 검색 생략, 활성 행 검색 범위 축소, 매크로 색인·복사와 청크 저장 개선. 최소 512KiB 매퍼 조건은 유지합니다.
- 리듬 수정: `#OPNA1RhythmMute`가 음악 DATA를 비우던 결함과 MUCPLAY/MUCEDIT 세션의 마스크 복원을 수정했습니다. 영향 받은 MUB는 원본에서 다시 컴파일하세요.
- MUCVOICE v0.5beta: Screen 2 FM·SCC/SCC+ 음색 편집, DAT/TFI/MUC/VGM 입출력, 기본 프리셋과 건반 미리 듣기를 제공합니다. 10-16 배포에서는 기존 네 도구와 같은 툴체인 ZIP에 포함되었으며, 2026-11 버전에서 제거되어 MUCPlayground로 대체되었습니다.

## 기존 기능

v0.81-beta는 일반 다중 페이지, 120KiB 음악 DATA, FM3 독립 슬롯, 확장 매크로·분기·vm3 생략, 리듬 자동 팬, MIDI식/ADPCM 포르타멘토와 음정 LFO를 포함합니다. MSX-MUSIC·내부 PSG·msPb0100, 연주 CPU 자동 가속과 `/N`도 포함합니다.

## CPU 가속 사용법

MUBPLAY는 지원 하드웨어에서 **연주 중에** 자동 가속합니다. 2026-11-20부터 MUCPLAY는 적재·컴파일을 포함해 실행하는 동안 내내, MUC2MUB는 시작부터 종료까지, MUCEDIT은 편집하는 동안 자동 가속합니다. 지원 Panasonic MSX2+는 5.37MHz Z80, turbo R은 Z80에서 들어온 경우 R800 ROM을 선택합니다. 이미 사용 중인 R800 모드는 유지하며 정상 종료·사용자 중단·처리 가능한 오류 후에는 원래 CPU 모드로 돌아갑니다.

```dos
MUCPLAY SONG.MUC /N
MUCPLAY /PLAY /N
MUBPLAY SONG.MUB /N
```

`/N`(MUCPLAY·MUBPLAY)은 자동 전환을 끄고 현재 CPU 모드를 유지합니다. R800을 Z80으로 강제 바꾸는 옵션은 아닙니다. MUC2MUB와 MUCEDIT에는 끄는 옵션이 없습니다. 이미 빠른 상태(`TURBO`를 먼저 실행했거나 R800으로 부팅)에서는 아무것도 바꾸지 않고, 종료할 때도 그대로 둡니다.

## 용량과 호환성

MUC 입력은 65,536바이트, MUCEDIT는 정규화 후 60,000바이트, 음악 DATA는 구조·음색을 포함해 98,304바이트입니다. 페이지 스트림은 OPNA 59,546바이트, 네이티브 MSX 59,106바이트입니다. MUB 헤더·태그·PCM은 별도입니다.

512KiB는 모든 최대 크기 문서와 세션의 동시 유지 보장이 아닙니다. 큰 세션 때문에 새 문서 적재에 필요한 여유가 부족하면 작업을 저장하고 세션을 해제하거나 정상 종료하세요. 여러 페이지는 물리 채널을 공유합니다. 중첩 파트 분기, 추가 OPNA/OPNB/OPM, `@M`, `PCn`, `#@pcm`의 WAV 변환은 미지원입니다.

SCC/PSG/YM2413는 근사 변환이며 PC 가상 SSG나 YM2608과 음향적으로 동일하지 않습니다. CPU 가속도 모든 고부하 곡의 틱 처리 시간을 보장하지 않습니다.

## English

Fixed repeat-ending ties/length extensions that could overwrite music DATA, corrected 255-clock note splitting, and added trailing brace-portamento lengths, dots and `%clocks`. Recompile affected MUBs from their original MUC files.

New since v0.81: SCC/SCC+ SSG/msPb0101, PCMInvert, compiler optimizations, rhythm-mute/session fixes and MUCVOICE v0.5beta. MUCVOICE was included with the four original tools in the 10-16 toolchain ZIP and has been removed in the 2026-11 version in favour of MUCPlayground; complete multilingual manuals are in the separate documentation ZIP. Native MSX targets and playback CPU acceleration were already included in v0.81. Recompile affected rhythm-mute MUBs; replacing a player cannot recover missing DATA.

Automatic acceleration covers playback in MUBPLAY and, since 2026-11-20, the whole run of MUCPLAY (loading and compiling included), MUC2MUB from start to exit, and MUCEDIT while editing. `/N` (MUCPLAY, MUBPLAY) keeps the current CPU; it does not force Z80. A machine that is already fast is left as it is. Editor/source/DATA limits are 60,000 / 65,536 / 98,304 bytes. 512KiB does not guarantee every simultaneous maximum-size session. Read the [update guide](RELEASE_UPDATE_261013.en.md) for compatibility and safe replacement.

## 日本語

反復後のタイ・音長延長による音楽DATAの上書きと255クロックの分割を修正しました。波括弧後のポルタメント音長・付点・`%クロック`指定にも対応します。影響を受けたMUBは元のMUCから再コンパイルしてください。

v0.81後の追加はSCC/SCC+ SSG/msPb0101、PCMInvert、コンパイル最適化、リズム/セッション修正、MUCVOICE v0.5betaです。MUCVOICEは10-16配布では従来の4ツールと同じツールチェーンZIPに含まれていましたが、2026-11版で削除し、MUCPlaygroundに置き換えました。完全な多言語マニュアルは別の文書ZIPに収録されています。MSX対象・演奏CPU高速化はv0.81にも収録済みです。影響を受けた旧MUBは再コンパイルしてください。

自動高速化はMUBPLAYでは演奏中、2026-11-20からMUCPLAYでは読み込み・コンパイルを含む実行中ずっと、MUC2MUBでは起動から終了まで、MUCEDITでは編集中に働きます。`/N`(MUCPLAY・MUBPLAY)は現在CPUを維持します。すでに高速な状態の機械はそのままにします。編集60,000・入力65,536・音楽DATA98,304バイトが上限です。512KiBは最大サイズの同時保持保証ではありません。[更新ガイド](RELEASE_UPDATE_261013.ja.md)で互換性・交換手順を確認してください。
