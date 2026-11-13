# MucoMSXExtension — the MucoMSX chip extension command set

**English** · [한국어](readme.ko.md) · [日本語](readme.ja.md)

**MucoMSXExtension** is the command set MucoMSX adds to MUCOM88 MML for the MSX sound chips: the PSG (AY-3-8910), SCC/SCC+ and MSX-MUSIC (YM2413/OPLL) with its drums. Songs keep the MUCOM88 syntax and its OPNA parts; MSX parts are written on their own channel rows (`MSXD`, `SCCA`, `MSXA` …) with two-letter `?` commands for envelopes, pitch, gate, waves, OPLL instruments, shared phrases and effect programs.

A song that uses them compiles to the packed MucoMSX format **msPb0103–010A**. It plays on a real MSX with the MucoMSX toolchain and visual players, on the Mac with MDPlayer4Mac, and in the browser in MUCPlayground — the same source everywhere.

## Contents

- [Where it works](#where-it-works)
- [Try it in one minute](#try-it-in-one-minute)
- [Templates in MUCPlayground](#templates-in-mucplayground)
- [Using MUCPlayground with this guide](#using-mucplayground-with-this-guide)
- [Command reference](#command-reference)
  - [MSX channels](#msx-channels)
  - [How they are written](#how-they-are-written)
  - [MUCOM88 commands on MSX channels](#mucom88-commands-on-msx-channels)
  - [Global resources](#global-resources)
  - [Envelopes](#envelopes)
  - [Pitch](#pitch)
  - [Gate and note end](#gate-and-note-end)
  - [PSG noise and hardware envelope](#psg-noise-and-hardware-envelope)
  - [SCC waves](#scc-waves)
  - [MSX-MUSIC](#msx-music)
  - [Shared phrases](#shared-phrases)
  - [Effects and programs](#effects-and-programs)
- [Songs written with the extension](#songs-written-with-the-extension)
- [Videos](#videos)
- [Older forms and the full toolchain reference](#older-forms-and-the-full-toolchain-reference)

## Where it works

| | |
|---|---|
| MSX — MUC2MUB, MUCPLAY, MUCEDIT | compile and play the extension (MucoMSX is the reference implementation) |
| MSX — MUCScope, MUBScope | compile/play with channel visuals; MUBScope plays the compiled msPb MUB |
| MDPlayer4Mac v0.2.4 and later | compiles and plays the same MUC on macOS |
| MUCPlayground | write it in the browser and hear it at once; its MML guide includes this command set |

## Try it in one minute

Open the song below in MUCPlayground, press play, then change a number and play again. Two SCC parts, a PSG part and an MSX-MUSIC part, each a compact row (`?XU1`) that loops at `L` and ends with `!`.

```
#title First steps
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCS ?FD1={ ?EP0,$01,$61 v12 ?FR }
SCCA ?XU1 ?XT1 @0 ?FC1 o5 L [c%2 e%2 g%2 >c%2< g%2 e%2]2 !
SCCB ?XU1 ?XT1 @0 ?FC1 v9 o3 L [c%6 g%6]2 !
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v10 o4 L [r%3 c%1 r%2]4 !
MSXA ?XU1 ?XT1 ?IR3 v11 o4 L [e%12]2 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbZFBa4NAEIX_ynQbb7NlRxMTpaltTQOBBIomNJDklNoSKFpUvEj-e9-qhxx6mJ2dN99jH2yrGhUKq1yFarlK0u3DZhcrVjXm-_pS_2S0vJRVTVWd_VbHPPpYmHlr2J3wOOCpcGBYjM8iUxaI4g7dztCxBgQUmmGNU2PQ0DRW2iLastqatHUPt06zW4tZ3NrcyfWYp3GcUrRcyLyl6O3d8MgIj3yhRlzoCfXMC0X7neDYCj0bLGKhYkJrOpwdlzLUN-oJw2N3g3Jy6a7zvv7jbQIqvN7uw-D38CbdL27gPs8MebwZ8hgqxtZSOh6dHaESb4wH222-aJV4wGXAM0eGLPiJLxUeTqw-bbv-AQ)

## Templates in MUCPlayground

**New** in MUCPlayground offers commented templates written with these commands. The links open them directly:

- [**MSX chips**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extAll) — SCC, MSX-MUSIC and PSG together: shared phrases, envelopes, vibrato, effect hi-hats and ?ID drums.
- [**OPNA + MSX chips**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extOpna) — OPNA FM and rhythm beside SCC, MSX-MUSIC and PSG parts, kept in step with C112 and t198.
- [**SCC**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extScc) — The five SCC/SCC+ parts: ?WD waves, ?EP envelopes, vibrato, a detuned chorus, ?FD phrases and ?FB repeats.
- [**MSX PSG**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extPsg) — Lead, bass and a drum part made of ?XD effects on the three PSG channels.
- [**MSX-MUSIC**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extOpll) — YM2413 parts with built-in and custom (?IU) instruments, ?QP gate, sustain, and ?ID drums with a kit.

The same templates are in [`Samples/Muc/Templates/7_MSX_Extension`](../Samples/Muc/Templates/7_MSX_Extension).

## Using MUCPlayground with this guide

- Every example below has an **Open in MUCPlayground** link: the example opens in the editor, ready to play or edit.
- In MUCPlayground, the **Manual** button opens the same reference beside your text (book *MucoMSX chip extensions*); **Insert** puts an example at the cursor, and the editor suggests and checks these commands as you type.
- The channel view and the oscilloscope show each MSX chip channel while it plays; **Share** turns your song into a link like the ones on this page.

## Command reference

The reference follows the MUCPlayground MML guide. Every example here was compiled with the current MucoMSX compiler (MUC2MUB, 2026-11-13 build) as it stands.

### MSX channels

MUCOM88 and the mucomDotNET extensions have no such channels: a line that starts with one of these names is MSX music, and everything on it (the ? commands and the compatible MUCOM88 commands below) is read for that chip.

#### `MSXD` — MSX PSG

**Form:** `MSXD MSXE MSXF` · **Works on:** `PSG`

The three channels of the MSX's own PSG (AY-3-8910): tone, noise (P, w) and the hardware envelope (?GS). Give @n or E, and v, before the first note.

```
MSXD @0 v12 o5 l8 cdefgab>c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRVyLBSSU1LT0hOT7JKBKtKUrKJjdZRSQFQtAA)

#### `SCCA` — SCC / SCC+

**Form:** `SCCA SCCB SCCC SCCD SCCE` · **Works on:** `SCC`

The five wave channels of the SCC/SCC+ cartridge. @n picks a 32-sample wave (?WDn={…}, the older @Wn:{…} or #sccvoice); v0–15 is linear. On a plain SCC channels 4 and 5 share one wave.

```
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
SCCA @0 E255,0,8,2,160,32 v12 o5 l8 cdefgab>c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY69DsIwDIRfxfJsoziQ_mRARRFiAoYKMQADtJQFlQV1qfru2KiL7bv7LsqIA0Yh7DFifTzsFvtTQsKvSoDq7OIIjnygVUm5UOlIXEYiOYma4udtWn2NFVJUPUesk1WweqwRG8LGspXY2vP19yw1zHCr-QDTta9T2kDlYOuDPVqQJ8kcLT0M4uET4F1A0z671_2xbvTnHcbLjbC1Nf0A)

#### `MSXA` — MSX-MUSIC melody

**Form:** `MSXA MSXB MSXC MSXH MSXI MSXJ` · **Works on:** `OPLL`

The six melody channels of the YM2413 (OPLL). @n takes the song's FM voice n and plays the nearest of the 15 built-in instruments; ?IR and ?IU pick an instrument directly. Stereo pan becomes mono.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA @1 v12 o4 l8 cdefgab>c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjkD7FMoMjRTyTRRyLBSSU1LT0hOT7JKBzklTsoqO1VFKAVG1AA)

#### `MSXG` — MSX-MUSIC drums

**Form:** `MSXG` · **Works on:** `MSXG`

The YM2413 rhythm, written like the G part: @mask chooses the drums, notes play them, v sets the levels. There is no rim shot.

```
MSXG v63,31,31,31,31,31,0 l8 [@9c @8c @10c @8c]2
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcrMjHWMDVGQgUKOhUK0g2WygoMFEBsagBmxRkBtaUpW0bE6SikgqhYA)

### How they are written

They work on MSXD–F (PSG), SCCA–SCCE (SCC+), MSXA–C, MSXH–J (MSX-MUSIC melody) and MSXG (its drums), beside ordinary OPNA A–K. A row with any of them is compiled as a packed score. Old one-letter ? and @ forms still work; numeric @n keeps its voice meaning.

#### `?XU` — Compact channel

**Form:** `?XUn … !` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Makes the row a compact stream with length unit n; several commands need it. Note lengths are written %1–%16 units and the row ends with !. As on ordinary rows, | marks bars, [ ]n repeats (two levels; it may go on over the next lines) and L sets where the ! at the end goes back to (/ is not available: write [A B]n-1 A). ?FB, ?FJ and shared phrases work too. A compact SCC row needs SCC waves (?WD) above it; a song with only PSG rows gets a silent one by itself. (| [ ] L on these rows, ?IR / ?IU on compact MSX-MUSIC rows, rests on ?XT4 / ?XT64 tracks and PSG songs without ?WD need MDPlayer4Mac v0.2.6 or later; v0.2.5 and older refuse them or play them differently.)

```
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v12 o4 c%4 L [e%2 g%2]2 | c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOwjQg2BRAiQcA0w0FGxMNRRMbZQKDM0Usg3UUhWNVHwUYhOVTVSSFc1ijVSqAEKWSgoAk1IU7KKjtVRSgFRtQA)

#### `PSGS` — Shared definition rows

**Form:** `PSGS / SCCS / OPLS  ?FDn={…} ?XDn={…}`

Rows that only hold shared phrases and effects for PSG, SCC or OPLL channels. They play nothing themselves; a definition may continue over several rows.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCS ?FD1={?EN2 ?FR}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JQDIT_Sm3i1prXFxAlIU8D6CQa0WCiThpHXAwL4b_bKsu1vftuaI8dpkLYYor1vtrOduccCT96hqZwWe_IxxQtKRFaOhI3J5GERE3x47RbfY0VUlQ9R6zKerB6rBEbwsayldja4_bzLDXMcKv5eLi1dZ7XEDaFZH0oK6_r8e-uIVzOonJSaQ4OVg5CeWDoxMM7gsd0ARP944Xp9U74tDF8AQ)

#### `$` — Hexadecimal numbers

**Form:** `$hex`

Operands and resource values can be written in hex with $ (up to $FFFF).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?MV0,$11 ?EP2,129,115 v12 o4 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLU67CsJQDP2Va9AtkZtLH_SCdLDiVBVqtaBOimNdpEvpv3siXU5yXiQjDRSVqadIzfGwX9ftlpi-oOW18pvRc0g5KThXLjyrz1g1Z4WoYZ7GocNGCFFongUoIAJNYIlFxLJiJbH2vP01cy1mcauFdLr3ddNVruxaBZwB9cXzUrHsTgG3C9xO3aDBfRL3XGnmFvj9TfH2YHrZmH4)

#### `@n:{ }` — Braced FM voice

**Form:** `  @n:{ 38 values }  /  @%n:{ 25 bytes }` · **Works on:** `FM`

In a song with these extensions, an FM voice can be written on one line in braces: FB,ALG and the four operator lines (38 values), or the 25-byte register form.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
  @1:{ 5,4, 31,8,2,6,3,30,0,1,3, 31,6,1,6,2,0,0,1,3, 31,10,2,6,3,36,0,2,7, 31,6,1,6,2,0,0,1,7 }
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%16 !
A @1 v12 o4 c4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbZDLigJBDEV_JQbc3ZJK9ctuEBUdXPkAFQWd1YjLdiNuGv99bgZHZjGLyuPmhCTV6UMbg7ba6Ha9WgyW-5lC70zHh3kcdRGpQF6jMtQRFkuYVTCKll7ec-osEyJKLSLQBiaBWmApOBKcDd4UvPsV_Whedcxxb0vF89yKTKzphAtAMsMQCSUyZJEDjIGLXIgv4a9m8Zcs4WH1D1kJByy3x7mMj3uj2dF8bBJvqnlTIQ9Lcsvlq2-l9M7tlLu8tZx_dNXm9Am9uHt-Aw)

### MUCOM88 commands on MSX channels

The ordinary MUCOM88 commands that MSX channels accept, as they behave there. They work in older MSX songs and on the ordinary (non-?XU) rows of a song with the chip extensions; a ?XU compact row takes only notes, o, < >, l, v, t, C192, @n, !, | , [ ] and L.

#### `c–b` — Notes

**Form:** `c d e f g a b [+ # -][length][.]` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

As in MUCOM88: a length n is C/n clocks, %n is n clocks, dots add half. On MSXG a note sounds the drums chosen with @. On a ?XU row the length is %1–%16 units, or a length that divides 192 into at most 16 units.

```
MSXD @0 v12 o4 l8 c d e f+ g4. a16 b-16 >c2
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFVIUUhXStBXSTfQUEg3NFJJ0gYRdshFQR5qSVXSsjlIKiKoFAA)

#### `r` — Rest

**Form:** `r[length]` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Silence for the length; it cannot be tied to a note.

```
MSXD @0 v12 o4 l8 c r e r g4 r4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFYoUUoE43UShyASoKk3JKjpWRykFRNUCAA)

#### `l` — Default length

**Form:** `l4  l8  l%12` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

The length of notes written without one.

```
MSXD @0 v12 o4 l16 cdef l4 g
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyDM0UklNS0xRyTBTSgUrSlKyiY3WUUkBULQA)

#### `o` — Octave

**Form:** `o1–o8  > <` · **Works on:** `PSG`, `SCC`, `OPLL`

o sets the octave, > and < move it by one. PSG, SCC and OPLL take 1–8 (a ?XU PSG or SCC row 1–6).

```
MSXD @0 v12 o4 l8 c e g >c< g e c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFVIV0hXskm2AZKpCMlBdmpJVdKyOUgqIqgUA)

#### `C` — Base clock

**Form:** `C128` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Clocks per whole note (128 if not given). A ?XU row only accepts C192.

```
MSXD @0 v12 o4 C96 l4 cdef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRScLc0UckwUklNS04AK0pSsomN1lFJAVC0A)

#### `T` — Tempo

**Form:** `T120  t200` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

T in BPM, t as the raw timer value; it sets the tempo of the whole song. A ?XU row takes t only.

```
MSXD T150 @0 v12 o4 l8 cdefg
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFEIMTQ0UHAwUygyNFPJNFHIsFJJTUtPSgUrSlKyiY3WUUkBULQA)

#### `v` — Volume

**Form:** `v0–15` · **Works on:** `PSG`, `SCC`, `OPLL`

0–15 on every melody chip (SCC linear, OPLL like an FM part). ?EL, ?EN and the envelopes shape it further.

```
MSXD @0 v8 o4 l8 cd v12 ef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMosFPJNFHIsFJJTFMoMjRRS04AK0pSsomN1lFJAVC0A)

#### `v` — Drum volumes

**Form:** `vtotal,BD,SD,TOP,HH,TOM,RIM` · **Works on:** `MSXG`

Like the G part: the total (0–63), then a level 0–31 for each drum; the RIM value is ignored.

```
MSXG v40,31,20,31,20,31,0 l8 [@1c @8c @2c @8c]2
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcpMDHSMDXWMkEgDhRwLhWgHw2QFBwsgNgLTsUZAXWlKVtGxOkopIKoWAA)

#### `) (` — Volume up / down

**Form:** `)n  (n` · **Works on:** `PSG`, `SCC`, `OPLL`

Raise or lower v by n (1 if not given). Not on MSXG.

```
MSXD @0 v10 o4 l8 c )2 d )2 e (4 f
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMDRTyTRRyLBSSFTSNFFJARKqCholCGlBhmpJVdKyOUgqIqgUA)

#### `@` — PSG preset

**Form:** `@0–@15` · **Works on:** `PSG`

One of the 16 SSG presets of MUCOM88: an envelope, the tone/noise mix and sometimes vibrato.

```
MSXD @3 v12 o4 l8 cdef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFByMFcoMjRTyTRRyLBSSU1LTgJJpSlbRsTpKKSCqFgA)

#### `@` — SCC wave

**Form:** `@n` · **Works on:** `SCC`

Selects wave n (?WDn, @Wn or a #sccvoice bank). Give the level shape with E or ?EP.

```
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
  @W1:{ 96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96 }
SCCA E255,0,0,0,0,255 v12 o5 l8 @0 cd @1 ef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zpVA7DsIwDL2K5dlGcUQozVRUISZgQIgBmCidUFlQl6p35xl6AYTysd_HiZOBe84m3HHmw363mW2PNQu_AImqU8gDBYlJ5qUUJmUQCwsxK8RAWpyiY_CQYYIVXBDFrgAKTiGpW9S96kXq1VP24Vx1m9u9LCYaL513YeiixPG_TP1v-dWHul7ROiZ_zHcgp94iPRM9llQFujVUGd1bfFnL-XwVbjyMbw)

#### `@` — FM voice as OPLL instrument

**Form:** `@n` · **Works on:** `OPLL`

Takes the song's FM voice n (inline or #voice) and plays the closest YM2413 built-in instrument. On a ?XU row @0–@15 is the instrument number itself.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA @1 v12 o4 l8 cdef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjkD7FMoMjRTyTRRyLBSSU1LTgC5JU7KKjtVRSgFRtQA)

#### `@` — Drums to play

**Form:** `@mask` · **Works on:** `MSXG`

As on the G part, the sum of 1 BD, 2 SD, 4 TOP, 8 HH, 16 TOM; following notes sound them.

```
MSXG v63,31,31,31,31,31,0 l8 @1c @2c @9c @16c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcrMjHWMDVGQgUKOhYKDYbKCgxEQWwKxoVkyUE-aklV0rI5SCoiqBQA)

#### `q` — Gate

**Form:** `q0–255` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Releases each note n clocks before its end, as in MUCOM88 (?QR returns to it, ?QP is the OPLL form).

```
MSXD @0 v12 o4 l4 q4 cd q0 ef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyTBQKTRSSUxQKDRRS04Bq0pSsomN1lFJAVC0A)

#### `E` — Software envelope

**Form:** `Eal,ar,dr,sr,sl,rr` · **Works on:** `PSG`, `SCC`, `OPLL`

The SSG envelope of MUCOM88 (six values 0–255). On OPLL only in a song with the chip extensions; older MSX songs allow it on PSG and SCC.

```
MSXD E255,0,30,4,120,60 v12 o4 l4 cdef
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFFyNTE11DHSMDXRMdAyNDHTMDBTKDI0U8k0UckwUklNS04CK05SsomN1lFJAVC0A)

#### `M` — LFO (vibrato)

**Form:** `Mdelay,rate,depth,count  MF0/1  MW MC ML MD` · **Works on:** `PSG`, `SCC`, `OPLL`

MUCOM88's software LFO and its subcommands; the depth moves the pitch the same way on every chip.

```
MSXD @0 v12 o4 l2 M12,1,2,4 c d
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyjBR8DY10DHWMdEwUkhVSgKrSlKyiY3WUUkBULQA)

#### `D` — Detune

**Form:** `Dn  Dn+` · **Works on:** `PSG`, `SCC`, `OPLL`

Shifts the pitch by n, in the same direction on every chip; in a song with the chip extensions Dn+ adds to the current detune.

```
MSXD @0 v12 o4 l4 c D8 c D0 c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyTBSSFVwsQISBQjJQTZqSVXSsjlIKiKoFAA)

#### `P` — Tone / noise

**Form:** `P0–3` · **Works on:** `PSG`

P1 tone, P2 noise, P3 both, P0 neither. PSG channels only (not SCC).

```
MSXD @0 v12 o4 l8 P2 w8 c c P1 c c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBQCjBTKLRSSgTDAEEQBFaYpWUXH6iilgKhaAA)

#### `w` — Noise period

**Form:** `w0–31` · **Works on:** `PSG`

The noise period, shared by the three PSG channels (?NP adds a priority).

```
MSXD @0 v12 o4 l8 P2 w8 c c P1 c c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBQCjBTKLRSSgTDAEEQBFaYpWUXH6iilgKhaAA)

#### `&` — Tie

**Form:** `c4&c4` · **Works on:** `PSG`, `SCC`, `OPLL`

Joins a note to the next one without a new attack.

```
MSXD @0 v12 o4 l8 c&c d4&d8 e
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSS1ZIVUkzUUiwUUoFq0pSsomN1lFJAVC0A)

#### `^` — Add length

**Form:** `c4^8` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Adds a length to the note or rest before.

```
MSXD @0 v12 o4 c4^8 d8
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRSSTeIsFFIsgJJpSlbRsTpKKSCqFgA)

#### `[ ]` — Repeat

**Form:** `[ … ]n` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Plays the bracket n times (1–255); at most two levels deep on MSX channels. On ?XU rows too, where it may go on over the next lines.

```
MSXD @0 v12 o4 l8 [cd [ef]2 g]2
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSik1MUolPTYo0U0mONgKrSlKyiY3WUUkBULQA)

#### `/` — Leave on the last pass

**Form:** `[ … / … ]n` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

On the last pass the repeat ends at /. Not on ?XU rows: write [A B]n-1 A there.

```
MSXD @0 v12 o4 l8 [cde / fg]3 c4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSik1NSFfQV0tJjjRWSTYDK0pSsomN1lFJAVC0A)

#### `L` — Loop point

**Form:** `L` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Where the channel goes back to at its end; once per channel. On a ?XU row the ! at the end jumps back to it.

```
MSXD @0 v12 o4 l8 cd L efg
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSUxR8FFLT0oEK0pSsomN1lFJAVC0A)

#### `!` — End

**Form:** `!` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Ends the channel here (after L, it loops). A ?XU row must end with it.

```
MSXD @0 v12 o4 l8 cdef !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSU1LTFBSB0mlKVtGxOkopIKoWAA)

#### `*` — Macros

**Form:** `#*n{…}  *n` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Macros work as in MUCOM88 (at most eight deep); the ** shift and ?XU inside a macro are not allowed.

```
#*1{cdef}
MSXD @0 v12 o4 l8 *1 *1
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXKVtQyrk1NS02pj8nyDI1wUHAwUygyNFPJNFHIsFLQMgQioME3JKjpWRykFRNUCAA)

#### `|` — Bar line

**Form:** `|` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Only for reading; ignored.

```
MSXD @0 v12 o4 l8 cdef | gab>c
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSU1LTFGoU0hOT7JKBitKUrKJjdZRSQFQtAA)

#### `p K s y` — Not on MSX channels

**Form:** `p  K  s  V  H  R  y  J  { }  x  S` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

OPNA-only commands (pan, transpose, key correction, FM tricks, register writes, portamento): in a song with the chip extensions they are errors on MSX channels. Older MSX songs ignore some (p) and still apply others (K), so better not rely on them. Use the ? commands instead (?DW, ?DS, ?MV, ?QP …).

### Global resources

Written at the start of a line, before the music rows.

#### `?WD` — SCC wave

**Form:** `?WDn={32 values -128…127}` · **Works on:** `SCC`

Defines SCC wave n; @n on an SCC row selects it.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o4 c%16 e%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7LCsJQDER_JQbcJZJc-qAFqVLFlVqopQV15WNZN9JN6b-bSDeTOzNn4I44YK6EPeZYn0-H1bEpkfBrtmh3sh6FQkxRRqlSJqSSkGpKaqGG-bq33GqDDLVMiE3ZDFvGVrEj7Cz7iH09v_6Zt4457rMQT7e-LsstFF2jJheTthLYCBT7imHQAJ8IHktN4OWysH-_Mb_eCZ9-ph8)

#### `?WS` — Wave from a bank

**Form:** `?WSlocal,bank,1` · **Works on:** `SCC`

Makes local wave number local an alias of wave bank of the #sccvoice file.

#### `?IU=` — OPLL custom voice

**Form:** `?IUn={8 bytes}` · **Works on:** `OPLL`

Defines MSX-MUSIC custom instrument n (the eight YM2413 voice bytes); ?IUn on a melody row uses it.

```
?IU0={33,97,29,7,130,143,16,7}
MSXA ?IU0 ?EP2,129,115 v12 o4 g%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMNbKuNjXUszXWMLHXMdQyNDXQMTYx1DM10zGtj8nyDIxwVQIoU7F0DjHQMgWoMDU0VygyNFPJNFNJVgXSRqgnQsDQlq-hYHaUUEFULAA)

#### `?IT=` — Drum kit

**Form:** `?ITn={6 bytes}` · **Works on:** `MSXG`

Defines drum kit n for MSXG (six bytes of rhythm settings); ?ITn selects it.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?KT=` — Pitch table

**Form:** `?KTn={12–128 values}` · **Works on:** `PSG`, `SCC`, `OPLL`

A table of periods (or F-numbers for OPLL) that ?KTn on a row uses instead of the ordinary scale.

```
?KT0={344,364,386,409,433,459,486,516,546,578,612,648}
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?XT0 ?XT1 ?KT0 @1 o4 c%8 e%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY8_C8JADMW_yhlwe8ilSa9nQVQcHKQ6tIWCOvln1EVcSr-7OaGLOPzeS14yJD29qWTQg0qqD_vtrGo3BHpZu9w1ftGLKiQYMUD9HCoCzc2tz9lQo4gInCFoHE4P51ac1OXQrwsjwqYQiIcHQ8Y8IJHhJ2Y_7geksvi_b3FVd2u37Fo2aXwSq-xwu8E91V2m0d2Mif10p_J4Bl2TDR8)

#### `?IM=` — Instrument program map

**Form:** `?IMn={12–128 phrase ids}` · **Works on:** `PSG`, `SCC`

Maps notes to shared phrases used as instrument programs; ?IMn on a row selects the map, ?IM- turns it off.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

### Envelopes

#### `?EP` — Envelope profile

**Form:** `?EPprofile,a,b  /  ?EP-` · **Works on:** `PSG`, `SCC`, `OPLL`

Shapes the level of each note with one of the drivers' envelope profiles (0–8) and its two values; profile 3 takes one more value, 8 two more (PSG/SCC). OPLL takes profiles 2 and 3. ?EP- turns it off.

```
MSXD ?EP2,129,115 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXKDI0U8k0UklWBdJGqCVBdmpJVdKyOUgqIqgUA)

#### `?EA` — Attack

**Form:** `?EAmode,value` · **Works on:** `PSG`, `SCC`, `OPLL`

The attack of the envelope; mode 0 or 1 picks the drivers' two attack styles.

```
MSXD ?EP2,129,115 ?EA0,4 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcRwMdE4UyQyOFfBOFZFUgXaRqAlSepmQVHaujlAKiagE)

#### `?ET` — Initial target

**Form:** `?ETlevel` · **Works on:** `PSG`, `SCC`, `OPLL`

The level (0–15) the envelope starts towards.

```
MSXD ?EP2,129,115 ?ET12 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYGcEEMjhTIgzjdRSFYF0kWqJkDVaUpW0bE6SikgqhYA)

#### `?EN` — Onset attenuation

**Form:** `?ENvalue` · **Works on:** `PSG`, `SCC`

How much quieter each note starts.

```
MSXD ?EP2,129,115 ?EN3 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcP2OFMkMjhXwThWRVIF2kagJUnKZkFR2ro5QComoB)

#### `?EL` — Floor

**Form:** `?ELlevel` · **Works on:** `PSG`, `SCC`

The lowest level (1–15) the envelope falls to; ?EL0 removes the floor.

```
MSXD ?EP2,129,115 ?EL4 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcHxOFMkMjhXwThWRVIF2kagJUnKZkFR2ro5QComoB)

### Pitch

#### `?DB` — Detune

**Form:** `?DBvalue` · **Works on:** `PSG`, `SCC`, `OPLL`

The drivers' classic detune (-128–255).

```
MSXD ?EP2,129,115 ?DB2 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXZyMFMoMjRTyTRSSVYF0kaoJUHGaklV0rI5SCoiqBQA)

#### `?DW` — Signed detune

**Form:** `?DWvalue` · **Works on:** `PSG`, `SCC`, `OPLL`

A signed 16-bit detune (-32768–32767).

```
MSXD ?EP2,129,115 ?DW-2 v12 o4 c%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXcJ1jRTKDI0U8k0UklWBdJGqCVB1mpJVdKyOUgqIqgUA)

#### `?DR` — Detune off

**Form:** `?DR` · **Works on:** `PSG`, `SCC`, `OPLL`

Removes the detune.

```
MSXD ?EP2,129,115 ?DB2 v12 o4 c%8 ?DR c%8
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXZyMFMoMjRTyTRSSVS2A_CAQDVSfpmQVHaujlAKiagE)

#### `?DS` — Pitch sweep

**Form:** `?DSstep,count[,mode]` · **Works on:** `PSG`, `SCC`

Slides the pitch by step every count; without mode the classic sweep, mode 1 a byte sweep (step 1–15, count 0–7), mode 2 a word sweep.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCE ?WP0 @0 ?EP2,129,115 ?DS3,5,2 v12 o4 e%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQn0lshm7VpakBXa4kktFPGg3tRjBZFeSv_difSyszPzQjLRSJUyDVRRfzruV4dzTUxf2HRp_HbyHCLnJRfKpWf1G1YtWBFqWNQ8ctSAgCLzLHgFRpAJKjFEjBUbEptefv_MWsMMt7EQ59vQ13Xr0qXzbuddaruAhSUWRpeafs2Rgxs1uHfunhn0k-W4_UXV9c70MJl_)

#### `?MV` — Vibrato

**Form:** `?MVmode,value  /  ?MV-` · **Works on:** `PSG`, `SCC`, `OPLL`

Vibrato with the drivers' packed value (often written in hex, $64); mode 1 is phase vibrato (PSG/SCC), mode 2 a pitch program. ?MV- turns it off.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- ?MV0,$64 ?MW3 v12 o4 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJQDIVfJQbdErm59ocW5CpVnKqFWiuok-JYF-lS-u4m0uUkOec7QwbsMRfCDnOsT8fDsmwKJPzqGdqdWw-OfExRRqlQ5khcQiIpiZrip2m3-horpKh6jliV9WD1WCM2hI1lK7G1p-3vWWqY4Vbz8Xjv6qLYQrg2onJWaSsHGwdhXzGE8uJonkS6tCvoxcMngudCEpjpA2_Mbw_Cl43xBw)

#### `?MW` — Vibrato delay

**Form:** `?MWdelay` · **Works on:** `PSG`, `SCC`, `OPLL`

How long a note waits before its vibrato starts.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- ?MV0,$64 ?MW3 v12 o4 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJQDIVfJQbdErm59ocW5CpVnKqFWiuok-JYF-lS-u4m0uUkOec7QwbsMRfCDnOsT8fDsmwKJPzqGdqdWw-OfExRRqlQ5khcQiIpiZrip2m3-horpKh6jliV9WD1WCM2hI1lK7G1p-3vWWqY4Vbz8Xjv6qLYQrg2onJWaSsHGwdhXzGE8uJonkS6tCvoxcMngudCEpjpA2_Mbw_Cl43xBw)

#### `?KT` — Use a pitch table

**Form:** `?KTn[,start]  /  ?KT-` · **Works on:** `PSG`, `SCC`, `OPLL`

Plays notes from pitch table n (defined with ?KTn={…}); on compact OPLL a 12-entry window from start. ?KT- returns to the ordinary scale.

```
?KT0={344,364,386,409,433,459,486,516,546,578,612,648}
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?XT0 ?XT1 ?KT0 @1 o4 c%8 e%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY8_C8JADMW_yhlwe8ilSa9nQVQcHKQ6tIWCOvln1EVcSr-7OaGLOPzeS14yJD29qWTQg0qqD_vtrGo3BHpZu9w1ftGLKiQYMUD9HCoCzc2tz9lQo4gInCFoHE4P51ac1OXQrwsjwqYQiIcHQ8Y8IJHhJ2Y_7geksvi_b3FVd2u37Fo2aXwSq-xwu8E91V2m0d2Mif10p_J4Bl2TDR8)

### Gate and note end

#### `?QR` — Normal gate

**Form:** `?QR` · **Works on:** `PSG`, `SCC`, `OPLL`

Back to the ordinary gate.

```
MSXD ?EP2,129,115 v12 o4 ?QR c%8 d%8
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXKDI0U8k0U7AODFJJVLRRSVC2AStOUrKJjdZRSQFQtAA)

#### `?QP` — OPLL gate

**Form:** `?QPvalue[,mode]` · **Works on:** `OPLL`

The gate of MSX-MUSIC notes; with mode 1 (compact rows) each note starts a fresh gate count, mode 0 keeps the running one.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?QP255,1 @1 o4 c%3 ?QP64 d%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY47C8JAEIT_yriQbpDbeynXRLGwig9CIKBWBsvYiI34370T0ojFMLMfAzsveUpSyihJ2v1uO2-6jVAe-QRWeh4BBPqvO-WSlpGOztBQ6SYeWWT5g9VM_cgSF__7GTdtv0bdd4r6eLAhUPN33D2ulSsoegyVRszyuJuk04UyFHt_AA)

#### `?QE` — How OPLL notes end

**Form:** `?QE0 / ?QE1 / ?QE2` · **Works on:** `OPLL`, `MSXG`

0 an ordinary key-off (default), 1 ends at frequency zero keeping the instrument (melody only), 2 holds the last state.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?QE1 @1 o4 c%2 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjgr2EaGGCvaBroZAmxXyTRSSVY0UFIGuSVOyio7VUUoBUbUA)

### PSG noise and hardware envelope

#### `?NP` — Shared noise

**Form:** `?NPvalue[,priority]  /  ?NP-,3` · **Works on:** `PSG`

Sets the noise period (0–31) of the three PSG channels' shared noise, with a priority 0–3 deciding which channel owns it; ?NP-,3 lets the last writer win.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?NP5 ?EP2,129,115 v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY5BC4JAEIX_yjbQbSZ2FjdTCA8ZnTTBJKE6FR3tEl7E_96b8DKz773vMTvRSLkyDZRTe65Pm6o7ENMXsriWfj95DpGTjFPlzLP6LaumrDA1LNs0fMSAgMLzLJgCIfAEkRgixoqVxNrL6-9ZapjhVgtxvg9V25eu6DvFuGDUTXTFsQm4m-FudKMG90ncc71zK3z7TfntwfSyNf8A)

#### `?GS` — Hardware envelope shape

**Form:** `?GSshape[,1]  /  ?GS-` · **Works on:** `PSG`

Uses the PSG's envelope with shape 0–15, restarted with each note; ,1 defers the write (compact rows). ?GS- turns it off.

```
MSXD ?EP2,129,115 ?GS8 ?GH0 ?GL40 v12 o3 c%32
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXs3YMtgISHAZDwMTFQKDM0Usg3VkhWNTYC6klTsoqO1VFKAVG1AA)

#### `?GH` — Envelope period

**Form:** `?GHbyte  ?GLbyte` · **Works on:** `PSG`

The high and low bytes of the hardware envelope period, set separately (?GL is the low byte).

```
MSXD ?EP2,129,115 ?GS8 ?GH0 ?GL40 v12 o3 c%32
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXs3YMtgISHAZDwMTFQKDM0Usg3VkhWNTYC6klTsoqO1VFKAVG1AA)

### SCC waves

#### `?WP` — Wave sharing policy

**Form:** `?WP0 / ?WP1 / ?WP2` · **Works on:** `SCC`

How the SCC channels share wave memory (on a plain SCC, channels 4 and 5 share one).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 v12 @0 c%8 @1 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCoJAEH6VbaDbTOwsmSmIhkGnfsBEoToVHT2FF_Hd-0Z8gYLd_eb7Y5cdqKdUmTpKqTqfDqtjXRLTBzRv9j4bPIeI1wnHyoln9RtWjVkhapjROHTYCCEKzbPgFBCBJrDEImJZsZJYe54mzVyLWdxqIRrvHZ6g2SCJef_vHxfurcpy5_K2Vpc3F4_pqq7X4ArvnsutK3SCBT7qTentwfQyGL8)

#### `?WM` — Wave morph

**Form:** `?WMwave,rate,1  /  ?WM-` · **Works on:** `SCC`

Konami's wave morph: while a note plays, its 32 samples are read from wave (0–63) on with a step that grows to 31 bytes, faster with a higher rate (0–63), so the sound walks through the waves defined after it. Define about 31 waves from there for the full effect; past the last wave the reading wraps to the first. ?WM- stops it.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WM1,8,1 v12 @0 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCoJAEH6VbaDbTOwsqSmIhUEnKzBRqE5FR0_hRXz3vglfoGB35_tllx1poEyZesqoPh0Pq6opiekNWrR7n4-eQ8TrlBPl1LP6mFUTVoga5mkcOmyEEIXmWXAKiEATWGIRsaxYSaw9o69mrsUsbrUQTbceT9B8lNS8__ePC_fWZblzRdeoK9qzB7oYqpQ3rG7Q4LbePZYauwX-6kXZ9c70tDF9AA)

#### `?WI` — Wave interpolation

**Form:** `?WIa,b,c,d,e  /  ?WI-` · **Works on:** `SCC`

Steps between two waves by interpolation (five values, compact rows).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WI0,1,4,8,1 v12 @0 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVBLCsIwEL1KHHA3I5nQjy2UKhXEhR-opYK6Ulx2Jd2U3t030gsoJJn3GybJQD3lytRRTvXxsF3sm4qY3qBlu_HF4DnEHGWcKmee1SesmrJC1DBV49BhI4QoNM-CU0AEmsASi4hlxZrEuif01cy1mMWtLcTjrcMVtBgkM-___ePC3Lqq1q68NOrK9uSBzoZ2eD9HvGR1vQa38u4x18TN8F8vyq93pqeV8QM)

#### `?WF` — Wave program flags

**Form:** `?WFmask,value` · **Works on:** `PSG`, `SCC`

Sets flags (0–7) of the wave programs.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?WP0 ?XT1 ?WF1,1 v12 @0 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY5LC4JQEIX_ym2g3UzMXFJRCAujVj3ARKFaFS1dhRvxv3cm3Nw5j-_AHWmgwph6Kqi-nI-rU1MR0xe2bPe6GZVjwuucM-Nc2TRls4wNocX5ukeOGhBQZMqCV2AEmaASR8RZ8ZH4elb_zFvHHPdZTKZHX1fVLpRdY6Fsrwp1c3UwtjBYDFsNr6WlYYEff6i4P5nefqYf)

#### `?WE` — Waves by envelope phase

**Form:** `?WEa,b,c,d  /  ?WE-` · **Works on:** `SCC`

Changes the wave with the phase of the envelope (four wave numbers).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WE0,1,0,1 v12 @0 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCsIwDH6VGvCWSFPcxgajyhRP_sAcE9ST4nEn2WXs3f0iewGFtvn-QpsO1FOhTB0VVB8Pu8W-qYjpDRrbjS8HzyHhZc6Zcu5ZfcqqGStEDVM1Dh02QohC8yw4BUSgCSyxiFhWrEmse0JfzVyLWdzaQjLeOjxBy0Fy8_7fPy7cW1fV2sVLoy62Jw90NrTF_JhMXa_Brbx7zDV1M_zWi4rrnelpZfwA)

#### `?WG` — Static wave upload gate

**Form:** `?WGsample  /  ?WG-` · **Works on:** `SCC`

Song-wide policy for static wave uploads, on a compact SCC row with ?WP0 (sample 0–31). ?WG- turns it off.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 v12 @0 c%4 !
SCCE ?XU1 ?WG15 ?XT1 v12 @0 e%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znZBNC8IwDIb_ShfYLZGmbM4OxpQpO_kBc0xQT34cd5Jdxv67yZgHjwptk7zv89LSHjpIGaGFFKr9rpxt6wIQXjLmzdpmvUUXY-QxYfQW2c6ROUEWkd1UdRZdbIEEFc0iyUkykGgkFilCypKGSNNTN2rqKqa4xlw8XFp5Amc9efX-3z8uubcqipXJTzWbvDlY6Y5sOnZmac0tjEwwEpsPUXL8hTzChQnkE5-Qnq8Idy3DGw)

### MSX-MUSIC

#### `?IR` — Built-in instrument

**Form:** `?IRn` · **Works on:** `OPLL`

Picks YM2413 built-in instrument n (1–15) directly, instead of the nearest one to an FM voice. On a ?XU row it is the same as @n.

```
MSXA ?IR3 v12 o4 c%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyMcFew9g4wVygyNFPJNFJJVTRQUgZJpSlbRsTpKKSCqFgA)

