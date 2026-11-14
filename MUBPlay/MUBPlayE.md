# MUBPLAY User Guide

MSX PSG `MSXD/E/F`, SCC+ `SCCA..E` and OPLL `MSXA/B/C/H/I/J` with rhythm `MSXG` coexist with OPNA rows without a global mode tag. See [MSX MML](../docs/MSX_MML_EN.TXT), [new envelopes and detune](../docs/MSX_STAGE1.TXT), and [OPLL commands](../docs/OPLL_NATIVE.TXT).

Install and replace `MUBPLAY.COM` together with **the matching build of `MUBPLAY.MXR`**, in the current DOS directory or `PATH`. The module loads at startup; playback ticks do not read executable code from disk. Old PMC/PNC/EXP files are not used. Runtime code banks and the SCC waveform cache are separate. Compiled music DATA is limited to **96KiB (98,304 bytes)**.

## Updates

All changes in the **2026-11 update (since v1.0-Stable)** and the known limits are in the [release notes](../shared/docs/RELEASE_NOTES.md). For the MSX chip extension commands see [MucoMSXExtension](../MucoMSXExtension/readme.md). The first paragraph below is the 2026-10-13 update note.

This version supports SCC/SCC+ SSG msPb0101 in addition to MUB8, muPb and msPb0100. See [release changes](../shared/docs/RELEASE_UPDATE_261013.en.md) for detection, mono approximation, capacity and usage limits. A player replacement cannot restore music DATA missing from an old faulty compilation; recompile it.

### 2026-11: MUCVOICE removed — edit voices and PCM in MUCPlayground

