# MUCPLAY User Guide

Compiling MUC files on an MSX, playing them through Makoto, and saving the finished music to a file

Written against: September 14, 2026 · MUCPLAY for YM2608 (Makoto)

---

## 1. Some things worth knowing first

MUCPLAY is a program that compiles and plays MUC files, the music source format of MUCOM88, on an MSX. You can run a MUC file directly and listen to it, or you can load the source into memory and then run compilation and playback as separate steps.

The second approach is convenient when you are revising music and checking the same song many times. Because the compiled data is kept in memory, you do not have to compile the whole source again every time you play it. When you get a result you like, you can save it as a MUB or VGM file.

You do not need to memorize every option from the start. Play one song first, then get comfortable with the three commands `/LOAD`, `/COMPILE`, and `/PLAY`.

This guide focuses on how to use MUCPLAY. It does not cover MUC syntax or detailed explanations of compile errors.

### The program names used in this guide

| Program | What it does |
|---|---|
| `MUCPLAY.COM` | Compiles and plays MUC, and saves the in-memory result as MUB or VGM. The subject of this guide. |
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
- [Saving as a VGM file](#9-saving-as-a-vgm-file)
- [Clearing memory and moving between albums](#10-clearing-memory-and-moving-between-albums)
- [Managing voice and PCM files](#11-managing-voice-and-pcm-files)
- [Using it with MUCEDIT](#12-using-it-with-mucedit)
- [Using it on openMSX](#13-using-it-on-openmsx)
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
MUCPLAY /VGM SONG.VGM
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

One of the configurations used for verification was a MegaFlashROM SCC+ SD together with Makoto. In that test setup the MegaFlashROM provides Nextor and the storage and mapper environment, while the device that outputs music is Makoto.

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
SONG.VGM
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
| `MUCPLAY /VGM SONG.VGM` | Generate a VGM from the compiled result | Output VGM |
| `MUCPLAY /RELEASE` | Release the session memory and delete the session file | Not needed |

Command options are not case-sensitive. This guide writes them in uppercase for legibility.

`/LOAD`, `/COMPILE`, `/PLAY`, `/MUB`, `/VGM`, and `/RELEASE` are step-by-step commands. At first, run them one at a time rather than mixing several action options on one line. The `/L` option, which specifies a repeat count, is attached to the playback or VGM-saving command.

The MUB and VGM examples include the extension. I recommend typing the output names you choose the same way.

## 5. Playing one song right away

This is the simplest way to run it.

```text
MUCPLAY SONG.MUC
```

This command reads the input MUC, compiles it, and plays it. Running the same command again reads the source and compiles it again as well.

This approach is convenient when you just want to hear a song. If you plan to save it as MUB or VGM afterward, use the session approach in the next chapter. **Do not treat a single direct run as a persistent session that has completed `/LOAD` and `/COMPILE`.**

### The preparation time before playback starts

Sound does not come out the instant you type the command. It takes time to read and compile the source, and, when needed, to transfer PCM into Makoto's sample memory.

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

The previous compile result is not kept separately. Only once the new compile has completed is there a result ready for the next `/PLAY`, `/MUB`, or `/VGM`.

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
| `/COMPILE` | Kept | New result generated | Does not save MUB/VGM |
| `/PLAY` | Kept | Kept | Does not save a music file |
| `/MUB` | Kept | Kept | Creates the specified MUB |
| `/VGM` | Kept | Kept | Creates the specified VGM |
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

The repeat count is judged from the progress of the reference channel that has the loop. In songs where channel lengths are structured unusually, the ending point may differ from what you expect.

### Stopping partway through

Pressing an ordinary character key or Esc during playback stops it and returns. Using a character key is more reliable than pressing only a modifier such as Ctrl or Shift.

Stopping is not the same as releasing the session. Stopping `/PLAY` does not discard the loaded source or the compile result. Run `/RELEASE` when you are completely finished.

Do not think of the playback stop key as a way to cancel VGM generation. File generation runs until the completion message and the return to DOS.

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

## 9. Saving as a VGM file

A VGM is a file recording in what order and at what time intervals the sound chip is controlled. It is not a recording of the final sound waveform the way a WAV is. To listen to the generated file you need a VGM playback program that supports the YM2608.

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /VGM SONG.VGM
```

There is no need to save a MUB file to disk beforehand. `/VGM` builds its output directly from the compile result in memory.

### Specifying how many playthroughs to save

```text
MUCPLAY /VGM SONG.VGM /L2
```

In MUCPLAY's VGM output, `/L2` means **two playthroughs' worth**. It does not mean two seconds.

| Specification | Extent of VGM generated |
|---|---|
| `/L` omitted | The default, one playthrough |
| `/L1` | One playthrough |
| `/L2` … `/L9` | The specified number of playthroughs |
| `/L0` or `/L` without a number | Does not create an endless file; treated as one playthrough |

When the song itself has no loop, it finishes at the end of the song. VGM generation also follows the loop and ending conditions of the original musical data.

### While the VGM is being made

The real time it takes to generate the file and the playing time of the music produced are not necessarily the same. Processing time varies with disk speed, memory, the song's content, and PCM size.

This operation uses a path that records the sound chip control into a file instead of driving the actual Makoto output. Hearing nothing from the speakers during VGM generation does not mean it failed. You can use this output path without Makoto hardware for actual playback, but the DOS and mapper environment is still required.

Do not change the disk or the mounted directory until the output finishes and you are back at DOS.

### What is `Total samples`?

The `Total samples` shown on completion is the reference value for the playing time recorded in the file. It does not indicate the MUC file size or the PCM file size.

Using VGM's time base, you can calculate the approximate playing time like this.

```text
playing time (seconds) = Total samples ÷ 44100
```

For example, `441000` is 10 seconds' worth. The value actually shown varies with the song and the repeat count.

Saving a VGM under the same name again also overwrites the existing file. To compare against an earlier output, separate the names as `SONG01.VGM`, `SONG02.VGM`, and so on.

## 10. Clearing memory and moving between albums

### When you finish working — `/RELEASE`

```text
MUCPLAY /RELEASE
```

Releases the current session's MUC, voice, and MUB data along with the management header memory, and deletes `MUCPLAY.SES`.

The original MUC kept on disk and any MUB and VGM files you already saved remain untouched. `/RELEASE` is not a command that deletes music files.

### What is `MUCPLAY.SES`?

It is a small management file used so that the same memory data can be found even when commands are run separately. The file itself does not contain the whole song.

So think of it this way.

- You cannot copy `MUCPLAY.SES` alone and restore the song on another computer or in another boot environment.
- After powering off or resetting, you cannot continue using the earlier memory session.
- To archive a song, save the MUC and, as needed, export a MUB or VGM as well.
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
| `/VGM` | Records the sound chip control needed for VGM playback, including sample transfer. |

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
6. Save the original source and, if needed, export MUB or VGM.

Leave the integration options and the return handling that the editor uses to the editor.
**Exporting a MUB or VGM and saving the edited MUC original are separate operations.** Even after exporting a music file, save the source you will edit next time separately in the editor.

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

### Listening, then keeping both MUB and VGM

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
MUCPLAY /MUB SONG.MUB
MUCPLAY /VGM SONG.VGM /L2
MUCPLAY /RELEASE
```

An example that saves the compile result into the MUB and records two playthroughs into the VGM. It does not fix the MUB's own playback count via `/MUB`.

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
MUCPLAY /VGM SONG.VGM
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

### Do I have to do `/MUB` before `/VGM`?

No. Both create their own output file from the compiled session.

### Does `/VGM /L5` save 5 seconds?

In MUCPLAY it is five playthroughs' worth. Do not mix it up with the same-named option in other programs. Write the output filename as well.

```text
MUCPLAY /VGM SONG.VGM /L5
```

### I used `/L0` but the song ends.

If the song data has no loop, it ends when all channels finish. Specifying infinite repeat means continuing to use the loop inside the song.

### Is it normal for memory to still be in use after stopping?

If you worked with the session approach, yes. The data is kept so you can play and export again. Run `/RELEASE` when you no longer need it.

### I went to another folder and back, and it cannot find the session.

Return to the directory where you created the session and work there. The management file and PCM's relative paths are affected by the current directory. It is better to finish and release the work in the previous folder before moving to a new one.

### I reset the machine but the `MUCPLAY.SES` file is still there.

That file alone cannot restore the song from memory. On a fresh boot, `/LOAD` the source and `/COMPILE` again before working. The session file is not an archived copy of the music.

### Should I include `MUCPLAY.SES` when distributing?

No. To distribute an editable source, prepare the MUC and the companion files it needs; to distribute a finished playable file, prepare a MUB or VGM. Also check that the MUB properly includes the PCM it needs.

### At which stage — compiling or playback — is the PCM file needed?

Do not put the PCM files away just because the session's `/COMPILE` has finished. Keep them in the same album until the work is done, so that `/PLAY`, `/MUB`, and `/VGM` can read the samples.

### Does `/RELEASE` delete the music I saved?

No. It tidies up the memory session and the management file; the MUC, MUB, and VGM you saved remain.

## 16. Commands to remember

To begin with, knowing just the following sequence is enough.

```text
MUCPLAY /LOAD SONG.MUC
MUCPLAY /COMPILE
MUCPLAY /PLAY
```

To keep the result, run whichever of these you need.

```text
MUCPLAY /MUB SONG.MUB
MUCPLAY /VGM SONG.VGM
```

When the work is done, tidy up.

```text
MUCPLAY /RELEASE
```

The flow you will use most is **load → compile → listen → save → release**. Once you are comfortable with it, you can change repeat counts or connect it with MUCEDIT and work far more comfortably.


