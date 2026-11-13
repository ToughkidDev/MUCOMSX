# MucoMSXExtension — MucoMSX 칩 확장 명령 세트

[English](readme.md) · **한국어** · [日本語](readme.ja.md)

**MucoMSXExtension**은 MucoMSX가 MUCOM88 MML에 더한 MSX 사운드 칩용 명령 세트입니다. 대상은 PSG(AY-3-8910), SCC/SCC+, MSX-MUSIC(YM2413/OPLL)과 그 드럼입니다. 곡은 MUCOM88 문법과 OPNA 파트를 그대로 쓰고, MSX 파트는 자기 채널 줄(`MSXD`, `SCCA`, `MSXA` …)에 엔벨로프, 음높이, 게이트, 파형, OPLL 음색, 공유 구절, 효과 프로그램을 두 글자 `?` 명령으로 씁니다.

이 명령을 쓴 곡은 MucoMSX의 packed 형식 **msPb0103–010A**로 컴파일됩니다. 같은 소스가 MSX 실기의 MucoMSX 툴체인과 비주얼 플레이어, Mac의 MDPlayer4Mac, 브라우저의 MUCPlayground에서 연주됩니다.

## 목차

- [쓸 수 있는 곳](#쓸-수-있는-곳)
- [1분 만에 써 보기](#1분-만에-써-보기)
- [MUCPlayground의 템플릿](#mucplayground의-템플릿)
- [이 문서와 MUCPlayground 함께 쓰기](#이-문서와-mucplayground-함께-쓰기)
- [명령 레퍼런스](#명령-레퍼런스)
  - [MSX 채널](#msx-채널)
  - [쓰는 법](#쓰는-법)
  - [MSX 채널의 MUCOM88 호환 명령](#msx-채널의-mucom88-호환-명령)
  - [전역 자원](#전역-자원)
  - [엔벨로프](#엔벨로프)
  - [음높이](#음높이)
  - [게이트와 음 끝](#게이트와-음-끝)
  - [PSG 노이즈와 하드웨어 엔벨로프](#psg-노이즈와-하드웨어-엔벨로프)
  - [SCC 파형](#scc-파형)
  - [MSX-MUSIC](#msx-music)
  - [공유 구절](#공유-구절)
  - [효과와 프로그램](#효과와-프로그램)
- [이 명령으로 쓴 곡](#이-명령으로-쓴-곡)
- [영상](#영상)
- [예전 형식과 툴체인 전체 사양](#예전-형식과-툴체인-전체-사양)

## 쓸 수 있는 곳

| | |
|---|---|
| MSX — MUC2MUB, MUCPLAY, MUCEDIT | 컴파일과 연주 (MucoMSX가 기준 구현) |
| MSX — MUCScope, MUBScope | 채널 화면과 함께 컴파일·연주. MUBScope는 컴파일한 msPb MUB를 연주 |
| MDPlayer4Mac v0.2.4 이상 | macOS에서 같은 MUC를 컴파일·연주 |
| MUCPlayground | 브라우저에서 쓰고 바로 듣기. MML 가이드에 이 명령 세트가 들어 있음 |

## 1분 만에 써 보기

아래 곡을 MUCPlayground에서 열어 재생해 보고, 숫자 하나를 바꿔 다시 들어 보세요. SCC 2파트, PSG 1파트, MSX-MUSIC 1파트이며, 모두 압축 줄(`?XU1`)이고 `L`에서 반복하며 `!`로 끝납니다.

```
#title First steps
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCS ?FD1={ ?EP0,$01,$61 v12 ?FR }
SCCA ?XU1 ?XT1 @0 ?FC1 o5 L [c%2 e%2 g%2 >c%2< g%2 e%2]2 !
SCCB ?XU1 ?XT1 @0 ?FC1 v9 o3 L [c%6 g%6]2 !
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v10 o4 L [r%3 c%1 r%2]4 !
MSXA ?XU1 ?XT1 ?IR3 v11 o4 L [e%12]2 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbZFBa4NAEIX_ynQbb7NlRxMTpaltTQOBBIomNJDklNoSKFpUvEj-e9-qhxx6mJ2dN99jH2yrGhUKq1yFarlK0u3DZhcrVjXm-_pS_2S0vJRVTVWd_VbHPPpYmHlr2J3wOOCpcGBYjM8iUxaI4g7dztCxBgQUmmGNU2PQ0DRW2iLastqatHUPt06zW4tZ3NrcyfWYp3GcUrRcyLyl6O3d8MgIj3yhRlzoCfXMC0X7neDYCj0bLGKhYkJrOpwdlzLUN-oJw2N3g3Jy6a7zvv7jbQIqvN7uw-D38CbdL27gPs8MebwZ8hgqxtZSOh6dHaESb4wH222-aJV4wGXAM0eGLPiJLxUeTqw-bbv-AQ)

## MUCPlayground의 템플릿

MUCPlayground의 **새로 만들기**에는 이 명령으로 쓴 주석 달린 템플릿이 있습니다. 아래 링크로 바로 열 수 있습니다.

- [**MSX 칩**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extAll) — SCC, MSX-MUSIC, PSG를 함께: 공유 구절, 엔벨로프, 비브라토, 효과 하이햇, ?ID 드럼.
- [**OPNA + MSX 칩**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extOpna) — OPNA FM과 리듬 옆에 SCC, MSX-MUSIC, PSG 파트. C112와 t198로 박자를 맞춤.
- [**SCC**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extScc) — SCC/SCC+ 5파트: ?WD 파형, ?EP 엔벨로프, 비브라토, 디튠 코러스, ?FD 구절, ?FB 반복.
- [**MSX PSG**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extPsg) — PSG 3채널로 리드, 베이스, ?XD 효과로 만든 드럼.
- [**MSX-MUSIC**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extOpll) — YM2413 파트: 내장·사용자(?IU) 음색, ?QP 게이트, 서스테인, 키트를 쓰는 ?ID 드럼.

같은 템플릿이 [`Samples/Muc/Templates/7_MSX_Extension`](../Samples/Muc/Templates/7_MSX_Extension)에 있습니다.

## 이 문서와 MUCPlayground 함께 쓰기

- 아래 예제마다 **MUCPlayground에서 열기** 링크가 있습니다. 예제가 편집기에 열리고 바로 연주하거나 고칠 수 있습니다.
- MUCPlayground의 **설명서** 버튼은 같은 레퍼런스를 글 옆에 엽니다(책 *MucoMSX 칩 확장 명령*). **넣기**는 예제를 커서 위치에 넣고, 편집기는 입력하는 동안 이 명령을 제안하고 검사합니다.
- 채널 화면과 오실로스코프는 연주 중인 MSX 칩 채널을 하나씩 보여 주고, **공유**는 곡을 이 문서의 링크 같은 주소로 만듭니다.

## 명령 레퍼런스

레퍼런스는 MUCPlayground의 MML 가이드를 따릅니다. 이 문서의 예제는 모두 현재 MucoMSX 컴파일러(MUC2MUB, 2026-11-13 빌드)로 그대로 컴파일해 확인했습니다.

### MSX 채널

MUCOM88과 mucomDotNET 확장에는 이런 채널이 없습니다. 이 이름으로 시작하는 줄은 MSX 음악이고, 그 줄의 모든 명령(? 명령과 아래의 MUCOM88 호환 명령)은 그 칩에 맞게 읽힙니다.

#### `MSXD` — MSX PSG

**형식:** `MSXD MSXE MSXF` · **대상:** `PSG`

MSX 내장 PSG(AY-3-8910)의 3채널입니다. 톤, 노이즈(P, w), 하드웨어 엔벨로프(?GS)를 씁니다. 첫 음 앞에 @n이나 E, 그리고 v를 주세요.

```
MSXD @0 v12 o5 l8 cdefgab>c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRVyLBSSU1LT0hOT7JKBKtKUrKJjdZRSQFQtAA)

#### `SCCA` — SCC / SCC+

**형식:** `SCCA SCCB SCCC SCCD SCCE` · **대상:** `SCC`

SCC/SCC+ 카트리지의 파형 5채널입니다. @n으로 32샘플 파형(?WDn={…}, 예전 형식 @Wn:{…}, #sccvoice)을 고르고, v0–15는 선형입니다. 일반 SCC에서는 4·5채널이 파형 하나를 함께 씁니다.

```
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
SCCA @0 E255,0,8,2,160,32 v12 o5 l8 cdefgab>c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY69DsIwDIRfxfJsoziQ_mRARRFiAoYKMQADtJQFlQV1qfru2KiL7bv7LsqIA0Yh7DFifTzsFvtTQsKvSoDq7OIIjnygVUm5UOlIXEYiOYma4udtWn2NFVJUPUesk1WweqwRG8LGspXY2vP19yw1zHCr-QDTta9T2kDlYOuDPVqQJ8kcLT0M4uET4F1A0z671_2xbvTnHcbLjbC1Nf0A)

#### `MSXA` — MSX-MUSIC 선율

**형식:** `MSXA MSXB MSXC MSXH MSXI MSXJ` · **대상:** `OPLL`

YM2413(OPLL)의 선율 6채널입니다. @n은 곡의 FM 음색 n을 가져와 내장 15음색 중 가장 가까운 것으로 연주하고, ?IR·?IU는 음색을 직접 고릅니다. 스테레오 팬은 모노가 됩니다.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA @1 v12 o4 l8 cdefgab>c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjkD7FMoMjRTyTRRyLBSSU1LT0hOT7JKBzklTsoqO1VFKAVG1AA)

#### `MSXG` — MSX-MUSIC 드럼

**형식:** `MSXG` · **대상:** `MSXG`

YM2413 리듬으로, G 파트처럼 씁니다. @mask로 드럼을 고르고 음표로 치며, v로 음량을 정합니다. 림샷은 없습니다.

```
MSXG v63,31,31,31,31,31,0 l8 [@9c @8c @10c @8c]2
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcrMjHWMDVGQgUKOhUK0g2WygoMFEBsagBmxRkBtaUpW0bE6SikgqhYA)

### 쓰는 법

MSXD–F(PSG), SCCA–SCCE(SCC+), MSXA–C·MSXH–J(MSX-MUSIC 선율), MSXG(드럼)에서 쓰며, 보통의 OPNA A–K와 함께 쓸 수 있습니다. 이 명령이 들어간 곡은 packed 형식으로 컴파일됩니다. 예전 한 글자 ?·@ 형식도 그대로 되고, 숫자 @n은 음색 그대로입니다.

#### `?XU` — 압축 채널

**형식:** `?XUn … !` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

그 줄을 길이 단위 n의 압축 스트림으로 만듭니다. 여러 명령이 이것을 필요로 합니다. 음 길이는 %1–%16 단위로 쓰고, 줄은 !로 끝납니다. 보통 줄처럼 |는 마디선, [ ]n은 반복(두 겹까지, 다음 줄로 이어져도 됨), L은 끝의 !가 돌아갈 곳입니다(/는 쓸 수 없으니 [A B]n-1 A로 씁니다). ?FB, ?FJ, 공유 구절도 쓸 수 있습니다. 압축 SCC 줄 위에는 SCC 파형(?WD)이 있어야 하고, PSG 줄만 있는 곡에는 무음 파형이 자동으로 들어갑니다. (압축 줄의 | [ ] L, 압축 MSX-MUSIC 줄의 ?IR / ?IU, ?XT4 / ?XT64 트랙의 쉼표, ?WD 없는 PSG 곡은 MDPlayer4Mac v0.2.6 이상이 필요합니다. v0.2.5 이하는 거부하거나 다르게 연주합니다.)

```
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v12 o4 c%4 L [e%2 g%2]2 | c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOwjQg2BRAiQcA0w0FGxMNRRMbZQKDM0Usg3UUhWNVHwUYhOVTVSSFc1ijVSqAEKWSgoAk1IU7KKjtVRSgFRtQA)

#### `PSGS` — 공유 정의 줄

**형식:** `PSGS / SCCS / OPLS  ?FDn={…} ?XDn={…}`

PSG, SCC, OPLL 채널이 함께 쓰는 구절과 효과만 담는 줄입니다. 스스로는 연주하지 않고, 정의는 여러 줄에 걸쳐 쓸 수 있습니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCS ?FD1={?EN2 ?FR}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JQDIT_Sm3i1prXFxAlIU8D6CQa0WCiThpHXAwL4b_bKsu1vftuaI8dpkLYYor1vtrOduccCT96hqZwWe_IxxQtKRFaOhI3J5GERE3x47RbfY0VUlQ9R6zKerB6rBEbwsayldja4_bzLDXMcKv5eLi1dZ7XEDaFZH0oK6_r8e-uIVzOonJSaQ4OVg5CeWDoxMM7gsd0ARP944Xp9U74tDF8AQ)

#### `$` — 16진수

**형식:** `$hex`

인자와 자원 값은 $로 16진수로 쓸 수 있습니다($FFFF까지).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?MV0,$11 ?EP2,129,115 v12 o4 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLU67CsJQDP2Va9AtkZtLH_SCdLDiVBVqtaBOimNdpEvpv3siXU5yXiQjDRSVqadIzfGwX9ftlpi-oOW18pvRc0g5KThXLjyrz1g1Z4WoYZ7GocNGCFFongUoIAJNYIlFxLJiJbH2vP01cy1mcauFdLr3ddNVruxaBZwB9cXzUrHsTgG3C9xO3aDBfRL3XGnmFvj9TfH2YHrZmH4)

#### `@n:{ }` — 중괄호 FM 음색

**형식:** `  @n:{ 38 values }  /  @%n:{ 25 bytes }` · **대상:** `FM`

이 확장을 쓰는 곡에서는 FM 음색을 중괄호 안에 한 줄로 쓸 수 있습니다. FB,ALG와 오퍼레이터 4줄(값 38개), 또는 25바이트 레지스터 형식입니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
  @1:{ 5,4, 31,8,2,6,3,30,0,1,3, 31,6,1,6,2,0,0,1,3, 31,10,2,6,3,36,0,2,7, 31,6,1,6,2,0,0,1,7 }
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%16 !
A @1 v12 o4 c4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbZDLigJBDEV_JQbc3ZJK9ctuEBUdXPkAFQWd1YjLdiNuGv99bgZHZjGLyuPmhCTV6UMbg7ba6Ha9WgyW-5lC70zHh3kcdRGpQF6jMtQRFkuYVTCKll7ec-osEyJKLSLQBiaBWmApOBKcDd4UvPsV_Whedcxxb0vF89yKTKzphAtAMsMQCSUyZJEDjIGLXIgv4a9m8Zcs4WH1D1kJByy3x7mMj3uj2dF8bBJvqnlTIQ9Lcsvlq2-l9M7tlLu8tZx_dNXm9Am9uHt-Aw)

### MSX 채널의 MUCOM88 호환 명령

MSX 채널이 받아들이는 보통의 MUCOM88 명령과 그 채널에서의 동작입니다. 예전 MSX 곡과, 칩 확장을 쓰는 곡의 보통(?XU가 아닌) 줄에서 쓸 수 있습니다. ?XU 압축 줄은 음표, o, < >, l, v, t, C192, @n, !, |, [ ], L만 받습니다.

#### `c–b` — 음표

**형식:** `c d e f g a b [+ # -][length][.]` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

MUCOM88과 같습니다. 길이 n은 C/n 클록, %n은 n 클록, 점은 절반을 더합니다. MSXG에서는 @로 고른 드럼을 칩니다. ?XU 줄에서는 길이를 %1–%16 단위로, 또는 192를 16단위 이하로 나누는 길이로 씁니다.

```
MSXD @0 v12 o4 l8 c d e f+ g4. a16 b-16 >c2
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFVIUUhXStBXSTfQUEg3NFJJ0gYRdshFQR5qSVXSsjlIKiKoFAA)

#### `r` — 쉼표

**형식:** `r[length]` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

그 길이만큼 쉽니다. 음표와 이을 수는 없습니다.

```
MSXD @0 v12 o4 l8 c r e r g4 r4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFYoUUoE43UShyASoKk3JKjpWRykFRNUCAA)

#### `l` — 기본 길이

**형식:** `l4  l8  l%12` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

길이를 적지 않은 음표의 길이입니다.

```
MSXD @0 v12 o4 l16 cdef l4 g
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyDM0UklNS0xRyTBTSgUrSlKyiY3WUUkBULQA)

#### `o` — 옥타브

**형식:** `o1–o8  > <` · **대상:** `PSG`, `SCC`, `OPLL`

o로 옥타브를 정하고 >와 <로 하나씩 옮깁니다. PSG, SCC, OPLL은 1–8입니다(?XU PSG·SCC 줄은 1–6).

```
MSXD @0 v12 o4 l8 c e g >c< g e c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFVIV0hXskm2AZKpCMlBdmpJVdKyOUgqIqgUA)

#### `C` — 기준 클록

**형식:** `C128` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

온음표의 클록 수입니다(기본 128). ?XU 줄은 C192만 받습니다.

```
MSXD @0 v12 o4 C96 l4 cdef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRScLc0UckwUklNS04AK0pSsomN1lFJAVC0A)

#### `T` — 템포

**형식:** `T120  t200` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

T는 BPM, t는 타이머 값 그대로이며, 곡 전체의 템포를 정합니다. ?XU 줄은 t만 받습니다.

```
MSXD T150 @0 v12 o4 l8 cdefg
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFEIMTQ0UHAwUygyNFPJNFHIsFJJTUtPSgUrSlKyiY3WUUkBULQA)

#### `v` — 음량

**형식:** `v0–15` · **대상:** `PSG`, `SCC`, `OPLL`

모든 선율 칩에서 0–15입니다(SCC는 선형, OPLL은 FM 파트처럼). ?EL, ?EN과 엔벨로프로 더 다듬습니다.

```
MSXD @0 v8 o4 l8 cd v12 ef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMosFPJNFHIsFJJTFMoMjRRS04AK0pSsomN1lFJAVC0A)

#### `v` — 드럼 음량

**형식:** `vtotal,BD,SD,TOP,HH,TOM,RIM` · **대상:** `MSXG`

G 파트처럼 전체(0–63), 그다음 드럼마다 0–31입니다. RIM 값은 쓰이지 않습니다.

```
MSXG v40,31,20,31,20,31,0 l8 [@1c @8c @2c @8c]2
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcpMDHSMDXWMkEgDhRwLhWgHw2QFBwsgNgLTsUZAXWlKVtGxOkopIKoWAA)

#### `) (` — 음량 올림·내림

**형식:** `)n  (n` · **대상:** `PSG`, `SCC`, `OPLL`

v를 n만큼(없으면 1) 올리거나 내립니다. MSXG에서는 안 됩니다.

```
MSXD @0 v10 o4 l8 c )2 d )2 e (4 f
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMDRTyTRRyLBSSFTSNFFJARKqCholCGlBhmpJVdKyOUgqIqgUA)

#### `@` — PSG 프리셋

**형식:** `@0–@15` · **대상:** `PSG`

MUCOM88의 SSG 프리셋 16개 중 하나입니다. 엔벨로프, 톤·노이즈 설정, 경우에 따라 비브라토가 함께 정해집니다.

```
MSXD @3 v12 o4 l8 cdef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFByMFcoMjRTyTRRyLBSSU1LTgJJpSlbRsTpKKSCqFgA)

#### `@` — SCC 파형

**형식:** `@n` · **대상:** `SCC`

파형 n(?WDn, @Wn, #sccvoice 뱅크)을 고릅니다. 음량 모양은 E나 ?EP로 줍니다.

```
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
  @W1:{ 96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96 }
SCCA E255,0,0,0,0,255 v12 o5 l8 @0 cd @1 ef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zpVA7DsIwDL2K5dlGcUQozVRUISZgQIgBmCidUFlQl6p35xl6AYTysd_HiZOBe84m3HHmw363mW2PNQu_AImqU8gDBYlJ5qUUJmUQCwsxK8RAWpyiY_CQYYIVXBDFrgAKTiGpW9S96kXq1VP24Vx1m9u9LCYaL513YeiixPG_TP1v-dWHul7ROiZ_zHcgp94iPRM9llQFujVUGd1bfFnL-XwVbjyMbw)

#### `@` — FM 음색을 OPLL 악기로

**형식:** `@n` · **대상:** `OPLL`

곡의 FM 음색 n(인라인 또는 #voice)을 가져와 가장 가까운 YM2413 내장 음색으로 연주합니다. ?XU 줄에서는 @0–@15가 음색 번호 그대로입니다.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA @1 v12 o4 l8 cdef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjkD7FMoMjRTyTRRyLBSSU1LTgC5JU7KKjtVRSgFRtQA)

#### `@` — 칠 드럼

**형식:** `@mask` · **대상:** `MSXG`

G 파트처럼 1 BD, 2 SD, 4 TOP, 8 HH, 16 TOM의 합입니다. 다음 음표들이 이 드럼을 칩니다.

```
MSXG v63,31,31,31,31,31,0 l8 @1c @2c @9c @16c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcrMjHWMDVGQgUKOhYKDYbKCgxEQWwKxoVkyUE-aklV0rI5SCoiqBQA)

#### `q` — 게이트

**형식:** `q0–255` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

MUCOM88처럼 각 음을 끝나기 n 클록 전에 뗍니다(?QR로 돌아오고, ?QP는 OPLL용입니다).

```
MSXD @0 v12 o4 l4 q4 cd q0 ef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyTBQKTRSSUxQKDRRS04Bq0pSsomN1lFJAVC0A)

#### `E` — 소프트웨어 엔벨로프

**형식:** `Eal,ar,dr,sr,sl,rr` · **대상:** `PSG`, `SCC`, `OPLL`

MUCOM88의 SSG 엔벨로프입니다(값 6개, 0–255). OPLL에서는 칩 확장을 쓰는 곡에서만 되고, 예전 MSX 곡은 PSG와 SCC에서만 됩니다.

```
MSXD E255,0,30,4,120,60 v12 o4 l4 cdef
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFFyNTE11DHSMDXRMdAyNDHTMDBTKDI0U8k0UckwUklNS04CK05SsomN1lFJAVC0A)

#### `M` — LFO(비브라토)

**형식:** `Mdelay,rate,depth,count  MF0/1  MW MC ML MD` · **대상:** `PSG`, `SCC`, `OPLL`

MUCOM88의 소프트웨어 LFO와 그 하위 명령입니다. 깊이는 어느 칩에서나 같은 방향으로 음높이를 움직입니다.

```
MSXD @0 v12 o4 l2 M12,1,2,4 c d
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyjBR8DY10DHWMdEwUkhVSgKrSlKyiY3WUUkBULQA)

#### `D` — 디튠

**형식:** `Dn  Dn+` · **대상:** `PSG`, `SCC`, `OPLL`

음높이를 n만큼 옮기며, 어느 칩에서나 같은 방향입니다. 칩 확장을 쓰는 곡에서는 Dn+가 현재 디튠에 더합니다.

```
MSXD @0 v12 o4 l4 c D8 c D0 c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyTBSSFVwsQISBQjJQTZqSVXSsjlIKiKoFAA)

#### `P` — 톤·노이즈

**형식:** `P0–3` · **대상:** `PSG`

P1 톤, P2 노이즈, P3 둘 다, P0 없음. PSG 채널에서만(SCC는 안 됨).

```
MSXD @0 v12 o4 l8 P2 w8 c c P1 c c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBQCjBTKLRSSgTDAEEQBFaYpWUXH6iilgKhaAA)

#### `w` — 노이즈 높이

**형식:** `w0–31` · **대상:** `PSG`

PSG 3채널이 함께 쓰는 노이즈 주기입니다(?NP는 우선순위를 더합니다).

```
MSXD @0 v12 o4 l8 P2 w8 c c P1 c c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBQCjBTKLRSSgTDAEEQBFaYpWUXH6iilgKhaAA)

#### `&` — 타이

**형식:** `c4&c4` · **대상:** `PSG`, `SCC`, `OPLL`

다음 음과 이어 새로 치지 않습니다.

```
MSXD @0 v12 o4 l8 c&c d4&d8 e
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSS1ZIVUkzUUiwUUoFq0pSsomN1lFJAVC0A)

#### `^` — 길이 더하기

**형식:** `c4^8` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

앞 음표나 쉼표에 길이를 더합니다.

```
MSXD @0 v12 o4 c4^8 d8
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRSSTeIsFFIsgJJpSlbRsTpKKSCqFgA)

#### `[ ]` — 반복

**형식:** `[ … ]n` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

괄호 안을 n번(1–255) 연주합니다. MSX 채널에서는 두 겹까지입니다. ?XU 줄에서도 쓰며, 다음 줄로 이어져도 됩니다.

```
MSXD @0 v12 o4 l8 [cd [ef]2 g]2
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSik1MUolPTYo0U0mONgKrSlKyiY3WUUkBULQA)

#### `/` — 마지막 회에 빠져나가기

**형식:** `[ … / … ]n` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

마지막 회에는 /에서 반복을 끝냅니다. ?XU 줄에서는 안 되니 [A B]n-1 A로 씁니다.

```
MSXD @0 v12 o4 l8 [cde / fg]3 c4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSik1NSFfQV0tJjjRWSTYDK0pSsomN1lFJAVC0A)

#### `L` — 루프 지점

**형식:** `L` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

채널이 끝나면 돌아갈 곳으로, 채널마다 한 번만 씁니다. ?XU 줄에서는 끝의 !가 여기로 돌아갑니다.

```
MSXD @0 v12 o4 l8 cd L efg
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSUxR8FFLT0oEK0pSsomN1lFJAVC0A)

#### `!` — 끝

**형식:** `!` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

채널을 여기서 끝냅니다(L이 있으면 루프). ?XU 줄은 반드시 이것으로 끝납니다.

```
MSXD @0 v12 o4 l8 cdef !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSU1LTFBSB0mlKVtGxOkopIKoWAA)

#### `*` — 매크로

**형식:** `#*n{…}  *n` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

MUCOM88처럼 매크로를 씁니다(최대 8겹). ** 이동과 매크로 안의 ?XU는 안 됩니다.

```
#*1{cdef}
MSXD @0 v12 o4 l8 *1 *1
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXKVtQyrk1NS02pj8nyDI1wUHAwUygyNFPJNFHIsFLQMgQioME3JKjpWRykFRNUCAA)

#### `|` — 마디선

**형식:** `|` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

읽기 위한 것으로 무시됩니다.

```
MSXD @0 v12 o4 l8 cdef | gab>c
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSU1LTFGoU0hOT7JKBitKUrKJjdZRSQFQtAA)

#### `p K s y` — MSX 채널에서 안 되는 명령

**형식:** `p  K  s  V  H  R  y  J  { }  x  S` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

OPNA 전용 명령(팬, 이조, 키 보정, FM 기능, 레지스터 쓰기, 포르타멘토)입니다. 칩 확장을 쓰는 곡에서는 MSX 채널에서 오류가 됩니다. 예전 MSX 곡은 일부를 무시하고(p) 일부는 적용하므로(K) 기대지 않는 편이 좋습니다. 대신 ? 명령(?DW, ?DS, ?MV, ?QP …)을 쓰세요.

### 전역 자원

줄 맨 앞에, 연주 줄보다 먼저 씁니다.

#### `?WD` — SCC 파형

**형식:** `?WDn={32 values -128…127}` · **대상:** `SCC`

SCC 파형 n을 정의합니다. SCC 줄의 @n으로 고릅니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o4 c%16 e%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7LCsJQDER_JQbcJZJc-qAFqVLFlVqopQV15WNZN9JN6b-bSDeTOzNn4I44YK6EPeZYn0-H1bEpkfBrtmh3sh6FQkxRRqlSJqSSkGpKaqGG-bq33GqDDLVMiE3ZDFvGVrEj7Cz7iH09v_6Zt4457rMQT7e-LsstFF2jJheTthLYCBT7imHQAJ8IHktN4OWysH-_Mb_eCZ9-ph8)

#### `?WS` — 뱅크의 파형

**형식:** `?WSlocal,bank,1` · **대상:** `SCC`

#sccvoice 파일의 파형 bank를 로컬 파형 번호 local로 씁니다.

#### `?IU=` — OPLL 사용자 음색

**형식:** `?IUn={8 bytes}` · **대상:** `OPLL`

MSX-MUSIC 사용자 음색 n(YM2413 음색 바이트 8개)을 정의합니다. 선율 줄의 ?IUn으로 씁니다.

```
?IU0={33,97,29,7,130,143,16,7}
MSXA ?IU0 ?EP2,129,115 v12 o4 g%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMNbKuNjXUszXWMLHXMdQyNDXQMTYx1DM10zGtj8nyDIxwVQIoU7F0DjHQMgWoMDU0VygyNFPJNFNJVgXSRqgnQsDQlq-hYHaUUEFULAA)

#### `?IT=` — 드럼 키트

**형식:** `?ITn={6 bytes}` · **대상:** `MSXG`

MSXG용 드럼 키트 n(리듬 설정 6바이트)을 정의합니다. ?ITn으로 고릅니다.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?KT=` — 음높이 표

**형식:** `?KTn={12–128 values}` · **대상:** `PSG`, `SCC`, `OPLL`

보통 음계 대신 쓸 주기(OPLL은 F-number) 표입니다. 줄의 ?KTn으로 씁니다.

```
?KT0={344,364,386,409,433,459,486,516,546,578,612,648}
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?XT0 ?XT1 ?KT0 @1 o4 c%8 e%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY8_C8JADMW_yhlwe8ilSa9nQVQcHKQ6tIWCOvln1EVcSr-7OaGLOPzeS14yJD29qWTQg0qqD_vtrGo3BHpZu9w1ftGLKiQYMUD9HCoCzc2tz9lQo4gInCFoHE4P51ac1OXQrwsjwqYQiIcHQ8Y8IJHhJ2Y_7geksvi_b3FVd2u37Fo2aXwSq-xwu8E91V2m0d2Mif10p_J4Bl2TDR8)

#### `?IM=` — 악기 프로그램 표

**형식:** `?IMn={12–128 phrase ids}` · **대상:** `PSG`, `SCC`

음을 악기 프로그램으로 쓸 공유 구절에 대응시킵니다. 줄의 ?IMn으로 고르고 ?IM-로 끕니다.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

### 엔벨로프

#### `?EP` — 엔벨로프 프로필

**형식:** `?EPprofile,a,b  /  ?EP-` · **대상:** `PSG`, `SCC`, `OPLL`

각 음의 음량을 드라이버의 엔벨로프 프로필(0–8)과 값 2개로 만듭니다. 프로필 3은 값 1개, 8은 값 2개를 더 받습니다(PSG/SCC). OPLL은 프로필 2와 3입니다. ?EP-로 끕니다.

```
MSXD ?EP2,129,115 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXKDI0U8k0UklWBdJGqCVBdmpJVdKyOUgqIqgUA)

#### `?EA` — 어택

**형식:** `?EAmode,value` · **대상:** `PSG`, `SCC`, `OPLL`

엔벨로프의 어택입니다. mode 0과 1은 드라이버의 두 가지 어택 방식입니다.

```
MSXD ?EP2,129,115 ?EA0,4 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcRwMdE4UyQyOFfBOFZFUgXaRqAlSepmQVHaujlAKiagE)

#### `?ET` — 초기 목표

**형식:** `?ETlevel` · **대상:** `PSG`, `SCC`, `OPLL`

엔벨로프가 처음 향하는 레벨(0–15)입니다.

```
MSXD ?EP2,129,115 ?ET12 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYGcEEMjhTIgzjdRSFYF0kWqJkDVaUpW0bE6SikgqhYA)

#### `?EN` — 시작 감쇠

**형식:** `?ENvalue` · **대상:** `PSG`, `SCC`

각 음이 얼마나 작게 시작하는지입니다.

```
MSXD ?EP2,129,115 ?EN3 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcP2OFMkMjhXwThWRVIF2kagJUnKZkFR2ro5QComoB)

#### `?EL` — 바닥 레벨

**형식:** `?ELlevel` · **대상:** `PSG`, `SCC`

엔벨로프가 내려가는 최저 레벨(1–15)입니다. ?EL0이면 없앱니다.

```
MSXD ?EP2,129,115 ?EL4 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcHxOFMkMjhXwThWRVIF2kagJUnKZkFR2ro5QComoB)

### 음높이

#### `?DB` — 디튠

**형식:** `?DBvalue` · **대상:** `PSG`, `SCC`, `OPLL`

드라이버의 기본 디튠(-128–255)입니다.

```
MSXD ?EP2,129,115 ?DB2 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXZyMFMoMjRTyTRSSVYF0kaoJUHGaklV0rI5SCoiqBQA)

#### `?DW` — 부호 있는 디튠

**형식:** `?DWvalue` · **대상:** `PSG`, `SCC`, `OPLL`

부호 있는 16비트 디튠(-32768–32767)입니다.

```
MSXD ?EP2,129,115 ?DW-2 v12 o4 c%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXcJ1jRTKDI0U8k0UklWBdJGqCVB1mpJVdKyOUgqIqgUA)

#### `?DR` — 디튠 끄기

**형식:** `?DR` · **대상:** `PSG`, `SCC`, `OPLL`

디튠을 없앱니다.

```
MSXD ?EP2,129,115 ?DB2 v12 o4 c%8 ?DR c%8
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXZyMFMoMjRTyTRSSVS2A_CAQDVSfpmQVHaujlAKiagE)

#### `?DS` — 음높이 스윕

**형식:** `?DSstep,count[,mode]` · **대상:** `PSG`, `SCC`

count마다 step만큼 음높이를 밀어 갑니다. mode가 없으면 기본 스윕, 1은 바이트 스윕(step 1–15, count 0–7), 2는 워드 스윕입니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCE ?WP0 @0 ?EP2,129,115 ?DS3,5,2 v12 o4 e%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQn0lshm7VpakBXa4kktFPGg3tRjBZFeSv_difSyszPzQjLRSJUyDVRRfzruV4dzTUxf2HRp_HbyHCLnJRfKpWf1G1YtWBFqWNQ8ctSAgCLzLHgFRpAJKjFEjBUbEptefv_MWsMMt7EQ59vQ13Xr0qXzbuddaruAhSUWRpeafs2Rgxs1uHfunhn0k-W4_UXV9c70MJl_)

#### `?MV` — 비브라토

**형식:** `?MVmode,value  /  ?MV-` · **대상:** `PSG`, `SCC`, `OPLL`

드라이버의 압축 값(보통 $64처럼 16진수)으로 비브라토를 겁니다. mode 1은 위상 비브라토(PSG/SCC), 2는 음높이 프로그램입니다. ?MV-로 끕니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- ?MV0,$64 ?MW3 v12 o4 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJQDIVfJQbdErm59ocW5CpVnKqFWiuok-JYF-lS-u4m0uUkOec7QwbsMRfCDnOsT8fDsmwKJPzqGdqdWw-OfExRRqlQ5khcQiIpiZrip2m3-horpKh6jliV9WD1WCM2hI1lK7G1p-3vWWqY4Vbz8Xjv6qLYQrg2onJWaSsHGwdhXzGE8uJonkS6tCvoxcMngudCEpjpA2_Mbw_Cl43xBw)

#### `?MW` — 비브라토 지연

**형식:** `?MWdelay` · **대상:** `PSG`, `SCC`, `OPLL`

음이 시작되고 비브라토가 걸리기까지의 시간입니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- ?MV0,$64 ?MW3 v12 o4 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJQDIVfJQbdErm59ocW5CpVnKqFWiuok-JYF-lS-u4m0uUkOec7QwbsMRfCDnOsT8fDsmwKJPzqGdqdWw-OfExRRqlQ5khcQiIpiZrip2m3-horpKh6jliV9WD1WCM2hI1lK7G1p-3vWWqY4Vbz8Xjv6qLYQrg2onJWaSsHGwdhXzGE8uJonkS6tCvoxcMngudCEpjpA2_Mbw_Cl43xBw)

#### `?KT` — 음높이 표 쓰기

**형식:** `?KTn[,start]  /  ?KT-` · **대상:** `PSG`, `SCC`, `OPLL`

음높이 표 n(?KTn={…}로 정의)으로 음을 냅니다. 압축 OPLL에서는 start부터 12개 구간입니다. ?KT-로 보통 음계로 돌아갑니다.

```
?KT0={344,364,386,409,433,459,486,516,546,578,612,648}
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?XT0 ?XT1 ?KT0 @1 o4 c%8 e%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY8_C8JADMW_yhlwe8ilSa9nQVQcHKQ6tIWCOvln1EVcSr-7OaGLOPzeS14yJD29qWTQg0qqD_vtrGo3BHpZu9w1ftGLKiQYMUD9HCoCzc2tz9lQo4gInCFoHE4P51ac1OXQrwsjwqYQiIcHQ8Y8IJHhJ2Y_7geksvi_b3FVd2u37Fo2aXwSq-xwu8E91V2m0d2Mif10p_J4Bl2TDR8)

### 게이트와 음 끝

#### `?QR` — 보통 게이트

**형식:** `?QR` · **대상:** `PSG`, `SCC`, `OPLL`

보통 게이트로 돌아갑니다.

```
MSXD ?EP2,129,115 v12 o4 ?QR c%8 d%8
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXKDI0U8k0U7AODFJJVLRRSVC2AStOUrKJjdZRSQFQtAA)

#### `?QP` — OPLL 게이트

**형식:** `?QPvalue[,mode]` · **대상:** `OPLL`

MSX-MUSIC 음의 게이트입니다. mode 1(압축 줄)은 음마다 게이트 계산을 새로 시작하고, mode 0은 이어 갑니다.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?QP255,1 @1 o4 c%3 ?QP64 d%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY47C8JAEIT_yriQbpDbeynXRLGwig9CIKBWBsvYiI34370T0ojFMLMfAzsveUpSyihJ2v1uO2-6jVAe-QRWeh4BBPqvO-WSlpGOztBQ6SYeWWT5g9VM_cgSF__7GTdtv0bdd4r6eLAhUPN33D2ulSsoegyVRszyuJuk04UyFHt_AA)

#### `?QE` — OPLL 음의 끝 처리

**형식:** `?QE0 / ?QE1 / ?QE2` · **대상:** `OPLL`, `MSXG`

0은 보통 키오프(기본), 1은 악기를 유지한 채 주파수 0으로 끝내고(선율만), 2는 마지막 상태를 유지합니다.

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?QE1 @1 o4 c%2 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjgr2EaGGCvaBroZAmxXyTRSSVY0UFIGuSVOyio7VUUoBUbUA)

### PSG 노이즈와 하드웨어 엔벨로프

#### `?NP` — 공유 노이즈

**형식:** `?NPvalue[,priority]  /  ?NP-,3` · **대상:** `PSG`

PSG 3채널이 함께 쓰는 노이즈의 주기(0–31)를 정하고, priority 0–3으로 어느 채널이 차지할지 정합니다. ?NP-,3은 마지막에 쓴 채널을 따릅니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?NP5 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY5BC4JAEIX_yjbQbSZ2FjdTCA8ZnTTBJKE6FR3tEl7E_96b8DKz773vMTvRSLkyDZRTe65Pm6o7ENMXsriWfj95DpGTjFPlzLP6LaumrDA1LNs0fMSAgMLzLJgCIfAEkRgixoqVxNrL6-9ZapjhVgtxvg9V25eu6DvFuGDUTXTFsQm4m-FudKMG90ncc71zK3z7TfntwfSyNf8A)

#### `?GS` — 하드웨어 엔벨로프 모양

**형식:** `?GSshape[,1]  /  ?GS-` · **대상:** `PSG`

PSG 엔벨로프를 모양 0–15로 쓰며, 음마다 다시 시작합니다. ,1은 쓰기를 미룹니다(압축 줄). ?GS-로 끕니다.

```
MSXD ?EP2,129,115 ?GS8 ?GH0 ?GL40 v12 o3 c%32
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXs3YMtgISHAZDwMTFQKDM0Usg3VkhWNTYC6klTsoqO1VFKAVG1AA)

#### `?GH` — 엔벨로프 주기

**형식:** `?GHbyte  ?GLbyte` · **대상:** `PSG`

하드웨어 엔벨로프 주기의 상위·하위 바이트를 따로 정합니다(?GL이 하위).

```
MSXD ?EP2,129,115 ?GS8 ?GH0 ?GL40 v12 o3 c%32
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXs3YMtgISHAZDwMTFQKDM0Usg3VkhWNTYC6klTsoqO1VFKAVG1AA)

### SCC 파형

#### `?WP` — 파형 공유 정책

**형식:** `?WP0 / ?WP1 / ?WP2` · **대상:** `SCC`

SCC 채널이 파형 메모리를 나누는 방식입니다(보통 SCC는 4·5채널이 하나를 공유).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 v12 @0 c%8 @1 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCoJAEH6VbaDbTOwsmSmIhkGnfsBEoToVHT2FF_Hd-0Z8gYLd_eb7Y5cdqKdUmTpKqTqfDqtjXRLTBzRv9j4bPIeI1wnHyoln9RtWjVkhapjROHTYCCEKzbPgFBCBJrDEImJZsZJYe54mzVyLWdxqIRrvHZ6g2SCJef_vHxfurcpy5_K2Vpc3F4_pqq7X4ArvnsutK3SCBT7qTentwfQyGL8)

#### `?WM` — 파형 모핑

**형식:** `?WMwave,rate,1  /  ?WM-` · **대상:** `SCC`

코나미의 파형 모핑입니다. 음이 나는 동안 32개 샘플을 파형 wave(0–63)부터 최대 31바이트까지 커지는 간격으로 읽습니다(rate 0–63이 클수록 빠름). 그래서 소리가 그 뒤에 정의된 파형들을 훑어 갑니다. 제대로 쓰려면 거기서부터 31개쯤 파형을 정의하세요. 마지막 파형을 넘으면 처음 파형으로 돌아가 읽습니다. ?WM-로 멈춥니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WM1,8,1 v12 @0 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCoJAEH6VbaDbTOwsqSmIhUEnKzBRqE5FR0_hRXz3vglfoGB35_tllx1poEyZesqoPh0Pq6opiekNWrR7n4-eQ8TrlBPl1LP6mFUTVoga5mkcOmyEEIXmWXAKiEATWGIRsaxYSaw9o69mrsUsbrUQTbceT9B8lNS8__ePC_fWZblzRdeoK9qzB7oYqpQ3rG7Q4LbePZYauwX-6kXZ9c70tDF9AA)

#### `?WI` — 파형 보간

**형식:** `?WIa,b,c,d,e  /  ?WI-` · **대상:** `SCC`

두 파형 사이를 보간하며 바꿉니다(값 5개, 압축 줄).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WI0,1,4,8,1 v12 @0 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVBLCsIwEL1KHHA3I5nQjy2UKhXEhR-opYK6Ulx2Jd2U3t030gsoJJn3GybJQD3lytRRTvXxsF3sm4qY3qBlu_HF4DnEHGWcKmee1SesmrJC1DBV49BhI4QoNM-CU0AEmsASi4hlxZrEuif01cy1mMWtLcTjrcMVtBgkM-___ePC3Lqq1q68NOrK9uSBzoZ2eD9HvGR1vQa38u4x18TN8F8vyq93pqeV8QM)

#### `?WF` — 파형 프로그램 플래그

**형식:** `?WFmask,value` · **대상:** `PSG`, `SCC`

파형 프로그램의 플래그(0–7)를 정합니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?WP0 ?XT1 ?WF1,1 v12 @0 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY5LC4JQEIX_ym2g3UzMXFJRCAujVj3ARKFaFS1dhRvxv3cm3Nw5j-_AHWmgwph6Kqi-nI-rU1MR0xe2bPe6GZVjwuucM-Nc2TRls4wNocX5ukeOGhBQZMqCV2AEmaASR8RZ8ZH4elb_zFvHHPdZTKZHX1fVLpRdY6Fsrwp1c3UwtjBYDFsNr6WlYYEff6i4P5nefqYf)

#### `?WE` — 엔벨로프 단계별 파형

**형식:** `?WEa,b,c,d  /  ?WE-` · **대상:** `SCC`

엔벨로프 단계에 따라 파형을 바꿉니다(파형 번호 4개).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WE0,1,0,1 v12 @0 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCsIwDH6VGvCWSFPcxgajyhRP_sAcE9ST4nEn2WXs3f0iewGFtvn-QpsO1FOhTB0VVB8Pu8W-qYjpDRrbjS8HzyHhZc6Zcu5ZfcqqGStEDVM1Dh02QohC8yw4BUSgCSyxiFhWrEmse0JfzVyLWdzaQjLeOjxBy0Fy8_7fPy7cW1fV2sVLoy62Jw90NrTF_JhMXa_Brbx7zDV1M_zWi4rrnelpZfwA)

#### `?WG` — 정적 파형 업로드 게이트

**형식:** `?WGsample  /  ?WG-` · **대상:** `SCC`

정적 파형 업로드의 곡 전체 정책입니다. ?WP0인 압축 SCC 줄에서 씁니다(sample 0–31). ?WG-로 끕니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 v12 @0 c%4 !
SCCE ?XU1 ?WG15 ?XT1 v12 @0 e%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znZBNC8IwDIb_ShfYLZGmbM4OxpQpO_kBc0xQT34cd5Jdxv67yZgHjwptk7zv89LSHjpIGaGFFKr9rpxt6wIQXjLmzdpmvUUXY-QxYfQW2c6ROUEWkd1UdRZdbIEEFc0iyUkykGgkFilCypKGSNNTN2rqKqa4xlw8XFp5Amc9efX-3z8uubcqipXJTzWbvDlY6Y5sOnZmac0tjEwwEpsPUXL8hTzChQnkE5-Qnq8Idy3DGw)

### MSX-MUSIC

#### `?IR` — 내장 음색

**형식:** `?IRn` · **대상:** `OPLL`

FM 음색에서 가장 가까운 것을 고르는 대신 YM2413 내장 음색 n(1–15)을 직접 고릅니다. ?XU 줄에서는 @n과 같습니다.

```
MSXA ?IR3 v12 o4 c%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyMcFew9g4wVygyNFPJNFJJVTRQUgZJpSlbRsTpKKSCqFgA)

