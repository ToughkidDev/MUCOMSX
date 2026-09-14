# MUCEdit User Guide

## Edit, compile, and listen to MUC music on your MSX

**MUCEdit v0.8 by ToughkidCST**  
Document date: September 14, 2026

MUCEdit is a text editor for opening and editing MUCOM88 MUC files directly on an MSX. Used together with MUCPLAY, it lets you compile and hear the song without leaving the editor, then go straight back and keep working. You can also export a finished song as MUB or VGM.

You do not need to memorize every command up front. Open a file, change one thing, compile it, and listen. This guide is arranged in that order. The later sections cover MUC syntax, errors and warnings, and what to check when something goes wrong.

Before you start, please keep one thing in mind.

> **Saving, compiling, and playing are three different operations.**  
> Saving updates the original MUC file. Compiling turns the current editing buffer into playback data. Playing plays back the most recent compile result.

Once that distinction is clear, MUCEdit becomes much easier to use.

---

## Table of contents

1. [What MUCEdit and MUCPLAY each do](#01)
2. [Requirements and the files to prepare](#02)
3. [First run: hearing a song](#03)
4. [Reading the screen and the cursor](#04)
5. [Opening files and the file list window](#05)
6. [Save, new, reload, exit](#06)
7. [Cursor movement and block selection](#07)
8. [Copy, cut, paste, and line editing](#08)
9. [Undo and Redo](#09)
10. [Finding text and making partial edits](#10)
11. [The full F1 menu](#11)
12. [Compiling and playing without saving](#12)
13. [Exporting MUB and VGM](#13)
14. [The basic structure of a MUC file](#14)
15. [Notes, lengths, octaves, tempo](#15)
16. [Voices, volume, pan, per-channel expression](#16)
17. [Repeats, macros, advanced commands](#17)
18. [Complete examples to type in](#18)
19. [How to read a compile error](#19)
20. [Compile error codes and what triggers them](#20)
21. [Warning messages and invalid input](#21)
22. [Editor messages and how to recover](#22)
23. [Memory, file size, and character handling limits](#23)
24. [Frequently asked questions](#24)
25. [Working safely and updating](#25)
26. [Keyboard shortcut quick reference](#26)
27. [Scope of this document](#27)

<a id="01"></a>
## 1. What MUCEdit and MUCPLAY each do

The names are similar, but the jobs are not.

| Component | What it does |
|---|---|
| `MUCEDIT.COM` | Editing MUC text, file I/O, block selection, search, undo/redo, the command menu |
| `MUCPLAY.COM` | Loading and compiling MUC, playback, MUB/VGM output, showing compile results and errors |
| `MUBPLAY.COM` | A standalone player for already-compiled `.MUB` files. For Makoto (YM2608) |
| `.MUC` | The human-readable, editable source text of a song. Can be played directly from DOS with `MUCPLAY SONG.MUC`, which compiles it internally and then plays it. |
| `.MUB` | Compiled song data. Includes voices, tags, and PCM as needed, and can be played directly from DOS with `MUBPLAY SONG.MUB`. |
| `.VGM` | A file recording the sound chip commands and timing of a playback. Can be played directly from DOS with `VGMPLAY SONG.VGM`. |

In the commands above, `SONG.MUC`, `SONG.MUB`, and `SONG.VGM` are examples. Substitute the name of the file you actually want to hear. Each player also needs a runtime environment that supports that song's sound chip.

MUCEdit alone is enough to edit and save text. To use Compile, Play, and Export from the F1 menu, you need a compatible MUCPLAY alongside it. You do not need to run a separate `MUC2MUB.COM` for this — the compiler is part of MUCPLAY.

MUBPLAY is for listening to a finished MUB on its own. For example, if you exported `SONG.MUB` with F1→4 in MUCEdit, you can play it from DOS with `MUBPLAY SONG.MUB`. It is a separate program from the MUCPLAY that MUCEdit's F1 menu invokes, and it plays no part in editing or compiling MUC source.

MUCEdit is not a port of Windows VS Code to the MSX. It is an MSX editor arranged so that you can use familiar editing keys as much as possible. Features such as tabbed multi-file editing, multiple cursors, mouse selection, and the operating system's shared clipboard are not the same here.

<a id="02"></a>
## 2. Requirements and the files to prepare

### 2.1 Basic environment

- An MSX2 or later environment capable of an 80-column text screen
- An MSX-DOS2-class runtime and memory mapper support, 512KB recommended (MegaFlashROM SCC SD+, Carnivore2, and similar)
- A readable and writable disk or storage device
- For playback, a sound device supported by MUCPLAY (Makoto YM2608)

The representative environment used for integration testing was:

```tex
Panasonic_FS-A1WX
MegaFlashROM_SCC+_SD
MAKOTO
MSX-DOS2 / Nextor
```

For practical use, plan around **a machine with a 512 KiB-class main mapper**. That is the configuration used for integration testing, not a strict minimum-RAM guarantee for every model and DOS configuration. DOS, resident programs, and the song session currently being held also consume memory, so installed RAM alone does not determine whether things will run.

Also, having a built-in PSG in your MSX is a separate matter from having the playback device MUCPLAY requires. The baseline playback environment in this guide is the YM2608 in MAKOTO. For other sound configurations, check what your particular MUCPLAY build supports.

### 2.2 Keep the files in one directory to start with

At first, a per-song folder like this is recommended.

```text
SONG/
  MUCEDIT.COM
  MUCPLAY.COM
  SONG01.MUC
  SONG02.MUC
  VOICE.DAT
  PCM01.BIN
```

What matters in practice is the filename as DOS sees it. Rather than long host-side names, **short 8.3-format names** are the safe choice. Organize them as `SONG01.MUC`, `VOICE.DAT`, `PCM01.BIN`, for example. If you rename anything, update the file references inside the MUC to match.

If the song contains the tags below, those files are required.

```text
#voice VOICE.DAT
#pcm PCM01.BIN
```

If you bring in a different voice or PCM file that merely has a similar name, the song may compile and still sound completely wrong. Use the files that came with the song.

### 2.3 Notes on filenames and paths

- Direct filename entry in the editor is limited to 63 bytes.
- **The document name and path used for compile integration are limited to 24 bytes and cannot contain spaces.**
- The compiler's FCB paths for reading voice and PCM files are subject to the DOS 8.3 name constraints. Do not assume a long name will be handled as typed.
- Entering a different path in the file list window does not change the DOS current directory.
- In particular, opening only a MUC from another folder by path makes it easy to lose track of where the voice, PCM, and MUCPLAY files are. At first, `CD` into the song folder and run from there.

### 2.4 The disk must be writable

Even a compile that does not save the original MUC uses a temporary file, so integration work is limited on a read-only disk.

About 33 KiB is needed for the state file, space equal to the current document size for the temporary MUC, and exporting requires additional space for the MUB or VGM. Songs with large PCM produce large result files. Do not assume that "the original MUC is a few KB, so a few KB free is enough" — leave yourself plenty of room.

<a id="03"></a>
## 3. First run: hearing a song

From DOS, move to the directory containing the song.

```text
CD SONG
MUCEDIT SONG01.MUC
```

To start with an empty document, omit the filename.

```text
MUCEDIT
```

After it starts, try this sequence.

1. Check that the file's contents appear on screen.
2. Press `F1`, then press `2` to compile.
3. Read the result screen for errors or warnings.
4. Follow the prompt and press any key to return to the editor.
5. Press `F1`, then press `3` to play.
6. Press any key to stop partway through.
7. When the result screen shows the return prompt, press a key again to go back.

Here, `F1→2` does not mean pressing F1 and the digit 2 at the same time. It means **press F1 to open the menu, then press the digit 2**.

Now change one thing and do **F1→2 again, then F1→3**. If you like the change, save it with `Ctrl+S`.

<a id="04"></a>
## 4. Reading the screen and the cursor

The screen is 80 columns, with the editing area between the title row at the top and the status row at the bottom.

### The title row

```text
MUCEdit v0.8 by ToughkidCST  |  SONG.MUC*
```

- The filename is shown. If the document has no name yet, it is shown as an unnamed document.
- The `*` after the filename means there are unsaved changes.
- If there is a selection, a `[SELECT]` indicator is added.
- With a long filename, the information at the end of the title row may not all be visible.

### The cursor and a block are not the same thing

The cursor is the thin vertical bar showing where characters will be inserted. In the current v0.8 implementation, the cursor blinks while waiting for input and becomes immediately visible when you move it. **The inverse video of a selected block does not blink.** Please distinguish a blinking cursor from a whole block disappearing.

A selected line break is shown as one blank cell at the end of the line. A selection indicator can also appear on an empty line, which means you have selected that empty line's line break.

### Long lines

A long MML line can continue off to the right. Moving the cursor scrolls horizontally. Text not visible at the right edge of the screen has not been deleted.

The 80-column screen width and the compiler's per-line length limit are separate matters. When you split a long line into several lines for readability, be sure to put a channel letter on each new line.

<a id="05"></a>
## 5. Opening files and the file list window

Use `Ctrl+O` or `F1→1 Open/MUC`.

The `*.MUC` files in the current directory are shown in a single-column list window, with a field below it where you can type a filename directly.

| Key | What it does in the file list window |
|---|---|
| `↑` / `↓` | Select the previous or next file |
| `Ctrl+↑` / `Ctrl+↓` | Previous or next page |
| `Home` / `End` | First or last entry on the current page |
| `Enter` | Open the selected file, or the name you typed |
| `Esc` | Cancel and return to the editing screen |
| Typing characters | Enter a filename or path directly instead of using the list selection |
| `Backspace` / `Delete` | Delete the last character of the typed name |

Up to 16 entries are shown per page. That does not mean only 16 files are read in total. Moving past the end of the list, or using the page keys, looks up further entries.

Things worth knowing:

- The list is in **DOS directory search order**. It is not sorted by name.
- It is not a file manager that browses subdirectories. You can type any path you need directly.
- Once you start typing characters, the typed name is used instead of the list selection.
- Direct entry works even when no files are listed. Pressing Enter on an empty list with no name typed will not open anything.
- If working memory for the list is short, it may fall back to direct filename entry.

If there are unsaved changes, you are first asked `Unsaved changes. Discard? (Y/N)`. Press `Y` only when discarding is fine. After that, if you cancel out of the list window with Esc, or reading the new file fails, the current document is preserved.

<a id="06"></a>
## 6. Save, new, reload, exit

### Save: Ctrl+S

Saves the current document under its current name. If the document has no name, you are prompted for a filename. On a successful save, the unsaved indicator is cleared.

Saving to an existing name updates the existing file. If you want to keep the original for comparison, save under a different name first. There is no automatic backup file created in case a save fails.

### Save as: Ctrl+Shift+S

Saves the current contents under a different filename. For example, saving a distributed `BOS010.MUC` as `BOS010A.MUC` before editing makes it easy to compare against the original.

After changing to a new name, compile again before playing or exporting. A compile result tied to the previous filename is not treated as the result for the new document.

### New document: Ctrl+N or F1→A

Starts a new, empty document. If there is unsaved content, you are asked whether to discard it.

`F1→N Save/New` **saves the current document first** and then starts a new one. Do not look only at the letter `N` and assume it is a plain New.

### Reload: F1→O Reload

Re-reads the file with the current name from disk. Use it to discard unsaved edits and return to the last saved version. If there are unsaved changes, you are asked to confirm.

Reload is not Undo. Re-reading the file puts you in the state of having newly opened that document, so do not expect the previous edit history to still be available.

### Exit

| Command | Behavior |
|---|---|
| `F1→E Save/Exit` | Save, then exit |
| `F1→Q Quit` | Exit without saving. Confirms if there are unsaved changes |

In a session that invoked MUCPLAY, exiting may be followed by work to release mapper memory held on the player's side. If the exit message lingers a moment, do not reset immediately — wait until you are back at the DOS prompt.

<a id="07"></a>
## 7. Cursor movement and block selection

### Basic movement

| Key | Action |
|---|---|
| `←` / `→` | Move one character |
| `↑` / `↓` | Move to the previous or next logical line |
| `Home` / `End` | Start or end of the current line |
| `Ctrl+Home` / `Ctrl+End` | Start or end of the document |
| `Ctrl+←` / `Ctrl+→` | Move by word |

When moving up and down, the original column position is preserved where possible. Passing through a short or empty line may leave you briefly at the end of that line.

On a real MSX keyboard, **HOME corresponds to Home and SELECT to End**. An emulator's PC keyboard mapping may differ depending on its settings.

### Block selection

To take a block, **hold Shift while moving the cursor**.

| Key | Selection range |
|---|---|
| `Shift+←/→` | By character |
| `Shift+↑/↓` | Extend across lines |
| `Shift+Home/End` | From the current position to the start or end of the line |
| `Ctrl+Shift+←/→` | By word |
| `Ctrl+Shift+Home/End` | To the start or end of the document |
| `Ctrl+A` | The whole document |
| `Ctrl+L` | The current line |

For example, to change the number in `t225`, move to just before or after the digits, select them with Shift and the arrow keys, then type the new number. The selected part is replaced by what you type.

With a selection active, pressing left without Shift moves to the selection's start and pressing right moves to its end, clearing the selection. You can also clear the selection with Esc.

MUCEdit's selection is ordinary contiguous text selection. Rectangular column selection and multiple cursors editing several places at once are not supported.

<a id="08"></a>
## 8. Copy, cut, paste, and line editing

### Basic editing

| Key | Action |
|---|---|
| `Ctrl+C` | Copy the selection. With no selection, copy the current line |
| `Ctrl+X` | Cut the selection. With no selection, cut the current line |
| `Ctrl+V` | Paste the clipboard contents |
| `Backspace` | Delete the character before the cursor. With a selection, delete the selection |
| `Delete` | Delete the character after the cursor. With a selection, delete the selection |
| `Enter` | Insert a line break |
| `Tab` | Insert a tab character |

The clipboard is internal to MUCEdit and holds at most 4 KiB. Content copied on Windows or macOS is not automatically bridged to Ctrl+V. To bring in content from the host, use your emulator's text-input feature or something similar.

A tab is stored as an actual tab byte, not converted to a few spaces. In particular, indenting with a tab before a channel letter can prevent the line from being recognized as an MML channel line, so take care.

### Line-level editing

| Key | Action |
|---|---|
| `Ctrl+Shift+K` | Delete the current line |
| `Ctrl+Enter` | Insert a new line below the current line |
| `Ctrl+Shift+Enter` | Insert a new line above the current line |
| `Graph+↑/↓` | Move the current line up or down |
| `Shift+Graph+↑/↓` | Duplicate the current line up or down |

Graph is the GRAPH key on the MSX keyboard. It corresponds to the Alt-based line move and duplicate in VS Code on a PC.

Line move and duplicate do not overwrite the clipboard. These operate on **the current logical line the cursor is on**. Selecting several lines does not make the whole selection move together.

Duplicating a line is handy when making one more similar phrase. Note that the duplicated line plays after the original within the same channel. If you want it to play simultaneously on another channel, change the channel letter on the duplicated line too.

<a id="09"></a>
## 9. Undo and Redo

- `Ctrl+Z`: Undo the last edit
- `Ctrl+Y`: Redo the undone edit

Undo/Redo state is preserved along with the document even after you compile or play and return to the editor. The saved/unsaved state is tracked too, so undoing back to the last save point can clear the unsaved indicator.

That said, **undo is not unlimited.** The current history area is 4 KiB, and it holds the before-and-after text together with bookkeeping information. So it cannot be described as a fixed "you can always undo N times."

- When the history area fills up, the existing history is cleared and new history is recorded.
- If a single change is itself larger than the history area, that change cannot be undone and prior history may be cleared as well.
- Editing new content after an undo discards the existing redo path.
- Opening a file, or New/Reload, does not preserve the previous document's undo history.

Before deleting a large block or rewriting a whole long phrase, save under a different name. I would not treat Undo as a substitute for a backup.

<a id="10"></a>
## 10. Finding text and making partial edits

Press `Ctrl+F`, type the string to find, and press Enter. The match is selected. Find the next occurrence of the same string with `F3`. On reaching the end of the document, the search wraps to the beginning.

The current search is **an ordinary case-sensitive string search**. There is no regular expression search and no replace-all.

You can, however, do partial replacement like this.

1. Find `t225` with `Ctrl+F`.
2. Confirm the match is selected.
3. Type `t200` to replace it.
4. If needed, fix other occurrences the same way.

Typing directly over a search selection replaces that range. If you only meant to find something, clear the selection with an arrow key or Esc before typing.

<a id="11"></a>
## 11. The full F1 menu

Pressing F1 shows these two rows.

```text
E Save/Exit     Q Quit       S Save      N Save/New    A Discard/New   O Reload
1 Open/MUC      2 Compile    3 Play/Muc                4 Exp/MUB       5 Exp/VGM
```

| Key | Menu name | Description |
|---|---|---|
| `E` | Save/Exit | Save, then exit |
| `Q` | Quit | Exit without saving. Confirms if needed |
| `S` | Save | Save the current document |
| `N` | Save/New | Save, then start a new document |
| `A` | Discard/New | Discard the current document and start a new one. Confirms if needed |
| `O` | Reload | Re-read the file with the current name from disk |
| `1` | Open/MUC | Open via the file list window or direct entry |
| `2` | Compile | Compile **the editing buffer currently in memory** |
| `3` | Play/Muc | Play the most recent compile result |
| `4` | Exp/MUB | Save the most recent compile result as MUB |
| `5` | Exp/VGM | Output the most recent compile result as VGM |

Pressing Esc in the menu returns without running a command. `O` is the letter O, not the digit 0.

<a id="12"></a>
## 12. Compiling and playing without saving

### 12.1 It compiles even without saving

F1→2 is not a command that re-reads the original MUC from disk and compiles that. It compiles **the document you are editing right now inside the editor**.

For example, if the file on disk says `A t225` and you changed it on screen to `A t125`, F1→2 should use `t125` even without saving. The original MUC is still `t225`, and the unsaved indicator in the title stays.

If a new document has no name yet, the compile process may ask you for one. Assigning a name and actually saving the original MUC are separate things. **Do not assume that a successful compile means a new MUC file was saved.** Anything you want to keep must be saved with Ctrl+S.

### 12.2 Why does MEDCOMP.MUC appear?

MUCPLAY's compiler takes a file as input. The editor writes the in-memory document to a temporary file named `MEDCOMP.MUC` in the current directory and hands that over.

It also keeps the state needed to return to the editor in `MUCEDIT.RET`. On a normal return, the temporary input and the return-state file are cleaned up. These files are not ordinary saved files standing in for the original MUC.

If a `MEDCOMP.MUC` of the same name already exists, the compile is aborted rather than overwriting it blindly. For what to do when you see the conflict message, see [the recovery notes](#22).

### 12.3 Play does not compile for you

```text
edit → F1, 2 → check the result → press a key to return → F1, 3
```

Remember this order. If you edit and then press only F1→3, you hear **the previous compile result**. That is not because you failed to save unsaved content, but because you have not compiled again yet.

MUCEdit's Play runs with `/L2`. For looping songs, it requests that playback end after two playthroughs. Which part repeats is determined by the song's `L` point and each channel's ending structure, so this does not mean every song restarts identically twice from the beginning of the file to the end.

### 12.4 If you get an error

Read the error screen, return to the editor, fix it, and compile again. A failed compile is not treated as a new valid session. Attempting to play may produce an error saying there is no compiled result.

`Compiled into session.` is the message announcing a successful compile. But you also need to look at **whether there were any Warnings before it**. Seeing only the success message and skipping past a warning can leave you listening to a song you did not intend.

<a id="13"></a>
## 13. Exporting MUB and VGM

### 13.1 MUB: F1→4

Saves the most recently compiled session as a MUB file. If the document is `SONG.MUC`, the name used is normally `SONG.MUB`.

A MUB contains the compiled song data and the necessary voices and tags, plus the PCM bank for songs that use PCM. **Creating a MUB does not save the original MUC.** If you want to keep the source as well, use Ctrl+S too.

To produce a MUB reflecting your edits, you must recompile with F1→2 first. If you want to compare against a previous output, keep the existing MUB under a different name. Exporting does not do version control or backups for you.

### 13.2 VGM: F1→5

Outputs the most recent compile result as a stream of sound chip commands and timing. The default output name for `SONG.MUC` is `SONG.VGM`.

VGM is not a recorded audio file like WAV or MP3. It needs a VGM playback environment that supports the recorded chip commands, such as those of the YM2608. Nor is it a source file for composing by editing text the way MUC is.

The VGM export in the MUCEdit menu does not simply reuse Play's `/L2`. Because it passes no separate loop count, it uses the current MUCPLAY default for VGM, which is **a single playthrough**. Large songs and songs with PCM can take a while to write out, so wait until you see the completion message.

### 13.3 Checks before exporting

1. Are all the edits you wanted finished?
2. Did you recompile in that state?
3. Did you check the warnings, not just the errors?
4. Are you using the correct PCM and voice files?
5. Have you also saved the source MUC separately?
6. If you need to preserve an existing output file, did you keep it under another name first?

<a id="14"></a>
## 14. The basic structure of a MUC file

A MUC is a text file that writes a song in MML. As a rule it reads most easily when laid out as **header → voice and macro definitions → per-channel performance data**.

### 14.1 Header tags

```muc
#mucom88 1.7
#title My First Song
#composer ToughkidCST
#author ToughkidCST
#date 2026/09/14
#comment First test on MSX

D t200 C128 o4 l8 v10 cdefgab>c4
```

| Tag | Purpose |
|---|---|
| `#title` | Song title |
| `#composer` | Composer |
| `#author` | Production credit such as the MUC author or arranger |
| `#date` | Date information |
| `#comment` | Description or comment |
| `#mucom88` | MUCOM88-related version information |
| `#voice` | Specifies an external FM voice file |
| `#pcm` | Specifies a PCM bank file |
| `#driver`, `#version`, `#uuid`, `#mucmd5` | Compatibility metadata |

Tag names are not case-sensitive, but I recommend getting into the habit of writing **the exact name immediately after `#`, with the value separated by a space**. `#title: My Song`, `# title My Song`, and `#tittle My Song` are not the same tag.

Writing metadata does not automatically select a driver or compiler version by that name. The actual interpretation and playback depend on the MUCPLAY that is running.

Keep functional tags such as `#voice` and `#pcm` together in the header at the very top of the file. If you write ordinary comments or body text first and add a functional tag later, it may be ignored as a tag outside the initial header. In particular, it is safest **not to defer a functional tag past a semicolon comment or a line containing whitespace characters**.

`#tempo` is not a currently known tag. Specify tempo with the channel's `t` or `T` command.

### 14.2 Channels A–K

| Channel | Sound source |
|---|---|
| A, B, C | FM 1, 2, 3 |
| D, E, F | SSG 1, 2, 3 |
| G | Rhythm |
| H, I, J | FM 4, 5, 6 |
| K | ADPCM/PCM |

It is easy to assume the FM channels run continuously from A through F, but they do not. **D, E, and F are SSG, and H, I, and J are the remaining FM channels.**

A channel line must begin with an uppercase A–K at the very start of the line, followed by a space or tab.

```muc
D o4 l4 cdef
E o3 l4 c r g r
D gab>c
```

In this example the two D lines continue one another. E proceeds on its own channel. Moving to the next line of the same channel does not automatically reset octave, length, or volume.

The forms below are not valid channel lines.

```text
 D cdef       ; leading space
d cdef        ; lowercase channel letter
Dcdef         ; no space/tab after the channel
DE cdef       ; not a valid two-channel-at-once form
ABCD          ; just a string of characters
```

Even if you want to indent for alignment, **leave the channel letter itself at the very start of the line.** Use spaces between musical commands to keep things readable.

### 14.3 Comments

Use `;` for notes.

```muc
; Main melody
D o4 l8 cdef ; first phrase
D gab>c4    ; second phrase
```

Do not write prose into the body with no marker. The current compiler cannot interpret it as a performance line and may warn about it. Comments also help a great deal when you come back to revise the song later.

<a id="15"></a>
## 15. Notes, lengths, octaves, tempo

### 15.1 Notes and rests

`c d e f g a b` are C, D, E, F, G, A, B. Notes are written in lowercase.

- `c+`: C sharp
- `d-`: D flat
- `r`: rest

```muc
D o4 l8 c c+ d d- e r g r
```

MML changes meaning with case. `c` is a note but `C` is the base clock; `r` is a rest but `R` is a separate effect command.

### 15.2 Lengths

| Notation | Meaning |
|---|---|
| `l4` | Set the default length for notes without a number to a quarter note |
| `l8` | Set the default length to an eighth note |
| `c4` | Play this C as a quarter note |
| `c8` | Play this C as an eighth note |
| `c4.` | Dotted quarter note |
| `r8` | Eighth rest |

```muc
D o4 l8 c d e4 f8 g4. r8
```

With `C128`, a whole note is divided into 128 clocks. Then `l4` is 32 clocks and `l8` is 16 clocks. The default base is also 128, but when merging a phrase taken from elsewhere, check that the `C` values match.

You can also specify clocks directly with `%`. For example, `c%12` sets this note to 12 clocks. Normally, start with notation like `l4` and `l8`, and use direct clocks when you need to line up fine rhythms.

Do not use a length of zero. Input that cannot produce a valid note length, such as `l0`, is an error. Also avoid giving a denominator so much larger than the base clock that the length becomes zero.

### 15.3 Octaves

- `o4`: octave 4
- `>`: raise by one octave
- `<`: lower by one octave
- Explicit octave range: `o1` through `o8`

```muc
D o4 l4 c d e f >c <g
```

When you split notes across several lines, a `>` on a previous line still affects the next one. If a phrase you moved or pasted sounds like it is in the wrong register, start by checking the octave state before it.

### 15.4 Ties and extending length

`&` is used for a tie joining to the next note. Start by learning it as a way to hold the same note longer.

```muc
D o4 l4 c4&c4 d4 e4
```

`^` is a separate notation that adds to the length of the preceding note. Write things clearly with `&` at first, and when you edit a `^` that appears in an existing song, look at the relationship between the preceding note and its length at the same time.

### 15.5 Tempo: t and T are different

| Notation | Meaning |
|---|---|
| `t225` | Direct Timer-B value. **This does not mean 225 BPM** |
| `T120` | BPM-style tempo. Converted internally to a Timer-B value |

```muc
D T120 C128 o4 l4 cdefgab>c
```

Existing MUCOM88 songs make heavy use of direct `t` values. Because `T` is affected by internal integer conversion and the clock setting, it is not a display that guarantees exactly the same measured value as another player's BPM readout.

Tempo affects the song's playback clock. Rather than scattering different tempos across several channels, I recommend managing it clearly in one place. When comparing tempos in an existing song, also look for another occurrence of the same command on a different line.

<a id="16"></a>
## 16. Voices, volume, pan, per-channel expression

### 16.1 Volume: v

`v` sets volume. However, the handling and the practical valid range differ by channel type.

```muc
D o4 l8 v8 cdef v12 gab>c4
```

For SSG, starting in the 0–15 range is easiest to reason about. For FM as well, take the `v` settings of an existing song as your baseline and adjust in small steps. The K channel uses byte-level ADPCM volume, so entering the same number as for FM or SSG will not sound equally loud.

`)` increases volume and `(` decreases it. There are also forms that take a number to specify the amount of change. Giving too large a value does not simply make things louder or quieter as you expect — it can run outside each channel's byte-level handling range, so change things gradually and listen.

### 16.2 Note length versus sounding length: q

`q` sets how early the note is cut off before its end. **q0 is essentially the side that holds to the end of the note.** Do not confuse it with the proportional notation used in other MMLs, where "q8 means 8/8 length."

```muc
D o4 l8 v10 q0 cdef q4 gab>c
```

The total time of the notes stays the same, but the parts with q feel slightly detached at the end. Effects from ties, envelopes, and channel type also come into play.

### 16.3 Pan: p

The basic pan for FM and ADPCM is `p1` right, `p2` left, `p3` both. `p0` can be a setting that turns off both outputs, so always check it when you get no sound.

SSG has no independent hardware pan of the same kind. Do not expect writing `p` on an SSG channel to produce the same left/right movement as on FM.

### 16.4 FM voices: @

On an FM channel, `@1` selects voice number 1. An external voice file, or a voice definition in the source, must provide something for that number.

External files are specified in the header.

```text
#voice VOICE.DAT
```

At present, a single song can use at most 32 distinct FM voices. Distinguish the voice number itself from "how many kinds of voice this song used."

A basic voice definition written directly in the source has this structure.

```text
  @number
   FB, ALG
  AR, D1R, D2R, RR, D1L, TL, KS, ML, DT
  AR, D1R, D2R, RR, D1L, TL, KS, ML, DT
  AR, D1R, D2R, RR, D1L, TL, KS, ML, DT
  AR, D1R, D2R, RR, D1L, TL, KS, ML, DT
```

The `@number:{ ... }` form is also used. The first two values are feedback and algorithm, and the following four lines are the parameters of each operator. Reordering the values gives a different voice. When editing an FM voice for the first time, copy a known-good definition and change one entry at a time.

Distinguish the `@` of a voice definition line from **the `@` voice-select command inside a channel line**. Inside a channel, `A @1 c` selects a voice rather than defining one.

### 16.5 SSG

SSG is channels D, E, and F. Beyond the basic note, length, octave, and volume, it uses commands in the following families.

| Command | Purpose |
|---|---|
| `@n` | Select an SSG preset. Not the same data as an FM voice number |
| `P1` | Enable tone |
| `P0` | Turn off mix output |
| `wN` | Set the noise period |
| `E...` | Software envelope. Six values separated by commas |
| `SN` | Hardware envelope shape |
| `mN` | Hardware envelope period |

Changing presets and envelopes all at once makes it hard to tell which setting changed the sound. Check that a simple SSG melody plays correctly first, then add one item at a time.

### 16.6 Rhythm: G

G is not an ordinary melody channel but the rhythm channel. Do not think of it as a channel where the FM and SSG volume and voice commands apply as-is.

For instance, G's `v` uses a **seven-value form** listing the overall and per-instrument rhythm volumes separated by commas. Writing `G v12 c` in the single-value form used for ordinary melody can produce separator or argument errors.

When building a rhythm part for the first time, start from the G channel of a song that plays correctly, keep its instrument selection and volumes, and adjust the lengths first.

### 16.7 PCM: K

The K channel is used to select and play PCM samples. What `@n` means, and what you actually hear, depends on the PCM bank in use.

```text
#pcm PCM01.BIN
```

This tag is not merely descriptive; it specifies the file to use. Removing the `#` loses the PCM specification, and the default name `MUCOMPCM.BIN` may be looked for instead.

The compile stage is not the stage that transfers PCM to the sound chip. PCM problems may only surface when playing or when embedding into a MUB. Do not conclude that "the compile succeeded, so the PCM must be fine too."

<a id="17"></a>
## 17. Repeats, macros, advanced commands

### 17.1 Repeat: [ ]

```muc
D o4 l8 [cdef]2 gab>c4
```

Plays `cdef` twice, then proceeds to the following phrase. I recommend writing the repeat count explicitly. The opening `[` and closing `]` must be balanced.

### 17.2 Escaping on the last repeat: /

```muc
D o4 l8 [c d / e f]2 g4
```

On the final pass, the repeat body after `/` is skipped and playback continues past the repeat. `/` must be used inside a repeat, and do not put more than one in the same repeat.

Repeats nest up to 16 levels. Rather than nesting very deeply, it is usually better to split things into reasonable lengths for readability.

### 17.3 Song loop point: L

```muc
D o4 l8 cdef L gab>c
```

`L` sets the song loop point for that channel. It is different from `[ ]`, which simply repeats a stretch of text. When looping several channels, you also need to align each channel's phrase lengths and loop positions.

The editor's two-playthrough Play limit and the source's `L` play different roles. `L` is the loop position within the song; `/L2` is the option that sets how many playthroughs the player performs.

### 17.4 Macros

A phrase you use repeatedly can be defined by number rather than by name.

```muc
# *1{o4 l8 cdef}
# *2{gab>c4}
D v10 *1 *2
```

`# *1{...}` is the definition, and `*1` inside a channel is the call. Calling an undefined number, or failing to close the brace, is an error.

The current safe limits are 511 bytes for a macro body and 4 levels of call nesting. A macro that keeps calling itself is also not a valid way to write a song. Keep in mind that when an error occurs inside a macro, **the calling channel line may be shown rather than the definition line**.

### 17.5 Portamento

```muc
D o4 l4 {c>c}4 d4
```

This notation slides between the notes inside the braces. It uses the same characters as a macro definition's braces, but plays a different role. When editing an existing phrase, check the brace positions together with the length specification that follows.

### 17.6 Advanced command quick guide

Below are commands you often meet when reading existing songs. It is a table for finding out "roughly what this symbol controls," not a claim that every channel takes the same arguments.

| Command | Purpose and caveats |
|---|---|
| `DN` | Detune. The effect of the value differs by sound source type |
| `KN`, `kN` | Transposition family. Sets absolute/relative transposition state |
| `sN` | Shuffle; alternating note-length adjustment |
| `VN` | Overall volume offset family |
| `Mdelay,speed,depth-step,depth` | The four-argument form of the software LFO. Write it with numbers and commas |
| `MF0`, `MF1` | Turn the software LFO off and on |
| `MW`, `MC`, `ML`, `MD`, `MT` | Partial LFO settings. Check each command's arguments and channel restrictions |
| `H...` | Hardware LFO. Separate from the software LFO, with channel restrictions |
| `yregister,value` | Direct register writes. Use with care, as it can change other sound settings |
| `yTL,operator,value` and similar | Direct control family using FM parameter names |
| `S...` on channel C | FM3 slot detune. A different argument form from SSG's S |
| `R`, `Rm`, `RF` family | Reverb-related commands. Not the same as a typical audio plug-in effect |
| `^length` | Extend the length of the preceding note |
| `\|` | A separator written in for readability. Not an automatic rest or bar correction |
| `:` | Ends compilation of that channel from this point on |

For example, the numeric form of the software LFO is used like this.

```muc
D o4 l4 v10 M8,2,1,4 cdef MF0 gab>c
```

Each command has its own valid range; the mere fact that it takes numbers does not mean any value is safe. Change advanced commands in small steps from a working example, and check the errors and warnings alongside the actual sound.

<a id="18"></a>
## 18. Complete examples to type in

### 18.1 A first song starting with SSG

Type the following into a new document and use the name `FIRST.MUC`.

```muc
#mucom88 1.7
#title First Steps
#composer ToughkidCST
#author ToughkidCST
#comment Simple SSG test

D T120 C128 o4 l8 v10 q0 cdef gab>c4 r4
E C128 o3 l4 v8 c r g r c r g r
F C128 o2 l2 v7 c g c g
```

1. Save `FIRST.MUC` with Ctrl+S.
2. Compile with F1→2.
3. Check the message, return, and listen with F1→3.
4. Change the D channel's `v10` to `v6`.
5. **Without saving**, do F1→2 and F1→3.
6. If you do not like it, undo and compile again.
7. When you have the state you want to keep, press Ctrl+S.

This example uses only SSG so that it needs no PCM or external FM voices. Even so, actually playing it from the editor still requires the MUCPLAY-supported sound environment described earlier.

### 18.2 Using repeats and macros together

```muc
#mucom88 1.7
#title Phrase Practice
#comment Macro and repeat test

# *1{o4 l8 cdef}
# *2{g4 e4 c4 r4}
D t200 C128 v10 [*1]2 *2
E C128 o3 l4 v8 [c r g r]2
```

Changing `*1` applies the change everywhere that macro is called. That is easier to manage than editing the same phrase separately in each place you copied it.

### 18.3 A simple inline FM voice

The example below shows where a voice definition goes. Turn the volume down the first time you listen.

```muc
#mucom88 1.7
#title Inline FM Test
#comment Four-operator voice example

  @1
   0,7
   31,8,4,6,8,36,0,1,0
   31,8,4,6,8,36,0,1,0
   31,8,4,6,8,36,0,1,0
   31,8,4,6,8,36,0,1,0

A t200 C128 @1 o4 l8 v8 p3 q2 cdef gab>c4
```

When changing voice values based on this example, keep the original and change one value at a time. A voice that is syntactically valid is not necessarily a voice that sounds good.

<a id="19"></a>
## 19. How to read a compile error

Where possible, the current compiler shows **the line number, the channel, an error code, the reason, and part of the source text**.

```text
Error line 2, channel A (code 6): Note length out of range
> A l0 c
```

Read it in this order.

1. `line 2`: check the second line. Empty lines and comments count toward the line number.
2. `channel A`: the error occurred while processing channel A.
3. `code 6`: a note-length-related error.
4. `> A l0 c`: part of the line that actually has the problem. Here, `l0` is what needs fixing.

The source excerpt is at most 72 bytes, so the end of a long line will not all be shown. An error occurring inside a macro may point at the calling line. Errors such as file I/O, where no source position is known, may carry no meaningful line number.

The editor has no feature that jumps automatically to the error position. It is easiest to remember the line contents or the command from the message and find it with Ctrl+F. **Fix errors one at a time starting from the first one, then recompile.** Do not expect a single failure screen to list every problem.

<a id="20"></a>
## 20. Compile error codes and what triggers them

The following describes the current diagnostic codes. The same code can have several causes depending on context.

| Code | Reason shown | Typical triggers and what to check |
|---:|---|---|
| 0 | Syntax error / missing number | A required number is missing. Example: `A l` |
| 1 | Invalid parameter | The argument form or numeric range is inappropriate. Example: `A q100000 c` |
| 2 | Repeat end without matching start | `]2` used without a `[` |
| 3 | Unclosed repeat/loop | A `[` was opened and never closed |
| 4 | Too many voices (maximum 32) | More than 32 distinct FM voices used in one song |
| 5 | Octave out of range (o1..o8) | Outside the explicit octave range, as with `o0` or `o9` |
| 6 | Note length out of range | No valid length can be produced, as with `l0`. Also check things like `l129` under C128 |
| 7 | Invalid loop escape | A `/` outside a repeat, a duplicate escape in the same repeat, and so on |
| 8 | Missing parameter or separator | A command needing several arguments is missing numbers or commas. Example: `A M1` |
| 9 | Command not valid for this channel | A command that does not fit the channel. Example: SSG's `P1` on FM channel A |
| 10 | Too many nested repeats | The 16-level repeat nesting limit was exceeded |
| 11 | Voice name not found or invalid | A voice specified by name was not found, or the name specification is wrong |
| 12–14 | Unspecified compiler error | Reserved and general error range. Do not infer the cause from the number alone |
| 15 | Macro not found | A call to an undefined `*number` |
| 16 | Invalid macro definition | Macro structure problems such as an unclosed definition or excessive nesting or recursion |
| 17 | MML line or macro too long | Exceeded the 1,023-byte limit for one MML body line or the 511-byte limit for a macro body |
| 18 | Output buffer overflow | The compiled song data exceeded the 32 KiB output buffer limit |

This table is not a guarantee that every invalid number and every MML combination is fully checked. Syntax checking, file checking, and what something means on the actual sound chip are three different things. Even when it compiles without errors, you still have to listen to confirm it sounds as intended.

### Error examples you can try yourself

The following are **inputs deliberately written to fail**. They are not examples to paste into a real song.

```text
A o9 c          → code 5: octave out of range
A l0 c          → code 6: zero length
A ]2            → code 2: no opening repeat
A [cdef         → code 3: unclosed repeat
A /c            → code 7: escape outside a repeat
A M1            → code 8: missing required arguments
A P1 c          → code 9: command not valid for this channel
A *99 c         → code 15: macro 99 was never defined
```

### How do I reduce size errors?

- Split one long line into several. Put a channel letter in front of every performance line you split off.
- Split a long macro into several shorter definitions.
- Exceeding the output capacity is not the same as the source file size. Look for places where repeated notes are written out at unnecessary length.
- Use `[ ]` repeats where you can. Macros reduce text, but they are expanded, so using a macro does not necessarily reduce the output size.
- PCM size has a large effect on the overall MUB size, but that is a different limit from the **32 KiB of song data** in code 18.

<a id="21"></a>
## 21. Warning messages and invalid input

**An Error means the compile failed; a Warning means something needs attention.** Warnings alone do not stop the compile.

In the past, an invalid channel line or tag was silently ignored, which made it easy to feel "I changed it — why is nothing different?" The current MUCPLAY compiler adds source pre-checks that report this kind of input. Note that an older MUCPLAY may not have those warnings.

### 21.1 Invalid channel prefix

```text
Warning line 2: Invalid channel prefix; use A-K + space/tab
> Ac4
```

You need a space after the channel, as in `A c4`. Also check the following.

- Did you put a space or tab before the channel letter?
- Did you write the channel letter in lowercase?
- Did you use a letter outside A–K as a channel?
- Did you write an unsupported multi-channel prefix such as `AB c` or `A,B c`?
- Did you write prose or a test string without a comment marker?

For example, prefixing `J cdef` with letters to make `TESTJ cdef` does not cause that line to play as a normal J channel. **It may warn and then ignore the line, as the older interpretation did.** A successful compile message does not mean that string was interpreted as music.

### 21.2 Unknown or malformed tag

```text
Warning line 1: Unknown or malformed tag
> #tittle Example
```

Check the spelling and any space or colon after `#`. A user-defined tag may also be warned about if it is not in the currently known tag list. A warning does not automatically delete or correct the text.

### 21.3 Missing tag value

```text
Warning line 1: Missing tag value
> #pcm
```

Supply a value, as in `#pcm PCM01.BIN`. An empty `#comment` is allowed as an ordinary comment.

### 21.4 Tag outside the header

```text
Tag outside initial header is ignored
```

Try moving `#voice`, `#pcm`, and the like into the header at the top of the file. `#comment` and macro definitions are handled separately. Writing a tag in the middle of the file does not switch the PCM bank or voice file at that point.

### 21.5 Missing PCM file

```text
Warning: PCM file not found: MUCOMPCM.BIN
```

Depending on the player's read path, you may also see wording like this.

```text
WARNING: cannot open #pcm file: MUCOMPCM.BIN
```

Check in this order.

1. Is the `#pcm` tag written correctly?
2. Is it in the header at the top of the file?
3. Can the specified PCM file be read in the current working environment?
4. Does the 8.3 filename DOS actually shows match the tag?
5. Is it the PCM bank that originally came with the song?

For compatibility, a MUB may be generated without PCM. **Do not conclude from a MUB written. message alone that you have a proper file with PCM included.** If the song needs PCM, resolve the missing-file warning and export again.

Warnings do not check every implication of invalid input. For example, whether a date matches the real calendar, or whether each sample in the PCM is the instrument the song expects, cannot be confirmed from these warnings.

<a id="22"></a>
## 22. Editor messages and how to recover

| Message | Meaning and what to do |
|---|---|
| `mucEdit new requires MSX-DOS2.` | Check that you are on an MSX-DOS2-class environment |
| `Open failed. Press a key.` | Check the name, path, disk, and whether the file is accessible |
| `Text exceeds 24 KiB; not loaded.` | The normalized document exceeds the editing capacity. Split or shrink it with an external tool and reopen |
| `Need 32 KiB free mapper RAM to load.` | Loading a new document needs two temporary mapper segments. Save your current work and check resident programs, sessions, and RAM configuration |
| `Save failed. Press a key.` | Check disk space, write protection, the name, and device errors. First secure a way to save the in-memory document under another name or to another device |
| `Document memory full. Press a key.` | Check whether the document exceeded 24 KiB after an insert or paste |
| `Selection exceeds 4 KiB clipboard.` | Break the copy or cut range into smaller pieces |
| `Text not found. Press a key.` | Check the search spelling and letter case |
| `Save the document first. Press a key.` | Check whether the current command lacks a document name, and save or name it |
| `Compile this document first: F1 then 2.` | Compile the current document before playing or exporting |
| `Compiler path: max 24 bytes, no spaces.` | Use a short filename and path with no spaces |
| `MUCPLAY.COM not found.` | Check that MUCPLAY can be found in the current working directory |
| `Use the matching /E2 MUCPLAY.COM.` | Use a MUCPLAY that supports the new editor's E2 return protocol |
| `Cannot create MUCEDIT.RET.` | Failed to write the state file. Check free disk space and whether the disk is writable |
| `Cannot create MEDCOMP.MUC (exists or disk error).` | A temporary file of the same name conflicts, or there was a disk error |

### 22.1 If MEDCOMP.MUC is left behind

Do not delete it just because it is a temporary file. **It may contain your most recent unsaved edits.**

1. First check whether the editor and player still have work in progress.
2. If possible, save the editor's current document under a separate name.
3. Copy the remaining `MEDCOMP.MUC` and `MUCEDIT.RET` somewhere else to preserve them.
4. Compare against the original MUC and check whether any needed edits exist only in the temporary file.
5. Only after there is no integration or recovery in progress and you have secured a backup, tidy up — for example by moving the conflicting file to another name.

`MEDCOMP.MUC` is text input, but `MUCEDIT.RET` is an internal state file. Do not edit the two the same way, and do not just change the extension and use it as source.

### 22.2 Failure to return to the editor

```text
Resume failed. R: Retry  Esc: Empty editor (MUCEDIT.RET kept).
```

- `R`: try resuming again from the remaining state file.
- `Esc`: enter an empty editor without deleting the state file.

Preserve the state file before creating new files or swapping COM files at this point. `MUCEDIT.RET` is tied to the editor's version and memory layout. It is not a general-purpose recovery file you can move freely between different builds.

A normal launch does not auto-recover an old RET just because one exists. `/R` is an internal procedure the player uses for a normal return; it is better not to use it as a user-facing recovery command for loading an arbitrary RET.

<a id="23"></a>
## 23. Memory, file size, and character handling limits

| Item | Current figure |
|---|---|
| Screen | 80 columns; 22 of the 24 rows form the normal editing area |
| Editing document | Up to 24 KiB = 24,576 bytes |
| Internal clipboard | Up to 4 KiB |
| Undo/Redo history | 4 KiB total, including before-and-after content and bookkeeping |
| Auxiliary work mapper | One 16 KiB segment |
| Temporary mapper for opening a file | Two additional 16 KiB segments required |
| List window | 16 entries per page; the full list is found via additional pages |
| MML channel line body | Up to 1,023 bytes |
| Macro body | Up to 511 bytes |
| Macro call nesting | Up to 4 levels |
| Repeat nesting | Up to 16 levels |
| Distinct FM voices used | Up to 32 |
| Compiled song data | Up to 32 KiB. Not the same as the total MUB file size including PCM |

### 23.1 Extra mapper memory does not make the document 40 KiB

The 16 KiB auxiliary work mapper is workspace for line moves and duplication, the file list, and similar tasks. It is not a setting that raises the 24 KiB document, 4 KiB clipboard, or 4 KiB undo limits.

When opening a file, the current document is not discarded immediately; the new document is read into a temporary area and validated. That is why, beyond the work mapper, another 32 KiB of free mapper memory is briefly needed. The structure exists to protect the current document if reading, closing, or allocation fails.

### 23.2 On-disk file size versus editing size

The 24 KiB limit is based on **the internal document size** after line endings and so on are normalized.

- CRLF, CR, and LF line endings are read and normalized internally to LF.
- A UTF-8 BOM at the start of the file is removed.
- The DOS Ctrl+Z byte is treated as the end of text.
- On saving, internal LF is written out as CRLF.

So a MUC slightly over 24 KiB on disk may still open if the normalized content fits within the limit. An extreme CRLF file with a very high proportion of line breaks could fit about 48 KiB into the internal 24 KiB. But **that does not mean a typical 48 KiB MUC can be edited.**

Even if the current compiler separately supports a larger source window, MUCEdit's own editing limit is 24 KiB.

### 23.3 Korean, Japanese, and UTF-8

MUCEdit is a byte-oriented MSX text editor. The fact that it can read a UTF-8 BOM does not mean it supports Korean or Japanese Unicode editing in general.

Multi-byte characters may appear garbled on screen, and movement and deletion may act per byte rather than per character. Write MML commands, numbers, and filenames in ASCII. When touching prose in another character encoding, always keep the original, and if necessary make the edit in an external editor that properly supports that encoding.

<a id="24"></a>
## 24. Frequently asked questions

### If I do not save, will my edits not be compiled?

They will. F1→2 compiles the editing buffer currently in memory; saving is not required. You do need to press F1→3 afterward to hear the new result. Pressing Play without compiling replays the previous result.

### I made a change but the compile result screen looks identical

Identical wording on the success screen does not mean the song data is identical. The general success message can be the same even when tempo or notes changed. Listen to it, or keep MUBs under different names and compare.

Also, if you changed only information such as comments or the title, the sound of the performance can legitimately be the same. Lines with a broken channel prefix may be warned about and ignored, so check the Warnings too.

### I typed in an arbitrary string and got no Error

Not all text is interpreted as MML. Prose, an invalid channel prefix, and unknown tags may pass with only a warning. **No errors is not the same as every line being used in playback.**

### I get a PCM warning but I can hear FM

FM data and the PCM bank are separate. Hearing FM does not mean the PCM is fine. Check `#pcm`, the actual DOS filename, and where the bank file is.

### I exported a MUB and the PCM sound is missing

You may have exported while ignoring the missing-file warning. The current policy allows generating a MUB without PCM in some missing-PCM situations. Prepare the correct bank and export again.

### I get no sound at all

1. Check that F1→2 (Compile) succeeded.
2. Check the playback screen for errors about the supported sound device.
3. Check muting and output connections in the emulator, the OS, and real hardware audio.
4. Check for `v0`, `p0`, SSG's `P0`, and parts containing only rests.
5. Check that the channel's lines were not ignored with a warning.
6. For a song that uses only PCM, start by checking for a missing bank.

### I typed with a block selected and the content vanished

That is normal editing behavior: the selection is replaced by what you type. If you did not mean to type over the selection, undo with Ctrl+Z, clear the selection, and then type. A large selection can exceed the undo limit, so take care.

### I split a line and the latter part no longer plays

Check that you did not omit the channel letter at the start of the new line. Writing just `gab>c` on the next line after `D cdef` does not automatically continue the same D channel. It has to be `D gab>c`.

### The file list order looks wrong

The list is in DOS directory search order, not sorted by name. Do not conclude a file is missing from the order shown — move through the pages or type the name directly.

### Can I use it on a 40-column screen?

The current MUCEdit assumes an 80-column screen. There is no 40-column mode.

### The screen got slow

Check separately: CPU/VDP settings on real hardware or in the emulator, and the emulator's speed limiting and frame skip. Infrequent screen updates and slow execution of the program inside the MSX can be different things. It is best to return to the emulator settings you intended and compare from there.

### Where are search, replace-all, and autocomplete?

Find and find-next are supported. The current version has no regular expressions, no replace-all, no MML autocomplete, no syntax highlighting, and no automatic jump to an error line. Combine selection and search to make edits piece by piece.

### Do I have to rebuild MUCEdit every time I change MUCPLAY?

As long as the E2 integration protocol is maintained, you do not in principle need to rebuild the editor each time. You do need to verify that the new MUCPLAY actually honors that protocol. Do not judge compatibility from the version string in the title alone.

<a id="25"></a>
## 25. Working safely and updating

The working habits I recommend are not difficult.

1. Keep a separate copy of the original song you received.
2. Save the file you will work on under a different name before you start.
3. Leave an intermediate save before deleting a large block or changing all the voices.
4. Every time you listen to a change, check both the compile success and the warnings.
5. When finished, keep the MUC, the needed voices and PCM, and the MUB/VGM separately.
6. When you are done, exit normally through the menu whenever possible.

### Replacing the executables

Do not overwrite the COM files while MUCEdit and MUCPLAY are in use. If the code and session in memory mix with a new program on disk, the return state may not match.

The recommended order is:

1. Save what you are editing.
2. Exit MUCEdit normally and return to DOS.
3. If you are holding a separate MUCPLAY session, clean it up with `/RELEASE` using **the player from before the replacement**.
4. Back up the existing COM files.
5. Copy the new COM files into the directory you will use.
6. Start fresh and verify compile, playback, and return with a small song.

`MUCPLAY.SES` is not a project file that stores the whole song on disk; it is information used to locate a session held in memory. Do not think of it as a file that restores song data intact on another machine or after a reset. Deleting the session file and releasing the memory are also not the same operation.

### When you report a problem

The following information makes the cause much easier to find.

- The real hardware model, or the emulator and expansion devices
- The actual location, file size, and build information of the MUCEDIT.COM and MUCPLAY.COM you ran
- The MUC where the problem occurred, plus the needed voices and PCM
- The exact sequence, such as "open → compile → edit which characters → recompile → play"
- The error or warning text, or the screen
- The original file and, if it remains, a separate copy of MEDCOMP.MUC

Rather than deleting files that need recovering and then reporting, please preserve the current state as much as possible. If there is anything you would rather not make public, leave it out of the copy and let me know.

<a id="26"></a>
## 26. Keyboard shortcut quick reference

### The keys you will use most

| What you want to do | Key |
|---|---|
| Open | Ctrl+O or F1→1 |
| Save | Ctrl+S |
| Save as | Ctrl+Shift+S |
| New document | Ctrl+N |
| Select a block | Shift+arrow keys |
| Select all | Ctrl+A |
| Copy / cut / paste | Ctrl+C / Ctrl+X / Ctrl+V |
| Undo / Redo | Ctrl+Z / Ctrl+Y |
| Find / find next | Ctrl+F / F3 |
| Compile | F1→2 |
| Play the latest compile result | F1→3 |
| Export MUB / VGM | F1→4 / F1→5 |
| Save and exit | F1→E |

### Movement and line editing

| What you want to do | Key |
|---|---|
| Start / end of line | Home / End — HOME / SELECT on real hardware |
| Start / end of document | Ctrl+Home / Ctrl+End |
| Move by word | Ctrl+← / Ctrl+→ |
| Select while moving | Add Shift to the movement keys above |
| Select the current line | Ctrl+L |
| Delete the current line | Ctrl+Shift+K |
| New line below / above | Ctrl+Enter / Ctrl+Shift+Enter |
| Move a line | Graph+↑ / Graph+↓ |
| Duplicate a line | Shift+Graph+↑ / Shift+Graph+↓ |

### Five things that are easy to confuse

1. **Ctrl+S saves; F1→2 compiles.**
2. **F1→3 neither saves nor compiles for you.**
3. **F1→N is Save/New; Ctrl+N is a new document.**
4. **In MML, t and T, and c and C, are different commands.**
5. **A success message after a Warning does not make the warning go away.**

<a id="27"></a>
## 27. Scope of this document

This guide was written against the current implementation of MUCEdit v0.8 and the MUCPLAY and shared MUC compiler in the September 14, 2026 working tree. It covers the recently added channel and tag warnings and the compile error diagnostics. It does not claim that older MUCPLAY builds, other MUCOM88-derived drivers, or MML programs for the PC all behave the same way.

In particular, the advanced MML tables here are a guide for reading the supported commands. This is neither a document guaranteeing the full extended syntax of other drivers nor a complete reference on FM, SSG, and PCM sound synthesis theory. For important work, keep the originals and confirm by actually playing the result.

The 19 MUC examples included here were confirmed to compile with the current compiler without errors or source warnings. The 15 error inputs and 4 warning inputs were also checked to produce the expected diagnostics. That testing confirmed syntax and compile results; it does not mean the voices, volumes, and playback quality were verified by listening on every real hardware environment.

When you need to compare reference executables precisely, the SHA-256 values are:

```text
MUCEDIT.COM  13,212 bytes
f4dd3d8fe3ae65d11d26d0471c6034e72812d393a9580b3eb2b7f593646aa08f

MUCPLAY.COM  32,512 bytes
6c728c58571d23987179ef030d284dcf533600d118d499be549c6ab5e308183c
```

To look through the development material distributed alongside this, see the documents below. For ordinary use, the earlier sections of this guide plus the error and warning chapters are enough to get started.

- [Editing keymap](docs/KEYMAP.md)
- [File list window behavior](docs/FILE_PICKER_20260911.md)
- [Editor work mapper](docs/WORK_MAPPER_20260911.md)
- [MUCPLAY's E2 integration protocol](../mucplay/EDITOR_ABI_E2.md)
- [Compile error handling](../mucplay/docs/COMPILER_ERROR_FIXES_20260911.md)
- [Channel and tag warnings](../mucplay/docs/SOURCE_WARNINGS_20260911.md)
- [Compiler technical reference](../muc2mub/Muc2mub.md)

Go ahead and change one phrase to start with. Once you are comfortable with the flow of compiling what you changed, listening, and saving the state you like, you can polish long songs a little at a time.

— ToughkidCST
