// What the caret is on, as an entry of the MML guide (manual-data.js): the command or
// keyword under (or just before) the caret, read in the context of its line, so that @ on
// an FM part and @ on the rhythm part lead to different entries.
//   targetAt(lines, row, col) -> { book, c, on? } or null
// row is 1-based, col is the caret's index in the line (0 = before the first character).
import { voiceAt } from './fm-preview.js';
import { BOOKS } from './manual-data.js';

const T = (book, c, on) => ({ book, c, on });
const M88 = (c, on) => T('mucom88', c, on);
const EXT = (c, on) => T('ext', c, on);
const MSX = (c, on) => T('msx', c, on);
// The MucoMSX ? commands the msx book explains.
const MSX_ENTRIES = BOOKS.msx.sections.flatMap((s) => s.e);
const MSX_CMDS = new Set(MSX_ENTRIES.map((e) => e.c));

// MUCOM88 and the mucomDotNET extensions have no MSX channels, so on an MSX channel line
// (MSXA–MSXK, SCCA–SCCE, PSGS/SCCS/OPLS) every command is looked up in the msx book,
// which also covers the MUCOM88 commands those channels accept.
function msxChip(prefix) {
  if (/^SCC/.test(prefix)) return 'SCC';
  if (prefix === 'PSGS') return 'PSG';
  if (prefix === 'OPLS') return 'OPLL';
  const m = /^MSX([A-K])/.exec(prefix);
  if (!m) return null;
  return m[1] === 'G' ? 'MSXG' : 'DEF'.includes(m[1]) ? 'PSG' : 'OPLL';
}
// Entries of the other books under their msx-book names.
const MSX_ALIAS = { 'G @': '@', 'K @': '@', SCCA: '@', '@n': '@', 'G v': 'v', 'G vn': 'v', '> <': 'o', t: 'T', '%': 'c–b', '*n': '*', '**': '*' };
// OPNA-only commands, explained together as not available on MSX channels.
const MSX_NONE = new Set(['p', 'K', 's', 'V', 'H', 'R', 'y', 'J', '{ }', 'x', 'S', 'm', 'vm', 'KD', 'MT', 'EX', 'PO', '_', 'y0,', '@a,b', '@n=', 'p4–6', 'l%', '[| |]']);
function toMsx(t, chip) {
  if (!t || t.book === 'msx') return t;
  const c = MSX_ALIAS[t.c] || t.c;
  if (MSX_ENTRIES.some((e) => e.c === c && (!e.on || e.on.split(' ').includes(chip)))) return MSX(c, chip);
  if (MSX_NONE.has(t.c)) return MSX('p K s y', chip);
  return t;
}

const TAGS = {
  '#mucom88': M88('#mucom88'), '#title': M88('#title'), '#composer': M88('#composer'), '#author': M88('#composer'),
  '#date': M88('#composer'), '#comment': M88('#composer'), '#voice': M88('#voice'), '#pcm': M88('#pcm'),
  '#driver': EXT('#driver'), '#carriercorrection': EXT('#CarrierCorrection'), '#opna1rhythmmute': EXT('#OPNA1RhythmMute'),
  '#ssgextend': EXT('#SSGExtend'), '#pcminvert': EXT('#PCMInvert'), '#sccvoice': EXT('@W'),
};

// The kind of sound a part line drives.
function partKind(prefix) {
  if (prefix === 'PSGS') return 'ssg';
  if (prefix === 'OPLS') return 'fm';
  if (/^SCC/.test(prefix)) return 'scc';
  const msx = /^MSX/.test(prefix);
  const letter = prefix.replace(/^(MSX|SCC)/, '')[0];
  if (msx) return letter === 'G' ? 'rhythm' : 'DEF'.includes(letter) ? 'ssg' : 'fm';
  if (letter === 'G') return 'rhythm';
  if (letter === 'K') return 'pcm';
  if ('DEF'.includes(letter)) return 'ssg';
  return letter === 'C' ? 'fm3' : 'fm';
}

function partTarget(prefix) {
  if (/^(PSGS|SCCS|OPLS)$/.test(prefix)) return MSX('PSGS');
  const chip = msxChip(prefix);
  if (chip) return MSX({ PSG: 'MSXD', SCC: 'SCCA', OPLL: 'MSXA', MSXG: 'MSXG' }[chip], chip);
  if (/^SCC/.test(prefix)) return EXT('SCCA');
  if (/^MSX/.test(prefix)) {
    const kind = partKind(prefix);
    return kind === 'rhythm' ? EXT('MSXG') : kind === 'ssg' ? EXT('MSXD') : EXT('MSXA');
  }
  if (/\d/.test(prefix)) return EXT('A0–A9');
  return prefix.length > 1 ? M88('AB') : M88('A–K');
}

