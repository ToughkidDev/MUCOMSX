# MUCOMSX 변경 내역

2026-10-13 업데이트 안내(기록): [한국어](RELEASE_UPDATE_261013.md) · [English](RELEASE_UPDATE_261013.en.md) · [日本語](RELEASE_UPDATE_261013.ja.md)

## 2026-11 업데이트 (v1.0-Stable, 2026-10-16 배포 이후)

- MUCVOICE 제거: 툴체인 ZIP은 MUCEDIT·MUCPLAY·MUC2MUB·MUBPLAY 네 도구만 담습니다. FM 음색, SCC/SCC+ 파형, ADPCM PCM 뱅크 편집은 [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)가 맡습니다(FM·SCC·PCM 뱅크 읽기·저장, FM 음색·SCC 파형·PCM 편집기). 기본 데이터 FMVOICE.DAT·SCCVOICE.DAT·INIT.TFI는 그대로 들어 있습니다. 순서와 화면은 문서 ZIP의 MUCPlayground 편집 가이드(`shared/docs/MUCPLAYGROUND.md`)와 [공식 사용 설명서](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=ko#banks)를 보세요.
- 실행 파일 구성: MUC2MUB·MUCPLAY·MUBPLAY는 같은 빌드의 COM과 MXR을 함께 설치합니다. MXR은 현재 폴더, 프로그램 폴더, `PATH` 순서로 찾습니다.
- MUBPLAY·MUCPLAY의 VGM 출력(`/V`)을 없앴습니다(2026-10-30). `/V`는 무시합니다.
- One Chip MSX: 네 도구가 카트리지 슬롯 3.58MHz, CPU 8.06MHz로 실행하고 종료 때 되돌립니다.
- 메모리: 내장·외장 매퍼 중 빈 메모리가 더 많은 매퍼를 골라 씁니다.
- MSX2 이상과 turbo R에서는 연주 전에 곡의 앞부분을 미리 계산해 두고 연주합니다.
- 네이티브 MSX 악보(msPb0103~0109)도 `/L<n>`으로 정해진 횟수 뒤에 끝납니다. 반복은 채널마다 셉니다.
- MUBPLAY: PCM이 내장되지 않은 MUB는 `#pcm` 태그의 파일을 MUB와 같은 폴더에서 읽습니다. 파일이 없으면 ADPCM만 무음입니다.
- MUCPLAY·MUCEDIT·MUC2MUB: `#pcm`에 적힌 파일이 없으면 컴파일하지 않고 오류 19를 냅니다. `#pcm`이 없고 `MUCOMPCM.BIN`도 없는 곡은 경고 뒤 ADPCM 없이 연주합니다.
- PCM이 없는 곡에서 앞 곡의 PCM이 울리던 문제, OPNA `!`에서 채널 끝 표시가 빠지던 문제, `#sccvoice`와 제목·OPNA 파트가 함께 있는 곡의 컴파일이 끝나지 않던 문제, turbo R에서 MUCPLAY가 일부 msPb0102 곡을 시작하지 못하던 문제를 고쳤습니다.
- OPNA 문법 OPLL 파트의 첫 음이 늦게 들리던 문제, SSG·SCC 타이 음에서 LFO가 다시 시작되던 문제를 고쳤습니다.
- SCC 파형(`#sccvoice` 파일·인라인 파형)을 쓰는 일부 곡이 메모리가 있는데도 "Mapper unavailable" 오류로 실패하거나 컴파일이 끝나지 않던 문제를 고쳤습니다(예: `MSX_All_Chips`, City pop demo, ARG011).
- 컴파일 중 Ctrl-STOP을 눌러도 정상 프롬프트나 MUCEDIT로 돌아옵니다. MUCEDIT에서 Ç·ü·é 같은 문자와 CP932 문자를 입력할 수 있고, `MEDSAVE.BAK`·`MEDSAVE.$$$`가 남아 있으면 이름을 바꾸라고 알려 줍니다. 줄바꿈 없이 1,023바이트를 넘는 줄은 code 17, `#pcm`의 빈 값은 경고로 처리합니다.
- 복귀 명령으로 되도는 네이티브 곡(예: GOFER MUS0042)도 `/L<n>` 뒤에 끝납니다.

### 알려진 제한

- MSX 칩 확장 문법(`SCCA`~`SCCE`·`MSXx`·`PSGS` 행, `?` 명령)을 쓰는 MUC는 원본을 입력 창 하나로 읽습니다. 실측 한도는 주석을 포함해 약 14,900바이트이고, 넘으면 원인과 다른 code 9 "Command not valid for this channel"이 납니다. 주석을 줄이세요.
- 매크로 호출 중첩은 8단까지입니다(넘으면 code 16).
- 3.58MHz Z80에서 아주 무거운 곡(예: Gradius III의 Aqua Illusion, Boss 4)은 재생이 늦어질 수 있습니다. Panasonic 고속 Z80이나 turbo R을 권합니다.
- turbo R에서 긴 곡은 시간축이 약 0.35% 늦게 누적됩니다(원인 조사 중).
- MUCPLAY에 경로를 붙인 MUC 인자(`MUCPLAY C:\SONGS\SONG.MUC`)는 실패할 수 있습니다. 곡 폴더로 이동해 실행하세요.

### English

- MUCVOICE removed: the toolchain ZIP contains only the four tools MUCEDIT, MUCPLAY, MUC2MUB and MUBPLAY. Edit FM voices, SCC/SCC+ waves and ADPCM PCM banks in [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) (FM/SCC/PCM banks that read and save the files, plus FM voice, SCC wave and PCM editors). The starter data FMVOICE.DAT, SCCVOICE.DAT and INIT.TFI are still included. See the MUCPlayground editing guide (`shared/docs/MUCPLAYGROUND.en.md` in the documentation ZIP) and the [official user's guide](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=en#banks).
- Package: install each COM with the MXR of the same build for MUC2MUB, MUCPLAY and MUBPLAY. The MXR is looked up in the current folder, the program folder, then `PATH`.
- VGM output (`/V`) was removed from MUBPLAY and MUCPLAY (2026-10-30); `/V` is ignored.
- One Chip MSX: all four tools run with the cartridge slots at 3.58 MHz and the CPU at 8.06 MHz, restored at exit.
- Memory: the mapper (internal or external) with more free memory is used.
- On MSX2 or later and turbo R, the start of the song is computed ahead before playback.
- Native MSX scores (msPb0103–0109) now end after `/L<n>` passes; repeats are counted per channel.
- MUBPLAY: a MUB without embedded PCM loads the file named by its `#pcm` tag from the MUB's folder; without it only the ADPCM part is silent.
- MUCPLAY/MUCEDIT/MUC2MUB: a missing `#pcm` file stops compilation with error 19; a song without `#pcm` and without `MUCOMPCM.BIN` plays without ADPCM after a warning.
- Fixed: a PCM-less song playing the previous song's PCM; the missing channel end after OPNA `!`; compilation never finishing for songs with `#sccvoice`, a title and OPNA parts; MUCPLAY failing to start some msPb0102 songs on turbo R; the late first note of OPLL parts written in OPNA syntax; LFO restarting on tied SSG/SCC notes.
- Fixed songs that use SCC waves (a `#sccvoice` file or inline waves) failing with "Mapper unavailable" although memory was free, or never finishing compilation (for example `MSX_All_Chips`, the City pop demo, ARG011).
- Ctrl-STOP during compilation now returns to the prompt or to MUCEDIT. MUCEDIT accepts characters such as Ç, ü, é and CP932 text, and asks you to rename a leftover `MEDSAVE.BAK` or `MEDSAVE.$$$`. A line longer than 1,023 bytes without a line break gives code 17; an empty `#pcm` value is a warning.
- Native songs that loop through a return command (for example GOFER MUS0042) also end after `/L<n>`.

### Known limits

- A MUC that uses the MSX chip extension syntax (`SCCA`–`SCCE`, `MSXx`, `PSGS` rows, `?` commands) is read in one input window. The measured limit is about 14,900 bytes including comments; a larger source fails with code 9 "Command not valid for this channel", which does not name the cause. Shorten the comments.
- Macro calls nest at most 8 deep (deeper gives code 16).
- On a 3.58 MHz Z80, very heavy songs (for example Gradius III's Aqua Illusion and Boss 4) can fall behind. A Panasonic fast Z80 or a turbo R is recommended.
- On turbo R, long songs drift about 0.35% late (under investigation).
- A MUC argument with a path (`MUCPLAY C:\SONGS\SONG.MUC`) can fail. Change to the song's folder first.

### 日本語

- MUCVOICE削除：ツールチェーンZIPはMUCEDIT・MUCPLAY・MUC2MUB・MUBPLAYの4ツールのみです。FM音色、SCC/SCC+波形、ADPCMのPCMバンクの編集は[MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)で行います（FM・SCC・PCMバンクの読み込み・保存、FM音色・SCC波形・PCMエディター）。初期データFMVOICE.DAT・SCCVOICE.DAT・INIT.TFIは引き続き同梱します。手順と画面は文書ZIPのMUCPlayground編集ガイド（`shared/docs/MUCPLAYGROUND.ja.md`）と[公式ユーザーガイド](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=ja#banks)を参照してください。
- 構成：MUC2MUB・MUCPLAY・MUBPLAYは同じビルドのCOMとMXRを一緒に置きます。MXRは現在のフォルダー、プログラムのフォルダー、`PATH`の順に探します。
- MUBPLAY・MUCPLAYのVGM出力（`/V`）を削除しました（2026-10-30）。`/V`は無視します。
- One Chip MSX：4ツールともカートリッジスロット3.58MHz、CPU 8.06MHzで動作し、終了時に戻します。
- メモリー：内蔵・外付けマッパーのうち空きメモリーの多い方を使います。
- MSX2以降とturbo Rでは、演奏前に曲の冒頭を先に計算してから演奏します。
- ネイティブMSX楽譜（msPb0103〜0109）も`/L<n>`の回数で終わります。繰り返しはチャンネルごとに数えます。
- MUBPLAY：PCMを内蔵しないMUBは、`#pcm`タグのファイルをMUBと同じフォルダーから読みます。ファイルがなければADPCMだけ無音です。
- MUCPLAY・MUCEDIT・MUC2MUB：`#pcm`のファイルがないとコンパイルせずエラー19を出します。`#pcm`がなく`MUCOMPCM.BIN`もない曲は警告のあとADPCMなしで演奏します。
- 修正：PCMのない曲で前の曲のPCMが鳴る問題、OPNAの`!`でチャンネル終端が抜ける問題、`#sccvoice`とタイトル・OPNAパートを含む曲のコンパイルが終わらない問題、turbo RでMUCPLAYが一部のmsPb0102曲を開始できない問題、OPNA文法のOPLLパートの最初の音が遅れる問題、SSG・SCCのタイでLFOがやり直される問題。
- SCC波形（`#sccvoice`ファイル・インライン波形）を使う一部の曲が、メモリに空きがあるのに"Mapper unavailable"で失敗したり、コンパイルが終わらなかったりする問題を修正しました（例: `MSX_All_Chips`、City pop demo、ARG011）。
- コンパイル中にCtrl-STOPを押しても、プロンプトやMUCEDITへ正常に戻ります。MUCEDITでÇ・ü・éなどの文字とCP932文字を入力でき、`MEDSAVE.BAK`・`MEDSAVE.$$$`が残っていると名前の変更を促します。改行なしで1,023バイトを超える行はcode 17、`#pcm`の空の値は警告になります。
- 戻り命令で繰り返すネイティブ曲（例: GOFER MUS0042）も`/L<n>`のあとに終わります。

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

MUCPLAY·MUBPLAY는 지원 하드웨어에서 **연주 중에만** 자동 가속합니다. 지원 Panasonic MSX2+는 5.37MHz Z80, turbo R은 Z80에서 들어온 경우 R800 ROM을 선택합니다. 이미 사용 중인 R800 모드는 유지하며 정상 종료·사용자 중단·처리 가능한 오류 후에는 원래 CPU 모드로 돌아갑니다.

```dos
MUCPLAY SONG.MUC /N
MUCPLAY /PLAY /N
MUBPLAY SONG.MUB /N
```

`/N`은 자동 전환을 끄고 현재 CPU 모드를 유지합니다. R800을 Z80으로 강제 바꾸는 옵션은 아닙니다. 적재·컴파일·VGM 출력은 자동 가속 대상이 아닙니다.

## 용량과 호환성

MUC 입력은 65,536바이트, MUCEDIT는 정규화 후 60,000바이트, 음악 DATA는 구조·음색을 포함해 98,304바이트입니다. 페이지 스트림은 OPNA 59,546바이트, 네이티브 MSX 59,106바이트입니다. MUB 헤더·태그·PCM은 별도입니다.

512KiB는 모든 최대 크기 문서와 세션의 동시 유지 보장이 아닙니다. 큰 세션 때문에 새 문서 적재에 필요한 여유가 부족하면 작업을 저장하고 세션을 해제하거나 정상 종료하세요. 여러 페이지는 물리 채널을 공유합니다. 중첩 파트 분기, 추가 OPNA/OPNB/OPM, `@M`, `PCn`, `#@pcm`의 WAV 변환은 미지원입니다.

SCC/PSG/YM2413는 근사 변환이며 PC 가상 SSG나 YM2608과 음향적으로 동일하지 않습니다. CPU 가속도 모든 고부하 곡의 틱 처리 시간을 보장하지 않습니다.

## English

Fixed repeat-ending ties/length extensions that could overwrite music DATA, corrected 255-clock note splitting, and added trailing brace-portamento lengths, dots and `%clocks`. Recompile affected MUBs from their original MUC files.

New since v0.81: SCC/SCC+ SSG/msPb0101, PCMInvert, compiler optimizations, rhythm-mute/session fixes and MUCVOICE v0.5beta. MUCVOICE was included with the four original tools in the 10-16 toolchain ZIP and has been removed in the 2026-11 version in favour of MUCPlayground; complete multilingual manuals are in the separate documentation ZIP. Native MSX targets and playback CPU acceleration were already included in v0.81. Recompile affected rhythm-mute MUBs; replacing a player cannot recover missing DATA.

Automatic acceleration is playback-only. `/N` keeps the current CPU; it does not force Z80. Editor/source/DATA limits are 60,000 / 65,536 / 98,304 bytes. 512KiB does not guarantee every simultaneous maximum-size session. Read the [update guide](RELEASE_UPDATE_261013.en.md) for compatibility and safe replacement.

## 日本語

反復後のタイ・音長延長による音楽DATAの上書きと255クロックの分割を修正しました。波括弧後のポルタメント音長・付点・`%クロック`指定にも対応します。影響を受けたMUBは元のMUCから再コンパイルしてください。

v0.81後の追加はSCC/SCC+ SSG/msPb0101、PCMInvert、コンパイル最適化、リズム/セッション修正、MUCVOICE v0.5betaです。MUCVOICEは10-16配布では従来の4ツールと同じツールチェーンZIPに含まれていましたが、2026-11版で削除し、MUCPlaygroundに置き換えました。完全な多言語マニュアルは別の文書ZIPに収録されています。MSX対象・演奏CPU高速化はv0.81にも収録済みです。影響を受けた旧MUBは再コンパイルしてください。

自動高速化は演奏中のみで、`/N`は現在CPUを維持します。編集60,000・入力65,536・音楽DATA98,304バイトが上限です。512KiBは最大サイズの同時保持保証ではありません。[更新ガイド](RELEASE_UPDATE_261013.ja.md)で互換性・交換手順を確認してください。
