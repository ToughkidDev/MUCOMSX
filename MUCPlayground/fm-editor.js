// OPNA FM voice editor, modelled on Furnace's FM instrument editor for OPN
// (src/gui/insEdit/insTabFM.cpp): pick the algorithm and feedback, set each operator's
// envelope (AR DR SL D2R RR), level (TL) and tuning (KS MULT DT) with sliders while the
// drawings follow, and listen to the voice. It takes the place of the text editor like the
// SCC wave editor; Apply writes the five lines of the definition back into the song.
//   "  @n"            (left as it is)
//   "   FB,ALG"
//   4 lines           OP1..OP4: AR,D1R,D2R,RR,D1L,TL,KS,ML,DT

import { ALGS, FIELDS, LIMITS, OP_COLORS, drawVoice, envelope } from './fm-preview.js';

const TEXT = {
  title: { en: 'FM voice editor (OPNA)', ko: 'FM 음색 편집 (OPNA)', ja: 'FM音色エディタ（OPNA）' },
  undo: { en: 'Undo', ko: '되돌리기', ja: '元に戻す' },
  redo: { en: 'Redo', ko: '다시 하기', ja: 'やり直し' },
  listen: { en: '▶ Listen', ko: '▶ 듣기', ja: '▶ 試聴' },
  listenTip: { en: 'Play one note with this voice (an approximation; Play in the toolbar plays the real chip)', ko: '이 음색으로 음 하나를 들려줍니다 (근사치. 실제 칩 소리는 툴바의 재생으로)', ja: 'この音色で1音鳴らします（近似。実際のチップの音はツールバーの再生で）' },
  init: { en: 'Init', ko: '초기화', ja: '初期化' },
  initTip: { en: 'Start over from Furnace\'s default FM voice', ko: 'Furnace의 기본 FM 음색에서 다시 시작', ja: 'Furnaceの初期FM音色からやり直す' },
  apply: { en: 'Apply', ko: '적용', ja: '適用' },
  applyTip: { en: 'Write the voice into the song and keep editing', ko: '음색을 곡에 쓰고 계속 편집', ja: '音色を曲に書き込んで編集を続ける' },
  done: { en: 'Done', ko: '완료', ja: '完了' },
  doneTip: { en: 'Write the voice into the song and return to the text', ko: '음색을 곡에 쓰고 텍스트로 돌아가기', ja: '音色を曲に書き込んでテキストに戻る' },
  cancel: { en: 'Cancel', ko: '취소', ja: 'キャンセル' },
  cancelTip: { en: 'Return to the text without writing (changes already applied stay)', ko: '쓰지 않고 텍스트로 돌아가기 (이미 적용한 것은 남음)', ja: '書き込まずにテキストへ戻る（適用済みの変更は残る）' },
  alg: { en: 'Algorithm', ko: '알고리즘', ja: 'アルゴリズム' },
  fb: { en: 'Feedback (OP1)', ko: '피드백 (OP1)', ja: 'フィードバック（OP1）' },
  carrier: { en: 'carrier', ko: '캐리어', ja: 'キャリア' },
  modulator: { en: 'modulator', ko: '모듈레이터', ja: 'モジュレータ' },
  carrierNote: { en: 'Heard directly: TL is its loudness.', ko: '직접 들리는 오퍼레이터: TL이 음량입니다.', ja: '直接聞こえるオペレータ: TLが音量です。' },
  modulatorNote: { en: 'Shapes the tone: higher TL = less brightness.', ko: '음색을 만드는 오퍼레이터: TL이 클수록 덜 밝아집니다.', ja: '音色を作るオペレータ: TLが大きいほど明るさが減ります。' },
  tlWarn: { en: 'TL is not 0 on a carrier: the compiler warns (W0408) and the part plays quieter than v says.', ko: '캐리어의 TL이 0이 아님: 컴파일러가 경고(W0408)하고 v보다 작게 들립니다.', ja: 'キャリアのTLが0でない: コンパイラが警告（W0408）し、vより小さく鳴ります。' },
  copy: { en: 'Copy', ko: '복사', ja: 'コピー' },
  paste: { en: 'Paste', ko: '붙여넣기', ja: '貼り付け' },
  copyTip: { en: 'Copy this operator', ko: '이 오퍼레이터 복사', ja: 'このオペレータをコピー' },
  pasteTip: { en: 'Paste the copied operator here', ko: '복사한 오퍼레이터를 여기에 붙여넣기', ja: 'コピーしたオペレータをここに貼り付け' },
  mml: { en: 'In the song', ko: '곡에 쓰이는 형태', ja: '曲に書かれる形' },
  textTip: { en: 'Edit the numbers directly (FB,ALG then OP1-OP4), then leave the box', ko: '숫자를 직접 고친 뒤 칸을 벗어나세요 (FB,ALG 다음 OP1-OP4)', ja: '数値を直接編集して欄を離れます（FB,ALGの後にOP1-OP4）' },
  badText: { en: 'Needs 5 lines: FB,ALG (0-7) and 9 numbers for each operator, in range.', ko: '5줄이 필요합니다: FB,ALG(0-7)와 오퍼레이터마다 범위 안의 숫자 9개.', ja: '5行が必要です: FB,ALG（0-7）と各オペレータの範囲内の数値9個。' },
  approx: { en: 'Drawings and Listen are a guide (no DT, no LFO); Play in the toolbar uses the real chip.', ko: '그림과 듣기는 참고용입니다 (DT, LFO 제외). 툴바의 재생은 실제 칩으로 연주합니다.', ja: '図と試聴は目安です（DT・LFOなし）。ツールバーの再生は実際のチップで鳴ります。' },
  AR: { en: 'Attack rate (0-31): how fast the sound rises; 0 = never sounds', ko: '어택 레이트 (0-31): 소리가 올라오는 속도. 0이면 소리가 안 남', ja: 'アタックレート（0-31）: 立ち上がりの速さ。0は鳴らない' },
  D1R: { en: 'Decay rate, D1R (0-31): fall from the peak to SL', ko: '디케이 레이트 D1R (0-31): 정점에서 SL까지 내려가는 속도', ja: 'ディケイレート D1R（0-31）: ピークからSLまで下がる速さ' },
  D1L: { en: 'Sustain level, D1L (0-15): where the decay stops, 3 dB a step; 15 = silent', ko: '서스테인 레벨 D1L (0-15): 디케이가 멈추는 높이, 한 단계 3 dB. 15 = 무음', ja: 'サステインレベル D1L（0-15）: ディケイが止まる高さ、1段3 dB。15 = 無音' },
  D2R: { en: 'Sustain rate, D2R (0-31): slow fall while the key is held; 0 = holds', ko: '서스테인 레이트 D2R (0-31): 누르고 있는 동안 천천히 줄어드는 속도. 0 = 유지', ja: 'サステインレート D2R（0-31）: 押している間ゆっくり下がる速さ。0 = 保持' },
  RR: { en: 'Release rate (0-15): fall after key off', ko: '릴리스 레이트 (0-15): 키 오프 후 줄어드는 속도', ja: 'リリースレート（0-15）: キーオフ後に下がる速さ' },
  TL: { en: 'Total level (0-127): 0.75 dB a step, higher = quieter', ko: '토탈 레벨 (0-127): 한 단계 0.75 dB, 클수록 작음', ja: 'トータルレベル（0-127）: 1段0.75 dB、大きいほど小さい' },
  KS: { en: 'Key scale, RS in Furnace (0-3): envelope speeds up on higher notes', ko: '키 스케일, Furnace의 RS (0-3): 높은 음일수록 엔벌로프가 빨라짐', ja: 'キースケール、FurnaceのRS（0-3）: 高い音ほどエンベロープが速くなる' },
  ML: { en: 'Multiple (0-15): frequency × ML; 0 = × 0.5', ko: '멀티플 (0-15): 주파수 × ML. 0 = × 0.5', ja: 'マルチプル（0-15）: 周波数 × ML。0 = × 0.5' },
  DT: { en: 'Detune (0-7): 1-3 slightly up, 5-7 slightly down, 0 and 4 none', ko: '디튠 (0-7): 1-3 약간 높게, 5-7 약간 낮게, 0과 4는 없음', ja: 'デチューン（0-7）: 1-3 少し高く、5-7 少し低く、0と4はなし' },
};