#### `?IU` — 사용자 음색

**형식:** `?IUn` · **대상:** `OPLL`

?IUn={…}로 정의한 사용자 음색 n을 씁니다. ?XU 줄에서도 씁니다(거기서 ?IU0은 @0).

```
?IU0={33,97,29,7,130,143,16,7}
MSXA ?IU0 ?EP2,129,115 v12 o4 g%12 r%4
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMNbKuNjXUszXWMLHXMdQyNDXQMTYx1DM10zGtj8nyDIxwVQIoU7F0DjHQMgWoMDU0VygyNFPJNFNJVgXSRqgnQsDQlq-hYHaUUEFULAA)

#### `?IS` — 서스테인

**형식:** `?IS0 / ?IS1` · **대상:** `OPLL`

YM2413 서스테인을 켜거나(1) 끕니다(0).

```
MSXA ?IR3 ?IS1 v12 o4 c%8 d%8
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyMcFew9g4yBRLChQpmhkUK-iUKyqoVCiqoFUE2aklV0rI5SCoiqBQA)

#### `?ID` — 드럼 타격

**형식:** `?IDmask,length  /  ?ID-,length` · **대상:** `MSXG`

mask(16 베이스드럼, 8 스네어, 4 탐, 2 톱 심벌, 1 하이햇을 더한 값)의 드럼을 치고 length(1–16)만큼 기다립니다. ?ID-는 리듬을 끈 채 쉽니다. 타격할 때 앞서 정한 키트(?IT), v, ?IB도 적용됩니다.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?IT` — 드럼 키트 쓰기

**형식:** `?ITn[,bias]` · **대상:** `MSXG`

드럼 키트 n(?ITn={…})을 고릅니다. bias(0–15)는 하이햇을 작게 합니다.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?IB` — 베이스드럼 설정

