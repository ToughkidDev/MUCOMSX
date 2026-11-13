# MucoMSXExtension — MucoMSXチップ拡張コマンドセット

[English](readme.md) · [한국어](readme.ko.md) · **日本語**

**MucoMSXExtension**は、MucoMSXがMUCOM88のMMLに加えたMSXサウンドチップ用のコマンドセットです。対象はPSG（AY-3-8910）、SCC/SCC+、MSX-MUSIC（YM2413/OPLL）とそのドラムです。曲はMUCOM88の文法とOPNAパートをそのまま使い、MSXのパートは専用のチャンネル行（`MSXD`、`SCCA`、`MSXA` …）に、エンベロープ、音程、ゲート、波形、OPLL音色、共有フレーズ、エフェクトプログラムを2文字の`?`コマンドで書きます。

このコマンドを使った曲は、MucoMSXのpacked形式 **msPb0103–010A** にコンパイルされます。同じソースが、MSX実機のMucoMSXツールチェーンとビジュアルプレイヤー、MacのMDPlayer4Mac、ブラウザーのMUCPlaygroundで演奏されます。

## 目次

- [使える環境](#使える環境)
- [1分で試す](#1分で試す)
- [MUCPlaygroundのテンプレート](#mucplaygroundのテンプレート)
- [このガイドとMUCPlaygroundの使い方](#このガイドとmucplaygroundの使い方)
- [コマンドリファレンス](#コマンドリファレンス)
  - [MSXチャンネル](#msxチャンネル)
  - [書き方](#書き方)
  - [MSXチャンネルのMUCOM88互換コマンド](#msxチャンネルのmucom88互換コマンド)
  - [グローバルリソース](#グローバルリソース)
  - [エンベロープ](#エンベロープ)
  - [音程](#音程)
  - [ゲートと音の終わり](#ゲートと音の終わり)
  - [PSGノイズとハードウェアエンベロープ](#psgノイズとハードウェアエンベロープ)
  - [SCC波形](#scc波形)
  - [MSX-MUSIC](#msx-music)
  - [共有フレーズ](#共有フレーズ)
  - [エフェクトとプログラム](#エフェクトとプログラム)
- [このコマンドで書いた曲](#このコマンドで書いた曲)
- [動画](#動画)
- [以前の形式とツールチェーンの全仕様](#以前の形式とツールチェーンの全仕様)

## 使える環境

| | |
|---|---|
| MSX — MUC2MUB、MUCPLAY、MUCEDIT | コンパイルと演奏（MucoMSXが基準の実装） |
| MSX — MUCScope、MUBScope | チャンネル表示つきでコンパイル・演奏。MUBScopeはコンパイル済みのmsPb MUBを演奏 |
| MDPlayer4Mac v0.2.4以降 | macOSで同じMUCをコンパイル・演奏 |
| MUCPlayground | ブラウザーで書いてすぐ聴ける。MMLガイドにこのコマンドセットを収録 |

## 1分で試す

下の曲をMUCPlaygroundで開いて再生し、数字を1つ変えてもう一度聴いてみてください。SCC 2パート、PSG 1パート、MSX-MUSIC 1パートで、どれもコンパクト行（`?XU1`）、`L`で繰り返し`!`で終わります。

```
#title First steps
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCS ?FD1={ ?EP0,$01,$61 v12 ?FR }
SCCA ?XU1 ?XT1 @0 ?FC1 o5 L [c%2 e%2 g%2 >c%2< g%2 e%2]2 !
SCCB ?XU1 ?XT1 @0 ?FC1 v9 o3 L [c%6 g%6]2 !
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v10 o4 L [r%3 c%1 r%2]4 !
MSXA ?XU1 ?XT1 ?IR3 v11 o4 L [e%12]2 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbZFBa4NAEIX_ynQbb7NlRxMTpaltTQOBBIomNJDklNoSKFpUvEj-e9-qhxx6mJ2dN99jH2yrGhUKq1yFarlK0u3DZhcrVjXm-_pS_2S0vJRVTVWd_VbHPPpYmHlr2J3wOOCpcGBYjM8iUxaI4g7dztCxBgQUmmGNU2PQ0DRW2iLastqatHUPt06zW4tZ3NrcyfWYp3GcUrRcyLyl6O3d8MgIj3yhRlzoCfXMC0X7neDYCj0bLGKhYkJrOpwdlzLUN-oJw2N3g3Jy6a7zvv7jbQIqvN7uw-D38CbdL27gPs8MebwZ8hgqxtZSOh6dHaESb4wH222-aJV4wGXAM0eGLPiJLxUeTqw-bbv-AQ)

## MUCPlaygroundのテンプレート

MUCPlaygroundの**新規**には、このコマンドで書いたコメントつきのテンプレートがあります。下のリンクから直接開けます。

- [**MSXチップ**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extAll) — SCC、MSX-MUSIC、PSGを一緒に: 共有フレーズ、エンベロープ、ビブラート、エフェクトのハイハット、?IDドラム。
- [**OPNA + MSXチップ**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extOpna) — OPNAのFMとリズムの横にSCC、MSX-MUSIC、PSGのパート。C112とt198で拍をそろえます。
- [**SCC**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extScc) — SCC/SCC+の5パート: ?WD波形、?EPエンベロープ、ビブラート、デチューンのコーラス、?FDフレーズ、?FB繰り返し。
- [**MSX PSG**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extPsg) — PSGの3チャンネルでリード、ベース、?XDエフェクトで作ったドラム。
- [**MSX-MUSIC**](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?ex=extOpll) — YM2413のパート: 内蔵・ユーザー（?IU）音色、?QPゲート、サステイン、キットを使う?IDドラム。

同じテンプレートが[`Samples/Muc/Templates/7_MSX_Extension`](../Samples/Muc/Templates/7_MSX_Extension)にあります。

## このガイドとMUCPlaygroundの使い方

- 下の例にはすべて**MUCPlaygroundで開く**リンクがあります。例がエディターに開き、すぐ演奏したり書き換えたりできます。
- MUCPlaygroundの**マニュアル**ボタンは、同じリファレンスを文章の横に開きます（本 *MucoMSXチップ拡張コマンド*）。**挿入**は例をカーソル位置に入れ、エディターは入力中にこのコマンドを候補表示・チェックします。
- チャンネル表示とオシロスコープは演奏中のMSXチップの各チャンネルを表示し、**共有**は曲をこのページのようなリンクにします。

## コマンドリファレンス

リファレンスはMUCPlaygroundのMMLガイドに沿っています。このページの例はすべて、現在のMucoMSXコンパイラー（MUC2MUB、2026-11-13ビルド）でそのままコンパイルして確認しました。

### MSXチャンネル

MUCOM88とmucomDotNET拡張にはこれらのチャンネルはありません。この名前で始まる行はMSXの音楽で、その行のすべてのコマンド（?コマンドと下のMUCOM88互換コマンド）はそのチップ向けに読まれます。

#### `MSXD` — MSX PSG

**形式:** `MSXD MSXE MSXF` · **対象:** `PSG`

MSX内蔵PSG（AY-3-8910）の3チャンネルです。トーン、ノイズ（P、w）、ハードウェアエンベロープ（?GS）を使います。最初の音の前に@nかE、そしてvを指定します。

```
MSXD @0 v12 o5 l8 cdefgab>c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRVyLBSSU1LT0hOT7JKBKtKUrKJjdZRSQFQtAA)

#### `SCCA` — SCC / SCC+

**形式:** `SCCA SCCB SCCC SCCD SCCE` · **対象:** `SCC`

SCC/SCC+カートリッジの波形5チャンネルです。@nで32サンプルの波形（?WDn={…}、以前の形式@Wn:{…}、#sccvoice）を選び、v0–15は線形です。通常のSCCではチャンネル4・5が1つの波形を共有します。

```
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
SCCA @0 E255,0,8,2,160,32 v12 o5 l8 cdefgab>c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY69DsIwDIRfxfJsoziQ_mRARRFiAoYKMQADtJQFlQV1qfru2KiL7bv7LsqIA0Yh7DFifTzsFvtTQsKvSoDq7OIIjnygVUm5UOlIXEYiOYma4udtWn2NFVJUPUesk1WweqwRG8LGspXY2vP19yw1zHCr-QDTta9T2kDlYOuDPVqQJ8kcLT0M4uET4F1A0z671_2xbvTnHcbLjbC1Nf0A)

#### `MSXA` — MSX-MUSIC旋律

**形式:** `MSXA MSXB MSXC MSXH MSXI MSXJ` · **対象:** `OPLL`

YM2413（OPLL）の旋律6チャンネルです。@nは曲のFM音色nを使い、内蔵15音色のうち最も近いもので演奏します。?IR・?IUは音色を直接選びます。ステレオのパンはモノになります。

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA @1 v12 o4 l8 cdefgab>c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjkD7FMoMjRTyTRRyLBSSU1LT0hOT7JKBzklTsoqO1VFKAVG1AA)

#### `MSXG` — MSX-MUSICドラム

**形式:** `MSXG` · **対象:** `MSXG`

YM2413のリズムで、Gパートのように書きます。@maskでドラムを選び、音符で鳴らし、vで音量を決めます。リムショットはありません。

```
MSXG v63,31,31,31,31,31,0 l8 [@9c @8c @10c @8c]2
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcrMjHWMDVGQgUKOhUK0g2WygoMFEBsagBmxRkBtaUpW0bE6SikgqhYA)

### 書き方

MSXD–F（PSG）、SCCA–SCCE（SCC+）、MSXA–C・MSXH–J（MSX-MUSIC旋律）、MSXG（ドラム）で使い、通常のOPNA A–Kと一緒に使えます。このコマンドを含む曲はpacked形式でコンパイルされます。以前の1文字の?・@形式もそのまま使え、数字の@nは音色のままです。

#### `?XU` — コンパクトチャンネル

**形式:** `?XUn … !` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

その行を長さ単位nのコンパクトストリームにします。多くのコマンドがこれを必要とします。音長は%1–%16単位で書き、行は!で終わります。通常の行と同じく|は小節線、[ ]nは繰り返し（2重まで、次の行へ続いてもよい）、Lは最後の!が戻る位置です（/は使えないので[A B]n-1 Aと書きます）。?FB、?FJ、共有フレーズも使えます。コンパクトなSCC行の上にはSCC波形（?WD）が必要で、PSGの行だけの曲には無音の波形が自動で入ります。（コンパクト行の| [ ] L、コンパクトなMSX-MUSIC行の?IR / ?IU、?XT4 / ?XT64トラックの休符、?WDのないPSG曲にはMDPlayer4Mac v0.2.6以降が必要です。v0.2.5以前は拒否するか、違う演奏になります。）

```
MSXD ?XU1 ?XT1 ?EP0,$81,$38 v12 o4 c%4 L [e%2 g%2]2 | c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOwjQg2BRAiQcA0w0FGxMNRRMbZQKDM0Usg3UUhWNVHwUYhOVTVSSFc1ijVSqAEKWSgoAk1IU7KKjtVRSgFRtQA)

#### `PSGS` — 共有定義の行

**形式:** `PSGS / SCCS / OPLS  ?FDn={…} ?XDn={…}`

PSG・SCC・OPLLチャンネルが共有するフレーズと効果だけを置く行です。それ自体は演奏せず、定義は複数行にまたがって書けます。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCS ?FD1={?EN2 ?FR}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JQDIT_Sm3i1prXFxAlIU8D6CQa0WCiThpHXAwL4b_bKsu1vftuaI8dpkLYYor1vtrOduccCT96hqZwWe_IxxQtKRFaOhI3J5GERE3x47RbfY0VUlQ9R6zKerB6rBEbwsayldja4_bzLDXMcKv5eLi1dZ7XEDaFZH0oK6_r8e-uIVzOonJSaQ4OVg5CeWDoxMM7gsd0ARP944Xp9U74tDF8AQ)

#### `$` — 16進数

**形式:** `$hex`

引数とリソースの値は$で16進数で書けます（$FFFFまで）。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?MV0,$11 ?EP2,129,115 v12 o4 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLU67CsJQDP2Va9AtkZtLH_SCdLDiVBVqtaBOimNdpEvpv3siXU5yXiQjDRSVqadIzfGwX9ftlpi-oOW18pvRc0g5KThXLjyrz1g1Z4WoYZ7GocNGCFFongUoIAJNYIlFxLJiJbH2vP01cy1mcauFdLr3ddNVruxaBZwB9cXzUrHsTgG3C9xO3aDBfRL3XGnmFvj9TfH2YHrZmH4)

#### `@n:{ }` — 波括弧のFM音色

**形式:** `  @n:{ 38 values }  /  @%n:{ 25 bytes }` · **対象:** `FM`

この拡張を使う曲では、FM音色を波括弧の中に1行で書けます。FB,ALGとオペレータ4行（38個の値）、または25バイトのレジスタ形式です。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
  @1:{ 5,4, 31,8,2,6,3,30,0,1,3, 31,6,1,6,2,0,0,1,3, 31,10,2,6,3,36,0,2,7, 31,6,1,6,2,0,0,1,7 }
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%16 !
A @1 v12 o4 c4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbZDLigJBDEV_JQbc3ZJK9ctuEBUdXPkAFQWd1YjLdiNuGv99bgZHZjGLyuPmhCTV6UMbg7ba6Ha9WgyW-5lC70zHh3kcdRGpQF6jMtQRFkuYVTCKll7ec-osEyJKLSLQBiaBWmApOBKcDd4UvPsV_Whedcxxb0vF89yKTKzphAtAMsMQCSUyZJEDjIGLXIgv4a9m8Zcs4WH1D1kJByy3x7mMj3uj2dF8bBJvqnlTIQ9Lcsvlq2-l9M7tlLu8tZx_dNXm9Am9uHt-Aw)

### MSXチャンネルのMUCOM88互換コマンド

MSXチャンネルが受け付ける通常のMUCOM88コマンドと、そのチャンネルでの動作です。以前のMSX曲と、チップ拡張を使う曲の通常の（?XUでない）行で使えます。?XUのコンパクト行は音符、o、< >、l、v、t、C192、@n、!、|、[ ]、Lだけを受け付けます。

#### `c–b` — 音符

**形式:** `c d e f g a b [+ # -][length][.]` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

MUCOM88と同じです。音長nはC/nクロック、%nはnクロック、付点は半分を足します。MSXGでは@で選んだドラムを鳴らします。?XU行では音長を%1–%16単位、または192を16単位以下に割る音長で書きます。

```
MSXD @0 v12 o4 l8 c d e f+ g4. a16 b-16 >c2
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFVIUUhXStBXSTfQUEg3NFJJ0gYRdshFQR5qSVXSsjlIKiKoFAA)

#### `r` — 休符

**形式:** `r[length]` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

その長さだけ休みます。音符とつなぐことはできません。

```
MSXD @0 v12 o4 l8 c r e r g4 r4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFYoUUoE43UShyASoKk3JKjpWRykFRNUCAA)

#### `l` — 標準の音長

**形式:** `l4  l8  l%12` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

音長を書かない音符の長さです。

```
MSXD @0 v12 o4 l16 cdef l4 g
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyDM0UklNS0xRyTBTSgUrSlKyiY3WUUkBULQA)

#### `o` — オクターブ

**形式:** `o1–o8  > <` · **対象:** `PSG`, `SCC`, `OPLL`

oでオクターブを決め、>と<で1つずつ動かします。PSG、SCC、OPLLは1–8です（?XUのPSG・SCC行は1–6）。

```
MSXD @0 v12 o4 l8 c e g >c< g e c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSFVIV0hXskm2AZKpCMlBdmpJVdKyOUgqIqgUA)

#### `C` — 基準クロック

**形式:** `C128` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

全音符のクロック数です（標準128）。?XU行はC192だけを受け付けます。

```
MSXD @0 v12 o4 C96 l4 cdef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRScLc0UckwUklNS04AK0pSsomN1lFJAVC0A)

#### `T` — テンポ

**形式:** `T120  t200` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

TはBPM、tはタイマー値そのもので、曲全体のテンポを決めます。?XU行はtだけを受け付けます。

```
MSXD T150 @0 v12 o4 l8 cdefg
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFEIMTQ0UHAwUygyNFPJNFHIsFJJTUtPSgUrSlKyiY3WUUkBULQA)

#### `v` — 音量

**形式:** `v0–15` · **対象:** `PSG`, `SCC`, `OPLL`

すべての旋律チップで0–15です（SCCは線形、OPLLはFMパートのように）。?EL、?ENとエンベロープでさらに整えます。

```
MSXD @0 v8 o4 l8 cd v12 ef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMosFPJNFHIsFJJTFMoMjRRS04AK0pSsomN1lFJAVC0A)

#### `v` — ドラム音量

**形式:** `vtotal,BD,SD,TOP,HH,TOM,RIM` · **対象:** `MSXG`

Gパートのように全体（0–63）、続いてドラムごとに0–31です。RIMの値は使われません。

```
MSXG v40,31,20,31,20,31,0 l8 [@1c @8c @2c @8c]2
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcpMDHSMDXWMkEgDhRwLhWgHw2QFBwsgNgLTsUZAXWlKVtGxOkopIKoWAA)

#### `) (` — 音量を上げる・下げる

**形式:** `)n  (n` · **対象:** `PSG`, `SCC`, `OPLL`

vをnだけ（省略時1）上げ下げします。MSXGでは使えません。

```
MSXD @0 v10 o4 l8 c )2 d )2 e (4 f
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMDRTyTRRyLBSSFTSNFFJARKqCholCGlBhmpJVdKyOUgqIqgUA)

#### `@` — PSGプリセット

**形式:** `@0–@15` · **対象:** `PSG`

MUCOM88のSSGプリセット16個の1つです。エンベロープ、トーン・ノイズの設定、場合によってビブラートが一緒に決まります。

```
MSXD @3 v12 o4 l8 cdef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFByMFcoMjRTyTRRyLBSSU1LTgJJpSlbRsTpKKSCqFgA)

#### `@` — SCC波形

**形式:** `@n` · **対象:** `SCC`

波形n（?WDn、@Wn、#sccvoiceバンク）を選びます。音量の形はEか?EPで与えます。

```
  @W0:{ 0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25 }
  @W1:{ 96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96 }
SCCA E255,0,0,0,0,255 v12 o5 l8 @0 cd @1 ef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zpVA7DsIwDL2K5dlGcUQozVRUISZgQIgBmCidUFlQl6p35xl6AYTysd_HiZOBe84m3HHmw363mW2PNQu_AImqU8gDBYlJ5qUUJmUQCwsxK8RAWpyiY_CQYYIVXBDFrgAKTiGpW9S96kXq1VP24Vx1m9u9LCYaL513YeiixPG_TP1v-dWHul7ROiZ_zHcgp94iPRM9llQFujVUGd1bfFnL-XwVbjyMbw)

#### `@` — FM音色をOPLL楽器に

**形式:** `@n` · **対象:** `OPLL`

曲のFM音色n（インラインか#voice）を使い、最も近いYM2413内蔵音色で演奏します。?XU行では@0–@15が音色番号そのものです。

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA @1 v12 o4 l8 cdef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjkD7FMoMjRTyTRRyLBSSU1LTgC5JU7KKjtVRSgFRtQA)

#### `@` — 鳴らすドラム

**形式:** `@mask` · **対象:** `MSXG`

Gパートのように1 BD、2 SD、4 TOP、8 HH、16 TOMの和です。続く音符でこのドラムを鳴らします。

```
MSXG v63,31,31,31,31,31,0 l8 @1c @2c @9c @16c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyPcFcrMjHWMDVGQgUKOhYKDYbKCgxEQWwKxoVkyUE-aklV0rI5SCoiqBQA)

#### `q` — ゲート

**形式:** `q0–255` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

MUCOM88のように各音を終わりのnクロック前に離します（?QRで戻し、?QPはOPLL用です）。

```
MSXD @0 v12 o4 l4 q4 cd q0 ef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyTBQKTRSSUxQKDRRS04Bq0pSsomN1lFJAVC0A)

#### `E` — ソフトウェアエンベロープ

**形式:** `Eal,ar,dr,sr,sl,rr` · **対象:** `PSG`, `SCC`, `OPLL`

MUCOM88のSSGエンベロープです（値6つ、0–255）。OPLLではチップ拡張を使う曲でだけ使え、以前のMSX曲はPSGとSCCだけです。

```
MSXD E255,0,30,4,120,60 v12 o4 l4 cdef
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFFyNTE11DHSMDXRMdAyNDHTMDBTKDI0U8k0UckwUklNS04CK05SsomN1lFJAVC0A)

#### `M` — LFO（ビブラート）

**形式:** `Mdelay,rate,depth,count  MF0/1  MW MC ML MD` · **対象:** `PSG`, `SCC`, `OPLL`

MUCOM88のソフトウェアLFOとそのサブコマンドです。深さはどのチップでも同じ向きに音程を動かします。

```
MSXD @0 v12 o4 l2 M12,1,2,4 c d
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyjBR8DY10DHWMdEwUkhVSgKrSlKyiY3WUUkBULQA)

#### `D` — デチューン

**形式:** `Dn  Dn+` · **対象:** `PSG`, `SCC`, `OPLL`

音程をnだけずらし、どのチップでも同じ向きです。チップ拡張を使う曲ではDn+が現在のデチューンに足します。

```
MSXD @0 v12 o4 l4 c D8 c D0 c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyTBSSFVwsQISBQjJQTZqSVXSsjlIKiKoFAA)

#### `P` — トーン・ノイズ

**形式:** `P0–3` · **対象:** `PSG`

P1トーン、P2ノイズ、P3両方、P0なし。PSGチャンネルだけ（SCCは不可）。

```
MSXD @0 v12 o4 l8 P2 w8 c c P1 c c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBQCjBTKLRSSgTDAEEQBFaYpWUXH6iilgKhaAA)

#### `w` — ノイズ周期

**形式:** `w0–31` · **対象:** `PSG`

PSG 3チャンネル共有のノイズ周期です（?NPは優先度を加えます）。

```
MSXD @0 v12 o4 l8 P2 w8 c c P1 c c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBQCjBTKLRSSgTDAEEQBFaYpWUXH6iilgKhaAA)

#### `&` — タイ

**形式:** `c4&c4` · **対象:** `PSG`, `SCC`, `OPLL`

次の音とつなぎ、新しく発音しません。

```
MSXD @0 v12 o4 l8 c&c d4&d8 e
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSS1ZIVUkzUUiwUUoFq0pSsomN1lFJAVC0A)

#### `^` — 音長を足す

**形式:** `c4^8` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

直前の音符や休符に音長を足します。

```
MSXD @0 v12 o4 c4^8 d8
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRSSTeIsFFIsgJJpSlbRsTpKKSCqFgA)

#### `[ ]` — 繰り返し

**形式:** `[ … ]n` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

括弧の中をn回（1–255）演奏します。MSXチャンネルでは2重までです。?XU行でも使え、次の行へ続いてもかまいません。

```
MSXD @0 v12 o4 l8 [cd [ef]2 g]2
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSik1MUolPTYo0U0mONgKrSlKyiY3WUUkBULQA)

#### `/` — 最後の回で抜ける

**形式:** `[ … / … ]n` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

最後の回は/で繰り返しを終えます。?XU行では使えないので[A B]n-1 Aと書きます。

```
MSXD @0 v12 o4 l8 [cde / fg]3 c4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSik1NSFfQV0tJjjRWSTYDK0pSsomN1lFJAVC0A)

#### `L` — ループ位置

**形式:** `L` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

チャンネルの終わりで戻る位置で、チャンネルごとに1回です。?XU行では最後の!がここへ戻ります。

```
MSXD @0 v12 o4 l8 cd L efg
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSUxR8FFLT0oEK0pSsomN1lFJAVC0A)

#### `!` — 終わり

**形式:** `!` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

チャンネルをここで終えます（Lがあればループ）。?XU行は必ずこれで終わります。

```
MSXD @0 v12 o4 l8 cdef !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSU1LTFBSB0mlKVtGxOkopIKoWAA)

#### `*` — マクロ

**形式:** `#*n{…}  *n` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

MUCOM88のようにマクロを使います（最大8重）。**シフトとマクロ内の?XUは使えません。

```
#*1{cdef}
MSXD @0 v12 o4 l8 *1 *1
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXKVtQyrk1NS02pj8nyDI1wUHAwUygyNFPJNFHIsFLQMgQioME3JKjpWRykFRNUCAA)

#### `|` — 小節線

**形式:** `|` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

読みやすさのためで、無視されます。

```
MSXD @0 v12 o4 l8 cdef | gab>c
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFBwMFMoMjRTyTRRyLBSSU1LTFGoU0hOT7JKBitKUrKJjdZRSQFQtAA)

#### `p K s y` — MSXチャンネルで使えないコマンド

**形式:** `p  K  s  V  H  R  y  J  { }  x  S` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

OPNA専用コマンド（パン、移調、キー補正、FM機能、レジスタ書き込み、ポルタメント）です。チップ拡張を使う曲ではMSXチャンネルでエラーになります。以前のMSX曲は一部を無視し（p）一部は適用する（K）ので、頼らないほうが安全です。代わりに?コマンド（?DW、?DS、?MV、?QP …）を使ってください。

### グローバルリソース

行頭に、演奏の行より前に書きます。

#### `?WD` — SCC波形

**形式:** `?WDn={32 values -128…127}` · **対象:** `SCC`

SCC波形nを定義します。SCC行の@nで選びます。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- v12 o4 c%16 e%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7LCsJQDER_JQbcJZJc-qAFqVLFlVqopQV15WNZN9JN6b-bSDeTOzNn4I44YK6EPeZYn0-H1bEpkfBrtmh3sh6FQkxRRqlSJqSSkGpKaqGG-bq33GqDDLVMiE3ZDFvGVrEj7Cz7iH09v_6Zt4457rMQT7e-LsstFF2jJheTthLYCBT7imHQAJ8IHktN4OWysH-_Mb_eCZ9-ph8)

#### `?WS` — バンクの波形

**形式:** `?WSlocal,bank,1` · **対象:** `SCC`

#sccvoiceファイルの波形bankをローカル波形番号localとして使います。

#### `?IU=` — OPLLユーザー音色

**形式:** `?IUn={8 bytes}` · **対象:** `OPLL`

MSX-MUSICのユーザー音色n（YM2413の音色バイト8個）を定義します。旋律行の?IUnで使います。

```
?IU0={33,97,29,7,130,143,16,7}
MSXA ?IU0 ?EP2,129,115 v12 o4 g%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMNbKuNjXUszXWMLHXMdQyNDXQMTYx1DM10zGtj8nyDIxwVQIoU7F0DjHQMgWoMDU0VygyNFPJNFNJVgXSRqgnQsDQlq-hYHaUUEFULAA)

#### `?IT=` — ドラムキット

**形式:** `?ITn={6 bytes}` · **対象:** `MSXG`

MSXG用のドラムキットn（リズム設定6バイト）を定義します。?ITnで選びます。

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?KT=` — 音程表

**形式:** `?KTn={12–128 values}` · **対象:** `PSG`, `SCC`, `OPLL`

通常の音階の代わりに使う周期（OPLLはF-number）の表です。行の?KTnで使います。

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

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY8_C8JADMW_yhlwe8ilSa9nQVQcHKQ6tIWCOvln1EVcSr-7OaGLOPzeS14yJD29qWTQg0qqD_vtrGo3BHpZu9w1ftGLKiQYMUD9HCoCzc2tz9lQo4gInCFoHE4P51ac1OXQrwsjwqYQiIcHQ8Y8IJHhJ2Y_7geksvi_b3FVd2u37Fo2aXwSq-xwu8E91V2m0d2Mif10p_J4Bl2TDR8)

#### `?IM=` — 楽器プログラム表

**形式:** `?IMn={12–128 phrase ids}` · **対象:** `PSG`, `SCC`

音を楽器プログラムとして使う共有フレーズに対応させます。行の?IMnで選び、?IM-で止めます。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

### エンベロープ

#### `?EP` — エンベロープのプロファイル

**形式:** `?EPprofile,a,b  /  ?EP-` · **対象:** `PSG`, `SCC`, `OPLL`

各音の音量をドライバのエンベロープ・プロファイル（0–8）と2つの値で形作ります。プロファイル3は値をもう1つ、8は2つ取ります（PSG/SCC）。OPLLはプロファイル2と3です。?EP-で止めます。

```
MSXD ?EP2,129,115 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXKDI0U8k0UklWBdJGqCVBdmpJVdKyOUgqIqgUA)

#### `?EA` — アタック

**形式:** `?EAmode,value` · **対象:** `PSG`, `SCC`, `OPLL`

エンベロープのアタックです。mode 0と1はドライバの2種類のアタック方式です。

```
MSXD ?EP2,129,115 ?EA0,4 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcRwMdE4UyQyOFfBOFZFUgXaRqAlSepmQVHaujlAKiagE)

#### `?ET` — 初期目標

**形式:** `?ETlevel` · **対象:** `PSG`, `SCC`, `OPLL`

エンベロープが最初に向かうレベル（0–15）です。

```
MSXD ?EP2,129,115 ?ET12 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYGcEEMjhTIgzjdRSFYF0kWqJkDVaUpW0bE6SikgqhYA)

#### `?EN` — 開始時の減衰

**形式:** `?ENvalue` · **対象:** `PSG`, `SCC`

各音がどれだけ小さく始まるかです。

```
MSXD ?EP2,129,115 ?EN3 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcP2OFMkMjhXwThWRVIF2kagJUnKZkFR2ro5QComoB)

#### `?EL` — 下限レベル

**形式:** `?ELlevel` · **対象:** `PSG`, `SCC`

エンベロープが下がる最低レベル（1–15）です。?EL0で解除します。

```
MSXD ?EP2,129,115 ?EL4 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTYEcHxOFMkMjhXwThWRVIF2kagJUnKZkFR2ro5QComoB)

### 音程

#### `?DB` — デチューン

**形式:** `?DBvalue` · **対象:** `PSG`, `SCC`, `OPLL`

ドライバの従来のデチューン（-128–255）です。

```
MSXD ?EP2,129,115 ?DB2 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXZyMFMoMjRTyTRSSVYF0kaoJUHGaklV0rI5SCoiqBQA)

#### `?DW` — 符号付きデチューン

**形式:** `?DWvalue` · **対象:** `PSG`, `SCC`, `OPLL`

符号付き16ビットのデチューン（-32768–32767）です。

```
MSXD ?EP2,129,115 ?DW-2 v12 o4 c%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXcJ1jRTKDI0U8k0UklWBdJGqCVB1mpJVdKyOUgqIqgUA)

#### `?DR` — デチューン解除

**形式:** `?DR` · **対象:** `PSG`, `SCC`, `OPLL`

デチューンを解除します。

```
MSXD ?EP2,129,115 ?DB2 v12 o4 c%8 ?DR c%8
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXsXZyMFMoMjRTyTRSSVS2A_CAQDVSfpmQVHaujlAKiagE)

