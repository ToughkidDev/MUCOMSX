# MUCPLAY User Guide

MSX PSG `MSXD/E/F`, SCC+ `SCCA..E` and OPLL `MSXA/B/C/H/I/J` with rhythm `MSXG` coexist with OPNA rows without a global mode tag. See [MSX MML](../docs/MSX_MML_EN.TXT), [new envelopes and detune](../docs/MSX_STAGE1.TXT), and [OPLL commands](../docs/OPLL_NATIVE.TXT).

Install and replace `MUCPLAY.COM` together with **the matching build of `MUCPLAY.MXR`**, in the current DOS directory or `PATH`. The module loads at startup; playback ticks do not read executable code from disk. Old PMC/PNC/EXP files are not used. Runtime code banks and the SCC waveform cache are separate. Compiled music DATA is limited to **96KiB (98,304 bytes)**.

## Updates

All changes in the **2026-11 update (since v1.0-Stable)** and the known limits are in the [release notes](../shared/docs/RELEASE_NOTES.md). For the MSX chip extension commands see [MucoMSXExtension](../MucoMSXExtension/readme.md). The first paragraph below is the 2026-10-13 update note.

[Release changes](../shared/docs/RELEASE_UPDATE_261013.en.md) cover SCC/SCC+ SSG, PCMInvert, compiler optimization and session rhythm-mask restoration. Release the old session with `/RELEASE` before replacing all four COMs. Do not overwrite edited voice DAT banks with factory presets. Recompile MUBs with missing music DATA. MSX-MUSIC/PSG and playback acceleration already shipped in public v0.81.

### 2026-11: MUCVOICE removed — edit voices and PCM in MUCPlayground

