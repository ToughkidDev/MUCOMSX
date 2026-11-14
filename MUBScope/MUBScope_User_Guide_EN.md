# MUBScope Player User Guide

**Language:** [한국어](MUBScope_User_Guide_KO.md) · [English](MUBScope_User_Guide_EN.md) · [日本語](MUBScope_User_Guide_JA.md)

MUBScope plays compiled MUB music on the MSX with channel keyboards, levels, spectrum and SCC waveforms. This guide covers installation, keyboard operation, browsing and settings for the SCREEN 2 player.

## Contents

- [Requirements](#requirements)
- [Installation and startup](#installation-and-startup)
- [Keyboard controls](#keyboard-controls)
- [Normal Z80 mode](#normal-z80-mode)
- [File browser](#file-browser)
- [Playback modes and speed](#playback-modes-and-speed)
- [Display and skins](#display-and-skins)
- [Volume and song information](#volume-and-song-information)
- [Saved settings](#saved-settings)
- [Troubleshooting](#troubleshooting)

## Requirements

- MSX1 or later. The display uses SCREEN 2, 256×192 pixels and the fixed 16-color palette. It works with 16KB VRAM on MSX1.
- MSX-DOS2 or Nextor and a RAM mapper are required. A mapper with at least 512KB RAM is recommended. Available memory depends on DOS, resident programs and song size. When an internal and an external mapper are both present, the player uses the one with more free memory at startup. It does not combine the two, and on some configurations it uses only the mapper DOS runs in.
- Use an SD card, HDD or other storage device with room for the player and the complete skin folder.

The hardware must provide the sound chips required by the song. The filename extension alone does not identify those chips.

| Song uses | Required hardware | Display |
| --- | --- | --- |
| MSX PSG | Built-in MSX PSG | 3 PSG channels |
| MSX-MUSIC / OPLL | Built-in MSX-MUSIC or a compatible device such as FM-PAC | MML playback: 6 FM channels and 5 drums; raw register playback: up to 9 FM channels |
| OPNA / YM2608 | Supported OPNA device, such as MAKOTO | FM, SSG, rhythm and ADPCM |
| SCC / SCC+ | Supported SCC/SCC+ cartridge or expansion | 3 or up to 5 SCC channels and waveforms, depending on the song format |
| Multiple chips | All devices specified by the song | Chip-specific channels and display pages |

`msPb` songs also require their actual sound chips. An OPNA device alone cannot play a song that requires SCC.

Supported Panasonic machines automatically use their fast mode (Z80 at 5.37 MHz); Turbo-R machines use R800 mode. Add `/N` at startup to disable automatic CPU acceleration.

On a One Chip MSX (OCM), with or without `/N`, the player sets the cartridge slot clock to 3.58 MHz, raises the CPU to 8.06 MHz and runs with the same full screen as a Turbo-R. The original CPU speed and slot clock are restored at exit.

The screen layout depends on the CPU. Music playback always takes priority over the display.

| CPU | Screen | Display updates |
| --- | --- | --- |
| Turbo-R (R800), OCM at 8.06 MHz | Full screen: channel view, spectrum, chip pages, menus | 30 per second |
| Panasonic fast mode (Z80 at 5.37 MHz) | Full screen | 15 per second |
| Normal Z80 (3.58 MHz) or started with `/N` | File browser only | See [Normal Z80 mode](#normal-z80-mode) |

The display follows the fixed rate above. When the music is running behind, the display waits for the next frame so the music is served first; songs that keep the CPU behind get fewer display updates.

## Installation and startup

Extract the distribution ZIP. Keep these files in the same player directory and preserve the subdirectory structure of `SKINS`.

```text
MUBSCOPE.COM
MUBSCPB.BIN
MUBSCPD.BIN
MUBSCPU.BIN
MUBSCOPE.MXR
SKINS/
```

| File | Purpose |
| --- | --- |
| `MUBSCOPE.COM` | Player executable |
| `MUBSCPB.BIN` | File browser |
| `MUBSCPD.BIN` | Design and skin display |
| `MUBSCPU.BIN` | Toolbar and UI extension |
| `MUBSCOPE.MXR` | Native MSX score playback engine |

Use `MUBSCOPE.MXR` from the same build as the executable. Startup requires a matching module. Do not substitute an MXR file from another player or the toolchain.

Run the player from its directory, or put the player directory in `PATH` and start it from the directory that holds your songs. Wherever it starts, COM/BIN modules, the MXR, skins and `MUBSCOPE.CFG` are read from and written to the player directory; the file browser and relative song paths start from the directory you ran it in, and the player returns there at exit. Keep COM/BIN modules and skins from the same distribution together; replace the complete set when updating.

```text
MUBSCOPE
```

Select a song with the arrow keys and press `RETURN` to play it.

You can also specify a song at startup:

```text
MUBSCOPE SONG.MUB
MUBSCOPE SONG.MUB /L1
MUBSCOPE SONG.MUB /L0
MUBSCOPE SONG.MUB /N
```

| Option | Behavior |
| --- | --- |
| No option, or `/L1` | Start in ONCE mode |
| `/L0` | Start in LOOP mode |
| `/N` | Disable automatic CPU acceleration; may be combined with a playback-mode option |

When a song is given on the command line, loading progress appears on the DOS screen before the SCREEN 2 display opens: dots follow `Loading MUB` while the song data is read and `Loading PCM` while the PCM is read. One dot appears at the start and one more for each 8KB. When a song is opened from the browser, the title row shows the stage (`READ` for the song data, `PCM` for the ADPCM upload) and a progress bar. The bar restarts for each stage and shows the amount read, not the time left. It is not drawn while the information, mixer or full list screen is open.

A song that uses the same PCM as the previous song starts faster: the player checks that the PCM already in the OPNA matches and skips the upload.

The default is **ONCE**. MUB8 and supported muPb/msPb MUB files are playable. Use MUCScope for MUC sources. Voices come from the MUB itself. The PCM is chosen in this order:

1. PCM embedded in the MUB.
2. Otherwise, the file named by the MUB's `#pcm` tag, looked up in the MUB's directory and uploaded to the OPNA. MSX-DOS reads only the first 8 characters of a name, so for `#pcm schemepcm.bin` the file must be `SCHEMEPC.BIN`.
3. If that file is missing too, only the ADPCM part stays silent for that song; the other parts play normally. The previous song's PCM is never played instead.

On MSX2 or later with a MAKOTO, the player computes the start of the song ahead and fills one memory segment (16KB) before playback starts, so sound can take a moment to begin after you open a song; pressing a key during the fill starts playback at once. It keeps computing ahead while playing, so a short burst of display work does not delay the sound. If computing ahead cannot keep up, that song switches to direct output and keeps playing. Some native MSX scores use direct output from the start.

## Keyboard controls

The labels above the bottom toolbar appear in this order:

```text
F10  1  2  3  4  5  6  7  8  F  I  V  RETURN
```

| Key | Action |
| --- | --- |
| `F10` | Open the skin picker. On a real MSX, use `Shift+F5` or `Ctrl+L`. |
| `1` | Stop and retain the current song data for replay. |
| `2` | Previous song in the current browser directory. |
| `3` | Cycle 0.5× → 0.25× → normal speed. |
| `4` | Pause while playing; resume while paused; restart the current song while stopped. |
| `5` | Normal Z80: 2× → normal. Panasonic fast mode / R800: 2× → 4× → normal. |
| `6` | Next song in the current browser directory; choose randomly in RANDOM mode. |
| `7` | Cycle ONCE → LOOP → RANDOM. |
| `8` | Fade out, then stop. |
| `F` | Open or close the full file list. |
| `I` | Show the title, current file path, sound chips and keyboard help. |
| `V` | Open the master and sound-group volume mixer. |
| `RETURN` | Play the selected file or enter the selected directory. |
| `Tab` | Switch between channel view and spectrum on the playback screen. |
| `Shift+Tab` (or `C`) | Cycle chip pages used by the current song. |
| `Ctrl+Tab` | Cycle the six toolbar styles. |
| `Space` | Stop on the playback screen. |
| `Esc` | Close a list/info/mixer panel; exit the program from the playback screen. |

On a normal Z80, `F10`, `F`, `V`, `Tab`, `Shift+Tab` and `Ctrl+Tab` are not available; see [Normal Z80 mode](#normal-z80-mode).

The MSX key click is turned off during playback so that key sounds do not mix with the music. Your key-click setting is restored when the program exits.

`F`, `I`, `V`, `C` and `D` accept either case. Held keys do not auto-repeat; each press is entered once. List and page movement also move one line (one page) per press. Arrow keys repeat in the skin picker.

**F10 in openMSX:** load the supplied `openmsx-designs.tcl` at startup to bind the PC keyboard's `F10`, `Shift+F10`, `Ctrl+Tab` and `Shift+Tab`. If using album `.command`/TCL launchers, start through those launchers. If F10 does not work, send `Shift+F5` or `Ctrl+L` to the MSX.

The fixed lower monitor remains visible on every chip page: OPNA rhythm (BD, SD, CY, HH, TM, RM), OPLL rhythm (BD, SD, TM, CY, HH), and ADPCM-B level. The two rhythm chips have independent indicators; unused channels remain unlit. SCC waveforms appear above this monitor.

Each SCC waveform is 32 pixels wide, with one horizontal pixel for each of the 32 instrument samples, and is drawn compressed to six pixel rows. Channel names and gain values are on the row above. There is space between adjacent waveforms and between the waveforms and the rhythm monitor below. This is the instrument wavetable, not an audio waveform scaled by output volume. `GFF` means a gain value of FF (hexadecimal).

## Normal Z80 mode

On a normal Z80 (3.58 MHz), or when automatic acceleration is disabled with `/N`, the screen is reduced to the file browser so that as much CPU time as possible goes to the music.

- The top line shows the song title and status (PLAY, PAUSE or STOP, speed and playback mode); the rest of the screen is the file browser.
- Channel view, spectrum, chip pages, skin selection, the full file list and the volume mixer are not available. The `F10`, `F` and `V` toolbar icons are dimmed.
- No chip-state capture or drawing for the channel display runs during playback. The sound is the same as on the faster CPUs.

| Key | Action |
| --- | --- |
| `↑` `↓` `←` `→`, `RETURN`, `Backspace`, `+` `=` `-`, `D` | File browser |
| `1`–`8` | Stop, previous, slower, play/pause, faster, next, playback mode, fade-out |
| `Space` | Stop |
| `I` | Song information; `Esc`, `Tab` or `I` returns to the browser |
| `Esc` | Exit the program (from the browser) |
| `F10`, `F`, `V`, `Tab`, `Shift+Tab` (`C`), `Ctrl+Tab` | Not available |

The help text on the information screen still mentions `F10`, `F` and `Tab`, but those keys do not work on a normal Z80. Because the mixer is not available, volume always stays at the default (maximum).

When a song keeps the CPU almost fully busy with music, the information screen can take a while to appear. Some songs still exceed the capacity of a normal Z80 and play more slowly; play those in Panasonic fast mode or on a Turbo-R.

On a normal Z80, changing directory or drive pauses the music while the list is read and drawn, then playback continues from where it stopped. Larger directories pause longer (about 6 seconds for 60 songs). If you had paused the song yourself, it stays paused.

## File browser

The highlighted item and the currently playing song may differ. Moving the cursor does not change playback; pressing `RETURN` opens the selection.

| Key | Browser action |
| --- | --- |
| `↑` / `↓` | Move the selection |
| `RETURN` / `→` | Open a file or enter a directory |
| `Backspace` / `←` | Go to the parent directory |
| `+` or `=` | Next page |
| `-` | Previous page |
| `D` | Next available drive |
| `F` | Toggle the full file list |

Use MSX-DOS 8.3 filenames. The list shows the filename, title and size. If a title cannot be read, use the filename to identify the song. Long titles may be clipped to the display width. `~` and `$` in filenames and titles are displayed; characters the font does not contain (such as Japanese) appear as `?`.

Sizes are in **KB**, with 1KB = 1,024 bytes and partial kilobytes rounded up: 1,025 bytes is shown as `2KB`. Directories show `DIR`.

A MUB that contains PCM shows the song data and the PCM separately, for example `13KB+189KB`; each part is rounded up on its own. `MUB+PCM` at the right of the path row is the heading of this size column.

Copying long-named files to an SD card on a Mac or PC creates short names such as `KONAMI~1` or `09DUST~1.MUB`. MUBScope opens and plays folders and songs with such names normally.

Music continues while you browse directories. On a normal Z80 it pauses only while the directory changes (see [Normal Z80 mode](#normal-z80-mode)). Opening a new song stops the previous song before preparing the new one. Previous/next and automatic advancement use playable files in the current browser directory.

A directory list holds up to 192 entries, including the parent-directory entry. Split larger collections into album directories if some songs are missing from the list.

Press `Esc` or `Tab` in the full list, info or mixer to return to playback. Arrow keys in the info/mixer panel belong to that panel.

## Playback modes and speed

### ONCE, LOOP and RANDOM

| Mode | Behavior |
| --- | --- |
| ONCE | For a song with a loop, play the initial pass, then traverse the authored loop section once more and advance to the next song. A song without a loop plays once. Stop after the last song in the directory. |
| LOOP | Repeat the current song. |
| RANDOM | Select another song in the current directory at random. |

The extra ONCE traversal starts at the song's loop point, not at the beginning of the intro. It uses the already loaded song data. Pressing `7` updates both the mode label and the toolbar mode icon. LOOP also uses the already prepared song data.

### Pause, stop and fade

Press `4` to pause while preserving the current position. Press `4` again to resume at **normal 1× speed**. The toolbar shows a pause icon while playing and a play icon while paused or stopped.

If a song ends at the same moment you pause, automatic advance, random selection and loop restart wait. Press `4` to resume and process the pending song end, or stop to cancel it. Pausing during fade-out also freezes the fade. Resuming continues the remaining fade.

After stopping with `1`, press `4` to replay the current song from the beginning. Opening the same current file with `RETURN` also reuses retained data. Opening a different song or exiting frees the previous song data.

Press `8` to fade out. When the fade finishes, playback stops; fade-out does not automatically open the next song.

### Speed

- `3`: normal → 0.5× → 0.25× → normal.
- `5`, normal Z80: normal → 2× → normal.
- `5`, Panasonic fast mode / R800: normal → 2× → 4× → normal.

Pressing `3` while accelerated selects 0.5×; pressing `5` while slowed selects 2×. Actual performance depends on the machine, song and display workload.

## Display and skins

### Channel view and spectrum

Use `Tab` to switch views.

- **Channel view:** chip-specific channel names, keyboard notes, levels, note names and supported pan information. SCC songs also show waveforms and gain.
- **Spectrum:** frequency activity and per-channel levels. Layout and colors depend on the selected skin.

The line under the title lists every chip the song uses, in the order `OPNA`, `SCC+`, `OPLL`, `PSG` — for example `OPNA/SCC+`, `SCC+/PSG` or `OPNA/OPLL`. The song data cannot tell SCC from SCC+, so SCC is always shown as `SCC+`. This line does not change when you switch chip pages.

Note names use the MUCOM spelling with `+`: `C+4` is C#4. The note cell of the ADP1 row shows the current ADPCM sample number in decimal, such as `P03` for MML `@3`.

The MSX PSG and OPLL rows also show the playing notes, keyboard and levels. An OPLL channel stays at half level after key-off while its note and volume are unchanged, to suggest the release. A resting channel shows level 0.

Spectrum and level displays are estimates from playback data and chip state. They are not audio FFT measurements or recording meters. A mono chip without pan information may have a stationary pan indicator. The RHY row flashes its per-drum indicators on rhythm hits: six drums for OPNA and five for OPLL. Indicators clear while paused or stopped. For native raw PSG streams, a channel with both tone and noise disabled shows zero level; noise-only activity has no keyboard pitch. OPLL channels 7–9 return to melodic display immediately when rhythm mode is disabled.

Use `Shift+Tab` or `C` to cycle the chip pages in channel or spectrum view. Only groups used by the song appear: OPNA, OPLL, and SCC(+)+PSG. SCC and PSG share one page with five SCC and three PSG channels; SCC-only songs show five channels. Info, mixer and full browser panels retain their focus. A switch pauses playback and restores the previous playing/paused state afterward. The `msPb` format alone does not imply OPLL channels.

When a new song is loaded, the player automatically selects its primary chip page from the used parts. Ordinary parts are compared by channel count, excluding rhythm, ADPCM-B and tempo-only parts. For raw streams that multiplex several channels, the detected chip capacities provide an estimate. SCC(+)+PSG counts as one combined page and wins a tie. A manual chip-page choice is retained through stop/replay and menu returns for the same song. Loading another song selects again; if an info or mixer panel is open, the new page appears after closing it.

**View changes briefly pause and mute the music.** In Panasonic fast mode a `Tab` change takes about 0.3 seconds and a chip-page change about 1 second. After the transition, the previous playback/pause, speed and fade state is restored. ADPCM is handled so its position is retained. Switching views while manually paused does not start playback automatically.

### Choosing a skin

1. Open the picker with `F10`, or `Shift+F5` / `Ctrl+L` on a real MSX.
2. Select one of the four previews with the arrow keys.
3. Use `[` / `]` for the previous/next page.
4. Use `Tab` inside the picker to switch channel/spectrum categories.
5. Press `Space` for a full-size preview; press a key to return.
6. Press `RETURN` to apply and save, or `Esc` to leave without applying.

Channel skins are **C01–C40** and spectrum skins are **V01–V40**. Each category has 10 pages with four previews per page. Channel and spectrum skins are selected independently.

### Toolbar styles

`Ctrl+Tab` cycles:

```text
SOLID → OUTLINE → BADGE → KEYCAP → CUTOUT → BRACKET → SOLID
```

Styles keep the same keys and functions. Icons and highlighting change with playback, pause, mode, fade and speed state.

## Volume and song information

Open the mixer with `V`. Choose a group with `↑` / `↓` and adjust it with `←` / `→` or `+` / `-`. **0 mutes; 15 is full volume.**

| Group | Controls |
| --- | --- |
| MASTER | Overall volume |
| OPNA FM | OPNA FM channels |
| OPNA SSG | OPNA SSG channels |
| ADPCM | OPNA ADPCM |
| OPNA RHYTHM | OPNA rhythm |
| MSX PSG | MSX PSG channels |
| MSX SCC | SCC/SCC+ channels and SSG extension played through SCC |
| MSX-MUSIC | OPLL FM channels and drums |

Use **MSX SCC** for SCC volume. It is independent of OPNA SSG and MSX PSG. Adjusting an unused group does not affect the song.

`I` opens song information: title, path, sound chips and keyboard help. Close info/mixer with `Esc`, `Tab` or the same menu key.

## Saved settings

Channel/spectrum skins and toolbar style are saved in `MUBSCOPE.CFG` and restored on startup. A valid configuration under the previous name is restored on the first run and saved under the official name. The player directory must be writable to save settings. Settings are saved in the player directory even when you start from another directory.

Volume, speed and playback mode apply to the current session. The next startup defaults to ONCE; use `/L0` to start in LOOP mode.

To restore the default design, exit the player, move `MUBSCOPE.CFG` to another name and start again.

## Troubleshooting

### Missing module or skin at startup

Keep all required COM/BIN modules, `MUBSCPU.BIN` and the full `SKINS` tree in the player directory. Use one matching distribution. If you start from another directory, check that the player directory is in `PATH`. Copy `SKINS/0` through `SKINS/8` and `SKINS/TB0.BIN` through `SKINS/TB5.BIN` as well.

### Not enough memory

Check that MSX-DOS2/Nextor can access the RAM mapper. Close unnecessary resident programs and try a smaller song. Large songs need additional free RAM. At least 512KB mapper RAM is recommended.

### No songs in the file list

Check the drive, directory and `.MUB` extension. MUC sources cannot be played by MUBScope. Split directories with too many entries into subdirectories.

### The display moves but there is no sound

Check playback with `4` and ensure MASTER and the relevant mixer group are not at 0. Check the OPNA, MSX-MUSIC or SCC/SCC+ device required by the song. Songs with conflicting SCC/SCC+ usage cannot be loaded.

### F10 or Ctrl+Tab does not work

On a normal Z80 (or when started with `/N`), `F10`, `F`, `V`, `Tab` and `Ctrl+Tab` are not available; see [Normal Z80 mode](#normal-z80-mode). On a real MSX, use `Shift+F5` or `Ctrl+L` for skins. In openMSX, load `openmsx-designs.tcl` at startup or use the album launcher containing the bindings. Check whether the host operating system intercepts the key combination.

### Music briefly pauses during view changes

`Tab` and chip-page changes pause playback for the transition, then restore its prior state. If playback does not resume, check for manual pause and press `4`. Transition time depends on the machine, storage and skin.

### Skin or toolbar settings are not retained

Check write access to the player directory and `MUBSCOPE.CFG`. Apply a skin with `RETURN`; previewing alone does not save it.

### Playback or display updates slow down

On a normal Z80 the screen is reduced to the file browser to leave the CPU to the music, but some songs still exceed its processing capacity and play more slowly. Use automatic acceleration on a supported Panasonic machine or Turbo-R R800; if you started with `/N`, try starting without it. A working display does not by itself confirm playback at the intended tempo.

Even on the faster CPUs, a large song can fall slightly behind just after it starts and then return to normal speed.

### A MUB with many FM voices cannot be opened

The current playback loader supports an FM voice table of up to 32 entries. muPb/msPb files exceeding that limit produce a load error. A supported extension does not guarantee support for every file size or voice count.

## Five-channel SCC scores

The `msPb 0102` format supports five dedicated SCC parts (SCCA–SCCE), including songs combined with PSG, OPLL or OPNA. Each chip has its own display page. Ordinary SCC shares waveform storage between channels 4 and 5; SCC+ has five independent waveforms.

SCC voice waveforms are embedded in the compiled MUB. Playing that MUB does not require the source MUC’s SCCVOICE.DAT.

## Native MSX scores

PN1–PN6 musical objects and scores mixed with OPNA are supported. Channel pages follow the PSG, SCC/SCC+ and OPLL routes used by the score. The common OPNA/OPLL rhythm and ADPCM-B monitors remain available when changing chip pages.

Native MSX scores count repeats per channel. One whole-song loop ends when every active channel has repeated at least once, so the channel with the longest repeat sets the loop; a channel that is still playing without repeating is waited for. ONCE plays the initial pass and one further loop. Finite repeats and phrase calls do not count as whole-song loops. Stopping and restarting the current song resets its loop count.

## Compact MSX syntax compatibility

Play MUB files compiled from compact MSX scores using `|` separators, up to two nested `[ ... ]n` repeats, and `L` song loops. OPLL instrument/drum settings, rests, and SCC waveform morphing are supported. In ONCE mode, an `L` song loop is traversed once more before advancing to the next song.