The toolchain no longer includes MUCVOICE. FM voices, SCC/SCC+ waves and ADPCM PCM banks are edited in [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/), the toolchain's official editor, which runs in a web browser. Open the `#voice`, `#sccvoice` and `#pcm` files in its **FM bank**, **SCC bank** and **PCM bank**, adjust them while listening in the FM voice editor, SCC wave editor and PCM sample editor, then download them with **Save**. Put the downloaded files beside the MUC on the MSX under DOS 8.3 names, then compile and play with this tool. The MSX compiler does not convert WAVs from `#@pcm`, so always save PCM as a BIN bank. Screenshots and step-by-step instructions are in the [MUCPlayground editing guide](../shared/docs/MUCPLAYGROUND.en.md); buttons and keys are in the [official MUCPlayground user's guide](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=en#banks). The toolchain ZIP's FMVOICE.DAT and SCCVOICE.DAT can be loaded in MUCPlayground as a starting point (MUCPlayground does not read INIT.TFI). An old MUCVOICE.COM left in your folder is not updated; you may delete it.

> Limits: MUC input 65,536 bytes (MUC2MUB/MUCPLAY), normalized editing 60,000 bytes (MUCEDIT), music DATA 98,304 bytes. Page streams: OPNA 59,546 / native MSX 59,106 bytes. Minimum mapper: 512KiB. Headers, tags and PCM are separate from music DATA.


MUCOM88 MUB Player for MSX  
Written by ToughkidCST

`MUBPLAY` is a player I made for listening to MUCOM88 MUB music files on an MSX. It uses the YM2608 in the Makoto cartridge to play FM, SSG, rhythm, and ADPCM.

Under MSX-DOS2, you just type `MUBPLAY` followed by the name of the MUB file you want to hear. For those using it for the first time, I will go through it step by step, starting with what to prepare.

This guide is written against **`mubplay.com` for Makoto (YM2608)**.

### What is good about listening in MUB form?

One of MUB's strengths is that **the file is far smaller than an uncompressed VGM holding the same song**. On an MSX, where storage is not plentiful, that is a very welcome advantage for music files that carry PCM.

VGM records the commands sent to the sound chip during playback, along with the time between them. MUB, by contrast, stores musical data such as notes, voices, and effects, and the player interprets it and performs it. Put simply, VGM is closer to a log of the sound chip being driven, while MUB is closer to a score the player reads and performs. An effect that keeps changing while a single note is held has to be recorded as many commands in VGM, but in MUB it can be expressed with a short command that specifies the effect.

From a user's point of view, this is what is nice about it.

- **You can fit more songs on the same disk.** Smaller files make it easier to collect music on a floppy disk or SD card.
- **Copying and managing files is lighter.** With less data to move, bringing several songs onto an MSX or backing them up is easier too.

That said, the size difference is not the same for every song. A song where PCM takes up a large share will produce a large MUB as well, and the gap can narrow when compared against a compressed VGZ. Nor does a small file necessarily eliminate PCM transfer time or reduce CPU load. MUBPLAY interprets the musical data and performs it directly, so the processing power of the machine matters too.

I hope you will use it to keep a set of small song files on a disk and pull them out one at a time on your MSX.

## 1. What to prepare

Ordinary music playback needs the following.

- An MSX environment running MSX-DOS2 or Nextor
- Enough free memory and a memory mapper environment to hold the program and the song data
- A Makoto (YM2608) cartridge
- `MUBPLAY.COM`
- The `.MUB` file to play

Required memory and loading time differ from song to song. The fact that DOS runs does not by itself mean every size of song can be played.

When an internal and an external mapper are both present, the program works in the one with more free memory at startup. It does not combine the two, and on some configurations it uses only the mapper DOS runs in.

It runs on ordinary Z80 MSX2/2+ machines, in Panasonic fast mode, on turbo R and on a One Chip MSX. Supported Panasonic machines play with the fast Z80 (5.37 MHz) and turbo R machines with the R800, selected automatically. On a One Chip MSX (OCM), with or without `/N`, the cartridge slot clock is set to 3.58 MHz and the CPU raised to 8.06 MHz. The original speed is restored at exit. `/N` turns off the automatic Panasonic/turbo R acceleration. The same song may still show slight differences in playback depending on the machine and its processing headroom.

On real hardware, also check that Makoto's sound actually reaches the speakers or mixer you have connected. If you can hear the MSX itself but not Makoto, it is best to check the audio connection and volume first.

### Can other sound cartridges play it?

The executable in this guide is for Makoto. MSX-MUSIC or SCC alone cannot play it instead. A version for Neotron-B (YM2610B) is in preparation, but please keep it distinct from this executable. This version has no command-line option for choosing the output device.

## 2. The simplest way to play

To start with, put `MUBPLAY.COM` and the MUB file in the same directory and run it.

For example, if you have these two files,

```text
MUBPLAY.COM
SIN002.MUB
```

type this at the DOS prompt.

```text
MUBPLAY SIN002.MUB
```

`.COM` can be omitted. For the song file, write out the `.MUB` as well.

The command examples in this guide do not include the DOS prompt. Even if you see `D:\>` on screen, type only the command part of the example.

### Playing a song on another drive

From wherever you can run `MUBPLAY.COM`, you can also give the song's path.

```text
MUBPLAY D:\SIN002.MUB
```

For a song in a subdirectory, type it like this.

```text
MUBPLAY D:\MUSIC\SIN002.MUB
```

Use the filename as DOS shows it. At first it is easiest to use short 8.3-format names and simple paths. The current command line offers no support for quoting a path containing spaces.

One run takes one song. There is no feature for listing several filenames or specifying `*.MUB` for continuous playback.

## 3. What appears when you run it?

When loading succeeds, you see something like the following. The song information varies with what the file contains.

```text
MUBPLAY - MUCOM88 MUB Player for MSX
Written by ToughkidCST

Loading MUB file with Makoto (YM2608)
Title : THE SHINOBI
Composer : Yuzo Koshiro
Author : Yuzo Koshiro
Date : 2018/12/12
Comment : sin002
Press any key to stop.

```

Once loading finishes, it shows the song information and, after the final notice and the screen scroll, starts playing automatically. You do not have to press another key to begin.

Songs containing PCM data may need time to transfer that data to Makoto, so it can pause for a while at `Loading MUB file with Makoto (YM2608)`. How long it takes also depends on the file size and disk speed.

On MSX2 or later and on turbo R, the start of the song is computed ahead and stored in one memory segment (16KB) before playback begins, so sound can take a moment to start after the song information appears. Computing ahead continues during playback, so a short burst of disk or display work does not delay the sound. If computing ahead cannot keep up, playback switches to direct output and continues. Without a free segment the song plays with direct output from the start.

### To stop playback

While a song is playing, **press an ordinary key such as ESC or space** and it stops and returns to DOS. ESC is not the only key that works. Do not rely on key operations that produce no character input, such as pressing only Shift or Ctrl.

With no option given, it plays once by default and exits. A song with a repeat section ends at that section's repeat boundary, and a song without one ends when every channel has finished playing.

There are currently no pause, resume, seek, or per-channel mute features. To hear it from the beginning again, stop it and run the same command once more.

## 4. Listening on repeat

The repeat count is specified with the `/L` option. The number goes immediately after `/L`.

| Example input | Behavior |
| --- | --- |
| `MUBPLAY SIN002.MUB` | The default single playthrough |
| `MUBPLAY SIN002.MUB /L1` | Play once |
| `MUBPLAY SIN002.MUB /L2` | Repeat through the second playthrough |
| `MUBPLAY SIN002.MUB /L3` | Repeat through the third playthrough |
| `MUBPLAY SIN002.MUB /L0` | Play with no limit on the repeat count |

To leave it playing, run it like this.

```text
MUBPLAY GH002.MUB /L0
```

Press a key when you want it to stop.

The repeat here follows **the music's repeat section as specified inside the MUB**. It is not a matter of re-reading the file each time and replaying from the intro. If the song was written to return to a particular point after the intro, it repeats from there.

Specifying `/L0` for a song with no repeat section does not create one. In that case it ends when the song ends.

Native MSX scores (msPb0103–0109) have no MUCOM88 `L` loop point; each channel jumps back on its own. For these songs repeats are counted per channel, and the n-th pass ends when every active channel has repeated at least n times. The channel with the longest repeat therefore sets one pass, and a channel still playing without repeating is waited for. A song whose channels all end by themselves stops at its end.

At present the number is a single digit, `0` through `9`. It cannot be used to specify a two-digit number such as `/L10` or `/L30`. Do not put a space before the number as in `/L 3` — write `/L3`.

Specifying `/L` with no number also selects unlimited repeat by default, but I recommend the unambiguous `/L0` form.

## 5. Reading the song information

If the MUB file contains the following tags, they are shown after loading.

| Screen item | Tag in the file | Content |
| --- | --- | --- |
| `Title :` | `#title` | Song title |
| `Composer :` | `#composer` | Composer |
| `Author :` | `#author` | The author recorded in the file, such as the data creator or arranger |
| `Date :` | `#date` | The creation or conversion date recorded in the file |
| `Comment :` | `#comment` | Description and comments |

Items with no information are not shown. Some songs show only a title, and some go straight to the playback notice with no song information at all. There is no need to conclude from that alone that something is wrong with the file.

The display order follows the order of the tags recorded in the file. If `#comment` appears several times, it may be shown across several lines. The date is likewise not filled in automatically from the current date or the file's modification date — it shows the value stored in the MUB.

### How are Japanese titles displayed?

Title output is currently handled on the basis of ASCII and half-width katakana. The actual shape of half-width katakana is also affected by the character environment of the MSX you are using.

For example, the title of `ARG014.MUB` is half-width katakana, so on a Japanese MSX environment it appears like this.

```text
Title : ｶﾗｸｰﾑ ﾉ ﾏﾁ
```

If the title contains characters the current output method cannot display, such as kanji or full-width Japanese, then rather than emitting garbled characters it displays the whole title like this.

```text
Title : [Japanese Title]
```

Even if part of the title is ASCII, the whole title is substituted when undisplayable characters are present as well.

At present, the player does not automatically switch to a kanji screen even on machines with a kanji ROM. This substitution also applies only to the `Title` item. If other items contain full-width Japanese, those items may look garbled.

## 6. Do I need to include VOICE.DAT or PCM files too?

> **Making voice and PCM files:** edit FM voice files, SCC wave files and PCM banks in [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/), download them with **Save** and copy them into this folder. See the [MUCPlayground editing guide](../shared/docs/MUCPLAYGROUND.en.md#3-the-round-trip-with-the-msx) for the steps.

When playing a finished MUB, **a separate `VOICE.DAT` is not needed.** The player uses the FM voice data contained in the MUB.

The PCM is chosen in this order:

1. A PCM block inside the MUB is used. The `#pcm` record in the tags is then for reference only; no external file of that name is read.
2. If the MUB contains no PCM, the file named by its `#pcm` tag is looked up **in the MUB's folder** and uploaded to Makoto. MSX-DOS reads only the first 8 characters of a name, so for `#pcm schemepcm.bin` the file must be `SCHEMEPC.BIN`.
3. If that file is missing too, only the song's ADPCM part stays silent; the other parts play normally. PCM left in Makoto by an earlier song is never played instead.

To begin with, you only need `MUBPLAY.COM` and the MUB file you want to play.

A MUB with embedded PCM is the easiest to handle. Compiling with the current MUC2MUB, MUCPLAY or MUCEDIT embeds the PCM in the MUB.

Also, `.MUC` is the music source before compilation. The file you hand directly to `MUBPLAY` is the compiled `.MUB`.

## 8. Options at a glance

The basic form is:

```text
MUBPLAY filename.MUB [/Lnumber] [/N] [/T]
```

The square brackets mean you include only the options you need. You do not type `[` or `]` in the actual command.

| Option | Purpose |
| --- | --- |
| `/L0` | Unlimited repeat in normal playback |
| `/L1` – `/L9` | Specify the repeat count in normal playback |
| `/N` | No automatic Panasonic/turbo R acceleration (not shown in the usage screen) |
| `/T` | Check the loading path without starting playback |

The usage text printed by the program is:

```text
Usage: mubplay <filename.mub> [/L<n>] [/T]
  <filename.mub>  MUB music file to play
  /L<n>           Repeat count 0-9 (0=infinite)
  /T              Load test only (no hardware playback)
```

`/V` (VGM output) was removed on 2026-10-30. If you add `/V` out of habit, it is ignored and the song simply plays.

Option letters are not case-sensitive. `/l2` works too, but this guide uses uppercase throughout for readability.

For everyday listening, the filename and the `/L` option when you need it are all you have to know. Use the feature below when you need to check files.

## 9. Checking only the loading: /T (for debugging)

```text
MUBPLAY GH002.MUB /T
```

Runs through the process of reading the song, then exits without starting playback. On success you get this message.

```text
Load test OK.
```

This mode also displays memory mapper information. As a result marker, it attempts to create or update `LT_OK.TXT` or `LT_NG.TXT` in the current directory. That file is a check marker, not a detailed human-readable report. A file from a previous run may still be there, so do not judge this run's result from the file's existence alone — check the on-screen message as well.

One caution. The current `/T` is **a mode that does not start playing music**, not a mode that avoids touching the sound cartridge entirely. A MUB containing PCM also runs the path that transfers PCM to Makoto during loading. So do not use it as a tool for safely checking only the file format in an environment without Makoto.

`Load test OK.` means the loading path succeeded. It does not mean the song's voices and every playback command have been verified.

## 10. VGM output removed (2026-10-30)

On 2026-10-30, VGM output (the `/V` option that wrote `SONG.VGM`) was removed from MUBPLAY to free memory for code. `/V` is now ignored and the song simply plays, and the `/L` digit always means a repeat count. VGM export was removed from MUCPLAY and MUCEDIT on the same day, so no tool in the current MucoMSX toolchain (MUC2MUB, MUCPLAY, MUBPLAY, MUCEDIT) creates VGM files.

## 11. When something goes wrong

### I get `MSX-DOS 2 is required.`

The current runtime does not meet the required DOS2 conditions. Check that you booted with MSX-DOS2 or Nextor. This is not a program you use straight from the BASIC screen.

### I get `ERROR: YM2608 (Makoto) not detected.`

Makoto was not detected. On real hardware, check the cartridge connection; in openMSXTK, check that the Makoto extension is actually inserted.

Inserting only MegaFlashROM SCC+ SD does not add Makoto. The two extensions play different roles.

### I get `ERROR: Failed to load MUB file.`

It means reading the file, or handling it as a MUB, failed. Check in this order.

1. Check that the filename actually appears in `DIR`.
2. Check that the current drive and directory are correct.
3. Check that it is a compiled `.MUB`, not a `.MUC`.
4. Check whether other MUB files show the same symptom.
5. Check whether the file was damaged or only partially copied.

Simply changing a file's extension to `.MUB` will not make it playable. And this one error message alone cannot pin down whether the cause is PCM, the path, or the file's contents.

### It waits a long time on the loading screen

A song with large PCM needs transfer time. First compare it against another, smaller song. Distinguishing whether only a particular song takes a long time, or whether every song stalls, helps in finding the cause.

If nothing progresses at all for a long time, do not assume it is simply a large file — let me know the filename and your environment.

### I get `ERROR: Insufficient TPA space.` or another memory-related error

Check how much memory the program has available. Free space varies with your resident programs and driver configuration. It helps to compare against an environment with unnecessary resident programs removed, and with a small MUB file.

### The title shows as `[Japanese Title]`

That is normal behavior. It means the title contains characters the current screen output cannot handle. It does not mean the song file is damaged, and neither the original title nor the music data is altered.

### There is no sound, or some sounds differ

First check Makoto's audio output and volume. If only the ADPCM of a particular song is missing, check whether the MUB contains PCM and, if it does not, whether the file named by its `#pcm` tag is in the MUB's folder under an 8.3 name. This is not a problem solved by copying `VOICE.DAT` alongside it.

If the voices or tempo differ from the original even with the same file, let me know what the difference is. Differences between Z80 and turbo R environments, the processing load in particular sections, and the playback commands in the file all need checking too.

### I get `An exception occurred` or `Address out of bounds`

That is not a normal song-ending message. Please keep the name of the song that failed and the address and message shown, as exactly as you can. Whether it happened during loading, right after playback started, in a particular section, or at exit also matters.

If sound continues after the error, turn down your external volume first. In that case it should be treated as normal exit processing not having completed, and checked.

## 12. When playback has problems

If a song sounds different or you get an error, the following information makes it much easier to look into.

- The distribution of `MUBPLAY.COM` you used, or the date you obtained it
- The MUB filename and, if possible, the file used to reproduce it
- The MSX model and CPU execution mode
- Your MSX-DOS2/Nextor setup and cartridge configuration
- The exact command you typed
- The error message, or the section where the problem is audible
- The original audio for comparison, plus a recording or video of the current playback

A video is better with the sound included than the screen alone. Describe the audible difference — for example, "it slows down in the intro then speeds up," "the FM melody is different," or "the drums play but there is no PCM."

If the video was cut short with ESC, note that too. It helps distinguish why the capture length differs from an actual difference in the music's speed.

## 13. Commonly used commands

Listen to one song:

```text
MUBPLAY SIN002.MUB
```

Listen through the third playthrough of the repeat section:

```text
MUBPLAY GH002.MUB /L3
```

Listen on repeat until you press a key:

```text
MUBPLAY GH002.MUB /L0
```

Listen to a song on drive D:

```text
MUBPLAY D:\BARE75.MUB
```

Check loading in an environment with Makoto connected:

```text
MUBPLAY GH002.MUB /T
```

Start with a single song and no options. Once you are used to it, try `/L0` to listen to a favorite song on repeat.

Enjoy.

ToughkidCST

## Native MSX targets

The integrated build adds MSX-prefixed parts, native msPb output and automatic playback CPU acceleration. Existing parts remain OPNA. Consult the new guide for requirements, limits and approximate sound conversion.

[MSX target guide](../shared/docs/MSX_TARGETS.en.md)

For `#SSGExtend`, `@I`, `@W`, `pe` and `#PCMInvert`, see the [SCC+ SSG guide](../shared/docs/SSG_EXTEND.en.md). This extends msPb with approximate SCC+ playback, not bit-exact PC virtual SSG.

## Dedicated SCC scores

`SCCA`–`SCCE` select SCC/SCC+ channels 1–5, with multi-channel selectors such as `SCCABC` and pages 0–9. Put `#sccvoice SCCVOICE.DAT` in the initial header and use `@0`–`@255` to select defined waves from an SCWD v1 bank (saved from MUCPlayground's SCC bank). Keep the bank beside the MUC in the working directory under a plain DOS 8.3 name. The default is `SCCVOICE.DAT`.

Example: `SCCA @0 o4 v15 l8 cdefgab>c`

MUB embeds the waveforms and needs no DAT at playback time. MUCEDIT compilation, playback and MUB export use the same commands. Install current MUC2MUB/MUCPLAY/MUCEDIT/MUBPLAY together for the new `msPb0102` profile. Ordinary SCC shares CH4/5 wave RAM; five independent waves require SCC+. Do not mix this with `#SSGExtend On` or raw SCC. The 512KiB mapper requirement, 60,000-byte MUCEDIT document limit and 96KiB music DATA limit remain. See the dedicated SCC section in the common MSX_TARGETS guide for details.


## Inline SCC waveforms in MUC

Define a 32-byte SCC waveform with `@Wnumber:{ ... }`, following the brace form of OPNA voice definitions, and select it with `@number` in a part. When all required SCC waves are defined inline, compilation, playback and MUB export need neither `#sccvoice` nor an external DAT.

`@Wnumber:{ ... }` definitions inserted by MUCPlayground's SCC wave editor work as they are ([SCC wave editing guide](../shared/docs/MUCPLAYGROUND.en.md#5-scc-waves)). IDs are 0–255, with exactly 32 samples in -128–127. Inline definitions override external waves of the same ID; an explicitly named `#sccvoice` file must still exist. See the SCC wave section of MSX_TARGETS for examples and compatibility forms.
