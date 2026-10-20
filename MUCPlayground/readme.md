# MUCPlayground

**Write MUCOM88 MML in the browser and hear it right away.** Written by ToughkidCST.
Open it at **https://toughkiddev.github.io/MUCOMSX/MUCPlayground/**

- **한국어:** 브라우저에서 MUC(MML)를 입력하고 바로 들어볼 수 있는 연습 공간입니다. 설치할 것이 없습니다.
- **日本語:** ブラウザでMUC（MML）を書いて、すぐに試聴できる練習用スペースです。インストールは不要です。

## What it does

- Type MML in the editor and press **Play** (`Ctrl+Enter`). `Esc` stops.
- **Text size:** the *Text* slider next to *Volume* sets the editor's font size (10–24 px); line numbers, colouring, error marks and playback highlights follow, and the size is remembered.
- **Menus size:** the *Menus* slider next to it enlarges the header, toolbar buttons, side panel (messages, files, quick reference), the editor's bottom bar, the footer and the samples dialog from 100 to 200 %, for anyone who finds the interface hard to read. It applies when the slider is let go, is remembered, and is limited on narrow windows so the panels still fit (100 % per 640 px of width: a phone stays at 100 %, 1280 px and wider allow 200 %).
- **MML colouring:** parts (in their playback colour), notes, commands, numbers, loops and brackets, macros, tags and comments each have their own colour.
- **Suggestions while typing**, like a code editor: type a command letter, `@`, `*`, or `#` / a part letter at the start of a line and a list appears with each command's argument form and a one-line explanation (English, Korean or Japanese). Only commands that apply to the part's type (FM, SSG, rhythm, ADPCM) are offered; `@` also lists the voices defined in the song and `*` its macros. `Ctrl+Space` opens the list anywhere; `Tab` or `Enter` inserts, `Esc` closes. Typing notes never opens it. Command descriptions come from the MUCEdit manual (`mml-reference.js`).
- **Checked as you type:** shortly after you stop typing the song is compiled in the background, without interrupting playback, and errors and warnings are underlined and marked in the margin.
- **Detailed compiler messages.** Each error or warning shows its code (E0498, W0408 …), line, column and part, the source line with a `^` under the spot, the compiler's own words, and an explanation of **what it means**, **how to fix it** and, for a command, its **correct form**, in English, Korean or Japanese. When the compiler fails without saying where (a crash on `l0`, an unexpected character), the playground finds the line itself by recompiling shortened copies of the song. Click a message to jump to it: its line is marked with a red (error) or yellow (warning) line until you edit the text. Voice warnings such as W0408 name only the voice number; the playground points them at the line that defines or first uses that voice.
- **While a song plays, the command each part is playing is highlighted in the editor**, one colour per part, in step with what you hear. The editor follows the playing part (pick which one under *Now playing*, or turn *Follow playback* off). MUCOMSX native `MSX…` parts are not highlighted: their data is repackaged on the way to the driver and loses its source positions.
- **Channel view, as in MDPlayer4Mac:** while a song plays, **▦ Channels** swaps the editor for MDPlayer4Mac's channel view: each chip's panel (YM2608, YM2610, YM2203, YM2151, YM2413, AY-3-8910 PSG, K051649 SCC/SCC+) with a keyboard per channel, note names, frequencies, level meters, pan, voice registers and, for the SCC, the wave tables, drawn with MDPlayer's own bitmaps. The chips the song uses are named at the top left in MDPlayer's note font (`YM2608`, `AY8910  YM2413  K052539`, the same chip twice as `YM2610 X2`). Panels are stacked FM → SSG/PSG → PCM, rows are grouped the MDPlayer4Mac way, the rhythm / ADPCM meters follow the emulator's real output, and **Size** opens at *Fit* each time the view is shown and goes back and forth, *Fit* → 100 → 75 → 50 → 25 → 50 → 75 → 100 % → *Fit* …; *Fit* scales the panels, keeping their shape, to the largest size at which all of them fill the view, and follows the window as it is resized. Playing a `.mub` or `.vgm` switches to it by itself; playing a MUC afterwards returns to the editor. Stopping keeps the panels on screen. The view follows what you hear: the engine logs every chip write with its audio frame (for VGM files the page reads the writes from the file), and they are applied as that frame is played.
- **Split editor:** the **Split** buttons under the editor show the song twice, side by side or one above the other, to work on two places of a long MUC at once. Both views are live; typing in either changes both. While a song plays, the view you are working in stays where it is and the other one follows the playing part. Drag the bar between them to resize (double-click to even them); the choice is remembered.
- **Examples:** a short demo with inline FM voices, and **Samples…**, a browser for this repository's [`Samples`](../Samples) folder (search, grouped by folder; `.muc` opens in the editor, `.mub` / `.vgm` / `.vgz` play). Its first groups are the [templates](../Samples/Muc/Templates): basics, one per sound chip, drum libraries, and genre songs with drums, bass and chords ready for your melody, commented in English and Japanese. The folder is read live from GitHub, so **a song committed to `Samples/` shows up straight away**, without rebuilding anything. Voice / PCM files the song names (for example `SNATCHEA.DAT`) are fetched from the same folder. The list is cached for 10 minutes (*Refresh* rereads it); if GitHub cannot be reached, for example after GitHub's limit of about 60 anonymous API requests an hour, the list built into the page (`samples.json`) is used instead.
- **New:** starts a song from the template (`template.muc`, the same as `Samples/Muc/Templates/2_Chips/OPNA_and_MSX_All.muc`, with comments in English and Japanese, also in the examples list as *Template (OPNA + MSX chips)*), an 8-bar song that uses OPNA and every MSX target of the latest msPb format together, with a comment on each part: OPNA FM (inline voices), OPNA rhythm, MSX-MUSIC (`MSXA`/`MSXB` and the `MSXG` drums), the MSX PSG (`MSXD`, with a software envelope) and the five SCC/SCC+ parts `SCCA`–`SCCE` (inline `@Wn:{…}` waves, envelopes, macros, repeats with `/`, the `L` loop). Attached files are removed. New asks first when the editor holds your own text; the template counts as yours from the first keystroke.
- **Your own files:** open a `.muc`, attach `#voice` / `#pcm` files, or drop them on the page. Your song is autosaved in the browser **together with its attached voice / PCM files** (IndexedDB), so after leaving and coming back it plays exactly as before. If a restored song names a file that was not kept (for example one saved by an older version of the page), it is fetched again from the song's Samples folder, or from `Samples/` when exactly one file there has that name.
- **Play `.mub`, `.vgm` and `.vgz` files** with **Open…** or by dragging them from your computer onto the page. A dropped `.muc` opens in the editor and starts playing; voice / PCM files dropped with it are attached first. `.mub` plays on the editor's engine. `.vgm` / `.vgz` play on MDPlayer4Mac's own VGM player, which is downloaded the first time you play one (about 20 MB, 7.3 MB compressed) and sounds sample-for-sample like the desktop app.
- **SCC wave preview:** with the caret on a wave definition, the wave is drawn under it: `@Wn:{…}` with 32 samples for `SCCA`–`SCCE`, or `@Wn` followed by rows of 64 samples for `#SSGExtend` (`$00`–`$FF` too), one or several lines, read the way MDPlayer4Mac reads them. It updates while you type, shows the number of samples and their range, and marks a wrong count, unreadable values or values outside -128..127 in red.
- **SCC wave editor:** the wave preview has an **✎ Edit** button that turns the editor area into a wave editor modelled on [Furnace](https://github.com/tildearrow/furnace)'s wavetable editor: draw the wave with the mouse or a finger (Steps or Lines view), or generate it on the *Shapes* tab (sine / triangle / saw / pulse with duty, exponent, XOR point and 16 harmonics with amplitude and phase) or the *FM* tab (four operators with level, multiplier, feedback, Furnace's 32 operator waveforms and a connection matrix), then reshape it with *WaveTools* (offset X / Y, smooth, amplify, normalize, invert, reverse, half, double, randomize, clear). The values can also be typed in decimal or hex, **▶ Listen** plays the wave as a held note (o2–o6), and undo / redo (Ctrl+Z / Ctrl+Y) cover every change. **Apply** writes the definition back into the song as one `@Wn:{…}` line (or `@Wn` and four rows for a 64-sample `#SSGExtend` wave, keeping a trailing comment), **Done** applies and returns to the text, **Cancel** returns without writing. Play while the editor is open applies first, so you hear what you drew.
- **FM voice preview:** with the caret on an inline FM voice (`  @n`, its `FB,ALG` line or one of the four operator lines), a panel under the voice shows the algorithm (operators, which ones are heard, OP1's feedback), the output wave and each operator's envelope (AR, D1R, D1L, D2R, RR, with TL added; key on for 1 s, then key off), in one colour per operator; the operator line the caret is on is drawn bold. It updates while you type and lists a wrong number of values or values out of range. The wave is computed the OPN way (phase modulation, TL in 0.75 dB steps, ML, feedback) at full envelope level without DT and KS, and the envelope times follow the OPN rate table roughly: a guide for editing, not an emulation.
- **FM voice editor:** the FM voice preview has an **✎ Edit** button too, which opens an OPNA voice editor modelled on [Furnace](https://github.com/tildearrow/furnace)'s FM instrument editor: the overview (algorithm, output wave, envelopes), the eight algorithms as pictures to pick from, OP1's feedback, and a card per operator with Furnace's controls in its order — AR, DR (D1R), SL (D1L), D2R, RR, TL, KS (Furnace's RS), MULT (ML), DT — as sliders with number boxes, its envelope drawn the way Furnace draws it, whether it is a carrier or a modulator, and a warning when a carrier's TL is not 0 (W0408). Operators can be copied and pasted, *Init* starts from Furnace's default FM voice, the five lines can also be typed, and undo / redo cover every change. **▶ Listen** plays one note (o1–o7) with an approximate render in the page (phase modulation, envelopes with key scaling; no DT or LFO); Play in the toolbar applies the voice first and plays the real chip. **Apply** / **Done** write the `FB,ALG` line and the four operator lines back, keeping their layout (`31,0,0,7` packed or `  31,  8,  3` padded), indents and comments.
- **Silent parts:** besides the compiler's messages, the page warns about a part that compiles but cannot make a sound: an SSG / PSG part (`D E F`, `MSXD`–`MSXF`) with no `@` or `E` (or hardware envelope `S`) before its first note, and an SSG, PSG, SCC or `MSXG` part with no `v` (MUCOM88 starts them silent). The warnings (PG01, PG02) mark the first note's line like any other warning.
- **Save** (or `Ctrl+S`) writes the song to your computer as `.muc` in Shift-JIS, for samples as well as your own songs. If the text holds characters Shift-JIS cannot (Korean, emoji …), the page lists them and asks first, because they would be saved as `?`; the buttons next to it save `.muc` (Shift-JIS with CR+LF, ready for the MSX), `.mub` or `.vgm`:
  - `.mub` is the playground compiler's output, the same as MDPlayer4Mac produces from that MUC. It is not byte-for-byte what MUC2MUB on the MSX writes, so check it on the machine before relying on it there.
  - `.vgm` (VGM 1.71) logs every chip write. A looping song is written as intro + one more pass, with the VGM loop point set so the loop is exactly one pass; songs are capped at 10 minutes. Played back in MDPlayer4Mac it matches the playground's own audio (correlation 1.0000 on the test songs).
- What you type is kept in your browser between visits. Nothing is uploaded anywhere.
- Plays YM2608 (FM, SSG, rhythm, ADPCM), the extended `muPb` layouts, and the MUCOMSX native MSX parts: MSX-MUSIC, PSG, SCC/SCC+, including the five dedicated SCC/SCC+ parts `SCCA`–`SCCE` of msPb0102 (MDPlayer4Mac v0.2.3) with inline `@Wn:{…}` waves and `#sccvoice` wave banks.

**iPhone / iPad:** sound starts with a tap (Play, or a tap anywhere when the page asks). The page registers as a media player, so it plays even with the ringer switch or iPad silent mode on (Safari 17's `navigator.audioSession`, or a silent looping track on older iOS). The engine needs iOS / iPadOS 16.4 or later (WebAssembly SIMD and exception handling).

## How it works

The sound engine is not a new implementation. It is **[MDPlayer4Mac](https://github.com/ToughkidDev/MDPlayer4Mac)'s** MUC path compiled ahead of time (AOT) to WebAssembly with .NET 8:

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
second ahead. The engine is AOT-compiled, which renders about 7× faster than .NET's
WebAssembly interpreter with sample-for-sample the same output. In headless Chromium on a
modest 4-core server it renders an OPNA song about 16× faster than real time and the
template, which runs OPNA and all the MSX chips at once, about 6× (the YM2413 emulation is
the heaviest chip); the interpreter managed 2.2× and 0.6×.

## Files

| Path | What it is |
|---|---|
| `index.html`, `playground.js` | The page |
| `editor-assist.js`, `mml-reference.js` | Colouring, suggestions and the MML command reference |
| `diagnostics.js` | Explanations of compiler errors and warnings |
| `wave-preview.js` | Reads SCC wave definitions and draws the preview |
| `wave-editor.js` | The SCC wave editor (drawing, Furnace-style generators and tools, listening) |
| `fm-preview.js` | Reads inline FM voices and draws the algorithm, wave and envelopes |
| `fm-editor.js` | The OPNA FM voice editor (Furnace-style operator controls, algorithm picker, listening) |
| `silence-check.js` | Finds parts that compile but cannot sound (warnings PG01, PG02) |
| `engine-worker.js` | Loads the engine and renders audio |
| `chview/` | The channel view: MDPlayer4Mac's chip visualizers ported to JavaScript (`ym2608.js` …), MDPlayer's drawing routines (`draw.js`), the view itself (`channel-view.js`) and MDPlayer's panel bitmaps |
| `pcm-worklet.js` | Plays the rendered audio |
| `engine/` | The built MUC engine (generated by `src/build.sh`) |
| `engine-vgm/` | The built VGM player, loaded on first use (generated by `src/build.sh`) |
| `demo.muc` | The default example |
| `template.muc` | What **New** opens: OPNA plus every MSX chip, commented |
| `samples.json` | Offline copy of the Samples list (used when GitHub is unreachable), generated from `../Samples` |
| `src/` | Engine glue (`Engine`), browser bindings (`Web`, `VgmWeb`), native check tool, build script |
| `LICENSES/` | License texts |

## Rebuilding the engine

```sh
dotnet workload install wasm-tools   # .NET 8 SDK
MUCPlayground/src/build.sh
```

`build.sh` checks out MDPlayer4Mac at the pinned commit, publishes `src/Web` and
`src/VgmWeb`, and copies only the files the browser loads into `engine/` (about 11 MB, 4.2 MB
compressed) and `engine-vgm/` (about 20 MB, 7.3 MB compressed); AOT compilation takes a
few minutes. Run it again after
adding samples to refresh `samples.json`.

To compare against MDPlayer4Mac on the desktop:

```sh
dotnet run -c Release --project MUCPlayground/src/NativeCheck -p:Mdp4MacDir=<MDPlayer4Mac checkout> -- song.muc out.wav 60
```

## Credits and licenses

- **MDPlayer4Mac** and **MUCOMSX** by ToughkidCST — the macOS player whose MUC path this engine is, and the MSX extensions it plays (MSX-MUSIC, PSG and SCC/SCC+ parts, the msPb formats); MUCPlayground is also written by ToughkidCST
- **MUCOM88** © Yuzo Koshiro (古代祐三), CC BY-NC-SA 4.0 — `LICENSES/MUCOM88.txt`
- **mucomDotNET** by kuma4649, GPL-3.0
- **MDSound** by kuma4649, GPL-3.0; includes **fmgen** © cisc (`LICENSES/fmgen-readme.txt`, Shift-JIS, unmodified), **emu2413** by Mitsutaka Okazaki and MAME-derived cores (`LICENSES/MAME.txt`)
- **Furnace** by tildearrow and contributors, GPL-2.0-or-later: the SCC wave editor follows its wavetable editor (`src/gui/waveEdit.cpp`), and its shape and FM generators, wave tools and operator waveforms (`src/gui/util.cpp`) are ported to JavaScript in `wave-editor.js`; the FM voice editor follows its FM instrument editor (`src/gui/insEdit/insTabFM.cpp`: operator controls, `drawFMEnv`, the default instrument) in `fm-editor.js` (read from ToughkidDEV's fork furnace4CSTPrivate)
- **ymfm** tables used by the MSX playback code, BSD-3-Clause — `LICENSES/ymfm.txt`
- **MDPlayer** by kuma4649 / **MDPlayer4Mac** by ToughkidCST, GPL-3.0 — `LICENSES/GPL-3.0.txt`. The channel view (`chview/`) is a port of MDPlayer4Mac's visualizers and MDPlayer's `DrawBuff`, and uses MDPlayer's panel and font bitmaps.

MUCPlayground's engine (`engine/` and `src/`) is distributed under GPL-3.0. Its
corresponding source is `src/` together with MDPlayer4Mac at the commit pinned in
`src/build.sh`. The YM2608 rhythm samples are the same `2608_*.WAV` files MDPlayer4Mac
ships.