**형식:** `?IB` · **대상:** `MSXG`

인자 없는 드럼 제어로, 타격 앞에 씁니다.

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0 v14 ?IB ?ID1,4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInUKZIYjhBMQuhjomCopAM9KUrKJjdZRSQFQtAA)

### 공유 구절

#### `?FD` — 구절 정의

**형식:** `?FDn={ … ?FR}` · **대상:** `PSG`, `SCC`, `OPLL`

공유 구절 n(0–255)을 정의합니다. 보통 PSGS/SCCS/OPLS 줄에 쓰고 ?FR로 돌아옵니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD10={?EP2,129,115 ?FR}
MSXD ?XU1 ?XT1 ?FC10 v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLU9NC4JAEP0r20C32dhZNFOIPWh6siSThOpUdLRLeBH_e2_Cy5t9X8zsRCNlwjRQRu3pWG3qLiemL2i4Fm4_OfYxRyknwqljcVsWSVggil-mcuiwEUIUmmMLtCAWmoVlNWI1a7Vktb28_pq6GtO41nw834emrVoTykJwSDg0HvtS7IuhnWHXbV-Y0HcCuADKXJwZxZtPZJ7rnVnhJ2_Kbg-ml475Bw)

#### `?FC` — 구절 부르기

**형식:** `?FCn` · **대상:** `PSG`, `SCC`, `OPLL`

