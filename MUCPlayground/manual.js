// Manual mode: the MML guide (manual-data.js) next to the editor. First choose the book,
// MUCOM88 or the mucomDotNET extensions; then jump to a chapter, or search both books.
// Each entry shows the command, its form, what it does, and an example drawn with the
// editor's colours that "Insert" puts into the song.
import { BOOKS } from './manual-data.js';
import { highlightLine } from './editor-assist.js';

const UI = {
  en: { search: 'Search commands…', insert: 'Insert', insertTip: 'Put this example into the editor (whole lines go below the caret\'s line)',
        none: 'Nothing found in this book.', other: (n, b) => `${n} in ${b}`, chapters: 'Chapters', results: (n) => `${n} found`, close: 'Close the manual', top: 'Top' },
  ko: { search: '명령 검색…', insert: '넣기', insertTip: '이 예제를 에디터에 넣기 (여러 줄 예제는 커서가 있는 줄 아래에)',
        none: '이 설명서에는 결과가 없습니다.', other: (n, b) => `${b}에 ${n}개`, chapters: '장', results: (n) => `${n}개 찾음`, close: '설명서 닫기', top: '맨 위' },
  ja: { search: 'コマンドを検索…', insert: '挿入', insertTip: 'この例をエディタに入れる(複数行の例はカーソル行の下に)',
        none: 'この説明書には見つかりません。', other: (n, b) => `${b}に${n}件`, chapters: '章', results: (n) => `${n}件`, close: '説明書を閉じる', top: '先頭' },
};

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pick = (o, lang) => (o ? o[lang] || o.en : '');