// The MML tokens of `s` (a part line's body, or a macro's), each { a, b, t }: [a, b) in
// s and its entry, already resolved for the part kind.
function tokens(s, kind) {
  const out = [];
  const fm = kind === 'fm' || kind === 'fm3';
  let i = 0;
  const push = (len, t) => { out.push({ a: i, b: i + len, t }); i += len; };
  while (i < s.length) {
    const r = s.slice(i);
    const ch = s[i];
    let m;
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === ';') { push(s.length - i, M88(';')); continue; }
    // MucoMSX ?XX commands (?EP2,129,115  ?MV0,$64  ?FD1=  ?EP-)
    if ((m = /^\?[A-Z]{2}/.exec(r))) {
      const op = /^(?:[-+]?(?:\$[0-9A-Fa-f]+|\d*)(?:,[-+]?(?:\$[0-9A-Fa-f]+|\d*))*)=?/.exec(s.slice(i + 3))[0];
      if (MSX_CMDS.has(m[0])) { push(3 + op.length, MSX(m[0])); continue; }
    }
    // a ? command still being typed, or a one-letter ? form: no entry (not the letter's)
    if ((m = /^\?[A-Za-z]{0,2}/.exec(r))) { push(m[0].length, null); continue; }
    if ((m = /^\[\||^\|\]/.exec(r))) { push(2, EXT('[| |]')); continue; }
    if (ch === '|') { push(1, M88('|')); continue; }
    if (ch === '[') { push(1, M88('[ ]')); continue; }
    if ((m = /^\]\d*/.exec(r))) { push(m[0].length, M88('[ ]')); continue; }
    if (ch === '/') { push(1, M88('/')); continue; }
    if (ch === '{' || ch === '}') { push(1, M88('{ }')); continue; }
    if (ch === '&') { push(1, M88('&')); continue; }
    if ((m = /^\^\d*\.*/.exec(r))) { push(m[0].length, M88('^')); continue; }
    if ((m = /^%\d*/.exec(r))) { push(m[0].length, M88('%')); continue; }
    if (ch === '>' || ch === '<') { push(1, M88('> <')); continue; }
    if ((m = /^[)(]\d*/.exec(r))) { push(m[0].length, M88(') (')); continue; }
    if ((m = /^\*\*-?\d*/.exec(r))) { push(m[0].length, EXT('**')); continue; }
    if ((m = /^\*\d*/.exec(r))) { push(m[0].length, Number(m[0].slice(1)) > 255 ? EXT('*n') : M88('*')); continue; }
    if ((m = /^__?/.exec(r))) { push(m[0].length, EXT('_')); continue; }
    if (ch === '!') { push(1, M88('!')); continue; }
    if (ch === 'L') { push(1, M88('L')); continue; }
    if (ch === 'J') { push(1, M88('J')); continue; }
    if (ch === '@') {
      if ((m = /^@\d+,\d+(?:,\d+){0,2}/.exec(r)) && fm) { push(m[0].length, EXT('@a,b')); continue; }
      if ((m = /^@\d+=[\d,]*/.exec(r))) { push(m[0].length, EXT('@n=')); continue; }
      if ((m = /^@[IW]\d*/.exec(r)) && kind === 'ssg') { push(m[0].length, EXT('#SSGExtend')); continue; }
      m = /^@\d*/.exec(r);
      push(m[0].length, kind === 'rhythm' ? M88('G @') : kind === 'pcm' ? M88('K @') : kind === 'scc' ? EXT('SCCA')
        : kind === 'ssg' ? M88('@', 'SSG') : M88('@', 'FM'));
      continue;
    }
    const arg = (re) => { const a = re.exec(s.slice(i + m[0].length)); return a ? a[0] : ''; };
    const NUM = /^[-+]?\$?[0-9A-Fa-f]*(?:,[-+]?\$?[0-9A-Fa-f]*)*/;
    // Commands of more than one letter first.
    if ((m = /^(EXON|EXOF|EX)/.exec(r)) && (kind === 'fm3' || kind === 'fm')) { push(m[0].length + arg(/^\d*/).length, EXT('EX')); continue; }
    if ((m = /^PO[SRL]?/.exec(r))) { push(m[0].length + arg(NUM).length, EXT('PO')); continue; }
    if ((m = /^(MF|MT|KD|vm|pm|pe|Rm|RF|l%)/.exec(r))) {
      const t = { MF: M88('M'), MT: EXT('MT'), KD: EXT('KD'), vm: kind === 'rhythm' ? EXT('G vn') : EXT('vm'), pm: EXT('G vn'),
        pe: EXT('#SSGExtend'), Rm: M88('R'), RF: M88('R'), 'l%': EXT('l%') }[m[1]];
      push(m[0].length + arg(NUM).length, t);
      continue;
    }
    if ((m = /^[a-gx][+\-#]?/.exec(r))) {
      push(m[0].length + arg(/^\d*\.*/).length, ch === 'x' ? EXT('x') : M88('c–b'));
      continue;
    }
    if ((m = /^r/.exec(r))) { push(1 + arg(/^\d*\.*/).length, M88('r')); continue; }
    if ((m = /^[TtCDKkVsqPwESmMHRyolvp]/.exec(r))) {
      const a = arg(NUM);
      let t;
      switch (ch) {
        case 'v': t = kind === 'rhythm' ? (a.includes(',') ? M88('G v') : EXT('G vn')) : M88('v'); break;
        case 'p': t = /^[456]/.test(a) ? EXT('p4–6') : M88('p'); break;
        case 'S': t = kind === 'ssg' ? EXT('S', 'SSG') : kind === 'fm3' && /^-?\d+(,-?\d+){3}$/.test(a) && a.split(',').some((x) => Math.abs(x) > 127) ? EXT('S', 'C') : M88('S'); break;
        case 'y': t = /^0,[^,]+,[^,]+,/.test(a) ? EXT('y0,') : M88('y'); break;
        case 'm': t = EXT('m'); break;
        case 'k': t = M88('K'); break;
        case 'E': t = M88('E'); break;
        default: t = M88(ch);
      }
      push(1 + a.length, t);
      continue;
    }
    i++;   // a character with no entry of its own
  }
  return out;
}

