// ADPCM sample editor, after Furnace's sample editor (src/gui/sampleEdit.cpp): the sample as
// audio at its own rate, a selection to work on (drag on the graph), the usual tools, and
// listening either to the audio or to what the chip plays (encoded to ADPCM-B and back).
// It takes the place of the text editor; Apply hands the result back.

import { encodeAdpcm, decodeAdpcm, resample, rateNote, noteRate, NATIVE_RATE } from './pcm-bank.js';

const TEXT = {
  title: { en: 'PCM sample editor', ko: 'PCM 샘플 편집', ja: 'PCMサンプルエディタ' },
  undo: { en: 'Undo', ko: '되돌리기', ja: '元に戻す' },
  redo: { en: 'Redo', ko: '다시 하기', ja: 'やり直し' },
  listen: { en: '▶ Listen', ko: '▶ 듣기', ja: '▶ 試聴' },
  stop: { en: '■ Stop', ko: '■ 멈춤', ja: '■ 停止' },
  listenTip: { en: 'Play the selection (or all) (Space)', ko: '선택 구간(없으면 전체)을 재생 (Space)', ja: '選択範囲（なければ全体）を再生（Space）' },
  chip: { en: 'As the chip', ko: '칩 소리로', ja: 'チップの音で' },
  chipTip: { en: 'Listen to the ADPCM-B data the chip plays (encoded and decoded again)', ko: '칩이 재생하는 ADPCM-B 데이터로 듣기 (인코딩 후 다시 디코딩)', ja: 'チップが再生するADPCM-Bデータで聴く（エンコードして再デコード）' },
  at: { en: 'Speed', ko: '속도', ja: '速度' },
  own: { en: 'own rate', ko: '원래 속도', ja: '元の速度' },
  apply: { en: 'Apply', ko: '적용', ja: '適用' },
  applyTip: { en: 'Write the sample into the bank and keep editing', ko: '샘플을 뱅크에 쓰고 계속 편집', ja: 'サンプルをバンクに書き込んで編集を続ける' },
  done: { en: 'Done', ko: '완료', ja: '完了' },
  doneTip: { en: 'Write the sample into the bank and return', ko: '샘플을 뱅크에 쓰고 돌아가기', ja: 'サンプルをバンクに書き込んで戻る' },
  cancel: { en: 'Cancel', ko: '취소', ja: 'キャンセル' },
  cancelTip: { en: 'Return without writing (changes already applied stay)', ko: '쓰지 않고 돌아가기 (이미 적용한 것은 남음)', ja: '書き込まずに戻る（適用済みの変更は残る）' },
  name: { en: 'Name', ko: '이름', ja: '名前' },
  volume: { en: 'Volume', ko: '볼륨', ja: 'ボリューム' },
  volumeTip: { en: 'The bank entry\'s volume (#@pcm: also scales the WAV in %)', ko: '뱅크 항목의 볼륨 (#@pcm에서는 WAV 크기 %도 됨)', ja: 'バンク項目のボリューム（#@pcmではWAVの倍率%も兼ねる）' },
  fit: { en: 'Fit', ko: '전체 보기', ja: '全体表示' },
  zoomSel: { en: 'Zoom to selection', ko: '선택 확대', ja: '選択を拡大' },
  selAll: { en: 'Select all', ko: '전체 선택', ja: 'すべて選択' },
  hint: { en: 'Drag on the graph to select; the tools work on the selection, or on everything when nothing is selected.', ko: '그래프를 드래그해 구간을 선택하세요. 도구는 선택 구간에, 선택이 없으면 전체에 적용됩니다.', ja: 'グラフをドラッグして範囲を選択。ツールは選択範囲に、選択がなければ全体に働きます。' },
  edit: { en: 'Edit', ko: '편집', ja: '編集' },
  trim: { en: 'Trim', ko: '잘라내기(선택만 남김)', ja: 'トリム' },
  del: { en: 'Delete', ko: '삭제', ja: '削除' },
  silence: { en: 'Silence', ko: '무음', ja: '無音' },
  fadeIn: { en: 'Fade in', ko: '페이드 인', ja: 'フェードイン' },
  fadeOut: { en: 'Fade out', ko: '페이드 아웃', ja: 'フェードアウト' },
  normalize: { en: 'Normalize', ko: '노멀라이즈', ja: 'ノーマライズ' },
  amplify: { en: 'Amplify %', ko: '증폭 %', ja: '増幅 %' },
  run: { en: 'Apply', ko: '실행', ja: '実行' },
  reverse: { en: 'Reverse', ko: '거꾸로', ja: '逆再生' },
  invert: { en: 'Invert', ko: '위상 반전', ja: '位相反転' },
  dc: { en: 'Remove DC', ko: 'DC 제거', ja: 'DC除去' },
  resample: { en: 'Resample to', ko: '리샘플', ja: 'リサンプル' },
  resampleTip: { en: 'Change the rate (and the length); o1 c plays 16.1 kHz data at its own pitch, o2 c 8.1 kHz', ko: '샘플 레이트(와 길이)를 바꿉니다. o1 c는 16.1 kHz, o2 c는 8.1 kHz 데이터를 원래 높이로 재생합니다', ja: 'レート（と長さ）を変えます。o1 cは16.1 kHz、o2 cは8.1 kHzのデータを元の高さで鳴らします' },
  info: { en: (n, rate, sec, bytes) => `${n} samples · ${rate} Hz · ${sec} s · ADPCM ${bytes} bytes`, ko: (n, rate, sec, bytes) => `${n} 샘플 · ${rate} Hz · ${sec}초 · ADPCM ${bytes}바이트`, ja: (n, rate, sec, bytes) => `${n}サンプル · ${rate} Hz · ${sec}秒 · ADPCM ${bytes}バイト` },
  pitch: { en: (note, cents) => `own pitch on ${note}${cents}`, ko: (note, cents) => `원래 높이: ${note}${cents}`, ja: (note, cents) => `元の高さ: ${note}${cents}` },
  sel: { en: (a, b, n) => `selection ${a}–${b} (${n})`, ko: (a, b, n) => `선택 ${a}–${b} (${n})`, ja: (a, b, n) => `選択 ${a}–${b}（${n}）` },
  tooLong: { en: 'Longer than one bank entry holds (65536 bytes of ADPCM): trim it or resample it lower.', ko: '뱅크 항목 하나의 한도(ADPCM 65536바이트)보다 깁니다. 잘라내거나 낮은 레이트로 리샘플하세요.', ja: 'バンク1項目の上限（ADPCM 65536バイト）より長いです。トリムするか低いレートにリサンプルしてください。' },
};