#### `?DS` — ピッチスイープ

**形式:** `?DSstep,count[,mode]` · **対象:** `PSG`, `SCC`

countごとにstepずつ音程を動かします。modeなしは従来のスイープ、1はバイトスイープ（step 1–15、count 0–7）、2はワードスイープです。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCE ?WP0 @0 ?EP2,129,115 ?DS3,5,2 v12 o4 e%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQn0lshm7VpakBXa4kktFPGg3tRjBZFeSv_difSyszPzQjLRSJUyDVRRfzruV4dzTUxf2HRp_HbyHCLnJRfKpWf1G1YtWBFqWNQ8ctSAgCLzLHgFRpAJKjFEjBUbEptefv_MWsMMt7EQ59vQ13Xr0qXzbuddaruAhSUWRpeafs2Rgxs1uHfunhn0k-W4_UXV9c70MJl_)

#### `?MV` — ビブラート

**形式:** `?MVmode,value  /  ?MV-` · **対象:** `PSG`, `SCC`, `OPLL`

ドライバの圧縮値（$64のように16進数で書くことが多い）でビブラートをかけます。mode 1は位相ビブラート（PSG/SCC）、2はピッチプログラムです。?MV-で止めます。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- ?MV0,$64 ?MW3 v12 o4 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJQDIVfJQbdErm59ocW5CpVnKqFWiuok-JYF-lS-u4m0uUkOec7QwbsMRfCDnOsT8fDsmwKJPzqGdqdWw-OfExRRqlQ5khcQiIpiZrip2m3-horpKh6jliV9WD1WCM2hI1lK7G1p-3vWWqY4Vbz8Xjv6qLYQrg2onJWaSsHGwdhXzGE8uJonkS6tCvoxcMngudCEpjpA2_Mbw_Cl43xBw)