구절 n을 연주하고 돌아옵니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FC1 ?FC1 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JADIX_ytnErWeuFxAhIQygTCjxJJKok8YRF8NC-O--qstr-_q9pJ1opEyYBsooHPb1qulKYnpjLM6VyyfHPuYo5UQ4dSxuzSIJC0zx_6ozfKwBAYXn2EItBgvPYmUVscpaDVlN_7uvp1vFFNeYj-fr0IY6mGJXST7dlxt0R5hN6CtT9J1ATpBt63FHijtiM4o3rwhgKT9Z4JknZZcb00PL_AE)

#### `?FR` — 돌아가기

**형식:** `?FR` · **대상:** `PSG`, `SCC`, `OPLL`

구절을 끝내고 부른 곳으로 돌아갑니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FC1 ?FC1 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JADIX_ytnErWeuFxAhIQygTCjxJJKok8YRF8NC-O--qstr-_q9pJ1opEyYBsooHPb1qulKYnpjLM6VyyfHPuYo5UQ4dSxuzSIJC0zx_6ozfKwBAYXn2EItBgvPYmUVscpaDVlN_7uvp1vFFNeYj-fr0IY6mGJXST7dlxt0R5hN6CtT9J1ATpBt63FHijtiM4o3rwhgKT9Z4JknZZcb00PL_AE)