// Furnace's names and order for the operator controls; the MUC field each one sets.
const CONTROLS = [['AR', 'AR'], ['DR', 'D1R'], ['SL', 'D1L'], ['D2R', 'D2R'], ['RR', 'RR'], ['TL', 'TL'], ['KS', 'KS'], ['MULT', 'ML'], ['DT', 'DT']];
const LIMIT = Object.fromEntries(FIELDS.map((f, i) => [f, LIMITS[i]]));
const DT_SHOWN = ['0', '+1', '+2', '+3', '-0', '-1', '-2', '-3'];

// Furnace's default FM instrument (engine/instrument.h) in MUC terms: DT 5 and 0 there are
// +2 and -3, which the chip writes as 2 and 7.
const INIT = {
  fb: 4, alg: 0,
  ops: [[31, 8, 0, 3, 15, 42, 0, 5, 2], [31, 4, 0, 1, 11, 48, 0, 1, 2], [31, 10, 0, 4, 15, 18, 0, 1, 7], [31, 9, 0, 9, 15, 0, 0, 1, 7]]
    .map((v) => Object.fromEntries(FIELDS.map((f, i) => [f, v[i]]))),
};

const clampTo = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
const copyVoice = (v) => ({ fb: v.fb, alg: v.alg, ops: v.ops.map((o) => ({ ...o })) });
const nums = (s) => s.split(';')[0].split(',').map((x) => x.trim()).filter((x) => x !== '').map((x) => (/^\d+$/.test(x) ? Number(x) : NaN));