#### `?MW` — ビブラートの遅延

**形式:** `?MWdelay` · **対象:** `PSG`, `SCC`, `OPLL`

音が始まってからビブラートがかかるまでの時間です。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?XT1 ?WP0 @0 ?EP- ?MV0,$64 ?MW3 v12 o4 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJQDIVfJQbdErm59ocW5CpVnKqFWiuok-JYF-lS-u4m0uUkOec7QwbsMRfCDnOsT8fDsmwKJPzqGdqdWw-OfExRRqlQ5khcQiIpiZrip2m3-horpKh6jliV9WD1WCM2hI1lK7G1p-3vWWqY4Vbz8Xjv6qLYQrg2onJWaSsHGwdhXzGE8uJonkS6tCvoxcMngudCEpjpA2_Mbw_Cl43xBw)

#### `?KT` — 音程表を使う

**形式:** `?KTn[,start]  /  ?KT-` · **対象:** `PSG`, `SCC`, `OPLL`

音程表n（?KTn={…}で定義）で音を出します。コンパクトOPLLではstartからの12個の範囲です。?KT-で通常の音階に戻ります。

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

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY8_C8JADMW_yhlwe8ilSa9nQVQcHKQ6tIWCOvln1EVcSr-7OaGLOPzeS14yJD29qWTQg0qqD_vtrGo3BHpZu9w1ftGLKiQYMUD9HCoCzc2tz9lQo4gInCFoHE4P51ac1OXQrwsjwqYQiIcHQ8Y8IJHhJ2Y_7geksvi_b3FVd2u37Fo2aXwSq-xwu8E91V2m0d2Mif10p_J4Bl2TDR8)