#### `?IU` — Custom instrument

**Form:** `?IUn` · **Works on:** `OPLL`

Uses custom instrument n, defined with ?IUn={…}. On a ?XU row too (?IU0 is @0 there).

```
?IU0={33,97,29,7,130,143,16,7}
MSXA ?IU0 ?EP2,129,115 v12 o4 g%12 r%4
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMNbKuNjXUszXWMLHXMdQyNDXQMTYx1DM10zGtj8nyDIxwVQIoU7F0DjHQMgWoMDU0VygyNFPJNFNJVgXSRqgnQsDQlq-hYHaUUEFULAA)

#### `?IS` — Sustain

**Form:** `?IS0 / ?IS1` · **Works on:** `OPLL`

Turns the YM2413 sustain on (1) or off (0).

```
MSXA ?IR3 ?IS1 v12 o4 c%8 d%8
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyMcFew9g4yBRLChQpmhkUK-iUKyqoVCiqoFUE2aklV0rI5SCoiqBQA)

#### `?ID` — Drum hit

**Form:** `?IDmask,length  /  ?ID-,length` · **Works on:** `MSXG`

Hits the drums in mask (16 bass drum, 8 snare, 4 tom, 2 top cymbal, 1 hi-hat, added) and waits length (1–16); ?ID- rests with the rhythm off. A hit also applies the kit (?IT), v and ?IB set before it.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?IT` — Use a drum kit

**Form:** `?ITn[,bias]` · **Works on:** `MSXG`

Selects drum kit n (?ITn={…}); bias (0–15) makes the hi-hat quieter.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?IB` — Bass drum setting

