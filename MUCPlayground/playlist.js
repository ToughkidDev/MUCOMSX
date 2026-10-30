// The playlist: songs to play one after another, listed on the right of the editor and the
// channel view while playlist mode is on. An item is
//   { id, name, path, kind: 'muc' | 'mub' | 'vgm', load() -> Promise<ArrayBuffer>,
//     folder?, files?: [{ name, data }] }
// `folder` (local-folder.js) when it came from a dropped folder, so its voice / PCM files
// can be found there; `files`, the voice / PCM files dropped together with it.

let nextId = 1;

export class Playlist {
  // o: { t(key, ...args), onPlay(item), onChange() }
  constructor(root, o) {
    this.root = root;
    this.o = o;
    this.items = [];
    this.currentId = null;
    root.innerHTML = `
      <div class="pl-head">
        <b class="pl-title"></b>
        <span class="spacer"></span>
        <button type="button" class="btn small pl-clear"></button>
      </div>
      <p class="pl-hint"></p>
      <ol class="pl-list"></ol>`;
    this.list = root.querySelector('.pl-list');
    root.querySelector('.pl-clear').addEventListener('click', () => this.clear());
    this.list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const item = this.items.find((x) => x.id === +li.dataset.id);
      if (!item) return;
      if (e.target.closest('.pl-del')) this.remove(item);
      else this.o.onPlay(item);
    });
    // Arrow keys move between the songs; Delete takes one out.
    this.list.addEventListener('keydown', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const at = [...this.list.children].indexOf(li);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.list.children[Math.max(0, Math.min(this.items.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))]?.querySelector('.pl-item')?.focus();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.remove(this.items[at]);
        this.list.children[Math.min(at, this.items.length - 1)]?.querySelector('.pl-item')?.focus();
      }
    });
    // Dragging over the list shows that a drop there only adds.
    let depth = 0;
    root.addEventListener('dragenter', () => { depth++; root.classList.add('drop-here'); });
    root.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; root.classList.remove('drop-here'); } });
    root.addEventListener('drop', () => { depth = 0; root.classList.remove('drop-here'); });
    this.render();
  }

  static item(fields) { return { id: nextId++, ...fields }; }

  get current() { return this.items.find((x) => x.id === this.currentId) || null; }

  add(items) {
    this.items.push(...items);
    this.render();
    this.list.lastElementChild?.scrollIntoView({ block: 'nearest' });
    this.o.onChange?.();
  }

  remove(item) {
    if (!item) return;
    this.items = this.items.filter((x) => x !== item);
    if (this.currentId === item.id) this.currentId = null;
    this.render();
    this.o.onChange?.();
  }

  clear() {
    if (!this.items.length) return;
    this.items = [];
    this.currentId = null;
    this.render();
    this.o.onChange?.();
  }

  setCurrent(item) {
    this.currentId = item ? item.id : null;
    for (const li of this.list.children) {
      const on = +li.dataset.id === this.currentId;
      li.classList.toggle('current', on);
      li.querySelector('.pl-item').setAttribute('aria-current', on ? 'true' : 'false');
    }
    this.list.querySelector('li.current')?.scrollIntoView({ block: 'nearest' });
  }

  // Texts in the page's language (called again when it changes).
  render() {
    const t = this.o.t;
    this.root.querySelector('.pl-title').textContent = t('plTitle', this.items.length);
    const clear = this.root.querySelector('.pl-clear');
    clear.textContent = t('plClear');
    clear.title = t('plClearTip');
    clear.disabled = !this.items.length;
    const hint = this.root.querySelector('.pl-hint');
    hint.textContent = t('plHint');
    this.list.innerHTML = '';
    this.items.forEach((item, i) => {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      li.classList.toggle('current', item.id === this.currentId);
      li.innerHTML = '<button type="button" class="pl-item"><span class="pl-no"></span><span class="pl-text"><span class="pl-name"></span><small class="pl-dir"></small></span><span class="pl-ext"></span></button><button type="button" class="pl-del">✕</button>';
      const b = li.querySelector('.pl-item');
      b.title = item.path || item.name;
      b.setAttribute('aria-current', item.id === this.currentId ? 'true' : 'false');
      li.querySelector('.pl-no').textContent = String(i + 1);
      li.querySelector('.pl-name').textContent = item.name;
      const dir = (item.path || '').slice(0, Math.max(0, (item.path || '').lastIndexOf('/')));
      li.querySelector('.pl-dir').textContent = dir;
      li.querySelector('.pl-ext').textContent = (item.name.match(/\.([^.]+)$/) || ['', item.kind])[1].toUpperCase();
      const del = li.querySelector('.pl-del');
      del.title = t('plRemove');
      del.setAttribute('aria-label', t('plRemove'));
      this.list.appendChild(li);
    });
  }
}