### ゲートと音の終わり

#### `?QR` — 通常のゲート

**形式:** `?QR` · **対象:** `PSG`, `SCC`, `OPLL`

通常のゲートに戻します。

```
MSXD ?EP2,129,115 v12 o4 ?QR c%8 d%8
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXKDI0U8k0U7AODFJJVLRRSVC2AStOUrKJjdZRSQFQtAA)

#### `?QP` — OPLLゲート

**形式:** `?QPvalue[,mode]` · **対象:** `OPLL`

MSX-MUSICの音のゲートです。mode 1（コンパクト行）は音ごとにゲートの計算を新しく始め、mode 0は続けます。

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?QP255,1 @1 o4 c%3 ?QP64 d%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zbY47C8JAEIT_yriQbpDbeynXRLGwig9CIKBWBsvYiI34370T0ojFMLMfAzsveUpSyihJ2v1uO2-6jVAe-QRWeh4BBPqvO-WSlpGOztBQ6SYeWWT5g9VM_cgSF__7GTdtv0bdd4r6eLAhUPN33D2ulSsoegyVRszyuJuk04UyFHt_AA)

#### `?QE` — OPLLの音の終わり方

**形式:** `?QE0 / ?QE1 / ?QE2` · **対象:** `OPLL`, `MSXG`

0は通常のキーオフ（標準）、1は楽器を保ったまま周波数0で終え（旋律のみ）、2は最後の状態を保ちます。

```
  @1
   5,4
   31,8,2,6,3,30,0,1,3
   31,6,1,6,2,0,0,1,3
   31,10,2,6,3,36,0,2,7
   31,6,1,6,2,0,0,1,7
