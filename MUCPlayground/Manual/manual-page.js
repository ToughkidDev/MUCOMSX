// The MUCPlayground user's guide (Manual/index.html). Three parts:
//   1. the guide: chapters written for this page, one file per language (guide.ko.js,
//      guide.en.js, guide.ja.js), with MML examples from examples.js
//   2. the MML reference: the three books of the playground's own manual mode
//      (../manual-data.js), so it is always the same as in the app
//   3. the compiler and playground messages with their explanations (../diagnostics.js)
// The language follows ?lang=, else the playground's own setting (same site), else the
// browser's. Every example has "Open in MUCPlayground" (a share link holding it) and Copy.
import { BOOKS } from '../manual-data.js';
import { highlightLine } from '../editor-assist.js';
import { MESSAGE_HINTS } from '../diagnostics.js';
import { encodeSong } from '../share.js';
import { EXAMPLES } from './examples.js';

const LANGS = ['ko', 'en', 'ja'];
const UI = {
  title: { ko: '사용 설명서', en: "User's guide", ja: 'ユーザーガイド' },
  search: { ko: '설명서 검색 (예: 루프, 트래커, @W)', en: 'Search the guide (e.g. loop, tracker, @W)', ja: 'ガイドを検索（例: ループ、トラッカー、@W）' },
  contents: { ko: '목차', en: 'Contents', ja: '目次' },
  partGuide: { ko: '1부 · 사용 안내', en: 'Part 1 · Using MUCPlayground', ja: '第1部 · 使い方' },
  partRef: { ko: '2부 · MML 문법 레퍼런스', en: 'Part 2 · MML reference', ja: '第2部 · MML文法リファレンス' },
  partMsg: { ko: '3부 · 메시지 설명', en: 'Part 3 · Messages', ja: '第3部 · メッセージの説明' },
  refLead: {
    ko: 'MUCPlayground의 📖 문법 가이드(매뉴얼 모드)와 같은 내용입니다. 모든 예제는 컴파일되며, ▶ 버튼으로 MUCPlayground에서 바로 열어 들어 볼 수 있습니다.',
    en: 'The same as MUCPlayground\'s 📖 Manual mode. Every example compiles; ▶ opens it in MUCPlayground to hear it.',
    ja: 'MUCPlaygroundの📖マニュアルモードと同じ内容です。すべての例はコンパイルでき、▶でMUCPlaygroundに開いて聴けます。',
  },
  msgLead: {
    ko: '편집기 오른쪽 "컴파일 메시지"에 나오는 코드입니다. E는 오류(컴파일되지 않음), W는 경고(컴파일은 됨), PG는 MUCPlayground 자체 검사, MSX는 MucoMSX와 같은 기준으로 거부하는 경우입니다. 여기에 없는 메시지도 앱에서는 명령의 올바른 형식과 함께 설명됩니다.',
    en: 'The codes in the editor\'s "Compiler messages". E is an error (nothing is compiled), W a warning (the song compiles), PG a check of MUCPlayground itself, MSX a source refused the way MucoMSX refuses it. Messages not listed here are explained in the app too, with the command\'s correct form.',
    ja: 'エディタ右の「コンパイルメッセージ」に出るコードです。Eはエラー（コンパイルされない）、Wは警告（コンパイルはされる）、PGはMUCPlayground自身のチェック、MSXはMucoMSXと同じ基準で拒否される場合です。ここにないメッセージもアプリではコマンドの正しい形と一緒に説明されます。',
  },
  code: { ko: '코드', en: 'Code', ja: 'コード' },
  what: { ko: '무슨 뜻', en: 'What it means', ja: '意味' },
  fix: { ko: '고치는 법', en: 'How to fix it', ja: '直し方' },
  open: { ko: '▶ MUCPlayground에서 열기', en: '▶ Open in MUCPlayground', ja: '▶ MUCPlaygroundで開く' },
  copy: { ko: '복사', en: 'Copy', ja: 'コピー' },
  copied: { ko: '복사됨', en: 'Copied', ja: 'コピーしました' },
  hits: { ko: (n) => `${n}개 항목`, en: (n) => `${n} matching`, ja: (n) => `${n}件` },
  none: { ko: '찾는 내용이 없습니다.', en: 'Nothing matches.', ja: '見つかりません。' },
  on: { ko: '적용', en: 'On', ja: '対象' },
  form: { ko: '형식', en: 'Form', ja: '形式' },
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STORE = 'mucplayground.lang';

function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem(STORE); if (LANGS.includes(s)) return s; } catch { /* none */ }
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGS.includes(nav) ? nav : 'en';
}
let lang = pickLang();
const u = (key, ...args) => { const v = UI[key][lang] ?? UI[key].en; return typeof v === 'function' ? v(...args) : v; };
const pick = (o) => (o ? o[lang] ?? o.en ?? '' : '');

