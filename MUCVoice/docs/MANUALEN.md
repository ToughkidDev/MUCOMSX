# MUCVOICE v0.5beta — User manual

[日本語](MANUALJA.md)

MUCVOICE is a voice editor for MSX-DOS2/Nextor. It edits YM2608 FM voices and 32-sample SCC/SCC+ waveforms, imports voices from DAT, TFI, MUC and VGM, and saves reusable banks or inline definitions. It is not a full-song editor or compiler; use MUCEDIT, MUCPLAY, MUC2MUB and MUBPLAY for scores.

## 1. Installation and requirements

Copy `MUCVOICE.COM`, `FMVOICE.DAT`, `SCCVOICE.DAT` and `INIT.TFI` to your SD or disk. Run `MUCVOICE` from the directory where you want to read and save files. DOS/Nextor system files and cartridge ROMs are not supplied.

Use MSX-DOS2 or compatible Nextor. A 512KiB mapper environment is recommended. The program needs usable TPA from 0100h through D5DFh and at least 512 bytes of stack space above D5E0h; it refuses to start if the initial stack is below D7E0h. The graphical browser and preset screens reserve one free 16KiB USER mapper segment and release it on exit. If allocation fails, basic editing and `L` filename loading remain available, while `P` falls back to numeric selection and `O` browsing is unavailable. The program does not change CPU speed.

FM audition requires MAKOTO YM2608 at I/O 14h–17h. SCC audition requires a detected SCC/SCC+ cartridge. Editing and file conversion do not require either sound chip. Stop other music before auditioning: the editor takes over chip settings and does not restore another player's previous voices or cartridge banks.

```text
A>MUCVOICE
A>MUCVOICE /TEXT
```

The default interface uses SCREEN 2, 256×192 pixels. `/TEXT` uses DOS console input: press Enter after commands and answers. In the graphical interface, command keys act immediately, but filenames and confirmation answers require Enter. On exit, the previous screen mode and BIOS colors are restored, not the previous screen's pixels. There is no mouse support.

## 2. First voice

1. Press `F` for FM or `W` for SCC/SCC+.
2. Press `I` to choose a destination slot, 0–255.
3. Press `P`, choose a preset with the arrows, and audition it with Space or `C D E F G A B`.
4. Press Enter to apply that preset to the current slot; Esc cancels.
5. Select a parameter or sample and type its new value directly. Enter commits; Tab commits and moves on; Esc cancels.
6. Press `K` to audition the edited voice on the keyboard.
7. Press `S` to save the bank to a DAT file. Use different filenames for FM and SCC: their DAT formats are not interchangeable.

## 3. Main commands

| Key | Action |
| --- | --- |
| F / W | Switch to FM / SCC; keep the slot number |
| I / [ / ] | Select a slot / previous slot / next slot |
| E / F2 / Enter | Edit the selected value, initially selecting its current text |
| P | Choose a built-in preset for the current slot |
| N | Edit the FM name, up to six ASCII characters |
| C | Copy the current record to another slot; confirm with Y |
| U / Ctrl+Z | Undo the most recent single-record edit |
| O / Ctrl+O | Browse DAT files; in `/TEXT`, enter a filename |
| L | Load a DAT by its local 8.3 filename |
| T | Import one TFI into the current FM slot |
| R | Merge inline FM/SCC definitions from MUC, preserving their IDs |
| G | Extract voices from an uncompressed VGM into free slots |
| B | Export all defined slots of the current bank as MUC definitions |
| X | Export the current FM voice with a short score, or one SCC definition |
| S | Save DAT, with filename editing and overwrite confirmation |
| Ctrl+S | Save to the remembered DAT name; ask for a name if none is known |
| Ctrl+Shift+S | Save As, starting with an empty filename |
| D | Mark an FM slot free, or delete a defined SCC waveform |
| V | Export a single-voice audition VGM |
| A | Audition the current FM voice on MAKOTO FM1 |
| K | Enter the monophonic keyboard mode |
| Q / Ctrl+Q | Quit; confirm discarding unsaved changes |

