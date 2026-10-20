// SCC wave editor, modelled on Furnace's wavetable editor (src/gui/waveEdit.cpp):
// draw on the graph, or generate the wave from shapes (sine / triangle / saw / pulse with
// 16 harmonics) or a 4-operator FM network, then reshape it with the wave tools. It takes
// the place of the text editor; Apply writes the definition back into the song.
// Samples are signed 8-bit (-128..127): 32 for SCC parts, 64 for #SSGExtend waves.

const TEXT = {
  title: { en: 'SCC wave editor', ko: 'SCC 파형 편집', ja: 'SCC波形エディタ' },
  undo: { en: 'Undo', ko: '되돌리기', ja: '元に戻す' },
  redo: { en: 'Redo', ko: '다시 하기', ja: 'やり直し' },
  steps: { en: 'Steps', ko: '계단', ja: 'ステップ' },
  lines: { en: 'Lines', ko: '선', ja: '線' },
  listen: { en: '▶ Listen', ko: '▶ 듣기', ja: '▶ 試聴' },
  stopListen: { en: '■ Stop', ko: '■ 멈춤', ja: '■ 停止' },
  listenTip: { en: 'Play this wave as a held note', ko: '이 파형을 음으로 계속 들려줍니다', ja: 'この波形を音として鳴らし続けます' },
  apply: { en: 'Apply', ko: '적용', ja: '適用' },
  applyTip: { en: 'Write the wave into the song and keep editing', ko: '파형을 곡에 쓰고 계속 편집', ja: '波形を曲に書き込んで編集を続ける' },
  done: { en: 'Done', ko: '완료', ja: '完了' },
  doneTip: { en: 'Write the wave into the song and return to the text', ko: '파형을 곡에 쓰고 텍스트로 돌아가기', ja: '波形を曲に書き込んでテキストに戻る' },
  cancel: { en: 'Cancel', ko: '취소', ja: 'キャンセル' },
  cancelTip: { en: 'Return to the text without writing (changes already applied stay)', ko: '쓰지 않고 텍스트로 돌아가기 (이미 적용한 것은 남음)', ja: '書き込まずにテキストへ戻る（適用済みの変更は残る）' },
  drawHint: { en: 'Draw on the graph with the mouse or a finger.', ko: '마우스나 손가락으로 그래프에 그리세요.', ja: 'マウスや指でグラフに描きます。' },
  shapes: { en: 'Shapes', ko: '도형', ja: 'シェイプ' },
  fm: { en: 'FM', ko: 'FM', ja: 'FM' },
  tools: { en: 'WaveTools', ko: '도구', ja: 'ツール' },
  shape: { en: 'Shape', ko: '모양', ja: '形' },
  sine: { en: 'Sine', ko: '사인', ja: 'サイン' },
  triangle: { en: 'Triangle', ko: '삼각', ja: '三角' },
  saw: { en: 'Saw', ko: '톱니', ja: 'のこぎり' },
  pulse: { en: 'Pulse', ko: '펄스', ja: 'パルス' },
  duty: { en: 'Duty', ko: '듀티', ja: 'デューティ' },
  exponent: { en: 'Exponent', ko: '지수', ja: '指数' },
  xor: { en: 'XOR point', ko: 'XOR 지점', ja: 'XORポイント' },
  harmonics: { en: 'Amplitude / phase of each harmonic', ko: '배음별 진폭 / 위상', ja: '倍音ごとの振幅 / 位相' },
  amp: { en: 'Amp', ko: '진폭', ja: '振幅' },
  phase: { en: 'Phase', ko: '위상', ja: '位相' },
  genNote: { en: 'Changing a setting here replaces the wave.', ko: '여기 설정을 바꾸면 파형이 새로 만들어집니다.', ja: 'ここの設定を変えると波形が作り直されます。' },
  op: { en: 'Op', ko: 'Op', ja: 'Op' },
  level: { en: 'Level', ko: '레벨', ja: 'レベル' },
  mult: { en: 'Mult', ko: '배수', ja: '倍率' },
  fb: { en: 'FB', ko: 'FB', ja: 'FB' },
  waveform: { en: 'Waveform', ko: '파형', ja: '波形' },
  connection: { en: 'Connection: each row is an operator, the boxes are what it hears (1-4) and whether it goes to the output (Out)', ko: '연결: 각 행이 오퍼레이터, 칸은 입력으로 받는 오퍼레이터(1-4)와 출력(Out) 여부', ja: '接続: 各行がオペレータ、チェックは入力として受けるオペレータ（1-4）と出力（Out）' },
  out: { en: 'Out', ko: 'Out', ja: 'Out' },
  offsetX: { en: 'Offset X', ko: '가로 이동', ja: 'Xオフセット' },
  offsetY: { en: 'Offset Y', ko: '세로 이동', ja: 'Yオフセット' },
  smooth: { en: 'Smooth', ko: '부드럽게', ja: 'スムーズ' },
  amplify: { en: 'Amplify %', ko: '증폭 %', ja: '増幅 %' },
  run: { en: 'Apply', ko: '실행', ja: '実行' },
  normalize: { en: 'Normalize', ko: '정규화', ja: 'ノーマライズ' },
  invert: { en: 'Invert', ko: '뒤집기(상하)', ja: '上下反転' },
  reverse: { en: 'Reverse', ko: '거꾸로(좌우)', ja: '左右反転' },
  half: { en: 'Half', ko: '절반', ja: 'ハーフ' },
  double: { en: 'Double', ko: '두 배', ja: 'ダブル' },
  randomize: { en: 'Randomize', ko: '무작위', ja: 'ランダム' },
  clear: { en: 'Clear', ko: '0으로', ja: 'クリア' },
  dec: { en: 'Dec', ko: '10진', ja: '10進' },
  hex: { en: 'Hex', ko: '16진', ja: '16進' },
  values: { en: 'Values', ko: '값', ja: '値' },
  valuesTip: { en: 'Edit the numbers directly, then press Enter', ko: '숫자를 직접 고치고 Enter', ja: '数値を直接編集してEnter' },
  badValues: { en: (n) => `Needs ${n} values from -128 to 127 (hex 00-FF).`, ko: (n) => `-128~127(16진 00-FF) 값이 ${n}개 필요합니다.`, ja: (n) => `-128~127（16進 00-FF）の値が${n}個必要です。` },
  mml: { en: 'In the song', ko: '곡에 쓰이는 형태', ja: '曲に書かれる形' },
  sample: { en: (i, v) => `#${i}: ${v}`, ko: (i, v) => `#${i}: ${v}`, ja: (i, v) => `#${i}: ${v}` },
  ssgNote: { en: '64 samples (#SSGExtend); the player averages pairs down to 32.', ko: '64샘플(#SSGExtend). 플레이어가 두 개씩 평균 내어 32개로 연주합니다.', ja: '64サンプル（#SSGExtend）。プレーヤーが2つずつ平均して32個で演奏します。' },
};