const MAX_BYTES = 65536;

export class PcmEditor {
  constructor(root, { lang, onApply, onClose, audio, volume }) {
    this.root = root;
    this.lang = lang;
    this.onApply = onApply;      // ({ samples, rate, name, volume }) => void
    this.onClose = onClose;
    this.audio = audio;          // () => AudioContext
    this.volume = volume;        // () => 0..1
    this.samples = new Float32Array(0);
    this.rate = NATIVE_RATE;
    this.sel = null;             // [a, b) in samples
    this.view = [0, 0];
    this.history = [];
    this.future = [];
    this.chip = false;
    this.speed = 'own';
    this.playing = null;
  }

  t(key, ...args) {
    const e = TEXT[key];
    const v = e[this.lang()] ?? e.en;
    return typeof v === 'function' ? v(...args) : v;
  }

  get isOpen() { return !this.root.hidden; }

  // def: { title, name, volume, samples, rate, nameMax }
  open(def) {
    this.def = def;
    this.samples = Float32Array.from(def.samples);
    this.rate = def.rate || NATIVE_RATE;
    this.name = def.name || '';
    this.vol = def.volume ?? 0;
    this.sel = null;
    this.view = [0, this.samples.length];
    this.history = [];
    this.future = [];
    this.root.hidden = false;
    this.build();
    this.render();
  }