Tab/Shift+Tab moves between fields; Ctrl+Tab switches banks. In FM, arrows select parameters and `+`/`-` changes them by one. In SCC, left/right selects samples and up/down adjusts values. SCC `-` begins negative-number input, so use Down to decrease a sample. Main-screen Esc does not quit.

## 4. Numeric input and Undo

Type at the selected value without entering a separate editor. `F2`, `E` or Enter starts with the existing value selected. During input, left/right moves the text cursor, Home moves to the start, Ctrl+E to the end, and Ctrl+A selects all. Backspace deletes before the cursor; Delete deletes at it. Ctrl+U clears the input. Ctrl+C/X/V copies, cuts or pastes the whole input using an internal clipboard, not the PC clipboard. Partial-range selection is unsupported. The input buffer holds at most 63 characters; each field also has its own value or filename limits.

Enter commits, Tab commits and advances, and Esc cancels. Out-of-range values appear in red and remain editable. Until commit, only the input field shows the draft; the bank, graph, dirty state and Undo still represent the last committed value.

Holding up/down in sample editing, numeric input or keyboard-octave selection increases the step gently: 1 → 2 → 3 → 4. At 60Hz the changes occur after about 0.75, 1.5 and 2.5 seconds; at 50Hz, about 0.9, 1.8 and 3 seconds. Shift always keeps one-unit adjustment. Releasing, changing direction or pressing another command resets acceleration. Releasing Shift restarts at one. Values stop at the field limits instead of wrapping. Field navigation and text-cursor movement do not accelerate.

Undo is one recent record edit for the whole program, not a multi-step history for each bank. It also restores the record's defined state. Saving either bank retains Undo; loading or bulk-importing a bank clears Undo only if that bank owns it. Saving SCC does not erase an FM Undo. Held-arrow changes are undone one step at a time, not as one grouped operation.

`*` marks unsaved DAT changes. `F*` / `W*` shows both banks' state, including the hidden bank. `FREE` counts undefined slots. Exporting MUC or VGM does not save the DAT bank and does not clear its dirty indicator.

## 5. Presets and audition before applying

FM has 12 presets in a 4×3 tile grid; SCC has 32 waveforms in an 8×4 grid. Arrows move the selection without changing the edited bank. Enter copies the chosen preset to the current slot; Esc returns unchanged. A preset number is not a destination slot number. For example, choosing SCC preset 4 SINE while editing slot 40 replaces slot 40, not slot 4.

FM choices cover clean tone, piano, organ, bass, brass, pluck, guitar, bell, flute, lead and pad styles. SCC choices include silence, saw, triangle, square, sine, several pulse widths, organ/reed/bass shapes, stepped waves and harmonic mixtures. Factory presets are original synthesis definitions, not extracted commercial-game assets. Imported voices may have separate usage restrictions.

Space toggles an A4 preview. `C D E F G A B` plays C4–B4 while held; Shift raises it to C5–B5, so Shift+C gives the upper C. Letter case and Caps Lock do not change pitch. Only one note sounds at a time. Releasing a note key stops it; selecting, applying or cancelling stops any remaining sound. Preview also stops after 180 ticks, about 3 seconds at 60Hz or 3.6 seconds at 50Hz. Holding Space does not repeatedly toggle playback.

These keys apply to the preset and DAT-browser screens, not the main editor or `K` keyboard layout. When leaving with Enter/Esc while a note key is held, sound stops first and the next screen waits for key release. `NO CHIP` indicates unavailable or unresponsive hardware; editing remains possible. Preview never modifies the bank, its selected slot, dirty state, Undo or files.

## 6. DAT browser and file loading

Select `F` or `W`, then `O`/Ctrl+O. The browser lists folders and `.DAT` files starting in the DOS current directory. Up/down chooses a file, left/right chooses a voice within it, Enter opens a folder, Backspace goes up, and Esc cancels. Browsing does not change the DOS current directory or drive. To browse another drive, change drives in DOS before launching MUCVOICE. Names use DOS 8.3 format.

