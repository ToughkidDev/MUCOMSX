// SCC waveform preview: when the caret is on a wave definition, the editor shows the wave.
// The definitions are read the way MDPlayer4Mac's MSX compiler reads them:
//   SCC (a song with SCCA–SCCE parts, msPb0102): "  @Wn" then optional ":" or "=",
//     optional "{", 32 signed decimal samples (-128..127) separated by commas or spaces,
//     on one line or several, closed by "}" (or ending at the 32nd sample without braces)
//   #SSGExtend (D E F on SCC/SCC+): "  @Wn" alone, then rows of samples until there are
//     64; decimal -128..127 or $00-$FF. The player averages neighbours down to 32.
//   MucoMSX chip extension (msPb): "?WDn={…}" on its own line (leading blanks allowed),
//     32 samples -128..127 separated by commas, decimal or $hex, closed on the same line.
//     "?WSn,m" makes wave n a copy of wave m; "?WSn,m,1" loads wave m of the #sccvoice file.
// ";" starts a comment in all of them.

const HEAD = /^([ \t]+)@W(\d+)/;
const SCC_PART = /^SCC(?:[A-E][0-9]?)+[ \t]/m;
const GLOBAL = /^([ \t]*)\?WD[ \t]*(\d+)[ \t]*=[ \t]*\{/;
const SHARE = /^([ \t]*)\?WS[ \t]*(\d+)[ \t]*,[ \t]*(\d+)[ \t]*(,[ \t]*1[ \t]*)?$/;
const MAX_ROWS = 12;   // how far a definition is followed / searched for

// One sample: a number, or NaN when it is not one the compiler accepts.
function sample(token, ssg) {
  if (ssg && token.startsWith('$')) {
    const v = /^\$[0-9a-f]{1,2}$/i.test(token) ? parseInt(token.slice(1), 16) : NaN;
    return v > 127 ? v - 256 : v;
  }
  return /^-?\d+$/.test(token) ? Number(token) : NaN;
}

// Reads the definition that starts at 1-based row `head`. Returns its rows and samples.
function readDefinition(lines, head, scc) {
  const h = HEAD.exec(lines[head - 1]);
  let rest = lines[head - 1].slice(h[0].length);
  const values = [];
  let end = head, closed = false;
  if (scc) {
    rest = rest.replace(/^[ \t]*(?:[:=][ \t]*)?/, '');
    const braces = rest.startsWith('{');
    if (braces) rest = rest.slice(1);
    for (;;) {
      let text = rest.split(';')[0];
      const close = text.indexOf('}');
      if (close >= 0) { text = text.slice(0, close); closed = braces; }
      for (const token of text.split(/[,\s]+/).filter(Boolean)) values.push(sample(token, false));
      if (closed || (!braces && values.length >= 32) || values.length > 32) break;
      const next = lines[end];   // the line after `end`
      if (next === undefined || !/^[ \t]/.test(next) || HEAD.test(next) || end - head >= MAX_ROWS) break;
      end++;
      rest = next;
    }
    if (!braces) closed = values.length === 32;
  } else {
    while (values.length < 64) {
      const next = lines[end];
      if (next === undefined || !/^[ \t]/.test(next) || HEAD.test(next) || end - head >= MAX_ROWS) break;
      end++;
      for (const token of next.split(';')[0].split(',').map((s) => s.trim()).filter(Boolean)) values.push(sample(token, true));
    }
    closed = values.length === 64;
  }
  return { id: Number(h[2]), values, expected: scc ? 32 : 64, row: head, endRow: end, col: h[1].length, closed };
}

// A "?WDn={…}" line (MucoMSX): one row, the samples between the braces.
function readGlobal(lines, row) {
  const line = lines[row - 1];
  const h = GLOBAL.exec(line);
  let body = line.slice(h[0].length).split(';')[0];
  const close = body.indexOf('}');
  if (close >= 0) body = body.slice(0, close);
  const values = body.trim() === '' ? [] : body.split(',').map((s) => {
    const token = s.trim();
    const hex = /^([+-]?)\$([0-9a-f]+)$/i.exec(token);
    if (hex) return (hex[1] === '-' ? -1 : 1) * parseInt(hex[2], 16);
    return /^[+-]?\d+$/.test(token) ? Number(token) : NaN;
  });
  return { id: Number(h[2]), values, expected: 32, row, endRow: row, col: h[1].length, closed: close >= 0, form: 'wd' };
}

// The "?WDn={…}" definition of wave `id` in the song, or null.
export function globalWave(lines, id) {
  for (let i = 0; i < lines.length; i++) {
    const h = GLOBAL.exec(lines[i]);
    if (h && Number(h[2]) === id) return readGlobal(lines, i + 1);
  }
  return null;
}

// The wave definition the 1-based `row` belongs to, or null.
// { id, values, expected (32 or 64), row, endRow, col (index of @ or ?), closed, form }
// form: undefined for @Wn, 'wd' for ?WDn={…}, 'ws' for ?WSn,m[,1]; a 'ws' line has no
// values of its own: `source` names the wave it takes (`bank`: from the #sccvoice file).
export function waveAt(lines, row, text) {
  const own = lines[row - 1];
  if (own === undefined) return null;
  const code = own.split(';')[0];
  if (GLOBAL.test(code)) return readGlobal(lines, row);
  const share = SHARE.exec(code.replace(/[ \t]+$/, ''));
  if (share) {
    return { id: Number(share[2]), values: [], expected: 32, row, endRow: row, col: share[1].length, closed: true,
      form: 'ws', source: Number(share[3]), bank: !!share[4] };
  }
  const hasScc = SCC_PART.test(text);
  const ssgExtend = /^#SSGExtend[ \t]+On\b/im.test(text);
  for (let head = row; head >= Math.max(1, row - MAX_ROWS); head--) {
    const line = lines[head - 1];
    if (HEAD.test(line)) {
      const after = line.slice(HEAD.exec(line)[0].length);
      // Which form: the song decides; without SCC parts or #SSGExtend, the line's own shape.
      const scc = hasScc || (!ssgExtend && /^[ \t]*[:={]|^[ \t]*-?\d/.test(after));
      const def = readDefinition(lines, head, scc);
      return row <= def.endRow ? def : null;
    }
    // Only continuation rows (indented) can lie between the caret and the @W line.
    if (!/^[ \t]/.test(line)) return null;
  }
  return null;
}

// Draws the wave as the chip plays it: each sample held for its step, filled to zero.
// Values outside -128..127 (or unreadable) are drawn in the error colour.
export function drawWave(canvas, values, expected, colors) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const pad = 6, top = pad, bottom = h - pad, mid = (top + bottom) / 2;
  const y = (v) => mid - (Math.max(-128, Math.min(127, v)) / 128) * (bottom - top) / 2;
  // Grid: ±64 and the limits, and a mark every 8 samples.
  g.strokeStyle = colors.grid;
  g.lineWidth = 1;
  g.setLineDash([2, 3]);
  for (const v of [-128, -64, 64, 127]) { g.beginPath(); g.moveTo(0, Math.round(y(v)) + .5); g.lineTo(w, Math.round(y(v)) + .5); g.stroke(); }
  const step = w / expected;
  for (let i = 8; i < expected; i += 8) { g.beginPath(); g.moveTo(Math.round(i * step) + .5, top); g.lineTo(Math.round(i * step) + .5, bottom); g.stroke(); }
  g.setLineDash([]);
  g.strokeStyle = colors.axis;
  g.beginPath(); g.moveTo(0, Math.round(mid) + .5); g.lineTo(w, Math.round(mid) + .5); g.stroke();
  const shown = values.slice(0, expected);
  shown.forEach((v, i) => {
    const bad = !Number.isFinite(v) || v < -128 || v > 127;
    const x0 = i * step, x1 = (i + 1) * step;
    const vy = Number.isFinite(v) ? y(v) : mid;
    g.fillStyle = bad ? colors.badFill : colors.fill;
    g.fillRect(x0, Math.min(vy, mid), x1 - x0, Math.max(1, Math.abs(vy - mid)));
    g.strokeStyle = bad ? colors.bad : colors.line;
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0, vy); g.lineTo(x1, vy); g.stroke();
    // The edge up or down to the next sample, so the shape reads as one line.
    const next = shown[i + 1];
    if (Number.isFinite(v) && Number.isFinite(next)) {
      g.strokeStyle = colors.line;
      g.beginPath(); g.moveTo(x1, vy); g.lineTo(x1, y(next)); g.stroke();
    }
  });
}
