// Voice bank view: the song's FM voices, SCC waves or ADPCM samples as a list next to the
// text (like the tracker view), on tabs. Each list joins the file the song uses (FM: #voice /
// VOICE.DAT, SCC: #sccvoice / SCCVOICE.DAT, PCM: #pcm / mucompcm.bin) and what the MUC
// defines itself; where both have a number, the MUC's wins, as in the compilers (PCM: any
// #@pcm line and the compiler ignores the whole #pcm file). The buttons work on the selected
// entry; new ones go to the file (DAT) or into the MUC text, whichever "To" says.
//
// What differs between the kinds lives in a kind (made by the page):
//   id, label; first / last number; mark ('@' / '@W'); hasNames; defaultFile; accept
//   (import); loadAccept; fileLabel ('DAT'); whole (the MUC's entries replace the file's);
//   fileNote() (shown after the file name);
//   file() -> { name, bytes | null }; setFile(bytes | null, { name, link });
//   read(bytes) -> [{ n, data, name }]; put(bytes, n, data | null, name) -> bytes | null;
//   validFile(bytes); muc() -> [{ n, data, row, endRow, editable }]; key(data);
//   usage() -> Map(n | name -> notes); describe(data); drawMini(canvas, data);
//   preview(data); initData(); removeMuc(entry); addMuc(n, data, name); editMuc(entry);
//   editFile(n, data, name); importFile(name, bytes) -> [{ data, name? }]

