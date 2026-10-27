# MUC Templates

[English](#english) · [日本語](#日本語) · [한국어](#한국어)

Starting points for writing a MUC (MUCOM88 MML) song. Every template plays as it is and explains itself in comments in English and Japanese.

| Folder | What is inside |
|---|---|
| `1_Basics` | Learn MML step by step: notes and lengths, several parts, FM voices, repeats / loops / macros, expression |
| `2_Chips` | One template per sound chip: OPNA FM, OPNA SSG, an OPNA band, MSX-MUSIC (OPLL), MSX PSG, SCC (5 channels), a full MSX, and OPNA + every MSX chip |
| `3_Rhythm` | Drums only: the OPNA rhythm part step by step, beat libraries for OPNA and MSX-MUSIC, a drum kit built from PSG noise |
| `4_Genres` | Drums, bass and chords ready, just add the melody: rock, pop, ballad, dance, funk, shuffle blues, jazz swing, bossa nova, reggae, hip-hop, metal, waltz, march, game action |
| `5_Genres_MSX` | The same idea on MSX chips (MSX-MUSIC drums and chords, SCC bass, melody on SCC): rock, dance, game action, ballad |
| `6_Demos` | Finished songs that play the chips together: *Midnight Pier*, a city pop tune on OPNA FM, SSG and rhythm, MSX-MUSIC, MSX PSG and SCC (28 channels); *Killer Coast Land OPNA Arrange*, Gradius 2's Colossus Planet theme with its original MSX PSG and SCC parts (MucoMSX chip extension) and YM2608 rhythm drums, FM lead, harmony, chords and bass added |

---

## English

### How to use

1. Open [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/), press **Samples…** and pick a file from the `Muc/Templates/…` groups at the top of the list.
2. Press **Play** (Ctrl+Enter) to hear it, read the comments, then change one thing at a time.
3. **Save** (Ctrl+S) puts your version on your computer as `.muc`.

A genre template plays drums, bass and chords. Write your melody in the part at the bottom (`A`, or `SCCA` in the MSX versions), using the chord tones listed in the file, and keep every part the same number of bars.

### Good to know

- An SSG or PSG part (`D E F`, `MSXD E F`) stays silent until it has a preset (`@0`) or an envelope (`E`), and a volume (`v`). SCC parts and `MSXG` need `v` too.
- FM voices are written in the song. Their four operator lines are OP1–OP4; keep a carrier's TL at 0 and set loudness with `v`.
- MSX-MUSIC parts reuse the same FM voices: each becomes the nearest of the 15 built-in OPLL instruments.
- Templates that use `SCCA`–`SCCE` need the msPb0102 format of MUCOMSX (MDPlayer4Mac v0.2.3 or later).
- Portamento: the length goes after the first note, `{c4 e}` (or leave it out to use `l`). `{ce}4` is an error.
- `T` gives an approximate tempo, because it is converted to a Timer-B value.

### Text encoding

The files are Shift-JIS, like every MUC for the MSX. The comments are in English and Japanese.

All templates compile without errors or warnings. In MDPlayer4Mac v0.2.3 they produce the same MUB and the same audio as in MUCPlayground.

---

## 日本語

### 使い方

1. [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)を開き、**サンプル…**を押して、リストの一番上にある`Muc/Templates/…`のグループからファイルを選びます。
2. **再生**(Ctrl+Enter)で聴き、コメントを読みながら1か所ずつ変えてみましょう。
3. **保存**(Ctrl+S)で、自分の版を`.muc`としてパソコンに保存できます。

ジャンル別テンプレートは、ドラム・ベース・和音を演奏します。メロディは一番下のパート(`A`、MSX版では`SCCA`)に書きます。ファイルに書かれたコードの構成音を使い、全パートの小節数をそろえてください。

### 知っておくと便利なこと

- SSG・PSGのパート(`D E F`、`MSXD E F`)は、プリセット(`@0`)かエンベロープ(`E`)、そして音量(`v`)を指定するまで音が出ません。SCCのパートと`MSXG`にも`v`が必要です。
- FM音色は曲の中に書きます。4行のオペレータはOP1~OP4の順です。キャリアのTLは0にして、音量は`v`で決めます。
- MSX-MUSICのパートも同じFM音色を使います。それぞれOPLL内蔵の15音色のうち最も近いものになります。
- `SCCA`~`SCCE`を使うテンプレートには、MUCOMSXのmsPb0102形式(MDPlayer4Mac v0.2.3以降)が必要です。
- ポルタメントの音長は最初の音の後ろに書きます: `{c4 e}`(省略するとlの音長)。`{ce}4`はエラーになります。
- `T`はTimer-Bの値に変換されるので、テンポはおおよその値になります。

### 文字コード

MSX用のMUCと同じく、ファイルはShift-JISです。コメントは英語と日本語です。

すべてのテンプレートは、エラーも警告も無くコンパイルできます。MDPlayer4Mac v0.2.3でも、MUCPlaygroundと同じMUBと同じ音声になります。

---

## 한국어

### 사용법

1. [MUCPlayground](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/)를 열고 **샘플…**을 누른 다음, 목록 맨 위의 `Muc/Templates/…` 그룹에서 파일을 고릅니다.
2. **재생**(Ctrl+Enter)으로 들어 보고, 주석을 읽으며 한 군데씩 바꿔 보세요.
3. **저장**(Ctrl+S)을 누르면 자기 버전을 `.muc`로 컴퓨터에 저장합니다.

장르별 템플릿은 드럼, 베이스, 화음을 연주합니다. 멜로디는 맨 아래 파트(`A`, MSX 버전은 `SCCA`)에 씁니다. 파일에 적힌 코드 구성음을 쓰고, 모든 파트의 마디 수를 맞추세요.

### 알아 두면 좋은 것

- SSG·PSG 파트(`D E F`, `MSXD E F`)는 프리셋(`@0`)이나 엔벨로프(`E`), 그리고 음량(`v`)을 정해야 소리가 납니다. SCC 파트와 `MSXG`에도 `v`가 필요합니다.
- FM 음색은 곡 안에 씁니다. 오퍼레이터 네 줄은 OP1~OP4 순서입니다. 캐리어의 TL은 0으로 두고, 음량은 `v`로 정합니다.
- MSX-MUSIC 파트도 같은 FM 음색을 씁니다. 각각 OPLL 내장 15음색 중 가장 가까운 것으로 바뀝니다.
- `SCCA`~`SCCE`를 쓰는 템플릿은 MUCOMSX의 msPb0102 형식(MDPlayer4Mac v0.2.3 이상)이 필요합니다.
- 포르타멘토의 길이는 첫 음 뒤에 씁니다: `{c4 e}`(생략하면 l의 길이). `{ce}4`는 오류가 납니다.
- `T`는 Timer-B 값으로 바뀌기 때문에 템포가 대략적인 값입니다.

### 문자 인코딩

MSX용 MUC와 마찬가지로 파일은 Shift-JIS입니다. 주석은 영어와 일본어입니다.

모든 템플릿은 오류나 경고 없이 컴파일됩니다. MDPlayer4Mac v0.2.3에서도 MUCPlayground와 똑같은 MUB와 똑같은 소리가 나옵니다.
