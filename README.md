<div align="center">

<img src="html/Mucomsx_middle.png" alt="MUCOMSX" width="720">

# MUCOMSX

**MUCOM88 for MSX** — an MML music toolchain for the MAKOTO (YM2608) cartridge

Compose in MML · Compile on the MSX itself · Play on real hardware · Export MUB / VGM

[**▶ MUCPlayground**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) ·
[News](#-update-news--업데이트-소식--更新情報) ·
[Demos](#-see-it-working--시연-영상--デモ動画) ·
[Tools](#-the-toolchain--구성-도구--ツール構成) ·
[Scope players](#-mucscope--mubscope--눈으로-보는-음악--音楽を目で楽しむ) ·
[Quick start](#-quick-start--빠른-시작--クイックスタート) ·
[Documentation](#-documentation--문서--ドキュメント) ·
[Wiki](https://github.com/ToughkidDev/MUCOMSX/wiki) ·
[Downloads](#-downloads--다운로드--ダウンロード) ·
[Issues](#-questions--issues--문의와-제보--質問と報告) ·
[Project site](https://toughkiddev.github.io/MUCOMSX/)

</div>

> ### ♪ [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) `NEW`
> **Write MUC (MML) in your browser and hear it right away — nothing to install.**
> 브라우저에서 MUC를 쓰고 바로 듣기 · ブラウザでMUCを書いてすぐに試聴
>
> FM · SSG · rhythm · ADPCM · MSX-MUSIC · PSG · SCC/SCC+ — MDPlayer4Mac channel view, .MUB / .VGM export ·
> **[Open MUCPlayground ▶](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)**

---

## 📰 Update News / 업데이트 소식 / 更新情報

| Date | | |
|---|---|---|
| **2026-10-27** | `WEB` | [MUCPlayground follows MDPlayer4Mac v0.2.6 and offers chip extension templates in New](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) **NEW** |
| 2026-10-27 | `WEB` | [MUCPlayground plays the MucoMSX chip extension commands (MDPlayer4Mac v0.2.5) and adds their manual](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) |
| 2026-10-19 | `WEB` | [MUCPlayground — write MUC in the browser and hear it right away](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) |
| 2026-10-15 | `RELEASE` | [MucoMSX v1.0-Stable released — SCC/SCC+ SSG extension, PCMInvert, rhythm/session fixes and MUCVOICE v0.5beta](https://github.com/ToughkidDev/MUCOMSX/releases/tag/v1.0-stable) |
| 2026-10-15 | `DOCS` | [Five-tool multilingual manuals and MUCVOICE v0.5beta](MUCVoice/mucvoice.en.md) |
| 2026-10-13 | `UPDATE` | [SCC/SSG, PCMInvert, performance fixes and MUCVOICE](shared/docs/RELEASE_UPDATE_261013.en.md) |

[All news →](NEWS.md)

---

## 🌐 About / 프로젝트 소개 / 概要

### Latest features / 최신 기능 / 最新機能

MUCOMSX supports **60,000-byte editing**, **64KiB MUC input**, **120KiB music DATA** and the **512KiB mapper minimum**. It adds SCC/SCC+ SSG/msPb0101, PCMInvert, compiler optimizations, rhythm-mute/session fixes and the MUCVOICE voice editor. Public **v0.81 / MucoMSX_261004.zip already includes native MSX targets and playback CPU acceleration with `/N`**.

- 한국어: [변경 사항과 안전한 교체](shared/docs/RELEASE_UPDATE_261013.md)
- English: [Changes and compatibility](shared/docs/RELEASE_UPDATE_261013.en.md)
- 日本語: [変更点・互換性](shared/docs/RELEASE_UPDATE_261013.ja.md)
- [MUCVOICE v0.5beta](MUCVoice/mucvoice.en.md): Screen 2 FM/SCC voice editing, presets and audition, included in the toolchain ZIP.
- Single-YM2608 mucomDotNET extensions: [한국어 확장 명령](MucomDotNetExtension/MUCOMDOTNET_EXTENSIONS.md) · [English extension guide](MucomDotNetExtension/MUCOMDOTNET_EXTENSIONS.en.md) · [日本語拡張ガイド](MucomDotNetExtension/MUCOMDOTNET_EXTENSIONS.ja.md) · [Usage limits / 사용 제한 / 使用制限](shared/docs/RELEASE_NOTES.md)

**MUCOMSX** brings **MUCOM88** — the FM music production toolchain Yuzo Koshiro (古代祐三) developed for the YM2203 and YM2608 (Sound Board II) of the NEC PC-8801mkIISR and later — to the MSX. It targets the **MAKOTO Cartridge**, the YM2608 cartridge released for MSX.

What makes MUCOMSX different from a port of the editor alone: **the whole cycle runs on the MSX.** You write MML, compile it, hear it, and export the result without ever leaving the machine. No cross-assembler on a PC, no shuttling files back and forth.

<table>
<tr>
<td width="33%" valign="top">

**한국어**

**MUCOMSX**는 코시로 유조(古代祐三)가 직접 개발한, NEC PC-8801mkⅡSR 이후에 탑재된 YM2203 및 YM2608(사운드 보드Ⅱ)을 대상으로 하는 악곡 제작용 툴인 **MUCOM88** 프로젝트를 MSX용으로 개발한 프로젝트입니다. MSX로 출시된 YM2608 카트리지인 **MAKOTO Cartridge**에 대응합니다.

편집·컴파일·연주·내보내기까지 전 과정을 MSX 실기에서 처리합니다. 동작은 실기 및 에뮬레이터 상을 상정하고 있습니다.

</td>
<td width="33%" valign="top">

**日本語**

**MUCOMSX**は、古代祐三が自ら開発した、NEC PC-8801mkⅡSR以降に搭載されたYM2203及びYM2608(サウンドボードⅡ)を対象とする楽曲制作用ツールである**MUCOM88**プロジェクトをMSX用に開発したプロジェクトです。MSX向けに発売されたYM2608カートリッジである**MAKOTO Cartridge**に対応しています。

編集・コンパイル・演奏・書き出しまでの全工程をMSX実機上で完結できます。動作は実機、及びエミュレータ上を想定しております。

</td>
<td width="33%" valign="top">

**English**

**MUCOMSX** is a project that brings the **MUCOM88** project — a music production tool originally developed by Yuzo Koshiro for the YM2203 and YM2608 (Sound Board II) chips on the NEC PC-8801mkIISR and later models — to the MSX platform. It supports the **MAKOTO Cartridge**, a YM2608 cartridge released for the MSX.

Editing, compiling, playback and export all run on the MSX itself. The tools are intended to run on real hardware or emulators.

</td>
</tr>
</table>

---

## 🎬 See it working / 시연 영상 / デモ動画

<table>
<tr>
<td width="50%" align="center">

[![MUCEdit demo](https://img.youtube.com/vi/Wq0RhtrQlBE/hqdefault.jpg)](https://www.youtube.com/watch?v=Wq0RhtrQlBE)

**[MUCEdit — editing and compiling on the MSX](https://www.youtube.com/watch?v=Wq0RhtrQlBE)**

MUCEdit 시연 · MUCEdit デモ

</td>
<td width="50%" align="center">

[![MUBPlay demo](https://img.youtube.com/vi/jpkDOpuv0Ig/hqdefault.jpg)](https://www.youtube.com/watch?v=jpkDOpuv0Ig)

**[MUBPlay — playing a finished MUB](https://www.youtube.com/watch?v=jpkDOpuv0Ig)**

MUBPlay 시연 · MUBPlay デモ

</td>
</tr>
</table>

---

## 🎧 Try it in your browser / 브라우저에서 바로 / ブラウザですぐに

**[MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)** is an editor where you type MUC (MML) and hear it at once — nothing to install. It runs MDPlayer4Mac's compiler and chip emulation in the browser: YM2608 FM, SSG, rhythm and ADPCM, plus MSX-MUSIC, PSG and SCC/SCC+. The editor colours MML, suggests commands as you type and checks the song while you write, can be split to show two places of a long song, shows every channel as its own oscilloscope with a level bar, and opens an MML guide (MUCOM88, the mucomDotNET extensions and the MucoMSX chip extension commands) beside the text; while a song plays, each part's current command lights up, or MDPlayer4Mac's channel view shows every chip channel. **New** starts from a commented template: OPNA and every MSX chip (MSX-MUSIC, PSG, the five SCC parts) together, or one written with the MucoMSX chip extension commands (all MSX chips, OPNA with MSX parts, SCC, PSG, MSX-MUSIC). Ready-made [templates](Samples/Muc/Templates) (basics, one per sound chip, drum libraries, genre songs waiting for a melody, a city pop demo on every chip; commented in English and Japanese) and every song in the samples folder are one click away, your song saves as `.MUC`, `.MUB` or `.VGM`, and **Share** makes a link that opens the song, voice and PCM files included, ready to play. Drag a `.MUC`, `.MUB`, `.VGM` or `.VGZ` from your computer onto it to play it.

### ➡️ [**Open MUCPlayground**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) · [How it works](MUCPlayground/readme.md)

<table>
<tr>
<td width="33%" valign="top">

**한국어**

MUC(MML)를 입력하고 바로 들어볼 수 있는 웹 에디터입니다. 설치할 것이 없습니다. 오류는 줄 번호와 함께 표시되고, 저장소의 샘플 곡을 그대로 불러와 고쳐 볼 수 있습니다.

</td>
<td width="33%" valign="top">

**日本語**

MUC（MML）を書いてすぐに試聴できるWebエディタです。インストールは不要です。エラーは行番号付きで表示され、リポジトリのサンプル曲をそのまま読み込んで編集できます。

</td>
<td width="33%" valign="top">

**English**

Errors are listed with their line numbers, and the repository's sample songs load straight into the editor. Save your song as a Shift-JIS `.MUC` to take it to the MSX.

</td>
</tr>
</table>

---

## 🧰 The toolchain / 구성 도구 / ツール構成

Five programs cover the whole workflow. Each has its own manual in Korean, Japanese and English.

| Program | Role | Manual |
|---|---|---|
| **`MUCEDIT.COM`** | Full-screen MML **editor** for the MSX. 80-column, VS Code-style keys, block select, undo/redo, search. Calls MUCPLAY to compile, play and export without leaving the editor. | [KO](MUCEdit/MUCEdit.md) · [JA](MUCEdit/MUCEditJ.md) · [EN](MUCEdit/MUCEditE.md) |
| **`MUCPLAY.COM`** | **Compiler and player.** Compiles `.MUC` and plays it, or keeps a song resident in memory so you can recompile and replay without reloading. Exports `.MUB` and `.VGM`. | [KO](MUCPlay/MUCPlay.md) · [JA](MUCPlay/MUCPlayJ.md) · [EN](MUCPlay/MUCPlayE.md) |
| **`MUC2MUB.COM`** | **Batch compiler.** One command, one `.MUC` in, one `.MUB` out — no session, no playback, no sound hardware needed. Takes sources up to 64 KiB, returns a DOS exit code, and saves through a temporary file so a failure never destroys the previous `.MUB`. | [KO](MUC2MUB/Muc2Mub.md) · [JA](MUC2MUB/Muc2MubJ.md) · [EN](MUC2MUB/Muc2MubE.md) |
| **`MUBPLAY.COM`** | Standalone **player** for finished `.MUB` files. Repeat control, load testing, VGM export. | [KO](MUBPlay/MUBPlay.md) · [JA](MUBPlay/MUBPlayJ.md) · [EN](MUBPlay/MUBPlayE.md) |
| **`MUCVOICE.COM` v0.5beta** (included) | Screen 2 **FM/SCC/SCC+ voice editor**. Presets, DAT/TFI/MUC/VGM import/export and keyboard audition; not PCM-bank construction. | [KO](MUCVoice/mucvoice.md) · [JA](MUCVoice/mucvoice.ja.md) · [EN](MUCVoice/mucvoice.en.md) |

MUCPLAY and MUC2MUB share the same compiler, so they accept the same MML and report the same error codes. Which one you reach for depends on what you want back.

| If you want to… | Use | Why |
|---|---|---|
| Write and revise a song, hearing each change | **MUCEDIT** (+ MUCPLAY) | Edit, compile and play without leaving the editor |
| Hear a `.MUC` once, right now | **MUCPLAY** | `MUCPLAY SONG.MUC` compiles and plays in one step |
| Iterate from the DOS prompt and export | **MUCPLAY** session | `/LOAD` → `/COMPILE` → `/PLAY` → `/MUB` `/VGM` |
| Convert a whole album unattended | **MUC2MUB** | One song per run, driven by a `.BAT`; exit codes to check |
| Compile a source too large for the editor | **MUC2MUB** | Accepts up to 65,536 bytes; the editor holds 60,000 normalized bytes |
| Compile on a machine with no Makoto | **MUC2MUB** | Compiling needs no sound device — only playback does |
| Just listen to a finished `.MUB` | **MUBPLAY** | No compiler involved |
| Edit FM or SCC/SCC+ voices and audition presets | **MUCVOICE** | Screen 2 voice editing, DAT/TFI/MUC/VGM import/export and keyboard audition |

### File formats

| Extension | What it is | How to play it |
|---|---|---|
| **`.MUC`** | MML source text. Human-readable and editable. | `MUCPLAY SONG.MUC` — compiles internally, then plays |
| **`.MUB`** | Compiled song data. Carries voices, tags and PCM as needed. | `MUBPLAY SONG.MUB` |
| **`.VGM`** | A log of chip commands and timing. Not an audio recording. | `VGMPLAY SONG.VGM`, in a YM2608-capable player |

> **Why MUB and not just VGM?** A VGM records every register write as it happens; a MUB stores the *score* and lets the player perform it. For the same song a MUB is dramatically smaller — which matters a great deal on a floppy or SD card, especially with PCM.

---

## 📺 MUCScope & MUBScope / 눈으로 보는 음악 / 音楽を目で楽しむ

Two graphical music players for MSX1 and later. Follow the notes, levels and SCC waveforms on a SCREEN 2 display while listening on real sound hardware.

<table>
<tr>
<td width="50%" valign="top">

### MUCScope

*MUC source → compile → visual playback*

Select a `.MUC` source and let the built-in compiler turn it into music on the MSX. Browse for another song while compiling; replay the current compiled song without compiling again. For listening to your MML collection, not editing it.

```text
MUCSCOPE SONG.MUC
```

[![MUCScope demo](https://img.youtube.com/vi/CJvW9Itukdw/hqdefault.jpg)](https://www.youtube.com/watch?v=CJvW9Itukdw)

**[MUCScope — compile and play a MUC with visuals](https://www.youtube.com/watch?v=CJvW9Itukdw)**

</td>
<td width="50%" valign="top">

### MUBScope

*Compiled MUB → visual playback*

Play finished `.MUB` files without compiling. Supports MUB8 and supported muPb/msPb songs, reading voices and embedded PCM from the MUB itself. A graphical way to browse and enjoy a compiled music collection.

```text
MUBSCOPE SONG.MUB
```

[![MUBScope demo](https://img.youtube.com/vi/Xk4awiKuZGc/hqdefault.jpg)](https://www.youtube.com/watch?v=Xk4awiKuZGc)

**[MUBScope — visual music player demo](https://www.youtube.com/watch?v=Xk4awiKuZGc)**

</td>
</tr>
</table>

See channel keyboards, note names, levels, chip pages and SCC waveforms. `Tab` switches between channel and spectrum views; `C` switches sound-chip pages. The spectrum is estimated from playback data, not an audio FFT. Browse drives and folders with `F`, select with the arrows and `Return`, and adjust master or sound-group volume with `V`. ONCE, LOOP and RANDOM modes, pause, fade-out and playback-speed controls make album listening easy. Choose from 40 channel-view skins, 40 spectrum skins and six toolbar styles (`Shift`+`F5` or `Ctrl`+`L`).

> **Scope player setup:** MSX1 or later, 16KB VRAM, MSX-DOS2/Nextor and a RAM mapper; 512KB or more is recommended. Install the separate Scope package with its matching COM/BIN modules and complete `SKINS` folder. These players are separate from the five-tool toolchain ZIP. Provide every chip the song uses: PSG, MSX-MUSIC/OPLL, OPNA such as MAKOTO, or SCC/SCC+. Heavy songs may slow down on a normal Z80. Supported Panasonic fast modes and Turbo R acceleration are automatic; `/N` disables them.

<details>
<summary>한국어 / 日本語</summary>

**한국어** — **MUCScope**: `.MUC` 소스를 선택하면 MSX에서 직접 컴파일한 뒤 시각화 화면과 함께 연주합니다. 컴파일 중에도 다음 곡을 탐색할 수 있고, 같은 곡을 다시 들을 때는 컴파일 결과를 재사용합니다. MML 편집은 MUCEDIT를 사용하세요. **MUBScope**: 완성된 `.MUB` 파일을 컴파일 없이 바로 연주합니다. MUB8과 지원 범위의 muPb/msPb 곡을 재생하며, 음색과 내장 PCM은 MUB에서 읽습니다.

채널별 건반·음이름·레벨과 칩별 화면, SCC 파형을 보여줍니다. `Tab`으로 채널/스펙트럼 화면을, `C`로 사운드 칩 화면을 전환합니다. 스펙트럼은 연주 데이터로 추정하며 실제 오디오 FFT 분석은 아닙니다. `F`로 드라이브와 폴더를 탐색하고 방향키와 `Return`으로 곡을 선택합니다. `V`로 전체·음원 그룹별 음량을 조절합니다. ONCE·LOOP·RANDOM, 일시정지, 페이드아웃과 재생 속도 조절을 지원합니다. 채널 화면 40종, 스펙트럼 화면 40종의 스킨과 툴바 6종을 제공합니다(`Shift`+`F5` 또는 `Ctrl`+`L`).

**설치 환경:** MSX1 이상, VRAM 16KB, MSX-DOS2/Nextor와 RAM 매퍼가 필요하며 512KB 이상을 권장합니다. 기존 5종 툴체인 ZIP과는 별도 패키지입니다. 같은 버전의 COM/BIN 모듈과 `SKINS` 폴더를 함께 설치하세요. 곡에서 사용하는 PSG·MSX-MUSIC/OPLL·MAKOTO 등의 OPNA·SCC/SCC+ 하드웨어가 필요합니다. 고부하 곡은 일반 Z80에서 느려질 수 있습니다. 지원 Panasonic 고속 모드와 Turbo R 가속은 자동 적용되며 `/N`으로 해제합니다.

**日本語** — **MUCScope**: `.MUC` ソースを選ぶと、MSX上でコンパイルして視覚表示とともに演奏します。コンパイル中も次の曲を探せます。同じ曲の再生にはコンパイル済みデータを再利用します。MMLの編集にはMUCEDITをお使いください。**MUBScope**: 完成した `.MUB` をコンパイルなしで演奏します。MUB8と対応範囲内のmuPb/msPb楽曲を再生し、音色と内蔵PCMはMUBから読み込みます。

チャンネル別の鍵盤・音名・レベル、音源別ページ、SCC波形を表示します。`Tab`でチャンネル／スペクトラム表示、`C`で音源ページを切り替えます。スペクトラムは演奏データからの推定で、音声のFFT解析ではありません。`F`でドライブやフォルダーを開き、方向キーと`Return`で選曲。`V`で全体・音源グループ別の音量を調整できます。ONCE・LOOP・RANDOM、一時停止、フェードアウト、再生速度の変更に対応します。チャンネル表示40種、スペクトラム表示40種のスキンと、6種類のツールバーを用意（`Shift`+`F5`または`Ctrl`+`L`）。

**動作環境：** MSX1以降、VRAM 16KB、MSX-DOS2/NextorとRAMマッパーが必要です。512KB以上を推奨します。既存の5ツール入りZIPとは別パッケージです。同じ版のCOM/BINモジュールと`SKINS`フォルダーをまとめて配置してください。曲が使用するPSG・MSX-MUSIC/OPLL・MAKOTOなどのOPNA・SCC/SCC+を用意してください。高負荷の曲は通常のZ80では遅くなる場合があります。対応Panasonic機の高速モードとTurbo Rの加速は自動で有効になり、`/N`で無効にできます。

</details>

---

## 🔁 How a song moves through the tools

There are two routes from source to song: an **interactive** one you work in, and a **batch** one you script.

```text
   ┌─────────────┐
   │  SONG.MUC   │   MML source — write it in MUCEDIT, or any text editor
   └──┬───────┬──┘
      │       │
      │       └──────────────────────────────┐
      │                                      │  MUC2MUB SONG.MUC
      │  MUCPLAY /LOAD → /COMPILE            │  (one shot, no session,
      │  (or F1→2 inside MUCEDIT)            │   no sound hardware)
      ▼                                      │
   ┌─────────────┐                           │
   │   session   │  compiled song, resident  │
   └──┬───┬───┬──┘  in mapper RAM            │
      │   │   │                              │
  /PLAY  /MUB  /VGM        (F1→3, F1→4, F1→5)│
      │   │   │                              │
      ▼   ▼   ▼                              ▼
   listen  SONG.MUB   SONG.VGM           SONG.MUB
              └────────────┬─────────────────┘
                           ▼
                  MUBPLAY SONG.MUB
```

The single most useful thing to understand about the interactive route: **saving, compiling and playing are three different actions.** Saving updates the `.MUC` on disk. Compiling turns what is *currently in memory* into playback data. Playing performs the most recent compile. Edit and press play without compiling in between, and you will hear the old version.

The batch route has no such state. MUC2MUB always reads the `.MUC` **as saved on disk** — so if the editor still holds unsaved changes, it will not see them.

---

## 🖥 Requirements / 동작 환경 / 動作環境

The table below describes the core toolchain environment. For the MSX1-compatible graphical players, see [MUCScope & MUBScope](#-mucscope--mubscope--눈으로-보는-음악--音楽を目で楽しむ) above.

| | |
|---|---|
| **Machine** | MSX2 or later with an 80-column text screen (MSX2+ class recommended; turbo R considered) |
| **OS** | MSX-DOS 2, or Nextor providing the same functionality |
| **Memory** | At least **512 KiB mapper RAM**, with enough free segments; not a guarantee that every large retained session fits |
| **Sound** | **MAKOTO cartridge (YM2608)** — for playback. Compiling with MUC2MUB needs no sound device |
| **Storage** | A writable disk or storage device — compiling uses temporary files |

> Installed RAM and *usable free* RAM are not the same thing — DOS, resident programs and any song session you are holding all consume memory. A build for **Neotron-B (YM2610B)** is in preparation and is a separate executable; do not mix it with the MAKOTO build.

---

## 🚀 Quick start / 빠른 시작 / クイックスタート

### Just listen to a song

```text
CD SONG
MUCPLAY SONG.MUC
```

Press any character key or `Esc` to stop.

### Edit, hear, repeat

```text
MUCEDIT SONG.MUC
```

Then, inside the editor: `F1` `2` to compile → read the result → `F1` `3` to play. Like what you hear? `Ctrl+S` to save. You do **not** have to save before compiling — MUCEDIT compiles the buffer in memory.

### Work from DOS and export

```text
MUCPLAY /LOAD SONG.MUC      ← read the source into memory
MUCPLAY /COMPILE            ← compile it (nothing is written to disk yet)
MUCPLAY /PLAY               ← listen
MUCPLAY /MUB SONG.MUB       ← export compiled song data
MUCPLAY /VGM SONG.VGM       ← export a chip-command log
MUCPLAY /RELEASE            ← free the session when you are done
```

Edited the `.MUC` in another editor? Run `/LOAD` again — `/COMPILE` alone recompiles the copy already in memory.

### Convert without playing — one song, or a whole album

```text
MUC2MUB SONG.MUC              ← writes SONG.MUB
MUC2MUB SONG.MUC TEST.MUB     ← or name the output yourself
```

For a whole album, let DOS drive it. Put this in `BUILD.BAT`:

```text
@ECHO OFF
MUC2MUB SONG01.MUC
MUC2MUB SONG02.MUC
MUC2MUB SONG03.MUC
```

MUC2MUB returns `0` on success and `1` on failure, so a shell can check each song. It does **not** stop the batch by itself when one song fails — and a `.MUB` left over from an earlier run will still be sitting there, so never count files to decide whether a batch succeeded.

---

## 🎹 MML at a glance

Channels are a single uppercase letter at the very start of the line, followed by a space or tab.

| Channel | Sound source |
|---|---|
| `A` `B` `C` | FM 1–3 |
| `D` `E` `F` | **SSG** 1–3 |
| `G` | Rhythm |
| `H` `I` `J` | FM 4–6 |
| `K` | ADPCM / PCM |

FM is **not** a continuous run from A to F — `D`, `E`, `F` are SSG, and FM continues at `H`.

```muc
#mucom88 1.7
#title First Steps
#composer ToughkidCST

D T120 C128 o4 l8 v10 q0 cdef gab>c4 r4
E C128 o3 l4 v8 c r g r c r g r
F C128 o2 l2 v7 c g c g
```

Case matters: `c` is a note but `C` sets the base clock; `t225` is a raw Timer-B value while `T120` is BPM. The editor manual covers the full syntax, error codes and warnings.

### Two gotchas worth knowing up front

**`/L` does not mean the same thing everywhere.**

| Command | `/L5` means |
|---|---|
| `MUCPLAY SONG.MUC /L5` | play 5 times |
| `MUCPLAY /VGM SONG.VGM /L5` | export **5 playthroughs** |
| `MUBPLAY SONG.MUB /L5` | play 5 times |
| `MUBPLAY SONG.MUB /V /L5` | export **5 seconds** |

**Source, editor, page and total DATA limits are separate.** These are the current extended-build limits; adding RAM does not automatically raise them.

| Limit | Value | Applies to |
|---|---|---|
| Editing buffer | **60,000 bytes** | MUCEDIT document after newline normalization; four 16 KiB banks |
| Source file | **65,536 bytes (64 KiB)** | MUC2MUB / MUCPLAY input, including comments, tags and line endings |
| One page stream | **59,546 bytes OPNA / 59,106 bytes native MSX** | Per-page limit, separate from the total DATA limit |
| Compiled music DATA | **122,880 bytes (120 KiB)** | Notes, structural data and FM voices together |
| Final `.MUB` | May exceed 120 KiB | Header + DATA + tags + PCM; format, loader and available-memory limits still apply |

A 40 KiB source is within the editor's size limit. A source within 64 KiB can still exceed a page or total DATA limit after macro expansion. Ordinary songs retain MUB8; OPNA extensions use muPb 0100, native MSX targets use msPb0100, and SCC/SCC+ SSG extension uses msPb0101. A–K each support pages 0–9, sharing one physical YM2608. A 512 KiB mapper is the minimum configuration, not a promise that every large song fits while other sessions remain resident.

---

## 📚 Documentation / 문서 / ドキュメント

Every manual is available in all three languages.

The new [extension guides (KO)](shared/docs/MUCOMDOTNET_EXTENSIONS.md), [EN](shared/docs/MUCOMDOTNET_EXTENSIONS.en.md), [JA](shared/docs/MUCOMDOTNET_EXTENSIONS.ja.md) cover FM3, pages, macros, volume, SSG envelopes, rhythm, MIDI-style portamento and ADPCM effects. [Usage limits](shared/docs/RELEASE_NOTES.md) identify the binaries and remaining memory/real-time limits.

| Tool | 한국어 | 日本語 | English |
|---|---|---|---|
| MUCEdit — editor | [MUCEdit.md](MUCEdit/MUCEdit.md) | [MUCEditJ.md](MUCEdit/MUCEditJ.md) | [MUCEditE.md](MUCEdit/MUCEditE.md) |
| MUCPlay — compiler & player | [MUCPlay.md](MUCPlay/MUCPlay.md) | [MUCPlayJ.md](MUCPlay/MUCPlayJ.md) | [MUCPlayE.md](MUCPlay/MUCPlayE.md) |
| MUC2MUB — batch compiler | [Muc2Mub.md](MUC2MUB/Muc2Mub.md) | [Muc2MubJ.md](MUC2MUB/Muc2MubJ.md) | [Muc2MubE.md](MUC2MUB/Muc2MubE.md) |
| MUBPlay — MUB player | [MUBPlay.md](MUBPlay/MUBPlay.md) | [MUBPlayJ.md](MUBPlay/MUBPlayJ.md) | [MUBPlayE.md](MUBPlay/MUBPlayE.md) |
| MUCVoice v0.5beta — voice editor | [mucvoice.md](MUCVoice/mucvoice.md) | [mucvoice.ja.md](MUCVoice/mucvoice.ja.md) | [mucvoice.en.md](MUCVoice/mucvoice.en.md) |

**Where to start.** The MUCEdit manual is the broadest introduction — the editor, MML syntax, compile errors, source warnings and troubleshooting. The MUC2MUB manual covers batch conversion, filename and memory rules, and safe saving and recovery. No MD5 calculation or verification is required or provided.

---

## 📖 Wiki — writing the music / 음악 만들기 / 音楽づくり

The manuals above describe **the tools**. The wiki describes **the music** — how
MUCOM88 MML is actually written, and how the voices, rhythm patterns and PCM banks
a song depends on are prepared. MUCVOICE edits FM and SCC/SCC+ voices on the MSX;
WAV conversion and PCM-bank construction remain PC tasks.

### ➡️ [**github.com/ToughkidDev/MUCOMSX/wiki**](https://github.com/ToughkidDev/MUCOMSX/wiki)

| Page | 한국어 | 日本語 | English |
|---|---|---|---|
| **Home** — what the wiki covers, and where to begin | [Home-ko](https://github.com/ToughkidDev/MUCOMSX/wiki/Home-ko) | [Home-ja](https://github.com/ToughkidDev/MUCOMSX/wiki/Home-ja) | [Home](https://github.com/ToughkidDev/MUCOMSX/wiki/Home) |
| **Workflow** — Windows → MSX, end to end | [Workflow-ko](https://github.com/ToughkidDev/MUCOMSX/wiki/Workflow-ko) | [Workflow-ja](https://github.com/ToughkidDev/MUCOMSX/wiki/Workflow-ja) | [Workflow](https://github.com/ToughkidDev/MUCOMSX/wiki/Workflow) |

See [mucomDotNET extensions](https://github.com/ToughkidDev/MUCOMSX/wiki/MucomDotNET-Extensions),
[limits and specs](https://github.com/ToughkidDev/MUCOMSX/wiki/Limits-and-Specs),
[native MSX targets](https://github.com/ToughkidDev/MUCOMSX/wiki/MSX-Targets),
[SSG extension](https://github.com/ToughkidDev/MUCOMSX/wiki/SSG-Extend) and
[MUCVOICE](https://github.com/ToughkidDev/MUCOMSX/wiki/MUCVOICE).

---

## 💿 Downloads / 다운로드 / ダウンロード

Find downloads on the repository's releases page. The current package layout is `MucoMSX_YYMMDD.zip` for the five tools, factory voices and quick help, and `MucoMSX_Docs_YYMMDD.zip` for complete Korean, English and Japanese documentation. Optional `.sha256` files let you check the downloads. Earlier releases may contain only the original four tools; check each release's contents.

### ➡️ [**Download from Releases**](https://github.com/ToughkidDev/MUCOMSX/releases)

Related, from the original PC-8801 project:

* **MUCOM88 for Windows** — [ONION software](https://onitama.tv/mucom88/), runs standalone, nothing else required
* **MUCOM88 / ALPHA-DOS / VoiceEditor / SDK** — see the [official MUCOM88 site](https://www.ancient.co.jp/~mucom88/)

---

## 💬 Questions & Issues / 문의와 제보 / 質問と報告

Found a bug, hit something the manuals don't cover, or have an idea for the tools?
Please open a ticket on the repository's issue tracker.

### ➡️ [**github.com/ToughkidDev/MUCOMSX/issues**](https://github.com/ToughkidDev/MUCOMSX/issues)

Search the existing issues first — someone may have hit the same thing. Korean,
Japanese and English are all welcome.

When reporting a playback or compile problem, these details narrow it down fastest:

| | |
|---|---|
| **Which tool and build** | `MUCEDIT.COM` / `MUCPLAY.COM` / `MUC2MUB.COM` / `MUBPLAY.COM` / `MUCVOICE.COM` / MUCScope / MUBScope, and its version or the date you obtained it |
| **Machine** | Real MSX model, or emulator + machine settings; CPU mode |
| **System** | MSX-DOS2 or Nextor version, memory mapper, cartridges, storage |
| **The exact command** | The full command line you typed |
| **The song** | Filename, and if possible the `.MUC` plus its voice and PCM files |
| **What happened** | The error or warning text in full, or the section where it sounds wrong — and what you expected instead |

For **MUCPlayground**, give the browser and operating system instead of the machine, system and command; the issue tracker has a form for it.

A small file that reproduces the problem is worth more than a long description.
If you can't share the music, a minimal example with nothing sensitive in it works
just as well. Each tool's manual has a fuller checklist in its troubleshooting
chapter.

<details>
<summary>한국어 / 日本語</summary>

**한국어** — 버그를 발견하셨거나, 설명서에 없는 상황을 만나셨거나, 개선 아이디어가 있으시면 저장소의 이슈 게시판에 남겨 주세요: [github.com/ToughkidDev/MUCOMSX/issues](https://github.com/ToughkidDev/MUCOMSX/issues). 먼저 기존 이슈를 검색해 보시면 같은 문제가 이미 올라와 있을 수 있습니다. 한국어·일본어·영어 모두 환영합니다. 재생이나 컴파일 문제를 알려주실 때는 위 표의 항목 — 사용한 툴과 빌드, 기종, 시스템 구성, 입력한 명령 전체, 곡 파일, 오류 문구와 기대한 결과 — 를 함께 적어 주시면 원인을 훨씬 빨리 좁힐 수 있습니다. 긴 설명보다 문제가 재현되는 작은 파일 하나가 더 도움이 됩니다.

**日本語** — バグを見つけた、説明書に載っていない状況に遭遇した、あるいは改善のアイデアがある場合は、リポジトリのIssueへお寄せください: [github.com/ToughkidDev/MUCOMSX/issues](https://github.com/ToughkidDev/MUCOMSX/issues)。まず既存のIssueを検索してみてください。同じ問題がすでに報告されているかもしれません。韓国語・日本語・英語のいずれでも歓迎します。再生やコンパイルの問題を報告される際は、上の表の項目 — 使用したツールとビルド、機種、システム構成、入力したコマンド全体、曲のファイル、エラーの文言と期待した結果 — を併せて記載いただけると、原因をはるかに早く絞り込めます。長い説明よりも、問題が再現する小さなファイルが1つあるほうが役に立ちます。

</details>

---

## ⚖️ License / 라이선스 / ライセンス

**MUCOM88** is a collective term for an FM sound driver and music production tools that run on ALPHA-DOS — License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
ALPHA-DOS is an operating system for the 8-bit NEC PC-8801 series — License: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).
It enables music written in MML to be played on the built-in FM sound source and Sound Board II.

<details>
<summary>한국어 / 日本語</summary>

**한국어** — **MUCOM88**은 ALPHA-DOS 상에서 동작하는 FM 음원 드라이버와 음악 제작 툴의 총칭입니다(License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)). (ALPHA-DOS는 8bit PC인 NEC PC-8801 시리즈 상에서 동작하는 운영체제입니다(License: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/))). MML로 작성된 악곡을 내장 FM 음원 및 사운드 보드 II 음원 상에서 연주할 수 있습니다.

**日本語** — **MUCOM88**は、ALPHA-DOS上で動作するFM音源ドライバーと音楽製作ツールの総称です(License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/))。(ALPHA-DOSは、8bitパソコン・NEC PC-8801シリーズ上で動作するオペレーティングシステムです(License: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)))。MML記述による楽曲を、内蔵FM音源、及びサウンドボードII音源上で演奏させることが可能です。

</details>

---

## 🔗 Links & Credits

* [**MUCOM88 (Copyright Yuzo Koshiro 2018)**](https://www.ancient.co.jp/~mucom88/) — the original project
* [**MUCOM88 Windows**](https://onitama.tv/mucom88/) — standalone Windows build 【ONION software】
* [**MUCOMSX project site**](https://toughkiddev.github.io/MUCOMSX/)
* [**MUCPlayground**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) — write MUC in the browser and hear it right away ([how it works](MUCPlayground/readme.md))
* [**MUCOMSX on GitHub**](https://github.com/ToughkidDev/MUCOMSX)
* [**Issue tracker**](https://github.com/ToughkidDev/MUCOMSX/issues) — questions, bug reports and ideas

<div align="center">

MUCOMSX by **ToughkidCST**, 2026 · Built on MUCOM88 by Yuzo Koshiro

</div>
