// The MML examples of the user's guide (guide.*.js shows them with <pre data-ex="id">).
// They are the same in every language, every one compiles, and each has an "Open in
// MUCPlayground" button that opens it as a song.

const LEAD = `  @1
   6,5
   31,12,0,7,3,28,0,1,3
   31,6,3,7,3,0,0,1,3
   31,6,3,7,3,0,0,2,7
   31,6,3,7,3,0,0,1,0`;
const BASS = `  @2
   5,0
   31,14,0,8,2,30,0,0,0
   31,14,0,8,2,40,0,1,3
   31,12,0,8,2,36,0,1,7
   31,8,4,8,2,0,0,1,0`;

export const EXAMPLES = {
  first: `#title My first song
; D is SSG 1: @0 gives it a sound, v12 its volume
D T120 @0 v12 o4 l8 cdefgab>c4 r4`,

  notes: `#title Notes and lengths
D T120 @0 v12 o4
; c4 = quarter, c8 = eighth, a dot adds half, r is a rest
D c4 d8 e8 f4. g8 | a2 r4 b8 >c8 | c1
; l16 sets the default length; > and < go an octave up and down
D l16 <cdefgfed c4 r4
; & ties two notes, ^ adds a length to the note before
D c4&c4 e4^8 r8 g2`,

  sharps: `#title Sharps, flats and octaves
D T120 @0 v12 l8
; + or # raises a semitone, - lowers it
D o4 c c+ d d+ e f f+ g g+ a a+ b >c4 r4
D o5 c <b b- a a- g g- f e e- d d- c4 r4`,

  tempo: `#title Tempo
; T sets the tempo in beats per minute, once for the whole song
A T160 @1 v12 o5 l8 cdefgab>c4 r4

${LEAD}`,

  fmvoice: `#title An FM voice
; @1 is defined below: FB,ALG, then one line per operator
; AR,D1R,D2R,RR,D1L,TL,KS,ML,DT
  @1
   6,5
   31,12,0,7,3,28,0,1,3
   31,6,3,7,3,0,0,1,3
   31,6,3,7,3,0,0,2,7
   31,6,3,7,3,0,0,1,0

A T120 @1 v12 o5 l4 c e g >c2 r2`,

  parts: `#title Several parts
${LEAD}
${BASS}

; A, B, C and H, I, J are the six FM parts; they play together
A T120 @1 v11 o5 l4 e g a g e2 r2
B @2 v12 o2 l8 [a a >a< a]4
; D, E, F are the three SSG parts
D @0 v8 o4 l2 c+ e c+ e`,

  rhythm: `#title Rhythm part G
; G plays the YM2608's drums: @ picks them (1 BD, 2 SD, 4 TOP, 8 HH, 16 TOM, 32 RIM)
; v sets the total level, then the level of each drum
G T120 v60,28,26,22,18,24,24 l8
G [@9c @8c @10c @8c]4`,

  repeat: `#title Repeats and loop
${BASS}

; [ ]n repeats n times; / leaves the last pass early; L is where the song loops back to
A T120 @2 v12 o3 l8
A c c >c< c L [d d >d< d / e e >e< e]3 f f >f< f`,

  macro: `#title Macros
${LEAD}

; #*n{ } defines a phrase once; *n plays it
#*1{ ceg>c<ge }
#*2{ dfa>d<af }
A T120 @1 v11 o4 l16 L *1 *1 *2 *2`,

  ssg: `#title SSG sounds
; @0–@9 are SSG presets; E is a software envelope (AL,AR,DR,SR,SL,RR)
D T120 @0 v12 o4 l4 c e g r
E @0 E255,0,12,0,0,255 v14 o5 l8 c e g e c4 r4
; P2 is noise, P3 tone and noise, P1 tone only
F @0 v12 P2 o4 l16 [c]8 r2`,

  effects: `#title Gate and detune
${LEAD}

; q sets how early a note is let go (0 = full length)
A T120 @1 v12 o5 l8 q0 cdef q4 cdef q7 cdef
; D detunes the part a little
B @1 v9 o5 l8 D4 cdef cdef cdef`,

  msx: `#title MSX chips
#mucom88 1.7
; @1 for MSX-MUSIC is written like an FM voice (two operators are used)
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
; @W0 is an SCC wave: 32 samples from -128 to 127
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }

; MSXA–MSXC: MSX-MUSIC (YM2413)
MSXA T120 @1 v15 o4 l8 L c e g e
; MSXD–MSXF: the MSX PSG
MSXD @0 E255,0,12,0,0,255 v15 o5 l8 L r4 c r
; SCCA–SCCE: the SCC, playing the waves @W0…
SCCA @0 E255,0,0,0,0,255 v8 o5 l4 L e g`,

  ext: `#title MucoMSX chip extension (SCC)
?WD0={ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
; ?WD0 defines wave 0; ?XU1 starts a compact row (lengths in units, %n), which ends with !
; ?XT1 notes, ?WP0 @0 wave 0, ?EP- no envelope
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o5 c%8 e%8 g%8 >c%8 !`,
};