// The five value lines of a voice, in the layout the old lines use: "31,0,0,7" stays
// packed, "  31,  8,  3" stays padded to three columns; indents and ; comments are kept.
export function formatVoice(voice, oldLines = []) {
  const rows = [[voice.fb, voice.alg], ...voice.ops.map((o) => FIELDS.map((f) => o[f]))];
  const padded = oldLines.some((l) => /,[ \t]+\d/.test((l || '').split(';')[0]));
  return rows.map((values, r) => {
    const old = oldLines[r] ?? '';
    const lead = /^[ \t]*/.exec(old)[0];
    const first = /^[ \t]*(\d*)/.exec(old)[1];
    const comment = /;.*$/.exec(old)?.[0];
    const tail = comment ? ' ' + comment : '';
    if (padded) {
      // The indent is what is left of the leading spaces once the first value is padded.
      const base = ' '.repeat(Math.max(1, lead.length + first.length - 3));
      return base + values.map((v) => String(v).padStart(3)).join(',') + tail;
    }
    return (lead || '   ') + values.join(',') + tail;
  });
}

export class FmEditor {
  constructor(root, { lang, onApply, onClose, audio, volume, colors }) {
    this.root = root;
    this.lang = lang;            // () => 'en' | 'ko' | 'ja'
    this.onApply = onApply;      // (voice) => void
    this.onClose = onClose;      // () => void
    this.audio = audio;          // () => AudioContext
    this.volume = volume;        // () => 0..1
    this.colors = colors;        // () => colours for drawVoice
    this.voice = copyVoice(INIT);
    this.history = [];
    this.future = [];
    this.focus = -1;             // the operator being edited, drawn bold
    this.octave = 4;
    this.clip = null;
    this.playing = null;
    this.build();
  }

  t(key, ...args) {
    const e = TEXT[key];
    const v = e[this.lang()] ?? e.en;
    return typeof v === 'function' ? v(...args) : v;
  }

  get isOpen() { return !this.root.hidden; }

  // def: a voiceAt() result. Values the chip cannot take are clamped into range.
  open(def) {
    this.def = def;
    this.voice = {
      fb: clampTo(def.fb, 7), alg: clampTo(def.alg, 7),
      ops: def.ops.map((o) => Object.fromEntries(FIELDS.map((f) => [f, clampTo(o[f], LIMIT[f])]))),
    };
    this.history = [];
    this.future = [];
    this.focus = def.focus;
    this.root.hidden = false;
    this.build();
    this.render();
  }

  close() {
    this.stopNote();
    this.root.hidden = true;
  }

