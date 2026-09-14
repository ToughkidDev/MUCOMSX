# MUC2MUB User Guide

MUC to MUB on the MSX, one song at a time.

This guide is written against **MUC2MUB v3.15**. The reference date is September 15, 2026, and it covers `bin/muc2mub.com`, the project's current standard executable.

MUC2MUB is a program that compiles `.MUC` files — MUCOM88's MML source — on the MSX and saves them as `.MUB` files. Use it to produce the finished article after editing a song, or to convert several songs in turn from a DOS batch file.

The basic usage itself is simple.

```dos
MUC2MUB SONG.MUC
```

That produces `SONG.MUB`. Once you start working with real songs, though, voice files, PCM files, filenames, memory and storage space all become sources of confusion. This guide covers those parts too. You do not need to memorize everything up front. Convert one song first, then look up whatever you need.

## Table of contents

1. [What kind of program this is](#01)
2. [Runtime environment and what to prepare](#02)
3. [Converting your first song](#03)
4. [Commands and filename rules](#04)
5. [Working with folders and drives](#05)
6. [Writing MUC files, and channels](#06)
7. [Tags and song information](#07)
8. [Preparing FM voices](#08)
9. [PCM and ADPCM](#09)
10. [How compiling and saving proceed](#10)
11. [Memory and size limits](#11)
12. [Batch-converting several songs](#12)
13. [Success, warnings, errors and exit codes](#13)
14. [The full compile error reference](#14)
15. [Warning message reference](#15)
16. [File, disk and memory errors](#16)
17. [Safe saving and recovery after an interruption](#17)
18. [Comparing against an original MUB, and using MD5](#18)
19. [Using it with mucplay, mucEdit and mubplay](#19)
20. [Frequently asked questions](#20)
21. [Pre-release checklist and reporting problems](#21)
22. [Version check and scope of verification](#22)

<a id="01"></a>

## 1. What kind of program this is

A MUC is a source file with notes and commands written out as text. A MUB is a binary file holding that content converted into a form the playback driver can use.

MUC2MUB's job is the conversion between the two. The reference syntax is the **MUCOM88 v1.7 family**, and the output is the **MUB8 format**.

- It is not a program for editing MUC.
- It is not a program that plays or records songs directly.
- It is not a program that produces WAV or MP3.
- It is not a program that automatically converts any MML file for MUCOM88.
- Nor does it mean every modern MUCOM88 syntax extension is supported.

A song whose source targets another compiler, or which contains commands specific to a newer driver, needs its syntax and playback environment checked separately. Renaming the extension to `.MUC` does not make it compatible.

<a id="02"></a>

## 2. Runtime environment and what to prepare

### Runtime environment

| Item | Requirement |
|---|---|
| CPU | Runs on Z80. Not an R800-only program |
| Operating system | MSX-DOS 2 and an environment providing mapper services. Verified on a Nextor configuration |
| Memory | Recommended with an SD cartridge carrying a 512 KiB or larger mapper configuration, such as MegaFlashRom SCC SD or Carnivore2. Actually allocatable free segments are required |
| Storage | Media DOS can read and write. Must allow reading the input and assets and writing to the output folder |
| Executable | `MUC2MUB.COM` |
| Source | A `.MUC` of the MUCOM88 v1.7 family |
| Additional files | The FM voice data and PCM data the song requires |

Verification was done on configurations of 512 KiB or more. The program does not, however, blanket-allow or blanket-refuse based on exactly how many KiB of RAM are installed. What matters is being able to allocate the required work segments through the DOS mapper. See [memory limits](#11) for details.

Running directly from DOS 1 or BASIC is not offered as a supported usage. Please boot into a DOS 2-class environment first.

Compiling itself does not require a sound device to play the song. To hear a finished MUB properly, though, you need a separate compatible player and sound environment. The MSX's built-in PSG alone does not reproduce the OPNA's FM, rhythm and ADPCM.

### Preparing the files

To start with, gathering the needed files into one folder is the simplest approach.

```text
MUC2MUB.COM
SONG.MUC
VOICE.DAT       when the song uses external FM voices
MUCOMPCM.BIN    when the song uses PCM data under the default name
SONG.MD5       only if you want to embed the source hash
```

`VOICE.DAT` and `MUCOMPCM.BIN` are not unconditionally required for every song. Some songs define FM voices inside the MUC, or use no PCM channel at all. Conversely, for a song that really does use those files, do not bring in a different file that merely shares the name.

Running it requires no `.ASM`, `.SYM`, Java or assembler. An ordinary user just copies the latest `MUC2MUB.COM` onto a disk the MSX can see.

<a id="03"></a>

## 3. Converting your first song

### Starting from a song you already have

1. Back up the original MUC and the voice and PCM files separately.
2. In MSX-DOS, move to the drive and folder containing the song.
3. Run it as below.

```dos
MUC2MUB SONG.MUC
```

To choose the output name yourself, type it like this.

```dos
MUC2MUB SONG.MUC TEST.MUB
```

On a first attempt, saving under a different name such as `TEST.MUB` makes it easy to compare against the MUB you already had. A valid existing output file is replaced by the new result with no overwrite prompt, so take particular care if you are using the original MUB as reference material.

While running, you see the version banner and progress indicators such as `Compiling:`, `Used FM voices:` and `Writing  :`, and on normal completion this text appears.

```text
Done.
```

Do not stop there — also check whether there were warnings earlier. `Done.` means the conversion and saving steps finished; it is not a guarantee that every external file the original song needs is correct.

### Making a small test MUC

In an ordinary text editor, save the following as `TEST.MUC`. Do not include the code block's fence lines.

```muc
#title FIRST TEST
#composer MY NAME
#comment Simple SSG test
D o4 l4 v12 cdefgab>c
```

```dos
MUC2MUB TEST.MUC
```

This example uses channel D, that is SSG, so it needs no external FM voices or ADPCM. The current version may show a missing-file warning while looking for the default PCM file even for songs that use no PCM. If, as in this example, you do not use channel K, there is no need to prepare PCM because of that warning.

Once `TEST.MUB` exists, listen to it in a compatible player. For the basic cycle of writing source → compiling → checking the result, this is enough.

<a id="04"></a>

## 4. Commands and filename rules

### Basic form

```text
MUC2MUB inputfile [outputfile]
```

The square brackets mean "this can be omitted." You do not type `[` and `]` in the actual command.

```dos
MUC2MUB SONG.MUC
MUC2MUB SONG.MUC RESULT.MUB
MUC2MUB SONG.MUC OUT\RESULT.MUB
```

The `OUT` folder in the last example must already exist. The program does not create output folders for you.

If you omit the output name, the input name's extension is changed to `.MUB`. If the input name specifies a drive, that drive specification carries into the automatic output name too. To save somewhere else, specify the output location yourself.

### Input filenames

Input follows these rules.

- The stem is 1–8 characters; the extension, if used, is 1–3.
- Letters, digits, underscore `_` and hyphen `-` are allowed.
- Letter case is not distinguished.
- A drive may be prefixed, as in `A:SONG.MUC`.
- Subfolder paths, spaces, quotation marks and wildcards are not supported.
- It does not shorten a long name automatically and open a different file.

| Example | Usable, with notes |
|---|---|
| `SONG.MUC` | Fine |
| `BOS010.MUC` | Fine |
| `MY_SONG.MUC` | Fine |
| `A:SONG.MUC` | Fine. Does not also move where assets are looked up |
| `LONGSONG1.MUC` | Not allowed. The stem is 9 characters |
| `MY SONG.MUC` | Not allowed. Contains a space |
| `"MY SONG.MUC"` | Not allowed. Quoting does not fix it |
| `ALBUM\SONG.MUC` | Not allowed as an input argument. `CD ALBUM` first |
| `*.MUC` | Not allowed. It does not take several files at once |
| `곡이름.MUC` | Not used. Prepare an ASCII name for DOS |

To avoid confusion, it is best to keep extensions consistent: `.MUC` for input, `.MUB` for output.

### Output filenames

The output may carry a DOS path. The final filename, however, follows the same 8.3 rules as above. Remember that input and output differ in how much path support they have.

One argument is at most 63 bytes, and the output's drive and directory prefix is at most 52 bytes, to leave room for appending a temporary filename. Rather than testing long paths, use a nearby folder as the output location. The DOS command line's overall length limit applies separately as well.

If **the complete final filename of input and output is the same**, it is refused even on a different drive or folder. For instance, writing `SONG.MUC` out to `OUT\SONG.MUC` is not permitted. The check is deliberately conservative so you cannot accidentally overwrite your source. `SONG.MUC` → `SONG.MUB` has a different extension and is normal usage.

### Invocation styles that are not supported

One run takes one input and one optional output. Do not add a third file.

Options such as `-o`, `/FORCE`, `/STRICT`, `/MUB` and recursive search are not MUC2MUB command-line features. In particular, do not carry over options from another program and use them here.

Running with no arguments prints the usage form, but this is not a dedicated interactive help screen. It also initializes the mapper first at startup, so if the memory environment is wrong you may see a mapper error before the usage text.

<a id="05"></a>

## 5. Working with folders and drives

This is the part to watch most closely when handling several albums. **Relative filenames for voices and PCM are looked up relative to the current working directory.** It does not find where the input file lives and shift the asset search base accordingly.

I recommend keeping to this order for each song.

1. Switch to the drive in question.
2. Move to the folder holding the song and its assets.
3. Compile from there.

```dos
B:
CD \ALBUM1
MUC2MUB SONG.MUC
```

The example above assumes `MUC2MUB.COM` is in the current folder or is found on the DOS executable search path. If the executable is not found, copy it into the current song folder and try there first.

This differs from specifying only the input on another drive:

```dos
MUC2MUB B:SONG.MUC
```

Even though this command reads the song on drive B, the relative lookup location for `VOICE.DAT` or PCM does not move to drive B with it. If "the source is right but the voices are wrong," start by checking this.

It is common for different albums to contain a `VOICE.DAT` of the same name. If you gather every file into one folder for convenience, you can end up compiling one song with another album's assets. Keeping a per-album folder structure is safer.

<a id="06"></a>

## 6. Writing MUC files, and channels

This section is the basic guidance needed for conversion. It is not an MML language dictionary explaining every MUCOM88 command and sound chip register. For complex songs, also check the syntax of the original driver used.

### Text format

A MUC is unformatted text. Do not save it as a word processor document or a UTF-16 file.

A test file containing only ASCII is easiest prepared as ASCII. Existing Japanese MUCOM88 material may be in the Shift_JIS/CP932 family, so preserve the original's encoding. The current compiler is not a program that auto-detects and converts character encodings. A UTF-8 BOM or a full-width space can prevent the command or tag at the start of a line from being recognized. Displaying Korean tags likewise depends not only on the compiler but on the player and display environment.

It handles CRLF, LF and CR line endings, but standardizing on CRLF is easier to manage alongside DOS tools. If you have an original for comparison, keep separately in mind that merely changing line endings can change the source hash and the tag bytes.

Make sure no NUL, or the DOS end-of-text marker Ctrl-Z, gets mixed into the middle of the file. Although invisible on screen, they can make the rest of the content unreadable.

### Channels must be at the very start of the line

```muc
A o4 l4 cdef
A gab>c
```

The channel letter is an uppercase `A`–`K`, followed by a space or a tab. The same channel may be split across several lines.

```text
A o4 c      a valid channel line
 A o4 c     invalid channel line: leading space
a o4 c      invalid channel line: lowercase channel
A,o4 c      a comma after the channel is not supported as a separator
A,B c       listing channels on one line is not supported
```

An invalid channel line may be warned about and dropped. When part of a song sounds as though it has vanished, do not rule this out on the grounds that "there were no compile errors."

### Channel layout

| Channel | Sound source |
|---|---|
| A, B, C | FM 1, 2, 3 |
| D, E, F | SSG 1, 2, 3 |
| G | Rhythm |
| H, I, J | FM 4, 5, 6 |
| K | ADPCM |

Take care not to confuse this with the channel tables of other MML systems. In particular, D, E and F are SSG, not FM.

### Common basic notation

| Notation | Meaning or purpose |
|---|---|
| `c d e f g a b` | Notes |
| `r` | Rest |
| `o4` | Octave, in the range `o1`–`o8` |
| `>` / `<` | Octave up / down |
| `l4` | Default length for subsequent notes |
| `c8` / `r8` | Specify a note or rest length directly |
| `v12` | Volume. Check the effective meaning and range per channel |
| `@1` | Selects the voice or sample for that channel. Means different things on FM and ADPCM |
| `[cdef]2` | Repeat a section |
| `[c / d]2` | Specify the escape point on the last repeat |
| `L` | Specify the song's loop point |
| `;` | Start of a comment |

Do not swap uppercase and lowercase commands freely. The same letter may be a different command.

### Repeats and macros

```muc
A o4 l4 [c d e f]2 g
```

A repeat's `[` and `]` must be balanced. `/` is the escape marker used inside a repeat. Writing it outside a repeat, or twice in the same repeat, is an error. Repeats nest to at most 16 levels.

```muc
# *1{o4 l4 cdef}
A *1 gab>c
```

In the example above, `# *1{...}` is the macro definition and `*1` is the call. At first, define short macros on one line and use them as in the example. A macro body is up to 511 bytes and nested calls go to at most 4 levels. A macro that calls itself endlessly cannot be used.

A macro is a means of organizing the source, not a compression feature that always shrinks the resulting DATA. If you want to reduce the size of repeated events, use repeat syntax while checking that the musical result stays the same.

<a id="07"></a>

## 7. Tags and song information

Title, composer, external file specifications and so on are written together at the very top of the file.

```muc
#title MY SONG
#composer MY NAME
#author MY NAME
#comment Test version
#voice VOICE.DAT
#pcm PCM.BIN
#date 2026/09/15
A @1 o4 l4 cdef
```

The external files in this example must actually be present.

| Tag | Purpose |
|---|---|
| `#title` | Song title |
| `#composer` | Composer |
| `#author` | Author information |
| `#comment` | Supplementary notes. An empty value is allowed |
| `#date` | Date information |
| `#voice` | External FM voice filename |
| `#pcm` | External PCM filename |

The current warning checks also treat `#mucom88`, `#driver`, `#version`, `#uuid` and `#mucmd5` as known tag names. That does not mean writing those tags switches the compile engine to a new driver or extended syntax. Writing `#mucmd5` and preparing a [per-input `.MD5` file](#18) are also separate matters.

When writing tags, organize them like this.

- Put `#` at the very start of the line.
- Gather metadata tags contiguously at the start of the file.
- Do not slip ordinary comments or whitespace-only lines between tags.
- Do not add `#voice`, `#pcm` or `#title` late, after the music data has begun.
- Do not scatter headers through the source or stretch them to tens of thousands of bytes.

Metadata handling currently works from the initial header region, within the first source memory window. The fact that music lines can be processed deep into a large MUC is a different matter from applying a tag placed anywhere in the file.

Tags outside the header may produce a warning that they were ignored. Unrecognized tags are also warned about. Do not confuse the case where such a tag remains as source text with the case where it is reflected as an actual compile setting.

<a id="08"></a>

## 8. Preparing FM voices

FM voices come mainly from an external library, or are defined directly inside the MUC.

### External voice files

```muc
#voice VOICE.DAT
A @1 o4 c
```

If the tag is omitted, the default name is `VOICE.DAT`. The current external library loader uses an 8,192-byte area — 256 voice records of 32 bytes each. Do not drop in a voice file of another format under that name.

There is one important point. **If the voice file cannot be opened, the current version may zero-fill the voice area and carry on.** It does not catch every missing external voice with a helpful error. A voice selected by number can silently receive wrong content. Do not expect complete format validation of short or corrupted voice files either.

So when an FM song sounds wrong, check these first.

1. Is this the voice file that matches this song?
2. Is it in the current working folder?
3. Does the name in `#voice` match the name DOS shows?
4. Are the library's size and content the same as the original's?
5. Were the source's `@number` or `@"name"` written against that library?

### Long voice and PCM names

Long names are refused for the input MUC, but asset names in `#voice` and `#pcm` keep the older FCB-style truncation behavior.

```muc
#voice shinobivoice.dat
```

In this case the MSX side needs the file prepared as `SHINOBIV.DAT`. It is not a feature that automatically finds the usual VFAT alias `SHINOB~1.DAT`.

Where possible, make both the tag and the actual file short, unambiguous 8.3 names from the start. When different long names truncate to the same 8.3 name, you have to separate the folders. Note, though, that if you intend a complete byte-for-byte comparison against an original MUB, editing the tag name itself changes the tags and the hash.

### Inline voices in the source

The current version handles multi-line `@N` definitions, the `@N:{...}` form, and the raw-parameter `@%N` form. Below is an example of the brace form.

```muc
  @1:{
7,2
31,8,3,5,2,41,1,1,3
31,5,4,5,2,39,0,5,2
31,4,2,5,1,31,0,3,7
28,30,6,6,0,0,2,1,4
}
A @1 o4 l4 cdef
```

The first two values are FB and ALG, and the next four lines are each operator's `AR, DR, SR, RR, SL, TL, KS, ML, DT`, in that order. Indentation before an inline definition and the rule against leading whitespace on a music channel line are two different things.

MUC2MUB applies inline definitions to the voice area and then puts the FM voices actually used into the result. Each voice used is serialized as 25 bytes of parameters. It does not paste the whole external library into the MUB.

A single song can use at most 32 FM voices. This limit does not mean "voice numbers must be 32 or less"; it is a limit on the number of distinct FM voices the song actually registers and uses.

Not every faulty inline definition is detected as a clear error. Keep the count, order and numbering of the values correct, and follow up with actual playback or a comparison against the original DATA.

<a id="09"></a>

## 9. PCM and ADPCM

### Which file to prepare

A song using ADPCM on channel K needs the PCM bank file that matches it.

```muc
#pcm PCM.BIN
```

With no tag, the default filename is `MUCOMPCM.BIN`. The extension does not have to be `.PCM`. Follow whatever name the original song used — `.BIN`, for instance — while keeping to DOS filename rules.

The PCM file meant here is data prepared for use with MUCOM88. It is not an ordinary WAV or MP3 with the extension changed. The compiler does not analyze an audio format and convert it into ADPCM for the OPNA.

### When it goes into the MUB

Music events and FM voice data are built in the memory mapper first. The whole PCM block is not loaded there alongside them.

At the saving stage, the PCM file's size is checked and the data is read from disk in pieces and appended after the MUB's tags. For a normal song using channel K, the result is a single MUB containing the required PCM bank.

- PCM is separate from the music DATA in memory.
- The PCM file's own bytes are appended; no audio re-compression happens at save time.
- It does not automatically trim the PCM bank down to only the samples used.
- If channel K is not used, no PCM block is included even when a PCM file exists.
- PCM size is handled as 32-bit, so PCM larger than 64 KiB is handled by the save path. That does not guarantee support for every PCM of any size or format, or by every player.

### The missing-PCM warning

```text
Warning: PCM file not found: PCM.BIN
```

Compilation can still finish and produce a MUB with this warning. That part preserves compatibility with the previous behavior.

For a song that uses channel K, do not treat that as a proper completion. It may be a result where FM and SSG are audible but only the sampled sound is missing. You need to prepare the file and compile again.

Even a song without channel K may produce the missing-file warning because of the step that queries the PCM size. In that case, simply confirm that the song does not use PCM originally.

Failing to find the file and failing while actually reading a file you did find are different. The latter becomes a `Cannot read PCM file` error and can make saving fail. Do not swap out the PCM file or eject the media while compiling.

<a id="10"></a>

## 10. How compiling and saving proceed

The overall flow is as follows.

```text
Read the MUC
  ↓
Load the source into the mapper, preserving line boundaries
  ↓
Prepare voices → compile per channel → music and FM DATA complete
  ↓
Write header + DATA + tags to a temporary file
  ↓
Read any required PCM from disk and append it
  ↓
Close the file → rename to the final MUB name
```

It does not write notes straight into the final MUB while reading the source. It loads the source first, builds the per-channel compiled music DATA in memory, and then saves to disk. Internally it uses a mapper window that preserves line boundaries plus a working line buffer, so the structure does not require 64 KiB to be laid out in one contiguous Z80 address space.

The output file's broad structure is as follows.

| Order | Content |
|---|---|
| 1 | 80-byte MUB8 header |
| 2 | Music DATA: channel table, events, FM voices used, and so on |
| 3 | Tags: song information and additional metadata |
| 4 | The PCM bank, when required |

The music DATA completed in memory is written at the saving stage without being re-interpreted as MML or recompiled. Since the final MUB also needs a header, tags and PCM, however, it is not "a file that dumps the whole mapper memory as-is."

Syntax, length and buffer checks during compilation, and I/O checks while saving, are performed — but there is no feature that automatically plays the resulting song and compares it aurally with the original, or reads the whole saved file back and collates it against an original MUB. Verifying an exact match is a separate comparison procedure.

<a id="11"></a>

## 11. Memory and size limits

For this part you need to keep several different sizes distinct.

| Subject | Current figure |
|---|---|
| Input MUC | Actual size on disk, at most 65,536 bytes, that is 64 KiB |
| Mapper for loading the source | Five 16 KiB segments, to preserve line boundaries |
| Music and FM output DATA | Two 16 KiB segments; must fit within a 32 KiB area |
| Voice and working mapper | One 16 KiB segment |
| Total working mapper allocation | 8 segments = 128 KiB. DOS, the program and other memory are separate |
| MML body of an ordinary channel line | Up to 1,023 bytes after the leading two bytes such as `A ` |
| Macro body | Up to 511 bytes |
| Repeat nesting | Up to 16 levels |
| Macro call nesting | Up to 4 levels |
| FM voices used in one song | Up to 32 |

### What counts toward the 64 KiB

Every byte of the file — not just notes, but title tags, comments, whitespace and line breaks. Do not confuse 64,000 bytes with 65,536 bytes. 65,536 bytes is within range; 65,537 bytes is over.

Sources on the order of 16, 32, 48 and 64 KiB can be processed. But being under the size limit alone does not mean every source will succeed. Syntax, per-line length, macro length, final DATA size and other conditions must also be satisfied.

In particular, avoid stretching a single comment line to tens of thousands of characters, or cramming an entire song onto one line with no breaks. A very long non-musical line can also hit the loading limit of the source memory window. Splitting into several readable lines is better.

### Input size and output size are not proportional

A comment-heavy 64 KiB MUC can have small music DATA, while a smaller MUC packed with notes and macro calls can fill the output area first. Output DATA holds not only notes but the channel structure and the voice table. Do not calculate as though all 32 KiB were available for notes alone.

When the output space runs short, reorganize with repeat syntax that preserves the same musical result, or split the song. Cutting comments only helps the input size; it cannot shrink music DATA that has already grown.

The final `.MUB` file includes the header, tags and PCM, so it can be larger than 32 KiB or 64 KiB. Do not conclude from file size alone that the DATA limit was exceeded.

### Does fitting 4 MiB of RAM raise the limits?

No. Verification with a 4 MiB mapper confirmed correct operation in that configuration; it was not a test that reserves or uses the full 4 MiB.

The current compiler allocates the eight user segments it needs in the DOS default mapper context. It does not survey the RAM in every slot to total up capacity, or actively gather free space from other mappers. Even with a large amount of physical RAM, a memory error can occur depending on what DOS can allocate.

Adding RAM does not automatically raise the 64 KiB input, the 32 KiB music DATA area, or the line and macro length limits.

<a id="12"></a>

## 12. Batch-converting several songs

MUC2MUB handles one song per run. Calling several songs in order is the job of the DOS shell or a batch file.

### The simplest batch file

Prepare the following as `BUILD.BAT`. The commands in this section are examples run under MSX-DOS.

```bat
@ECHO OFF
MUC2MUB SONG01.MUC
MUC2MUB SONG02.MUC
MUC2MUB SONG03.MUC
```

```dos
BUILD
```

This example is the basic form that runs them in order. **It is not a batch that stops automatically when a song in the middle fails, or that gathers a list of failures.** Do not judge everything successful from the success of the last command alone.

To keep a per-song record, you can store the output separately.

```bat
@ECHO OFF
MUC2MUB SONG01.MUC > C01.LOG
MUC2MUB SONG02.MUC > C02.LOG
MUC2MUB SONG03.MUC > C03.LOG
```

Redirecting may hide the progress indicators from the screen. Choose log names that do not collide with sources, voices, PCM or existing MUBs. Writing to the same log again with `>` replaces the earlier log. Writing logs takes disk space too.

### When albums live in several folders

The following example assumes the `MUC2MUB` command can be found from each album folder.

```bat
@ECHO OFF
CD \ALBUM1
MUC2MUB SONG01.MUC
MUC2MUB SONG02.MUC
CD \ALBUM2
MUC2MUB SONG01.MUC
MUC2MUB SONG02.MUC
```

Put that album's voice and PCM files in each folder. If the drives differ too, switch to the drive rather than only using `CD`.

To add wildcard iteration or conditional stopping, you need to check the syntax of the MSX-DOS shell you use. Do not assume a Windows `FOR` example will work if copied verbatim. MUC2MUB itself has no file-list iteration and no "retry only the failed songs" feature.

### Principles for batch operation

- Start with one song, then a small group, and finally the whole album.
- Before running, check the target list and each song's assets.
- Decide explicitly on the shell side whether to continue after a failure or stop at the first one.
- Check the warnings in the logs alongside the exit codes.
- Do not count an existing MUB left behind where a run failed as a new result.
- Do not run several conversions at once in the same output folder. The temporary filenames are fixed.
- Do not unconditionally delete `M2MTEMP.$$$` and `M2MBACK.$$$` at the start of a batch.
- After an interruption, re-check the result list and re-run from the songs that need it.

Especially in a bulk conversion for archiving, it matters to distinguish "the program ran all the way through" from "every song was converted correctly."

<a id="13"></a>

## 13. Success, warnings, errors and exit codes

| State | Meaning | DOS exit code |
|---|---|---|
| Normal completion | Compilation and saving completed | `0` |
| Completed with warnings | There may be ignored lines or tags, or missing assets | Can be `0` if it completed |
| General error | Failure in arguments, compilation, file I/O, memory, and so on | `1` |
| Aborted by DOS | Ctrl-C, STOP, media error and the like handled as a DOS abort | The relevant DOS abort/error code |

The compile error number on screen and the DOS exit code are different things.

```text
Error line 4, channel A (code 6): Note length out of range
> A l0 c
```

The `code 6` in this example is the classification number for a note-length error. It does not mean 6 is returned to the DOS shell. The exit code for a general compile failure is 1.

The error position is shown as the actual line number in the MUC and the channel. The line content is shown only up to the first 72 bytes, so the tail of a long line has to be checked in your editor. An error inside a macro may be reported against the music line that called it, so look at the macro definition as well.

When the source position cannot be determined, a message beginning `Error (source line unavailable)` appears. That does not mean there is no error — it means no position information could be attached.

In general, fix the first error and compile again. It is not a design that gathers and prints every error in the whole source at once.

<a id="14"></a>

## 14. The full compile error reference

Below is the complete classification of the current diagnostic messages. The examples are representative triggers, not an exhaustive list of every possible faulty syntax.

| Code | Message on screen | Cause and what to check |
|---|---|---|
| 0 | `Syntax error / missing number` | Uninterpretable syntax, or a required number missing. Check the parameters of the preceding command |
| 1 | `Invalid parameter` | A value inappropriate for that command. Check for excessively large numbers, signs and value ranges |
| 2 | `Repeat end without matching start` | `]` used with no corresponding `[` |
| 3 | `Unclosed repeat/loop` | A repeat opened with `[` was not closed before the channel ended |
| 4 | `Too many voices (maximum 32)` | More than 32 FM voices used. Tidy up the voices actually in use |
| 5 | `Octave out of range (o1..o8)` | Octave outside the supported range. Check the flow of `o`, `<` and `>` |
| 6 | `Note length out of range` | An invalid note length. Check especially for `l0`, zero, or lengths that cannot be computed |
| 7 | `Invalid loop escape` | A `/` outside a repeat, or a duplicate escape marker in the same repeat |
| 8 | `Missing parameter or separator` | A required parameter or separator is missing. Check commas and values on commands taking several numbers |
| 9 | `Command not valid for this channel` | A command unusable on the current channel. Check the FM / SSG / rhythm / ADPCM distinction |
| 10 | `Too many nested repeats` | Repeat nesting beyond 16 levels. Simplify the repeat structure |
| 11 | `Voice name not found or invalid` | A voice specified by name was not found, or the name specification is inappropriate. Check the voice library and spelling |
| 12–14 | `Unspecified compiler error` | Reserved, or a classification with no meaning defined for general users. Preserve the number and report it |
| 15 | `Macro not found` | No macro definition exists for the number called |
| 16 | `Invalid macro definition` | A problem with the macro definition's form or braces, or the recursion/call-nesting limit |
| 17 | `MML line or macro too long` | A music line or macro body exceeded the working buffer limit |
| 18 | `Output buffer overflow` | Not enough room in the output area holding music events, voices and so on |

Other undefined numbers may also show as `Unspecified compiler error`. Do not attach a new meaning of your own from the code number alone — keep the original text together with the conditions that produced it.

### Commonly encountered error examples

The following are deliberately faulty. Do not use them as examples of correct songs.

```muc-error
A l0 c
```

The default note length is 0. If a quarter note was intended, fix it to something like `l4`.

```muc-error
A ]2
```

Only the closing repeat is present. An opening `[` is needed.

```muc-error
A [c
```

The repeat is not closed. Finish it with `]count` as intended.

```muc-error
A /c
A [c / d / e]2
```

The first line uses `/` outside a repeat; the second uses `/` twice in the same repeat.

```muc-error
A q100000 c
```

A value too large for the command to accept. Rather than blindly reducing the number, start by checking what that command means and what effect you want.

```muc-error
A *99
```

If macro 99 was never defined, that is an error. Check whether a `# *99{...}` definition exists.

```muc-error
# *1{*1}
A *1
```

The macro calls itself endlessly. If you need repetition, express it with repeat syntax rather than recursion.

### How to split a long line

```muc
A o4 l8 cdefgab>c
A <bagfedcr
```

Write the same channel letter on the next line as on the previous one. Word wrap on screen alone does not split an actual line in the file. You have to insert a line break in the editor.

If the macro length was exceeded, split the body into shorter pieces and simplify the call structure too. Splitting lines does not remove the overall size limit on a macro body.

<a id="15"></a>

## 15. Warning message reference

A warning does not mean the source was corrected for you. Since a result can be produced with some content ignored, you have to confirm the song is what you intended.

| Message | Meaning | How to resolve it |
|---|---|---|
| `Invalid channel prefix; use A-K + space/tab` | An invalid channel line | Check for an uppercase A–K in the first column followed by a space or tab. Fix indentation, commas and lowercase |
| `Unknown or malformed tag` | An unknown tag, or faulty tag notation | Check the tag name and form. Consider whether it belongs to another compiler |
| `Missing tag value` | A tag requiring a value has none | Fill in the required value such as a title or filename. An empty `#comment` is allowed |
| `Tag outside initial header is ignored` | A tag outside the initial header region | Move it into the contiguous header at the top of the file |
| `Warning: PCM file not found:` | The specified or default PCM file was not found | Check whether channel K is used, the current folder, and the actual 8.3 name |

Line-related warnings appear like this.

```text
Warning line 4: Invalid channel prefix; use A-K + space/tab
>  A o4 c
```

Do not fold "there were warnings but it exited normally" straight into the success column of a batch tally. At minimum, confirm the warnings were intended before classifying it as a final success.

Conversely, do not judge the content of an external voice file or a PCM format correct merely because there were no warnings at all. Not every asset problem is currently caught as a warning.

<a id="16"></a>

## 16. File, disk and memory errors

These errors may not be resolved by fixing MML syntax alone.

| Message on screen | What to check first |
|---|---|
| `Usage: MUC2MUB <input.muc> [output.mub]` | Whether there is an input argument, and whether the basic call form was followed |
| `Invalid name/arguments (input: 8.3, no path).` | Long input names, paths, quotes, spaces, extra arguments, argument length, the output filename and input-protection checks |
| `Cannot open input file` | The current drive and folder, the actual DOS filename, whether the file exists |
| `Cannot read input file` | Media read problems, a corrupted file, the connection state |
| `Input exceeds 64 KiB.` | Whether the raw file exceeds 65,536 bytes. Also check the loading limit from very long lines |
| `Error: Mapper unavailable or insufficient memory.` | DOS 2 mapper services, allocatable segments, other programs occupying memory |
| `Cannot create output file` | Whether the output folder exists, whether it is writable, name and path length, a read-only target, leftover temporary or backup files, free directory entries |
| `Cannot write output file` | Disk space, write protection, media errors. Writing less than requested is also treated as failure |
| `Cannot close output file` | Not only closing the file, but possible failure of the final rename or backup cleanup. Check the final, temporary and backup files all |
| `Cannot read PCM file` | Failure partway through reading PCM, or failing to reopen the PCM at the saving stage |
| `Output buffer overflow` / `Error: output buffer overflow` | The music DATA does not fit the output area. A separate problem from input size and disk space |

### If the disk looks empty but creation still fails

Do not look only at free bytes — check these as well.

- Does the destination folder actually exist?
- Is the existing output a read-only or system file?
- Is there a directory or similar with the same name?
- Does `M2MTEMP.$$$` or `M2MBACK.$$$` already exist?
- In particular, are the file entries of the FAT root directory full?
- Is the output path too long?

The program does not clear a read-only attribute on its own. Find out first why the existing file is protected.

### If RAM looks sufficient but it will not start

Check whether DOS is providing the mapper, and whether eight segments can be secured from the default allocation target. If another program is using memory, exit it and try again. Total physical RAM and the memory DOS can allocate right now are not the same figure.

### If a MUB remains after an error

That file may not be the result just produced, but a file that was saved correctly earlier. It is left in place to protect the original. Do not judge this run successful merely because the file exists.

<a id="17"></a>

## 17. Safe saving and recovery after an interruption

It does not truncate an existing MUB and rewrite it from the beginning. It completes the new result as a temporary file and then swaps it in.

### The normal save sequence

1. Create a new `M2MTEMP.$$$` in the output folder.
2. Write the new MUB's content through to the end and close it.
3. If an existing output is present, rename it to `M2MBACK.$$$`.
4. Rename the temporary file to the requested final MUB name.
5. After a successful swap, clean up the previous file's backup.

While saving, there must be room for the previous result and the new result to exist together. Secure enough space to write the whole new MUB while the existing MUB remains. The backup is a rename of the previous file, so it is not a scheme that makes a third complete copy of the old data. Directory entries are needed additionally, however.

If writing or closing the temporary file fails, the existing final file is preserved. If the rename fails, recovery to the previous name is attempted. When even that recovery fails, the previous file's bytes are left in `M2MBACK.$$$`.

There are also cases where only the backup deletion fails after the swap has completed. In that case, even with an error displayed, the new final MUB and the previous backup may both be present. Do not decide from the message alone which file is newest — check the contents.

### Reserve the temporary filenames

If `M2MTEMP.$$$` and `M2MBACK.$$$` already exist, the program stops rather than overwriting them casually. They may be files you created, or recovery material from an earlier failure. Do not use these two names as your output name.

### Ctrl-C, STOP, media errors

On a DOS abort it tries to clean up the temporary output handle it opened. If the disk itself is unwritable, however, there is no guarantee that even deleting the temporary file will succeed.

Ctrl-C or STOP can lead to aborting the whole BAT, not just the current song. If DOS asks whether to terminate the batch, answer according to the prompt on screen. Do not assume the same BAT resumes by itself after an interruption.

### Recovery steps before running again

1. Connect the media reliably and confirm the current folder and the output folder.
2. Check the existence and size of the final MUB, `M2MBACK.$$$` and `M2MTEMP.$$$`.
3. Preserve any leftover backup and temporary files under another name or on other media first.
4. Confirm the backup is the previously correct file. A temporary file may be incomplete, so do not distribute it as-is.
5. If the final file is absent and the backup is the previous correct result, preserve that backup and then restore it.
6. Resolve the space, attribute and media problems, tidy things so the reserved filenames do not collide, and compile again.

For instance, once you have confirmed the backup's content is the previous correct MUB, you can copy it for safekeeping under a name such as `RECOVER.MUB`. This guide does not offer a recovery command that bulk-deletes without checking contents. Preserving the possibility of recovery comes first.

Even this saving scheme does not guarantee atomicity against a power cut or FAT corruption. Back up important originals and finished work on separate media as well.

<a id="18"></a>

## 18. Comparing against an original MUB, and using MD5

### What has to match for two MUBs to be "the same"

Separating the levels of comparison makes it easier to find the cause.

| Compared | What it confirms |
|---|---|
| Music DATA | Whether the channel events and the actual FM voice parameters are the same |
| PCM block | Whether the same bytes of the same bank are included |
| Tags and header | Whether the title, line breaks, lengths and offsets, and additional metadata are the same |
| The whole file | Whether every byte from start to finish, and the total length, are the same |

Even with the same number of FM voices and the same channel table, the actual 25-byte voice parameters can differ. An identical DATA size likewise does not mean identical DATA content.

### The per-input `.MD5` file

To embed the MUC source hash, the current version reads a `.MD5` file with the same name as the input.

```text
SONG.MUC  →  SONG.MD5
BOS010.MUC  →  BOS010.MD5
```

Even if you specify `TEST.MUB` as the output, the hash file is `SONG.MD5` when the input is `SONG.MUC`. The former shared `MUBHASH.TXT` is no longer used.

The conditions on the file's content are as follows.

- It is the MD5 of **the entire source bytes** of that MUC.
- Put in only 32 ASCII hexadecimal characters.
- Do not include line breaks, a BOM, whitespace or a filename.
- The file size must be exactly 32 bytes.
- Uppercase hexadecimal is accepted but normalized to lowercase in the output.

If the `.MD5` is absent, has a wrong size or characters, or fails to read, 32 ASCII `0` characters are written into `#mmlhash`. This does not mean the whole MUB or the music DATA is zeroed.

Above all, **this is not a feature that computes MD5 on the MSX and collates it against the source.** It is a feature that accepts a correctly formatted external value and embeds it. A stale `.MD5` can go straight in as long as the format is right, so if you modify the MUC you must regenerate the hash too.

### Making a `.MD5` on a PC

The following is not an MSX-DOS command but **an example run under Python 3 on a PC**. It reads `SONG.MUC` in the working folder and creates or updates `SONG.MD5`.

```python
from pathlib import Path
import hashlib

source = Path("SONG.MUC")
digest = hashlib.md5(source.read_bytes()).hexdigest()
source.with_suffix(".MD5").write_bytes(digest.encode("ascii"))
```

Because it reads and writes in binary, it does not translate line endings, and it appends no newline to the `.MD5`. Move the resulting file to the MSX side along with the MUC. If the MUC's character encoding or line endings change during transfer, it has to be recalculated.

### To match the original exactly

1. Confirm the MUC is the same source bytes.
2. Use the identical FM voice library and PCM bank.
3. Prepare the `.MD5` that matches the input.
4. Compare compile results from the same syntax and compatibility basis.
5. Look for differences separately in the header, DATA, tags and PCM.

If the original MUB was made with a different version, options or metadata rules, the whole file can differ even when the music DATA is the same. This version's additional tags include `#mucver 1.7d`, `#mmlhash` and a fixed UUID. Do not interpret that UUID as a unique identifier computed afresh for each song.

A simple whole-byte comparison can also be done on a PC.

```python
from pathlib import Path

original = Path("ORIGINAL.MUB").read_bytes()
compiled = Path("TEST.MUB").read_bytes()
print("exact match" if original == compiled else "differs")
print("original:", len(original), "bytes / result:", len(compiled), "bytes")
```

This comparison is an exact-match check including length. If it reports a difference, do not immediately conclude the compiler's music DATA is wrong — find out which section differs. Conversely, do not dismiss a binary difference as nonexistent just because it sounds fine.

<a id="19"></a>

## 19. Using it with mucplay, mucEdit and mubplay

It helps to think of each program's role like this.

- **muc2mub**: compiles a MUC under DOS and saves it as a MUB file.
- **mucplay**: used for compiling and playing a MUC.
- **mucEdit**: used for editing source and checking it in concert with mucplay.
- **mubplay**: used on the playback side for a MUB that has been built.

Programs sharing the compiler are best used as a matching set of current builds. If an older executable is left in another folder or on the DOS search path, you can end up running the previous version while believing you are testing the new one.

What muc2mub reads is **the MUC saved on disk**. If unsaved changes remain in an editor, a separately launched muc2mub has no way to know about them. Save the source before doing a standalone conversion.

Do not read standalone muc2mub's 64 KiB input support as mucEdit's editing buffer limit. The current companion editor has its own 24 KiB limit on normalized source. Being able to compile a large file standalone and being able to edit the same size in the editor are different things.

In editor integration and mucplay's persistent session, unsaved edits are not represented by the MD5 of the older source file. So even with identical music DATA, `#mmlhash` can differ from standalone muc2mub. Compare the hash difference and the music data difference separately in that case.

<a id="20"></a>

## 20. Frequently asked questions

### Does it work in Z80 mode?

Yes. It is a DOS program targeting the Z80 and was verified on Z80 configurations. R800 is not required.

### What is the average compile time?

It is not determined by source size alone. It varies with channel makeup, event count, macros, voices, PCM size, the storage device and the DOS environment. An emulator's accelerated run time is also not the same as real Z80 time. This guide does not offer an unfounded average in seconds.

When measuring, record the CPU mode, emulator speed setting, mapper configuration, storage media and MUC/PCM sizes as well, and run the same song several times. The time from program start to `Done.` covers not just compilation but file reading and saving too.

### What is the average MUB size?

There is no fixed ratio. Comments are not converted into music events, macro calls can increase events, and PCM greatly increases the final file size. Start by separating the DATA size from the PCM size.

### If the MUC is 64 KiB, is the MUB also up to 64 KiB?

No. The input source limit, the music DATA area and the final file size are each different. The final MUB can exceed 64 KiB because of PCM.

### It says `Done.` but the FM sound is wrong.

Check first the existence and content of the external voice file, the current folder, and the 8.3 name. Also check the numbers and parameter order of inline definitions. A missing voice file is not always reported as an error.

### FM plays but only PCM is missing.

Check in turn the missing-PCM warning, whether channel K is used, the position and filename of `#pcm`, the bank's content, and the player's ADPCM support. Also consider that a different file from the original sample may have been used.

### Only some channels of the song are missing.

Check whether the channel lines are indented, or in lowercase or comma form. Look at the warning log and the original lines. Control characters in the middle of the file, faulty macros and unsupported syntax are also worth checking.

### Is there an option to suppress a warning about missing PCM?

There is currently no separate warning-suppression or strict-mode option. Check the log and distinguish a warning for a song that needs no PCM from a genuine absence.

### Can I stop it overwriting an existing MUB?

There is no separate option to unconditionally forbid overwriting. Specify a different output name or folder. A valid existing output is replaced via the safe-save procedure.

### It failed, but the old MUB is still there.

The existing result was protected. That does not mean this run succeeded. Check the log and the exit status.

### I have 4 MiB of RAM but still get an output buffer overflow.

Installed RAM and the music DATA limit are different. The current limit of the two output segments does not grow automatically with added memory.

### Can I compile without a `.MD5`?

You can. It writes 32 `0` characters into the part representing the source hash. Using it for playback and verifying a whole-byte match against an original MUB are different requirements.

### Once it compiles, can I release it as finished?

Check the warnings, the external assets and the resulting playback first. If reproducing an original is the goal, you need to go as far as a binary comparison. A successful compile is one step in confirming completion.

<a id="21"></a>

## 21. Pre-release checklist and reporting problems

### When you have finished one song

- [ ] Ran the intended, current `MUC2MUB.COM`.
- [ ] Saved the edited MUC to disk.
- [ ] Ran it from the folder and drive that match the song.
- [ ] The FM voice and PCM files are the correct version and content.
- [ ] Checked the exit status and the warnings.
- [ ] Confirmed the generated file is this run's result, not an older MUB.
- [ ] Played not only the opening but the end of the song, the repeats, and the PCM sections.
- [ ] If reproducing an original, compared DATA, PCM, tags and the whole byte stream.
- [ ] Checked the copyright and asset usage terms needed for final release.
- [ ] Backed up the original source and the required assets separately.

### When you have converted several songs

- [ ] The count and names of the planned input list and the actual result list agree.
- [ ] Checked each song's failures and warnings individually.
- [ ] Did not mix same-named assets from different albums.
- [ ] Did not count an older MUB left after an error as a new successful result.
- [ ] Checked the content of leftover temporary and backup files and kept what was needed.
- [ ] Regenerated the `.MD5` for any modified MUC.

### When reporting a problem

Rather than "it will not compile," supplying the information below narrows down the cause far faster.

```text
MUC2MUB version:
MSX model / emulator and machine settings:
CPU mode:
DOS / Nextor version:
Memory mapper configuration:
Storage media:
Current drive and folder:
The complete command typed:
MUC filename / actual byte count / encoding / line endings:
Voice file and PCM file used:
The complete warning and error messages:
The minimal source, or the line, that triggers the problem:
Expected result and actual result:
Origin and compile conditions of the original MUB compared against:
State of any leftover final, temporary and backup files:
```

If possible, keep a text log together with a small reproducible source. If you do not have the right to publish the music or assets, it is best to first reduce it to a minimal reproduction containing nothing sensitive.

Finally, please remember just one thing. **Preparing the source and assets correctly, reading the warnings, and checking the song you built** is the most dependable way to use this. It may feel a little tedious at first, but keeping to that order makes the results far easier to trust and manage — whether you are revising a single song or batch-converting dozens.