**Form:** `?IB` · **Works on:** `MSXG`

A drum control without operands, written before the hits.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0 v14 ?IB ?ID1,4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInUKZIYjhBMQuhjomCopAM9KUrKJjdZRSQFQtAA)

### Shared phrases

#### `?FD` — Define a phrase

**Form:** `?FDn={ … ?FR}` · **Works on:** `PSG`, `SCC`, `OPLL`

Defines shared phrase n (0–255), usually on a PSGS/SCCS/OPLS row; it returns with ?FR.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD10={?EP2,129,115 ?FR}
MSXD ?XU1 ?XT1 ?FC10 v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLU9NC4JAEP0r20C32dhZNFOIPWh6siSThOpUdLRLeBH_e2_Cy5t9X8zsRCNlwjRQRu3pWG3qLiemL2i4Fm4_OfYxRyknwqljcVsWSVggil-mcuiwEUIUmmMLtCAWmoVlNWI1a7Vktb28_pq6GtO41nw834emrVoTykJwSDg0HvtS7IuhnWHXbV-Y0HcCuADKXJwZxZtPZJ7rnVnhJ2_Kbg-ml475Bw)

#### `?FC` — Call a phrase

**Form:** `?FCn` · **Works on:** `PSG`, `SCC`, `OPLL`