#### `?FJ` — 구절로 건너뛰기

**형식:** `?FJn` · **대상:** `PSG`, `SCC`, `OPLL`

돌아오지 않고 레이블 n(구절 n 또는 :n)으로 이어 갑니다. 채널이 이미 지나온 곳으로 건너뛰면 그것이 루프가 됩니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 e%8 !}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 g%8 ?FJ1
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY9PC4JAEMW_yjbQbTZ2Fs0UxEOmEFiCSUJ16t_NLuFF_O69CQ_7Zua938DsSAMlwtRTQs3xUK6qdktMX4zZOXfp6NiHHMQcCceOxa1ZJGKBKX6uOsNHDAgoPMcWajFYeBaRVcQqa3XJ6vbc_T1NFVNc13w4Xfu6KRuTFbmk4325MU-8Beyq6XKTda1ATpBd7XFJjEtCM4g3n8C8gWbFXvCXFyWXG9NDy_QD)

#### `?FB` — 반복

**형식:** `?FB0 … ?FBcount  /  ?FBcount,label` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

?FB0으로 위치를 표시하고, ?FBcount는 그 사이를 모두 count번 연주할 때까지 거기로 돌아갑니다. ?FBcount,n은 레이블 n(:n 또는 구절 n)으로 같은 일을 합니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 e%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FB0 ?FC1 ?FB2 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY9PC4JAEMW_yjbQbTZ2Fs0UREjTkyWZJFSn_hztEl7E796b6LBvZt77DcxONFIiTAMl1B721arucmL6YMzOhUsnxz7kIOZIOHYsbs0iEQtM8f-qM3zEgIDCc2yhFoOFZxFZRayyVpesbv-7n6epYorrmg_n69C0VWuyspB0ui835omXlUcEddsXJus7gZwgu8bjlhi3hGYUb94BwK2D5KKdNwv86kXJ5cb00DJ_AQ)

