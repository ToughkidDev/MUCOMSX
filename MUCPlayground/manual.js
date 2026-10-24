// Manual mode: the MML guide (manual-data.js) next to the editor. First choose the book,
// MUCOM88 or the mucomDotNET extensions; then jump to a chapter, or search both books.
// Each entry shows the command, its form, what it does, and an example drawn with the
// editor's colours that "Insert" puts into the song.
import { BOOKS } from './manual-data.js';
import { highlightLine } from './editor-assist.js';

const UI = {
  en: { search: 'Search commands…', insert: 'Insert', insertTip: 'Put this example into the editor (whole lines go below the caret\'s line)',
        size: 'Text', sizeTip: 'Text size of the manual\'s contents; the buttons above stay as they are (remembered in this browser; double-click for the default)', follow: 'Follow caret', followTip: 'Show the entry for the command at the editor\'s caret', none: 'Nothing found in this book.', other: (n, b) => `${n} in ${b}`, chapters: 'Chapters', results: (n) => `${n} found`, close: 'Close the manual', top: 'Top' },
  ko: { search: '명령 검색…', insert: '넣기', insertTip: '이 예제를 에디터에 넣기 (여러 줄 예제는 커서가 있는 줄 아래에)',
        size: '글자', sizeTip: '설명서 내용의 글자 크기, 위쪽 버튼들은 그대로 (이 브라우저에 기억됨, 더블클릭하면 기본값)', follow: '커서 따라가기', followTip: '에디터 커서 위치의 명령에 해당하는 항목을 보여 줍니다', none: '이 설명서에는 결과가 없습니다.', other: (n, b) => `${b}에 ${n}개`, chapters: '장', results: (n) => `${n}개 찾음`, close: '설명서 닫기', top: '맨 위' },
  ja: { search: 'コマンドを検索…', insert: '挿入', insertTip: 'この例をエディタに入れる(複数行の例はカーソル行の下に)',
        size: '文字', sizeTip: '説明書の内容の文字サイズ、上のボタンはそのまま（このブラウザに記憶、ダブルクリックで標準）', follow: 'カーソルに追従', followTip: 'エディタのカーソル位置のコマンドの項目を表示します', none: 'この説明書には見つかりません。', other: (n, b) => `${b}に${n}件`, chapters: '章', results: (n) => `${n}件`, close: '説明書を閉じる', top: '先頭' },
};