  // ---------- history ----------
  snapshot() {
    this.history.push(copyVoice(this.voice));
    if (this.history.length > 200) this.history.shift();
    this.future = [];
  }
  undo() { if (this.history.length) { this.future.push(this.voice); this.voice = this.history.pop(); this.render(); } }
  redo() { if (this.future.length) { this.history.push(this.voice); this.voice = this.future.pop(); this.render(); } }
  set(voice) {
    this.snapshot();
    this.voice = copyVoice(voice);
    this.render();
  }

  // ---------- listening ----------
  // A plain OPN-style render of one note: phase modulation as in computeWave, each
  // operator's level following its envelope (with key scaling for the note's octave).
  renderNote(ctx) {
    const sr = ctx.sampleRate, v = this.voice;
    const hold = 0.8;
    const len = Math.round(sr * 2.2);
    const freq = 261.63 * 2 ** (this.octave - 4);
    const alg = ALGS[v.alg];
    const into = [[], [], [], []];
    for (const [a, b] of alg.edges) into[b].push(a);
    const kc = Math.min(31, Math.max(0, this.octave * 4 + 1));
    const rks = v.ops.map((o) => kc >> (3 - o.KS));
    const inc = v.ops.map((o) => (freq * (o.ML === 0 ? 0.5 : o.ML)) / sr);
    const out = new Float32Array(len);
    const step = 64;
    const amp = [0, 0, 0, 0], next = [0, 0, 0, 0];
    const level = (k, s) => 10 ** (-envelope(v.ops[k], s / sr, hold, rks[k]) / 20);
    const phase = [0, 0, 0, 0];
    let p1 = 0, p2 = 0;
    for (let s = 0; s < len; s++) {
      if (s % step === 0) for (let k = 0; k < 4; k++) { amp[k] = level(k, s); next[k] = level(k, s + step); }
      const f = (s % step) / step;
      const o = [0, 0, 0, 0];
      for (let k = 0; k < 4; k++) {
        let mod = 0;
        if (k === 0 && v.fb) mod = 2 * Math.PI * (p1 + p2) * 2 ** (v.fb - 7);
        for (const m of into[k]) mod += 8 * Math.PI * o[m];
        o[k] = (amp[k] + (next[k] - amp[k]) * f) * Math.sin(2 * Math.PI * phase[k] + mod);
        phase[k] = (phase[k] + inc[k]) % 1;
      }
      p2 = p1; p1 = o[0];
      out[s] = alg.out.reduce((sum, k) => sum + o[k], 0);
    }
    let peak = 0;
    for (const x of out) peak = Math.max(peak, Math.abs(x));
    const gain = 1 / Math.max(1, peak);
    for (let s = 0; s < len; s++) out[s] *= gain;
    // A short fade so the end never clicks.
    for (let s = 0; s < 256; s++) out[len - 1 - s] *= s / 256;
    return out;
  }
  playNote() {
    const ctx = this.audio();
    if (!ctx) return;
    this.stopNote();
    const data = this.renderNote(ctx);
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.getChannelData(0).set(data);
    const gain = ctx.createGain();
    gain.gain.value = 0.3 * this.volume();
    gain.connect(ctx.destination);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    src.onended = () => { if (this.playing?.src === src) this.stopNote(); };
    src.start();
    this.playing = { src, gain };
  }
  stopNote() {
    if (!this.playing) return;
    try { this.playing.src.stop(); } catch { /* already ended */ }
    this.playing.gain.disconnect();
    this.playing = null;
  }

