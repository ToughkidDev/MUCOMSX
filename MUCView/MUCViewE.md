# MUCVIEW User Manual

A viewer that opens MUC source on the MSX and compiles, plays and exports it to MUB on the spot

As of: 21 November 2026 · MUCVIEW v0.2

---

## 1. What MUCVIEW is

MUCVIEW opens a MUC file read-only. From where you are reading, the F1 menu calls MUCPLAY to compile the song, play it, or export it as a MUB. Afterwards you are back at the line you were looking at.

It is a separate program: MUCEDIT without the editing functions. It never changes the document, so there is nothing to save, and it writes no state file and no temporary file to disk. To change a song, use MUCEDIT.

It is handy when you want to

- skim a song you received and listen to it right away,
- pick a MUC file in a file manager (MM) and open it with RETURN,
- listen to songs on a disk that has no free space.

## 2. Requirements

- MSX2 or later (80-column screen), MSX-DOS 2 or Nextor
- 4 free memory-mapper segments (64 KiB, for the document). The file list uses 1 more (16 KiB); without it you type the file name.
- Compiling, playing and exporting need `MUCPLAY.COM` and `MUCPLAY.MXR` of the same release. They are looked up in the working folder, the folder MUCVIEW is in, and the PATH, in that order.
- To hear anything you need the same sound hardware as MUCPLAY (Makoto and so on). See the MUCPLAY manual.

Compiling and playing need as much mapper memory as MUCPLAY needs when run from the prompt. MUCVIEW gives back all of its own memory before it calls MUCPLAY and reads the document again when it comes back.

It cannot run on an MSX1, which has no 80-column screen: `MUCVIEW: MSX2 required.` is shown and the program ends. To play a MUC on an MSX1, use `MUCPLAY SONG.MUC`.

## 3. Starting

```text
MUCVIEW            choose from the file list
MUCVIEW SONG.MUC   open that file (if it does not exist: a message, then the file list)
```

To compile, play or export, start it **in the song's folder** and give **the file name only** (no path, no spaces, up to 24 characters), because the voice and PCM files a song uses are looked up in the working folder. A file opened with a path can be read, but compiling it gives this message:

```text
Compile: local name, no spaces. Start in song folder.
```

The recommended setup is `MUCVIEW.COM` somewhere on the PATH, and you change to the song's folder before starting it.

## 4. The screen

```text
MUCView v0.2 by ToughkidCST  |  SONG.MUC
(22 lines of the document)
F1 Commands  Ctrl+O Open  Ctrl+F Find  F3 Find next
```

The top line shows the file name, the 22 lines in the middle the document, and the bottom line the keys. Notices and error messages also appear on the bottom line; one that ends in ` Press a key.` goes away at any key.

## 5. Keys

| Key | Action |
| --- | --- |
| Cursor keys | Move the cursor |
| Ctrl+←, Ctrl+→ | Move by word |
| HOME / SELECT | Start / end of the line |
| Ctrl+HOME / Ctrl+SELECT | Start / end of the document |
| Ctrl+F | Find (type the text to look for) |
| F3 | Find next |
| Esc | Clear the mark of the text found (`[FOUND]`) |
| Ctrl+O | File list |
| F1 | Command menu |

When the text is not there, `Text not found.` is shown.

### The file list

It shows `*.MUC` in the working folder.

| Key | Action |
| --- | --- |
| ↑ ↓ | Choose |
| Ctrl+↑, Ctrl+↓ | Page |
| RETURN | Open |
| Esc | Cancel |
| Typing | Enter a file name on the `File:` line below |

With no MUC files, `No MUC files. Type a filename below.` is shown.

## 6. The command menu (F1)

F1 shows the two lines below; the next key chooses the command. Esc or any other key cancels.

```text
Q Quit          O Reload
1 Open/MUC      2 Compile    3 Play/Muc                4 Exp/MUB
```

| Key | Action |
| --- | --- |
| `1` | Open a file (file list) |
| `2` | Compile. MUCPLAY shows the result or the errors; a key takes you back to where you were. The compile result stays in memory. |
| `3` | Play. A document that has been compiled is played from that result at once; otherwise it is compiled and played in one go. Any key stops it and takes you back. |
| `4` | Export a MUB. Compile with `2` first. You are asked whether to put the PCM into the MUB. |
| `O` | Reload. Reads the file from disk again (the link to the compile result is dropped). |
| `Q` | Quit. Releases the compile result kept in memory and returns to DOS. |

### Compile (`2`)

