// Voice bank view: the song's FM voices as a list next to the text (like the tracker view).
// The list joins the voice file the song uses (#voice, or VOICE.DAT by default) and the
// voices the MUC defines itself; where both have @n, the MUC's wins, as in the compiler.
// The buttons work on the selected voice; voices go to the file (DAT) or into the MUC text,
// whichever "To" says. Everything that changes the song goes through the page (opts).

import { readDat, writeDat, newDat, mucVoices, voiceKey, cleanName, importVoices, cloneVoice } from './voice-bank.js';
import { ALGS, OP_COLORS } from './fm-preview.js';

export class BankView {
  // opts: t; text(); dat() -> { name, bytes | null }; setDat(bytes, { name, link }) (attach
  // the file, link: write #voice); removeMuc(entry); addMuc(n, voice, name); editMuc(entry);
  // editDat(n, voice, name); insertAt(text); preview(voice); usage() -> Map(n | name -> count);
  // download(name, bytes); initVoice; colors() -> { muted, panel }.
  constructor(root, opts) {
    this.root = root;
    this.o = opts;
    this.entries = [];
    this.selected = null;
    this.target = 'dat';
    this.showEmpty = false;
    this.history = [];   // earlier versions of the voice file, for Undo
    this.build();
  }

  get isOpen() { return !this.root.hidden; }