#### `:` — 레이블

**형식:** `:n` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

레이블 n으로, ?FJn과 ?FBcount,n이 갈 곳입니다. 구절 번호(?FDn)도 레이블입니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU4 ?XT1 ?EP2,129,115 v12 o4 c%16 :1 d%16 ?FB3,1 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY_NCsJADIRfJQa8JbJZ-0MXZEGrnqpCLRbUk8VjvUgvpe9uIr1kdma-EHbEAYMQ9hiwPp-Oq6rZIeFXbbyVbjM68iklBeVChSNxGYnkJBqKn9W85lorpKhmjlgnq2HNWCs2hI1lW2Lbnl__zFrDDLc1n06PvqrbEmLbJDquAnF_8Xqy0JMpDOLhk8BrKRkEgc40HrZrEljoD94Y7k_CzmT6AQ)

### 효과와 프로그램

#### `?XD` — 효과 정의

**형식:** `?XDn={ … }` · **대상:** `PSG`, `SCC`, `OPLL`

공유 효과 n(0–9)을 정의합니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?XD1={c%8 !}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY_BCoJAEIZfZRvoNhM7i2YK4iHDkyWYJFSnoqNdwov47v0jXmZ2vvl-mJ1opEyZBsqovZyrXd0diemHsbiVPp88h5ijlBPl1LP6PasmrIAa1m4zONaQoIJ5FlTBIGCClZgi5oqFxNLra2G2Nc10i4V4fgxNW7Wu6EvNp9f24DZAdduXQJ2iXFFOTcAVKa6I3ajBfSO3qPjEh7L7k-ltbf4D)