export const keyOf = (e) => e.c + '|' + (e.on || '');
export function findEntry(target) {
  const book = BOOKS[target.book];
  if (!book) return null;
  for (const s of book.sections) for (const e of s.e) {
    if (e.c === target.c && (!target.on || (e.on || '').split(' ').includes(target.on))) return e;
  }
  return null;
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pick = (o, lang) => (o ? o[lang] || o.en : '');

export class Manual {
  // opts: { lang, book, follow, fontSize, onInsert(text), onClose(), onBook(book), onFollow(on), onFontSize(px | null) }
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.lang = opts.lang || 'en';
    this.book = BOOKS[opts.book] ? opts.book : 'mucom88';
    this.query = '';
    this.follow = opts.follow !== false;
    this.focused = null;     // the entry last pointed at from the caret
    root.classList.add('manual');
    root.innerHTML = `
      <div class="man-head">
        <div class="man-books" role="tablist"></div>
        <button type="button" class="man-close" aria-label="">✕</button>
      </div>
      <div class="man-tools">
        <input type="search" class="man-search" spellcheck="false" autocomplete="off">
        <span class="man-count" aria-live="polite"></span>
        <label class="man-size"><span></span> <input type="range" min="10" max="24" step="0.5"> <output></output></label>
        <label class="man-follow"><input type="checkbox"> <span></span></label>
      </div>
      <nav class="man-nav"></nav>
      <div class="man-body" tabindex="0"></div>`;
    this.$ = (s) => root.querySelector(s);
    this.$('.man-close').addEventListener('click', () => opts.onClose?.());
    this.$('.man-search').addEventListener('input', (e) => { this.query = e.target.value.trim(); this.renderBody(); });
    this.$('.man-search').addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.query) { e.stopPropagation(); e.target.value = ''; this.query = ''; this.renderBody(); } });
    // Text size of the guide's contents.
    const size = this.$('.man-size input');
    size.addEventListener('input', () => this.setFontSize(Number(size.value), true));
    size.addEventListener('dblclick', () => this.setFontSize(null, true));
    this.setFontSize(opts.fontSize ?? null, false);
    this.$('.man-follow input').checked = this.follow;
    this.$('.man-follow input').addEventListener('change', (e) => {
      this.follow = e.target.checked;
      opts.onFollow?.(this.follow);
      if (!this.follow) this.clearFocus();
    });
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

  // px, or null for the page's default (which follows the Menus size).
  setFontSize(px, user) {
    const ok = Number.isFinite(px) && px >= 10 && px <= 24;
    // Only the guide's text (the entries) changes; the book buttons, tools and chapters stay.
    const body = this.$('.man-body');
    body.style.fontSize = ok ? `${px}px` : '';
    const shown = ok ? px : Math.round(parseFloat(getComputedStyle(body).fontSize) * 2) / 2 || 13.5;
    this.$('.man-size input').value = shown;
    this.$('.man-size output').textContent = shown.toFixed(1);
    if (user) this.opts.onFontSize?.(ok ? px : null);
  }

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
    this.$('.man-follow span').textContent = ui.follow;
    this.$('.man-size span').textContent = ui.size;
    this.$('.man-size').title = ui.sizeTip;
    this.$('.man-follow').title = ui.followTip;
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
    if (this.focused && this.focused.book === this.book) this.$(`.man-entry[data-key="${CSS.escape(this.focused.key)}"]`)?.classList.add('man-focus');
    this.markChapter();
  }

  // Show the entry the editor's caret is on (manual-lookup.js gives { book, c, on }).
  // Nothing happens with Follow caret off, or when the caret is on nothing known.
  // force: show it even with Follow caret off (a click in the quick reference).
  point(target, force = false) {
    if ((!this.follow && !force) || !target) return;
    const entry = findEntry(target);
    if (!entry) return;
    const key = keyOf(entry);
    if (this.focused && this.focused.book === target.book && this.focused.key === key) return;
    if (this.book !== target.book) {
      this.book = target.book;
      this.opts.onBook?.(target.book);
      this.query = ''; this.$('.man-search').value = '';
      this.focused = { book: target.book, key };
      this.render();
    } else {
      if (this.query) { this.query = ''; this.$('.man-search').value = ''; this.renderBody(); }
      this.focused = { book: target.book, key };
      this.root.querySelectorAll('.man-focus').forEach((el) => el.classList.remove('man-focus'));
    }
    const el = this.$(`.man-entry[data-key="${CSS.escape(key)}"]`);
    if (!el) return;
    el.classList.add('man-focus');
    // Bring it into view only when it is not already fully shown.
    const body = this.$('.man-body');
    const top = el.offsetTop, bottom = top + el.offsetHeight;
    if (top < body.scrollTop || bottom > body.scrollTop + body.clientHeight) {
      // a short way glides, a long way jumps (so it keeps up with typing)
      const to = Math.max(0, top - 8);
      body.scrollTo({ top: to, behavior: Math.abs(to - body.scrollTop) < body.clientHeight ? 'smooth' : 'auto' });
    }
  }

  clearFocus() {
    this.focused = null;
    this.root.querySelectorAll('.man-focus').forEach((el) => el.classList.remove('man-focus'));
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
    let h = `<article class="man-entry" data-key="${esc(keyOf(e))}"><header><code class="man-cmd">${esc(e.c)}</code><span class="man-title">${esc(pick(e.t, this.lang))}</span>${on}</header>`;
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