// Furnace's FM operator waveforms (src/gui/util.cpp).
const sq = (x) => (((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) >= Math.PI ? -1 : 1);
const rsq = (x) => Math.max(0, sq(x));
const sawf = (x) => Math.atan(Math.tan(x / 2)) / (Math.PI / 2);
const tri = (x) => Math.asin(Math.sin(x)) / (Math.PI / 2);
const rsin = (x) => Math.max(0, Math.sin(x));
const asin_ = (x) => Math.abs(Math.sin(x));
const qsin = (x) => asin_(x) * rsq(2 * x);
const ssin = (x) => (Math.sin(x) >= 0 ? Math.sin(2 * x) : 0);
const rsaw = (x) => Math.max(0, sawf(x));
const asaw = (x) => (sawf(x) < 0 ? sawf(x) + 1 : sawf(x));
const rtri = (x) => Math.max(0, tri(x));
const atri = (x) => Math.abs(tri(x));
const qtri = (x) => atri(x) * rsq(2 * x);
const stri = (x) => (Math.sin(x) >= 0 ? tri(2 * x) : 0);
const cube = (f) => (x) => f(x) ** 3;
const FM_WAVES = [
  ['Sine', Math.sin], ['Rect. Sine', rsin], ['Abs. Sine', asin_], ['Quart. Sine', qsin], ['Squish. Sine', ssin], ['Abs. Squish. Sine', (x) => Math.abs(ssin(x))],
  ['Square', sq], ['Rect. Square', rsq],
  ['Saw', sawf], ['Rect. Saw', rsaw], ['Abs. Saw', asaw],
  ['Cubed Saw', cube(sawf)], ['Rect. Cubed Saw', cube(rsaw)], ['Abs. Cubed Saw', cube(asaw)],
  ['Cubed Sine', cube(Math.sin)], ['Rect. Cubed Sine', cube(rsin)], ['Abs. Cubed Sine', cube(asin_)], ['Quart. Cubed Sine', cube(qsin)], ['Squish. Cubed Sine', cube(ssin)], ['Squish. Abs. Cub. Sine', cube((x) => Math.abs(ssin(x)))],
  ['Triangle', tri], ['Rect. Triangle', rtri], ['Abs. Triangle', atri], ['Quart. Triangle', qtri], ['Squish. Triangle', stri], ['Abs. Squish. Triangle', (x) => Math.abs(stri(x))],
  ['Cubed Triangle', cube(tri)], ['Rect. Cubed Triangle', cube(rtri)], ['Abs. Cubed Triangle', cube(atri)], ['Quart. Cubed Triangle', cube(qtri)], ['Squish. Cubed Triangle', cube(stri)], ['Squish. Abs. Cub. Triangle', (x) => Math.abs(cube(stri)(x))],
];
const MULT = [Math.PI, ...Array.from({ length: 16 }, (_, i) => 2 * Math.PI * (i + 1))];

const clamp = (v) => Math.max(-128, Math.min(127, Math.round(v)));
// Furnace keeps waves unsigned 0..max; a generated value r in -1..1 becomes
// round((1+r)/2 * 255), here shifted to the signed range.
const fromUnit = (r) => Math.round(Math.max(0, Math.min(1, (1 + r) / 2)) * 255) - 128;

export class WaveEditor {
  constructor(root, { lang, onApply, onClose, audio, volume }) {
    this.root = root;
    this.lang = lang;            // () => 'en' | 'ko' | 'ja'
    this.onApply = onApply;      // (values) => void
    this.onClose = onClose;      // () => void
    this.audio = audio;          // () => AudioContext (created/resumed in the click)
    this.volume = volume;        // () => 0..1
    this.values = new Array(32).fill(0);
    this.history = [];
    this.future = [];
    this.style = 'steps';
    this.hex = false;
    this.shapeGen = { shape: 0, duty: 0.5, power: 1, xor: 1, amp: [1, ...new Array(15).fill(0)], phase: new Array(16).fill(0) };
    this.fmGen = { tl: [1, 0, 0, 0], mult: [1, 1, 1, 1], fb: [0, 0, 0, 0], wave: [0, 0, 0, 0],
      con: [[false, false, false, false, true], [false, false, false, false, false], [false, false, false, false, false], [false, false, false, false, false]] };
    this.tab = 'shapes';
    this.listening = null;
    this.build();
  }

  t(key, ...args) {
    const e = TEXT[key];
    const v = e[this.lang()] ?? e.en;
    return typeof v === 'function' ? v(...args) : v;
  }

  get isOpen() { return !this.root.hidden; }

  open(def) {
    this.def = def;
    this.values = Array.from({ length: def.expected }, (_, i) => clamp(Number.isFinite(def.values[i]) ? def.values[i] : 0));
    this.history = [];
    this.future = [];
    this.root.hidden = false;
    this.build();
    this.render();
  }

  close() {
    this.stopListen();
    this.root.hidden = true;
  }

  // ---------- history ----------
  snapshot() {
    this.history.push(this.values.slice());
    if (this.history.length > 200) this.history.shift();
    this.future = [];
  }
  undo() { if (this.history.length) { this.future.push(this.values); this.values = this.history.pop(); this.changed(); } }
  redo() { if (this.future.length) { this.history.push(this.values); this.values = this.future.pop(); this.changed(); } }
  set(values, record = true) {
    if (record) this.snapshot();
    this.values = values.map(clamp);
    this.changed();
  }
  changed() {
    this.render();
    if (this.listening) this.startListen();
  }

  // ---------- generators (Furnace doGenerateWave) ----------
  generateShapes() {
    const g = this.shapeGen, len = this.values.length;
    const out = new Array(len).fill(0);
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < 16; j++) {
        if (!g.amp[j]) continue;
        const pos = ((g.phase[j] * len) + i * (j + 1)) % len;
        let p;
        if (g.shape === 0) p = Math.sin((0.5 + pos) * 2 * Math.PI / len);
        else if (g.shape === 1) p = 4 * (0.5 - Math.abs(0.5 - pos / (len - 1))) - 1;
        else if (g.shape === 2) p = (2 * pos) / (len - 1) - 1;
        else p = pos >= g.duty * len ? 1 : -1;
        out[i] += (p ** g.power) * g.amp[j];
      }
    }
    for (let i = Math.floor(g.xor * len); i < len; i++) out[i] = -out[i];
    return out.map(fromUnit);
  }

  generateFm() {
    const g = this.fmGen, len = this.values.length;
    const out = new Array(len).fill(0);
    const fb = [[0, 0], [0, 0], [0, 0], [0, 0]];
    const s = [0, 0, 0, 1];
    for (let i = 0; i < len; i++) {
      const pos = i / len;
      for (let k = 0; k < 4; k++) {
        let x = pos + (g.fb[k] ? (fb[k][0] + fb[k][1]) * 2 ** (g.fb[k] - 8) : 0);
        for (let j = 3; j >= 0; j--) if (g.con[k][j]) x += s[j];
        s[k] = FM_WAVES[g.wave[k]][1](x * MULT[g.mult[k]]) * g.tl[k];
        fb[k][0] = fb[k][1];
        fb[k][1] = s[k];
      }
      for (let k = 0; k < 4; k++) if (g.con[k][4]) out[i] += s[k];
    }
    return out.map(fromUnit);
  }

  // ---------- wave tools ----------
  tool(name, arg) {
    const v = this.values, len = v.length;
    const out = v.slice();
    switch (name) {
      case 'offsetX': { const n = Math.round(arg) || 0; for (let i = 0; i < len; i++) out[i] = v[(((i - n) % len) + len) % len]; break; }
      case 'offsetY': for (let i = 0; i < len; i++) out[i] = v[i] + (Math.round(arg) || 0); break;
      case 'smooth': {
        const n = Math.max(1, Math.min(len, Math.round(arg) || 1));
        for (let i = 0; i < len; i++) {
          let sum = 0;
          for (let j = i; j < i + n + 1; j++) sum += v[(((j - Math.floor((n + 1) / 2)) % len) + len) % len];
          out[i] = Math.trunc(sum / (n + 1));
        }
        break;
      }
      case 'amplify': for (let i = 0; i < len; i++) out[i] = v[i] * (Number(arg) || 0) / 100; break;
      case 'normalize': {
        const lo = Math.min(...v), hi = Math.max(...v);
        if (lo === hi || (lo === -128 && hi === 127)) return;
        for (let i = 0; i < len; i++) out[i] = Math.trunc(((v[i] - lo) * 255) / (hi - lo)) - 128;
        break;
      }
      case 'invert': for (let i = 0; i < len; i++) out[i] = -1 - v[i]; break;
      case 'reverse': for (let i = 0; i < len; i++) out[i] = v[len - 1 - i]; break;
      case 'half': for (let i = 0; i < len; i++) out[i] = v[i >> 1]; break;
      case 'double': for (let i = 0; i < len; i++) out[i] = v[(i * 2) % len]; break;
      case 'randomize': for (let i = 0; i < len; i++) out[i] = Math.floor(Math.random() * 256) - 128; break;
      case 'clear': out.fill(0); break;
      default: return;
    }
    this.set(out);
  }

  // ---------- listening ----------
  startListen() {
    const ctx = this.audio();
    if (!ctx) return;
    const freq = 261.63 * 2 ** ((this.octave ?? 4) - 4);
    const period = Math.max(this.values.length, Math.round(ctx.sampleRate / freq));
    const periods = Math.max(1, Math.round(ctx.sampleRate * 0.05 / period));   // ~50 ms loop
    const buffer = ctx.createBuffer(1, period * periods, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const len = this.values.length;
    for (let k = 0; k < data.length; k++) data[k] = this.values[Math.floor(((k % period) * len) / period)] / 128;
    if (!this.listening) {
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      this.listening = { gain, source: null };
    }
    this.listening.gain.gain.value = 0.25 * this.volume();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.listening.gain);
    src.start();
    this.listening.source?.stop();
    this.listening.source = src;
    this.updateListenButton();
  }
  stopListen() {
    if (!this.listening) return;
    this.listening.source?.stop();
    this.listening.gain.disconnect();
    this.listening = null;
    this.updateListenButton();
  }
  updateListenButton() {
    const b = this.root.querySelector('[data-act="listen"]');
    if (b) { b.textContent = this.listening ? this.t('stopListen') : this.t('listen'); b.setAttribute('aria-pressed', String(!!this.listening)); }
  }

  // ---------- serialisation ----------
  text() {
    const v = this.values;
    if (v.length === 64) return v.map((x) => (this.hex ? ((x + 256) & 255).toString(16).toUpperCase().padStart(2, '0') : String(x))).join(',');
    return v.map((x) => (this.hex ? ((x + 256) & 255).toString(16).toUpperCase().padStart(2, '0') : String(x))).join(',');
  }
  parse(text) {
    const tokens = text.split(/[,\s]+/).filter(Boolean);
    const out = tokens.map((s) => {
      if (this.hex || s.startsWith('$')) {
        const h = s.replace(/^\$/, '');
        if (!/^[0-9a-f]{1,2}$/i.test(h)) return NaN;
        const n = parseInt(h, 16);
        return n > 127 ? n - 256 : n;
      }
      return /^-?\d+$/.test(s) && +s >= -128 && +s <= 127 ? +s : NaN;
    });
    return out.length === this.values.length && out.every(Number.isFinite) ? out : null;
  }

  // ---------- UI ----------
  build() {
    const T = (k) => this.t(k);
    const shapeNames = ['sine', 'triangle', 'saw', 'pulse'].map(T);
    this.root.innerHTML = `
      <div class="we-bar">
        <b class="we-title"></b>
        <span class="tool-group"><button type="button" class="btn small" data-act="undo">↶ ${T('undo')}</button><button type="button" class="btn small" data-act="redo">↷ ${T('redo')}</button></span>
        <span class="tool-group" role="group"><button type="button" class="btn small" data-style="steps">${T('steps')}</button><button type="button" class="btn small" data-style="lines">${T('lines')}</button></span>
        <button type="button" class="btn small" data-act="listen" title="${T('listenTip')}">${T('listen')}</button>
        <select class="we-oct" aria-label="Octave">${[2, 3, 4, 5, 6].map((o) => `<option value="${o}"${o === (this.octave ?? 4) ? ' selected' : ''}>o${o} C</option>`).join('')}</select>
        <span class="spacer"></span>
        <button type="button" class="btn small" data-act="apply" title="${T('applyTip')}">${T('apply')}</button>
        <button type="button" class="btn small primary" data-act="done" title="${T('doneTip')}">${T('done')}</button>
        <button type="button" class="btn small" data-act="cancel" title="${T('cancelTip')}">${T('cancel')}</button>
      </div>
      <div class="we-main">
        <div class="we-graph">
          <canvas class="we-canvas"></canvas>
          <p class="we-hint"><span class="we-pos"></span> ${T('drawHint')} <span class="we-ssg"></span></p>
        </div>
        <div class="we-side">
          <div class="we-tabs" role="tablist">
            <button type="button" role="tab" data-tab="shapes">${T('shapes')}</button><button type="button" role="tab" data-tab="fm">${T('fm')}</button><button type="button" role="tab" data-tab="tools">${T('tools')}</button>
          </div>
          <div class="we-panes">
          <div class="we-pane" data-pane="shapes">
            <p class="we-note">${T('genNote')}</p>
            <label>${T('shape')} <select data-g="shape">${shapeNames.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select></label>
            <label class="we-duty">${T('duty')} <input type="range" min="0" max="1" step="0.01" data-g="duty"><output></output></label>
            <label>${T('exponent')} <input type="range" min="1" max="8" step="1" data-g="power"><output></output></label>
            <label>${T('xor')} <input type="range" min="0" max="1" step="0.01" data-g="xor"><output></output></label>
            <details><summary>${T('harmonics')}</summary>
              <table class="we-harm"><tr><th>#</th><th>${T('amp')}</th><th>${T('phase')}</th></tr>
              ${Array.from({ length: 16 }, (_, j) => `<tr><td>${j + 1}</td><td><input type="range" min="-1" max="1" step="0.01" data-h="amp" data-i="${j}"></td><td><input type="range" min="0" max="1" step="0.01" data-h="phase" data-i="${j}"></td></tr>`).join('')}
              </table></details>
          </div>
          <div class="we-pane" data-pane="fm">
            <p class="we-note">${T('genNote')}</p>
            <table class="we-fm"><tr><th>${T('op')}</th><th>${T('level')}</th><th>${T('mult')}</th><th>${T('fb')}</th></tr>
            ${[0, 1, 2, 3].map((k) => `<tr><td>${k + 1}</td><td><input type="range" min="0" max="1" step="0.01" data-f="tl" data-k="${k}"></td><td><input type="number" min="1" max="16" data-f="mult" data-k="${k}"></td><td><input type="number" min="0" max="7" data-f="fb" data-k="${k}"></td></tr>`).join('')}
            </table>
            <table class="we-fm"><tr><th>${T('op')}</th><th>${T('waveform')}</th></tr>
            ${[0, 1, 2, 3].map((k) => `<tr><td>${k + 1}</td><td><select data-f="wave" data-k="${k}">${FM_WAVES.map((w, i) => `<option value="${i}">${w[0]}</option>`).join('')}</select></td></tr>`).join('')}
            </table>
            <p class="we-note">${T('connection')}</p>
            <table class="we-con"><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>${T('out')}</th></tr>
            ${[0, 1, 2, 3].map((k) => `<tr><td>${k + 1}</td>${[0, 1, 2, 3, 4].map((j) => `<td><input type="checkbox" data-c="${k}" data-j="${j}"></td>`).join('')}</tr>`).join('')}
            </table>
          </div>
          <div class="we-pane" data-pane="tools">
            ${[['offsetX', -31, 31, 1], ['offsetY', -255, 255, 0], ['smooth', 1, 32, 1], ['amplify', 0, 400, 150]].map(([k, lo, hi, d]) =>
              `<div class="we-tool"><span>${T(k)}</span><input type="number" min="${lo}" max="${hi}" value="${d}" data-arg="${k}"><button type="button" class="btn small" data-tool="${k}">${T('run')}</button></div>`).join('')}
            <div class="we-buttons">${['normalize', 'invert', 'reverse', 'half', 'double', 'randomize', 'clear'].map((k) => `<button type="button" class="btn small" data-tool="${k}">${T(k)}</button>`).join('')}</div>
          </div>
          </div>
        </div>
      </div>
      <div class="we-values">
        <span class="tool-group" role="group"><button type="button" class="btn small" data-radix="dec">${T('dec')}</button><button type="button" class="btn small" data-radix="hex">${T('hex')}</button></span>
        <input type="text" class="we-text" spellcheck="false" aria-label="${T('values')}" title="${T('valuesTip')}">
        <p class="we-bad"></p>
        <p class="we-mml"><span>${T('mml')}:</span> <code></code></p>
      </div>`;
    this.wire();
    this.syncControls();
  }

  wire() {
    const q = (s) => this.root.querySelector(s);
    const all = (s) => this.root.querySelectorAll(s);
    q('[data-act="undo"]').onclick = () => this.undo();
    q('[data-act="redo"]').onclick = () => this.redo();
    q('[data-act="listen"]').onclick = () => (this.listening ? this.stopListen() : this.startListen());
    q('.we-oct').onchange = (e) => { this.octave = +e.target.value; if (this.listening) this.startListen(); };
    q('[data-act="apply"]').onclick = () => this.onApply(this.values.slice());
    q('[data-act="done"]').onclick = () => { this.onApply(this.values.slice()); this.close(); this.onClose(); };
    q('[data-act="cancel"]').onclick = () => { this.close(); this.onClose(); };
    all('[data-style]').forEach((b) => { b.onclick = () => { this.style = b.dataset.style; this.render(); }; });
    all('[data-tab]').forEach((b) => { b.onclick = () => { this.tab = b.dataset.tab; this.syncControls(); }; });
    all('[data-radix]').forEach((b) => { b.onclick = () => { this.hex = b.dataset.radix === 'hex'; this.render(); }; });
    all('[data-tool]').forEach((b) => {
      b.onclick = () => { const arg = q(`[data-arg="${b.dataset.tool}"]`); this.tool(b.dataset.tool, arg ? Number(arg.value) : undefined); };
    });
    // Generators: the first change of a gesture records the old wave for undo.
    let gesture = false;
    const regen = (fn) => (e) => {
      if (!gesture) { this.snapshot(); gesture = true; }
      fn(e);
      this.values = (this.tab === 'fm' ? this.generateFm() : this.generateShapes()).map(clamp);
      this.syncControls(true);
      this.changed();
    };
    const end = () => { gesture = false; };
    const g = this.shapeGen, f = this.fmGen;
    all('[data-g]').forEach((el) => {
      el.addEventListener('input', regen((e) => { g[el.dataset.g] = +e.target.value; }));
      el.addEventListener('change', end);
    });
    all('[data-h]').forEach((el) => {
      el.addEventListener('input', regen((e) => { g[el.dataset.h][+el.dataset.i] = +e.target.value; }));
      el.addEventListener('change', end);
    });
    all('[data-f]').forEach((el) => {
      el.addEventListener('input', regen((e) => {
        const k = +el.dataset.k, key = el.dataset.f;
        const lim = { tl: [0, 1], mult: [1, 16], fb: [0, 7], wave: [0, FM_WAVES.length - 1] }[key];
        f[key][k] = Math.max(lim[0], Math.min(lim[1], +e.target.value || 0));
      }));
      el.addEventListener('change', end);
    });
    all('[data-c]').forEach((el) => {
      el.addEventListener('change', (e) => { regen(() => { f.con[+el.dataset.c][+el.dataset.j] = e.target.checked; })(e); end(); });
    });
    const text = q('.we-text');
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); text.blur(); } });
    text.addEventListener('change', () => {
      const v = this.parse(text.value);
      q('.we-bad').textContent = v ? '' : this.t('badValues', this.values.length);
      if (v) this.set(v);
    });
    this.root.addEventListener('keydown', (e) => {
      if (e.target === text) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); }
    });
    this.wireCanvas(q('.we-canvas'));
  }

  // Drawing: each move fills every column between the last point and this one, so a quick
  // stroke leaves no gaps (Furnace's processDrags).
  wireCanvas(canvas) {
    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      const len = this.values.length;
      const i = Math.max(0, Math.min(len - 1, Math.floor(((e.clientX - r.left) / r.width) * len)));
      const v = clamp(127 - ((e.clientY - r.top) / r.height) * 255);
      return { i, v };
    };
    let last = null;
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      this.snapshot();
      last = point(e);
      this.values[last.i] = last.v;
      this.changed();
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = point(e);
      this.root.querySelector('.we-pos').textContent = this.t('sample', p.i, last ? p.v : this.values[p.i]);
      if (!last) { this.hover = p.i; this.drawGraph(); return; }
      const [a, b] = last.i <= p.i ? [last, p] : [p, last];
      for (let i = a.i; i <= b.i; i++) this.values[i] = b.i === a.i ? p.v : clamp(a.v + ((b.v - a.v) * (i - a.i)) / (b.i - a.i));
      last = p;
      this.changed();
    });
    const up = () => { last = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { if (!last) { this.hover = -1; this.drawGraph(); } });
    new ResizeObserver(() => this.drawGraph()).observe(canvas);
  }

  syncControls(keepGenerators = false) {
    const q = (s) => this.root.querySelector(s);
    const all = (s) => this.root.querySelectorAll(s);
    all('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === this.tab)));
    all('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== this.tab; });
    if (keepGenerators && document.activeElement && this.root.contains(document.activeElement)) {
      // Leave the control being dragged alone; only refresh the readouts.
    }
    const g = this.shapeGen, f = this.fmGen;
    all('[data-g]').forEach((el) => { el.value = g[el.dataset.g]; const o = el.nextElementSibling; if (o && o.tagName === 'OUTPUT') o.textContent = (+g[el.dataset.g]).toFixed(el.step === '1' ? 0 : 2); });
    q('.we-duty').hidden = g.shape !== 3;
    all('[data-h]').forEach((el) => { el.value = g[el.dataset.h][+el.dataset.i]; });
    all('[data-f]').forEach((el) => { el.value = f[el.dataset.f][+el.dataset.k]; });
    all('[data-c]').forEach((el) => { el.checked = f.con[+el.dataset.c][+el.dataset.j]; });
  }

  render() {
    const q = (s) => this.root.querySelector(s);
    if (!this.def) return;
    q('.we-title').textContent = `@W${this.def.id} · ${this.t('title')} (${this.values.length} × 8 bit)`;
    q('.we-ssg').textContent = this.values.length === 64 ? this.t('ssgNote') : '';
    this.root.querySelectorAll('[data-style]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === this.style)));
    this.root.querySelectorAll('[data-radix]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.radix === 'hex') === this.hex)));
    q('[data-act="undo"]').disabled = !this.history.length;
    q('[data-act="redo"]').disabled = !this.future.length;
    const text = q('.we-text');
    if (document.activeElement !== text) text.value = this.text();
    q('.we-mml code').textContent = this.serialize(this.def.indent ?? '  ').split('\n')[0] + (this.values.length === 64 ? ' …' : '');
    this.drawGraph();
  }

  // The definition as it goes into the song.
  serialize(indent) {
    const v = this.values;
    if (v.length === 64) {
      const rows = [];
      for (let r = 0; r < 4; r++) rows.push(indent + ' ' + v.slice(r * 16, r * 16 + 16).join(','));
      return [`${indent}@W${this.def.id}`, ...rows].join('\n');
    }
    return `${indent}@W${this.def.id}:{ ${v.join(',')} }`;
  }

  drawGraph() {
    const canvas = this.root.querySelector('.we-canvas');
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
    const len = this.values.length, step = w / len;
    const y = (v) => ((127 - v) / 255) * h;
    g.strokeStyle = col('--line');
    g.lineWidth = 1;
    for (let i = 0; i <= len; i++) { const x = Math.round(i * step) + .5; g.globalAlpha = i % 8 ? 0.35 : 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.globalAlpha = 1;
    for (const v of [-128, -64, 64, 127]) { g.setLineDash([3, 4]); g.beginPath(); g.moveTo(0, Math.round(y(v)) + .5); g.lineTo(w, Math.round(y(v)) + .5); g.stroke(); }
    g.setLineDash([]);
    g.strokeStyle = col('--muted');
    g.beginPath(); g.moveTo(0, Math.round(y(0)) + .5); g.lineTo(w, Math.round(y(0)) + .5); g.stroke();
    g.fillStyle = col('--muted');
    g.font = '11px ui-monospace, Menlo, Consolas, monospace';
    g.fillText('127', 4, 12); g.fillText('0', 4, y(0) - 4); g.fillText('-128', 4, h - 4);
    if (this.hover >= 0 && this.hover < len) { g.fillStyle = col('--sel'); g.fillRect(this.hover * step, 0, step, h); }
    const accent = col('--accent2');
    g.strokeStyle = accent;
    g.lineWidth = 2.5;
    g.beginPath();
    if (this.style === 'steps') {
      this.values.forEach((v, i) => { const yy = y(v); if (i) g.lineTo(i * step, yy); else g.moveTo(0, yy); g.lineTo((i + 1) * step, yy); });
    } else {
      this.values.forEach((v, i) => { const x = (i + 0.5) * step; if (i) g.lineTo(x, y(v)); else g.moveTo(x, y(v)); });
    }
    g.stroke();
    g.fillStyle = accent;
    this.values.forEach((v, i) => { g.beginPath(); g.arc((i + 0.5) * step, y(v), Math.min(4, step / 4), 0, 2 * Math.PI); g.fill(); });
  }
}
