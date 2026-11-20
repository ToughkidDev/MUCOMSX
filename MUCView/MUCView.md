# MUCVIEW 사용 설명서

MUC 소스를 MSX에서 열어 보고, 그 자리에서 컴파일·연주·MUB 내보내기를 하는 뷰어

작성 기준: 2026년 11월 21일 · MUCVIEW v0.2

---

## 1. MUCVIEW는 무엇인가

MUCVIEW는 MUC 파일을 읽기 전용으로 열어 보는 프로그램입니다. 보던 자리에서 F1 메뉴로 MUCPLAY를 불러 컴파일하고, 연주하고, MUB로 내보낼 수 있습니다. 끝나면 보던 줄로 돌아옵니다.

MUCEDIT에서 편집 기능을 뺀 별개의 프로그램입니다. 문서를 바꾸지 않으므로 저장할 것이 없고, 디스크에 상태 파일이나 임시 파일을 쓰지 않습니다. 곡을 고치려면 MUCEDIT을 쓰세요.

이런 때 편합니다.

- 받은 곡이 어떤 내용인지 훑어보고 바로 들어 볼 때
- 파일 관리자(MM)에서 MUC 파일을 골라 RETURN으로 열 때
- 빈 공간이 없는 디스크의 곡을 들을 때

## 2. 실행 환경

- MSX2 이상(80칸 화면), MSX-DOS 2 또는 Nextor
- 메모리 매퍼의 빈 세그먼트 4개(64KiB, 문서용). 파일 목록에 1개(16KiB)를 더 쓰며, 없으면 파일 이름을 직접 입력합니다.
- 컴파일·연주·내보내기에는 같은 릴리스의 `MUCPLAY.COM`과 `MUCPLAY.MXR`이 필요합니다. 작업 폴더, MUCVIEW가 있는 폴더, PATH 순서로 찾습니다.
- 소리를 들으려면 MUCPLAY와 같은 음원 구성(Makoto 등)이 필요합니다. 자세한 것은 MUCPLAY 설명서를 보세요.

컴파일과 연주에 필요한 매퍼 메모리는 MUCPLAY를 프롬프트에서 실행할 때와 같습니다. MUCVIEW는 MUCPLAY를 부르기 전에 자기가 쓰던 메모리를 모두 돌려주고, 돌아와서 문서를 다시 읽습니다.

MSX1에서는 80칸 화면이 없어 쓸 수 없습니다. `MUCVIEW: MSX2 required.`를 표시하고 끝납니다. MSX1에서 MUC를 연주하려면 `MUCPLAY SONG.MUC`를 쓰세요.

## 3. 실행

```text
MUCVIEW            파일 목록에서 고릅니다
MUCVIEW SONG.MUC   그 파일을 엽니다 (없으면 알린 뒤 파일 목록)
```

컴파일·연주·내보내기를 하려면 **곡이 있는 폴더에서** 실행하고 **파일 이름만** 주세요(경로와 공백 없이 24자까지). 곡이 쓰는 음색·PCM 파일을 작업 폴더에서 찾기 때문입니다. 경로를 붙여 연 파일은 볼 수는 있지만 컴파일하려 하면 다음 안내가 나옵니다.

```text
Compile: local name, no spaces. Start in song folder.
```

`MUCVIEW.COM`은 PATH가 닿는 곳에 두고, 곡 폴더로 이동해서 실행하는 방식을 권합니다.

## 4. 화면

```text
MUCView v0.2 by ToughkidCST  |  SONG.MUC
(문서 22줄)
F1 Commands  Ctrl+O Open  Ctrl+F Find  F3 Find next
```

맨 윗줄에 파일 이름, 가운데 22줄에 문서, 맨 아랫줄에 키 안내가 나옵니다. 안내와 오류 문구도 맨 아랫줄에 나오며, ` Press a key.`가 붙은 문구는 아무 키나 누르면 지워집니다.

## 5. 키

| 키 | 동작 |
| --- | --- |
| 방향키 | 커서 이동 |
| Ctrl+←, Ctrl+→ | 단어 단위로 이동 |
| HOME / SELECT | 행의 처음 / 끝 |
| Ctrl+HOME / Ctrl+SELECT | 문서의 처음 / 끝 |
| Ctrl+F | 찾기 (찾을 문자열 입력) |
| F3 | 다음 찾기 |
| Esc | 찾은 곳 표시(`[FOUND]`) 해제 |
| Ctrl+O | 파일 목록 |
| F1 | 명령 메뉴 |

