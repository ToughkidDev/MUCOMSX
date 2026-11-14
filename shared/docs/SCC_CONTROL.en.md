# SCC control engine


## Common MML on compact rows

MSX rows with `?XU` also accept `|`, `[ ... ]n` and `L`. A bar line adds no data.
Repeats nest at most twice and may continue on the next row of the same channel.
A repeat cannot cross a definition's closing `}`. `L` marks the channel loop;
the following `!` jumps back to it. Compact rows do not support `/` repeat exits.
Replace `[A / B]n` with `[A B]n-1 A`, writing the calculated integer for `n-1`.

```text
MSXA ?XU1 ?XT1 ?IR3 v12 o4 [c%2 [d%2]2]3 e%2 !
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v12 o4 c%4 !
```

Compact OPLL melodies accept `?IR1`–`?IR15` and `?IU0`–`?IU15`.
Define custom patches first with `?IUindex={8 bytes}`. PSG-only compact songs
need no `?WD`; define SCC waves before compact SCC music rows.
`?FB0 ... ?FBn` works on OPLL melody and MSXG. A rest on `?XT4` waits without
starting an effect; a rest on MSXG `?XT64` hits no drums. `?ID` applies pending
`?IT`, volume and `?IB`. When `?WM` sample strides pass the shared wave region's
end, samples wrap to its first wave. Existing aliases and OPNA grammar remain
unchanged. Mixed OPNA/MSX songs retain `#CarrierCorrection` and `#OPNA1RhythmMute`.

## Functional MSX commands

Preferred names contain exactly two uppercase letters, for example
`?EP2,41,112`, `?DW-3`, `?WD0={...}`, `?WS1,0`, `?FC1`.
Existing one-letter `?`/`@` aliases retain their output. There is no `@EP`
alias. Numeric `@number`, FM definitions, OPNA and virtual SSG `@I`/`@W`
are unchanged. WD defines 32 signed8 samples; global definitions alone do
not activate the new path, except that a global `?WS` row importing a
`#sccvoice` bank selects the MSX grammar even when the SCC rows carry no
`?`/`@` letter command (2026-10-30). `?XT1 ?WP2` equals the old `?k1,2` object bytes.
Write compact `?XU` directly on a channel, outside text macros.
KT/IM tables, XH/XC/XR program controls and VF global MSX fade use PN6.
See the complete command table in
`docs/MSX_MML_EN.TXT` in the documentation ZIP. Numbered y controls below remain
a separate legacy protocol.

```text
SCCA @0 ?EP2,41,112 ?DW-3 o4 l8 cdef !
```

Existing SCCA–SCCE notes, v/E/M/D/P/@ remain supported. SCC v immediately emits the current envelope level without advancing it or writing pitch. Non-owner page endings cannot mute the owner. As in MUSICLALF and mucomDotNET, the tick that reads a same-pitch tied note neither advances E nor writes volume; E resumes on the next tick. A `v` change inside a tie therefore appears one tick later and a 1-clock tied `v` step is not output (2026-10-30, matches MDPlayer4Mac). This applies to OPNA SSG too.

SCC-only `y0,0,control,value` compiles to four-byte `FF EC control value`. This is a semantic extension, separate from raw register streams. Other channel types keep their y semantics.

| Control | Meaning | Value |
|---|---|---|
| 224 | Absolute volume | 0–15; 255 resumes the current E level |
| 225 | Stage direct period low byte | 0–255 |
| 226 | Commit direct period high byte | 0–15; 255 resumes note pitch |
| 227 | Period offset | Signed byte, e.g. 253 = -3 |
| 228 | Channel hardware gate | 0/1, preserving effect phase |
| 229 | Wave upload policy | 0 live, 1 mute affected channel, 2 mute chip; add 128 to force identical waves |
| 230 | Clear/select table to define | 0–7 |
| 231 | Append a timed step | 1–255 music ticks |
| 232 | Last step volume | 0–15; 255 holds |
| 233 | Last step period offset | Signed byte; 128 holds |
| 234 | Last step gate | 0/1; 255 holds |
| 235 | Last step preset wave | 0–9; 255 holds |
| 236 | Sustain loop index | 0–15; 255 disables looping |
| 237 | Release entry index | 0–15; 255 silences at key-off |
| 238 | Select playing table | 0–7; 255 stops sequencing, retaining controls |
| 239 | New-note phase policy | 0 restart; 1 preserve |
| 240 | Register phrase entry | ID 0–7; its first occurrence plays normally |
| 241 | Phrase end/return | Must be 0 |
| 242 | Call a registered phrase | ID 0–7 |

Periods saturate to 9–4095. Explicit identical period commits remain actual writes. Upload muting restores the previous gate mask; ordinary SCC channels 4/5 are muted together when their shared wave changes.

Eight shared tables hold at most 16 steps each. Defaults hold volume, pitch, gate and wave. Offsets are relative to the note/direct period, not cumulative. Sustain loops before the release entry; release never loops back. At the end, hold the last value. New notes restart by default; ties do not. Gate-off keeps effects running. Non-owner pages follow the existing SSG ownership/pause policy. Private E state keeps progressing under absolute volume. Ticks follow musical tempo rather than VBlank.

Eight phrases share one compiled body across SCC pages. Four return frames per page retain 32-bit cursor and bounds, including mapper crossings. Register a phrase before calling it. Undefined IDs, excessive nesting, and invalid tables stop with an error. Avoid recursion. Calls retain the caller's control state; returns do not restore volume/wave. Existing #* macros still expand at compile time.

Old msPb0102 capability 5 remains supported. Only new controls require capability 13; older DOS players reject it. Existing scores without these controls retain identical MUB/DATA. Use matching MUC2MUB/MUCPLAY/MUBPLAY; MUCEDIT edits the existing y syntax. Do not assume third-party PC engines implement this extension.

The normal Z80/512KiB mapper limit and D600 workspace remain. State/tables reuse existing banks; contiguous SCC writes share slot transitions. This supplies control primitives observed in a Konami driver; it does not certify original-game PCM phase equivalence or eliminate the cost of per-tick wave uploads.
