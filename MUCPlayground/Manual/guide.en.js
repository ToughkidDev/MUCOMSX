// The MUCPlayground user's guide — Part 1, using MUCPlayground (English).
// Each chapter: { id, title, html }. The <h3> headings in html go into the contents,
// and <pre data-ex="name"></pre> is replaced by the example from examples.js (coloured, with an Open button).
export default [
  {
    id: 'start',
    title: 'Getting started',
    html: `
<p class="lead"><b>MUCPlayground</b> is a practice space where you write MUCOM88 MML (MUC files) in the browser and hear it right away. There is nothing to install. Your songs are stored only in your own browser and are never uploaded anywhere.</p>
<p>Address: <a href="https://toughkiddev.github.io/MUCOMSX/MUCPlayground/">https://toughkiddev.github.io/MUCOMSX/MUCPlayground/</a></p>

<h3>What you can do</h3>
<ul>
  <li><b>Write and play MML</b>: Write songs for the YM2608 (OPNA) with its 6 FM channels, 3 SSG channels, rhythm and ADPCM, and for the MSX chips of MUCOMSX (MSX-MUSIC, MSX PSG, SCC/SCC+). Press <kbd>Ctrl+Enter</kbd> to hear them at once.</li>
  <li><b>An editor that helps</b>: Syntax colouring, command suggestions as you type, checks while you type, and a "what it means / how to fix" explanation for every error.</li>
  <li><b>Tools to look at the music</b>: A tracker (pattern and piano roll), an oscilloscope for each channel, a keyboard for each channel, and a channel view like MDPlayer4Mac's.</li>
  <li><b>Voice, wave and PCM editing</b>: An FM voice editor, an SCC wave editor and a PCM sample editor (all in Furnace style), and voice banks.</li>
  <li><b>Files</b>: Open and save <code>.muc</code>, export <code>.mub</code> and <code>.vgm</code>, and play <code>.mub</code>, <code>.vgm</code> and <code>.vgz</code>. There are also playlists and the repository's samples.</li>
  <li><b>Sharing</b>: Send a song (and its small attached files) in a single link, with no server.</li>
</ul>

<h3>Your first song in 5 minutes</h3>
<ol>
  <li>Press <b>New</b> in the toolbar and pick a template (the first time, take the one at the top).</li>
  <li>Press <b>▶ Play</b> (<kbd>Ctrl+Enter</kbd>). The playing position is marked in the editor in each part's colour.</li>
  <li>Change the notes on the melody line (<code>c d e</code> …) and play again. When you stop typing, the song is checked in the background and mistakes are underlined.</li>
  <li>When you like it, press <b>Save</b> (<kbd>Ctrl+S</kbd>) to download a <code>.muc</code> file. Even if you don't save, the browser remembers the song, so it is still there next time.</li>
</ol>
<p>To start from nothing, clear the editor and write just one line, like this.</p>
<pre data-ex="first"></pre>
<div class="note">Because of browser rules, a page you have just opened cannot make sound until you click once. If you see "Click anywhere on the page to start the sound", click the page once.</div>

<h3>What you need</h3>
<ul>
  <li>It works in recent Chrome, Edge, Safari and Firefox (PC and Mac), and on iPhone and iPad (iOS/iPadOS 16.4 or later).</li>
  <li>The first time you open it, it downloads the sound engine (about 4 MB, compressed). The VGM engine (about 7 MB) is downloaded the first time you play a VGM. Once downloaded, the browser keeps them.</li>
  <li>Your songs, attached files and settings are stored only in that browser. To move them to another device, use a saved file or a share link.</li>
</ul>
`,
  },
  {
    id: 'screen',
    title: 'The screen',
    html: `
<h3>The header at the top</h3>
<table>
  <tr><th>Item</th><th>What it does</th></tr>
  <tr><td>🔗 Share</td><td>Makes a link that opens the song, file or playlist that is open now. See <a href="#share">Share links</a>.</td></tr>
  <tr><td>🎧 Player mode</td><td>Shows the MDPlayer4Web player in place of the editor. Press it again to go back to the editor.</td></tr>
  <tr><td>📘 Guide</td><td>Opens this guide in a new tab.</td></tr>
  <tr><td>Text</td><td>Editor text size (10–24 px). The tracker follows it.</td></tr>
  <tr><td>Menus</td><td>Size of the header, toolbar, side panels and other parts of the screen (100–200 %). On a narrow screen it is limited automatically.</td></tr>
  <tr><td>EN / 한국어 / 日本語</td><td>Screen language. Explanations, messages and the MML guide all change with it.</td></tr>
</table>

<h3>Toolbar</h3>
<table>
  <tr><th>Item</th><th>What it does</th></tr>
  <tr><td>⏮ ▶ ⏭</td><td>Previous song, Play, next song. Previous and next are on only when a playlist of two songs or more is open.</td></tr>
  <tr><td>❚❚ Pause / ■ Stop</td><td>Hold the song where it is (<kbd>F8</kbd>; press again to go on) / stop (<kbd>Esc</kbd>).</td></tr>
  <tr><td>Loop button</td><td>What happens at the end of a song: Once / Loop / Random. See <a href="#play">Playback</a>.</td></tr>
  <tr><td>Clock</td><td>Playing time and loop count.</td></tr>
  <tr><td>▦ Channels</td><td>Shows an MDPlayer4Mac-style chip panel in place of the editor.</td></tr>
  <tr><td>☰ Playlist</td><td>Opens a list of songs on the right.</td></tr>
  <tr><td>Volume / Speed</td><td>Overall volume; playback speed (25–200 %, the pitch stays the same).</td></tr>
  <tr><td>Examples list</td><td>Pick a demo, a template or your recent song.</td></tr>
  <tr><td>New / Samples… / Open… / Folder…</td><td>Start from a template, open a sample from the repository, open your own files, open a folder on your computer.</td></tr>
  <tr><td>Save · .muc · .mub · .vgm</td><td>Save and export the song.</td></tr>
</table>

<h3>The editor and the bottom bar</h3>
<p>The MML editor is in the middle. The bar below it has these buttons.</p>
<ul>
  <li><b>Split</b> ▯ ◫ ⊟: Shows the same song once / twice side by side / twice one above the other.</li>
  <li><b>🎼 Tracker</b>, <b>∿ Scope</b>, <b>📖 Manual</b>, <b>🎹 Keys</b>: Open each view in the right-hand frame (while you edit, Keys is a piano at the bottom).</li>
  <li>Caret position (line, column), song size, the <kbd>Ctrl+Space</kbd> hint, and the <b>Follow playback</b> checkbox.</li>
  <li>In the channel view, a <b>Size</b> button (Fit/100/75/50/25 %) appears.</li>
</ul>

<h3>The right-hand panel</h3>
<ul>
  <li><b>Now playing</b>: Song title, composer and chips, the list of parts (click one to choose the part to follow), and the output waveform.</li>
  <li><b>Compiler messages</b>: The list of errors and warnings. Click one to go to its line.</li>
  <li><b>Voice / PCM files</b>: Whether the files the song uses (<code>#voice</code>, <code>#sccvoice</code>, <code>#pcm</code>) are attached, and the FM/SCC/PCM bank buttons.</li>
  <li><b>Quick reference</b>: A short list of everything in the MML guide. It follows the command at the caret.</li>
</ul>
`,
  },
  {
    id: 'play',
    title: 'Playback',
    html: `
<h3>Play, Pause and Stop</h3>
<table>
  <tr><th>Action</th><th>Button</th><th>Key</th></tr>
  <tr><td>Play from the start (after compiling)</td><td>▶ Play</td><td><kbd>Ctrl+Enter</kbd></td></tr>
  <tr><td>Hold where it is / go on</td><td>❚❚ Pause / ▶ Resume</td><td><kbd>F8</kbd></td></tr>
  <tr><td>Stop</td><td>■ Stop</td><td><kbd>Esc</kbd></td></tr>
  <tr><td>Play only the caret's line (or the selected lines)</td><td>▶ at the end of the line</td><td><kbd>Ctrl+Shift+Enter</kbd></td></tr>
</table>
<p>Pause keeps the playing marks, the channel view and the clock as they are. Play always compiles again and starts from the beginning.</p>
<p>While a <code>.mub</code>/<code>.vgm</code> file is open in the channel view, ▶ plays that file. Turn off ▦ Channels to go back to the editor, and ▶ plays the MUC again.</p>

<h3>The loop button: Once · Loop · Random</h3>
<p>Each press of the button right of Stop changes the mode, and the mode you pick is remembered.</p>
<table>
  <tr><th>Mode</th><th>Icon</th><th>What it does</th></tr>
  <tr><td>Once (default)</td><td>⇥ an arrow to a bar</td><td>A song with a loop (<code>L</code>) plays through once, then the loop section once more (1+1), then fades out over 3 seconds. A song without a loop stops at the end.</td></tr>
  <tr><td>Loop</td><td>🔁</td><td>Plays over and over until you stop it. A song without a loop starts again from the beginning when it ends.</td></tr>
  <tr><td>Random</td><td>🔀</td><td>Plays the playlist's songs one at a time in random order, each once (1+1). No song comes again until every song has played.</td></tr>
</table>
<div class="note">The loop button and ⏮ ⏭ are on only when <b>a playlist of two songs or more</b> is open. Otherwise they are dimmed and off, and the song plays "Once". If you change the mode during playback, the change takes effect at the song's next loop point.</div>

<h3>Previous song / next song</h3>
<p>⏮ ⏭ move through the playlist in order, going round from the end to the start. In Random mode, ⏭ picks another song at random, and ⏮ goes back through the songs you just heard, in order.</p>

<h3>Volume and Speed</h3>
<ul>
  <li><b>Volume</b>: The overall output volume. Set the volume of each channel with the faders in the <a href="#channels">channel view</a>.</li>
  <li><b>Speed</b>: Plays at 25–200 % without changing the pitch. While you drag, it rests at 100 % for a moment; double-click to go back to 100 %. Saved <code>.mub</code>/<code>.vgm</code> files are always at the original speed.</li>
</ul>

<h3>Playing marks</h3>
<p>During playback, the command each part is playing now is marked in the editor in that part's colour (MSX and SCC parts included). The editor scrolls to follow the part chosen in the "Now playing" list on the right; turn off <b>Follow playback</b> in the bottom bar to stop this. In split editing, the side you are working in stays where it is and the other side follows.</p>

<h3>Play one line</h3>
<p>Put the caret on a part line that has notes, and a ▶ appears at the end of the line. It plays only that line, with the settings up to that point (voice, volume, octave, length, tempo and so on) taken from the lines before. Select several lines and press <kbd>Ctrl+Shift+Enter</kbd> to play those lines. During playback the button turns into ■, so you can stop it.</p>
`,
  },
  {
    id: 'mml',
    title: 'First steps in MML',
    html: `
<p>A MUC file is plain text. At the top go the tags (<code>#title</code> and so on), then the voice definitions, then the playing lines of each part. A playing line is <b>part letter + space + MML</b>. Press the ▶ button on any example below to open it straight in MUCPlayground. Every command is explained in detail in <a href="#part-ref">Part 2, the MML reference</a>.</p>

<h3>Parts</h3>
<table>
  <tr><th>Part</th><th>Chip</th><th>Notes</th></tr>
  <tr><td><code>A B C H I J</code></td><td>YM2608 FM 1–6</td><td>Needs a voice <code>@n</code> definition.</td></tr>
  <tr><td><code>D E F</code></td><td>SSG 1–3 (square wave, noise)</td><td>Makes no sound without <code>@</code> or <code>E</code>, and <code>v</code>.</td></tr>
  <tr><td><code>G</code></td><td>Rhythm (BD SD TOP HH TOM RIM)</td><td>Pick the drums with <code>@</code>.</td></tr>
  <tr><td><code>K</code></td><td>ADPCM</td><td>Needs a PCM file (<code>#pcm</code>) or <code>#@pcm</code>.</td></tr>
  <tr><td><code>MSXA–MSXC</code>, <code>MSXH–MSXJ</code></td><td>MSX-MUSIC (YM2413)</td><td>MUCOMSX.</td></tr>
  <tr><td><code>MSXG</code></td><td>MSX-MUSIC drums</td><td>MUCOMSX.</td></tr>
  <tr><td><code>MSXD–MSXF</code></td><td>MSX PSG</td><td>MUCOMSX.</td></tr>
  <tr><td><code>SCCA–SCCE</code></td><td>SCC / SCC+</td><td>MUCOMSX. Waves <code>@Wn</code>.</td></tr>
</table>
<p>Write several part letters on one line, like <code>ABC</code>, and the same MML goes into each of those parts. Lines of the same part join up from top to bottom. From <code>;</code> to the end of the line is a comment, and <code>|</code> is a bar line that only helps you read.</p>

<h3>Notes, lengths and rests</h3>
<p>Notes are <code>c d e f g a b</code>, and a rest is <code>r</code>. The number after it is the length (4 = quarter note, 8 = eighth note), and a dot (<code>.</code>) adds half. <code>l</code> sets the default length used when the number is left out, <code>o</code> sets the octave, and <code>&gt;</code> <code>&lt;</code> go one octave up and down. <code>&amp;</code> is a tie, and <code>^</code> adds length to the note before.</p>
<pre data-ex="notes"></pre>
<pre data-ex="sharps"></pre>
<div class="tip">To write a length straight in clocks, use <code>%</code>, as in <code>c%24</code>. When a whole note is 128 clocks (<code>C128</code>), a quarter note is 32 clocks.</div>

<h3>Tempo</h3>
<p><code>T</code> is beats per minute (BPM), usually written once in part A. <code>t</code> sets the timer value directly.</p>
<pre data-ex="tempo"></pre>

<h3>FM voices</h3>
<p>An FM part needs a voice <code>@n</code> to make sound. Define it in the song (as below), or attach a voice file (<code>#voice</code>). A definition is <code>@n</code> indented by two spaces, then one line of <code>FB,ALG</code>, then one line of <code>AR,D1R,D2R,RR,D1L,TL,KS,ML,DT</code> for each operator.</p>
<pre data-ex="fmvoice"></pre>
<p>Put the caret on a voice line to see a preview of the algorithm, waveform and envelopes; <b>✎ Edit</b> opens the <a href="#banks">FM voice editor</a>.</p>

<h3>Several parts together</h3>
<pre data-ex="parts"></pre>

<h3>SSG sound</h3>
<p>SSG parts (<code>D E F</code>) start with a silent envelope, as the original MUCOM88 does. Give them an <code>@0</code>–<code>@9</code> preset or a software envelope <code>E</code>, and set the volume with <code>v</code>. <code>P</code> chooses tone or noise.</p>
<pre data-ex="ssg"></pre>

<h3>The rhythm part</h3>
<pre data-ex="rhythm"></pre>

<h3>Repeats, loops and macros</h3>
<p><code>[ … ]n</code> repeats n times, and a <code>/</code> inside it leaves the repeat there on the last time. <code>L</code> is the loop point the song goes back to after its end. Define a phrase once with <code>#*n{ … }</code> and call it with <code>*n</code>.</p>
<pre data-ex="repeat"></pre>
<pre data-ex="macro"></pre>

<h3>Gate and detune</h3>
<pre data-ex="effects"></pre>

<h3>MSX chips (MUCOMSX)</h3>
<p>With MUCOMSX parts you can use MSX-MUSIC, the MSX PSG and SCC together with the OPNA or on their own. An SCC wave is defined with <code>@Wn:{ … }</code>, made of 32 samples (-128–127).</p>
<pre data-ex="msx"></pre>
<p>The <b>MucoMSX chip extension commands</b> of MDPlayer4Mac v0.2.4 and later (two-letter commands that start with <code>?</code>) give you envelopes, vibrato, shared phrases, effect programs and more. A packed line starts with <code>?XU</code> and ends with <code>!</code>.</p>
<pre data-ex="ext"></pre>
<p>For more examples, see the five MSX chip extension templates under <b>New</b> and the <a href="#ref-msx">MucoMSX chip extension reference</a>.</p>
`,
  },
  {
    id: 'editor',
    title: 'The editor',
    html: `
<h3>Colouring and suggestions</h3>
<p>Parts (in the same colour as their playing marks), notes, commands, numbers, repeats and brackets, macros, tags and comments each have their own colour.</p>
<p>Type a command letter, <code>@</code>, <code>*</code>, or a <code>#</code> or part letter at the start of a line, and a list of suggestions appears. Each command comes with its argument form and a one-line explanation, and only the commands for that kind of part (FM, SSG, rhythm, ADPCM, MSX chips) are shown. <code>@</code> shows the voices defined in the song (the waves in an SCC part), and <code>*</code> shows the macros. Typing <code>?</code> in an MSX or SCC part shows that chip's extension commands; typing <code>?</code> at the start of a line shows the global resources (<code>?WD</code> waves and so on), with examples.</p>
<ul>
  <li><kbd>Ctrl+Space</kbd>: open the list anywhere</li>
  <li><kbd>Tab</kbd> / <kbd>Enter</kbd>: insert, <kbd>Esc</kbd>: close</li>
  <li>The list does not open while you type notes.</li>
</ul>

<h3>Checked as you type</h3>
<p>When you stop typing for a moment, the song is compiled in the background (playback is not interrupted). Errors and warnings appear as underlines and as marks next to the line numbers, and are listed in <b>Compiler messages</b> on the right.</p>

<h3>Reading compiler messages</h3>
<p>Each message shows its code (E0498, W0408 …), the line, column and part, the line itself with a <code>^</code> pointing at the place, the compiler's own text, then <b>What it means</b>, <b>How to fix</b> and, for a command, the <b>Correct form</b>. Click a message to go to its line, marked in red (error) or yellow (warning). If the compiler fails without saying where, MUCPlayground compiles the song again, cutting it down step by step, to find the line for you.</p>
<p>Besides the compiler's messages, MUCPlayground has checks of its own.</p>
<ul>
  <li><b>PG01 / PG02</b>: A part that makes no sound (an SSG/PSG part with no <code>@</code> or <code>E</code>, or no <code>v</code>).</li>
  <li><b>PG03</b>: A file the song names (<code>#voice</code>, <code>#pcm</code> and so on) is not attached. It comes with the <b>Attach file…</b> and <b>Find in folder</b> buttons.</li>
  <li><b>MSX19</b>: If the file of the <code>#pcm</code> tag is missing, the song is not compiled, as in MucoMSX.</li>
</ul>
<p>Every code is explained in <a href="#messages">Part 3, Messages</a>.</p>

<h3>Split editing</h3>
<p>The <b>Split</b> button in the bottom bar shows the same song twice, side by side (◫) or one above the other (⊟). This is handy for working on two places in a long song at once; an edit on either side changes both. Drag the middle bar to change the sizes, and double-click it for half and half.</p>

<h3>Previews</h3>
<ul>
  <li><b>SCC waves</b>: Put the caret on an <code>@Wn:{…}</code> or <code>?WDn={…}</code> line to see a picture of the wave. If the number of values or their range is wrong, it is shown in red.</li>
  <li><b>FM voices</b>: Put the caret on a voice definition line to see the algorithm, the output waveform and the envelope of each operator.</li>
  <li>In both previews, the <b>✎ Edit</b> button opens the editor (see <a href="#banks">Voice, wave and PCM banks</a>).</li>
</ul>

<h3>Text size, menu size and help</h3>
<p><b>Text</b> in the header sets the editor's text size, and <b>Menus</b> sets the size of the rest of the screen. Every button has a tooltip that tells you what it does and its shortcut (in three languages).</p>
`,
  },
  {
    id: 'views',
    title: 'The right-hand frame: Tracker · Scope · Manual · Keys',
    html: `
<p><b>🎼 Tracker</b>, <b>∿ Scope</b>, <b>📖 Manual</b> and <b>🎹 Keys</b> under the editor split the screen and open each view in the right-hand frame (on a narrow screen, below). Drag the middle bar to change the width. The channel view uses the same right-hand frame when it is open.</p>

<h3>Tracker: Pattern</h3>
<p>Shows the song as a Furnace-style tracker pattern. Each part has one column, and one row is as long as the <b>Row</b> setting (1/4–1/64 of a whole note). A cell shows the note that starts on that row (<code>C#4</code>), the voice (<code>@</code>) and the volume (<code>v</code>, in hex). A rest after a note is shown as <code>OFF</code>, and a held note as a bar. Notes that come from repeats or macros are shown dimmed.</p>
<ul>
  <li>The text and the tracker follow each other. Move the caret and the tracker cursor moves with it; click a cell and the matching token in the text is marked.</li>
  <li><b>Editing directly</b>: Click a cell and type in the form you see: <code>C#4</code>, <code>D-5</code>, <code>OFF</code>, <code>...</code> (rest); the <code>@</code>/<code>v</code> cells take two hex digits. Set <b>Input</b> to the tracker style to enter a note with one key: <kbd>Z S X D C</kbd> … / <kbd>Q 2 W 3 E</kbd> ….</li>
  <li><kbd>Delete</kbd>: make it a rest, <kbd>1</kbd>: note off (OFF), <b>Step</b>: the number of rows the cursor moves down after an entry.</li>
  <li><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>: undo/redo tracker edits, <kbd>?</kbd>: list of keys.</li>
  <li>During playback it scrolls so the playing row stays in the middle. If you scroll by hand, this pauses for a moment.</li>
</ul>

<h3>Tracker: Roll</h3>
<p><b>View: Roll</b> shows the same notes as a piano roll. Time flows to the left past a fixed red playing line; notes are bars in the part's colour, and the notes sounding now are white. Rhythm, drum and effect parts appear as grey marks on the top row. <b>Row</b> sets the zoom; while the song is stopped, look around with the wheel or <kbd>←</kbd> <kbd>→</kbd>. Click a note to see where it is in the text. The roll is for viewing only; edit in the pattern.</p>

<h3>Oscilloscope</h3>
<p>Draws one oscilloscope for each channel of the song that is playing. Each panel shows the part name and chip and the note or command playing now, and the wave is lined up on a rising edge so it holds still.</p>
<ul>
  <li><b>Time</b>: How much of the wave is shown (5–100 ms).</li>
  <li><b>Levels</b>: A white bar under each panel shows how loud the channel is.</li>
  <li><b>All channels</b>: Shows every channel, including those that have not sounded yet.</li>
  <li><b>Mix</b>: Also draws, at the bottom, the sound that goes out with all channels mixed.</li>
</ul>
<p>MUC, MUB and VGM are all shown channel by channel (VGM: YM2608, YM2203, YM2610, YM2151, YM2612, SN76489, AY8910, YM2413, SCC). The waves are read directly from each channel's output inside the emulator.</p>

<h3>The MML guide and Quick reference</h3>
<p><b>📖 Manual</b> opens the MML guide on the right. At the top, pick a book (MUCOM88 / mucomDotNET extensions / MucoMSX chip extensions), then find what you need with the chapter buttons or the search. Each entry has its form, an explanation and coloured examples, and <b>Insert</b> puts an example into your song. With <b>Follow caret</b> on, the entry for the command at the caret opens by itself (matching the part: for example, <code>@</code> in an FM part is an FM voice, and <code>@</code> in part G is a drum). The same content is in <a href="#part-ref">Part 2</a> of this guide.</p>
<p><b>Quick reference</b> in the right-hand panel shows every entry on one line each, and also follows the caret. Click a line to open that entry in the MML guide.</p>

<h3>Keys: while editing</h3>
<p>Press <b>🎹 Keys</b> while editing to open a piano (3 octaves) under the editor. Play it with the mouse or by touch, or click the piano once and play it from the computer keyboard (<kbd>Z S X D C V G B H N J M</kbd> lower octave, <kbd>Q 2 W 3 E R 5 T</kbd> … upper octave). Change the octave with <kbd>↑</kbd> <kbd>↓</kbd> or − / +. The sound follows the part at the caret: its FM voice, SCC wave, SSG square wave or rhythm noise. You can also pick another voice from the song. When the tracker is open, notes you play on the piano go into the tracker.</p>

<h3>Keys: while playing</h3>
<p>Play a song with Keys mode on, and instead of the piano the right-hand frame shows <b>one keyboard for each part</b>, with the keys pressed in the part's colour as they play. Rhythm and drum parts appear at the bottom as drum pads (<code>BD SD TOP HH TOM RIM</code> and so on; <code>XD0–XD9</code> for effect tracks) that light up at each hit. When you stop, the piano and the right-hand view you had come back.</p>
`,
  },
  {
    id: 'channels',
    title: 'Channel view',
    html: `
<p><b>▦ Channels</b> shows chip panels like MDPlayer4Mac's in place of the editor. Each channel has a keyboard, note name, frequency, level meter, pan and voice registers, and SCC also shows a wave table. Supported chips: YM2608, YM2610, YM2203, YM2151, YM2612 (with DAC), YM2413, SN76489, AY-3-8910, K051649/K052539 (SCC/SCC+).</p>

<h3>Size</h3>
<p><b>Size</b> in the bottom bar steps through Fit → 100 → 75 → 50 → 25 %. Fit is the largest size at which all panels fit on the screen, and it follows the window size.</p>

<h3>Channel volume (faders)</h3>
<p>When you play MUC and MUB, each channel has a fader beside the chip panel (in the same units as MDPlayer4Mac's mixer: 0.5 dB steps, from −32 (−16 dB) to +20 (+10 dB), and OFF below that).</p>
<ul>
  <li>Drag to adjust (it rests at 0 for a moment on the way); the wheel moves it 0.5 dB at a time.</li>
  <li>Click the number to switch that channel off and on. Double-click a fader to set it to 0; double-click VOL to set the whole chip to 0.</li>
  <li><b>RESET VOL</b>: Puts every channel back to 0.</li>
  <li>The settings stay for the next song, and saved files are not changed. VGM does not support channel volumes.</li>
</ul>

<h3>VGM, MUB and the right-hand frame</h3>
<p>Playing a <code>.mub</code> or <code>.vgm</code> opens the channel view automatically. You can open the tracker, scope and keys beside the channel view too. For files without MML, the notes are read from the log of chip register writes and shown in the tracker (read-only; columns are named by chip and channel, like <code>OPNA FM1</code>) and on a keyboard for each channel. This is done only when the tracker or keys are open, in a separate thread.</p>
`,
  },
  {
    id: 'files',
    title: 'Opening and saving files',
    html: `
<h3>Opening</h3>
<ul>
  <li><b>Open…</b>: Opens <code>.muc</code>, <code>.mub</code>, <code>.vgm</code>, <code>.vgz</code> and voice/PCM files (<code>.dat</code>, <code>.pcm</code>, <code>.bin</code>, <code>.wav</code>). Pick a song together with its files (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> or <kbd>Shift</kbd>+click), and the files are attached first, then the song opens.</li>
  <li><b>Drag and drop</b>: Drop files on the page. A <code>.muc</code> opens in the editor and plays; a <code>.mub</code>/<code>.vgm</code> plays. Drop a folder to open it as a playlist.</li>
  <li><b>Folder…</b>: Opens a folder on your computer and lists its songs (search by name, grouped by subfolder). When you open a song, the files it names are found in the folder and attached automatically. Chrome and Edge remember the folder.</li>
</ul>

<h3>Attaching voice and PCM files</h3>
<p>A song needs a file when it names one with a <code>#voice</code> (FM voices), <code>#sccvoice</code> (SCC waves) or <code>#pcm</code> (ADPCM samples) tag, or when it uses a default file (<code>voice.dat</code>, <code>SCCVOICE.DAT</code>, <code>mucompcm.bin</code>). The browser cannot read the files next to a file you opened, so attach them in one of these ways.</p>
<ol>
  <li>Pick them together with the song in <b>Open…</b></li>
  <li>Open the whole folder with <b>Folder…</b></li>
  <li><b>Add voice / PCM</b> on the right, or drag and drop</li>
</ol>
<p>A file that is not attached is reported with warning PG03, along with the <b>Attach file…</b> and <b>Find in folder</b> buttons. Samples from the repository get their files from the same folder automatically.</p>

<h3>Autosave, and keeping your song safe</h3>
<p>The song you are editing is saved automatically in the browser with its attached files, so it is there when you come back. If a sample or another file is about to replace your song while it has unsaved changes, you are asked first: <b>Save as .muc, then go on</b>, <b>Go on without saving</b> or <b>Cancel</b>. Even if you go on, your song is kept aside, and <b>Bring it back</b> returns it.</p>

<h3>Saving and exporting</h3>
<table>
  <tr><th>Button</th><th>What it does</th></tr>
  <tr><td>Save / .muc (<kbd>Ctrl+S</kbd>)</td><td>Saves the song in Shift-JIS with CR+LF (a form the MSX can use as it is). Characters that Shift-JIS cannot hold (Korean, emoji and so on) turn into <code>?</code>, so you are told first.</td></tr>
  <tr><td>.mub</td><td>The output of MUCPlayground's compiler (the same as MDPlayer4Mac). It is not byte-for-byte identical to the result of MUC2MUB on the MSX, so check it on real hardware.</td></tr>
  <tr><td>.vgm</td><td>A VGM 1.71 that records every chip write. A song with a loop is recorded once through plus the loop once more, up to 10 minutes.</td></tr>
</table>
<div class="warn">Korean text in comments shows in the editor, but turns into <code>?</code> when you save as <code>.muc</code>. Write notes you want to keep in English or Japanese, or keep them in a share link.</div>

<h3>Playing .mub · .vgm · .vgz</h3>
<p>Play them with <b>Open…</b> or drag and drop. A <code>.mub</code> plays on the editor's engine, and a <code>.vgm</code>/<code>.vgz</code> on MDPlayer4Mac's VGM player (about 7 MB is downloaded the first time). The channel view opens automatically when it plays.</p>
`,
  },
  {
    id: 'samples',
    title: 'Samples and templates',
    html: `
<h3>Samples…</h3>
<p>Shows the repository's <a href="https://github.com/ToughkidDev/MUCOMSX/tree/main/Samples">Samples</a> folder, folder by folder. Find a name with the search box at the top. Click a song: a <code>.muc</code> opens in the editor (its voice and PCM files come from the same folder), and a <code>.mub</code>/<code>.vgm</code>/<code>.vgz</code> plays.</p>
<ul>
  <li><b>📂</b> next to a folder opens all the songs in that folder as a playlist.</li>
  <li>The list is read live from GitHub, so songs committed to the repository appear right away. It is remembered for 10 minutes; <b>Refresh</b> reads it again.</li>
  <li>If GitHub cannot be reached (for example, because of the limit of about 60 requests an hour), the list built into the page is used.</li>
  <li>The VGM albums are in <code>Samples/VGMs</code> and come after the MUC folders.</li>
</ul>

<h3>New: templates</h3>
<p><b>New</b> opens a list of templates to start a song from. Every template has comments in English and Japanese, compiles with no messages, and has 8 bars in every part.</p>
<table>
  <tr><th>Template</th><th>Contents</th></tr>
  <tr><td>OPNA + MSX chips</td><td>OPNA FM and rhythm together with MSX-MUSIC, the MSX PSG and the five SCC parts, in ordinary MML.</td></tr>
  <tr><td>MSX chips, chip extension</td><td>All the MSX chips together, with the MucoMSX chip extension commands.</td></tr>
  <tr><td>OPNA + MSX chips, chip extension</td><td>OPNA FM and rhythm with MSX parts written in extension commands (kept in step with <code>C112</code> and <code>t198</code>).</td></tr>
  <tr><td>SCC, chip extension</td><td><code>?WD</code> waves, <code>?EP</code> envelopes, <code>?MV</code> vibrato, <code>?DB</code> chorus, <code>?FD</code> phrases, <code>?FB</code> repeats, <code>?FJ</code> loops.</td></tr>
  <tr><td>MSX PSG, chip extension</td><td>A drum part made of <code>?XD</code> effects.</td></tr>
  <tr><td>MSX-MUSIC, chip extension</td><td><code>@n</code> and <code>?IU</code> instruments, <code>?QP</code> gate, <code>?IS</code> sustain, <code>?ID</code> drums and <code>?IT</code> kits.</td></tr>
</table>
<p>The repository's <code>Samples/Muc/Templates</code> also has basics, templates for each chip, a drum library, accompaniments by genre, a collection of SCC waves, and finished demos (<i>Midnight Pier</i>, <i>Killer Coast Land OPNA Arrange</i>).</p>
`,
  },
  {
    id: 'playlist',
    title: 'Playlist',
    html: `
<p><b>☰ Playlist</b> opens a list of songs (<code>.muc</code>, <code>.mub</code>, <code>.vgm</code>, <code>.vgz</code>) on the right. Click a song to play it, ✕ to take it off the list, and <b>Clear</b> to empty the list. Drag the middle bar to change the width.</p>

<h3>Adding songs</h3>
<ul>
  <li><b>Drop them on the list</b>: They are only added at the end.</li>
  <li><b>Drop them anywhere else</b>: They are added and play at once (voice and PCM files dropped with them go along too).</li>
  <li><b>Drop a folder</b>: The playlist opens with every song in that folder.</li>
  <li><b>📂 in Samples</b>: Opens the songs of that repository folder. If the list already has songs, you are asked whether to make a <b>New playlist</b> or <b>Add at the end</b>.</li>
</ul>

<h3>Playing one after another</h3>
<p>With two songs or more, ⏮ ⏭ and the loop button turn on. In <b>Random</b> mode, another song follows at random each time a song ends. See <a href="#play">Playback</a> for details.</p>

<h3>Sharing a playlist</h3>
<p>A playlist made from one repository folder can be shared as a link with <b>🔗 Share</b> at the top of the playlist or the Share button in the header (<code>?playlist=VGMs/MSX_VampireKiller_Enhanced&amp;song=…</code>). Songs added to that folder later also appear when the link is opened.</p>
`,
  },
  {
    id: 'banks',
    title: 'Voice, wave and PCM banks and editors',
    html: `
<h3>FM bank</h3>
<p><b>🎛 FM bank</b> on the right opens the song's list of FM voices in the right-hand frame. The voices of the voice file (<code>#voice</code>) and the voices defined in the MUC are listed together, marked <code>DAT</code>, <code>MUC</code> and <code>MUC▸DAT</code> (when both have the same number, the MUC wins). Each shows its name, algorithm, feedback and how many times the song uses it.</p>
<table>
  <tr><th>Button</th><th>Key</th><th>What it does</th></tr>
  <tr><td>Add</td><td><kbd>Insert</kbd> <kbd>N</kbd></td><td>Adds Furnace's default voice at a free number</td></tr>
  <tr><td>Del</td><td><kbd>Delete</kbd></td><td>Deletes a voice (asks first if it is in use)</td></tr>
  <tr><td>Edit</td><td><kbd>Enter</kbd> <kbd>E</kbd></td><td>Opens the FM voice editor</td></tr>
  <tr><td>Name</td><td><kbd>F2</kbd> <kbd>R</kbd></td><td>Name of a voice in the file (6 characters)</td></tr>
  <tr><td>→DAT / →MUC</td><td><kbd>D</kbd> / <kbd>M</kbd></td><td>Moves an MUC voice into the file / copies a file voice into the MUC</td></tr>
  <tr><td>Import</td><td><kbd>I</kbd></td><td>Takes voices from <code>.dat</code>, <code>.muc</code>, <code>.mub</code>, <code>.vgm</code>/<code>.vgz</code> files (for VGM, the voice at each key-on)</td></tr>
  <tr><td>Load / Save</td><td><kbd>L</kbd> / <kbd>S</kbd></td><td>Uses a voice file / downloads it</td></tr>
  <tr><td>↶</td><td><kbd>U</kbd> <kbd>Ctrl+Z</kbd></td><td>Undoes a change to the file</td></tr>
  <tr><td>Listen / write @n</td><td><kbd>Space</kbd> / <kbd>@</kbd></td><td>Plays the voice / writes <code>@n</code> at the caret</td></tr>
</table>
<p>Pick several with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+click or <kbd>Shift</kbd>+click to delete or move them all at once. <kbd>F6</kbd> switches between the text and the bank, and <kbd>?</kbd> shows the list of keys. <b>To</b> sets whether voices you add or import go to the file or to the MUC.</p>

<h3>SCC bank</h3>
<p><b>〰 SCC bank</b> handles SCC waves (the <code>#sccvoice</code> file, and <code>@Wn:{…}</code> and <code>?WDn={…}</code> in the MUC) the same way. It shows a picture of each wave and its shape (sine, saw, square, pulse, triangle), and can import from <code>.dat</code> (SCWD), <code>.muc</code>, <code>.vgm</code>/<code>.vgz</code> and Furnace <code>.fur</code>/<code>.fuw</code>.</p>

<h3>PCM bank</h3>
<p><b>🥁 PCM bank</b> shows the samples <code>@1</code>–<code>@32</code> of the ADPCM part (<code>K</code>). It reads them from the PCM file (<code>#pcm</code>, <code>mucompcm.bin</code>) or from the <code>#@pcm</code> lines of the MUC, and shows each sample's wave, length, size and how many times it is used, and how much of the chip's memory (256 KB) is in use. Click a sample to hear it as the chip plays it. It can import from <code>.wav</code>, any sound the browser can read (mp3, ogg, flac and so on), PCM banks, <code>.mub</code> and <code>.vgm</code>/<code>.vgz</code>.</p>

<h3>FM voice editor</h3>
<p>Open it from an FM voice preview or with <b>Edit</b> in the FM bank. Modelled on Furnace's FM instrument editor, it has pictures of the 8 algorithms, OP1 feedback, and for each operator sliders for AR, DR (D1R), SL (D1L), D2R, RR, TL, KS, MULT and DT, with a picture of the envelope. It warns you when a carrier's TL is not 0. You can use <b>▶ Listen</b> (o1–o7, an approximate sound), copy and paste operators, <b>Init</b> and undo. <b>Apply</b>/<b>Done</b> write the voice back, keeping the original line layout and comments.</p>

<h3>SCC wave editor</h3>
<p>Open it with <b>✎ Edit</b> on a wave preview. Draw with the mouse or a finger, or build a wave on the <i>Shapes</i> tab (sine, triangle, saw, pulse, 16 harmonics) or the <i>FM</i> tab (4 operators), then polish it with <i>WaveTools</i> (offset, smooth, amplify, normalize, invert, reverse and more). You can also type the values in decimal or hex, and hear the wave in o2–o6 with <b>▶ Listen</b>. <b>Apply</b> writes it back as one <code>@Wn:{…}</code> line (<code>?WDn={…}</code> for a MucoMSX wave).</p>

<h3>PCM sample editor</h3>
<p>Open it with <b>Edit</b> in the PCM bank (in the style of Furnace's sample editor). Drag on the wave to select and zoom with the wheel, and use <b>Trim</b>, <b>Delete</b>, <b>Silence</b>, <b>Fade in / out</b>, <b>Normalize</b>, <b>Amplify %</b>, <b>Reverse</b>, <b>Invert</b>, <b>Remove DC</b> and <b>Resample to</b> (o1 c 16.1 kHz and so on). <b>▶ Listen</b> plays it at its own speed or at a chosen pitch; turn on <i>As the chip</i> to hear it encoded to ADPCM-B and decoded again.</p>
`,
  },
  {
    id: 'share',
    title: 'Share links',
    html: `
<p><b>🔗 Share</b> in the header makes a link that opens what is open now. There is no server, so the song travels inside the link itself, and nothing is uploaded.</p>

<h3>What is shared</h3>
<table>
  <tr><th>What is open now</th><th>Link</th></tr>
  <tr><td>A playlist made from a repository folder</td><td><code>?playlist=folder&amp;song=song</code></td></tr>
  <tr><td>A repository <code>.mub</code>/<code>.vgm</code> in the channel view</td><td><code>?sample=VGMs/…/song.vgz</code></td></tr>
  <tr><td>Your own <code>.mub</code>/<code>.vgm</code> in the channel view</td><td>The file goes inside the link, <code>#f=…</code> (up to 96 KB after packing)</td></tr>
  <tr><td>A repository sample you have not changed</td><td><code>?sample=Muc/…/song.muc</code></td></tr>
  <tr><td>A built-in example or template you have not changed</td><td><code>?ex=demo</code>, <code>?ex=template</code>, <code>?ex=extScc</code> …</td></tr>
  <tr><td>Any other song</td><td>The text is compressed and goes inside the link, <code>#s=…</code>. Attached files from the repository go by their path; your own small files (up to 24 KB in all) go inside the link.</td></tr>
</table>

<h3>What comes along</h3>
<ul>
  <li>If the tracker or the scope is open, <code>&amp;view=tracker</code> / <code>&amp;view=scope</code> is added, and the link opens the same view.</li>
  <li>A link made while the song is playing or paused gets <code>&amp;play=1</code> and starts playing as soon as it opens (the browser may ask for a first click). A link made while stopped only opens the song.</li>
</ul>
<p>The share window has the link and a <b>Copy</b> button (the system share sheet on phones), and tells you what the link holds. If it is over 8,000 characters, it warns that some messengers may cut the link.</p>

<h3>When you open a link</h3>
<p>When you open a link, the address is tidied up at once, and the song you were working on is kept aside. <b>Bring it back</b> in the notice at the top returns it, with its attached files.</p>
`,
  },
  {
    id: 'player',
    title: 'Player mode',
    html: `
<p><b>🎧 Player mode</b> in the header stops the song and shows <a href="https://toughkiddev.github.io/MDPlayer4Mac/MDPlayer4Web/">MDPlayer4Web</a> in place of the editor. It is the web version of MDPlayer4Mac and plays music files in many formats. Meanwhile the rest of the screen is dimmed and locked; press the button again to close the player and get the editor back as it was.</p>
`,
  },
  {
    id: 'keys',
    title: 'Keyboard shortcuts',
    html: `
<h3>Everywhere</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td><kbd>Ctrl+Enter</kbd></td><td>Play</td></tr>
  <tr><td><kbd>Ctrl+Shift+Enter</kbd></td><td>Play the caret's line (the selected lines)</td></tr>
  <tr><td><kbd>F8</kbd></td><td>Pause / Resume</td></tr>
  <tr><td><kbd>Esc</kbd></td><td>Stop (or close the suggestion list if it is open)</td></tr>
  <tr><td><kbd>Ctrl+S</kbd></td><td>Save .muc</td></tr>
  <tr><td><kbd>Ctrl+Space</kbd></td><td>Open the suggestions</td></tr>
  <tr><td><kbd>Tab</kbd> / <kbd>Enter</kbd></td><td>Insert a suggestion</td></tr>
  <tr><td><kbd>F6</kbd></td><td>Switch between text ↔ bank (when a bank is open)</td></tr>
</table>
<p>On a Mac, <kbd>⌘</kbd> also works in place of <kbd>Ctrl</kbd>.</p>

<h3>Tracker</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td>Arrow keys, <kbd>PgUp</kbd> <kbd>PgDn</kbd>, <kbd>Home</kbd> <kbd>End</kbd></td><td>Move</td></tr>
  <tr><td><kbd>Ctrl+↑</kbd> / <kbd>Ctrl+↓</kbd></td><td>Previous / next note of the part</td></tr>
  <tr><td><kbd>Enter</kbd> / <kbd>F2</kbd></td><td>Edit the cell</td></tr>
  <tr><td><kbd>Delete</kbd></td><td>Make it a rest</td></tr>
  <tr><td><kbd>1</kbd></td><td>Note off (OFF, tracker-style input)</td></tr>
  <tr><td>Numpad <kbd>/</kbd> <kbd>*</kbd></td><td>Octave down / up</td></tr>
  <tr><td><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd></td><td>Undo / redo</td></tr>
  <tr><td><kbd>?</kbd></td><td>List of keys</td></tr>
</table>

<h3>Keys (piano)</h3>
<p>After clicking the piano once: <kbd>Z S X D C V G B H N J M</kbd> lower octave, <kbd>Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P [ = ]</kbd> upper octave, <kbd>↑</kbd> <kbd>↓</kbd> change the octave.</p>
`,
  },
  {
    id: 'mobile',
    title: 'iPhone, iPad and browsers',
    html: `
<ul>
  <li>Sound starts with a tap (on the Play button, or anywhere when the notice appears).</li>
  <li>The page registers itself as a media player, so you hear sound even with the silent switch on or with the iPad in silent mode.</li>
  <li>The engine needs iOS/iPadOS 16.4 or later (WebAssembly SIMD and exception handling).</li>
  <li>Touches are handled separately, so buttons respond to a single tap even while a song plays.</li>
  <li>On a narrow screen, the right-hand frame moves below, and opening the tracker makes the editor area larger.</li>
  <li>When you open a folder with <b>Folder…</b>, Chrome and Edge remember it; Safari and Firefox ask you to pick it each time.</li>
</ul>
`,
  },
  {
    id: 'faq',
    title: 'Troubleshooting',
    html: `
<h3>There is no sound</h3>
<ul>
  <li>If you have just opened the page, click it once. Browsers block sound until the first click.</li>
  <li>Check that SSG/PSG parts have <code>@</code> (or <code>E</code>) and <code>v</code> (warnings PG01/PG02).</li>
  <li>Check that FM parts have a voice <code>@n</code> defined, and that the voice file is attached (PG03).</li>
  <li>Check the Volume slider and the channel faders in the channel view (OFF).</li>
</ul>

<h3>The song does not compile</h3>
<p>In <b>Compiler messages</b> on the right, click a red message to go to its line and see what it means and how to fix it. If the file of the <code>#pcm</code> tag is not attached, the song is not compiled (MSX19). Attach the file or remove the tag. Each code is explained in <a href="#messages">Part 3</a>.</p>

<h3>It plays without its voices or PCM</h3>
<p>The files the song uses are not attached. Open the song with <b>Folder…</b>, pick the song and its files together in <b>Open…</b>, or press <b>Find in folder</b> in the message.</p>

<h3>The sound breaks up</h3>
<p>If you see "Playback is catching up; this device renders slowly.", the device is struggling to make the sound in real time. Close other tabs and apps, and try closing views that draw a lot, such as the scope and the tracker. The VGM scope uses a little more processing.</p>

<h3>The samples list is out of date or empty</h3>
<p>The list is remembered for 10 minutes. Press <b>Refresh</b> in the Samples window. If the GitHub API limit (about 60 requests an hour) is reached, the list built into the page is used.</p>

<h3>Characters turned into ? in my saved .muc</h3>
<p>A <code>.muc</code> is saved in Shift-JIS, which cannot hold Korean and some other characters. Write comments in English or Japanese.</p>

<h3>My song disappeared after I opened a link</h3>
<p>It did not disappear; it is kept aside. Press <b>Bring it back</b> in the notice at the top.</p>
`,
  },
  {
    id: 'about',
    title: 'Credits and licenses',
    html: `
<p>MUCPlayground — Written by ToughkidCST. Source: <a href="https://github.com/ToughkidDev/MUCOMSX/tree/main/MUCPlayground">github.com/ToughkidDev/MUCOMSX</a></p>
<ul>
  <li><b>MDPlayer4Mac</b> (ToughkidCST): compiler, driver, chip emulators, channel view. GPL-3.0.</li>
  <li><b>MUCOM88</b> © Yuzo Koshiro. CC BY-NC-SA 4.0.</li>
  <li><b>mucomDotNET</b> (kuma4649), <b>MDSound</b>, <b>MDPlayer</b>.</li>
  <li><b>Furnace</b>: the model for the tracker and editor screens.</li>
</ul>
<p>The engine is MDPlayer4Mac built for WebAssembly, and it sounds the same as the desktop MDPlayer4Mac.</p>
`,
  },
];