찾는 문자열이 없으면 `Text not found.`가 나옵니다.

### 파일 목록

작업 폴더의 `*.MUC`를 보여 줍니다.

| 키 | 동작 |
| --- | --- |
| ↑ ↓ | 고르기 |
| Ctrl+↑, Ctrl+↓ | 쪽 넘기기 |
| RETURN | 열기 |
| Esc | 취소 |
| 글자 입력 | 아래 `File:` 줄에 파일 이름을 직접 입력 |

MUC 파일이 없으면 `No MUC files. Type a filename below.`가 나옵니다.

## 6. 명령 메뉴 (F1)

F1을 누르면 아래 두 줄이 나오고, 이어서 누른 키로 명령을 고릅니다. Esc 등 다른 키를 누르면 취소됩니다.

```text
Q Quit          O Reload
1 Open/MUC      2 Compile    3 Play/Muc                4 Exp/MUB
```

| 키 | 동작 |
| --- | --- |
| `1` | 파일 열기(파일 목록) |
| `2` | 컴파일. MUCPLAY가 결과나 오류를 보여 주고, 키를 누르면 보던 자리로 돌아옵니다. 컴파일 결과는 메모리에 남습니다. |
| `3` | 연주. 컴파일해 둔 문서면 그 결과를 바로 연주하고, 아니면 컴파일과 연주를 한 번에 합니다. 아무 키나 누르면 멈추고 돌아옵니다. |
| `4` | MUB 내보내기. 먼저 `2`로 컴파일해야 합니다. PCM을 MUB에 넣을지 묻습니다. |
| `O` | 다시 읽기. 디스크의 파일을 다시 읽습니다(컴파일 결과와의 연결은 끊어집니다). |
| `Q` | 끝내기. 메모리에 남은 컴파일 결과를 해제하고 DOS로 돌아갑니다. |

### 컴파일 (`2`)

화면이 MUCPLAY로 바뀌어 컴파일 과정과 결과가 나옵니다. 오류가 있으면 MUCPLAY의 오류 문구와 줄 번호가 나옵니다. 문구의 뜻은 MUCPLAY 설명서와 MUC2MUB 설명서에 있습니다.

```text
Press a key to return.
```

키를 누르면 MUCVIEW로 돌아와 보던 줄, 커서, 찾던 문자열이 그대로 복원됩니다.

### 연주 (`3`)

- `2`로 컴파일해 둔 문서: 메모리의 컴파일 결과를 바로 연주합니다.
- 컴파일하지 않은 문서: 컴파일과 연주를 한 번에 합니다. 이때는 컴파일 결과를 메모리에 남기지 않으므로, 내보내려면 `2`를 먼저 하세요.

곡을 두 바퀴 연주하면 스스로 끝나고, 그 전에 아무 키나 누르면 멈춥니다. 어느 쪽이든 보던 자리로 돌아옵니다.

### MUB 내보내기 (`4`)

```text
Include the PCM file in the MUB? (Y/N)
```

`Y`는 `#pcm` 파일을 MUB 안에 넣고(MUCPLAY의 `/P`), `N`이나 Esc는 넣지 않습니다. 넣지 않은 MUB는 연주할 때 MUB와 같은 폴더의 `#pcm` 파일을 읽습니다. 출력 파일은 작업 폴더에 문서와 같은 이름의 `.MUB`로 만들어집니다.

컴파일하지 않은 문서에서는 `Compile this text first: F1 then 2.`가 나옵니다.

## 7. MM(Multi Mente)에서 열기

MM의 `MMRET.DAT`에 다음 줄을 넣으면 MUC 파일에서 RETURN을 눌러 MUCVIEW로 엽니다(`<탭>`은 탭 문자).

```text
.MUC<탭>MUCVIEW $C
```

뷰어가 열리면 F1 `3`으로 연주하고, F1 `Q`로 끝내면 MM으로 돌아옵니다.

RETURN으로 바로 연주만 하고 싶으면 예전처럼 `.MUC<탭>MUCPLAY $C`를 쓰면 됩니다. `.MUC`에는 둘 중 하나만 연결하세요.

