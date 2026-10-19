# MUCPlayground

**Write MUCOM88 MML in the browser and hear it right away.** Written by ToughkidCST.
Open it at **https://toughkiddev.github.io/MUCOMSX/MUCPlayground/**

- **한국어:** 브라우저에서 MUC(MML)를 입력하고 바로 들어볼 수 있는 연습 공간입니다. 설치할 것이 없습니다.
- **日本語:** ブラウザでMUC（MML）を書いて、すぐに試聴できる練習用スペースです。インストールは不要です。

## What it does

- Type MML in the editor and press **Play** (`Ctrl+Enter`). `Esc` stops.
- **Text size:** the *Text* slider next to *Volume* sets the editor's font size (10–24 px); line numbers, colouring, error marks and playback highlights follow, and the size is remembered.
- **MML colouring:** parts (in their playback colour), notes, commands, numbers, loops and brackets, macros, tags and comments each have their own colour.
- **Suggestions while typing**, like a code editor: type a command letter, `@`, `*`, or `#` / a part letter at the start of a line and a list appears with each command's argument form and a one-line explanation (English, Korean or Japanese). Only commands that apply to the part's type (FM, SSG, rhythm, ADPCM) are offered; `@` also lists the voices defined in the song and `*` its macros. `Ctrl+Space` opens the list anywhere; `Tab` or `Enter` inserts, `Esc` closes. Typing notes never opens it. Command descriptions come from the MUCEdit manual (`mml-reference.js`).
- **Checked as you type:** shortly after you stop typing the song is compiled in the background, without interrupting playback, and errors and warnings are underlined and marked in the margin.
- **Detailed compiler messages.** Each error or warning shows its code (E0498, W0408 …), line, column and part, the source line with a `^` under the spot, the compiler's own words, and an explanation of **what it means**, **how to fix it** and, for a command, its **correct form**, in English, Korean or Japanese. When the compiler fails without saying where (a crash on `l0`, an unexpected character), the playground finds the line itself by recompiling shortened copies of the song. Click a message to jump to it.
- **While a song plays, the command each part is playing is highlighted in the editor**, one colour per part, in step with what you hear. The editor follows the playing part (pick which one under *Now playing*, or turn *Follow playback* off). MUCOMSX native `MSX…` parts are not highlighted: their data is repackaged on the way to the driver and loses its source positions.
- **Channel view, as in MDPlayer4Mac:** while a song plays, **▦ Channels** swaps the editor for MDPlayer4Mac's channel view: each chip's panel (YM2608, YM2610, YM2203, YM2151, YM2413, AY-3-8910 PSG, K051649 SCC/SCC+) with a keyboard per channel, note names, frequencies, level meters, pan, voice registers and, for the SCC, the wave tables, drawn with MDPlayer's own bitmaps. Panels are stacked FM → SSG/PSG → PCM, rows are grouped the MDPlayer4Mac way, the rhythm / ADPCM meters follow the emulator's real output, and **Size** goes back and forth, 75 → 100 % → *Fit* → 100 → 75 → 50 → 25 → 50 → 75 → 100 % → *Fit* …; *Fit* scales the panels, keeping their shape, to the largest size at which all of them fill the view, and follows the window as it is resized. Playing a `.mub` or `.vgm` switches to it by itself; playing a MUC afterwards returns to the editor. Stopping keeps the panels on screen. The view follows what you hear: the engine logs every chip write with its audio frame (for VGM files the page reads the writes from the file), and they are applied as that frame is played.
- **Split editor:** the **Split** buttons under the editor show the song twice, side by side or one above the other, to work on two places of a long MUC at once. Both views are live; typing in either changes both. While a song plays, the view you are working in stays where it is and the other one follows the playing part. Drag the bar between them to resize (double-click to even them); the choice is remembered.
- **Examples:** a short demo with inline FM voices, and **Samples…**, a browser for this repository's [`Samples`](../Samples) folder (search, grouped by folder; `.muc` opens in the editor, `.mub` / `.vgm` / `.vgz` play). The folder is read live from GitHub, so **a song committed to `Samples/` shows up straight away**, without rebuilding anything. Voice / PCM files the song names (for example `SNATCHEA.DAT`) are fetched from the same folder. The list is cached for 10 minutes (*Refresh* rereads it); if GitHub cannot be reached, for example after GitHub's limit of about 60 anonymous API requests an hour, the list built into the page (`samples.json`) is used instead.
- **Your own files:** open a `.muc`, attach `#voice` / `#pcm` files, or drop them on the page.
- **Play `.mub`, `.vgm` and `.vgz` files** with **Open…** or by dragging them from your computer onto the page. A dropped `.muc` opens in the editor and starts playing; voice / PCM files dropped with it are attached first. `.mub` plays on the editor's engine. `.vgm` / `.vgz` play on MDPlayer4Mac's own VGM player, which is downloaded the first time you play one (about 6.8 MB) and sounds sample-for-sample like the desktop app.
- **Save** as `.muc` (Shift-JIS with CR+LF, ready for the MSX), `.mub` or `.vgm`:
  - `.mub` is the playground compiler's output, the same as MDPlayer4Mac produces from that MUC. It is not byte-for-byte what MUC2MUB on the MSX writes, so check it on the machine before relying on it there.
  - `.vgm` (VGM 1.71) logs every chip write. A looping song is written as intro + one more pass, with the VGM loop point set so the loop is exactly one pass; songs are capped at 10 minutes. Played back in MDPlayer4Mac it matches the playground's own audio (correlation 1.0000 on the test songs).
