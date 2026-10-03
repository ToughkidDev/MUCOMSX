# MUCOMSX mucomDotNET extension reference

Updated 2026-10-03. This guide covers the implemented extensions for one MAKOTO YM2608, not every mucomDotNET chip or file layout. See [build availability and verification limits](RELEASE_NOTES.md). The detailed Korean guide contains additional explanations: [한국어](MUCOMDOTNET_EXTENSIONS.md).

MucoMSX_261003.zip includes the music extensions, general pages and 120 KiB DATA support. Automatic CPU acceleration and /N belong to the separate October 3 CPU build; that existing runtime ZIP has not been replaced.

## Capacity and format

| Item | Limit |
| --- | --- |
| MUC compiler input | 65,536 bytes including tags, comments and line endings |
| Editor document | 60,000 bytes after newline normalization, four 16 KiB banks |
| Total compiled music DATA | 122,880 bytes including structural and voice data |
| One page event stream | 59,546 bytes |
| Software pages | A–K, pages 0–9 per part, up to 110 |
| Minimum mapper | 512 KiB; CPU acceleration adds no mapper bank |

The total MUB file also contains its header, tags and PCM. It can exceed 120 KiB. The compiler loads source into mapped memory, compiles and validates music DATA there, then writes the container. Export reads the specified prebuilt PCM bank from disk and appends it; this is not WAV conversion or a resident PCM block inside compiled music DATA.

Unextended songs retain MUB8. Extensions and large output use the muPb 0100 path, with the required mucomDotNET driver tag on export. Both use .MUB filenames. Comments and uncalled macros do not by themselves count as used extensions. Do not change a signature to convert formats. Mixing legacy four-byte FM3 S data with extended 16-bit S can be rejected; explicitly use #driver mucomDotNET for an extended score.

## Parts and pages

A/B/C are FM1/2/3; D/E/F are SSG1/2/3; G is rhythm; H/I/J are FM4/5/6; K is ADPCM-B. A0 through K9 keep separate score/effect state but share the physical channel for their part. Pages are not extra hardware voices. ABC shares a row across parts; C0123 selects several pages.

```mml
#driver mucomDotNET
A0 o4 l4 cdef
A1 o5 l4 r2 ga
ABC o4 l4 [|cdef|efga|gabc|]
```

The last row selects a different branch for each part in listed order. Branches work inside macros and may contain ordinary loops; nested part branches are not supported. Examples are syntax fragments, not newly playback-qualified songs. Supply any required FM voices and PCM samples.

## FM3 slots

C pages support EXON, EXOF, EX1 through EX1234 (list the desired operator digits), and EX0 to clear ownership. EX alone does not turn on special mode. Assign distinct operators to C0–C3 for separate scores, but remember that ALG/FB, pan and hardware LFO settings remain physically shared. Use voices with matching ALG/FB. Slot detune S takes four signed 16-bit values in extended mode, in operator order 4, 3, 1, 2. This differs from vm3 and KD order.

## Score and macro commands