// ---------- examples ----------
const codes = [];   // the example texts, by data-i
function exampleBox(text, name = 'EXAMPLE.MUC') {
  const i = codes.push({ text, name }) - 1;
  const lines = text.split('\n').map((l) => highlightLine(l) || ' ').join('\n');
  return `<div class="ex"><pre>${lines}</pre><div class="bar"><button type="button" class="btn" data-copy="${i}">${u('copy')}</button><button type="button" class="btn" data-open="${i}">${u('open')}</button></div></div>`;
}

// ---------- rendering ----------
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let guide = [];
async function loadGuide() {
  try { guide = (await import(`./guide.${lang}.js`)).default; }
  catch { guide = (await import('./guide.en.js')).default; }
}

function render() {
  codes.length = 0;
  document.documentElement.lang = lang;
  document.title = `MUCPlayground — ${u('title')}`;
  $('docTitle').textContent = u('title');
  $('search').placeholder = u('search');
  $('menuLabel').textContent = u('contents');
  $('openApp').href = `../?lang=${lang}`;
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  const toc = [`<div class="part">${esc(u('partGuide'))}</div>`];
  const out = [`<h1 class="part-title" id="part-guide">${esc(u('partGuide'))}</h1>`];
  // 1. the guide
  for (const ch of guide) {
    toc.push(`<a href="#${ch.id}" data-for="${ch.id}">${esc(ch.title)}</a>`);
    // h3 headings get ids (and a place in the contents)
    let k = 0;
    const html = ch.html
      .replace(/<pre data-ex="([\w-]+)"><\/pre>/g, (m, id) => (EXAMPLES[id] ? exampleBox(EXAMPLES[id], `${id.toUpperCase()}.MUC`) : m))
      .replace(/<h3>(.*?)<\/h3>/g, (m, text) => {
        const id = `${ch.id}-${++k}`;
        toc.push(`<a class="sub" href="#${id}" data-for="${id}">${text.replace(/<[^>]+>/g, '')}</a>`);
        return `<h3 id="${id}">${text}</h3>`;
      });
    out.push(`<section class="chapter" id="${ch.id}"><h2>${esc(ch.title)}</h2>${html}</section>`);
  }
  // 2. the MML reference
  toc.push(`<div class="part">${esc(u('partRef'))}</div>`);
  out.push(`<h1 class="part-title" id="part-ref">${esc(u('partRef'))}</h1><p class="part-lead">${esc(u('refLead'))}</p>`);
  for (const [bookId, book] of Object.entries(BOOKS)) {
    const bid = `ref-${bookId}`;
    toc.push(`<a href="#${bid}" data-for="${bid}">${esc(pick(book.t))}</a>`);
    const parts = [`<section class="chapter book" id="${bid}"><h2>${esc(pick(book.t))}</h2><p class="book-lead">${esc(pick(book.d))}</p>`];
    for (const sec of book.sections) {
      const sid = `${bid}-${slug(sec.id)}`;
      toc.push(`<a class="sub" href="#${sid}" data-for="${sid}">${esc(pick(sec.t))}</a>`);
      parts.push(`<h3 id="${sid}">${esc(pick(sec.t))}</h3>`);
      if (sec.d) parts.push(`<p>${esc(pick(sec.d))}</p>`);
      for (const e of sec.e || []) {
        const chips = e.on ? `<span class="chips" title="${esc(u('on'))}">${e.on.split(/\s+/).map((c) => `<span>${esc(c)}</span>`).join('')}</span>` : '';
        parts.push(`<div class="entry"><div class="head"><span class="badge">${esc(e.c)}</span><span class="title">${esc(pick(e.t))}</span>${chips}</div>`
          + (e.s ? `<div class="form">${esc(u('form'))}: ${esc(e.s)}</div>` : '')
          + (e.d ? `<p>${esc(pick(e.d))}</p>` : '')
          + (e.n ? `<p class="n">${esc(pick(e.n))}</p>` : '')
          + (e.x ? exampleBox(e.x, `${slug(e.c) || 'EXAMPLE'}.MUC`.toUpperCase()) : '')
          + '</div>');
      }
    }
    parts.push('</section>');
    out.push(parts.join(''));
  }
  // 3. messages
  toc.push(`<div class="part">${esc(u('partMsg'))}</div>`);
  toc.push(`<a href="#messages" data-for="messages">${esc(u('partMsg').replace(/^.*·\s*/, ''))}</a>`);
  const rows = Object.entries(MESSAGE_HINTS)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([code, h]) => `<tr><td>${esc(code)}</td><td>${esc(pick(h.what))}</td><td>${esc(pick(h.fix))}</td></tr>`).join('');
  out.push(`<h1 class="part-title" id="part-msg">${esc(u('partMsg'))}</h1><section class="chapter" id="messages"><p class="part-lead">${esc(u('msgLead'))}</p>`
    + `<table class="msg"><thead><tr><th>${esc(u('code'))}</th><th>${esc(u('what'))}</th><th>${esc(u('fix'))}</th></tr></thead><tbody>${rows}</tbody></table></section>`);
  $('toc').innerHTML = `<div class="part">${esc(u('contents'))}</div>` + toc.join('');
  $('doc').innerHTML = `<p class="hits hidden" id="hits"></p>` + out.join('');
  pristine = $('doc').innerHTML;
  watchHeadings();
  if ($('search').value.trim()) search();
}

