# SCC/SCC+ SSG extension and PCMInvert

Install all four executables as a matching set. Release old sessions before replacement.

`#SSGExtend On` approximates mucomDotNET's virtual SSG waveforms with SCC or SCC+. It does not give a physical YM2608 arbitrary-waveform hardware. Unprefixed D/E/F tones use channels 1–3; noise stays on MAKOTO. MSXD/E/F remain internal PSG parts. FM, rhythm and ADPCM routing are unchanged. Ordinary SCC's shared channel 4/5 waveform is not used by this three-channel path.

Both `#SSGExtend` and `#PCMInvert` default to Off. Put them before music rows in the first source window. On/Off is case-insensitive; invalid values or late tags are errors.

```text
#SSGExtend On
D @0 @I8 v15 t180 o4 l8 cdefgab>c
E @0 @I9 v12 o3 l4 ceg>c
```

Ordinary `@n` selects a software envelope; `@I`/`@W` select a waveform. Specify a suitable envelope and volume.

- `@I0`–`@I7`: pulses with duty 8/16 through 1/16; `@I8`: triangle; `@I9`: sawtooth.
- `@W0`–`@W255`: select a definition with exactly 64 signed samples (-128..127 or hex `$00`..`$FF`). A definition starts on its own ` @Wn` row, followed by samples, conventionally four rows of 16 comma-separated values. See the [complete example](SSG_EXTEND.md). Adjacent pairs are averaged into 32 SCC samples at compile time. The last duplicate definition wins. Later source banks and macro selections are supported. Undefined waves, bad ranges or sample counts are errors. Each selection embeds 32 bytes in DATA; there is no extra waveform bank.
- `peL,R`: 0..8 per side, converted using mucomDotNET's gain curve and averaged to mono. `pe0,0` mutes, `pe8,8` is full gain.
- `p1`/`p2`: half-gain mono; `p3`: full mono. `p4`–`p6` become fixed half-gain mono, not moving stereo. Optional delay parameters are consumed. With SSGExtend Off, the old SSG noise meaning of `p` is unchanged.

These waveform/pan extensions require SSGExtend On and unprefixed D/E/F. Invalid parts and arguments are rejected.

SCC+ is mono, with 32 samples and linear 4-bit volume. Low SSG levels may quantize to silence. Software envelopes, pitch LFO and portamento feed the converted SCC period/volume. Extreme high pitches are clamped to SCC's minimum period. `S`/`m` hardware envelopes fall back to MAKOTO square/noise; the custom waveform is not heard in that mode, and intermediate `pe` attenuation is not reproduced (full mute is supported). An approximation notice is printed at playback/export startup. This is not bit-exact PC virtual-SSG reproduction. Page ownership changes restore the page's saved wave/gain; pages still share physical channels.

Hardware: MAKOTO plus SCC or SCC+. Search covers BIOS-enumerated primary slots 0–3 and expanded subslots 0–3, trying all SCC+ candidates first and falling back to SCC. MegaFlashROM SCC+ SD uses internal subslot 1. registered DOS RAM mappers are skipped before writes; reversible two-pattern checks at 8000h/A000h reject other RAM before probing/restoring a waveform byte. BIOS inter-slot access protects the banked executing code. Deformation registers are never read. This cannot guarantee that every unusual peripheral has no write side effects. Missing both chips aborts live playback; export needs no physical SCC. The exclusive lease ends with all five channels muted, SCC bank 9000h=2 or SCC+ bank B000h=3, then BFFFh=0. Arbitrary previous write-only register state is not restored. Do not share with an active SCC TSR. MUCVOICE also supports both chips: enter 255 for automatic keyboard-audition detection, or a known BIOS slot ID.

Minimum mapper remains 512 KiB. Code and loader caches reuse the existing 16 KiB native driver bank; no mapper bank is added. Existing input, editor and 120 KiB DATA limits remain. This does not guarantee simultaneous allocation for every maximum-size session.

## Container and VGM

Existing MUB8/muPb0100 selection and msPb0100 native MSX output remain. SSGExtend produces **msPb0101**, using byte 26 capabilities: bit 0 = native MSX parts, bit 1 = SCC-family SSG. The same MUB works on both chips; no new DATA/version is needed for SCC support. Allowed values are 2 (SSG) and 3 (combined); bytes 27–33 must be zero. Unknown flags/versions are rejected. This is a MUCOMSX profile, not the upstream jump fields occupying that header area. Old MUCOMSX and PC muPb players must not be assumed compatible.

SSG DATA commands: `FF ED n` (preset 0–9), `FF ED FF` plus 32 bytes (wave), `FF EE gain` (mono 0–255), valid only in versioned D/E/F streams. Existing page directories and DATA structure are reused. Standalone MUC2MUB and MUCPLAY/MUCEDIT exports use the same writer.

VGM uses version 1.61, clock 1,789,773Hz without the SCC+-only flag, and common SCC waveform port 0 (`D2`), alongside OPNA noise/hardware-envelope output. This permits VGMPlay MSX to select SCC or SCC+, regardless of which chip was used live. Only three waves are recorded, so nothing is lost by this common format. It replaces the prior development build's SCC+-only port 4 export; it does not make five independent SCC+ waves reproducible on ordinary SCC.

## PCMInvert

`#PCMInvert On` reverses K/ADPCM relative octave `>`/`<` at compile time only. `K o4 c > d < e` becomes the same notes as Off with `K o4 c < d > e`. Absolute `o`, other parts and sample bytes are unchanged. This work does not separately implement the `#invert` tag. There is no additional runtime processing, and PCMInvert alone does not force msPb0101.

MUCEDIT uses the matching MUCPLAY through its existing bridge: load, compile, play, EXPMUB, EXPVGM. Release old sessions before replacing executables.