Plays phrase n and comes back.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FC1 ?FC1 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JADIX_ytnErWeuFxAhIQygTCjxJJKok8YRF8NC-O--qstr-_q9pJ1opEyYBsooHPb1qulKYnpjLM6VyyfHPuYo5UQ4dSxuzSIJC0zx_6ozfKwBAYXn2EItBgvPYmUVscpaDVlN_7uvp1vFFNeYj-fr0IY6mGJXST7dlxt0R5hN6CtT9J1ATpBt63FHijtiM4o3rwhgKT9Z4JknZZcb00PL_AE)

#### `?FR` — Return

**Form:** `?FR` · **Works on:** `PSG`, `SCC`, `OPLL`

Ends a phrase and returns to where it was called.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FC1 ?FC1 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JADIX_ytnErWeuFxAhIQygTCjxJJKok8YRF8NC-O--qstr-_q9pJ1opEyYBsooHPb1qulKYnpjLM6VyyfHPuYo5UQ4dSxuzSIJC0zx_6ozfKwBAYXn2EItBgvPYmUVscpaDVlN_7uvp1vFFNeYj-fr0IY6mGJXST7dlxt0R5hN6CtT9J1ATpBt63FHijtiM4o3rwhgKT9Z4JknZZcb00PL_AE)

#### `?FJ` — Jump to a phrase