export function targetAt(lines, row, col) {
  const line = lines[row - 1];
  if (line === undefined) return null;
  // Tags, and a macro definition (its body is MML).
  if (line.startsWith('#')) {
    const mac = /^#\*(\d+)\{/.exec(line);
    if (mac) {
      if (col <= mac[0].length) return Number(mac[1]) > 255 ? EXT('*n') : M88('#*');
      return pick(tokens(line, 'fm'), col);
    }
    const tag = /^#\S*/.exec(line)[0].toLowerCase();
    return TAGS[tag] || null;
  }
  // MucoMSX global resources (?WD0={…}, ?IU0={…} …) and braced FM voices (@1:{…}).
  const res = /^\?(WD|WS|IU|IT|KT|IM)/.exec(line);
  if (res) return MSX(/^W/.test(res[1]) ? '?' + res[1] : `?${res[1]}=`);
  if (/^[ \t]+@%?\d+[ \t]*:[ \t]*\{/.test(line)) return MSX('@n:{ }');
  // FM voice and SCC wave definitions.
  if (/^[ \t]+@W\d/.test(line)) return EXT('@W');
  // (only on indented lines: a part line right below a voice is music)
  if (/^[ \t]/.test(line) && voiceAt(lines, row)) return M88('@n', 'FM');
  // Part lines: the part prefix, then MML.
  const p = /^((?:MSX|SCC)?[A-K][A-K0-9]*|PSGS|SCCS|OPLS)([ \t])/.exec(line) || /^(SCC(?:[A-E][0-9]?)+)([ \t])/.exec(line);
  if (!p) return null;
  if (col <= p[1].length) return partTarget(p[1]);
  const start = p[1].length;
  const t = pick(tokens(line.slice(start), partKind(p[1])), col - start);
  const chip = msxChip(p[1]);
  return chip ? toMsx(t, chip) : t;
}

// The token at the caret, or the one just before it (the caret usually sits after what
// was typed).
function pick(list, col) {
  let best = null;
  for (const k of list) {
    if (k.a < col && col <= k.b) best = k;          // inside it, or right after it
    else if (k.a === col && !best) best = k;        // right before it
  }
  return best ? best.t : null;
}