MSXA ?XU1 ?QE1 @1 o4 c%2 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXIVFBwMY_IUFBRMdUzAtLGhjoWOkY6ZjrGOsYGOgY6hjjFM3EwHhI100IQNDWDqzXRATHPs6oHCvsERjgr2EaGGCvaBroZAmxXyTRSSVY0UFIGuSVOyio7VUUoBUbUA)

### PSGノイズとハードウェアエンベロープ

#### `?NP` — 共有ノイズ

**形式:** `?NPvalue[,priority]  /  ?NP-,3` · **対象:** `PSG`

PSG 3チャンネル共有のノイズ周期（0–31）を設定し、priority 0–3でどのチャンネルが使うかを決めます。?NP-,3は最後に書いたチャンネルに従います。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?NP5 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY5BC4JAEIX_yjbQbSZ2FjdTCA8ZnTTBJKE6FR3tEl7E_96b8DKz773vMTvRSLkyDZRTe65Pm6o7ENMXsriWfj95DpGTjFPlzLP6LaumrDA1LNs0fMSAgMLzLJgCIfAEkRgixoqVxNrL6-9ZapjhVgtxvg9V25eu6DvFuGDUTXTFsQm4m-FudKMG90ncc71zK3z7TfntwfSyNf8A)

#### `?GS` — ハードウェアエンベロープの形

**形式:** `?GSshape[,1]  /  ?GS-` · **対象:** `PSG`

PSGのエンベロープを形0–15で使い、音ごとに再開します。,1は書き込みを遅らせます（コンパクト行）。?GS-で止めます。

```
MSXD ?EP2,129,115 ?GS8 ?GH0 ?GL40 v12 o3 c%32
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXs3YMtgISHAZDwMTFQKDM0Usg3VkhWNTYC6klTsoqO1VFKAVG1AA)

#### `?GH` — エンベロープ周期

**形式:** `?GHbyte  ?GLbyte` · **対象:** `PSG`

ハードウェアエンベロープ周期の上位・下位バイトを別々に設定します（?GLが下位）。

```
MSXD ?EP2,129,115 ?GS8 ?GH0 ?GL40 v12 o3 c%32
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyNcFOxdA4x0DI0sdQwNTRXs3YMtgISHAZDwMTFQKDM0Usg3VkhWNTYC6klTsoqO1VFKAVG1AA)

### SCC波形

#### `?WP` — 波形共有のポリシー

**形式:** `?WP0 / ?WP1 / ?WP2` · **対象:** `SCC`

SCCチャンネルが波形メモリを共有する方法です（通常のSCCはチャンネル4・5が1つを共有）。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 v12 @0 c%8 @1 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCoJAEH6VbaDbTOwsmSmIhkGnfsBEoToVHT2FF_Hd-0Z8gYLd_eb7Y5cdqKdUmTpKqTqfDqtjXRLTBzRv9j4bPIeI1wnHyoln9RtWjVkhapjROHTYCCEKzbPgFBCBJrDEImJZsZJYe54mzVyLWdxqIRrvHZ6g2SCJef_vHxfurcpy5_K2Vpc3F4_pqq7X4ArvnsutK3SCBT7qTentwfQyGL8)

#### `?WM` — 波形モーフィング

**形式:** `?WMwave,rate,1  /  ?WM-` · **対象:** `SCC`