`MUCVIEW.COM`, `MUCPLAY.COM`, `MUCPLAY.MXR`은 PATH가 닿는 폴더에 함께 두세요.

## 8. 디스크와 메모리에 남기는 것

- **디스크:** MUCVIEW는 아무것도 쓰지 않습니다. `4`로 내보낸 `.MUB`만 생깁니다. 빈 공간이 없는 디스크에서도 열기·컴파일·연주가 됩니다(내보내기는 공간이 필요합니다).
- **DOS 환경 변수:** MUCPLAY에 다녀오는 동안 보던 위치와 찾던 문자열을 `MUCVIEW`, `MUCVIEWF`에 넣었다가 돌아와서 지웁니다. 환경 변수 공간이 모자라면 `No room in the DOS environment.`가 나오고 MUCPLAY를 부르지 않습니다.
- **메모리:** `2`로 컴파일한 결과는 MUCPLAY의 세션으로 메모리에 남고, `Q`로 끝낼 때 해제합니다. MUCVIEW를 시작하기 전에 프롬프트에서 만든 MUCPLAY 세션이 있었다면 그것도 끝낼 때 함께 해제합니다.

## 9. CPU 속도

실행하는 동안 빠른 CPU로 돕니다. 파나소닉 MSX2+는 5.37MHz, Z80 모드의 turbo R은 R800, One Chip MSX는 8.06MHz입니다. 끝내거나 MUCPLAY를 부를 때 원래대로 되돌립니다. 이미 빠른 상태였으면 그대로 둡니다.

## 10. 메시지

| 메시지 | 뜻과 조치 |
| --- | --- |
| `MSX-DOS2 required.` | MSX-DOS 1에서는 동작하지 않습니다. |
| `MUCVIEW: MSX2 required.` | MSX1에서는 쓸 수 없습니다. 연주는 `MUCPLAY SONG.MUC`로 하세요. |
| `MUCVIEW needs four free mapper banks (64 KiB).` | 빈 매퍼 세그먼트가 4개보다 적습니다. 메모리를 쓰는 다른 프로그램이나 MUCPLAY 세션(`MUCPLAY /RELEASE`)을 정리하세요. |
| `MUCVIEW needs more free TPA memory.` | 상주 프로그램이 TPA를 많이 쓰고 있습니다. 상주 프로그램을 빼고 다시 실행하세요. |
| `Open failed.` | 파일을 열지 못했습니다. 이름과 폴더를 확인하세요. |
| `Text exceeds 60000 bytes; not loaded.` | 문서가 줄바꿈 정리 후 60,000바이트를 넘습니다. 이전 문서는 그대로 둡니다. |
| `Need 64 KiB free mapper RAM to load.` | 문서를 읽을 메모리가 모자랍니다. |
| `Open a MUC file first.` | 문서를 열지 않은 채 컴파일·연주를 골랐습니다. |
| `Compile this text first: F1 then 2.` | 컴파일하지 않고 내보내기를 골랐습니다. |
| `Compile: local name, no spaces. Start in song folder.` | 경로가 붙었거나 공백이 있거나 24자를 넘는 이름입니다. 곡 폴더에서 파일 이름만 주고 여세요. |
| `MUCPLAY.COM not found.` | 작업 폴더, MUCVIEW 폴더, PATH에 MUCPLAY가 없습니다. |
| `Use the matching /E3 MUCPLAY.COM.` | MUCPLAY가 다른 세대입니다. 같은 릴리스의 MUCPLAY·MUCVIEW를 함께 쓰세요. |
| `MUCVIEW.COM must be in this folder or on the PATH.` | MUCPLAY가 돌아올 MUCVIEW를 찾을 수 없습니다. |
| `No room in the DOS environment.` | 보던 위치를 넘길 환경 변수 공간이 없습니다. 쓰지 않는 환경 변수를 지우세요. |

## 11. 제한

- 문서는 줄바꿈 정리 후 60,000바이트까지입니다.
- 편집·저장·실행 취소·클립보드가 없습니다.
- 쪽 단위 넘김 키는 없습니다. 멀리 갈 때는 Ctrl+HOME/SELECT와 찾기를 쓰세요.
- MUCPLAY·MUCEDIT·MUCVIEW는 같은 릴리스끼리 써야 합니다.
