# MUCVOICE v0.5beta — MSX voice editor

[한국어](mucvoice.md) · [日本語](mucvoice.ja.md)

The MUCVOICE ZIP is separate from the four-tool archive. Read [release changes](../shared/docs/RELEASE_UPDATE_261013.en.md).

MUCVOICE edits YM2608 FM and SCC/SCC+ voices in MSX-DOS2/Nextor Screen 2. A 512KiB mapper environment is recommended. FM audition requires MAKOTO; SCC audition needs an SCC/SCC+ cartridge. `MUCVOICE /TEXT` selects the numeric console interface.

## First steps

1. Copy `MUCVOICE.COM`, `FMVOICE.DAT`, `SCCVOICE.DAT` and `INIT.TFI` to one SD folder. ROMs and DOS/Nextor system files are not supplied.
2. Run `MUCVOICE`, then `P` for the current FM/SCC factory-preset browser.
3. Select with arrows. SCC shows its 32-sample waveform; FM shows envelope/parameter graphics, not the actual synthesized audio waveform.
4. Audition with Space or `C D E F G A B` (C4–B4; Shift raises an octave). Enter applies; Esc returns without applying.
5. Type a numeric value directly at the cursor. Tab commits/moves; Esc cancels input. Held arrows accelerate gradually; Shift keeps one-unit adjustment.
6. Use `K` for keyboard audition, `S` to save and `Q`/Ctrl+Q to quit. Check the other bank's unsaved state too.

## Browse and import

`O`/Ctrl+O opens the file browser. Up/down selects files, left/right selects voices within the file; Tab toggles nonblank/all slots. Preview and audition before applying. Navigation, cancellation and exit stop remaining notes. Preview alone does not modify the user bank or Undo.

**Enter in the file browser loads the entire DAT bank, not just the previewed voice.** Unsaved-change confirmation and revalidation precede replacement: save your bank first. Enter opens a folder; Backspace goes up. Browsing does not change the DOS working directory. Saving after browser load asks for a name rather than immediately overwriting the browsed source. This differs from applying one preset to one slot with `P`.

Import DAT banks, TFI FM voices, FM/SCC definitions from MUC, and YM2608 FM or SCC/SCC+ waveforms from VGM. Decompress VGZ to VGM on a PC first. Unsupported commands such as DAC stream control are safely rejected. An extracted FM voice represents captured registers, not recovery of the original score's voice names or intent.

Export DAT or inline MUC voices for use in songs, or a single-voice VGM for testing. Consult the included `TFI.txt`, `MUCIO.txt` and `VGMIO.txt` for exact record/slot fields. WAV-to-ADPCM bank construction is unsupported. Use MUCEDIT/MUCPLAY/MUBPLAY for the whole score.

## Save and presets

Save names are reused. FM/SCC dirty state and Undo are separate; saving SCC does not clear FM Undo. Missing files and existing-file protection have distinct errors. Back up original banks/sources and reload saved output to check it.

The 12 FM / 32 SCC factory presets are original synthesis definitions. Check the usage terms of imported third-party voices.

## Detailed manuals

Read the [complete English user manual](docs/MANUALEN.md), or the [Japanese manual](docs/MANUALJA.md). Both cover editing, keyboard layouts, presets, DAT browsing, TFI/MUC/VGM import, export, saving and troubleshooting.

The ZIP contains project-original `README.TXT`, `QUICK.TXT`, `KEYBOARD.txt`, `PRESETS.TXT`, `TFI.txt`, `MUCIO.txt`, `VGMIO.txt`, `USABILITY.txt`; see also [individual documents](docs/). Attribution is in `NOTICE.TXT` / `LICENSES/`.

Audition is monophonic: FM uses MAKOTO, SCC uses the detected SCC/SCC+ cartridge. Do not run it alongside other music. Preview preserves banks and Undo, but loading with Enter replaces the entire DAT bank.