SCC preview displays the actual 32 signed samples only after checking the SCWD header, size, IDs and CRC32. FM preview displays the six-character name, ALG/FB and four operator envelope sketches. **FM drawings are not synthesized audio waveforms or exact chip simulations.** Space or the note keys lets you hear the selected voice before loading.

FM starts at the first apparently nonblank record. Tab toggles `NONBLANK`/`ALL`; left/right skips blank records in NONBLANK. This filter considers parameter bytes 1–25 and printable ASCII name bytes 26–31, ignoring reserved byte 0. It is not a test of audibility or a change to slot allocation. ALL lets you select intentionally zero/silent records. Invalid files and folders show an explanation rather than a stale waveform and cannot be auditioned.

**Enter on a DAT file loads the whole bank, not just the previewed voice.** Save your own bank first. Loading confirms unsaved-change discard, revalidates the file and replaces only the selected FM or SCC bank. Cancelling or a read/close/format error preserves the current bank and Undo. Successful loading clears that bank's Undo.

After browser loading, the bank's remembered save name is cleared. The next save asks for a new name in the original DOS current directory; it does not silently overwrite the browsed source. `L` remains available for direct local filenames. TFI/MUC/VGM import uses filename dialogs, not this DAT-only browser.

## 7. YM2608 FM editing and TFI

Select `F`, a slot with `I`, then a field with arrows/Tab. ALG and FB each range from 0 to 7. Operator fields use these limits:

| Field | Range | Meaning |
| --- | --- | --- |
| AR / DR / SR | 0–31 | Attack / decay / sustain rate |
| RR / SL | 0–15 | Release rate / sustain level |
| TL | 0–127 | Total level; a larger value attenuates more |
| KS | 0–3 | Key scaling |
| ML | 0–15 | Frequency multiplier |
| DT | 0–7 | Raw Yamaha detune code |
| AM | 0–1 | Amplitude-modulation enable |

In `/TEXT`, `E` operator 0 selects ALG/FB; operators 1–4 select their fields. FM envelopes are schematic. Carrier/modulator roles depend on ALG, so start auditioning at low speaker volume.

FM DAT uses 256 records × 32 bytes = 8,192 bytes. Hardware storage order OP1/OP3/OP2/OP4 differs from logical display order OP1–4. Editing preserves unrelated fields and reserved bits. Loading and saving without changes preserves the bytes. Existing CP932 name bytes are retained, but non-ASCII characters display as dots; `N` replaces the name with ASCII.

To import TFI: `F` → `I` → target slot → `T` → `BASS.TFI` → `Y`. Use a standard 42-byte TFM Maker TFI, with ALG/FB and four hardware-slot records of ML, DT, TL, KS, AR, DR, SR, RR, SL, SSG-EG. TFI detune 0–6 maps to Yamaha codes 7,6,5,0,1,2,3. AM becomes zero. Extra/truncated data and invalid ranges are rejected; DT ≥7 is not guessed or masked.

Only the selected FM record is replaced, and its name becomes the first six uppercase filename characters. `U` can undo the import. If SSG-EG is enabled, DAT cannot represent it: a warning asks permission to discard SSG-EG. Declining keeps the bank unchanged. Accepting loses that setting in audition, DAT, MUC and VGM output; preserve the original TFI.

## 8. SCC/SCC+ waveform editing

Select `W`, choose a slot with `I`, then use left/right to select one of samples 0–31. Type signed decimal values −128–127, or use up/down; Shift gives one-unit fine adjustment. `P` supplies a starting shape. Undefined slots can be defined by editing, applying a preset or copying. `D` deletes a waveform, except the final remaining one; Undo can restore it. SCC names are not editable because SCWD has no name field.

SCC DAT is **SCWD v1**, not FM VOICE.DAT: a 16-byte header plus 34 bytes per defined record, 1–256 records, at most 8,720 bytes. Header/version/reserved fields, ascending IDs, total length and CRC32 must be valid. Unlike FM DAT, the waveform ID list preserves which slots are defined. Both SCC and SCC+ use the same 32 signed samples. Do not supply an SCWD bank as FM `VOICE.DAT`.

## 9. MUC import and export