- What you type is kept in your browser between visits. Nothing is uploaded anywhere.
- Plays YM2608 (FM, SSG, rhythm, ADPCM), the extended `muPb` layouts, and the MUCOMSX native MSX parts: MSX-MUSIC, PSG, SCC/SCC+.

## How it works

The sound engine is not a new implementation. It is **[MDPlayer4Mac](https://github.com/ToughkidDev/MDPlayer4Mac)'s** MUC path compiled to WebAssembly with .NET 8:

| Part | Source |
|---|---|
| MUC compiler | mucomDotNET compiler with MDPlayer4Mac's MUCOMSX changes |
| MUCOM88 driver | mucomDotNET driver with MDPlayer4Mac's MSX overlay |
| MSX parts | MDPlayer4Mac's `MsxMucCompiler`, `MsxSoundMapper` and related files |
| Chip emulation | MDSound (fmgen YM2608/YM2610/PSG, emu2413, K051649, YM2151) |

`src/Engine/MucEngine.cs` is the only new engine code: it wires those pieces together the
way MDPlayer4Mac's `MusicEngine` and `MucomDotNET` adapter do, without the desktop UI.
Rendered output is checked to be **sample-for-sample identical** to MDPlayer4Mac's
EngineSmokeTest for its 20 MSX regression songs and a Gradius sample, both natively and
in Chromium.

The page runs the engine in a Web Worker and streams audio to an AudioWorklet about one
second ahead. On a desktop browser it renders roughly 2.5–3× faster than real time; a
slow phone may stutter on dense songs.

## Files

| Path | What it is |
|---|---|
| `index.html`, `playground.js` | The page |
| `editor-assist.js`, `mml-reference.js` | Colouring, suggestions and the MML command reference |
| `diagnostics.js` | Explanations of compiler errors and warnings |
| `engine-worker.js` | Loads the engine and renders audio |
| `chview/` | The channel view: MDPlayer4Mac's chip visualizers ported to JavaScript (`ym2608.js` …), MDPlayer's drawing routines (`draw.js`), the view itself (`channel-view.js`) and MDPlayer's panel bitmaps |
| `pcm-worklet.js` | Plays the rendered audio |
| `engine/` | The built MUC engine (generated by `src/build.sh`) |
| `engine-vgm/` | The built VGM player, loaded on first use (generated by `src/build.sh`) |
| `demo.muc` | The default example |
| `samples.json` | Offline copy of the Samples list (used when GitHub is unreachable), generated from `../Samples` |
| `src/` | Engine glue (`Engine`), browser bindings (`Web`, `VgmWeb`), native check tool, build script |
| `LICENSES/` | License texts |

## Rebuilding the engine

```sh
dotnet workload install wasm-tools   # .NET 8 SDK
MUCPlayground/src/build.sh
```

`build.sh` checks out MDPlayer4Mac at the pinned commit, publishes `src/Web` and
`src/VgmWeb`, and copies only the files the browser loads into `engine/` (about 4.5 MB)
and `engine-vgm/` (about 6.8 MB). Run it again after
adding samples to refresh `samples.json`.

To compare against MDPlayer4Mac on the desktop:

```sh
dotnet run -c Release --project MUCPlayground/src/NativeCheck -p:Mdp4MacDir=<MDPlayer4Mac checkout> -- song.muc out.wav 60
```

## Credits and licenses

- **MUCOM88** © Yuzo Koshiro (古代祐三), CC BY-NC-SA 4.0 — `LICENSES/MUCOM88.txt`
- **mucomDotNET** by kuma4649, GPL-3.0
- **MDSound** by kuma4649, GPL-3.0; includes **fmgen** © cisc (`LICENSES/fmgen-readme.txt`, Shift-JIS, unmodified), **emu2413** by Mitsutaka Okazaki and MAME-derived cores (`LICENSES/MAME.txt`)
- **ymfm** tables used by the MSX playback code, BSD-3-Clause — `LICENSES/ymfm.txt`
- **MDPlayer / MDPlayer4Mac**, GPL-3.0 — `LICENSES/GPL-3.0.txt`. The channel view (`chview/`) is a port of MDPlayer4Mac's visualizers and MDPlayer's `DrawBuff`, and uses MDPlayer's panel and font bitmaps.

MUCPlayground's engine (`engine/` and `src/`) is distributed under GPL-3.0. Its
corresponding source is `src/` together with MDPlayer4Mac at the commit pinned in
`src/build.sh`. The YM2608 rhythm samples are the same `2608_*.WAV` files MDPlayer4Mac
ships.