// ---------- search ----------
// Units: a guide chapter's parts between h3 headings, a reference entry, a message row.
let pristine = '';
function units() {
  const list = [];
  for (const sec of $('doc').querySelectorAll('section.chapter')) {
    if (sec.classList.contains('book')) {
      for (const e of sec.querySelectorAll('.entry')) list.push({ els: [e], sec });
      continue;
    }
    if (sec.id === 'messages') { for (const r of sec.querySelectorAll('tbody tr')) list.push({ els: [r], sec }); continue; }
    let cur = { els: [], sec };
    for (const el of sec.children) {
      if (el.tagName === 'H2') continue;
      if (el.tagName === 'H3' && cur.els.length) { list.push(cur); cur = { els: [], sec }; }
      cur.els.push(el);
    }
    if (cur.els.length) list.push(cur);
  }
  return list;
}
function markText(root, words) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
  for (const n of nodes) {
    if (!re.test(n.data) || n.parentElement.closest('button')) continue;
    re.lastIndex = 0;
    const span = document.createElement('span');
    span.innerHTML = esc(n.data).replace(re, (m) => `<mark>${m}</mark>`);
    n.replaceWith(...span.childNodes);
  }
}
function search() {
  const q = $('search').value.trim().toLowerCase();
  $('doc').innerHTML = pristine;
  watchHeadings();
  if (!q) return;
  const words = q.split(/\s+/).filter(Boolean);
  let n = 0;
  for (const unit of units()) {
    const text = unit.els.map((e) => e.textContent).join(' ').toLowerCase();
    const ok = words.every((w) => text.includes(w));
    for (const e of unit.els) { e.classList.toggle('hidden', !ok); if (ok) markText(e, words); }
    if (ok) n++;
  }
  // headings of chapters / sections with nothing left are hidden too
  for (const sec of $('doc').querySelectorAll('section.chapter')) {
    const any = [...sec.querySelectorAll('.entry, tbody tr, :scope > *:not(h2)')].some((e) => !e.classList.contains('hidden') && e.tagName !== 'H3');
    sec.classList.toggle('hidden', !any);
    if (sec.classList.contains('book')) {
      for (const h of sec.querySelectorAll('h3')) {
        let el = h.nextElementSibling, vis = false;
        while (el && el.tagName !== 'H3') { if (el.classList.contains('entry') && !el.classList.contains('hidden')) vis = true; if (el.tagName === 'P' && !el.classList.contains('entry')) el.classList.toggle('hidden', true); el = el.nextElementSibling; }
        h.classList.toggle('hidden', !vis);
      }
    }
  }
  document.querySelectorAll('.part-title, .part-lead').forEach((e) => e.classList.add('hidden'));
  const hits = $('hits');
  hits.classList.remove('hidden');
  hits.textContent = n ? u('hits', n) : u('none');
  window.scrollTo({ top: 0 });
}
let searchTimer = 0;
$('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(search, 180); });

// ---------- contents: the heading being read ----------
let observer = null;
function watchHeadings() {
  observer?.disconnect();
  const links = new Map([...$('toc').querySelectorAll('a[data-for]')].map((a) => [a.dataset.for, a]));
  observer = new IntersectionObserver((entries) => {
    const seen = entries.filter((e) => e.isIntersecting).map((e) => e.target.id || e.target.parentElement.id);
    if (!seen.length) return;
    const id = seen[0];
    for (const a of links.values()) a.classList.toggle('on', a.dataset.for === id);
    const a = links.get(id);
    if (a && window.innerWidth > 900) a.scrollIntoView({ block: 'nearest' });
  }, { rootMargin: '-70px 0px -70% 0px' });
  for (const h of $('doc').querySelectorAll('h2, h3[id]')) observer.observe(h.id ? h : h);
}

// ---------- buttons ----------
$('doc').addEventListener('click', async (e) => {
  const copy = e.target.closest('[data-copy]'), open = e.target.closest('[data-open]');
  if (copy) {
    const ex = codes[+copy.dataset.copy];
    try { await navigator.clipboard.writeText(ex.text); } catch { /* not allowed */ }
    copy.textContent = u('copied');
    setTimeout(() => { copy.textContent = u('copy'); }, 1500);
  } else if (open) {
    const ex = codes[+open.dataset.open];
    const w = window.open('', '_blank');   // in the click, so it is not blocked
    const payload = await encodeSong({ name: ex.name, text: ex.text });
    const url = `../?lang=${lang}#s=${payload}`;
    if (w) w.location = url; else location.href = url;
  }
});
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', async () => {
  if (b.dataset.lang === lang) return;
  const here = currentHeading();
  lang = b.dataset.lang;
  try { localStorage.setItem(STORE, lang); } catch { /* none */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
  await loadGuide();
  render();
  if (here) document.getElementById(here)?.scrollIntoView();
}));
function currentHeading() {
  const hs = [...$('doc').querySelectorAll('h2, h3[id]')];
  let id = null;
  for (const h of hs) { if (h.getBoundingClientRect().top < 120) id = h.id || h.parentElement.id; else break; }
  return id;
}
$('menuBtn').addEventListener('click', () => {
  const on = document.body.classList.toggle('toc-open');
  $('menuBtn').setAttribute('aria-expanded', String(on));
});
$('toc').addEventListener('click', (e) => {
  if (!e.target.closest('a')) return;
  document.body.classList.remove('toc-open');
  if ($('search').value) { $('search').value = ''; search(); }
});
window.addEventListener('scroll', () => { $('backTop').hidden = window.scrollY < 800; }, { passive: true });
$('backTop').addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

await loadGuide();
render();
if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