  // ---------- UI ----------
  build() {
    const T = (k) => this.t(k);
    this.root.innerHTML = `
      <div class="we-bar">
        <b class="we-title"></b>
        <span class="tool-group"><button type="button" class="btn small" data-act="undo">↶ ${T('undo')}</button><button type="button" class="btn small" data-act="redo">↷ ${T('redo')}</button></span>
        <button type="button" class="btn small" data-act="listen" title="${T('listenTip')}">${T('listen')}</button>
        <select class="we-oct" aria-label="Octave">${[1, 2, 3, 4, 5, 6, 7].map((o) => `<option value="${o}"${o === this.octave ? ' selected' : ''}>o${o} C</option>`).join('')}</select>
        <button type="button" class="btn small" data-act="init" title="${T('initTip')}">${T('init')}</button>
        <span class="spacer"></span>
        <button type="button" class="btn small" data-act="apply" title="${T('applyTip')}">${T('apply')}</button>
        <button type="button" class="btn small primary" data-act="done" title="${T('doneTip')}">${T('done')}</button>
        <button type="button" class="btn small" data-act="cancel" title="${T('cancelTip')}">${T('cancel')}</button>
      </div>
      <div class="fe-main">
        <div class="fe-top">
          <canvas class="fe-overview"></canvas>
          <div class="fe-global">
            <p class="fe-label">${T('alg')}</p>
            <div class="fe-algs" role="radiogroup" aria-label="${T('alg')}">
              ${ALGS.map((_, a) => `<button type="button" role="radio" data-alg="${a}" title="ALG ${a}"><canvas></canvas><span>${a}</span></button>`).join('')}
            </div>
            <label class="fe-fb">${T('fb')} <input type="range" min="0" max="7" step="1" data-fb><input type="number" min="0" max="7" data-fb-num></label>
            <p class="we-note">${T('approx')}</p>
          </div>
        </div>
        <div class="fe-ops">
          ${[0, 1, 2, 3].map((k) => `
          <section class="fe-op" data-op="${k}" style="--op:${OP_COLORS[k]}">
            <header><b>OP${k + 1}</b> <span class="fe-role"></span><span class="spacer"></span>
              <button type="button" class="btn small" data-copy="${k}" title="${T('copyTip')}">${T('copy')}</button><button type="button" class="btn small" data-paste="${k}" title="${T('pasteTip')}">${T('paste')}</button></header>
            <canvas class="fe-env"></canvas>
            <div class="fe-rows">
              ${CONTROLS.map(([name, f]) => `<label title="${T(f)}"><span>${name}</span><input type="range" min="0" max="${LIMIT[f]}" step="1" data-k="${k}" data-f="${f}"><input type="number" min="0" max="${LIMIT[f]}" data-k="${k}" data-n="${f}"><output data-k="${k}" data-o="${f}"></output></label>`).join('')}
            </div>
            <p class="fe-note"></p>
          </section>`).join('')}
        </div>
      </div>
      <div class="we-values">
        <span class="fe-mml-label">${T('mml')}:</span>
        <textarea class="fe-text" rows="6" spellcheck="false" aria-label="${T('mml')}" title="${T('textTip')}"></textarea>
        <p class="we-bad"></p>
      </div>`;
    this.wire();
  }