| Syntax | Meaning |
| --- | --- |
| x with optional length | Repeat the previous pitch class in the current octave; first x uses c |
| l%n | Default length in ticks, related to the existing % command |
| *0 through *99999 | Extended macro identifiers; existing body/depth limits still apply |
| **n | Signed macro-number offset, reset per part/page; resulting ID must be in range |
| [&#124;...&#124;...&#124;] | Select a branch by the expanded part/page ordinal |

For example, **100 *1 **0 *1 calls defined macro 101 and then macro 1. This shifts identifiers, not musical pitch.

## FM volume and effects

| Syntax | Meaning and range |
| --- | --- |
| vm0 | Legacy volume |
| vm1, followed by 20 TL values | Redefine volume levels v15 down through v0 and four quieter levels; TL 0–127 |
| vm2 vN | Direct volume 0–127, with 127 loudest |
| vm3 vN | Retains the scalar volume command path |
| vm3 vN4,N3,N2,N1 | Carrier volumes in operator order 4,3,2,1; each 0–127 |
| KDd1,d2,d3,d4 | Key-on delays in ticks, operator order 1,2,3,4 |
| MTmask,baseTL | Apply LFO to FM TL; mask 0–15, TL 0–127 |
| @start,end,speed[,reset] | FM voice morphing; voices 0–255, speed 1–255 ticks, reset 0/1, default 1 |

vm3 accepts two or three operands as well as one or four. Omitted trailing operands use the reference sentinel, not zero fill or copies of the first value. Give all four for explicit control. #CarrierCorrection Yes/No controls original carrier TL correction; V and relative volume also affect the result.

KD values are normally within the C clock range; all zeros restore ordinary key-on. MT mask bits 0–3 mean operators 1–4; mask zero restores pitch LFO. Set LFO timing/depth with the existing M commands. Morphing moves parameters toward the target voice; speed 1 is fastest and reset 1 restarts on each note. Fast multi-page morphing can be expensive.

## SSG

S0–S15 selects a hardware envelope shape; m0–m65535 sets its period (smaller is faster). v returns to normal volume mode. The hardware envelope generator is shared among SSG channels.

MT1 applies software LFO to volume; MT0 returns it to pitch. Software envelopes can be combined with tremolo. @n=al,ar,dr,sl,sr,rr redefines preset n (0–15); all six values are 0–255. Only its E parameters change, not P/M; presets reset for a new song.

Fast hardware envelopes can produce triangle/saw-shaped amplitude changes on real YM2608. This is different from unsupported emulator-only @I8/@I9 waveforms.

## Rhythm and pan

p1 is right, p2 left, p3 both; FM p0 mutes. p4[,ticks] cycles right–centre–left–centre; p5 reverses this; p6 is random. Interval is 0–255 ticks and defaults to the current default note length.

On rhythm, @mask selects instruments: bits 0–5 are Bass, Snare, Cymbal, Hi-hat, Tom, Rim. A scalar vN (0–31) sets selected instrument volume. vm1 applies relative )( volume to selected instruments; vm0 restores legacy behavior. pm1 permits p1–p6 on selected instruments; pm0 keeps packed rhythm pan syntax.

```mml
#OPNA1RhythmMute SB
G @3 vm1 v20 pm1 p4,8 l4 cccc
```

The tag mutes Snare and Bass key-ons, without blocking key-offs. It survives compilation, sessions, export tags and supported external MUB tag loading.

## MIDI style and ADPCM portamento

| Command | Meaning |
| --- | --- |
| POon,offset,time | On is 0/1; initial offset is -128–127 semitones; time is ticks, not ms |
| POSon | Change the switch |
| PORoffset | Reset the starting pitch relative to the current note |
| POLtime | Change transition time |
| _ | Invert the enabled state for the next note only |
| __ | Same one-note inversion; when enabling, use the initial offset |

Supported on FM, FM3, SSG and ADPCM K, not fixed-pitch rhythm. The first enabled note starts at its own pitch plus offset; later notes start from the preceding target. Use ordinary 0–C tick durations for portable scores; the current parser stores a 16-bit time. Ties, gate timing, transposition and page state are handled.

```mml
A o4 l4 PO1,-7,16 cdef POS0 g _a b
K @1 v160 o4 l4 PO1,-7,16 cdef
K @1 v160 o4 l4 M1,1,8,8 cdef
K @1 v160 o4 l4 {c4g} {g4c}
K @1 v160 E255,255,8,128,4,16 o4 l4 cdef
```

K examples require PCM sample 1. They show separate examples of MIDI portamento, pitch LFO (delay,counter,delta,peak), brace portamento and six-parameter software envelope (each 0–255). Pitch effects change Delta-N. Legacy unextended PCM note tuning is retained. Non-owning K pages cannot overwrite the active sample pitch; one reference comparison intentionally differs for this reason.

## Register writes and compatibility limits

y0,port,address,value writes to the first OPNA, port 0/1, address/value 0–255. Other chip IDs are rejected. Raw timer/key/PCM writes may conflict with driver state.

Not implemented: #PCMInvert; #@pcm WAV-to-ADPCM bank creation; PCn and quoted IDE part memos; additional OPNA/OPNB/OPM hardware and @M voices; emulator-only #SSGExtend On, pe, @I and @W. Prebuilt PCM banks and real hardware S/m envelopes are supported. External muPb support is limited to the supported first-OPNA layout, not arbitrary multi-chip containers.

## Editor and playback checks

Use a matching build set, release old sessions before replacing binaries, and follow load → edit → compile → play → EXPMUB → MUBPLAY → EXPVGM. MUCPLAY filename mode compiles MUC; it does not open disk MUB. Editor compiler drafts use LF while normal saves may use CRLF: use identical source bytes, voices and PCM for full MUB comparisons.

A 512 KiB machine may lack temporary loading/repeat-state memory while retaining a large session. Normal exit and relaunch can free it; this need not mean rebooting. Format checks and average timing are not proof of perfect real-time playback. See [release notes](RELEASE_NOTES.md) for CPU options, measured results and unresolved limits.
