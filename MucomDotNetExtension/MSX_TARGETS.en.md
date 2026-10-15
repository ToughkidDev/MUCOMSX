# MSX-MUSIC and internal PSG compatibility targets

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
preserves the caller's CPU. Compile/offline export do not automatically switch CPU.

Native songs use MUCOMSX-specific `msPb0100` magic with a `.MUB` extension.
Ordinary MUB8/muPb and their OPNA interpretation remain unchanged. Other MUB
players must not be assumed to support this new profile. VGM records YM2413
`0x51` and AY PSG `0xA0` writes and both clock fields alongside OPNA.

Limits: MUC input 65,536 bytes; editor 60,000 bytes; music DATA 122,880 bytes.
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
