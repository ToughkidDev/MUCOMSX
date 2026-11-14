# MSX-MUSIC and internal PSG compatibility targets

Install MUC2MUB, MUCPLAY and MUBPLAY with the matching build of each `.MXR`, in the current DOS directory or `PATH`. Modules load at startup, never during playback ticks. Music DATA is limited to 96KiB (98,304 bytes).

For scoped MSX PSG/SCC+ notes, shared phrases, waveform morph, sweeps and envelopes, see the [MSX control guide](SCC_CONTROL.en.md) and `docs/MSX_MML_EN.TXT` in the documentation ZIP. These commands coexist with OPNA without a global mode.

Implemented 2026-10-03. Reuses OPNA-oriented MUC notation to produce a similar
arrangement on YM2413 and the internal MSX PSG, not waveform-identical emulation.

| Prefix | Target |
| --- | --- |
| MSXA/B/C/H/I/J | YM2413 melodic channels 1–6 |
| MSXG | OPLL bass drum, snare, cymbal, hi-hat and tom |
| MSXD/E/F | Internal PSG channels 1–3 |
| Unprefixed A–K | Existing MAKOTO/OPNA routing, unchanged |

Pages 0–9 remain software pages sharing physical channels. `D0` is still OPNA
SSG; `MSXD0` is internal PSG. A bare selector means page 0. Prefixes apply to
the entire selector list (`MSXABC`, `MSXDE`, `MSXA09`). Use separate rows to mix
native and OPNA parts. `MSXK` and native FM3 special-operator commands are rejected.

```text
MSXD @0 v12 t180 o5 l8 cdefgab>c
MSXE @0 v10 o4 l4 c g e g
MSXG v63,31,31,31,31,31,31 @31 l8 c r c r
```

Notes, timing, ties, repeats, macros, software LFO and portamento reuse the
existing compiler/player. PSG tone/noise/envelope periods are clock-converted;
I/O bits in register 7 are preserved and music writes to registers 14/15 blocked.
Set an appropriate PSG software envelope, not only volume.

FM voices are projected to two-operator features and matched by parameter distance
to 15 ROM presets. This is not spectral fitting or guaranteed perceptual matching.
No shared custom patch is overwritten. RIM has no counterpart and is omitted.
Stereo pan becomes mono, with mute retained. Unsupported chip-specific writes,
SSG-EG, hardware-LFO requests and clipped pitches produce a mapping diagnostic.
Direct `y` commands retain OPNA register semantics, not native OPLL addresses.

Use the usual MUC2MUB, MUCPLAY, MUBPLAY and MUCEDIT workflow; no target CLI switch.
Playback currently requires MAKOTO plus MSX-MUSIC, even for PSG-only MSX parts.
Supported Panasonic machines accelerate playback; turbo R uses R800. `/N`
preserves the caller's CPU. Compilation does not automatically switch CPU.
However, on a One Chip MSX (OCM) all four tools, with or without `/N`, set the cartridge
slot clock to 3.58 MHz and raise the CPU to 8.06 MHz (MUC2MUB while compiling,
MUCEDIT while the editor runs), restoring the original speed and slot clock at
exit, after an error or on abort.

Native songs use MUCOMSX-specific `msPb0100` magic with a `.MUB` extension.
Ordinary MUB8/muPb and their OPNA interpretation remain unchanged. Other MUB
players must not be assumed to support this new profile.
The toolchain's VGM output was removed on 2026-10-30; save a .vgm from MUCPlayground if you need one.

Limits: MUC input 65,536 bytes; editor 60,000 bytes; music DATA 98,304 bytes.
Final MUB may be larger because of headers/tags/PCM. Each native page must fit
within a 60,000-byte virtual area including the 894-byte prefix.
Minimum mapper remains 512KiB; driver uses one bank and native page state two
additional banks. Actual free memory varies with resident software and page/repeat structure. Release large sessions if another document cannot be loaded. Heavy scores may exceed playback tick budgets.

Container: 220 page entries, 1,986-byte header; second group is the native target.
Native K must contain only zero end markers with no loops and is never scheduled.
Internal compiler markers F1/F5 use a 894-byte prefix, voice LE32 at +886 and
total LE32 at +890. These are not the disk header offsets.

The matching table is BSD-3-Clause ymfm preset data credited to David Viens and
Hubert Lamontagne. See packaged NOTICE and YMFM-LICENSE. No GPL converter or
Nuked-OPLL emulator code is distributed. See the Korean guide for detailed usage.

## Five dedicated SCC channels: SCCA–SCCE