**Form:** `?FJn` · **Works on:** `PSG`, `SCC`, `OPLL`

Continues at label n (phrase n or :n) without coming back; jumping back to where the channel has already been makes it loop.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 e%8 !}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 g%8 ?FJ1
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY9PC4JAEMW_yjbQbTZ2Fs0UxEOmEFiCSUJ16t_NLuFF_O69CQ_7Zua938DsSAMlwtRTQs3xUK6qdktMX4zZOXfp6NiHHMQcCceOxa1ZJGKBKX6uOsNHDAgoPMcWajFYeBaRVcQqa3XJ6vbc_T1NFVNc13w4Xfu6KRuTFbmk4325MU-8Beyq6XKTda1ATpBd7XFJjEtCM4g3n8C8gWbFXvCXFyWXG9NDy_QD)

#### `?FB` — Repeat

**Form:** `?FB0 … ?FBcount  /  ?FBcount,label` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

?FB0 marks a place and ?FBcount goes back to it until the part between them has played count times in all; ?FBcount,n does the same back to label n (:n or phrase n).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 e%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FB0 ?FC1 ?FB2 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY9PC4JAEMW_yjbQbTZ2Fs0UREjTkyWZJFSn_hztEl7E796b6LBvZt77DcxONFIiTAMl1B721arucmL6YMzOhUsnxz7kIOZIOHYsbs0iEQtM8f-qM3zEgIDCc2yhFoOFZxFZRayyVpesbv-7n6epYorrmg_n69C0VWuyspB0ui835omXlUcEddsXJus7gZwgu8bjlhi3hGYUb94BwK2D5KKdNwv86kXJ5cb00DJ_AQ)