`R` parses the complete file before confirmation and merges definitions at their original IDs, 0–255. FM accepts multiline `@N`, brace-form `@N:{...}`, and raw `@%N`. Ordinary definitions contain FB, ALG, followed by OP1–4 with nine values each: AR, DR, SR, RR, SL, TL, KS, ML, DT. AM becomes zero. Raw definitions contain exactly 25 bytes, preserving AM and reserved bits, and accept decimal or `$FF` hexadecimal values.

SCC uses signed decimal samples and exactly 32 values:

```text
@W7 = {
-128,-120,-112,-104,-96,-88,-80,-72,
-64,-56,-48,-40,-32,-24,-16,-8,
0,8,16,24,32,40,48,56,
64,72,80,88,96,104,112,120
}
```

Whitespace, commas and semicolon comments are supported. Raw FM supports CRLF/LF/CR, an initial UTF-8 BOM and DOS Ctrl-Z EOF. SCC accepts optional plus signs and lowercase `@w`, but requires `=` and braces; hexadecimal SCC samples are not accepted.

Only definition lines whose first significant character is `@` are imported. The editor does not resolve external `#voice` banks or named `@"name"` presets, nor import SSG/rhythm/ADPCM definitions. Duplicate IDs of the same type, truncated definitions and out-of-range values are errors. In mixed FM/SCC files, both types are validated but only the selected bank is merged. FM `@7` and SCC `@W7` can coexist.

On success, the first imported definition becomes selected and the bank becomes dirty. Bulk import clears that bank's Undo; unchanged slots and the other bank are preserved. Cancellation or parsing/read/close errors apply nothing. A first SCC definition of slot 0 may be silence: choose another slot before auditioning.

`B` exports all defined slots in ID order: FM as raw `@%N`, SCC as `@W`. `X` exports one FM voice with a short score, or one defined SCC waveform only. SCC definition-only output is not a complete score; add supported parts and notes separately. The FM DAT record's first byte has no MUC equivalent and is not exported. FM comments carry up to six name bytes, with control characters made safe.

## 10. Defined slots and VGM extraction

Initially, FM slot 1 INIT and SCC slot 0 silence are defined. FM DAT has no allocation bitmap, so loading it marks all 256 slots defined, including silent-looking ones. To make space for `G`, choose a replaceable FM slot with `I`, then `D` → `Y`. This clears its defined flag without erasing its old raw bytes; Undo restores it. Importing a new voice later replaces those bytes. Save `B` MUC as well as DAT if you need to preserve a sparse FM slot list.

`G` reads an uncompressed VGM 1.00–1.71 and extracts the selected voice type. Starting at the current slot and wrapping after 255, it assigns free slots without overwriting defined ones. Exact duplicates are combined: 25 parameter bytes for FM, 32 samples for SCC; FM names/header are excluded from comparison. New FM names are `VGM`. Too few slots cancels the entire import, not just its remainder. Confirmation, read/close failures and cancellation preserve the bank. A successful bulk addition clears that bank's Undo; no new voices means no change.

YM2608 extraction handles writes 56h/57h and A6h/A7h for two chip instances, keeping their six channels separate. Complete 25-byte states are captured at key-on and active-note wait boundaries. TL is kept as recorded, not normalized; volume changes can therefore produce multiple voices. Key-off muting writes do not create new voices.

SCC extraction handles D2h waveform writes on port 0 (SCC) and port 4 (SCC+), including two instances, SCC CH4/5 sharing and SCC+ independent waveforms. Complete 32-byte states are collected at waits/end, even if no note sounded. Partial updates reuse known samples, not guessed zeros. Waveform write-protection is respected; test/deformation behavior itself is not stored in SCWD.

SSG-EG, hardware LFO, AMS/PMS, FM3 special mode and partial-operator key-on cannot be fully represented in basic DAT and can prompt a loss warning. Instrument names, score intent, time-varying pan/pitch/volume and waveform-change order are not recovered. Rhythm/SSG scores and ADPCM samples are not extracted. Keep the original VGM.

VGZ/gzip must be decompressed on a PC first; renaming its extension does not decompress it. DAC stream-control commands 90h–95h, undefined commands, unsupported versions and truncated commands/blocks are rejected. Other ordinary chip commands and data blocks are skipped by length. VGM loops are not repeatedly executed.