`SCCA` through `SCCE` address SCC/SCC+ channels 1–5. OPNA `D/E/F` and internal PSG `MSXD/MSXE/MSXF` keep their meanings. Use `SCCABC` to select several channels or `SCCA9` for page 9; pages 0–9 share the same physical channel.

```text
#title SCC five voices
#sccvoice SCCVOICE.DAT
SCCA @0 o4 v15 l8 cdefgab>c
SCCB @1 o3 v12 l4 ceg>c
SCCC @2 o3 v12 l4 egb>e
SCCD @3 o2 v10 l4 cgcg
SCCE @4 o5 v10 l8 rcrc rcrc
```

Place `#sccvoice` in the initial header. Its default is `SCCVOICE.DAT`. Keep the bank beside the MUC in the DOS working directory, using a plain 8.3 filename. This is **SCWD v1**, separate from FM `#voice`. Banks saved from the SCC bank of [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/) or by SCC Wave Tools work here. `@0`–`@255` select defined waveform IDs. Missing IDs, bad CRC, unsupported versions, incorrect lengths and unordered IDs are errors. Each wave has 32 signed 8-bit samples.

Notes, rests, lengths, octaves, volume, gates, ties, repeats, macros and software pitch changes use SSG-style commands. Each page receives an initial software envelope independently of its waveform. SCC has no OPNA noise generator, hardware envelope or stereo pan; this mode does not reproduce those hardware features. Do not combine it with `#SSGExtend On` or raw SCC streams: they share the same physical chip.

SCC+ has five independent waveforms. Ordinary SCC plays five pitches but **SCCD/SCCE share waveform RAM**: the last waveform write affects both. Use SCC+ for five different simultaneous waveforms.

Supported paths are MUC2MUB conversion; MUCPLAY/MUCEDIT compilation, playback and MUB export; and MUBPLAY playback. Wave samples are embedded in MUB. Inline definitions below remove the need for DAT during recompilation as well as playback.

Dedicated SCC scores produce **msPb0102** MUB files. Install the current four COM files together. Do not assume compatibility with older msPb0100/0101 players or external players not updated for this profile. Existing scores retain their formats.

Limits remain a 512KiB minimum mapper, 65,536-byte MUC input, 60,000-byte MUCEDIT documents and 98,304-byte music DATA. The SCWD waveform cache is allocated separately when needed and does not share the 16KiB extension-code bank. SCC page state adds one 16KiB bank to the existing native group; available memory also depends on DOS and resident software. Release other sessions if memory is insufficient.


## Inline SCC waveforms in MUC

Define a 32-byte SCC waveform with `@Wnumber:{ ... }`, following the brace form of OPNA voice definitions, and select it with `@number` in a part. When all required SCC waves are defined inline, compilation, playback and MUB export need neither `#sccvoice` nor an external DAT.

```muc
  @W7:{
    -128,-120,-112,-104,-96,-88,-80,-72,
    -64,-56,-48,-40,-32,-24,-16,-8,
    0,8,16,24,32,40,48,56,
    64,72,80,88,96,104,112,120
  }
SCCA @7 o4 v15 l8 cdefgab>c
```

IDs are 0–255. Supply exactly 32 decimal integers in -128–127, separated by commas, whitespace or line breaks; `;` comments are allowed. Start a definition with `@W` after optional indentation. Legacy `@Wnumber = { ... }` and bare `@Wnumber` followed by 32 values on subsequent lines are also accepted. Duplicate inline SCC IDs, invalid counts/ranges and selecting an undefined ID are errors. FM `@7` and SCC `@W7` are independent.

When used with an external SCWD bank, inline definitions override matching IDs. An explicitly named `#sccvoice` file must exist and any loaded DAT must be valid; remove that header for DAT-free use. Without the header the compiler still looks for default `SCCVOICE.DAT`, but a missing default does not prevent inline definitions.

MUCPlayground's SCC wave editor (**Edit** in the SCC bank) inserts the edited wave into the MUC as an `@Wnumber:{ ... }` definition ([MUCPlayground user's guide](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/Manual/?lang=en#banks); chapter 5 of `shared/docs/MUCPLAYGROUND.en.md` in the documentation ZIP). It adds definitions only; add SCCA–SCCE score lines as above. The 512KiB mapper requirement and existing MUC/music DATA limits are unchanged. This is separate from the 64-sample `@W` in `#SSGExtend On`; do not combine the two modes.

## SCC controls, tables and runtime phrases

[SCC control engine](SCC_CONTROL.en.md)

The existing 16KiB extension reserve now contains 1KiB of immutable compact compiler code, leaving 15KiB for further expansion. Mapper bank count and the 96KiB MUB limit are unchanged.
