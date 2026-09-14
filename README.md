<div align="center">

<img src="html/Mucomsx_middle.png" alt="MUCOMSX" width="720">

# MUCOMSX

**MUCOM88 for MSX** — an MML music toolchain for the MAKOTO (YM2608) cartridge

Compose in MML · Compile on the MSX itself · Play on real hardware · Export MUB / VGM

[Tools](#-the-toolchain--구성-도구--ツール構成) ·
[Quick start](#-quick-start--빠른-시작--クイックスタート) ·
[Documentation](#-documentation--문서--ドキュメント) ·
[Downloads](#-downloads--다운로드--ダウンロード) ·
[Project site](https://toughkiddev.github.io/MUCOMSX/)

</div>

---

## 🌐 About / 프로젝트 소개 / 概要

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

## 🧰 The toolchain / 구성 도구 / ツール構成

Four programs cover the whole workflow. Each has its own manual in Korean, Japanese and English.

| Program | Role | Manual |
|---|---|---|
| **`MUCEDIT.COM`** | Full-screen MML **editor** for the MSX. 80-column, VS Code-style keys, block select, undo/redo, search. Calls MUCPLAY to compile, play and export without leaving the editor. | [KO](MUCEdit/MUCEdit.md) · [JA](MUCEdit/MUCEditJ.md) · [EN](MUCEdit/MUCEditE.md) |
| **`MUCPLAY.COM`** | **Compiler and player.** Compiles `.MUC` and plays it, or keeps a song resident in memory so you can recompile and replay without reloading. Exports `.MUB` and `.VGM`. | [KO](MUCPlay/MUCPlay.md) · [JA](MUCPlay/MUCPlayJ.md) · [EN](MUCPlay/MUCPlayE.md) |
| **`MUC2MUB.COM`** | **Batch compiler.** One command, one `.MUC` in, one `.MUB` out — no session, no playback, no sound hardware needed. Takes sources up to 64 KiB, returns a DOS exit code, and saves through a temporary file so a failure never destroys the previous `.MUB`. | [KO](MUC2MUB/Muc2Mub.md) · [JA](MUC2MUB/Muc2MubJ.md) · [EN](MUC2MUB/Muc2MubE.md) |
| **`MUBPLAY.COM`** | Standalone **player** for finished `.MUB` files. Repeat control, load testing, VGM export. | [KO](MUBPlay/MUBPlay.md) · [JA](MUBPlay/MUBPlayJ.md) · [EN](MUBPlay/MUBPlayE.md) |

MUCPLAY and MUC2MUB share the same compiler, so they accept the same MML and report the same error codes. Which one you reach for depends on what you want back.

| If you want to… | Use | Why |
|---|---|---|
| Write and revise a song, hearing each change | **MUCEDIT** (+ MUCPLAY) | Edit, compile and play without leaving the editor |
| Hear a `.MUC` once, right now | **MUCPLAY** | `MUCPLAY SONG.MUC` compiles and plays in one step |
| Iterate from the DOS prompt and export | **MUCPLAY** session | `/LOAD` → `/COMPILE` → `/PLAY` → `/MUB` `/VGM` |
| Convert a whole album unattended | **MUC2MUB** | One song per run, driven by a `.BAT`; exit codes to check |
| Compile a source too large for the editor | **MUC2MUB** | Accepts up to 64 KiB; the editor's buffer is 24 KiB |
| Compile on a machine with no Makoto | **MUC2MUB** | Compiling needs no sound device — only playback does |
| Just listen to a finished `.MUB` | **MUBPLAY** | No compiler involved |

### File formats

| Extension | What it is | How to play it |
|---|---|---|
| **`.MUC`** | MML source text. Human-readable and editable. | `MUCPLAY SONG.MUC` — compiles internally, then plays |
| **`.MUB`** | Compiled song data. Carries voices, tags and PCM as needed. | `MUBPLAY SONG.MUB` |
| **`.VGM`** | A log of chip commands and timing. Not an audio recording. | `VGMPLAY SONG.VGM`, in a YM2608-capable player |

> **Why MUB and not just VGM?** A VGM records every register write as it happens; a MUB stores the *score* and lets the player perform it. For the same song a MUB is dramatically smaller — which matters a great deal on a floppy or SD card, especially with PCM.

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

| | |
|---|---|
| **Machine** | MSX2 or later with an 80-column text screen (MSX2+ class recommended; turbo R considered) |
| **OS** | MSX-DOS 2, or Nextor providing the same functionality |
| **Memory** | Memory mapper RAM — **512 KB recommended** |
| **Sound** | **MAKOTO cartridge (YM2608)** — for playback. Compiling with MUC2MUB needs no sound device |
| **Storage** | A writable disk or storage device — compiling uses temporary files |

Reference configuration used for integration testing:

```text
Panasonic FS-A1WX
MegaFlashROM SCC+ SD
MAKOTO
MSX-DOS2 / Nextor
```

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

**Sizes are three separate limits, not one.** They are easy to conflate, and adding RAM raises none of them.

| Limit | Value | Applies to |
|---|---|---|
| Editing buffer | **24 KiB** | What MUCEDIT can hold open, after line endings are normalized |
| Source file | **64 KiB** | What MUC2MUB accepts as input — the whole file, comments included |
| Compiled song data | **32 KiB** | Notes, channel structure and the voice table together |
| Final `.MUB` | no fixed limit | Header + data + tags + PCM; routinely larger than the three above |

So a 40 KiB `.MUC` compiles fine with MUC2MUB but will not open in MUCEDIT, and a small source packed with notes can overflow the 32 KiB data area while a comment-heavy large one does not.

---

## 📚 Documentation / 문서 / ドキュメント

Every manual is available in all three languages.

| Tool | 한국어 | 日本語 | English |
|---|---|---|---|
| MUCEdit — editor | [MUCEdit.md](MUCEdit/MUCEdit.md) | [MUCEditJ.md](MUCEdit/MUCEditJ.md) | [MUCEditE.md](MUCEdit/MUCEditE.md) |
| MUCPlay — compiler & player | [MUCPlay.md](MUCPlay/MUCPlay.md) | [MUCPlayJ.md](MUCPlay/MUCPlayJ.md) | [MUCPlayE.md](MUCPlay/MUCPlayE.md) |
| MUC2MUB — batch compiler | [Muc2Mub.md](MUC2MUB/Muc2Mub.md) | [Muc2MubJ.md](MUC2MUB/Muc2MubJ.md) | [Muc2MubE.md](MUC2MUB/Muc2MubE.md) |
| MUBPlay — MUB player | [MUBPlay.md](MUBPlay/MUBPlay.md) | [MUBPlayJ.md](MUBPlay/MUBPlayJ.md) | [MUBPlayE.md](MUBPlay/MUBPlayE.md) |

**Where to start.** The MUCEdit manual is the broadest introduction — the editor, the MML syntax, every compile error code, the source warnings, and troubleshooting. The MUC2MUB manual goes deepest on the compiler itself: the full error and warning reference, filename and memory rules, the safe-save and recovery procedure, and how to compare a build byte-for-byte against an original `.MUB` using a `.MD5` companion file.

---

## 💿 Downloads / 다운로드 / ダウンロード

Builds of `MUCEDIT.COM`, `MUCPLAY.COM`, `MUC2MUB.COM` and `MUBPLAY.COM` are published on the repository's releases page.

### ➡️ [**Download from Releases**](https://github.com/ToughkidDev/MUCOMSX/releases)

Related, from the original PC-8801 project:

* **MUCOM88 for Windows** — [ONION software](https://onitama.tv/mucom88/), runs standalone, nothing else required
* **MUCOM88 / ALPHA-DOS / VoiceEditor / SDK** — see the [official MUCOM88 site](https://www.ancient.co.jp/~mucom88/)

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
* [**MUCOMSX on GitHub**](https://github.com/ToughkidDev/MUCOMSX)

<div align="center">

MUCOMSX by **ToughkidCST**, 2026 · Built on MUCOM88 by Yuzo Koshiro

</div>