  build() {
    const T = this.o.t;
    const btn = (act, label, tip) => `<button type="button" class="btn small" data-act="${act}" title="${tip}">${label}</button>`;
    this.root.innerHTML = `
      <div class="bank-bar">
        <b>🎛 ${T('bankTitle')}</b>
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
    q('.bank-target').value = this.target;
    q('.bank-target').onchange = (e) => { this.target = e.target.value; this.targetChosen = true; };
    q('.bank-empty input').checked = this.showEmpty;
    q('.bank-empty input').onchange = (e) => { this.showEmpty = e.target.checked; this.render(); };
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

  // ---------- the list ----------
  refresh() {
    const dat = this.o.dat();
    this.datName = dat.name;
    this.datBytes = dat.bytes;
    const byN = new Map();
    for (const d of dat.bytes ? readDat(dat.bytes) : []) byN.set(d.n, { n: d.n, dat: d });
    for (const m of mucVoices(this.o.text())) {
      if (m.n < 1 || m.n > 255) continue;
      const e = byN.get(m.n) || { n: m.n };
      if (!e.muc) e.muc = m;   // the first definition is the one the compiler finds
      byN.set(m.n, e);
    }
    const usage = this.o.usage();
    for (const e of byN.values()) {
      e.voice = (e.muc || e.dat).voice;
      e.name = e.dat?.name || '';
      e.uses = (usage.get(e.n) || 0) + (e.name ? usage.get(e.name) || 0 : 0);
    }
    this.entries = [...byN.values()].sort((a, b) => a.n - b.n);
    // To: the voice file when the song has one, else the MUC, until chosen by hand.
    if (!this.targetChosen) this.target = dat.bytes ? 'dat' : 'muc';
    this.root.querySelector('.bank-target').value = this.target;
    this.render();
  }

  entry(n) { return this.entries.find((e) => e.n === n) || null; }

  shown() {
    if (!this.showEmpty) return this.entries;
    return Array.from({ length: 255 }, (_, k) => this.entry(k + 1) || { n: k + 1, empty: true });
  }

  render() {
    if (!this.isOpen) return;
    const T = this.o.t;
    const file = this.root.querySelector('.bank-file');
    const count = this.entries.filter((e) => e.dat).length;
    file.textContent = this.datBytes ? T('bankFile', this.datName, count) : this.datName ? T('bankFileMissing', this.datName) : T('bankNoFile');
    file.classList.toggle('missing', !this.datBytes);
    const list = this.root.querySelector('.bank-list');
    const keep = list.scrollTop;
    list.innerHTML = '';
    const shown = this.shown();
    if (!shown.length) {
      const p = document.createElement('p');
      p.className = 'bank-none';
      p.textContent = T('bankEmpty');
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
        row.innerHTML = `<span class="n">@${e.n}</span><span class="name">—</span>`;
      } else {
        const src = e.muc && e.dat ? 'over' : e.muc ? 'muc' : 'dat';
        row.innerHTML = `<span class="n">@${e.n}</span><span class="name"></span><span class="src ${src}">${T('bankSrc_' + src)}</span><canvas class="alg"></canvas><span class="fa">ALG ${e.voice.alg} FB ${e.voice.fb}</span><span class="uses"></span>`;
        row.querySelector('.name').textContent = e.name || (e.muc ? T('bankInline') : '');
        row.querySelector('.uses').textContent = e.uses ? `×${e.uses}` : '';
        row.title = e.muc && e.dat ? T('bankOverTip') : '';
      }
      frag.appendChild(row);
    }
    list.appendChild(frag);
    list.scrollTop = keep;
    list.querySelectorAll('.bank-row:not(.empty) canvas.alg').forEach((c) => this.drawAlg(c, this.entry(+c.parentElement.dataset.n).voice.alg));
    this.info();
  }

  drawAlg(canvas, a) {
    const dpr = window.devicePixelRatio || 1;
    const w = 44, h = 20;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const alg = ALGS[a] || ALGS[0];
    const cols = Math.max(...alg.pos.map((p) => p[0])) + 1, rows = Math.max(...alg.pos.map((p) => p[1])) + 1;
    const at = (k) => ({ x: 4 + (alg.pos[k][0] + 0.5) * ((w - 10) / cols), y: (alg.pos[k][1] + 0.5) * (h / rows) });
    const c = this.o.colors();
    g.strokeStyle = c.muted; g.lineWidth = 1;
    for (const [s, d] of alg.edges) { const A = at(s), B = at(d); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
    for (const k of alg.out) { const A = at(k); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(w - 1, A.y); g.stroke(); }
    const box = Math.min(6, h / rows - 1);
    for (let k = 0; k < 4; k++) {
      const A = at(k);
      g.fillStyle = alg.out.includes(k) ? OP_COLORS[k] : c.panel;
      g.strokeStyle = OP_COLORS[k];
      g.fillRect(A.x - box / 2, A.y - box / 2, box, box);
      g.strokeRect(A.x - box / 2 + .5, A.y - box / 2 + .5, box - 1, box - 1);
    }
  }

  // A message stays until another voice is picked (the list is redrawn when the file or the
  // text changes, which should not wipe it).
  info(message) {
    const p = this.root.querySelector('.bank-info');
    if (message) this.message = message;
    if (this.message) { p.textContent = this.message; return; }
    const e = this.entry(this.selected);
    if (!e) { p.textContent = this.o.t('bankHint'); return; }
    const T = this.o.t;
    p.textContent = [
      `@${e.n}` + (e.name ? ` "${e.name}"` : ''),
      e.muc && e.dat ? T('bankOverTip') : e.muc ? T('bankInMuc', e.muc.row) : T('bankInDat', this.datName),
      e.uses ? T('bankUses', e.uses) : T('bankUnused'),
    ].join(' · ');
  }

  select(n, preview = false) {
    this.selected = n;
    this.message = null;
    for (const r of this.root.querySelectorAll('.bank-row')) {
      const on = +r.dataset.n === n;
      r.classList.toggle('sel', on);
      r.setAttribute('aria-selected', String(on));
      if (on) r.scrollIntoView({ block: 'nearest' });
    }
    this.info();
    const e = this.entry(n);
    if (preview && e) this.o.preview(e.voice);
  }

  // ---------- changing the voice file ----------
  writeDat(bytes, link = false) {
    if (this.datBytes) { this.history.push(this.datBytes); if (this.history.length > 50) this.history.shift(); }
    this.datBytes = bytes;
    this.o.setDat(bytes, { name: this.datName || 'VOICE.DAT', link });
  }

  datOrNew() {
    if (this.datBytes) return { bytes: this.datBytes, link: false };
    return { bytes: newDat(), link: true };
  }

  freeNumber(taken) {
    for (let n = 1; n < 256; n++) if (!taken.has(n)) return n;
    return 0;
  }

  // ---------- the buttons ----------
  async act(what) {
    const T = this.o.t;
    const e = this.entry(this.selected);
    switch (what) {
      case 'add': {
        const n = this.freeNumber(new Set(this.entries.map((x) => x.n)));
        if (!n) { this.info(T('bankFull')); return; }
        const voice = cloneVoice(this.o.initVoice);
        if (this.target === 'dat') {
          const { bytes, link } = this.datOrNew();
          this.writeDat(writeDat(bytes, n, voice, `new${n}`.slice(0, 6)), link);
        } else this.o.addMuc(n, voice);
        this.selected = n;
        this.refresh();
        this.info(T('bankAdded', n, this.target.toUpperCase()));
        return;
      }
      case 'del': {
        if (!e) return;
        if (e.uses && !confirm(T('bankDelUsed', e.n, e.uses))) return;
        if (e.muc) { this.o.removeMuc(e.muc); this.info(T(e.dat ? 'bankDelMucKeepDat' : 'bankDeleted', e.n)); }
        else { this.writeDat(writeDat(this.datBytes, e.n, null)); this.info(T('bankDeleted', e.n)); }
        this.refresh();
        return;
      }
      case 'edit':
        if (!e) return;
        if (e.muc) {
          if (e.muc.form !== 'plain') { this.info(T('bankFormText')); return; }
          this.o.editMuc(e.muc);
        } else this.o.editDat(e.n, e.voice, e.name);
        return;
      case 'rename': {
        if (!e || !e.dat) { this.info(T('bankRenameDatOnly')); return; }
        const name = prompt(T('bankRenamePrompt'), e.name);
        if (name === null) return;
        this.writeDat(writeDat(this.datBytes, e.n, e.dat.voice, cleanName(name)));
        this.refresh();
        return;
      }
      case 'toDat': {
        if (!e || !e.muc) { this.info(T('bankToDatNeedsMuc')); return; }
        const { bytes, link } = this.datOrNew();
        this.writeDat(writeDat(bytes, e.n, e.muc.voice, e.name || `muc${e.n}`.slice(0, 6)), link);
        this.o.removeMuc(e.muc);
        this.refresh();
        this.info(T('bankMovedToDat', e.n, this.datName || 'VOICE.DAT'));
        return;
      }
      case 'toMuc': {
        if (!e || !e.dat) { this.info(T('bankToMucNeedsDat')); return; }
        if (e.muc) { this.info(T('bankAlreadyMuc')); return; }
        this.o.addMuc(e.n, e.dat.voice, e.name);
        this.refresh();
        this.info(T('bankCopiedToMuc', e.n));
        return;
      }
      case 'import': {
        const picked = await this.choose('.dat,.muc,.mub,.vgm,.vgz,.txt', true);
        if (picked.length) await this.importFiles(picked);
        return;
      }
      case 'load': {
        const [file] = await this.choose('.dat', false);
        if (!file) return;
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (bytes.length % 32 || bytes.length < 64 || bytes.length > 8192) { this.info(T('bankNotDat', file.name)); return; }
        this.history = [];
        this.datName = file.name;
        this.datBytes = bytes;
        this.o.setDat(bytes, { name: file.name, link: true });
        this.targetChosen = false;
        this.refresh();
        this.info(T('bankLoaded', file.name, readDat(bytes).length));
        return;
      }
      case 'save': {
        if (this.datBytes) { this.o.download(this.datName || 'VOICE.DAT', this.datBytes); return; }
        // No voice file yet: one made from the MUC's voices (same numbers).
        let bytes = newDat();
        for (const x of this.entries) if (x.muc) bytes = writeDat(bytes, x.n, x.muc.voice, `muc${x.n}`.slice(0, 6));
        this.o.download('VOICE.DAT', bytes);
        this.info(T('bankSavedFromMuc'));
        return;
      }
      case 'undo': {
        const prev = this.history.pop();
        if (!prev) { this.info(T('bankNothingToUndo')); return; }
        this.datBytes = prev;
        this.o.setDat(prev, { name: this.datName || 'VOICE.DAT', link: false });
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

  // Voices from other files, added after the ones there are (to the voice file, or as
  // definitions in the MUC); a voice the bank already has is not added again.
  async importFiles(fileList) {
    const T = this.o.t;
    const have = new Set(this.entries.map((x) => voiceKey(x.voice)));
    const taken = new Set(this.entries.map((x) => x.n));
    let added = 0, same = 0, noRoom = 0, none = [];
    let { bytes, link } = this.target === 'dat' ? this.datOrNew() : { bytes: null, link: false };
    const toMuc = [];
    for (const file of fileList) {
      let found;
      try { found = await importVoices(file.name, new Uint8Array(await file.arrayBuffer())); }
      catch { found = { voices: [] }; }
      if (!found.voices.length) { none.push(file.name); continue; }
      for (const v of found.voices) {
        const key = voiceKey(v.voice);
        if (have.has(key)) { same++; continue; }
        const n = this.freeNumber(taken);
        if (!n) { noRoom++; continue; }
        have.add(key);
        taken.add(n);
        added++;
        if (this.target === 'dat') bytes = writeDat(bytes, n, v.voice, v.name);
        else toMuc.push([n, v.voice, v.name]);
      }
    }
    if (this.target === 'dat' && added) this.writeDat(bytes, link);
    for (const [n, voice, name] of toMuc) this.o.addMuc(n, voice, name);
    this.refresh();
    this.info([T('bankImported', added, this.target.toUpperCase()), same ? T('bankImportSame', same) : '', noRoom ? T('bankImportFull', noRoom) : '', none.length ? T('bankImportNone', none.join(', ')) : ''].filter(Boolean).join(' · '));
  }
}