## 11. Keyboard audition and VGM output

For FM, `K` asks permission to take over MAKOTO. For SCC, enter `255` for automatic detection or a known BIOS slot ID, then confirm. Auto-detection searches SCC+ first, then SCC. Unexpanded slot IDs are 0–3; expanded IDs are `128 + primary slot + 4 × secondary slot`. For a MegaFlashROM SCC+ SD in primary slot 1/2, SCC secondary slot 1 gives 133/134. Do not guess arbitrary slots; RAM slots are rejected.

```text
Key:   Z  S  X  D  C  V  G  B  H  N  J  M  ,
Note:  C C#  D D#  E  F F#  G G#  A A#  B  upper C
```

Up/down changes the base octave, 2–6, initially 4. Shift gives one-step adjustment. The upper C extends the total range to C2–C7. One note sounds at a time; if multiple keys are held, the lowest takes priority. FM key release performs key-off, allowing release tails; SCC stops immediately. Space forces silence while held, then resumes a still-held note when released. Esc/STOP/Ctrl+C stops sound and returns after note keys are released. Keyboard audition does not edit bank data, dirty flags or Undo.

FM uses MAKOTO FM1; SCC/SCC+ uses CH1 at fixed volume 12. The program stops sound on normal exit, preserves CPU page-slot/mapper selections, and restores BIOS key-click settings. It does not restore old music/voices or arbitrary cartridge bank settings. Use idle cartridges only. Reset, power loss and hardware failure are outside normal cleanup.

`A` auditions FM1 near 440Hz after confirmation; any key stops and mutes it. `V` creates VGM 1.71: FM uses a 7.9872MHz YM2608 clock, about two seconds of sound then key-off and a half-second release before mute. The small MAKOTO 8MHz difference is expected. SCC audition output uses common SCC CH1/port 0; its player must support K051649/K052539 D2h commands. Both kinds are single-voice examples, not exports of a whole score.

## 12. Saving, filenames and troubleshooting

Filename dialogs accept local DOS 8.3 names such as `VOICE.DAT`, `BASS.TFI` and `WAVE.VGM`, with letters, digits, `_`, `-` and an extension dot. Drives, paths, wildcards and device names are rejected. Copy long-named source files under suitable 8.3 names before importing. Only the DAT browser traverses folders.

Successful `L`/`S` remembers a DAT filename per bank for this session. `S` lets you edit it and asks before replacing an existing file. Ctrl+S reuses a known successful name without repeating the name/overwrite questions; Ctrl+Shift+S requests a new name and confirms replacement. Browser loading clears the remembered name. `/TEXT` reuses it with an empty filename answer.

DAT saving writes and closes a temporary file, rereads and byte-compares it, then renames the original to a backup and installs the new file. It checks disk-buffer completion before removing the backup and clearing the dirty flag. Failure attempts restoration. Existing `MV$TEMP.$$$` or `MV$BACK.$$$` blocks saving rather than overwriting recovery files. This is not a guarantee against power loss or media failure. If recovery files are reported, inspect them in DOS before another save. Preserve important originals separately.

MUC/VGM output (`B`, `X`, `V`) creates new files only: choose another name or remove an unwanted old output yourself. `File not found` means an input cannot be located; `File exists` means output protection or replacement refusal. Other DOS errors show their codes. Use a new name on read-only media/files. Invalid DAT/TFI/MUC/VGM input leaves the current bank intact; check the required format instead of merely changing its extension.

If audition is silent, check the cartridge and selected slot: SCC slot 0 may intentionally be silence, or the current waveform may be undefined. `NO CHIP` does not mean the edited data was lost. If FM VGM import has no free slots after DAT loading, use `I` then `D` → `Y`. WAV-to-ADPCM bank construction, JSON/WAV import in the DOS editor, mouse control and external MIDI/USB velocity input are unsupported.

License and third-party attribution are supplied in `NOTICE.TXT` and `LICENSES/`. Check usage rights for imported voices before redistributing them.