コナミの波形モーフィングです。音が鳴る間、32個のサンプルを波形wave（0–63）から最大31バイトまで広がる間隔で読みます（rate 0–63が大きいほど速い）。そのため音はその後に定義した波形をたどっていきます。十分な効果にはそこから31個ほど波形を定義します。最後の波形を越えると最初の波形に戻って読みます。?WM-で止めます。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WM1,8,1 v12 @0 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCoJAEH6VbaDbTOwsqSmIhUEnKzBRqE5FR0_hRXz3vglfoGB35_tllx1poEyZesqoPh0Pq6opiekNWrR7n4-eQ8TrlBPl1LP6mFUTVoga5mkcOmyEEIXmWXAKiEATWGIRsaxYSaw9o69mrsUsbrUQTbceT9B8lNS8__ePC_fWZblzRdeoK9qzB7oYqpQ3rG7Q4LbePZYauwX-6kXZ9c70tDF9AA)

#### `?WI` — 波形補間

**形式:** `?WIa,b,c,d,e  /  ?WI-` · **対象:** `SCC`

2つの波形の間を補間しながら変えます（値5つ、コンパクト行）。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WI0,1,4,8,1 v12 @0 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVBLCsIwEL1KHHA3I5nQjy2UKhXEhR-opYK6Ulx2Jd2U3t030gsoJJn3GybJQD3lytRRTvXxsF3sm4qY3qBlu_HF4DnEHGWcKmee1SesmrJC1DBV49BhI4QoNM-CU0AEmsASi4hlxZrEuif01cy1mMWtLcTjrcMVtBgkM-___ePC3Lqq1q68NOrK9uSBzoZ2eD9HvGR1vQa38u4x18TN8F8vyq93pqeV8QM)

#### `?WF` — 波形プログラムのフラグ

**形式:** `?WFmask,value` · **対象:** `PSG`, `SCC`

波形プログラムのフラグ（0–7）を設定します。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
SCCA ?XU1 ?WP0 ?XT1 ?WF1,1 v12 @0 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY5LC4JQEIX_ym2g3UzMXFJRCAujVj3ARKFaFS1dhRvxv3cm3Nw5j-_AHWmgwph6Kqi-nI-rU1MR0xe2bPe6GZVjwuucM-Nc2TRls4wNocX5ukeOGhBQZMqCV2AEmaASR8RZ8ZH4elb_zFvHHPdZTKZHX1fVLpRdY6Fsrwp1c3UwtjBYDFsNr6WlYYEff6i4P5nefqYf)

#### `?WE` — エンベロープ段階ごとの波形

**形式:** `?WEa,b,c,d  /  ?WE-` · **対象:** `SCC`

エンベロープの段階に合わせて波形を変えます（波形番号4つ）。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 ?WE0,1,0,1 v12 @0 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znVDNCsIwDH6VGvCWSFPcxgajyhRP_sAcE9ST4nEn2WXs3f0iewGFtvn-QpsO1FOhTB0VVB8Pu8W-qYjpDRrbjS8HzyHhZc6Zcu5ZfcqqGStEDVM1Dh02QohC8yw4BUSgCSyxiFhWrEmse0JfzVyLWdzaQjLeOjxBy0Fy8_7fPy7cW1fV2sVLoy62Jw90NrTF_JhMXa_Brbx7zDV1M_zWi4rrnelpZfwA)

#### `?WG` — 静的波形アップロードのゲート

**形式:** `?WGsample  /  ?WG-` · **対象:** `SCC`

静的な波形アップロードの曲全体のポリシーです。?WP0のコンパクトSCC行で使います（sample 0–31）。?WG-で止めます。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
?WD1={-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,-96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96}
SCCA ?XU1 ?WP0 ?XT1 v12 @0 c%4 !
SCCE ?XU1 ?WG15 ?XT1 v12 @0 e%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=znZBNC8IwDIb_ShfYLZGmbM4OxpQpO_kBc0xQT34cd5Jdxv67yZgHjwptk7zv89LSHjpIGaGFFKr9rpxt6wIQXjLmzdpmvUUXY-QxYfQW2c6ROUEWkd1UdRZdbIEEFc0iyUkykGgkFilCypKGSNNTN2rqKqa4xlw8XFp5Amc9efX-3z8uubcqipXJTzWbvDlY6Y5sOnZmac0tjEwwEpsPUXL8hTzChQnkE5-Qnq8Idy3DGw)

### MSX-MUSIC

#### `?IR` — 内蔵音色

**形式:** `?IRn` · **対象:** `OPLL`

FM音色から最も近いものを選ぶ代わりに、YM2413の内蔵音色n（1–15）を直接選びます。?XU行では@nと同じです。

```
MSXA ?IR3 v12 o4 c%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyMcFew9g4wVygyNFPJNFJJVTRQUgZJpSlbRsTpKKSCqFgA)

#### `?IU` — ユーザー音色

**形式:** `?IUn` · **対象:** `OPLL`

?IUn={…}で定義したユーザー音色nを使います。?XU行でも使えます（そこでは?IU0は@0）。

```
?IU0={33,97,29,7,130,143,16,7}
MSXA ?IU0 ?EP2,129,115 v12 o4 g%12 r%4
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMNbKuNjXUszXWMLHXMdQyNDXQMTYx1DM10zGtj8nyDIxwVQIoU7F0DjHQMgWoMDU0VygyNFPJNFNJVgXSRqgnQsDQlq-hYHaUUEFULAA)

#### `?IS` — サステイン

**形式:** `?IS0 / ?IS1` · **対象:** `OPLL`

YM2413のサステインをオン（1）・オフ（0）にします。

```
MSXA ?IR3 ?IS1 v12 o4 c%8 d%8
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXJ9gyMcFew9g4yBRLChQpmhkUK-iUKyqoVCiqoFUE2aklV0rI5SCoiqBQA)

#### `?ID` — ドラムの打音

**形式:** `?IDmask,length  /  ?ID-,length` · **対象:** `MSXG`

mask（16バスドラム、8スネア、4タム、2トップシンバル、1ハイハットの和）のドラムを鳴らしてlength（1–16）待ちます。?ID-はリズムを止めて休みます。打音の時に、前に指定したキット（?IT）、v、?IBも反映されます。

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?IT` — ドラムキットを使う

**形式:** `?ITn[,bias]` · **対象:** `MSXG`

ドラムキットn（?ITn={…}）を選びます。bias（0–15）はハイハットを小さくします。

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0,1 v14 ?ID17,4 ?ID8,4 ?ID18,4 ?ID8,4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInY6hQpkhiOliaK4Dpi0glKEFgqsINDhNySo6VkcpBUTVAgA)

#### `?IB` — バスドラム設定

**形式:** `?IB` · **対象:** `MSXG`

引数のないドラム制御で、打音の前に書きます。