The toolchain no longer includes MUCVOICE. FM voices, SCC/SCC+ waves and ADPCM PCM banks are edited in [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/), the toolchain's official editor, which runs in a web browser. Open the `#voice`, `#sccvoice` and `#pcm` files in its **FM bank**, **SCC bank** and **PCM bank**, adjust them while listening in the FM voice editor, SCC wave editor and PCM sample editor, then download them with **Save**. Put the downloaded files beside the MUC on the MSX under DOS 8.3 names, then compile and play with this tool. The MSX compiler does not convert WAVs from `#@pcm`, so always save PCM as a BIN bank. Screenshots and step-by-step instructions are in the [MUCPlayground editing guide](../shared/docs/MUCPLAYGROUND.en.md); buttons and keys are in the [official MUCPlayground user's guide](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=en#banks). The toolchain ZIP's FMVOICE.DAT and SCCVOICE.DAT can be loaded in MUCPlayground as a starting point (MUCPlayground does not read INIT.TFI). An old MUCVOICE.COM left in your folder is not updated; you may delete it.

> Limits: MUC input 65,536 bytes (MUC2MUB/MUCPLAY), normalized editing 60,000 bytes (MUCEDIT), music DATA 98,304 bytes. Page streams: OPNA 59,546 / native MSX 59,106 bytes. Minimum mapper: 512KiB. Headers, tags and PCM are separate from music DATA.


Compiling MUC files on an MSX, playing them through Makoto, and saving the finished music to a file

Written against: September 14, 2026 · MUCPLAY for YM2608 (Makoto)



---

## 1. Some things worth knowing first

MUCPLAY is a program that compiles and plays MUC files, the music source format of MUCOM88, on an MSX. You can run a MUC file directly and listen to it, or you can load the source into memory and then run compilation and playback as separate steps.

The second approach is convenient when you are revising music and checking the same song many times. Because the compiled data is kept in memory, you do not have to compile the whole source again every time you play it. When you get a result you like, you can save it as a MUB file.

You do not need to memorize every option from the start. Play one song first, then get comfortable with the three commands `/LOAD`, `/COMPILE`, and `/PLAY`.

This guide focuses on how to use MUCPLAY. It does not cover MUC syntax or detailed explanations of compile errors.

### The program names used in this guide

| Program | What it does |
|---|---|
| `MUCPLAY.COM` | Compiles and plays MUC, and saves the in-memory result as MUB. The subject of this guide. |
| `MUBPLAY.COM` | Reads and plays an already-built MUB file. |
| `MUCEDIT.COM` | Edits MUC and works with MUCPLAY to run compilation, playback, and export. |
| `MUC2MUB.COM` | A separate compiler that converts MUC into a MUB file. |

MUCPLAY includes the compiler it needs. For ordinary use you do not have to run `MUC2MUB.COM` separately or keep it in the same folder.

### Jump to what you need

- [Quick start](#2-quick-start)
- [Runtime environment and file preparation](#3-runtime-environment-and-file-preparation)
- [Commands at a glance](#4-commands-at-a-glance)
- [Playing one song right away](#5-playing-one-song-right-away)
- [Working with a memory session](#6-working-with-a-memory-session)
- [Repeat playback and stopping](#7-repeat-playback-and-stopping)
- [Saving as a MUB file](#8-saving-as-a-mub-file)
- [VGM output removed](#9-vgm-output-removed)
- [Clearing memory and moving between albums](#10-clearing-memory-and-moving-between-albums)
- [Managing voice and PCM files](#11-managing-voice-and-pcm-files)
- [Using it with MUCEDIT](#12-using-it-with-mucedit)
- [Worked examples by situation](#14-worked-examples-by-situation)
- [Frequently asked questions](#15-frequently-asked-questions)
- [Commands to remember](#16-commands-to-remember)

## 2. Quick start

The commands in this guide are typed at the DOS prompt of MSX-DOS2 or Nextor. 

In the examples, the song is assumed to be named `SONG.MUC`. 

### Listen to one song first

Run it from the directory containing the song file and the voice and PCM files that song needs.

```text
MUCPLAY SONG.MUC
```

mucplay reads the source, compiles it, and then plays it. To end playback partway through, press an ordinary character key or Esc. It also returns to DOS when the song reaches its defined ending condition.

When you see the following notice on screen, it means you can stop playback.

```text
Press any key to stop.
```

### Listen several times, and save to files too

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
MUCPLAY /MUB SONG.MUB
MUCPLAY /RELEASE
```

Run each line after the previous command has finished and returned you to the DOS prompt. With `/PLAY`, listen to the song through to the end or press a key to stop, then run the save commands.

Working in this order lets you go through loading the source, compiling, playing, saving files, and clearing memory once each.

## 3. Runtime environment and file preparation

### What you need to run it

This guide is based on **MUCPLAY for Makoto, which uses the YM2608**.

Prepare the following.

- MSX-DOS 2, or a Nextor environment providing the same functionality
- Free mapper RAM for the program and for compilation work
- Makoto (YM2608), if you want to actually hear sound
- `MUCPLAY.COM`
- The MUC to play, plus the voice and PCM files that song uses
- Disk space to write the session file and the output files

If you are setting up an environment for the first time, it is best to plan around a configuration with 512KB or more of mapper RAM. Installed RAM capacity and actually usable free memory are different things. Other programs and any session you are holding also consume memory.

When an internal and an external mapper are both present, the program works in the one with more free memory at startup. It does not combine the two, and on some configurations it uses only the mapper DOS runs in. Supported Panasonic machines play with the fast Z80 (5.37 MHz) and turbo R machines with the R800, selected automatically. On a One Chip MSX (OCM), with or without `/N`, the cartridge slot clock is set to 3.58 MHz and the CPU raised to 8.06 MHz. The original speed is restored at exit. `/N` turns off the automatic Panasonic/turbo R acceleration.

The program for YM2610B/Neotron-B is a separate target. Even if the filenames are similar, do not confuse it with the Makoto executable this guide describes.

### How to lay out the files

At first it is easiest to gather the files one album needs into a single directory.

```text
ALBUM\
    MUCPLAY.COM
    SONG.MUC
    VOICE.DAT
    PCM.BIN
```

Here `VOICE.DAT` and `PCM.BIN` are examples of the layout. Keep the names the album actually uses. If you rename them to match the example, the song may not find the files it needs. Songs that use no external voices or PCM may not need those files at all.

You may also put `MUCPLAY.COM` on the DOS search path. The path used to find the program and the working directory used to find a song's companion files are separate things, so I recommend moving into the song's directory and running it from there.

### Filenames and paths

Type names as MSX-DOS shows them. Using short 8.3 names without spaces at first reduces confusion.

```text
SONG.MUC
SONG.MUB
```

It is best not to assume that long filenames, or quoted paths containing spaces, are handled the way a modern shell handles them. The compile path in particular has its own filename handling limits, so rather than a long full path, run from that directory with a short filename.

When openMSX's host folder name differs from the name DOS shows, check with `DIR`.

## 4. Commands at a glance

| Command | What it does | The filename after the command |
|---|---|---|
| `MUCPLAY SONG.MUC` | Read and compile a MUC, then play it immediately | Input MUC |
| `MUCPLAY /LOAD SONG.MUC` | Load the source and compile-ready data into memory | Input MUC |
| `MUCPLAY /COMPILE` | Compile the loaded source and keep the result in memory | Not needed |
| `MUCPLAY /PLAY` | Play the compiled data in memory | Not needed |
| `MUCPLAY /MUB SONG.MUB` | Save the compiled result as MUB | Output MUB |
| `MUCPLAY /RELEASE` | Release the session memory and delete the session file | Not needed |

Command options are not case-sensitive. This guide writes them in uppercase for legibility.

`/LOAD`, `/COMPILE`, `/PLAY`, `/MUB`, and `/RELEASE` are step-by-step commands. At first, run them one at a time rather than mixing several action options on one line. The `/L` option, which specifies a repeat count, is attached to the playback command.

The MUB examples include the extension. I recommend typing the output names you choose the same way.

## 5. Playing one song right away

This is the simplest way to run it.

```text
MUCPLAY SONG.MUC
```

This command reads the input MUC, compiles it, and plays it. Running the same command again reads the source and compiles it again as well.

This approach is convenient when you just want to hear a song. If you plan to save it as MUB afterward, use the session approach in the next chapter. **Do not treat a single direct run as a persistent session that has completed `/LOAD` and `/COMPILE`.**

### The preparation time before playback starts

Sound does not come out the instant you type the command. It takes time to read and compile the source, and, when needed, to transfer PCM into Makoto's sample memory.

On MSX2 or later and on turbo R, the start of the song is computed ahead and stored in one memory segment (16KB) before playback begins, so sound can take a moment to start after the song information appears. Computing ahead continues during playback, so a short burst of disk or display work does not delay the sound. If computing ahead cannot keep up, playback switches to direct output and continues. Without a free segment the song plays with direct output from the start.

### If you already have a MUB file

A finished MUB file is run with MUBPLAY.

```text
MUBPLAY SONG.MUB
```

Putting a MUB filename after MUCPLAY's `/PLAY` is not a way to open a MUB on disk. `/PLAY` uses the memory session MUCPLAY has already compiled.

## 6. Working with a memory session

Think of a session as "keeping the song you are working on in memory." Even after the program returns to DOS, the loaded source and compile result are available to the next command.

### Step 1: Load the source — `/LOAD`

```text
MUCPLAY /LOAD SONG.MUC
```

Reads the MUC, prepares it for compilation, and returns to DOS. This step neither compiles nor plays.

If an existing session still holds another song's source or compile result, that is released before the new source is loaded. If you want to keep the earlier work, save it to the files you need before you `/LOAD` a new song.

### Step 2: Compile — `/COMPILE`

```text
MUCPLAY /COMPILE
```

Compiles the source loaded into memory earlier. The result stays in memory and it returns to DOS.

There are three things to know here.

- It does not automatically create a MUB file on disk.
- It does not start playback.
- It does not transfer PCM into Makoto's sample memory at this stage.

No filename argument is needed either. Which song gets compiled is determined by the source currently loaded in the session.

### Step 3: Play — `/PLAY`

```text
MUCPLAY /PLAY
```

Plays the current compile result. It reads any required PCM files and prepares the sample data before starting playback.

The session remains after you stop, so you can listen again right away.

```text
MUCPLAY /PLAY
```

Running it again plays from the start of the song. This is not a pause-and-resume feature that continues from where you stopped.

### If you run `/COMPILE` twice

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /COMPILE
```

You can compile repeatedly. The loaded MUC and voice data are kept, the existing MUB segment is released, and a fresh compile is performed.

The previous compile result is not kept separately. Only once the new compile has completed is there a result ready for the next `/PLAY` or `/MUB`.

### If you edited the source on disk, `/LOAD` again

Please remember this part. `/COMPILE` is not a command that re-reads the MUC file from disk.

If you modified and saved the file in an external editor, apply it in this order.

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
```

Omitting `/LOAD` means recompiling the older source still sitting in memory. Work the same way — reloading the source — when you have changed an external voice file.

### What each command leaves behind

| Command run | Source loaded in memory | Compile result | Disk output |
|---|---|---|---|
| `/LOAD` | Replaced with the new source | Existing result released | Session management file |
| `/COMPILE` | Kept | New result generated | Does not save MUB |
| `/PLAY` | Kept | Kept | Does not save a music file |
| `/MUB` | Kept | Kept | Creates the specified MUB |
| `/RELEASE` | Released | Released | Deletes the session management file |

This table assumes each operation completed normally.

## 7. Repeat playback and stopping

### Specifying the repeat count

Use `/L` followed by a single digit.

```text
MUCPLAY SONG.MUC /L2
```

The same option is used for memory session playback.

```text
MUCPLAY /PLAY /L2
```

| Specification | Playback behavior |
|---|---|
| Omitted | The default single playthrough |
| `/L1` | Play once |
| `/L2` | Play twice |
| `/L3` … `/L9` | Play the specified number of times |
| `/L0` | Keep repeating the song's loop |
| `/L` | Written without a number, specifies infinite repeat |

The count includes the first playthrough. `/L2` does not mean "play once, then repeat twice more."

At present, numeric input is a single digit from 0 to 9. Do not specify a two-digit count such as `/L10`.

### Repeats follow the loop the song has

Repeat playback is not the same as re-running the whole song file from the beginning each time. It uses the loop position contained in the musical data, so in some songs the intro plays once and only the main body repeats.

A song with no loop ends when all channels finish. Adding `/L0` does not make a loopless song replay infinitely from the beginning on its own.

The repeat count follows the channels that have an `L` loop point. Native MSX scores (msPb0103–0109) have no MUCOM88 `L` loop point; each channel jumps back on its own. For these songs repeats are counted per channel, and the n-th pass ends when every active channel has repeated at least n times. The channel with the longest repeat therefore sets one pass, and a channel still playing without repeating is waited for. A song whose channels all end by themselves stops at its end.

### Stopping partway through

Pressing an ordinary character key or Esc during playback stops it and returns. Using a character key is more reliable than pressing only a modifier such as Ctrl or Shift.

Stopping is not the same as releasing the session. Stopping `/PLAY` does not discard the loaded source or the compile result. Run `/RELEASE` when you are completely finished.

## 8. Saving as a MUB file

A MUB is a file holding the compiled musical data and the information needed for playback. Use it to listen to a finished song with MUBPLAY, or to archive it.

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /MUB SONG.MUB
```

The name after `/MUB` is **the output filename to save as**. It is not the name of a MUC or MUB to read.

### What data gets saved

It uses the current session's compile result. Running `/MUB` does not recompile the source.

During MUB saving, the header, song data, and tag information are written, and companion PCM files are reflected in the output as well. This is where the in-memory result of the `/COMPILE` stage and the role of a distributable MUB file diverge.

A MUB with PCM properly included can use the sample data inside it during playback. Keep the album's PCM files in their original location through the saving stage. Rather than looking only at the "saved" message, it is good practice to also check whether there were any PCM-related notices.

### Checking after saving

```text
DIR SONG.MUB
MUBPLAY SONG.MUB
```

Confirm the file was created and listen to it yourself. I recommend making a habit of comparing what you heard in MUCPLAY against the playback of the saved MUB.

### Keeping several results under different names

```text
MUCPLAY /MUB SONG01.MUB
MUCPLAY /MUB SONG02.MUB
```

You can save the same compile result under several names. To change the music itself, you have to edit the source and load and compile it again.

Saving under the same name as an existing file can overwrite it. To keep an earlier result, use a different name. If you need an output directory, prepare it in advance.

## 9. VGM output removed

On 2026-10-30, VGM output was removed from MUCPLAY to free memory for code: both `/VGM filename` and the short `/V` form (which recorded a VGM while playing a file) are gone. MUCEDIT's F1→5 VGM export was removed at the same time. The freed code space is reserved for future features. MUCPLAY's usage is now `MUCPLAY file.muc [/L<n>]`, or `/LOAD f`, `/COMPILE`, `/PLAY`, `/MUB f`, `/RELEASE`.

MUBPLAY's VGM output (`/V`) was removed on the same day (2026-10-30), so no tool in the MucoMSX toolchain (MUC2MUB, MUCPLAY, MUBPLAY, MUCEDIT) provides VGM export any more. To keep a song as a finished playback file, save a MUB with `MUCPLAY /MUB SONG.MUB`.

## 10. Clearing memory and moving between albums

### When you finish working — `/RELEASE`

```text
MUCPLAY /RELEASE
```

Releases the current session's MUC, voice, and MUB data along with the management header memory, and deletes `MUCPLAY.SES`.

The original MUC kept on disk and any MUB files you already saved remain untouched. `/RELEASE` is not a command that deletes music files.

### What is `MUCPLAY.SES`?

It is a small management file used so that the same memory data can be found even when commands are run separately. The file itself does not contain the whole song.

So think of it this way.

- You cannot copy `MUCPLAY.SES` alone and restore the song on another computer or in another boot environment.
- After powering off or resetting, you cannot continue using the earlier memory session.
- To archive a song, save the MUC and, as needed, export a MUB as well.
- To clear memory, use `/RELEASE` rather than deleting the session file yourself.

Deleting only the session file first can make it harder for the program to find and release the existing memory.

### Please stay in the same working directory

The session management file is looked up in the current working directory. PCM paths may be relative too, so finishing everything — loading, compiling, playing, exporting, releasing — in the same directory is the simplest approach.

When moving to another album, use this order.

```text
MUCPLAY /RELEASE
CD ..
CD ALBUM2
MUCPLAY /LOAD SONG2.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
```

This example assumes `ALBUM2` is a directory DOS can reach, and that the program is placed so MUCPLAY can still be run after moving there.

Running `/RELEASE` from a different directory does not go and release sessions in the previous directory as well. It is a good habit to tidy up before leaving an album folder.

## 11. Managing voice and PCM files

> **Making voice and PCM files:** edit FM voice files, SCC wave files and PCM banks in [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/), download them with **Save** and copy them into this folder. See the [MUCPlayground editing guide](../shared/docs/MUCPLAYGROUND.en.md#3-the-round-trip-with-the-msx) for the steps.

Copying just the MUC sometimes will not give you the same sound as the original song. Think of the voice data and PCM data included with the album as part of the music too.

### Voice data

For a song that uses external voices, prepare that voice file as well. In session work the loaded voice data is what gets used for compilation, so after swapping an external file it is best to start again from `/LOAD`.

### PCM data

A song using PCM reads samples from the file at playback time and puts them into Makoto's sample memory. Do not assume that compiling once keeps the PCM file permanently in memory.

| Operation | What to know about PCM |
|---|---|
| `/COMPILE` | This is not the stage that transfers PCM to the chip. |
| `/PLAY` | Reads the external PCM it needs and prepares for playback. |
| `/MUB` | There is a process that reads the PCM file and attaches it to the output MUB. |

If the PCM file named in a `#pcm` tag is missing, compilation does not start and stops with error 19 (`PCM file in #pcm tag not found`). The song is not played and no MUB is written. Only when there is no tag and the default `MUCOMPCM.BIN` is missing does it warn and continue, as before.

A song with no `#pcm` line and no default `MUCOMPCM.BIN` shows the warning and plays without its ADPCM part. PCM left in Makoto by an earlier song is never played instead.

The companion PCM file must be MUCOM data matching that song. You cannot just change a WAV or AIFF file's extension to BIN and use it.

### When only some instruments are wrong

If it is not the whole sound but only the sampled instruments that are missing or sound different, check the following first.

1. Whether you brought the PCM file matching the song.
2. Whether the filename appears correctly in DOS.
3. Whether you changed the working directory or the file locations after loading.
4. Whether you overwrote it with a same-named file from another album.

After tidying the files, check again in the order `/LOAD → /COMPILE → /PLAY`. There is no need to start changing the instrument settings in the source before you have verified the file layout and playback state.

## 12. Using it with MUCEDIT

In MUCEDIT you can hand the song you are editing to MUCPLAY to compile and play it. It is a feature for keeping up the flow of editing, checking, and editing again.

The basic working order is as follows.

1. Load the song in MUCEDIT.
2. Edit the parts you need to.
3. Run the editor's compile function.
4. Check the result with the playback function.
5. Stop, return to the editor, and continue working.
6. Save the original source and, if needed, export a MUB.

Leave the integration options and the return handling that the editor uses to the editor.
**Exporting a MUB and saving the edited MUC original are separate operations.** Even after exporting a music file, save the source you will edit next time separately in the editor.

For the exact menu layout and editing keys, see the MUCEDIT guide. This guide covers only the compile, playback, and output flow that MUCPLAY handles.

## 14. Worked examples by situation

### Listening to the same song repeatedly

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY /L0
```

Listen as long as you like, then press a key to stop. To listen again, just run `/PLAY`.

```text
MUCPLAY /PLAY /L2
MUCPLAY /RELEASE
```

### Applying changes made in an external editor

Save the MUC in the editor first, then run this from DOS.

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
```

`/LOAD` is included so that the older source does not get recompiled.

### Listening, then keeping a MUB

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
MUCPLAY /MUB SONG.MUB
MUCPLAY /RELEASE
```

An example that saves the compile result you listened to into a MUB. It does not fix the MUB's own playback count via `/MUB`.

### Switching to the next song in the same album

```text
MUCPLAY /LOAD SONG1.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
MUCPLAY /MUB SONG1.MUB
MUCPLAY /LOAD SONG2.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
MUCPLAY /MUB SONG2.MUB
MUCPLAY /RELEASE
```

The second `/LOAD` releases the first song's loaded data and compile result and replaces them with the new song. So you do not have to insert a `/RELEASE` every time you change songs within the same directory. Do release when you finish working or move to another album directory.

### Creating files without playing

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /MUB SONG.MUB
MUCPLAY /RELEASE
```

You do not have to run `/PLAY` before generating the files.

## 15. Frequently asked questions

### `/COMPILE` finished but there is no MUB file.

That is normal. The result is ready in memory. To keep it as a file, run `/MUB outputname.MUB`.

### Can I go straight from `/LOAD` to `/PLAY`?

You have to build the playback data with `/COMPILE` first. The basic order is `/LOAD → /COMPILE → /PLAY`.

### Does it compile every time I run `/PLAY` again?

No. It reuses the current compile result. However, playback initialization — such as preparing samples for a song that uses PCM — is performed again.

### I edited the source but the same music plays.

Check whether you re-ran `/LOAD` on the file you saved externally. Repeating only `/COMPILE` uses the source previously loaded into memory.

### Do I write the original MUC name after `/MUB`?

You write the name of the MUB to save. For example, `MUCPLAY /MUB SONG.MUB`. Check the extension so you do not mistakenly give the original name as the output name.

### I used `/L0` but the song ends.

If the song data has no loop, it ends when all channels finish. Specifying infinite repeat means continuing to use the loop inside the song.

### Is it normal for memory to still be in use after stopping?

If you worked with the session approach, yes. The data is kept so you can play and export again. Run `/RELEASE` when you no longer need it.

### I went to another folder and back, and it cannot find the session.

Return to the directory where you created the session and work there. The management file and PCM's relative paths are affected by the current directory. It is better to finish and release the work in the previous folder before moving to a new one.

### I reset the machine but the `MUCPLAY.SES` file is still there.

That file alone cannot restore the song from memory. On a fresh boot, `/LOAD` the source and `/COMPILE` again before working. The session file is not an archived copy of the music.

### Should I include `MUCPLAY.SES` when distributing?

No. To distribute an editable source, prepare the MUC and the companion files it needs; to distribute a finished playable file, prepare a MUB. Also check that the MUB properly includes the PCM it needs.

### At which stage — compiling or playback — is the PCM file needed?

Do not put the PCM files away just because the session's `/COMPILE` has finished. Keep them in the same album until the work is done, so that `/PLAY` and `/MUB` can read the samples.

### Does `/RELEASE` delete the music I saved?

No. It tidies up the memory session and the management file; the MUC and MUB you saved remain.

## 16. Commands to remember

To begin with, knowing just the following sequence is enough.

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
```

To keep the result, run this command.

```text
MUCPLAY /MUB SONG.MUB
```

When the work is done, tidy up.

```text
MUCPLAY /RELEASE
```

The flow you will use most is **load → compile → listen → save → release**. Once you are comfortable with it, you can change repeat counts or connect it with MUCEDIT and work far more comfortably.

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