The screen changes to MUCPLAY, which shows the compilation and its result. Errors are shown with MUCPLAY's wording and line numbers; the MUCPLAY manual and the MUC2MUB manual explain them.

```text
Press a key to return.
```

At a key MUCVIEW comes back with the same line, cursor and search text as before.

### Play (`3`)

- A document compiled with `2`: the compile result in memory is played at once.
- A document that has not been compiled: it is compiled and played in one go. No compile result is kept in memory in this case, so use `2` first if you want to export.

The song ends by itself after two passes; any key stops it earlier. Either way you are back where you were.

### Export a MUB (`4`)

```text
Include the PCM file in the MUB? (Y/N)
```

`Y` puts the `#pcm` file into the MUB (MUCPLAY's `/P`); `N` or Esc does not. A MUB without it reads the `#pcm` file from the MUB's folder when it is played. The output file is written to the working folder with the document's name and `.MUB`.

For a document that has not been compiled, `Compile this text first: F1 then 2.` is shown.

## 7. Opening from MM (Multi Mente)

With this line in MM's `MMRET.DAT`, RETURN on a MUC file opens it in MUCVIEW (`<TAB>` is a tab character):

```text
.MUC<TAB>MUCVIEW $C
```

In the viewer, F1 `3` plays; F1 `Q` quits and MM is back.

If you only want RETURN to play the song, keep `.MUC<TAB>MUCPLAY $C` as before. Associate `.MUC` with one of the two only.

Keep `MUCVIEW.COM`, `MUCPLAY.COM` and `MUCPLAY.MXR` together in a folder on the PATH.

## 8. What is left on disk and in memory

- **Disk:** MUCVIEW writes nothing. Only the `.MUB` exported with `4` appears. Opening, compiling and playing also work on a disk with no free space (exporting needs space).
- **DOS environment:** during a visit to MUCPLAY the position and the search text are kept in the items `MUCVIEW` and `MUCVIEWF`, which are removed on return. When the environment has no room, `No room in the DOS environment.` is shown and MUCPLAY is not called.
- **Memory:** a result compiled with `2` stays in memory as a MUCPLAY session and is released by `Q`. A MUCPLAY session made at the prompt before MUCVIEW was started is released on quitting as well.

## 9. CPU speed

MUCVIEW runs on the fast CPU while it is in use: 5.37 MHz on Panasonic MSX2+ machines, the R800 on a turbo R in Z80 mode, 8.06 MHz on a One Chip MSX. It puts the CPU back when it ends or calls MUCPLAY. A machine that was already fast is left as it is.

## 10. Messages

| Message | Meaning and what to do |
| --- | --- |
| `MSX-DOS2 required.` | It does not run under MSX-DOS 1. |
| `MUCVIEW: MSX2 required.` | It cannot run on an MSX1. Play with `MUCPLAY SONG.MUC`. |
| `MUCVIEW needs four free mapper banks (64 KiB).` | Fewer than 4 free mapper segments. Free the memory used by other programs or by a MUCPLAY session (`MUCPLAY /RELEASE`). |
| `MUCVIEW needs more free TPA memory.` | Resident programs take much of the TPA. Remove them and start again. |
| `Open failed.` | The file could not be opened. Check the name and the folder. |
| `Text exceeds 60000 bytes; not loaded.` | The document is over 60,000 bytes after line-end normalization. The previous document is kept. |
| `Need 64 KiB free mapper RAM to load.` | Not enough memory to read the document. |
| `Open a MUC file first.` | Compile or play was chosen with no document open. |
| `Compile this text first: F1 then 2.` | Export was chosen before compiling. |
| `Compile: local name, no spaces. Start in song folder.` | The name has a path, contains spaces or is longer than 24 characters. Open the file by name only, from the song's folder. |
| `MUCPLAY.COM not found.` | No MUCPLAY in the working folder, MUCVIEW's folder or the PATH. |
| `Use the matching /E3 MUCPLAY.COM.` | MUCPLAY is of another generation. Use MUCPLAY and MUCVIEW of the same release. |
| `MUCVIEW.COM must be in this folder or on the PATH.` | MUCPLAY would not find MUCVIEW to come back to. |
| `No room in the DOS environment.` | No room for the item that carries the position. Remove environment items you do not need. |

## 11. Limits

- A document may be up to 60,000 bytes after line-end normalization.
- No editing, saving, undo or clipboard.
- There are no page keys. Use Ctrl+HOME/SELECT and Find to go far.
- MUCPLAY, MUCEDIT and MUCVIEW must be of the same release.
