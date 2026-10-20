// Playing one line (or a few): the song is rewritten so that only those rows make sound.
//   rows before them   keep their commands (voice, volume, octave, length, tempo …) and
//                      lose their notes, rests, ties, loops and loop points, so the
//                      selected rows start with the settings they have in the song
//   the selected rows  stay as they are, except L and repeat marks without their partner
//                      (a loop that starts or ends outside the rows), which become spaces
//   rows after them    keep only the part name
// Every row stays where it is (and its columns too), so the playing position is shown on
// the editor's own text. Other lines (tags, voices, macros, waves) are kept.

const PART = /^([ \t]*)((?:MSX)?(?:[A-V][0-9]*)+|SCC(?:[A-E][0-9]?)+)(?=[ \t])/;
const MACRO = /^#\s*\*(\d+)\{([^}]*)\}/;

// The part line a row holds: { head (indent and name), name, body }, or null.
export function partLine(line) {
  const m = PART.exec(line || '');
  return m ? { head: m[0], name: m[2], body: line.slice(m[0].length) } : null;
}

// Whether a part line has anything that takes time (a note, rest or macro call).
export function playsSomething(line) {
  const p = partLine(line);
  return !!p && /[a-gr]|\*\d/.test(p.body.split(';')[0]);
}

// MML without what makes sound or takes time; macro calls are expanded the same way.
function commandsOnly(body, macros, depth = 0) {
  let out = '';
  let i = 0;
  const length = () => {
    if (body[i] === '%') i++;
    while (/[0-9.]/.test(body[i] || '')) i++;
  };
  while (i < body.length) {
    const c = body[i];
    if (c === ';') break;
    if (/[a-gr]/.test(c)) {
      i++;
      while (/[+\-#]/.test(body[i] || '')) i++;
      length();
    } else if (c === '^') { i++; length(); }
    else if (c === '{') {
      const close = body.indexOf('}', i);
      i = close < 0 ? body.length : close + 1;
      length();
    } else if (c === ']') { i++; while (/[0-9]/.test(body[i] || '')) i++; }
    else if (c === '&' || c === '|' || c === '[' || c === '/' || c === 'L') i++;
    else if (c === '*' && /\d/.test(body[i + 1] || '')) {
      const n = /^\d+/.exec(body.slice(i + 1))[0];
      i += 1 + n.length;
      if (depth < 8 && macros.has(n)) out += ' ' + commandsOnly(macros.get(n), macros, depth + 1) + ' ';
    } else { out += c; i++; }
  }
  return out.replace(/\s+/g, ' ').trim();
}

// The song rewritten to play rows `from`..`to` (1-based, inclusive).
export function lineSnippet(text, from, to) {
  const lines = text.split('\n');
  const macros = new Map();
  for (const line of lines) {
    const m = MACRO.exec(line);
    if (m) macros.set(m[1], m[2]);
  }
  // Repeat marks in the selected rows, per part, to find the ones without a partner.
  const marks = new Map();   // part name -> [{ row, i, kind }]
  const out = lines.map((line, k) => {
    const row = k + 1;
    const p = partLine(line);
    if (!p) return line;
    if (row < from) {
      const kept = commandsOnly(p.body, macros);
      return `${p.head} ${kept}`;   // a part name needs a space after it
    }
    if (row > to) return `${p.head} `;
    const list = marks.get(p.name) || [];
    marks.set(p.name, list);
    const body = p.body;
    for (let i = 0; i < body.length && body[i] !== ';'; i++) {
      if (body[i] === '{') { const close = body.indexOf('}', i); if (close > 0) i = close; continue; }
      if ('[]/L'.includes(body[i])) list.push({ row, i: p.head.length + i, kind: body[i] });
    }
    return line;
  });
  const blank = (row, i, n = 1) => {
    const s = out[row - 1];
    out[row - 1] = s.slice(0, i) + ' '.repeat(n) + s.slice(i + n);
  };
  for (const list of marks.values()) {
    const open = [];
    for (const m of list) {
      if (m.kind === 'L') blank(m.row, m.i);
      else if (m.kind === '[') open.push(m);
      else if (m.kind === '/') { if (!open.length) blank(m.row, m.i); }
      else if (open.length) open.pop();
      else {
        // "]n" with no "[" before it: the count goes too.
        const digits = /^\]\d*/.exec(out[m.row - 1].slice(m.i))[0].length;
        blank(m.row, m.i, digits);
      }
    }
    for (const m of open) blank(m.row, m.i);
  }
  return out.join('\n');
}