```
?IT0={224,4,190,3,5,1}
MSXG ?XU1 ?XT64 ?IT0 v14 ?IB ?ID1,4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPUMMbKuNjEx0THQMLQ10jHVMdQxrY_J8gyPcFewjQg2BRIiZiQJInUKZIYjhBMQuhjomCopAM9KUrKJjdZRSQFQtAA)

### 共有フレーズ

#### `?FD` — フレーズの定義

**形式:** `?FDn={ … ?FR}` · **対象:** `PSG`, `SCC`, `OPLL`

共有フレーズn（0–255）を定義します。普通はPSGS/SCCS/OPLS行に書き、?FRで戻ります。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD10={?EP2,129,115 ?FR}
MSXD ?XU1 ?XT1 ?FC10 v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLU9NC4JAEP0r20C32dhZNFOIPWh6siSThOpUdLRLeBH_e2_Cy5t9X8zsRCNlwjRQRu3pWG3qLiemL2i4Fm4_OfYxRyknwqljcVsWSVggil-mcuiwEUIUmmMLtCAWmoVlNWI1a7Vktb28_pq6GtO41nw834emrVoTykJwSDg0HvtS7IuhnWHXbV-Y0HcCuADKXJwZxZtPZJ7rnVnhJ2_Kbg-ml475Bw)

#### `?FC` — フレーズを呼ぶ

**形式:** `?FCn` · **対象:** `PSG`, `SCC`, `OPLL`

フレーズnを演奏して戻ります。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FC1 ?FC1 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JADIX_ytnErWeuFxAhIQygTCjxJJKok8YRF8NC-O--qstr-_q9pJ1opEyYBsooHPb1qulKYnpjLM6VyyfHPuYo5UQ4dSxuzSIJC0zx_6ozfKwBAYXn2EItBgvPYmUVscpaDVlN_7uvp1vFFNeYj-fr0IY6mGJXST7dlxt0R5hN6CtT9J1ATpBt63FHijtiM4o3rwhgKT9Z4JknZZcb00PL_AE)

#### `?FR` — 戻る

**形式:** `?FR` · **対象:** `PSG`, `SCC`, `OPLL`

フレーズを終えて呼んだ所へ戻ります。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FC1 ?FC1 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY8xD4JADIX_ytnErWeuFxAhIQygTCjxJJKok8YRF8NC-O--qstr-_q9pJ1opEyYBsooHPb1qulKYnpjLM6VyyfHPuYo5UQ4dSxuzSIJC0zx_6ozfKwBAYXn2EItBgvPYmUVscpaDVlN_7uvp1vFFNeYj-fr0IY6mGJXST7dlxt0R5hN6CtT9J1ATpBt63FHijtiM4o3rwhgKT9Z4JknZZcb00PL_AE)

#### `?FJ` — フレーズへジャンプ

**形式:** `?FJn` · **対象:** `PSG`, `SCC`, `OPLL`

戻らずにラベルn（フレーズnか:n）へ続けます。チャンネルがすでに通った所へ飛ぶと、それがループになります。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 e%8 !}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 g%8 ?FJ1
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY9PC4JAEMW_yjbQbTZ2Fs0UxEOmEFiCSUJ16t_NLuFF_O69CQ_7Zua938DsSAMlwtRTQs3xUK6qdktMX4zZOXfp6NiHHMQcCceOxa1ZJGKBKX6uOsNHDAgoPMcWajFYeBaRVcQqa3XJ6vbc_T1NFVNc13w4Xfu6KRuTFbmk4325MU-8Beyq6XKTda1ATpBd7XFJjEtCM4g3n8C8gWbFXvCXFyWXG9NDy_QD)

#### `?FB` — 繰り返し

**形式:** `?FB0 … ?FBcount  /  ?FBcount,label` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

?FB0で位置を示し、?FBcountはその間を全部でcount回演奏するまでそこへ戻ります。?FBcount,nはラベルn（:nかフレーズn）へ同じことをします。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?FD1={c%8 e%8 ?FR}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 ?FB0 ?FC1 ?FB2 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY9PC4JAEMW_yjbQbTZ2Fs0UREjTkyWZJFSn_hztEl7E796b6LBvZt77DcxONFIiTAMl1B721arucmL6YMzOhUsnxz7kIOZIOHYsbs0iEQtM8f-qM3zEgIDCc2yhFoOFZxFZRayyVpesbv-7n6epYorrmg_n69C0VWuyspB0ui835omXlUcEddsXJus7gZwgu8bjlhi3hGYUb94BwK2D5KKdNwv86kXJ5cb00DJ_AQ)

#### `:` — ラベル

**形式:** `:n` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

ラベルnで、?FJnと?FBcount,nの行き先です。フレーズ番号（?FDn）もラベルです。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU4 ?XT1 ?EP2,129,115 v12 o4 c%16 :1 d%16 ?FB3,1 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY_NCsJADIRfJQa8JbJZ-0MXZEGrnqpCLRbUk8VjvUgvpe9uIr1kdma-EHbEAYMQ9hiwPp-Oq6rZIeFXbbyVbjM68iklBeVChSNxGYnkJBqKn9W85lorpKhmjlgnq2HNWCs2hI1lW2Lbnl__zFrDDLc1n06PvqrbEmLbJDquAnF_8Xqy0JMpDOLhk8BrKRkEgc40HrZrEljoD94Y7k_CzmT6AQ)

### エフェクトとプログラム

#### `?XD` — エフェクトの定義

**形式:** `?XDn={ … }` · **対象:** `PSG`, `SCC`, `OPLL`

共有エフェクトn（0–9）を定義します。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
PSGS ?XD1={c%8 !}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY_BCoJAEIZfZRvoNhM7i2YK4iHDkyWYJFSnoqNdwov47v0jXmZ2vvl-mJ1opEyZBsqovZyrXd0diemHsbiVPp88h5ijlBPl1LP6PasmrIAa1m4zONaQoIJ5FlTBIGCClZgi5oqFxNLra2G2Nc10i4V4fgxNW7Wu6EvNp9f24DZAdduXQJ2iXFFOTcAVKa6I3ajBfSO3qPjEh7L7k-ltbf4D)

#### `?XM` — エフェクトのモード

**形式:** `?XMmode[,value]` · **対象:** `PSG`, `SCC`

エフェクトやリテラル（?XT2）トラックの段階が変えるもの: 0 オフ、1 音、2 音程、3 レベルです。valueは各段階が何ティック続くかです（?XM0なら次の?XSの値）。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XP` — プログラムの段階

**形式:** `?XPperiod,level[,1]` · **対象:** `PSG`, `SCC`

楽器プログラムの1段階で、周期（0–4095）とレベル（0–15）です。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XI` — 音程の段階の大きさ

**形式:** `?XI0 / ?XI1 / ?XI2` · **対象:** `PSG`, `SCC`

エフェクトの音程段階をバイト（0）、ワード（1）、上位バイト（2）から選びます（コンパクト行）。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?XI1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SztNYuSA9WxENVqKUF9aR4rBfppfTfnUgvk53JG7IjDRSVqadI9fl0WFXNjpi-sEVb-u3oOaSc5Jwp557Vr1k1Y0WoYZ7mkWMNCCgyzwIVGEEmWIkhYqxYSaw9v_6ZbQ0z3Gohne59VXelK7pGIVeTI2R_Cbib427qBg3uk7jncuMW-Pab4u3B9LIx_QA)

#### `?XS` — リテラルの段階

**形式:** `?XSbyte` · **対象:** `PSG`, `SCC`

楽譜のバイト1つです（0–207、よく$16進数）。?XT2トラックやエフェクトでは?XMの長さだけ続く段階で（?XM0の後ならその値自体: ?XM0 ?XS$6Dは109ティック待つ）、?XT1トラックでは音（音程×16 + 長さ−1）です。コンパクト行。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?XS2 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SzdK0tyB6seKoKtVhQT4rHepFeSv_difSS7My8ITvSQKUy9VRSczoeVnW7I6YvZLpWfjt6DpGzgnPlwrP6NavmrDA1zNs0fMSAgMLzLJgCIfAEkRgixoqVxNrz6-9ZapjhVgtxuvd101Uuda1iXGw0waX9OeBugbvRDRrcJ3PP5cYt8O03lbcH08vW9AM)

#### `?XT` — トラックの種類

**形式:** `?XTn[,mode]` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

トラックの種類です。1 音符（PSG/SCCとOPLL旋律）、2 PSG/SCCのリテラル段階（?XS、?XP）、4 ?XDエフェクトを始める音符（c = ?XD0、c+ = ?XD1 …）、MSXGは64、0は保存されたOPLLの状態を消します。?XT4と?XT64のトラックではrは何も始めない休符です。PSG/SCCでは,1で直接変え、,2は休んでいる音の位相も保ちます。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?EP2,129,115 v12 o4 c%8 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY7BCsJADER_ZQ14S2SztNZdkB6seKoKtVhQT4rHepFeSv_difSS7My8ITvSQEmZekrUnI6HVd3uiOkLWV4rvx09h5yzyIVy9Kx-zaoFK0wN8zYNHzEgoPA8C6ZACDxBJIaIsWIlsfb8-nuWGma41UI-3fu66SpXdq1iXDD254CTESdzN2hwn8w9lxu3wI_flG4Pppet6Qc)

#### `?IM` — 楽器プログラムを使う

**形式:** `?IMn  /  ?IM-` · **対象:** `PSG`, `SCC`

プログラム表n（?IMn={…}）を通して音を出します。プログラムは音ごとに固定されます。?IM-で止めます。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XH` — エフェクトの保持