#### `:` — Label

**Form:** `:n` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Label n, a place for ?FJn and ?FBcount,n to go to; phrase numbers (?FDn) are labels too.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU4 ?XT1 ?EP2,129,115 v12 o4 c%16 :1 d%16 ?FB3,1 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY_NCsJADIRfJQa8JbJZ-0MXZEGrnqpCLRbUk8VjvUgvpe9uIr1kdma-EHbEAYMQ9hiwPp-Oq6rZIeFXbbyVbjM68iklBeVChSNxGYnkJBqKn9W85lorpKhmjlgnq2HNWCs2hI1lW2Lbnl__zFrDDLc1n06PvqrbEmLbJDquAnF_8Xqy0JMpDOLhk8BrKRkEgc40HrZrEljoD94Y7k_CzmT6AQ)

### Effects and programs

#### `?XD` — Define an effect

**Form:** `?XDn={ … }` · **Works on:** `PSG`, `SCC`, `OPLL`

Defines shared effect n (0–9).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?XD1={c%8 !}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY_BCoJAEIZfZRvoNhM7i2YK4iHDkyWYJFSnoqNdwov47v0jXmZ2vvl-mJ1opEyZBsqovZyrXd0diemHsbiVPp88h5ijlBPl1LP6PasmrIAa1m4zONaQoIJ5FlTBIGCClZgi5oqFxNLra2G2Nc10i4V4fgxNW7Wu6EvNp9f24DZAdduXQJ2iXFFOTcAVKa6I3ajBfSO3qPjEh7L7k-ltbf4D)