export class Manual {
  // opts: { lang, book, onInsert(text), onClose(), onBook(book) }
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.lang = opts.lang || 'en';
    this.book = BOOKS[opts.book] ? opts.book : 'mucom88';
    this.query = '';
    root.classList.add('manual');
    root.innerHTML = `
      <div class="man-head">
        <div class="man-books" role="tablist"></div>
        <button type="button" class="man-close" aria-label="">✕</button>
      </div>
      <div class="man-tools">
        <input type="search" class="man-search" spellcheck="false" autocomplete="off">
        <span class="man-count" aria-live="polite"></span>
      </div>
      <nav class="man-nav"></nav>
      <div class="man-body" tabindex="0"></div>`;
    this.$ = (s) => root.querySelector(s);
    this.$('.man-close').addEventListener('click', () => opts.onClose?.());
    this.$('.man-search').addEventListener('input', (e) => { this.query = e.target.value.trim(); this.renderBody(); });
    this.$('.man-search').addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.query) { e.stopPropagation(); e.target.value = ''; this.query = ''; this.renderBody(); } });
    this.$('.man-books').addEventListener('click', (e) => {
      const b = e.target.closest('[data-book]');
      if (b) this.setBook(b.dataset.book);
    });
    this.$('.man-nav').addEventListener('click', (e) => {
      const a = e.target.closest('[data-sec]');
      if (!a) return;
      e.preventDefault();
      const target = this.$(`.man-sec[data-sec="${a.dataset.sec}"]`);
      if (target) this.$('.man-body').scrollTo({ top: target.offsetTop - 4, behavior: 'smooth' });
    });
    // The chapter being read is marked in the chapter bar.
    this.$('.man-body').addEventListener('scroll', () => this.markChapter());
    this.$('.man-body').addEventListener('click', (e) => {
      const b = e.target.closest('.man-insert');
      if (b) opts.onInsert?.(b.closest('.man-ex').dataset.text);
      const other = e.target.closest('[data-goto]');
      if (other) this.setBook(other.dataset.goto, true);
    });
    this.render();
  }

  setLang(lang) { this.lang = lang; this.render(); }

  // keepQuery: from a search hint, show the other book's results for the same words.
  setBook(book, keepQuery = false) {
    if (!BOOKS[book]) return;
    this.book = book;
    if (!keepQuery) { this.query = ''; this.$('.man-search').value = ''; }
    this.opts.onBook?.(book);
    this.render();
    this.$('.man-body').scrollTop = 0;
  }

  render() {
    const ui = UI[this.lang] || UI.en;
    this.$('.man-books').innerHTML = Object.entries(BOOKS).map(([key, b]) =>
      `<button type="button" role="tab" data-book="${key}" aria-selected="${key === this.book}">
         <b>${esc(pick(b.t, this.lang))}</b><span>${esc(pick(b.d, this.lang))}</span></button>`).join('');
    this.$('.man-close').setAttribute('aria-label', ui.close);
    this.$('.man-close').title = ui.close;
    this.$('.man-search').placeholder = ui.search;
    const book = BOOKS[this.book];
    this.$('.man-nav').innerHTML = book.sections.map((s) => `<a href="#" data-sec="${s.id}">${esc(pick(s.t, this.lang))}</a>`).join('');
    this.renderBody();
  }

  // Entries of a book that match the search (all of them without one).
  matches(book) {
    const q = this.query.toLowerCase();
    return book.sections.map((s) => ({
      s,
      e: !q ? s.e : s.e.filter((e) => [e.c, e.s, pick(e.t, this.lang), pick(e.d, this.lang), pick(e.n, this.lang), e.x || '', e.t.en, e.d.en]
        .some((v) => v && v.toLowerCase().includes(q))),
    })).filter((x) => x.e.length);
  }

  renderBody() {
    const ui = UI[this.lang] || UI.en;
    const book = BOOKS[this.book];
    const found = this.matches(book);
    const count = found.reduce((n, x) => n + x.e.length, 0);
    this.$('.man-nav').hidden = !!this.query;
    this.$('.man-count').textContent = this.query ? ui.results(count) : '';
    let html = '';
    if (!this.query) html += `<p class="man-intro">${esc(pick(book.d, this.lang))}</p>`;
    if (!found.length) {
      html += `<p class="man-none">${esc(ui.none)}</p>`;
    }
    for (const { s, e } of found) {
      html += `<section class="man-sec" data-sec="${s.id}"><h3>${esc(pick(s.t, this.lang))}</h3>`;
      if (s.d && !this.query) html += `<p class="man-sec-d">${esc(pick(s.d, this.lang))}</p>`;
      for (const entry of e) html += this.entryHtml(entry, ui);
      html += '</section>';
    }
    // The words may be in the other book.
    if (this.query) {
      for (const [key, b] of Object.entries(BOOKS)) {
        if (key === this.book) continue;
        const n = this.matches(b).reduce((k, x) => k + x.e.length, 0);
        if (n) html += `<p class="man-other"><button type="button" class="btn small" data-goto="${key}">${esc(ui.other(n, pick(b.t, this.lang)))} →</button></p>`;
      }
    }
    this.$('.man-body').innerHTML = html;
    this.markChapter();
  }

  markChapter() {
    const body = this.$('.man-body');
    let id = null;
    for (const sec of body.querySelectorAll('.man-sec')) if (sec.offsetTop - 12 <= body.scrollTop) id = sec.dataset.sec;
    if (!id) id = body.querySelector('.man-sec')?.dataset.sec;
    for (const a of this.$('.man-nav').querySelectorAll('a')) {
      const on = a.dataset.sec === id;
      if (on && a.getAttribute('aria-current') !== 'true') a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'true');
    }
  }

  entryHtml(e, ui) {
    const on = (e.on || '').split(' ').filter(Boolean).map((k) => `<span class="man-on">${esc(k)}</span>`).join('');
    let h = `<article class="man-entry"><header><code class="man-cmd">${esc(e.c)}</code><span class="man-title">${esc(pick(e.t, this.lang))}</span>${on}</header>`;
    h += `<pre class="man-syntax">${esc(e.s)}</pre>`;
    h += `<p class="man-d">${esc(pick(e.d, this.lang))}</p>`;
    if (e.n) h += `<p class="man-n">${esc(pick(e.n, this.lang))}</p>`;
    if (e.x) {
      h += `<div class="man-ex" data-text="${esc(e.x)}"><pre>${e.x.split('\n').map(highlightLine).join('\n')}</pre>` +
        `<button type="button" class="btn small man-insert" title="${esc(ui.insertTip)}">${esc(ui.insert)}</button></div>`;
    }
    return h + '</article>';
  }
}
