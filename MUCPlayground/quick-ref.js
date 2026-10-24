// The side panel's quick reference: every entry of the MML guide (manual-data.js) as one
// short row, grouped by book and chapter. The row for the command at the editor's caret
// (manual-lookup.js) is marked, scrolled into view inside the list and opened up to show
// its form; clicking a row opens that entry in manual mode.
import { BOOKS } from './manual-data.js';
import { keyOf, findEntry } from './manual.js';

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pick = (o, lang) => (o ? o[lang] || o.en : '');
const UI = {
  en: { filter: 'Filter…', open: 'Click: open it in the manual' },
  ko: { filter: '거르기…', open: '클릭: 설명서에서 열기' },
  ja: { filter: '絞り込み…', open: 'クリック: 説明書で開く' },
};

export class QuickRef {
  // opts: { lang, onOpen(target) }
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.lang = opts.lang || 'en';
    this.current = null;    // { book, key } of the marked row
    root.innerHTML = '<input type="search" class="qr-filter" spellcheck="false" autocomplete="off"><div class="qr-list" tabindex="0"></div>';
    this.list = root.querySelector('.qr-list');
    this.filter = root.querySelector('.qr-filter');
    this.filter.addEventListener('input', () => this.applyFilter());
    this.list.addEventListener('click', (e) => {
      const row = e.target.closest('.qr-row');
      if (!row) return;
      const [book, c, on] = row.dataset.ref.split('|');
      opts.onOpen?.({ book, c, on: on || undefined });
    });
    this.render();
  }

  setLang(lang) { this.lang = lang; this.render(); }

  render() {
    const ui = UI[this.lang] || UI.en;
    this.filter.placeholder = ui.filter;
    let html = '';
    for (const [key, book] of Object.entries(BOOKS)) {
      html += `<h3 class="qr-book">${esc(pick(book.t, this.lang))}</h3>`;
      for (const s of book.sections) {
        html += `<p class="qr-sec">${esc(pick(s.t, this.lang))}</p>`;
        for (const e of s.e) {
          const on = (e.on || '').split(' ').filter(Boolean)[0] || '';
          html += `<div class="qr-row" data-book="${key}" data-key="${esc(keyOf(e))}" data-ref="${esc(`${key}|${e.c}|${on}`)}" title="${esc(`${e.s}\n${pick(e.d, this.lang)}\n\n${ui.open}`)}">` +
            `<code>${esc(e.c)}</code><span class="qr-t">${esc(pick(e.t, this.lang))}</span><pre class="qr-s">${esc(e.s)}</pre></div>`;
        }
      }
    }
    this.list.innerHTML = html;
    this.applyFilter();
    if (this.current) this.mark(this.current, false);
  }

  applyFilter() {
    const q = this.filter.value.trim().toLowerCase();
    for (const row of this.list.querySelectorAll('.qr-row')) {
      row.hidden = !!q && !row.textContent.toLowerCase().includes(q) && !row.title.toLowerCase().includes(q);
    }
    // Headings with nothing left under them go too.
    for (const h of this.list.querySelectorAll('.qr-sec, .qr-book')) {
      let n = h.nextElementSibling, any = false;
      while (n && !(h.classList.contains('qr-sec') ? n.matches('.qr-sec, .qr-book') : n.matches('.qr-book'))) {
        if (n.matches('.qr-row') && !n.hidden) { any = true; break; }
        n = n.nextElementSibling;
      }
      h.hidden = !any;
    }
  }

  // The caret's command (or null: nothing changes).
  point(target) {
    if (!target) return;
    const entry = findEntry(target);
    if (!entry) return;
    const cur = { book: target.book, key: keyOf(entry) };
    if (this.current && this.current.book === cur.book && this.current.key === cur.key) return;
    this.mark(cur, true);
  }

  mark(cur, scroll) {
    this.current = cur;
    this.list.querySelectorAll('.qr-row.on').forEach((r) => r.classList.remove('on'));
    const row = this.list.querySelector(`.qr-row[data-book="${cur.book}"][data-key="${CSS.escape(cur.key)}"]`);
    if (!row) return;
    row.classList.add('on');
    if (!scroll || row.hidden) return;
    // Scroll the list only, never the page.
    const top = row.offsetTop, bottom = top + row.offsetHeight;
    if (top < this.list.scrollTop || bottom > this.list.scrollTop + this.list.clientHeight) {
      this.list.scrollTop = Math.max(0, top - this.list.clientHeight / 3);
    }
  }
}