**形式:** `?XH0 / ?XH1` · **対象:** `PSG`, `SCC`

進行中のエフェクトプログラムを次の音まで続けるか（1）否か（0）を決めます。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 ?XH0 v12 o4 c%2 ?XR c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1QCEPA4UyoNp8E4VkVaCWiCAI7emrC-Q4KxSpmigoAh2WpmQVHaujlAKiagE)

#### `?XC` — エフェクトの取り消し

**形式:** `?XC  /  ?XCmask,1 !` · **対象:** `PSG`, `SCC`

進行中のプログラムを取り消します。!の直前の?XCmask,1はチャンネルのまとまりを一緒に終えます。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 v12 o4 c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1CmVAZfkmCsmqRiC-LlCJs0KRqomCItAtaUpW0bE6SikgqhYA)

#### `?XR` — エフェクトの再開

**形式:** `?XR` · **対象:** `PSG`, `SCC`

進行中のプログラムを最初から始め直します。

```
?IM0={10,10,10,10,10,10,10,10,10,10,10,10}
PSGS ?FD10={?XM2,1 ?XP384,12 ?FR}
MSXD ?XU1 ?XT1 ?MV0,$11 ?IM0 ?XH0 v12 o4 c%2 ?XR c%2 ?IM- ?XC r%4 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zq1YqU7Iy1FHKU7JSCvb3c9fzDXVW0lEqAXLtPX0NbKsNDXQIodqYvIBg92AFezcXQ6AO-whfIx1DBfuIAGMLEx1DI6B4EFCJb3CEC1AwFCQTAiR8wwx0VAyBDKA1QCEPA4UyoNp8E4VkVaCWiCAI7emrC-Q4KxSpmigoAh2WpmQVHaujlAKiagE)

#### `?VF` — 全体フェード

**形式:** `?VFprofile,interval,step,target  /  ?VF-` · **対象:** `PSG`, `SCC`, `OPLL`, `MSXG`

MSXチャンネル全体をフェードします。profile 0–1、intervalごとにstep（1–15）ずつtargetレベル（0–15）まで。?VF-で取り消します。

```
?WD0={0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,-25,-49,-71,-90,-106,-117,-125,-127,-125,-117,-106,-90,-71,-49,-25}
MSXD ?XU1 ?XT1 ?EP2,129,115 ?VF0,4,1,0 v12 o4 c%16 c%16 !
```

[▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/#s=zLY-9CsJAEIRf5Vyw25XbIz8kICmMWkWFGBNQK8UyNpIm5N2d1TSzN7PfsNxIA-XK1FNO9fGwX1XNhpg-sEVb-vXoOcQcZZwqZ57VJ6yasiLUME_zyLEGBBSZZ4EKjCATrMQQMVasJNaeX7_MtoYZbrUQT7e-qrvSFV2jkDNkewo4meFk7IrLznPEyt4NGtw7co-lJn9Z4Asvyq93pqeN6Qs)

## このコマンドで書いた曲

次のリポジトリーのサンプルは、すべてチップ拡張コマンドで書かれています。リンクを押すとMUCPlaygroundでオシロスコープと一緒に開きます。

- **[Gradius 2 — A Planet of Plants (Plant Planet Theme)](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/Gradius2/A%20Planet%20of%20Plants%20%28Plant%20Planet%20Theme%29.MUC)** — SCC + PSG、`#sccvoice GRA2.DAT`の波形、?XDドラムエフェクト · [▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/Gradius2&song=A%20Planet%20of%20Plants%20%28Plant%20Planet%20Theme%29.MUC&view=scope)
- **[F-1 Spirit 3D Special — 01 Is it Domingo Today](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/F-1_Spirit_3D_Special/01%20Is%20it%20Domingo%20Today.MUC)** — MSX-MUSICの旋律と?ITキットを使うMSXGドラム · [▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/F-1_Spirit_3D_Special&song=01%20Is%20it%20Domingo%20Today.MUC&view=scope)
- **[Space Manbow — 03 Battle Ship (1st.BGM)](../Samples/Muc/MucoMSXChipExtension%28msPb%29Format/SpaceManbow/03%20Battle%20Ship%20%281st.BGM%29.MUC)** — ?WDで定義したSCC波形、PSGと?XD効果音 · [▶ MUCPlaygroundで開く](https://toughkiddev.github.io/MUCOMSX/MUCPlayground/?playlist=Muc/MucoMSXChipExtension%28msPb%29Format/SpaceManbow&song=03%20Battle%20Ship%20%281st.BGM%29.MUC&view=scope)

全体: [`Samples/Muc/MucoMSXChipExtension(msPb)Format`](../Samples/Muc/MucoMSXChipExtension(msPb)Format)。MUCScopeとMUBScopeのパッケージには、この3曲がmsPbサンプル（MUCとコンパイル済みMUB）として入っています。

## 動画

再生リスト **[MucoMSX (Mucom88 for MSX)](https://www.youtube.com/playlist?list=PLC9BqxYlA7js)** で、MSX実機のツールチェーンとプレイヤー、このコマンドで書いた曲を見られます。

| | |
|---|---|
| [![MUCEdit — MSXで編集とコンパイル](https://img.youtube.com/vi/Wq0RhtrQlBE/mqdefault.jpg)](https://www.youtube.com/watch?v=Wq0RhtrQlBE) | **[MUCEdit — MSXで編集とコンパイル](https://www.youtube.com/watch?v=Wq0RhtrQlBE)** |
| [![MUCScope — MUCをコンパイルして画面と一緒に演奏](https://img.youtube.com/vi/CJvW9Itukdw/mqdefault.jpg)](https://www.youtube.com/watch?v=CJvW9Itukdw) | **[MUCScope — MUCをコンパイルして画面と一緒に演奏](https://www.youtube.com/watch?v=CJvW9Itukdw)** |
| [![MUBScope — ビジュアル音楽プレイヤー](https://img.youtube.com/vi/Xk4awiKuZGc/mqdefault.jpg)](https://www.youtube.com/watch?v=Xk4awiKuZGc) | **[MUBScope — ビジュアル音楽プレイヤー](https://www.youtube.com/watch?v=Xk4awiKuZGc)** |
| [![MUBPlay — 完成したMUBの演奏](https://img.youtube.com/vi/jpkDOpuv0Ig/mqdefault.jpg)](https://www.youtube.com/watch?v=jpkDOpuv0Ig) | **[MUBPlay — 完成したMUBの演奏](https://www.youtube.com/watch?v=jpkDOpuv0Ig)** |

## 以前の形式とツールチェーンの全仕様

以前のMSX曲は1文字の`?`形式（`?p`、`?r`、`?j`、`?PN{…}`、`?RN{…}`、`?n`、`?s`、`?H`、`?L` …）と、*MSXチャンネルのMUCOM88互換コマンド*のコマンドを使います。今もコンパイルできますが、新しい曲はこのページの2文字コマンドで書くことをおすすめします。

以前の形式とpacked形式の詳細まで含むツールチェーンの全仕様は、MucoMSXドキュメントパッケージの`docs/MSX_MML_JA.TXT`（英語`_EN`、韓国語`_KO`）、`docs/PACKED_NOTES.TXT`、`docs/OPLL_NATIVE.TXT`です。MSXチップの対象は[`shared/docs/MSX_TARGETS.ja.md`](../shared/docs/MSX_TARGETS.ja.md)、SCC制御は[`shared/docs/SCC_CONTROL.ja.md`](../shared/docs/SCC_CONTROL.ja.md)にあります。