  close() {
    this.stop();
    this.root.hidden = true;
  }

  result() { return { samples: this.samples, rate: this.rate, name: this.name, volume: this.vol }; }

  // ---------- history ----------
  snapshot() {
    this.history.push({ samples: this.samples, rate: this.rate, sel: this.sel });
    if (this.history.length > 100) this.history.shift();
    this.future = [];
  }
  restore(from, to) {
    const s = from.pop();
    if (!s) return;
    to.push({ samples: this.samples, rate: this.rate, sel: this.sel });
    Object.assign(this, { samples: s.samples, rate: s.rate, sel: s.sel });
    this.clampView();
    this.render();
  }
  set(samples, { rate = this.rate, sel = null } = {}) {
    this.snapshot();
    this.samples = samples;
    this.rate = rate;
    this.sel = sel;
    this.clampView();
    this.render();
  }
  clampView() {
    const n = this.samples.length;
    let [a, b] = this.view;
    if (b > n || b - a < 8) { a = 0; b = n; }
    this.view = [Math.max(0, a), Math.min(n, b)];
  }

  // The range the tools work on.
  range() { return this.sel && this.sel[1] > this.sel[0] ? this.sel : [0, this.samples.length]; }

  tool(name) {
    const s = this.samples, [a, b] = this.range(), len = b - a;
    const map = (f) => { const out = Float32Array.from(s); for (let i = a; i < b; i++) out[i] = Math.max(-1, Math.min(1, f(s[i], i - a))); return out; };
    switch (name) {
      case 'trim': if (this.sel) this.set(s.slice(a, b), { sel: null }); return;
      case 'del': if (this.sel) { const out = new Float32Array(s.length - len); out.set(s.subarray(0, a)); out.set(s.subarray(b), a); this.set(out); } return;
      case 'silence': this.set(map(() => 0), { sel: this.sel }); return;
      case 'fadeIn': this.set(map((v, i) => v * (i / Math.max(1, len - 1))), { sel: this.sel }); return;
      case 'fadeOut': this.set(map((v, i) => v * (1 - i / Math.max(1, len - 1))), { sel: this.sel }); return;
      case 'normalize': {
        let peak = 0;
        for (let i = a; i < b; i++) peak = Math.max(peak, Math.abs(s[i]));
        if (peak > 0) this.set(map((v) => (v / peak) * 0.999), { sel: this.sel });
        return;
      }
      case 'amplify': {
        const k = (+this.root.querySelector('[data-arg="amplify"]').value || 100) / 100;
        this.set(map((v) => v * k), { sel: this.sel });
        return;
      }
      case 'reverse': { const out = Float32Array.from(s); for (let i = 0; i < len; i++) out[a + i] = s[b - 1 - i]; this.set(out, { sel: this.sel }); return; }
      case 'invert': this.set(map((v) => -v), { sel: this.sel }); return;
      case 'dc': {
        let sum = 0;
        for (let i = a; i < b; i++) sum += s[i];
        const mean = sum / Math.max(1, len);
        this.set(map((v) => v - mean), { sel: this.sel });
        return;
      }
      case 'resample': {
        const pick = this.root.querySelector('.pe-rate').value;
        const to = pick === 'custom' ? +this.root.querySelector('.pe-hz').value : +pick;
        if (!(to >= 1000 && to <= 96000) || Math.abs(to - this.rate) < 0.5) return;
        this.set(resample(s, this.rate, to), { rate: to });
        this.view = [0, this.samples.length];
        this.render();
        return;
      }
    }
  }