  wire() {
    const q = (s) => this.root.querySelector(s);
    const all = (s) => this.root.querySelectorAll(s);
    q('[data-act="undo"]').onclick = () => this.undo();
    q('[data-act="redo"]').onclick = () => this.redo();
    q('[data-act="listen"]').onclick = () => this.playNote();
    q('[data-act="init"]').onclick = () => this.set(INIT);
    q('.we-oct').onchange = (e) => { this.octave = +e.target.value; this.playNote(); };
    q('[data-act="apply"]').onclick = () => this.onApply(copyVoice(this.voice));
    q('[data-act="done"]').onclick = () => { this.onApply(copyVoice(this.voice)); this.close(); this.onClose(); };
    q('[data-act="cancel"]').onclick = () => { this.close(); this.onClose(); };
    all('[data-alg]').forEach((b) => { b.onclick = () => { if (+b.dataset.alg !== this.voice.alg) { this.snapshot(); this.voice.alg = +b.dataset.alg; this.render(); } }; });
    // The first change of a gesture records the old voice for undo.
    let gesture = false;
    const begin = () => { if (!gesture) { this.snapshot(); gesture = true; } };
    const end = () => { gesture = false; };
    const fb = (value) => { begin(); this.voice.fb = clampTo(value, 7); this.render(); };
    q('[data-fb]').addEventListener('input', (e) => fb(e.target.value));
    q('[data-fb]').addEventListener('change', end);
    q('[data-fb-num]').addEventListener('change', (e) => { fb(e.target.value); end(); });
    const field = (el, key) => (value) => {
      begin();
      const k = +el.dataset.k;
      this.voice.ops[k][key] = clampTo(value, LIMIT[key]);
      this.focus = k;
      this.render();
    };
    all('[data-f]').forEach((el) => {
      const set = field(el, el.dataset.f);
      el.addEventListener('input', (e) => set(e.target.value));
      el.addEventListener('change', end);
    });
    all('[data-n]').forEach((el) => {
      const set = field(el, el.dataset.n);
      el.addEventListener('change', (e) => { set(e.target.value); end(); });
    });
    all('.fe-op').forEach((card) => {
      card.addEventListener('pointerenter', () => { this.focus = +card.dataset.op; this.drawOverview(); });
      card.addEventListener('focusin', () => { this.focus = +card.dataset.op; this.drawOverview(); });
    });
    all('[data-copy]').forEach((b) => { b.onclick = () => { this.clip = { ...this.voice.ops[+b.dataset.copy] }; this.render(); }; });
    all('[data-paste]').forEach((b) => {
      b.onclick = () => {
        if (!this.clip) return;
        const v = copyVoice(this.voice);
        v.ops[+b.dataset.paste] = { ...this.clip };
        this.set(v);
      };
    });
    const text = q('.fe-text');
    text.addEventListener('change', () => {
      const v = this.parse(text.value);
      q('.we-bad').textContent = v ? '' : this.t('badText');
      if (v) this.set(v);
    });
    this.root.addEventListener('keydown', (e) => {
      if (e.target === text || e.target.type === 'number') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); }
    });
    new ResizeObserver(() => this.draw()).observe(q('.fe-overview'));
  }

  // The five lines of the text box back into a voice, or null when they do not fit.
  parse(text) {
    const rows = text.split('\n').map(nums).filter((r) => r.length);
    if (rows.length !== 5 || rows[0].length !== 2 || rows.slice(1).some((r) => r.length !== 9)) return null;
    if (!rows.flat().every(Number.isFinite) || rows[0].some((x) => x > 7)) return null;
    const ops = rows.slice(1).map((r) => Object.fromEntries(FIELDS.map((f, i) => [f, r[i]])));
    if (ops.some((o) => FIELDS.some((f) => o[f] > LIMIT[f]))) return null;
    return { fb: rows[0][0], alg: rows[0][1], ops };
  }

  // The definition's five value lines as they will be written.
  lines() {
    return formatVoice(this.voice, this.def?.oldLines);
  }

  render() {
    if (!this.def) return;
    const q = (s) => this.root.querySelector(s);
    const all = (s) => this.root.querySelectorAll(s);
    const v = this.voice;
    const out = ALGS[v.alg].out;
    q('.we-title').textContent = `@${this.def.id} · ${this.t('title')}`;
    q('[data-act="undo"]').disabled = !this.history.length;
    q('[data-act="redo"]').disabled = !this.future.length;
    all('[data-alg]').forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.alg === v.alg)));
    q('[data-fb]').value = v.fb;
    q('[data-fb-num]').value = v.fb;
    const busy = document.activeElement;
    all('[data-f]').forEach((el) => { if (el !== busy) el.value = v.ops[+el.dataset.k][el.dataset.f]; });
    all('[data-n]').forEach((el) => { if (el !== busy) el.value = v.ops[+el.dataset.k][el.dataset.n]; });
    all('[data-o]').forEach((el) => {
      const x = v.ops[+el.dataset.k][el.dataset.o];
      el.textContent = el.dataset.o === 'DT' ? DT_SHOWN[x] : el.dataset.o === 'TL' ? (x ? `-${(x * 0.75).toFixed(1)}dB` : '0dB') : el.dataset.o === 'ML' ? `×${x || 0.5}` : '';
    });
    all('.fe-op').forEach((card) => {
      const k = +card.dataset.op;
      const carrier = out.includes(k);
      card.classList.toggle('carrier', carrier);
      card.querySelector('.fe-role').textContent = this.t(carrier ? 'carrier' : 'modulator');
      const note = card.querySelector('.fe-note');
      note.textContent = this.t(carrier ? 'carrierNote' : 'modulatorNote') + (carrier && v.ops[k].TL ? ' ' + this.t('tlWarn') : '');
      note.classList.toggle('warn', carrier && v.ops[k].TL !== 0);
    });
    all('[data-paste]').forEach((b) => { b.disabled = !this.clip; });
    const text = q('.fe-text');
    if (busy !== text) text.value = this.lines().join('\n');
    this.draw();
  }

  draw() {
    if (this.root.hidden) return;
    this.drawOverview();
    this.root.querySelectorAll('[data-alg] canvas').forEach((c, a) => this.drawAlgorithm(c, a));
    this.root.querySelectorAll('.fe-env').forEach((c, k) => this.drawEnvelope(c, k));
  }

  drawOverview() {
    const canvas = this.root.querySelector('.fe-overview');
    if (!canvas || !canvas.clientWidth) return;
    drawVoice(canvas, { ...this.voice, focus: this.focus }, this.colors());
  }

  // A small algorithm diagram for the picker (operators as numbered boxes).
  drawAlgorithm(canvas, a) {
    const ctx2 = this.setup(canvas);
    if (!ctx2) return;
    const { g, w, h } = ctx2;
    const alg = ALGS[a], c = this.colors();
    const cols = Math.max(...alg.pos.map((p) => p[0])) + 1, rows = Math.max(...alg.pos.map((p) => p[1])) + 1;
    const box = Math.min(12, (w - 10) / (cols + 1.2), (h - 4) / (rows + 0.4));
    const at = (k) => ({ x: 4 + (alg.pos[k][0] + 0.5) * ((w - 12) / cols), y: (alg.pos[k][1] + 0.5) * (h / rows) });
    g.strokeStyle = c.muted;
    g.lineWidth = 1;
    for (const [s, d] of alg.edges) { const A = at(s), B = at(d); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
    for (const k of alg.out) { const A = at(k); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(w - 2, A.y); g.stroke(); }
    g.font = `${Math.max(7, box - 3)}px ui-monospace, Menlo, Consolas, monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let k = 0; k < 4; k++) {
      const A = at(k), carrier = alg.out.includes(k);
      g.fillStyle = carrier ? OP_COLORS[k] : c.panel;
      g.strokeStyle = OP_COLORS[k];
      g.fillRect(A.x - box / 2, A.y - box / 2, box, box);
      g.strokeRect(A.x - box / 2 + .5, A.y - box / 2 + .5, box - 1, box - 1);
      g.fillStyle = carrier ? '#fff' : OP_COLORS[k];
      g.fillText(String(k + 1), A.x, A.y + .5);
    }
  }

  // Furnace's drawFMEnv: attack to the TL height, decay to SL, sustain-rate slope, and
  // the release as a shaded triangle; dashed guides through the sustain level.
  drawEnvelope(canvas, k) {
    const ctx2 = this.setup(canvas);
    if (!ctx2) return;
    const { g, w, h } = ctx2;
    const c = this.colors(), op = this.voice.ops[k];
    g.fillStyle = c.bg;
    g.fillRect(0, 0, w, h);
    const tl = op.TL / 127, sl = op.D1L / 15;
    const arPos = ((31 - op.AR) / 31) / 2;
    const drPos = arPos + (sl * ((31 - op.D1R) / 31)) / 2;
    const d2rPos = drPos + ((1 - sl) * ((31 - op.D2R) / 31)) / 2;
    const rrPos = (15 - op.RR) / 15;
    const P = (x, y) => [x * w, y * h];
    const susY = tl + sl - tl * sl;
    const color = OP_COLORS[k];
    const line = (a, b, col = color, dash = []) => { g.strokeStyle = col; g.setLineDash(dash); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.setLineDash([]); };
    // release
    g.fillStyle = c.grid;
    g.beginPath(); g.moveTo(...P(0, tl)); g.lineTo(...P(rrPos, 1)); g.lineTo(...P(0, 1)); g.closePath(); g.fill();
    g.lineWidth = 2;
    if (op.AR === 0) {
      line(P(0, 1), P(1, 1));
    } else if (op.D1R === 0 && op.D1L !== 0) {
      line(P(0, 1), P(arPos, tl));
      line(P(arPos, tl), P(1, tl));
    } else {
      g.lineWidth = 1;
      line(P(drPos, susY), P(1, susY), c.muted, [3, 3]);
      line(P(drPos, susY), P(drPos, 1), c.muted, [3, 3]);
      g.lineWidth = 2;
      line(P(0, 1), P(arPos, tl));
      line(P(arPos, tl), P(drPos, susY));
      line(P(drPos, susY), op.D2R === 0 ? P(1, susY) : P(d2rPos, 1));
    }
  }

  setup(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    return { g, w, h };
  }
}
