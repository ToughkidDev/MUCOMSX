// Parts that compile but cannot make a sound with MUCOM88's defaults. The compiler does
// not warn about these, so the page does:
//   SSG / MSX PSG (D E F, MSXD-F)  start with a silent envelope and volume 0: they need
//                                   @ (a preset) or E (an envelope), and v; or S
//                                   (the hardware envelope)
//   SCC (SCCA-E), MSX-MUSIC drums   start at volume 0: they need v
//   (MSXG)
// Only what comes before a part's first note counts; macros (*n) are followed.

const PART = /^((?:MSX)?[A-K][A-K0-9]*|SCC(?:[A-E][0-9]?)+)[ \t]/;
const MACRO = /^#\s*\*(\d+)\{([^}]*)\}/;

// The parts one part line writes to: 'D', 'MSXD', 'SCCA' … (page digits ignored).
function partsOf(name) {
  if (name.startsWith('SCC')) return [...name.slice(3).replace(/[0-9]/g, '')].map((l) => 'SCC' + l);
  if (name.startsWith('MSX')) return [...name.slice(3).replace(/[0-9]/g, '')].map((l) => 'MSX' + l);
  return [...name.replace(/[0-9]/g, '')];
}

function needs(part, ssgExtend) {
  if (/^(MSX)?[DEF]$/.test(part)) return part.startsWith('MSX') || !ssgExtend ? { env: true, vol: true } : null;
  if (part.startsWith('SCC') || part === 'MSXG') return { env: false, vol: true };
  return null;
}

// Shift-JIS byte column, the way compiler messages count it.
function byteColumn(line, index) {
  let b = 0;
  for (let i = 0; i < index; i++) {
    const c = line.charCodeAt(i);
    b += c < 0x80 || (c >= 0xff61 && c <= 0xff9f) ? 1 : 2;
  }
  return b + 1;
}

// Returns [{ part, row, col, missing: ['env' | 'vol', …] }].
export function silentParts(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const ssgExtend = /^#SSGExtend[ \t]+On\b/im.test(text);
  const macros = new Map();
  for (const line of lines) {
    const m = MACRO.exec(line);
    if (m) macros.set(m[1], m[2]);
  }
  const state = new Map();   // part -> { env, vol, done, need }
  const found = [];

  // Walks MML up to the first note and returns its index (or that of the macro call that
  // plays it), or -1. Flags in st what it passed on the way.
  const walk = (s, st, depth) => {
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      const digit = /\d/.test(s[i + 1] || '');
      if (c === ';') break;
      if (c === '?' && /[A-Z]{2}/.test(s.slice(i + 1, i + 3))) {
        // MucoMSX chip extensions: ?EP / ?EA / ?ET shape the level, like E.
        if (/^(EP|EA|ET)$/.test(s.slice(i + 1, i + 3))) st.env = true;
        i += 2;
        while (/[\d,\-$A-Fa-f]/.test(s[i + 1] || '') && !/[a-g]/.test(s[i + 1])) i++;
        continue;
      }
      if (c === '*' && digit) {
        const n = /^\d+/.exec(s.slice(i + 1))[0];
        if (depth < 8 && macros.has(n) && walk(macros.get(n), st, depth + 1) >= 0) return i;
        i += n.length;
      } else if ((c === '@' || c === 'E' || c === 'v' || c === 'S') && digit) {
        // S (hardware envelope) drives the level itself, so it stands for both.
        if (c !== 'v') st.env = true;
        if (c === 'v' || c === 'S') st.vol = true;
        while (/[\d,]/.test(s[i + 1] || '')) i++;
      } else if (c >= 'a' && c <= 'g') return i;
    }
    return -1;
  };

  lines.forEach((line, row) => {
    const m = PART.exec(line);
    if (!m) return;
    const body = line.slice(m[0].length);
    for (const part of partsOf(m[1])) {
      if (!state.has(part)) {
        const need = needs(part, ssgExtend);
        state.set(part, { env: false, vol: false, done: !need, need });
      }
      const st = state.get(part);
      if (st.done) continue;
      const at = walk(body, st, 0);
      if (at < 0) continue;
      st.done = true;
      const missing = [];
      if (st.need.env && !st.env) missing.push('env');
      if (st.need.vol && !st.vol) missing.push('vol');
      if (missing.length) found.push({ part, row: row + 1, col: byteColumn(line, m[0].length + at), missing });
    }
  });
  return found;
}