#### `?XM` — Effect mode

**Form:** `?XMmode[,value]` · **Works on:** `PSG`, `SCC`

What the steps of an effect or a literal (?XT2) track change: 0 off, 1 the note, 2 the pitch, 3 the level; value is how many ticks each step lasts (with ?XM0, the next ?XS value).

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XP` — Program step

**Form:** `?XPperiod,level[,1]` · **Works on:** `PSG`, `SCC`

One step of an instrument program: a period (0–4095) and a level (0–15).

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XI` — Pitch step size

**Form:** `?XI0 / ?XI1 / ?XI2` · **Works on:** `PSG`, `SCC`

Whether effect pitch steps are bytes (0), words (1) or high bytes (2); compact rows.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?XI1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SztNYuSA9WxENVqKUF9aR4rBfppfTfnUgvk53JG7IjDRSVqadI9fl0WFXNjpi-sEVb-u3oOaSc5Jwp557Vr1k1Y0WoYZ7mkWMNCCgyzwIVGEEmWIkhYqxYSaw9v_6ZbQ0z3Gohne59VXelK7pGIVeTI2R_Cbib427qBg3uk7jncuMW-Pab4u3B9LIx_QA)

#### `?XS` — Literal step

**Form:** `?XSbyte` · **Works on:** `PSG`, `SCC`

One byte of the score (0–207, often $hex). On a ?XT2 track or in an effect it is a step lasting the ?XM length (after ?XM0, its own value: ?XM0 ?XS$6D waits 109 ticks); on a ?XT1 track it is a note (pitch ×16 + length − 1). Compact rows.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?XS2 ?EP2,129,115 v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SzdK0tyB6seKoKtVhQT4rHepFeSv_difSS7My8ITvSQKUy9VRSczoeVnW7I6YvZLpWfjt6DpGzgnPlwrP6NavmrDA1zNs0fMSAgMLzLJgCIfAEkRgixoqVxNrz6-9ZapjhVgtxuvd101Uuda1iXGw0waX9OeBugbvRDRrcJ3PP5cYt8O03lbcH08vW9AM)