export class BankView {
  // opts: t; kinds: { fm, scc }; insertAt(text); download(name, bytes); onKind(id) (a tab
  // was picked).
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.kind = 'fm';
    this.state = {};
    for (const k of Object.keys(opts.kinds)) this.state[k] = { entries: [], selected: null, target: 'dat', targetChosen: false, history: [], message: null };
    this.showEmpty = false;
    this.build();
  }

  get isOpen() { return !this.root.hidden; }
  get k() { return this.o.kinds[this.kind]; }
  get s() { return this.state[this.kind]; }
  get entries() { return this.s.entries; }
  get selected() { return this.s.selected; }

  build() {
    const T = this.o.t;
    const btn = (act, label, tip) => `<button type="button" class="btn small" data-act="${act}" title="${tip}">${label}</button>`;
    this.root.innerHTML = `
      <div class="bank-bar">
        <b>🎛 ${T('bankTitle')}</b>
        <span class="tool-group bank-tabs" role="tablist">${Object.values(this.o.kinds).map((k) => `<button type="button" class="btn small" role="tab" data-kind="${k.id}">${k.label}</button>`).join('')}</span>
        <span class="bank-file"></span>
        <label>${T('bankTo')} <select class="bank-target"><option value="dat">DAT</option><option value="muc">MUC</option></select></label>
        <label class="bank-empty"><input type="checkbox"> ${T('bankShowEmpty')}</label>
      </div>
      <div class="bank-tools">
        <span class="tool-group">${btn('add', T('bankAdd'), T('bankAddTip'))}${btn('del', T('bankDel'), T('bankDelTip'))}${btn('edit', T('bankEdit'), T('bankEditTip'))}${btn('rename', T('bankRename'), T('bankRenameTip'))}</span>
        <span class="tool-group">${btn('toDat', '→DAT', T('bankToDatTip'))}${btn('toMuc', '→MUC', T('bankToMucTip'))}</span>
        <span class="tool-group">${btn('import', T('bankImport'), T('bankImportTip'))}${btn('load', T('bankLoad'), T('bankLoadTip'))}${btn('save', T('bankSave'), T('bankSaveTip'))}</span>
        ${btn('undo', '↶', T('bankUndoTip'))}
      </div>
      <div class="bank-list" tabindex="0" role="listbox" aria-label="${T('bankTitle')}"></div>
      <p class="bank-info"></p>
      <input type="file" class="bank-pick" hidden multiple>`;
    const q = (s) => this.root.querySelector(s);
    q('.bank-target').onchange = (e) => { this.s.target = e.target.value; this.s.targetChosen = true; };
    q('.bank-empty input').checked = this.showEmpty;
    q('.bank-empty input').onchange = (e) => { this.showEmpty = e.target.checked; this.render(); };
    this.root.querySelectorAll('[data-kind]').forEach((b) => { b.onclick = () => this.setKind(b.dataset.kind); });
    this.root.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => this.act(b.dataset.act); });
    const list = q('.bank-list');
    list.addEventListener('click', (e) => { const r = e.target.closest('.bank-row'); if (r) this.select(+r.dataset.n, true); });
    list.addEventListener('dblclick', (e) => { const r = e.target.closest('.bank-row'); if (r && this.entry(+r.dataset.n)) this.o.insertAt(`@${r.dataset.n}`); });
    list.addEventListener('keydown', (e) => {
      const shown = this.shown();
      const i = shown.findIndex((x) => x.n === this.selected);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = shown[Math.max(0, Math.min(shown.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (next) this.select(next.n, true);
      } else if (e.key === 'Enter') { e.preventDefault(); this.act('edit'); }
      else if (e.key === 'Delete') { e.preventDefault(); this.act('del'); }
    });
    this.pick = q('.bank-pick');
  }

  setKind(id) {
    if (!this.o.kinds[id]) return;
    this.kind = id;
    this.refresh();
    this.o.onKind?.(id);
  }

  // ---------- the list ----------
  refresh() {
    const k = this.k, s = this.s;
    const file = k.file();
    s.fileName = file.name;
    s.fileBytes = file.bytes;
    const byN = new Map();
    for (const d of file.bytes ? k.read(file.bytes) || [] : []) byN.set(d.n, { n: d.n, file: d });
    const muc = k.muc().filter((m) => m.n >= k.first && m.n <= this.last);
    // A kind whose MUC entries replace the file: the file's are not used then.
    s.fileIgnored = !!(k.whole && muc.length && file.bytes);
    if (s.fileIgnored) byN.clear();
    for (const m of muc) {
      const e = byN.get(m.n) || { n: m.n };
      if (!e.muc) e.muc = m;   // the first definition is the one the compiler finds
      byN.set(m.n, e);
    }
    const usage = k.usage();
    for (const e of byN.values()) {
      e.data = (e.muc || e.file).data;
      e.name = e.file?.name || e.muc?.name || '';
      e.uses = (usage.get(e.n) || 0) + (e.name ? usage.get(e.name) || 0 : 0);
    }
    s.entries = [...byN.values()].sort((a, b) => a.n - b.n);
    // To: the file when the song has one, else the MUC, until chosen by hand.
    if (!s.targetChosen) s.target = file.bytes && !s.fileIgnored ? 'dat' : 'muc';
    this.render();
  }

  entry(n) { return this.entries.find((e) => e.n === n) || null; }
  get last() { return this.k.last ?? 255; }

  shown() {
    if (!this.showEmpty) return this.entries;
    const first = this.k.first;
    return Array.from({ length: this.last + 1 - first }, (_, i) => this.entry(i + first) || { n: i + first, empty: true });
  }

  render() {
    if (!this.isOpen) return;
    const T = this.o.t, k = this.k, s = this.s;
    this.root.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === this.kind)));
    this.root.querySelector('.bank-target option[value="dat"]').textContent = k.fileLabel || 'DAT';
    this.root.querySelector('.bank-target').value = s.target;
    this.root.querySelector('[data-act="rename"]').hidden = !k.hasNames;
    this.root.querySelector('[data-act="toDat"]').textContent = '→' + (k.fileLabel || 'DAT');
    const file = this.root.querySelector('.bank-file');
    const count = this.entries.filter((e) => e.file).length;
    file.textContent = s.fileIgnored ? T('bankFileIgnored', s.fileName) : s.fileBytes ? T('bankFile_' + k.id, s.fileName, count) + (k.fileNote?.(s.fileBytes) || '') : s.fileName ? T('bankFileMissing', s.fileName) : T('bankNoFile_' + k.id);
    file.classList.toggle('missing', !s.fileBytes || s.fileIgnored);
    const list = this.root.querySelector('.bank-list');
    const keep = list.scrollTop;
    list.innerHTML = '';
    const shown = this.shown();
    if (!shown.length) {
      const p = document.createElement('p');
      p.className = 'bank-none';
      p.textContent = T('bankEmpty_' + k.id);
      list.appendChild(p);
    }
    const frag = document.createDocumentFragment();
    for (const e of shown) {
      const row = document.createElement('div');
      row.className = 'bank-row' + (e.empty ? ' empty' : '') + (e.n === this.selected ? ' sel' : '');
      row.dataset.n = e.n;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(e.n === this.selected));
      if (e.empty) {
        row.innerHTML = `<span class="n">${k.mark}${e.n}</span><span class="name">—</span>`;
      } else {
        const src = e.muc && e.file ? 'over' : e.muc ? 'muc' : 'dat';
        const srcText = src === 'dat' && k.fileLabel ? k.fileLabel : T('bankSrc_' + src);
        row.innerHTML = `<span class="n">${k.mark}${e.n}</span><span class="name"></span><span class="src ${src}">${srcText}</span><canvas class="alg"></canvas><span class="fa"></span><span class="uses"></span>`;
        row.querySelector('.name').textContent = e.name || (e.muc ? T('bankInline') : '');
        row.querySelector('.fa').textContent = k.describe(e.data);
        row.querySelector('.uses').textContent = e.uses ? `×${e.uses}` : '';
        row.title = e.muc && e.file ? T('bankOverTip') : '';
      }
      frag.appendChild(row);
    }
    list.appendChild(frag);
    list.scrollTop = keep;
    list.querySelectorAll('.bank-row:not(.empty) canvas.alg').forEach((c) => k.drawMini(c, this.entry(+c.parentElement.dataset.n).data));
    this.info();
  }

  // A message stays until another entry is picked (the list is redrawn when the file or the
  // text changes, which should not wipe it).
  info(message) {
    const p = this.root.querySelector('.bank-info');
    if (message) this.s.message = message;
    if (this.s.message) { p.textContent = this.s.message; return; }
    const e = this.entry(this.selected);
    if (!e) { p.textContent = this.o.t('bankHint'); return; }
    const T = this.o.t;
    p.textContent = [
      `${this.k.mark}${e.n}` + (e.name ? ` "${e.name}"` : ''),
      e.muc && e.file ? T('bankOverTip') : e.muc ? T('bankInMuc', e.muc.row) : T('bankInDat', this.s.fileName),
      e.uses ? T('bankUses', e.uses) : T('bankUnused'),
    ].join(' · ');
  }

  select(n, preview = false) {
    this.s.selected = n;
    this.s.message = null;
    for (const r of this.root.querySelectorAll('.bank-row')) {
      const on = +r.dataset.n === n;
      r.classList.toggle('sel', on);
      r.setAttribute('aria-selected', String(on));
      if (on) r.scrollIntoView({ block: 'nearest' });
    }
    this.info();
    const e = this.entry(n);
    if (preview && e) this.k.preview(e.data);
  }

  // ---------- changing the file ----------
  writeFile(bytes, link = false) {
    const s = this.s;
    if (s.fileBytes) { s.history.push(s.fileBytes); if (s.history.length > 50) s.history.shift(); }
    s.fileBytes = bytes;
    this.k.setFile(bytes, { name: s.fileName || this.k.defaultFile, link });
  }

  // Writes data as number n (null: removes it) into the file, making one if there is none.
  put(n, data, name) {
    const link = !this.s.fileBytes;
    this.writeFile(this.k.put(this.s.fileBytes, n, data, name), link);
  }

  freeNumber(taken) {
    for (let n = this.k.first; n <= this.last; n++) if (!taken.has(n)) return n;
    return -1;
  }

  // A kind whose MUC entries replace the file: before the first one goes into the MUC, the
  // file's entries are copied there too, so none of them stops being used.
  keepFileInMuc() {
    const k = this.k, s = this.s;
    if (!k.whole || !s.fileBytes || s.fileIgnored || this.entries.some((x) => x.muc)) return 0;
    const list = this.entries.filter((x) => x.file);
    for (const x of list) k.addMuc(x.n, x.file.data, x.name);
    return list.length;
  }

  // ---------- the buttons ----------
  async act(what) {
    const T = this.o.t, k = this.k, s = this.s;
    const e = this.entry(this.selected);
    switch (what) {
      case 'add': {
        const n = this.freeNumber(new Set(this.entries.map((x) => x.n)));
        if (n < 0) { this.info(T('bankFull', this.last + 1 - k.first)); return; }
        let copied = 0;
        if (s.target === 'dat') this.put(n, k.initData(), `new${n}`.slice(0, 6));
        else { copied = this.keepFileInMuc(); k.addMuc(n, k.initData(), `new${n}`.slice(0, 6)); }
        s.selected = n;
        this.refresh();
        this.info(T('bankAdded', k.mark + n, s.target === 'dat' ? k.fileLabel || 'DAT' : 'MUC') + (copied ? ' · ' + T('bankCopiedAll', copied) : ''));
        return;
      }
      case 'del': {
        if (!e) return;
        if (e.uses && !confirm(T('bankDelUsed', k.mark + e.n, e.uses))) return;
        if (e.muc) { k.removeMuc(e.muc); this.info(T(e.file ? 'bankDelMucKeepDat' : 'bankDeleted', k.mark + e.n)); }
        else { this.put(e.n, null); this.info(T('bankDeleted', k.mark + e.n)); }
        this.refresh();
        return;
      }
      case 'edit':
        if (!e) return;
        if (e.muc) {
          if (!e.muc.editable) { this.info(T('bankFormText')); return; }
          k.editMuc(e.muc);
        } else k.editFile(e.n, e.data, e.name);
        return;
      case 'rename': {
        if (!e || !e.file) { this.info(T('bankRenameDatOnly')); return; }
        const name = prompt(T('bankRenamePrompt'), e.name);
        if (name === null) return;
        try { this.put(e.n, e.file.data, name); } catch (err) { this.info(String(err.message || err)); return; }
        this.refresh();
        return;
      }
      case 'toDat': {
        if (!e || !e.muc) { this.info(T('bankToDatNeedsMuc')); return; }
        if (k.whole) {
          // All of them: one left in the MUC would keep the file unused.
          const list = this.entries.filter((x) => x.muc).sort((a, b) => b.muc.row - a.muc.row);
          let bytes = s.fileIgnored ? null : s.fileBytes;
          const link = !s.fileBytes;
          // The file first (it can refuse an entry), then the definitions go, bottom up.
          try { for (const x of list) bytes = k.put(bytes, x.n, x.muc.data, x.name); }
          catch (err) { this.info(String(err.message || err)); return; }
          for (const x of list) k.removeMuc(x.muc);
          this.writeFile(bytes, link);
          this.refresh();
          this.info(T('bankMovedAllToDat', list.length, s.fileName || k.defaultFile));
          return;
        }
        // The definition goes first: writing a new file adds a tag line, which moves the rows.
        let bytes;
        try { bytes = k.put(s.fileBytes, e.n, e.muc.data, e.name || `muc${e.n}`.slice(0, 6)); }
        catch (err) { this.info(String(err.message || err)); return; }
        const link = !s.fileBytes;
        k.removeMuc(e.muc);
        this.writeFile(bytes, link);
        this.refresh();
        this.info(T('bankMovedToDat', k.mark + e.n, s.fileName || k.defaultFile));
        return;
      }
      case 'toMuc': {
        if (!e || !e.file) { this.info(T('bankToMucNeedsDat')); return; }
        if (e.muc) { this.info(T('bankAlreadyMuc')); return; }
        if (k.whole) {
          const copied = this.keepFileInMuc();
          this.refresh();
          this.info(T('bankCopiedAll', copied));
          return;
        }
        k.addMuc(e.n, e.file.data, e.name);
        this.refresh();
        this.info(T('bankCopiedToMuc', k.mark + e.n));
        return;
      }
      case 'import': {
        const picked = await this.choose(k.accept, true);
        if (picked.length) await this.importFiles(picked);
        return;
      }
      case 'load': {
        const [file] = await this.choose(k.loadAccept || '.dat', false);
        if (!file) return;
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!k.validFile(bytes)) { this.info(T('bankNotDat_' + k.id, file.name)); return; }
        s.history = [];
        s.fileName = file.name;
        s.fileBytes = bytes;
        k.setFile(bytes, { name: file.name, link: true });
        s.targetChosen = false;
        this.refresh();
        this.info(T('bankLoaded_' + k.id, file.name, (k.read(bytes) || []).length));
        return;
      }
      case 'save': {
        if (s.fileBytes) { this.o.download(s.fileName || k.defaultFile, s.fileBytes); return; }
        // No file yet: one made from the MUC's entries (same numbers).
        let bytes = null;
        try { for (const x of this.entries) if (x.muc) bytes = k.put(bytes, x.n, x.muc.data, x.name || `muc${x.n}`.slice(0, 6)); }
        catch (err) { this.info(String(err.message || err)); return; }
        if (!bytes) { this.info(T('bankEmpty_' + k.id)); return; }
        this.o.download(k.defaultFile, bytes);
        this.info(T('bankSavedFromMuc'));
        return;
      }
      case 'undo': {
        const prev = s.history.pop();
        if (!prev) { this.info(T('bankNothingToUndo')); return; }
        s.fileBytes = prev;
        k.setFile(prev, { name: s.fileName || k.defaultFile, link: false });
        this.refresh();
        return;
      }
    }
  }

  choose(accept, multiple) {
    return new Promise((resolve) => {
      const input = this.pick;
      input.accept = accept;
      input.multiple = multiple;
      input.value = '';
      input.onchange = () => resolve([...input.files]);
      input.click();
    });
  }

  // Entries from other files, added after the ones there are (to the file, or as
  // definitions in the MUC); one the bank already has is not added again.
  async importFiles(fileList) {
    const T = this.o.t, k = this.k, s = this.s;
    const have = new Set(this.entries.map((x) => k.key(x.data)));
    const taken = new Set(this.entries.map((x) => x.n));
    let added = 0, same = 0, noRoom = 0;
    const none = [];
    let bytes = s.fileBytes;
    const link = !bytes;
    const toMuc = [];
    const copied = s.target === 'muc' ? this.keepFileInMuc() : 0;
    for (const file of fileList) {
      let found;
      try { found = await k.importFile(file.name, new Uint8Array(await file.arrayBuffer())); }
      catch (err) { console.warn(err); found = []; }
      if (!found.length) { none.push(file.name); continue; }
      for (const v of found) {
        const key = k.key(v.data);
        if (have.has(key)) { same++; continue; }
        const n = this.freeNumber(taken);
        if (n < 0) { noRoom++; continue; }
        have.add(key);
        taken.add(n);
        added++;
        if (s.target === 'dat') {
          try { bytes = k.put(bytes, n, v.data, v.name); }
          catch (err) { added--; noRoom++; this.info(String(err.message || err)); continue; }
        } else toMuc.push([n, v.data, v.name]);
      }
    }
    if (s.target === 'dat' && added) this.writeFile(bytes, link);
    for (const [n, data, name] of toMuc) k.addMuc(n, data, name);
    this.refresh();
    this.info([T('bankImported_' + k.id, added, s.target === 'dat' ? k.fileLabel || 'DAT' : 'MUC'), copied ? T('bankCopiedAll', copied) : '', same ? T('bankImportSame', same) : '', noRoom ? T('bankImportFull', noRoom) : '', none.length ? T('bankImportNone_' + k.id, none.join(', ')) : ''].filter(Boolean).join(' · '));
  }
}