#### `?XM` — 효과 모드

**형식:** `?XMmode[,value]` · **대상:** `PSG`, `SCC`

효과나 리터럴(?XT2) 트랙의 단계가 바꾸는 것: 0 끔, 1 음, 2 음높이, 3 레벨입니다. value는 각 단계가 몇 틱 이어지는지입니다(?XM0이면 다음 ?XS 값).

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XP` — 프로그램 단계

**형식:** `?XPperiod,level[,1]` · **대상:** `PSG`, `SCC`

악기 프로그램의 한 단계로, 주기(0–4095)와 레벨(0–15)입니다.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XI` — 음높이 단계 크기

**형식:** `?XI0 / ?XI1 / ?XI2` · **대상:** `PSG`, `SCC`

효과의 음높이 단계가 바이트(0), 워드(1), 상위 바이트(2) 중 무엇인지 정합니다(압축 줄).

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?XI1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SztNYuSA9WxENVqKUF9aR4rBfppfTfnUgvk53JG7IjDRSVqadI9fl0WFXNjpi-sEVb-u3oOaSc5Jwp557Vr1k1Y0WoYZ7mkWMNCCgyzwIVGEEmWIkhYqxYSaw9v_6ZbQ0z3Gohne59VXelK7pGIVeTI2R_Cbib427qBg3uk7jncuMW-Pab4u3B9LIx_QA)

#### `?XS` — 리터럴 단계

**형식:** `?XSbyte` · **대상:** `PSG`, `SCC`

악보의 바이트 하나입니다(0–207, 보통 $16진수). ?XT2 트랙이나 효과에서는 ?XM 길이만큼 이어지는 단계이고(?XM0 다음이면 그 값 자체: ?XM0 ?XS$6D는 109틱 기다림), ?XT1 트랙에서는 음(음높이×16 + 길이−1)입니다. 압축 줄.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?XS2 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SzdK0tyB6seKoKtVhQT4rHepFeSv_difSS7My8ITvSQKUy9VRSczoeVnW7I6YvZLpWfjt6DpGzgnPlwrP6NavmrDA1zNs0fMSAgMLzLJgCIfAEkRgixoqVxNrz6-9ZapjhVgtxuvd101Uuda1iXGw0waX9OeBugbvRDRrcJ3PP5cYt8O03lbcH08vW9AM)