  // ---------- listening ----------
  play() {
    if (this.playing) { this.stop(); return; }
    const ctx = this.audio();
    if (!ctx || !this.samples.length) return;
    const [a, b] = this.range();
    let data = this.samples.subarray(a, b);
    if (this.chip) data = decodeAdpcm(encodeAdpcm(data)).subarray(0, data.length);
    const rate = this.speed === 'own' ? this.rate : +this.speed;
    const buffer = ctx.createBuffer(1, data.length, Math.max(3000, Math.min(384000, rate)));
    buffer.copyToChannel(Float32Array.from(data), 0);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.6 * this.volume();
    src.buffer = buffer;
    src.playbackRate.value = rate / buffer.sampleRate;
    src.connect(gain).connect(ctx.destination);
    src.onended = () => { if (this.playing?.src === src) this.stop(); };
    src.start();
    this.playing = { src, gain, ctx, from: a, at: ctx.currentTime, rate };
    this.updatePlay();
    const tick = () => {
      if (!this.playing || this.playing.src !== src) return;
      this.drawGraph();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  stop() {
    if (!this.playing) return;
    const p = this.playing;
    this.playing = null;
    try { p.src.stop(); } catch { /* already ended */ }
    p.gain.disconnect();
    this.updatePlay();
    this.drawGraph();
  }
  updatePlay() {
    const b = this.root.querySelector('[data-act="play"]');
    if (b) { b.textContent = this.playing ? this.t('stop') : this.t('listen'); b.setAttribute('aria-pressed', String(!!this.playing)); }
  }

  // ---------- UI ----------
  build() {
    const T = (k) => this.t(k);
    const btn = (act, label, tip = '') => `<button type="button" class="btn small" data-act="${act}" title="${tip}">${label}</button>`;
    const tool = (k) => `<button type="button" class="btn small" data-tool="${k}">${T(k)}</button>`;
    const notes = [[1, 0], [2, 0], [3, 0]].map(([o, s]) => [noteRate(o, s), `o${o} c`]);
    this.root.innerHTML = `
      <div class="we-bar">
        <b class="we-title"></b>
        <span class="tool-group">${btn('undo', '↶ ' + T('undo'))}${btn('redo', '↷ ' + T('redo'))}</span>
        <span class="tool-group">${btn('play', T('listen'), T('listenTip'))}</span>
        <label title="${T('chipTip')}"><input type="checkbox" class="pe-chip"${this.chip ? ' checked' : ''}> ${T('chip')}</label>
        <label>${T('at')} <select class="pe-speed"><option value="own">${T('own')}</option>${notes.map(([r, n]) => `<option value="${r}">${n}</option>`).join('')}</select></label>
        <span class="we-spacer"></span>
        <span class="tool-group">${btn('apply', T('apply'), T('applyTip'))}${btn('done', T('done'), T('doneTip'))}${btn('cancel', T('cancel'), T('cancelTip'))}</span>
      </div>
      <div class="pe-fields">
        <label>${T('name')} <input type="text" class="pe-name" maxlength="${this.def?.nameMax ?? 16}" spellcheck="false"></label>
        <label title="${T('volumeTip')}">${T('volume')} <input type="number" class="pe-vol" min="0" max="65535"></label>
        <span class="tool-group">${btn('selAll', T('selAll'))}${btn('zoomSel', T('zoomSel'))}${btn('fit', T('fit'))}</span>
      </div>
      <div class="pe-main">
        <canvas class="pe-canvas" tabindex="0"></canvas>
        <p class="we-hint"><span class="pe-info"></span> <span class="pe-pitch"></span> <span class="pe-sel"></span></p>
        <p class="we-hint">${T('hint')}</p>
        <p class="pe-warn" hidden>${T('tooLong')}</p>
      </div>
      <div class="pe-tools">
        <span class="tool-group">${['trim', 'del', 'silence'].map(tool).join('')}</span>
        <span class="tool-group">${['fadeIn', 'fadeOut', 'normalize'].map(tool).join('')}</span>
        <span class="tool-group">${['reverse', 'invert', 'dc'].map(tool).join('')}</span>
        <span class="we-tool"><span>${T('amplify')}</span><input type="number" min="0" max="1000" value="150" data-arg="amplify"><button type="button" class="btn small" data-tool="amplify">${T('run')}</button></span>
        <span class="we-tool" title="${T('resampleTip')}"><span>${T('resample')}</span>
          <select class="pe-rate">${notes.map(([r, n]) => `<option value="${r}">${n} (${(r / 1000).toFixed(1)} kHz)</option>`).join('')}<option value="custom">Hz…</option></select>
          <input type="number" class="pe-hz" min="1000" max="96000" value="16000" hidden>
          <button type="button" class="btn small" data-tool="resample">${T('run')}</button></span>
      </div>`;
    const q = (s) => this.root.querySelector(s);
    this.root.querySelectorAll('[data-tool]').forEach((b) => { b.onclick = () => this.tool(b.dataset.tool); });
    this.root.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => this.act(b.dataset.act); });
    q('.pe-chip').onchange = (e) => { this.chip = e.target.checked; };
    q('.pe-speed').value = this.speed;
    q('.pe-speed').onchange = (e) => { this.speed = e.target.value; };
    q('.pe-rate').onchange = (e) => { q('.pe-hz').hidden = e.target.value !== 'custom'; };
    q('.pe-name').value = this.name;
    q('.pe-name').oninput = (e) => { this.name = e.target.value; this.renderTitle(); };
    q('.pe-vol').value = this.vol;
    q('.pe-vol').oninput = (e) => { this.vol = Math.max(0, Math.min(65535, Math.round(+e.target.value || 0))); };
    this.wireCanvas(q('.pe-canvas'));
    this.root.onkeydown = (e) => {
      if (e.target.matches('input, select')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); this.act(e.shiftKey ? 'redo' : 'undo'); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); this.act('redo'); }
      else if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); this.act('selAll'); }
      else if (e.key === ' ') { e.preventDefault(); this.play(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.tool('del'); }
      else if (e.key === 'Escape') { e.preventDefault(); this.act('cancel'); }
    };
  }

  act(what) {
    switch (what) {
      case 'undo': this.restore(this.history, this.future); return;
      case 'redo': this.restore(this.future, this.history); return;
      case 'play': this.play(); return;
      case 'apply': this.stop(); this.onApply(this.result()); return;
      case 'done': this.stop(); this.onApply(this.result()); this.onClose(); return;
      case 'cancel': this.stop(); this.onClose(); return;
      case 'selAll': this.sel = this.samples.length ? [0, this.samples.length] : null; this.render(); return;
      case 'zoomSel': if (this.sel && this.sel[1] - this.sel[0] >= 8) { this.view = this.sel.slice(); this.render(); } return;
      case 'fit': this.view = [0, this.samples.length]; this.render(); return;
    }
  }

  wireCanvas(canvas) {
    let down = null;
    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      const [a, b] = this.view;
      return Math.max(0, Math.min(this.samples.length, Math.round(a + ((e.clientX - r.left) / r.width) * (b - a))));
    };
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      canvas.focus();
      down = at(e);
      this.sel = null;
      this.render();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (down === null) return;
      const x = at(e);
      this.sel = x === down ? null : [Math.min(down, x), Math.max(down, x)];
      this.renderInfo();
      this.drawGraph();
    });
    const up = () => { down = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => {
      if (!this.samples.length) return;
      e.preventDefault();
      const [a, b] = this.view, x = at(e);
      const k = e.deltaY > 0 ? 1.25 : 0.8;
      const span = Math.max(16, Math.min(this.samples.length, (b - a) * k));
      let na = Math.round(x - ((x - a) / (b - a)) * span);
      na = Math.max(0, Math.min(this.samples.length - span, na));
      this.view = [na, Math.round(na + span)];
      this.drawGraph();
    }, { passive: false });
    new ResizeObserver(() => this.drawGraph()).observe(canvas);
  }

  renderTitle() {
    const d = this.def || {};
    this.root.querySelector('.we-title').textContent = `${this.t('title')} — ${d.title ?? ''}${this.name ? ` "${this.name}"` : ''}`;
  }

  renderInfo() {
    const n = this.samples.length, bytes = Math.ceil(n / 8) * 4;
    this.root.querySelector('.pe-info').textContent = this.t('info', n, Math.round(this.rate), (n / this.rate).toFixed(2), bytes);
    const note = rateNote(this.rate);
    const cents = Math.round(note.cents);
    this.root.querySelector('.pe-pitch').textContent = '· ' + this.t('pitch', note.text, cents ? ` (${cents > 0 ? '+' : ''}${cents}¢)` : '');
    this.root.querySelector('.pe-sel').textContent = this.sel ? '· ' + this.t('sel', this.sel[0], this.sel[1], this.sel[1] - this.sel[0]) : '';
    this.root.querySelector('.pe-warn').hidden = bytes <= MAX_BYTES;
  }

  render() {
    if (this.root.hidden) return;
    this.renderTitle();
    this.renderInfo();
    this.drawGraph();
  }

  drawGraph() {
    const canvas = this.root.querySelector('.pe-canvas');
    if (!canvas || this.root.hidden) return;
    const css = getComputedStyle(document.documentElement);
    const col = (n) => css.getPropertyValue(n).trim();
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = col('--code-bg');
    g.fillRect(0, 0, w, h);
    const [a, b] = this.view, span = Math.max(1, b - a);
    const x = (i) => ((i - a) / span) * w;
    if (this.sel) {
      g.fillStyle = col('--sel');
      g.fillRect(x(this.sel[0]), 0, Math.max(1, x(this.sel[1]) - x(this.sel[0])), h);
    }
    g.strokeStyle = col('--line');
    g.lineWidth = 1;
    for (const v of [-0.5, 0.5]) { g.setLineDash([3, 4]); g.beginPath(); g.moveTo(0, Math.round(h / 2 - (v * h) / 2) + .5); g.lineTo(w, Math.round(h / 2 - (v * h) / 2) + .5); g.stroke(); }
    g.setLineDash([]);
    g.strokeStyle = col('--muted');
    g.beginPath(); g.moveTo(0, Math.round(h / 2) + .5); g.lineTo(w, Math.round(h / 2) + .5); g.stroke();
    const s = this.samples;
    g.strokeStyle = col('--accent2');
    g.fillStyle = col('--accent2');
    if (span <= w) {
      g.lineWidth = 1.5;
      g.beginPath();
      for (let i = a; i < b; i++) { const y = h / 2 - (s[i] * h) / 2; if (i === a) g.moveTo(x(i), y); else g.lineTo(x(i), y); }
      g.stroke();
      if (span <= w / 6) for (let i = a; i < b; i++) { g.beginPath(); g.arc(x(i), h / 2 - (s[i] * h) / 2, 2, 0, 2 * Math.PI); g.fill(); }
    } else {
      for (let px = 0; px < w; px++) {
        const from = a + Math.floor((px / w) * span), to = Math.max(from + 1, a + Math.floor(((px + 1) / w) * span));
        let lo = 1, hi = -1;
        for (let i = from; i < to && i < s.length; i++) { if (s[i] < lo) lo = s[i]; if (s[i] > hi) hi = s[i]; }
        if (hi < lo) continue;
        g.fillRect(px, h / 2 - (hi * h) / 2, 1, Math.max(1, ((hi - lo) * h) / 2));
      }
    }
    if (this.playing) {
      const p = this.playing;
      const pos = p.from + (p.ctx.currentTime - p.at) * p.rate;
      g.strokeStyle = col('--ink');
      g.beginPath(); g.moveTo(Math.round(x(pos)) + .5, 0); g.lineTo(Math.round(x(pos)) + .5, h); g.stroke();
    }
    g.fillStyle = col('--muted');
    g.font = '11px ui-monospace, Menlo, Consolas, monospace';
    g.fillText(`${a}`, 4, h - 4);
    const end = `${b}`;
    g.fillText(end, w - 4 - g.measureText(end).width, h - 4);
  }
}