#### `?XT` — Track type

**Form:** `?XTn[,mode]` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

The kind of track: 1 notes (PSG/SCC and OPLL melody), 2 literal steps (?XS, ?XP) on PSG/SCC, 4 notes that start the ?XD effects (c = ?XD0, c+ = ?XD1 …), 64 for MSXG, 0 clears the saved OPLL state. On ?XT4 and ?XT64 tracks r is a rest that starts nothing. On PSG/SCC ,1 changes it directly and ,2 also keeps dormant note phases.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SztNZdkB6seKoKtVhQT4rHepFeSv_difSS7My8ITvSQEmZekrUnI6HVd3uiOkLWV4rvx09h5yzyIVy9Kx-zaoFK0wN8zYNHzEgoPA8C6ZACDxBJIaIsWIlsfb8-nuWGma41UI-3fu66SpXdq1iXDD254CTESdzN2hwn8w9lxu3wI_flG4Pppet6Qc)

#### `?IM` — Use an instrument program

**Form:** `?IMn  /  ?IM-` · **Works on:** `PSG`, `SCC`

Plays notes through program map n (?IMn={…}); the program is latched per note. ?IM- stops it.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XH` — Hold effects

**Form:** `?XH0 / ?XH1` · **Works on:** `PSG`, `SCC`

Whether running effect programs carry on into the next note (1) or not (0).

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 ?XH0 v12 o4 c%2 ?XR c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1QCEPA4UyoNp8E4VkVaCWiCAI7emrC-Q4KxSpmigoAh2WpmQVHaujlAKiagE)

#### `?XC` — Cancel effects

**Form:** `?XC  /  ?XCmask,1 !` · **Works on:** `PSG`, `SCC`

Cancels the running program; ?XCmask,1 just before ! ends a group of channels together.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XR` — Restart effects

**Form:** `?XR` · **Works on:** `PSG`, `SCC`

Starts the running program again from its beginning.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 ?XH0 v12 o4 c%2 ?XR c%2 ?IM- ?XC r%4 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1QCEPA4UyoNp8E4VkVaCWiCAI7emrC-Q4KxSpmigoAh2WpmQVHaujlAKiagE)

#### `?VF` — Global fade

**Form:** `?VFprofile,interval,step,target  /  ?VF-` · **Works on:** `PSG`, `SCC`, `OPLL`, `MSXG`

Fades all MSX channels: profile 0–1, every interval by step (1–15) to target level (0–15). ?VF- cancels it.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?EP2,129,115 ?VF0,4,1,0 v12 o4 c%16 c%16 !
```

[▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJAEIRf5Vyw25XbIz8kICmMWkWFGBNQK8UyNpIm5N2d1TSzN7PfsNxIA-XK1FNO9fGwX1XNhpg-sEVb-vXoOcQcZZwqZ57VJ6yasiLUME_zyLEGBBSZZ4EKjCATrMQQMVasJNaeX7_MtoYZbrUQT7e-qrvSFV2jkDNkewo4meFk7IrLznPEyt4NGtw7co-lJn9Z4Asvyq93pqeN6Qs)

## Songs written with the extension

These repository samples are written entirely with the chip extension commands. The links open each song in MUCPlayground with the oscilloscope:

- **[Gradius 2 — A Planet of Plants (Plant Planet Theme)](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/Gradius2/A%20Planet%20of%20Plants%20%28Plant%20Planet%20Theme%29.MUC)** — SCC + PSG, waves from `#sccvoice GRA2.DAT`, ?XD drum effects · [▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/Gradius2&song=A%20Planet%20of%20Plants%20%28Plant%20Planet%20Theme%29.MUC&view=scope)
- **[F-1 Spirit 3D Special — 01 Is it Domingo Today](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/F-1_Spirit_3D_Special/01%20Is%20it%20Domingo%20Today.MUC)** — MSX-MUSIC melody parts and MSXG drums with an ?IT kit · [▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/F-1_Spirit_3D_Special&song=01%20Is%20it%20Domingo%20Today.MUC&view=scope)
- **[Space Manbow — 03 Battle Ship (1st.BGM)](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/SpaceManbow/03%20Battle%20Ship%20%281st.BGM%29.MUC)** — SCC waves defined with ?WD, PSG and ?XD sound effects · [▶ Open in MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/SpaceManbow&song=03%20Battle%20Ship%20%281st.BGM%29.MUC&view=scope)

The whole set: [`Samples/Muc/MucoMSXChipExtension(msPb)Format`](../Samples/Muc/MucoMSXChipExtension(msPb)Format). The MUCScope and MUBScope packages ship these three songs as their msPb samples (MUC and compiled MUB).

## Videos

The playlist **[MucoMSX (Mucom88 for MSX)](https://www.youtube.com/playlist?list=PLC9BqxYlA7js)** shows the toolchain and players on MSX, including songs written with these commands.

| | |
|---|---|
| [![MUCEdit — editing and compiling on the MSX](https://img.youtube.com/vi/Wq0RhtrQlBE/mqdefault.jpg)](https://www.youtube.com/watch?v=Wq0RhtrQlBE) | **[MUCEdit — editing and compiling on the MSX](https://www.youtube.com/watch?v=Wq0RhtrQlBE)** |
| [![MUCScope — compile and play a MUC with visuals](https://img.youtube.com/vi/CJvW9Itukdw/mqdefault.jpg)](https://www.youtube.com/watch?v=CJvW9Itukdw) | **[MUCScope — compile and play a MUC with visuals](https://www.youtube.com/watch?v=CJvW9Itukdw)** |
| [![MUBScope — visual music player demo](https://img.youtube.com/vi/Xk4awiKuZGc/mqdefault.jpg)](https://www.youtube.com/watch?v=Xk4awiKuZGc) | **[MUBScope — visual music player demo](https://www.youtube.com/watch?v=Xk4awiKuZGc)** |
| [![MUBPlay — playing a finished MUB](https://img.youtube.com/vi/jpkDOpuv0Ig/mqdefault.jpg)](https://www.youtube.com/watch?v=jpkDOpuv0Ig) | **[MUBPlay — playing a finished MUB](https://www.youtube.com/watch?v=jpkDOpuv0Ig)** |

## Older forms and the full toolchain reference

Older MSX songs use one-letter `?` forms (`?p`, `?r`, `?j`, `?PN{…}`, `?RN{…}`, `?n`, `?s`, `?H`, `?L` …) and the MUCOM88 commands listed under *MUCOM88 commands on MSX channels*. They still compile; new songs should use the two-letter commands on this page.

The toolchain's own complete specification, including those older forms and the packed format details, is `docs/MSX_MML_EN.TXT` (also `_KO`, `_JA`), `docs/PACKED_NOTES.TXT` and `docs/OPLL_NATIVE.TXT` in the MucoMSX documentation package. The MSX chip targets are described in [`shared/docs/MSX_TARGETS.en.md`](../shared/docs/MSX_TARGETS.en.md) and SCC control in [`shared/docs/SCC_CONTROL.en.md`](../shared/docs/SCC_CONTROL.en.md).
