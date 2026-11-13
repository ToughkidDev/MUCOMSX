// MUCPlayground 사용 설명서 — 1부 사용 안내 (한국어).
// 각 장: { id, title, html }. html 안의 <h3>은 목차에 들어가고,
// <pre data-ex="이름"></pre>은 examples.js의 예제(색칠 + 열기 버튼)로 바뀝니다.
export default [
  {
    id: 'start',
    title: '시작하기',
    html: `
<p class="lead"><b>MUCPlayground</b>는 MUCOM88 MML(MUC 파일)을 브라우저에서 쓰고 바로 들어 볼 수 있는 연습 공간입니다. 설치할 것이 없고, 쓴 곡은 내 브라우저 안에만 저장되며 어디에도 올라가지 않습니다.</p>
<p>주소: <a href="https://toughkiddev.github.io/MUCOMSX/MUCPlayground/">https://toughkiddev.github.io/MUCOMSX/MUCPlayground/</a></p>

<h3>무엇을 할 수 있나요</h3>
<ul>
  <li><b>MML 쓰기와 재생</b>: YM2608(OPNA)의 FM 6채널, SSG 3채널, 리듬, ADPCM과 MUCOMSX의 MSX 음원(MSX-MUSIC, MSX PSG, SCC/SCC+)을 위한 곡을 쓰고 <kbd>Ctrl+Enter</kbd>로 바로 듣습니다.</li>
  <li><b>도와주는 편집기</b>: 문법 색칠, 입력 중 명령 제안, 입력하는 동안의 자동 검사, 오류마다 "무슨 뜻·고치는 법" 설명이 있습니다.</li>
  <li><b>보는 도구</b>: 트래커(패턴·피아노 롤), 채널별 오실로스코프, 채널별 건반, MDPlayer4Mac과 같은 채널 뷰가 있습니다.</li>
  <li><b>음색·파형·PCM 편집</b>: FM 음색 편집기, SCC 파형 편집기, PCM 샘플 편집기(모두 Furnace 스타일)와 음색 뱅크가 있습니다.</li>
  <li><b>파일</b>: <code>.muc</code>를 열고 저장하며, <code>.mub</code>·<code>.vgm</code>으로 내보내고, <code>.mub</code>·<code>.vgm</code>·<code>.vgz</code>를 재생합니다. 플레이리스트와 저장소 샘플도 씁니다.</li>
  <li><b>공유</b>: 서버 없이 링크 하나에 곡(과 작은 첨부 파일)을 담아 보냅니다.</li>
</ul>

<h3>5분 만에 첫 곡</h3>
<ol>
  <li>도구 막대의 <b>새로</b>를 누르고 템플릿을 하나 고릅니다(처음이면 맨 위 템플릿).</li>
  <li><b>▶ 재생</b>(<kbd>Ctrl+Enter</kbd>)을 누릅니다. 연주되는 위치가 편집기에서 파트별 색으로 표시됩니다.</li>
  <li>멜로디 줄의 음표(<code>c d e</code> …)를 바꾸고 다시 재생합니다. 입력을 멈추면 곡이 뒤에서 자동으로 검사되어, 틀린 곳에 밑줄이 그어집니다.</li>
  <li>마음에 들면 <b>저장</b>(<kbd>Ctrl+S</kbd>)으로 <code>.muc</code> 파일을 받습니다. 저장하지 않아도 브라우저가 기억하므로, 다음에 열면 그대로 있습니다.</li>
</ol>
<p>아무것도 없는 곳에서 시작하려면 편집기를 비우고 아래처럼 한 줄만 써 보세요.</p>
<pre data-ex="first"></pre>
<div class="note">처음 접속한 페이지는 브라우저 정책 때문에 한 번 누르기 전까지 소리를 낼 수 없습니다. "아무 곳이나 클릭하면 소리가 나옵니다"가 보이면 화면을 한 번 누르세요.</div>

<h3>필요한 환경</h3>
<ul>
  <li>최근의 Chrome, Edge, Safari, Firefox(PC·Mac)와 iPhone·iPad(iOS/iPadOS 16.4 이상)에서 동작합니다.</li>
  <li>처음 열 때 음원 엔진(약 4 MB, 압축)을 내려받습니다. VGM 재생 엔진(약 7 MB)은 VGM을 처음 재생할 때 받습니다. 한 번 받으면 브라우저가 기억합니다.</li>
  <li>쓴 곡과 첨부 파일, 설정은 그 브라우저에만 저장됩니다. 다른 기기로 옮기려면 저장한 파일이나 공유 링크를 쓰세요.</li>
</ul>
`,
  },
  {
    id: 'screen',
    title: '화면 구성',
    html: `
<h3>위쪽 머리글</h3>
<table>
  <tr><th>항목</th><th>하는 일</th></tr>
  <tr><td>🔗 공유</td><td>지금 열려 있는 곡·파일·플레이리스트를 여는 링크를 만듭니다. <a href="#share">공유 링크</a> 참고.</td></tr>
  <tr><td>🎧 플레이어 모드</td><td>편집기 자리에 MDPlayer4Web 플레이어를 띄웁니다. 다시 누르면 편집기로 돌아옵니다.</td></tr>
  <tr><td>📘 사용 설명서</td><td>이 문서를 새 탭으로 엽니다.</td></tr>
  <tr><td>글자</td><td>편집기 글자 크기(10–24 px). 트래커도 따라갑니다.</td></tr>
  <tr><td>메뉴</td><td>머리글·도구 막대·옆 패널 등 화면 요소 크기(100–200 %). 화면이 좁으면 자동으로 제한됩니다.</td></tr>
  <tr><td>EN / 한국어 / 日本語</td><td>화면 언어. 설명, 메시지, 문법 가이드가 모두 바뀝니다.</td></tr>
</table>

<h3>도구 막대</h3>
<table>
  <tr><th>항목</th><th>하는 일</th></tr>
  <tr><td>⏮ ▶ ⏭</td><td>이전 곡·재생·다음 곡. 이전/다음은 2곡 이상인 플레이리스트가 열려 있을 때만 켜집니다.</td></tr>
  <tr><td>❚❚ 일시정지 / ■ 정지</td><td>그 자리에서 멈춤(<kbd>F8</kbd>, 다시 누르면 이어서) / 정지(<kbd>Esc</kbd>).</td></tr>
  <tr><td>루프 버튼</td><td>곡이 끝날 때의 동작: 한 번 / 반복 / 랜덤. <a href="#play">재생</a> 참고.</td></tr>
  <tr><td>시계</td><td>연주 시간과 루프 횟수.</td></tr>
  <tr><td>▦ 채널 뷰</td><td>편집기 자리에 MDPlayer4Mac식 칩 패널을 보여 줍니다.</td></tr>
  <tr><td>☰ 플레이리스트</td><td>오른쪽에 곡 목록을 엽니다.</td></tr>
  <tr><td>음량 / 속도</td><td>전체 음량, 재생 속도(25–200 %, 음 높이는 그대로).</td></tr>
  <tr><td>예제 목록</td><td>데모, 템플릿, 최근 곡을 고릅니다.</td></tr>
  <tr><td>새로 / 샘플… / 열기… / 폴더…</td><td>템플릿으로 시작, 저장소 샘플 열기, 내 파일 열기, 내 컴퓨터 폴더 열기.</td></tr>
  <tr><td>저장 · .muc · .mub · .vgm</td><td>곡 저장과 내보내기.</td></tr>
</table>

<h3>편집기와 아래 막대</h3>
<p>가운데가 MML 편집기입니다. 아래 막대에는 다음 버튼이 있습니다.</p>
<ul>
  <li><b>분할</b> ▯ ◫ ⊟: 같은 곡을 한 번 / 좌우 / 위아래로 두 번 보여 줍니다.</li>
  <li><b>🎼 트래커</b>, <b>∿ 스코프</b>, <b>📖 문법</b>, <b>🎹 건반</b>: 오른쪽 프레임에 각 뷰를 엽니다(건반은 편집 중에는 아래쪽 피아노).</li>
  <li>커서 위치(줄, 칸), 곡 크기, <kbd>Ctrl+Space</kbd> 안내, <b>재생 위치 따라가기</b> 체크.</li>
  <li>채널 뷰일 때는 <b>크기</b>(맞춤/100/75/50/25 %) 버튼이 나옵니다.</li>
</ul>

<h3>오른쪽 패널</h3>
<ul>
  <li><b>재생 중</b>: 곡 제목·작곡자·칩, 파트 목록(눌러서 따라갈 파트 고르기), 출력 파형.</li>
  <li><b>컴파일 메시지</b>: 오류·경고 목록. 누르면 그 줄로 갑니다.</li>
  <li><b>음색 / PCM 파일</b>: 곡이 쓰는 파일(<code>#voice</code>, <code>#sccvoice</code>, <code>#pcm</code>)의 첨부 상태와 FM/SCC/PCM 뱅크 버튼.</li>
  <li><b>빠른 참조</b>: 문법 가이드 전체의 짧은 목록. 커서가 있는 명령을 따라갑니다.</li>
</ul>
`,
  },
  {
    id: 'play',
    title: '재생',
    html: `
<h3>재생·일시정지·정지</h3>
<table>
  <tr><th>동작</th><th>버튼</th><th>키</th></tr>
  <tr><td>처음부터 재생(컴파일 후)</td><td>▶ 재생</td><td><kbd>Ctrl+Enter</kbd></td></tr>
  <tr><td>그 자리에서 멈춤 / 이어서</td><td>❚❚ 일시정지 / ▶ 계속</td><td><kbd>F8</kbd></td></tr>
  <tr><td>정지</td><td>■ 정지</td><td><kbd>Esc</kbd></td></tr>
  <tr><td>커서가 있는 줄(또는 선택한 줄)만 재생</td><td>줄 끝의 ▶</td><td><kbd>Ctrl+Shift+Enter</kbd></td></tr>
</table>
<p>일시정지는 연주 위치 표시, 채널 뷰, 시계를 그대로 둡니다. 재생은 항상 처음부터 다시 컴파일해서 시작합니다.</p>
<p>채널 뷰에 <code>.mub</code>/<code>.vgm</code> 파일이 열려 있는 동안 ▶은 그 파일을 재생합니다. ▦ 채널 뷰를 꺼서 편집기로 돌아가면 다시 MUC를 재생합니다.</p>

<h3>루프 버튼: 한 번 · 반복 · 랜덤</h3>
<p>정지 버튼 오른쪽의 버튼을 누를 때마다 모드가 바뀌고, 고른 모드는 기억됩니다.</p>
<table>
  <tr><th>모드</th><th>아이콘</th><th>동작</th></tr>
  <tr><td>한 번(기본)</td><td>⇥ 막대에 닿는 화살표</td><td>루프(<code>L</code>)가 있는 곡은 끝까지 한 번 + 루프 구간 한 번 더(1+1) 연주한 뒤 3초 동안 줄어들며 끝납니다. 루프가 없는 곡은 끝에서 멈춥니다.</td></tr>
  <tr><td>반복</td><td>🔁</td><td>정지할 때까지 계속 반복합니다. 루프가 없는 곡은 끝나면 처음부터 다시.</td></tr>
  <tr><td>랜덤</td><td>🔀</td><td>플레이리스트 곡을 무작위 순서로 하나씩, 각각 한 번(1+1) 연주합니다. 모든 곡을 한 바퀴 돌기 전에는 같은 곡이 다시 나오지 않습니다.</td></tr>
</table>
<div class="note">루프 버튼과 ⏮ ⏭는 <b>2곡 이상인 플레이리스트</b>가 열려 있을 때만 켜집니다. 그렇지 않으면 흐리게 꺼지고, 곡은 "한 번"으로 연주됩니다. 재생 중 모드를 바꾸면 그 곡의 다음 루프 지점부터 적용됩니다.</div>

<h3>이전 곡 / 다음 곡</h3>
<p>⏮ ⏭는 플레이리스트 순서대로 넘어가고, 끝과 처음이 이어집니다. 랜덤 모드에서는 ⏭가 무작위로 다른 곡을, ⏮가 방금 들었던 곡을 순서대로 거슬러 갑니다.</p>

<h3>음량과 속도</h3>
<ul>
  <li><b>음량</b>: 전체 출력 음량입니다. 채널별 음량은 <a href="#channels">채널 뷰</a>의 페이더로 조절합니다.</li>
  <li><b>속도</b>: 25–200 %로 재생하며 음 높이는 바뀌지 않습니다. 끌다 보면 100 %에서 잠깐 멈추고, 두 번 누르면 100 %로 돌아갑니다. 저장하는 <code>.mub</code>/<code>.vgm</code>은 항상 원래 속도입니다.</li>
</ul>

<h3>연주 위치 표시</h3>
<p>재생 중에는 각 파트가 지금 연주하는 명령이 편집기에서 파트 색으로 표시됩니다(MSX·SCC 파트 포함). 편집기는 오른쪽 "재생 중" 목록에서 고른 파트를 따라 스크롤되며, 아래 막대의 <b>재생 위치 따라가기</b>를 끄면 멈춥니다. 분할 편집 중에는 작업하는 쪽은 그대로 있고 다른 쪽이 따라갑니다.</p>

<h3>한 줄 재생</h3>
<p>음표가 있는 파트 줄에 커서를 두면 줄 끝에 ▶가 나타납니다. 그 줄만 재생하며, 그 지점까지의 설정(음색, 음량, 옥타브, 길이, 템포 등)은 앞 줄에서 그대로 가져옵니다. 여러 줄을 선택하고 <kbd>Ctrl+Shift+Enter</kbd>를 누르면 그 줄들을 재생합니다. 재생 중에는 버튼이 ■로 바뀌어 정지할 수 있습니다.</p>
`,
  },
  {
    id: 'mml',
    title: 'MML 첫걸음',
    html: `
<p>MUC 파일은 일반 텍스트입니다. 맨 위에 태그(<code>#title</code> 등), 그다음 음색 정의, 그리고 파트마다 연주 줄을 씁니다. 연주 줄은 <b>파트 문자 + 공백 + MML</b>입니다. 아래 예제마다 ▶ 버튼을 누르면 MUCPlayground에서 바로 열립니다. 모든 명령의 자세한 설명은 <a href="#part-ref">2부 MML 문법 레퍼런스</a>에 있습니다.</p>

<h3>파트</h3>
<table>
  <tr><th>파트</th><th>음원</th><th>비고</th></tr>
  <tr><td><code>A B C H I J</code></td><td>YM2608 FM 1–6</td><td>음색 <code>@n</code> 정의가 필요합니다.</td></tr>
  <tr><td><code>D E F</code></td><td>SSG 1–3 (사각파·노이즈)</td><td><code>@</code>나 <code>E</code>, 그리고 <code>v</code>가 없으면 소리가 나지 않습니다.</td></tr>
  <tr><td><code>G</code></td><td>리듬(BD SD TOP HH TOM RIM)</td><td><code>@</code>로 드럼 선택.</td></tr>
  <tr><td><code>K</code></td><td>ADPCM</td><td>PCM 파일(<code>#pcm</code>)이나 <code>#@pcm</code>이 필요합니다.</td></tr>
  <tr><td><code>MSXA–MSXC</code>, <code>MSXH–MSXJ</code></td><td>MSX-MUSIC (YM2413)</td><td>MUCOMSX.</td></tr>
  <tr><td><code>MSXG</code></td><td>MSX-MUSIC 드럼</td><td>MUCOMSX.</td></tr>
  <tr><td><code>MSXD–MSXF</code></td><td>MSX PSG</td><td>MUCOMSX.</td></tr>
  <tr><td><code>SCCA–SCCE</code></td><td>SCC / SCC+</td><td>MUCOMSX. 파형 <code>@Wn</code>.</td></tr>
</table>
<p>한 줄에 <code>ABC</code>처럼 파트 문자를 여러 개 쓰면 같은 MML이 각 파트에 들어가고, 같은 파트의 줄은 위에서 아래로 이어집니다. <code>;</code>부터 줄 끝까지는 주석, <code>|</code>는 읽기 위한 마디 표시입니다.</p>

<h3>음표, 길이, 쉼표</h3>
<p>음표는 <code>c d e f g a b</code>, 쉼표는 <code>r</code>입니다. 뒤의 숫자가 길이(4 = 4분음표, 8 = 8분음표)이고, 점(<code>.</code>)은 절반을 더합니다. <code>l</code>은 숫자를 생략했을 때의 기본 길이, <code>o</code>는 옥타브, <code>&gt;</code> <code>&lt;</code>는 한 옥타브 위·아래입니다. <code>&amp;</code>는 붙임줄, <code>^</code>는 앞 음에 길이를 더합니다.</p>
<pre data-ex="notes"></pre>
<pre data-ex="sharps"></pre>
<div class="tip">길이를 클럭 수로 바로 쓰려면 <code>c%24</code>처럼 <code>%</code>를 씁니다. 온음표가 128클럭(<code>C128</code>)일 때 4분음표는 32클럭입니다.</div>

<h3>템포</h3>
<p><code>T</code>는 분당 박자 수(BPM)이며 보통 A 파트에 한 번 씁니다. <code>t</code>는 타이머 값을 직접 지정합니다.</p>
<pre data-ex="tempo"></pre>

<h3>FM 음색</h3>
<p>FM 파트는 음색 <code>@n</code>이 있어야 소리가 납니다. 곡 안에 직접 정의하거나(아래처럼), 음색 파일(<code>#voice</code>)을 첨부합니다. 정의는 두 칸 들여 쓴 <code>@n</code> 다음에 <code>FB,ALG</code> 한 줄, 그리고 오퍼레이터마다 <code>AR,D1R,D2R,RR,D1L,TL,KS,ML,DT</code> 한 줄씩입니다.</p>
<pre data-ex="fmvoice"></pre>
<p>음색 줄에 커서를 두면 알고리즘·파형·엔벨로프 미리보기가 나오고, <b>✎ 편집</b>으로 <a href="#banks">FM 음색 편집기</a>를 엽니다.</p>

<h3>여러 파트 함께</h3>
<pre data-ex="parts"></pre>

<h3>SSG 소리</h3>
<p>SSG 파트(<code>D E F</code>)는 MUCOM88 원래 동작대로 소리 없는 엔벨로프로 시작합니다. <code>@0</code>–<code>@9</code> 프리셋이나 소프트웨어 엔벨로프 <code>E</code>를 주고, <code>v</code>로 음량을 정하세요. <code>P</code>는 톤/노이즈 선택입니다.</p>
<pre data-ex="ssg"></pre>

<h3>리듬 파트</h3>
<pre data-ex="rhythm"></pre>

<h3>반복, 루프, 매크로</h3>
<p><code>[ … ]n</code>은 n번 반복, 그 안의 <code>/</code>는 마지막 회에 거기서 빠져나옵니다. <code>L</code>은 곡이 끝난 뒤 돌아갈 루프 지점입니다. <code>#*n{ … }</code>로 구절을 한 번 정의해 두고 <code>*n</code>으로 부릅니다.</p>
<pre data-ex="repeat"></pre>
<pre data-ex="macro"></pre>

<h3>게이트와 디튠</h3>
<pre data-ex="effects"></pre>

<h3>MSX 음원 (MUCOMSX)</h3>
<p>MUCOMSX 파트로 MSX-MUSIC, MSX PSG, SCC를 OPNA와 함께 또는 따로 쓸 수 있습니다. SCC 파형은 32개 샘플(-128–127)로 된 <code>@Wn:{ … }</code>로 정의합니다.</p>
<pre data-ex="msx"></pre>
<p>MDPlayer4Mac v0.2.4 이후의 <b>MucoMSX 칩 확장 명령</b>(<code>?</code>로 시작하는 두 글자 명령)으로 엔벨로프, 비브라토, 공유 구절, 효과 프로그램 등을 쓸 수 있습니다. 압축 줄은 <code>?XU</code>로 시작해 <code>!</code>로 끝납니다.</p>
<pre data-ex="ext"></pre>
<p>더 많은 예는 <b>새로</b>의 MSX 확장 템플릿 다섯 개와 <a href="#ref-msx">MucoMSX 칩 확장 레퍼런스</a>를 보세요.</p>
`,
  },
  {
    id: 'editor',
    title: '편집기',
    html: `
<h3>색칠과 입력 제안</h3>
<p>파트(연주 색과 같은 색), 음표, 명령, 숫자, 반복·괄호, 매크로, 태그, 주석이 각각 다른 색으로 표시됩니다.</p>
<p>명령 문자, <code>@</code>, <code>*</code>, 줄 첫머리의 <code>#</code>이나 파트 문자를 치면 제안 목록이 나옵니다. 각 명령의 인수 형식과 한 줄 설명이 함께 나오며, 그 파트 종류(FM, SSG, 리듬, ADPCM, MSX 칩)에 맞는 명령만 보입니다. <code>@</code>는 곡에 정의된 음색(SCC 파트에서는 파형)을, <code>*</code>는 매크로를 보여 줍니다. MSX·SCC 파트에서 <code>?</code>를 치면 그 칩의 확장 명령이, 줄 첫머리에서 <code>?</code>를 치면 전역 자원(<code>?WD</code> 파형 등)이 예제와 함께 나옵니다.</p>
<ul>
  <li><kbd>Ctrl+Space</kbd>: 어디서나 목록 열기</li>
  <li><kbd>Tab</kbd> / <kbd>Enter</kbd>: 넣기, <kbd>Esc</kbd>: 닫기</li>
  <li>음표를 칠 때는 목록이 열리지 않습니다.</li>
</ul>

<h3>입력하는 동안 검사</h3>
<p>입력을 잠깐 멈추면 곡이 뒤에서 컴파일됩니다(재생은 끊기지 않습니다). 오류와 경고는 밑줄과 줄 번호 옆 표시로 나타나고, 오른쪽 <b>컴파일 메시지</b>에 목록으로 나옵니다.</p>

<h3>컴파일 메시지 읽기</h3>
<p>메시지마다 코드(E0498, W0408 …), 줄·칸·파트, 해당 줄과 위치를 가리키는 <code>^</code>, 컴파일러 원문, 그리고 <b>무슨 뜻</b>, <b>고치는 법</b>, 명령이면 <b>올바른 형식</b>이 나옵니다. 메시지를 누르면 그 줄로 가고, 빨간 줄(오류)이나 노란 줄(경고)로 표시됩니다. 컴파일러가 위치를 알려 주지 않고 실패하면 MUCPlayground가 곡을 줄여 가며 다시 컴파일해 그 줄을 찾아 줍니다.</p>
<p>컴파일러 메시지 외에 MUCPlayground 자체 검사도 있습니다.</p>
<ul>
  <li><b>PG01 / PG02</b>: 소리가 나지 않는 파트(SSG/PSG에 <code>@</code>·<code>E</code>가 없음, <code>v</code>가 없음).</li>
  <li><b>PG03</b>: 곡이 지정한 파일(<code>#voice</code>, <code>#pcm</code> 등)이 첨부되지 않음. <b>파일 첨부…</b>와 <b>폴더에서 찾기</b> 버튼이 함께 나옵니다.</li>
  <li><b>MSX19</b>: <code>#pcm</code> 태그의 파일이 없으면 MucoMSX와 같이 컴파일하지 않습니다.</li>
</ul>
<p>모든 코드의 설명은 <a href="#messages">3부 메시지 설명</a>에 있습니다.</p>

<h3>분할 편집</h3>
<p>아래 막대의 <b>분할</b> 버튼으로 같은 곡을 좌우(◫) 또는 위아래(⊟)로 두 번 보여 줍니다. 긴 곡의 두 곳을 동시에 고칠 때 편리하며, 어느 쪽에서 고쳐도 양쪽이 바뀝니다. 가운데 막대를 끌어 크기를 바꾸고, 두 번 누르면 반반이 됩니다.</p>

<h3>미리보기</h3>
<ul>
  <li><b>SCC 파형</b>: <code>@Wn:{…}</code>, <code>?WDn={…}</code> 줄에 커서를 두면 파형 그림이 나오고, 값 개수나 범위가 틀리면 빨간색으로 표시됩니다.</li>
  <li><b>FM 음색</b>: 음색 정의 줄에 커서를 두면 알고리즘, 출력 파형, 오퍼레이터별 엔벨로프가 나옵니다.</li>
  <li>두 미리보기 모두 <b>✎ 편집</b> 버튼으로 편집기를 엽니다(<a href="#banks">음색·파형·PCM</a> 참고).</li>
</ul>

<h3>글자 크기, 메뉴 크기, 도움말</h3>
<p>머리글의 <b>글자</b>로 편집기 글자 크기를, <b>메뉴</b>로 나머지 화면 요소의 크기를 바꿉니다. 모든 버튼에는 하는 일과 단축키를 알려 주는 툴팁이 있습니다(3개 언어).</p>
`,
  },
  {
    id: 'views',
    title: '오른쪽 프레임: 트래커·스코프·문법·건반',
    html: `
<p>편집기 아래의 <b>🎼 트래커</b>, <b>∿ 스코프</b>, <b>📖 문법</b>, <b>🎹 건반</b>은 화면을 나눠 오른쪽 프레임에 각 뷰를 엽니다(좁은 화면에서는 위아래). 가운데 막대를 끌어 폭을 바꿉니다. 채널 뷰가 열려 있을 때도 같은 오른쪽 프레임을 씁니다.</p>

<h3>트래커: 패턴</h3>
<p>곡을 Furnace 스타일의 트래커 패턴으로 보여 줍니다. 파트마다 열이 하나이고, 한 행은 <b>행</b> 설정(온음표의 1/4–1/64)만큼의 길이입니다. 칸에는 그 행에서 시작하는 음(<code>C#4</code>), 음색(<code>@</code>)과 음량(<code>v</code>, 16진수)이 나오고, 음 뒤의 쉼표는 <code>OFF</code>, 이어지는 음은 막대로 표시됩니다. 반복이나 매크로에서 온 음은 흐리게 나옵니다.</p>
<ul>
  <li>텍스트와 트래커는 서로 따라갑니다. 커서를 옮기면 트래커 커서가, 칸을 누르면 텍스트의 해당 토큰이 표시됩니다.</li>
  <li><b>직접 편집</b>: 칸을 누르고 보이는 형식대로 입력합니다. <code>C#4</code>, <code>D-5</code>, <code>OFF</code>, <code>...</code>(쉼표), <code>@</code>/<code>v</code> 칸은 16진수 두 자리입니다. <b>입력</b>을 트래커식으로 바꾸면 <kbd>Z S X D C</kbd> … / <kbd>Q 2 W 3 E</kbd> … 한 키로 음을 넣습니다.</li>
  <li><kbd>Delete</kbd>: 쉼표로, <kbd>1</kbd>: 음 끄기(OFF), <b>간격</b>: 입력 후 커서가 내려가는 행 수.</li>
  <li><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>: 트래커 편집 되돌리기/다시, <kbd>?</kbd>: 키 목록.</li>
  <li>재생 중에는 연주하는 행이 가운데 오도록 스크롤됩니다. 손으로 스크롤하면 잠깐 멈춥니다.</li>
</ul>

<h3>트래커: 롤</h3>
<p><b>보기: 롤</b>은 같은 음을 피아노 롤로 보여 줍니다. 시간은 고정된 빨간 연주선을 지나 왼쪽으로 흐르고, 음은 파트 색 막대로, 지금 울리는 음은 흰색으로 표시됩니다. 리듬·드럼·효과 파트는 맨 위 줄에 회색 표시로 나옵니다. <b>행</b>이 확대 정도이고, 멈춘 동안 휠이나 <kbd>←</kbd> <kbd>→</kbd>로 둘러봅니다. 음을 누르면 텍스트에서 그 위치를 보여 줍니다. 롤은 보기 전용이고 편집은 패턴에서 합니다.</p>

<h3>오실로스코프</h3>
<p>연주 중인 곡의 채널마다 오실로스코프를 하나씩 그립니다. 패널마다 파트 이름과 칩, 지금 연주하는 음이나 명령이 나오고, 파형은 흔들리지 않도록 상승 지점에 맞춰집니다.</p>
<ul>
  <li><b>시간폭</b>: 보여 줄 파형 길이(5–100 ms).</li>
  <li><b>레벨</b>: 패널 아래의 흰 막대가 채널의 음량을 나타냅니다.</li>
  <li><b>모든 채널</b>: 아직 소리 내지 않은 채널까지 모두 보여 줍니다.</li>
  <li><b>믹스</b>: 모든 채널이 섞여 나가는 소리를 맨 아래에 함께 그립니다.</li>
</ul>
<p>MUC, MUB, VGM 모두 채널별로 나옵니다(VGM은 YM2608·YM2203·YM2610·YM2151·YM2612·SN76489·AY8910·YM2413·SCC). 파형은 에뮬레이터 안의 채널 출력을 직접 읽은 것입니다.</p>

<h3>문법 가이드와 빠른 참조</h3>
<p><b>📖 문법</b>은 오른쪽에 MML 가이드를 엽니다. 위쪽에서 책(MUCOM88 / mucomDotNET 확장 / MucoMSX 칩 확장)을 고르고, 장 버튼이나 검색으로 찾습니다. 항목마다 형식, 설명, 색칠된 예제가 있고 <b>넣기</b>로 예제를 곡에 넣습니다. <b>커서 따라가기</b>를 켜 두면 커서가 있는 명령의 항목이 자동으로 펼쳐집니다(파트에 맞게: 예를 들어 FM 파트의 <code>@</code>는 FM 음색, G 파트의 <code>@</code>는 드럼). 같은 내용이 이 문서의 <a href="#part-ref">2부</a>에 있습니다.</p>
<p>오른쪽 패널의 <b>빠른 참조</b>는 모든 항목을 한 줄씩 보여 주며, 마찬가지로 커서를 따라갑니다. 줄을 누르면 문법 가이드의 그 항목이 열립니다.</p>

<h3>건반: 편집할 때</h3>
<p>편집 중에 <b>🎹 건반</b>을 누르면 편집기 아래에 피아노(3옥타브)가 열립니다. 마우스·터치로 치거나, 피아노를 한 번 누른 뒤 컴퓨터 키보드로 칩니다(<kbd>Z S X D C V G B H N J M</kbd> 아래 옥타브, <kbd>Q 2 W 3 E R 5 T</kbd> … 위 옥타브). <kbd>↑</kbd> <kbd>↓</kbd>나 − / +로 옥타브를 옮깁니다. 소리는 커서가 있는 파트의 FM 음색, SCC 파형, SSG 사각파, 리듬 노이즈를 따라가며, 곡의 다른 음색을 고를 수도 있습니다. 트래커가 열려 있으면 피아노로 친 음이 트래커에 들어갑니다.</p>

<h3>건반: 연주할 때</h3>
<p>건반 모드를 켠 채 곡을 재생하면 피아노 대신 오른쪽 프레임에 <b>파트마다 건반이 한 줄씩</b> 나오고, 연주하는 건반이 파트 색으로 눌립니다. 리듬·드럼 파트는 맨 아래에 드럼 패드(<code>BD SD TOP HH TOM RIM</code> 등, 효과 트랙은 <code>XD0–XD9</code>)로 나와 칠 때마다 반짝입니다. 정지하면 피아노와 원래 오른쪽 뷰가 돌아옵니다.</p>
`,
  },
  {
    id: 'channels',
    title: '채널 뷰',
    html: `
<p><b>▦ 채널 뷰</b>는 편집기 자리에 MDPlayer4Mac과 같은 칩 패널을 보여 줍니다. 채널마다 건반, 음 이름, 주파수, 레벨 미터, 팬, 음색 레지스터가 있고, SCC는 파형 표도 나옵니다. 지원 칩: YM2608, YM2610, YM2203, YM2151, YM2612(DAC 포함), YM2413, SN76489, AY-3-8910, K051649/K052539(SCC/SCC+).</p>

<h3>크기</h3>
<p>아래 막대의 <b>크기</b>는 맞춤 → 100 → 75 → 50 → 25 % 순으로 바뀝니다. 맞춤은 모든 패널이 화면에 들어가는 가장 큰 크기로, 창 크기를 따라갑니다.</p>

<h3>채널별 음량 (페이더)</h3>
<p>MUC와 MUB를 재생할 때는 칩 패널 옆에 채널마다 페이더가 있습니다(MDPlayer4Mac 믹서와 같은 단위, 0.5 dB 단계, −32(−16 dB)부터 +20(+10 dB)까지, 그 아래는 OFF).</p>
<ul>
  <li>끌어서 조절(0에서 잠깐 멈춤), 휠로 0.5 dB씩.</li>
  <li>숫자를 누르면 그 채널을 끄고 켭니다. 페이더를 두 번 누르면 0, VOL을 두 번 누르면 그 칩 전체가 0.</li>
  <li><b>RESET VOL</b>: 모든 채널을 0으로.</li>
  <li>설정은 다음 곡에도 유지되고, 저장하는 파일은 바뀌지 않습니다. VGM은 채널별 음량을 지원하지 않습니다.</li>
</ul>

<h3>VGM·MUB와 오른쪽 프레임</h3>
<p><code>.mub</code>·<code>.vgm</code>을 재생하면 채널 뷰가 자동으로 열립니다. 채널 뷰 옆에서도 트래커·스코프·건반을 열 수 있습니다. MML이 없는 파일은 칩 레지스터 기록에서 음을 읽어 트래커(읽기 전용, 열 이름은 <code>OPNA FM1</code>처럼 칩과 채널)와 채널별 건반에 보여 줍니다. 이 작업은 트래커나 건반을 열었을 때만, 별도 스레드에서 합니다.</p>
`,
  },
  {
    id: 'files',
    title: '파일 열기·저장',
    html: `
<h3>열기</h3>
<ul>
  <li><b>열기…</b>: <code>.muc</code>, <code>.mub</code>, <code>.vgm</code>, <code>.vgz</code>와 음색·PCM 파일(<code>.dat</code>, <code>.pcm</code>, <code>.bin</code>, <code>.wav</code>)을 엽니다. 곡과 그 파일들을 함께 고르면(<kbd>Ctrl</kbd>/<kbd>⌘</kbd> 또는 <kbd>Shift</kbd>+클릭) 파일이 먼저 첨부된 뒤 곡이 열립니다.</li>
  <li><b>끌어다 놓기</b>: 파일을 페이지에 놓으면 됩니다. <code>.muc</code>는 편집기에 열리고 재생되며, <code>.mub</code>/<code>.vgm</code>은 재생됩니다. 폴더를 놓으면 플레이리스트로 열립니다.</li>
  <li><b>폴더…</b>: 내 컴퓨터의 폴더를 열어 곡 목록을 보여 줍니다(이름 검색, 하위 폴더별). 곡을 열면 그 곡이 지정한 파일을 폴더에서 찾아 자동으로 첨부합니다. Chrome·Edge는 폴더를 기억합니다.</li>
</ul>

<h3>음색·PCM 파일 첨부</h3>
<p>곡이 <code>#voice</code>(FM 음색), <code>#sccvoice</code>(SCC 파형), <code>#pcm</code>(ADPCM 샘플) 태그로 파일을 지정하거나 기본 파일(<code>voice.dat</code>, <code>SCCVOICE.DAT</code>, <code>mucompcm.bin</code>)을 쓰면 그 파일이 필요합니다. 브라우저는 내가 연 파일 옆의 파일을 읽을 수 없으므로 다음 중 하나로 첨부합니다.</p>
<ol>
  <li><b>열기…</b>에서 곡과 함께 고르기</li>
  <li><b>폴더…</b>로 폴더째 열기</li>
  <li>오른쪽 <b>음색 / PCM 추가</b>나 끌어다 놓기</li>
</ol>
<p>첨부되지 않은 파일은 경고 PG03과 함께 <b>파일 첨부…</b>, <b>폴더에서 찾기</b> 버튼으로 알려 줍니다. 저장소 샘플은 같은 폴더에서 자동으로 가져옵니다.</p>

<h3>자동 저장과 내 곡 보호</h3>
<p>편집 중인 곡은 첨부 파일과 함께 브라우저에 자동 저장되어, 다음에 열면 그대로 이어집니다. 샘플이나 다른 파일이 내 곡을 대신하려 할 때 저장하지 않은 변경이 있으면 먼저 묻습니다: <b>.muc로 저장하고 계속</b>, <b>저장하지 않고 계속</b>, <b>취소</b>. 계속하더라도 내 곡은 따로 보관되어 <b>되돌리기</b>로 다시 불러올 수 있습니다.</p>

<h3>저장과 내보내기</h3>
<table>
  <tr><th>버튼</th><th>내용</th></tr>
  <tr><td>저장 / .muc (<kbd>Ctrl+S</kbd>)</td><td>곡을 Shift-JIS, CR+LF로 저장합니다(MSX에서 바로 쓸 수 있는 형식). Shift-JIS로 쓸 수 없는 글자(한글, 이모지 등)가 있으면 <code>?</code>로 바뀌므로 먼저 알려 줍니다.</td></tr>
  <tr><td>.mub</td><td>MUCPlayground 컴파일러의 출력(MDPlayer4Mac과 같음). MSX의 MUC2MUB 결과와 바이트 단위로 같지는 않으므로 실기에서 확인하세요.</td></tr>
  <tr><td>.vgm</td><td>모든 칩 쓰기를 기록한 VGM 1.71. 루프가 있는 곡은 처음부터 한 번 + 루프 한 번 더, 최대 10분.</td></tr>
</table>
<div class="warn">주석에 한글을 쓰면 편집기에서는 보이지만 <code>.muc</code>로 저장할 때 <code>?</code>로 바뀝니다. 오래 보관할 메모는 영어나 일본어로 쓰거나 공유 링크로 보관하세요.</div>

<h3>.mub · .vgm · .vgz 재생</h3>
<p><b>열기…</b>나 끌어다 놓기로 재생합니다. <code>.mub</code>는 편집기 엔진으로, <code>.vgm</code>/<code>.vgz</code>는 MDPlayer4Mac의 VGM 플레이어로 재생합니다(처음 한 번 약 7 MB를 받습니다). 재생하면 채널 뷰가 자동으로 열립니다.</p>
`,
  },
  {
    id: 'samples',
    title: '샘플과 템플릿',
    html: `
<h3>샘플…</h3>
<p>저장소의 <a href="https://github.com/ToughkidDev/MUCOMSX/tree/main/Samples">Samples</a> 폴더를 폴더별로 보여 줍니다. 위의 검색 상자로 이름을 찾고, 곡을 누르면 <code>.muc</code>는 편집기에 열리고(음색·PCM 파일도 같은 폴더에서 가져옴) <code>.mub</code>/<code>.vgm</code>/<code>.vgz</code>는 재생됩니다.</p>
<ul>
  <li>폴더 옆의 <b>📂</b>는 그 폴더의 곡 전체를 플레이리스트로 엽니다.</li>
  <li>목록은 GitHub에서 실시간으로 읽으므로, 저장소에 올린 곡이 바로 나옵니다. 10분 동안 기억하며 <b>새로고침</b>으로 다시 읽습니다.</li>
  <li>GitHub에 연결되지 않으면(시간당 약 60회 제한 등) 페이지에 내장된 목록을 씁니다.</li>
  <li>VGM 앨범은 <code>Samples/VGMs</code>에 있고 MUC 폴더 뒤에 나옵니다.</li>
</ul>

<h3>새로 만들기: 템플릿</h3>
<p><b>새로</b>는 곡을 시작할 템플릿 목록을 엽니다. 모든 템플릿은 영어·일본어 주석이 달려 있고, 메시지 없이 컴파일되며, 모든 파트가 8마디입니다.</p>
<table>
  <tr><th>템플릿</th><th>내용</th></tr>
  <tr><td>OPNA + MSX 칩</td><td>일반 MML로 OPNA FM·리듬과 MSX-MUSIC, MSX PSG, SCC 다섯 파트를 함께 씁니다.</td></tr>
  <tr><td>MSX 확장: 모든 칩</td><td>MucoMSX 칩 확장 명령으로 모든 MSX 칩을 함께.</td></tr>
  <tr><td>MSX 확장: OPNA + MSX</td><td>OPNA FM·리듬과 확장 명령 MSX 파트(<code>C112</code>, <code>t198</code>로 맞춤).</td></tr>
  <tr><td>MSX 확장: SCC</td><td><code>?WD</code> 파형, <code>?EP</code> 엔벨로프, <code>?MV</code> 비브라토, <code>?DB</code> 코러스, <code>?FD</code> 구절, <code>?FB</code> 반복, <code>?FJ</code> 루프.</td></tr>
  <tr><td>MSX 확장: PSG</td><td><code>?XD</code> 효과로 만든 드럼 파트.</td></tr>
  <tr><td>MSX 확장: MSX-MUSIC</td><td><code>@n</code>·<code>?IU</code> 악기, <code>?QP</code> 게이트, <code>?IS</code> 서스테인, <code>?ID</code> 드럼과 <code>?IT</code> 키트.</td></tr>
</table>
<p>저장소의 <code>Samples/Muc/Templates</code>에는 기초, 칩별, 드럼 라이브러리, 장르별 반주, SCC 파형 모음, 완성된 데모(<i>Midnight Pier</i>, <i>Killer Coast Land OPNA Arrange</i>)도 있습니다.</p>
`,
  },
  {
    id: 'playlist',
    title: '플레이리스트',
    html: `
<p><b>☰ 플레이리스트</b>는 오른쪽에 곡 목록(<code>.muc</code>, <code>.mub</code>, <code>.vgm</code>, <code>.vgz</code>)을 엽니다. 곡을 누르면 재생하고, ✕로 빼고, <b>비우기</b>로 목록을 비웁니다. 가운데 막대로 폭을 바꿉니다.</p>

<h3>곡 넣기</h3>
<ul>
  <li><b>목록 위에 끌어다 놓기</b>: 끝에 추가만 합니다.</li>
  <li><b>다른 곳에 끌어다 놓기</b>: 추가하고 바로 재생합니다(함께 놓은 음색·PCM 파일도 같이 갑니다).</li>
  <li><b>폴더 놓기</b>: 플레이리스트가 켜지고 그 폴더의 모든 곡이 들어갑니다.</li>
  <li><b>샘플의 📂</b>: 그 저장소 폴더의 곡을 엽니다. 목록에 이미 곡이 있으면 <b>새 플레이리스트</b>로 할지 <b>끝에 추가</b>할지 묻습니다.</li>
</ul>

<h3>연속 재생</h3>
<p>2곡 이상이면 ⏮ ⏭와 루프 버튼이 켜집니다. <b>랜덤</b> 모드에서는 곡이 끝날 때마다 다른 곡이 무작위로 이어집니다. 자세한 내용은 <a href="#play">재생</a>을 보세요.</p>

<h3>플레이리스트 공유</h3>
<p>저장소 폴더 하나로 만든 플레이리스트는 위쪽 <b>🔗 공유</b>나 머리글의 공유 버튼으로 링크를 만들 수 있습니다(<code>?playlist=VGMs/MSX_VampireKiller_Enhanced&amp;song=…</code>). 나중에 그 폴더에 추가된 곡도 링크를 열 때 함께 나옵니다.</p>
`,
  },
  {
    id: 'banks',
    title: '음색·파형·PCM 뱅크와 편집기',
    html: `
<h3>FM 뱅크</h3>
<p>오른쪽 <b>🎛 FM 뱅크</b>는 오른쪽 프레임에 곡의 FM 음색 목록을 엽니다. 음색 파일(<code>#voice</code>)의 음색과 MUC 안에 정의한 음색이 함께 나오고, 각각 <code>DAT</code>, <code>MUC</code>, <code>MUC▸DAT</code>(같은 번호가 둘 다 있으면 MUC가 이김)로 표시됩니다. 이름, 알고리즘, 피드백, 곡에서 쓰인 횟수가 나옵니다.</p>
<table>
  <tr><th>버튼</th><th>키</th><th>하는 일</th></tr>
  <tr><td>추가</td><td><kbd>Insert</kbd> <kbd>N</kbd></td><td>빈 번호에 Furnace 기본 음색 추가</td></tr>
  <tr><td>삭제</td><td><kbd>Delete</kbd></td><td>음색 삭제(쓰이고 있으면 물음)</td></tr>
  <tr><td>편집</td><td><kbd>Enter</kbd> <kbd>E</kbd></td><td>FM 음색 편집기 열기</td></tr>
  <tr><td>이름</td><td><kbd>F2</kbd> <kbd>R</kbd></td><td>파일 음색 이름(6자)</td></tr>
  <tr><td>→DAT / →MUC</td><td><kbd>D</kbd> / <kbd>M</kbd></td><td>MUC 음색을 파일로 옮기기 / 파일 음색을 MUC로 복사</td></tr>
  <tr><td>가져오기</td><td><kbd>I</kbd></td><td><code>.dat</code>, <code>.muc</code>, <code>.mub</code>, <code>.vgm</code>/<code>.vgz</code>에서 음색 가져오기(VGM은 키온 때의 음색)</td></tr>
  <tr><td>불러오기 / 저장</td><td><kbd>L</kbd> / <kbd>S</kbd></td><td>음색 파일 쓰기 / 내려받기</td></tr>
  <tr><td>↶</td><td><kbd>U</kbd> <kbd>Ctrl+Z</kbd></td><td>파일 변경 되돌리기</td></tr>
  <tr><td>듣기 / @n 넣기</td><td><kbd>Space</kbd> / <kbd>@</kbd></td><td>음색 듣기 / 커서 위치에 <code>@n</code> 쓰기</td></tr>
</table>
<p><kbd>Ctrl</kbd>/<kbd>⌘</kbd>+클릭, <kbd>Shift</kbd>+클릭으로 여러 개를 골라 한꺼번에 삭제·이동할 수 있습니다. <kbd>F6</kbd>는 텍스트와 뱅크 사이를 오가고, <kbd>?</kbd>는 키 목록을 보여 줍니다. <b>대상</b>으로 추가·가져온 음색이 파일로 갈지 MUC로 갈지 정합니다.</p>

<h3>SCC 뱅크</h3>
<p><b>〰 SCC 뱅크</b>는 SCC 파형(<code>#sccvoice</code> 파일, MUC의 <code>@Wn:{…}</code>, <code>?WDn={…}</code>)을 같은 방식으로 다룹니다. 파형 그림과 모양(사인, 톱니, 사각, 펄스, 삼각)이 나오며, <code>.dat</code>(SCWD), <code>.muc</code>, <code>.vgm</code>/<code>.vgz</code>, Furnace <code>.fur</code>/<code>.fuw</code>에서 가져올 수 있습니다.</p>

<h3>PCM 뱅크</h3>
<p><b>🥁 PCM 뱅크</b>는 ADPCM 파트(<code>K</code>)의 샘플 <code>@1</code>–<code>@32</code>를 보여 줍니다. PCM 파일(<code>#pcm</code>, <code>mucompcm.bin</code>)이나 MUC의 <code>#@pcm</code> 줄에서 읽으며, 파형, 길이, 크기, 쓰인 횟수와 칩 용량(256 KB) 중 사용량이 나옵니다. 누르면 칩과 같은 소리로 들립니다. <code>.wav</code>, mp3·ogg·flac 등 브라우저가 읽을 수 있는 소리, PCM 뱅크, <code>.mub</code>, <code>.vgm</code>/<code>.vgz</code>에서 가져올 수 있습니다.</p>

<h3>FM 음색 편집기</h3>
<p>FM 음색 미리보기나 FM 뱅크의 <b>편집</b>으로 엽니다. Furnace의 FM 악기 편집기를 본뜬 화면으로 알고리즘 8가지 그림, OP1 피드백, 오퍼레이터마다 AR, DR(D1R), SL(D1L), D2R, RR, TL, KS, MULT, DT 슬라이더와 엔벨로프 그림이 있습니다. 캐리어의 TL이 0이 아니면 경고합니다. <b>▶ 듣기</b>(o1–o7, 근사 소리), 오퍼레이터 복사·붙여넣기, <b>초기화</b>, 되돌리기를 쓸 수 있고, <b>적용</b>/<b>완료</b>는 원래 줄 모양과 주석을 지키며 다시 씁니다.</p>

<h3>SCC 파형 편집기</h3>
<p>파형 미리보기의 <b>✎ 편집</b>으로 엽니다. 마우스나 손가락으로 그리거나, <i>모양</i> 탭(사인·삼각·톱니·펄스, 배음 16개)이나 <i>FM</i> 탭(오퍼레이터 4개)으로 만들고, <i>도구</i>(이동, 부드럽게, 증폭, 정규화, 반전, 뒤집기 등)로 다듬습니다. 값을 10진수·16진수로 직접 칠 수도 있고, <b>▶ 듣기</b>로 o2–o6에서 들어 봅니다. <b>적용</b>은 <code>@Wn:{…}</code>(MucoMSX 파형은 <code>?WDn={…}</code>) 한 줄로 다시 씁니다.</p>

<h3>PCM 샘플 편집기</h3>
<p>PCM 뱅크의 <b>편집</b>으로 엽니다(Furnace 샘플 편집기 스타일). 파형을 끌어 선택하고 휠로 확대하며, <b>자르기</b>, <b>삭제</b>, <b>무음</b>, <b>페이드 인/아웃</b>, <b>정규화</b>, <b>증폭 %</b>, <b>뒤집기</b>, <b>반전</b>, <b>DC 제거</b>, <b>리샘플</b>(o1 c 16.1 kHz 등)을 씁니다. <b>▶ 듣기</b>는 원래 속도나 음 높이로, <i>칩처럼</i>을 켜면 ADPCM-B로 인코딩했다 되살린 소리로 들려줍니다.</p>
`,
  },
  {
    id: 'share',
    title: '공유 링크',
    html: `
<p>머리글의 <b>🔗 공유</b>는 지금 열려 있는 것을 여는 링크를 만듭니다. 서버가 없으므로 링크 자체에 곡이 담기며, 아무것도 업로드되지 않습니다.</p>

<h3>무엇이 공유되나</h3>
<table>
  <tr><th>지금 열려 있는 것</th><th>링크</th></tr>
  <tr><td>저장소 폴더로 만든 플레이리스트</td><td><code>?playlist=폴더&amp;song=곡</code></td></tr>
  <tr><td>채널 뷰의 저장소 <code>.mub</code>/<code>.vgm</code></td><td><code>?sample=VGMs/…/곡.vgz</code></td></tr>
  <tr><td>채널 뷰의 내 <code>.mub</code>/<code>.vgm</code></td><td>파일을 링크에 담음 <code>#f=…</code>(압축 후 최대 96 KB)</td></tr>
  <tr><td>고치지 않은 저장소 샘플</td><td><code>?sample=Muc/…/곡.muc</code></td></tr>
  <tr><td>고치지 않은 내장 예제·템플릿</td><td><code>?ex=demo</code>, <code>?ex=template</code>, <code>?ex=extScc</code> …</td></tr>
  <tr><td>그 밖의 곡</td><td>텍스트를 압축해 링크에 담음 <code>#s=…</code>. 저장소에서 온 첨부 파일은 경로로, 내 작은 파일(합계 24 KB까지)은 링크 안에 담깁니다.</td></tr>
</table>

<h3>함께 담기는 것</h3>
<ul>
  <li>트래커나 스코프가 열려 있으면 <code>&amp;view=tracker</code> / <code>&amp;view=scope</code>가 붙어, 링크를 열 때 같은 뷰가 열립니다.</li>
  <li>재생·일시정지 중에 만든 링크에는 <code>&amp;play=1</code>이 붙어, 열자마자 재생을 시작합니다(브라우저가 첫 클릭을 요구할 수 있음). 정지 중에 만든 링크는 열기만 합니다.</li>
</ul>
<p>공유 창에는 링크와 <b>복사</b> 버튼(휴대폰은 시스템 공유)이 있고, 링크에 무엇이 담겼는지 알려 줍니다. 8,000자가 넘으면 일부 메신저가 링크를 자를 수 있다고 경고합니다.</p>

<h3>링크를 열었을 때</h3>
<p>링크로 열면 주소는 바로 정리되고, 내가 쓰던 곡은 따로 보관됩니다. 위쪽 안내의 <b>되돌리기</b>로 첨부 파일과 함께 다시 불러옵니다.</p>
`,
  },
  {
    id: 'player',
    title: '플레이어 모드',
    html: `
<p>머리글의 <b>🎧 플레이어 모드</b>는 곡을 멈추고 편집기 자리에 <a href="https://toughkiddev.github.io/MDPlayer4Mac/MDPlayer4Web/">MDPlayer4Web</a>을 띄웁니다. MDPlayer4Mac의 웹판으로, 여러 형식의 음악 파일을 재생합니다. 그동안 나머지 화면은 흐리게 잠기고, 버튼을 다시 누르면 플레이어가 닫히고 편집기가 원래대로 돌아옵니다.</p>
`,
  },
  {
    id: 'keys',
    title: '단축키',
    html: `
<h3>전체</h3>
<table>
  <tr><th>키</th><th>동작</th></tr>
  <tr><td><kbd>Ctrl+Enter</kbd></td><td>재생</td></tr>
  <tr><td><kbd>Ctrl+Shift+Enter</kbd></td><td>커서 줄(선택한 줄) 재생</td></tr>
  <tr><td><kbd>F8</kbd></td><td>일시정지 / 계속</td></tr>
  <tr><td><kbd>Esc</kbd></td><td>정지(제안 목록이 열려 있으면 닫기)</td></tr>
  <tr><td><kbd>Ctrl+S</kbd></td><td>.muc 저장</td></tr>
  <tr><td><kbd>Ctrl+Space</kbd></td><td>입력 제안 열기</td></tr>
  <tr><td><kbd>Tab</kbd> / <kbd>Enter</kbd></td><td>제안 넣기</td></tr>
  <tr><td><kbd>F6</kbd></td><td>텍스트 ↔ 뱅크 이동(뱅크가 열려 있을 때)</td></tr>
</table>
<p>Mac에서는 <kbd>Ctrl</kbd> 대신 <kbd>⌘</kbd>도 됩니다.</p>

<h3>트래커</h3>
<table>
  <tr><th>키</th><th>동작</th></tr>
  <tr><td>방향키, <kbd>PgUp</kbd> <kbd>PgDn</kbd>, <kbd>Home</kbd> <kbd>End</kbd></td><td>이동</td></tr>
  <tr><td><kbd>Ctrl+↑</kbd> / <kbd>Ctrl+↓</kbd></td><td>그 파트의 이전 / 다음 음</td></tr>
  <tr><td><kbd>Enter</kbd> / <kbd>F2</kbd></td><td>칸 입력 열기</td></tr>
  <tr><td><kbd>Delete</kbd></td><td>쉼표로</td></tr>
  <tr><td><kbd>1</kbd></td><td>음 끄기(OFF, 트래커 입력)</td></tr>
  <tr><td>숫자패드 <kbd>/</kbd> <kbd>*</kbd></td><td>옥타브 내리기 / 올리기</td></tr>
  <tr><td><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd></td><td>되돌리기 / 다시</td></tr>
  <tr><td><kbd>?</kbd></td><td>키 목록</td></tr>
</table>

<h3>건반(피아노)</h3>
<p>피아노를 한 번 누른 뒤: <kbd>Z S X D C V G B H N J M</kbd> 아래 옥타브, <kbd>Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P [ = ]</kbd> 위 옥타브, <kbd>↑</kbd> <kbd>↓</kbd> 옥타브 이동.</p>
`,
  },
  {
    id: 'mobile',
    title: 'iPhone·iPad와 브라우저',
    html: `
<ul>
  <li>소리는 탭으로 시작합니다(재생 버튼, 또는 안내가 나오면 아무 곳이나 탭).</li>
  <li>페이지가 미디어 플레이어로 등록되므로 무음 스위치나 iPad 무음 모드에서도 소리가 납니다.</li>
  <li>엔진에는 iOS/iPadOS 16.4 이상이 필요합니다(WebAssembly SIMD, 예외 처리).</li>
  <li>연주 중에도 버튼이 한 번에 눌리도록 터치를 따로 처리합니다.</li>
  <li>좁은 화면에서는 오른쪽 프레임이 아래로 내려가고, 트래커를 열면 편집기 영역이 커집니다.</li>
  <li><b>폴더…</b>로 폴더를 열 때 Chrome·Edge는 폴더를 기억하고, Safari·Firefox는 매번 고릅니다.</li>
</ul>
`,
  },
  {
    id: 'faq',
    title: '문제 해결',
    html: `
<h3>소리가 나지 않아요</h3>
<ul>
  <li>처음 접속했다면 화면을 한 번 누르세요. 브라우저는 클릭 전에는 소리를 막습니다.</li>
  <li>SSG/PSG 파트에 <code>@</code>(또는 <code>E</code>)와 <code>v</code>가 있는지 보세요(경고 PG01/PG02).</li>
  <li>FM 파트에 음색 <code>@n</code>이 정의되어 있는지, 음색 파일이 첨부됐는지 보세요(PG03).</li>
  <li>음량 슬라이더, 채널 뷰의 채널 페이더(OFF)를 확인하세요.</li>
</ul>

<h3>컴파일되지 않아요</h3>
<p>오른쪽 <b>컴파일 메시지</b>에서 빨간 메시지를 누르면 그 줄로 가고, 무슨 뜻과 고치는 법이 나옵니다. <code>#pcm</code> 태그의 파일이 첨부되지 않으면 MSX19로 컴파일하지 않습니다. 파일을 첨부하거나 태그를 지우세요. 코드별 설명은 <a href="#messages">3부</a>에 있습니다.</p>

<h3>음색이나 PCM이 빠진 채 연주돼요</h3>
<p>곡이 쓰는 파일이 첨부되지 않은 경우입니다. 곡을 <b>폴더…</b>로 열거나, <b>열기…</b>에서 곡과 파일을 함께 고르거나, 메시지의 <b>폴더에서 찾기</b>를 누르세요.</p>

<h3>소리가 끊겨요</h3>
<p>"렌더링이 재생을 따라잡는 중입니다" 안내가 나오면 기기가 실시간으로 소리를 만들기 버거운 상태입니다. 다른 탭이나 앱을 줄이고, 스코프·트래커처럼 그리는 뷰를 닫아 보세요. VGM 스코프는 연산을 조금 더 씁니다.</p>

<h3>샘플 목록이 오래됐거나 비어 있어요</h3>
<p>목록은 10분간 기억됩니다. 샘플 창의 <b>새로고침</b>을 누르세요. GitHub API 한도(시간당 약 60회)에 걸리면 페이지에 내장된 목록을 씁니다.</p>

<h3>저장한 .muc에서 글자가 ?로 바뀌었어요</h3>
<p><code>.muc</code>는 Shift-JIS로 저장되어 한글 등은 쓸 수 없습니다. 주석은 영어나 일본어로 쓰세요.</p>

<h3>링크로 연 뒤 내 곡이 사라졌어요</h3>
<p>사라지지 않고 따로 보관됩니다. 위쪽 안내의 <b>되돌리기</b>를 누르세요.</p>
`,
  },
  {
    id: 'about',
    title: '만든 사람과 라이선스',
    html: `
<p>MUCPlayground — Written by ToughkidCST. 소스: <a href="https://github.com/ToughkidDev/MUCOMSX/tree/main/MUCPlayground">github.com/ToughkidDev/MUCOMSX</a></p>
<ul>
  <li><b>MDPlayer4Mac</b>(ToughkidCST): 컴파일러, 드라이버, 칩 에뮬레이터, 채널 뷰. GPL-3.0.</li>
  <li><b>MUCOM88</b> © 古代祐三. CC BY-NC-SA 4.0.</li>
  <li><b>mucomDotNET</b>(kuma4649), <b>MDSound</b>, <b>MDPlayer</b>.</li>
  <li><b>Furnace</b>: 트래커·편집기 화면의 본보기.</li>
</ul>
<p>엔진은 MDPlayer4Mac을 WebAssembly로 빌드한 것이며, 데스크톱 MDPlayer4Mac과 같은 소리를 냅니다.</p>
`,
  },
];