#### `?XT` — 트랙 종류

**형식:** `?XTn[,mode]` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

트랙의 종류입니다. 1 음표(PSG/SCC와 OPLL 선율), 2 PSG/SCC의 리터럴 단계(?XS, ?XP), 4 ?XD 효과를 시작하는 음표(c = ?XD0, c+ = ?XD1 …), MSXG는 64, 0은 저장된 OPLL 상태를 지웁니다. ?XT4와 ?XT64 트랙에서 r은 아무것도 시작하지 않는 쉼표입니다. PSG/SCC에서 ,1은 바로 바꾸고 ,2는 쉬고 있는 음의 위상도 유지합니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SztNZdkB6seKoKtVhQT4rHepFeSv_difSS7My8ITvSQEmZekrUnI6HVd3uiOkLWV4rvx09h5yzyIVy9Kx-zaoFK0wN8zYNHzEgoPA8C6ZACDxBJIaIsWIlsfb8-nuWGma41UI-3fu66SpXdq1iXDD254CTESdzN2hwn8w9lxu3wI_flG4Pppet6Qc)

#### `?IM` — 악기 프로그램 쓰기

**형식:** `?IMn  /  ?IM-` · **대상:** `PSG`, `SCC`

프로그램 표 n(?IMn={…})을 거쳐 음을 냅니다. 프로그램은 음마다 고정됩니다. ?IM-로 끕니다.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XH` — 효과 유지

**형식:** `?XH0 / ?XH1` · **대상:** `PSG`, `SCC`

진행 중인 효과 프로그램을 다음 음까지 이어 갈지(1) 아닐지(0) 정합니다.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 ?XH0 v12 o4 c%2 ?XR c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1QCEPA4UyoNp8E4VkVaCWiCAI7emrC-Q4KxSpmigoAh2WpmQVHaujlAKiagE)

#### `?XC` — 효과 취소

**형식:** `?XC  /  ?XCmask,1 !` · **대상:** `PSG`, `SCC`

진행 중인 프로그램을 취소합니다. ! 바로 앞의 ?XCmask,1은 채널 묶음을 함께 끝냅니다.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XR` — 효과 다시 시작

**형식:** `?XR` · **대상:** `PSG`, `SCC`

진행 중인 프로그램을 처음부터 다시 시작합니다.

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 ?XH0 v12 o4 c%2 ?XR c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1QCEPA4UyoNp8E4VkVaCWiCAI7emrC-Q4KxSpmigoAh2WpmQVHaujlAKiagE)

#### `?VF` — 전체 페이드

**형식:** `?VFprofile,interval,step,target  /  ?VF-` · **대상:** `PSG`, `SCC`, `OPLL`, `MSXG`

MSX 채널 전체를 페이드합니다. profile 0–1, interval마다 step(1–15)씩 target 레벨(0–15)까지. ?VF-로 취소합니다.

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?EP2,129,115 ?VF0,4,1,0 v12 o4 c%16 c%16 !
```

[▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJAEIRf5Vyw25XbIz8kICmMWkWFGBNQK8UyNpIm5N2d1TSzN7PfsNxIA-XK1FNO9fGwX1XNhpg-sEVb-vXoOcQcZZwqZ57VJ6yasiLUME_zyLEGBBSZZ4EKjCATrMQQMVasJNaeX7_MtoYZbrUQT7e-qrvSFV2jkDNkewo4meFk7IrLznPEyt4NGtw7co-lJn9Z4Asvyq93pqeN6Qs)

## 이 명령으로 쓴 곡

아래 저장소 샘플은 모두 칩 확장 명령으로 쓴 곡입니다. 링크를 누르면 MUCPlayground에서 오실로스코프와 함께 열립니다.

- **[Gradius 2 — A Planet of Plants (Plant Planet Theme)](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/Gradius2/A%20Planet%20of%20Plants%20%28Plant%20Planet%20Theme%29.MUC)** — SCC + PSG, `#sccvoice GRA2.DAT` 파형, ?XD 드럼 효과 · [▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/Gradius2&song=A%20Planet%20of%20Plants%20%28Plant%20Planet%20Theme%29.MUC&view=scope)
- **[F-1 Spirit 3D Special — 01 Is it Domingo Today](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/F-1_Spirit_3D_Special/01%20Is%20it%20Domingo%20Today.MUC)** — MSX-MUSIC 선율과 ?IT 키트를 쓰는 MSXG 드럼 · [▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/F-1_Spirit_3D_Special&song=01%20Is%20it%20Domingo%20Today.MUC&view=scope)
- **[Space Manbow — 03 Battle Ship (1st.BGM)](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/SpaceManbow/03%20Battle%20Ship%20%281st.BGM%29.MUC)** — ?WD로 정의한 SCC 파형, PSG와 ?XD 효과음 · [▶ MUCPlayground에서 열기](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/SpaceManbow&song=03%20Battle%20Ship%20%281st.BGM%29.MUC&view=scope)

전체: [`Samples/Muc/MucoMSXChipExtension(msPb)Format`](../Samples/Muc/MucoMSXChipExtension(msPb)Format). MUCScope와 MUBScope 패키지에는 이 세 곡이 msPb 샘플(MUC와 컴파일한 MUB)로 들어 있습니다.

## 영상

재생목록 **[MucoMSX (Mucom88 for MSX)](https://www.youtube.com/playlist?list=PLC9BqxYlA7js)**에서 MSX 실기의 툴체인과 플레이어, 이 명령으로 쓴 곡을 볼 수 있습니다.

| | |
|---|---|
| [![MUCEdit — MSX에서 편집하고 컴파일하기](https://img.youtube.com/vi/Wq0RhtrQlBE/mqdefault.jpg)](https://www.youtube.com/watch?v=Wq0RhtrQlBE) | **[MUCEdit — MSX에서 편집하고 컴파일하기](https://www.youtube.com/watch?v=Wq0RhtrQlBE)** |
| [![MUCScope — MUC를 컴파일하고 화면과 함께 연주](https://img.youtube.com/vi/CJvW9Itukdw/mqdefault.jpg)](https://www.youtube.com/watch?v=CJvW9Itukdw) | **[MUCScope — MUC를 컴파일하고 화면과 함께 연주](https://www.youtube.com/watch?v=CJvW9Itukdw)** |
| [![MUBScope — 비주얼 음악 플레이어](https://img.youtube.com/vi/Xk4awiKuZGc/mqdefault.jpg)](https://www.youtube.com/watch?v=Xk4awiKuZGc) | **[MUBScope — 비주얼 음악 플레이어](https://www.youtube.com/watch?v=Xk4awiKuZGc)** |
| [![MUBPlay — 완성된 MUB 연주](https://img.youtube.com/vi/jpkDOpuv0Ig/mqdefault.jpg)](https://www.youtube.com/watch?v=jpkDOpuv0Ig) | **[MUBPlay — 완성된 MUB 연주](https://www.youtube.com/watch?v=jpkDOpuv0Ig)** |

## 예전 형식과 툴체인 전체 사양

예전 MSX 곡은 한 글자 `?` 형식(`?p`, `?r`, `?j`, `?PN{…}`, `?RN{…}`, `?n`, `?s`, `?H`, `?L` …)과 *MSX 채널의 MUCOM88 호환 명령*의 명령을 씁니다. 지금도 컴파일되지만, 새 곡은 이 문서의 두 글자 명령으로 쓰는 것이 좋습니다.

예전 형식과 packed 형식의 세부까지 담은 툴체인의 전체 사양은 MucoMSX 문서 패키지의 `docs/MSX_MML_KO.TXT`(영어 `_EN`, 일본어 `_JA`), `docs/PACKED_NOTES.TXT`, `docs/OPLL_NATIVE.TXT`입니다. MSX 칩 대상은 [`shared/docs/MSX_TARGETS.md`](../shared/docs/MSX_TARGETS.md), SCC 제어는 [`shared/docs/SCC_CONTROL.md`](../shared/docs/SCC_CONTROL.md)에 있습니다.
