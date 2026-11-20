# MUCVIEW 説明書

MUCソースをMSXで開いて読み、その場でコンパイル・演奏・MUB書き出しを行うビューア

作成基準: 2026年11月21日 · MUCVIEW v0.2

---

## 1. MUCVIEWとは

MUCVIEWはMUCファイルを読み取り専用で開くプログラムです。読んでいる位置からF1メニューでMUCPLAYを呼び出し、コンパイル、演奏、MUBへの書き出しができます。終わると、見ていた行へ戻ります。

MUCEDITから編集機能を除いた別のプログラムです。文書を変更しないので保存するものがなく、ディスクに状態ファイルも一時ファイルも書きません。曲を直すときはMUCEDITを使ってください。

次のようなときに便利です。

- 受け取った曲の内容をざっと見て、すぐ聴きたいとき
- ファイルマネージャ(MM)でMUCファイルを選び、RETURNで開くとき
- 空き容量のないディスクの曲を聴くとき

## 2. 動作環境

- MSX2以上(80桁画面)、MSX-DOS 2またはNextor
- メモリマッパーの空きセグメント4個(64KiB、文書用)。ファイル一覧にもう1個(16KiB)使い、なければファイル名を直接入力します。
- コンパイル・演奏・書き出しには、同じリリースの`MUCPLAY.COM`と`MUCPLAY.MXR`が必要です。作業フォルダ、MUCVIEWのあるフォルダ、PATHの順に探します。
- 音を出すにはMUCPLAYと同じ音源構成(Makotoなど)が必要です。詳しくはMUCPLAYの説明書を見てください。

コンパイルと演奏に必要なマッパーメモリは、MUCPLAYをプロンプトから実行するときと同じです。MUCVIEWはMUCPLAYを呼ぶ前に自分が使っていたメモリをすべて返し、戻ってから文書を読み直します。

MSX1には80桁画面がないので使えません。`MUCVIEW: MSX2 required.`と表示して終わります。MSX1でMUCを演奏するには`MUCPLAY SONG.MUC`を使ってください。

## 3. 実行

```text
MUCVIEW            ファイル一覧から選びます
MUCVIEW SONG.MUC   そのファイルを開きます (なければ知らせてからファイル一覧)
```

コンパイル・演奏・書き出しをするには、**曲のあるフォルダで**実行し、**ファイル名だけ**を指定してください(パスと空白なしで24文字まで)。曲が使う音色・PCMファイルを作業フォルダから探すためです。パスを付けて開いたファイルは読めますが、コンパイルしようとすると次の案内が出ます。

```text
Compile: local name, no spaces. Start in song folder.
```

`MUCVIEW.COM`はPATHの通った場所に置き、曲のフォルダへ移動して実行する方法をおすすめします。

## 4. 画面

```text
MUCView v0.2 by ToughkidCST  |  SONG.MUC
(文書22行)
F1 Commands  Ctrl+O Open  Ctrl+F Find  F3 Find next
```

いちばん上の行にファイル名、中央の22行に文書、いちばん下の行にキーの案内が出ます。案内やエラーの文もいちばん下の行に出て、` Press a key.`の付いた文は何かキーを押すと消えます。

## 5. キー

| キー | 動作 |
| --- | --- |
| カーソルキー | カーソル移動 |
| Ctrl+←、Ctrl+→ | 単語単位で移動 |
| HOME / SELECT | 行の先頭 / 末尾 |
| Ctrl+HOME / Ctrl+SELECT | 文書の先頭 / 末尾 |
| Ctrl+F | 検索(探す文字列を入力) |
| F3 | 次を検索 |
| Esc | 見つけた場所の表示(`[FOUND]`)を解除 |
| Ctrl+O | ファイル一覧 |
| F1 | コマンドメニュー |

探す文字列がなければ`Text not found.`と表示します。

### ファイル一覧

作業フォルダの`*.MUC`を表示します。

| キー | 動作 |
| --- | --- |
| ↑ ↓ | 選ぶ |
| Ctrl+↑、Ctrl+↓ | ページ送り |
| RETURN | 開く |
| Esc | 取り消し |
| 文字入力 | 下の`File:`行にファイル名を直接入力 |

MUCファイルがなければ`No MUC files. Type a filename below.`と表示します。

## 6. コマンドメニュー (F1)

F1を押すと下の2行が出て、続けて押したキーでコマンドを選びます。Escなど他のキーを押すと取り消しです。

```text
Q Quit          O Reload
1 Open/MUC      2 Compile    3 Play/Muc                4 Exp/MUB
```

| キー | 動作 |
| --- | --- |
| `1` | ファイルを開く(ファイル一覧) |
| `2` | コンパイル。MUCPLAYが結果やエラーを表示し、キーを押すと見ていた位置へ戻ります。コンパイル結果はメモリに残ります。 |
| `3` | 演奏。コンパイル済みの文書はその結果をすぐ演奏し、そうでなければコンパイルと演奏を一度に行います。何かキーを押すと止まって戻ります。 |
| `4` | MUB書き出し。先に`2`でコンパイルしてください。PCMをMUBに入れるか尋ねます。 |
| `O` | 読み直し。ディスクのファイルを読み直します(コンパイル結果との結び付きは切れます)。 |
| `Q` | 終了。メモリに残ったコンパイル結果を解放してDOSへ戻ります。 |

### コンパイル (`2`)

画面がMUCPLAYに切り替わり、コンパイルの過程と結果が表示されます。エラーがあれば、MUCPLAYのエラー文と行番号が出ます。文の意味はMUCPLAYの説明書とMUC2MUBの説明書にあります。

```text
Press a key to return.
```

キーを押すとMUCVIEWへ戻り、見ていた行、カーソル、検索文字列がそのまま復元されます。

### 演奏 (`3`)

- `2`でコンパイルした文書: メモリのコンパイル結果をすぐ演奏します。
- コンパイルしていない文書: コンパイルと演奏を一度に行います。この場合はコンパイル結果をメモリに残さないので、書き出すなら先に`2`を実行してください。

曲を2周演奏すると自動的に終わり、その前に何かキーを押すと止まります。どちらの場合も見ていた位置へ戻ります。

### MUB書き出し (`4`)

```text
Include the PCM file in the MUB? (Y/N)
```

`Y`は`#pcm`ファイルをMUBの中に入れ(MUCPLAYの`/P`)、`N`やEscは入れません。入れなかったMUBは、演奏するときにMUBと同じフォルダの`#pcm`ファイルを読みます。出力ファイルは、作業フォルダに文書と同じ名前の`.MUB`として作られます。

コンパイルしていない文書では`Compile this text first: F1 then 2.`と表示します。

## 7. MM(Multi Mente)から開く

MMの`MMRET.DAT`に次の行を入れると、MUCファイルでRETURNを押してMUCVIEWで開けます(`<TAB>`はタブ文字)。

```text
.MUC<TAB>MUCVIEW $C
```

ビューアが開いたら、F1 `3`で演奏し、F1 `Q`で終わるとMMへ戻ります。

RETURNですぐ演奏するだけでよければ、これまでどおり`.MUC<TAB>MUCPLAY $C`を使ってください。`.MUC`にはどちらか一方だけを結び付けます。

`MUCVIEW.COM`、`MUCPLAY.COM`、`MUCPLAY.MXR`は、PATHの通ったフォルダに一緒に置いてください。

## 8. ディスクとメモリに残すもの

- **ディスク:** MUCVIEWは何も書きません。`4`で書き出した`.MUB`だけができます。空き容量のないディスクでも、開く・コンパイル・演奏ができます(書き出しには空きが必要です)。
- **DOSの環境変数:** MUCPLAYへ行っている間、見ていた位置と検索文字列を`MUCVIEW`、`MUCVIEWF`に入れ、戻ってから消します。環境変数の領域が足りないと`No room in the DOS environment.`と表示し、MUCPLAYを呼びません。
- **メモリ:** `2`でコンパイルした結果はMUCPLAYのセッションとしてメモリに残り、`Q`で終わるときに解放します。MUCVIEWを起動する前にプロンプトで作ったMUCPLAYのセッションがあれば、それも終了時に一緒に解放します。

## 9. CPU速度

実行中は高速CPUで動きます。Panasonic MSX2+では5.37MHz、Z80モードのturbo RではR800、One Chip MSXでは8.06MHzです。終了するときやMUCPLAYを呼ぶときに元へ戻します。すでに高速な状態だった場合はそのままにします。

## 10. メッセージ

| メッセージ | 意味と対処 |
| --- | --- |
| `MSX-DOS2 required.` | MSX-DOS 1では動きません。 |
| `MUCVIEW: MSX2 required.` | MSX1では使えません。演奏は`MUCPLAY SONG.MUC`で行ってください。 |
| `MUCVIEW needs four free mapper banks (64 KiB).` | 空きマッパーセグメントが4個より少ない状態です。メモリを使っている他のプログラムやMUCPLAYのセッション(`MUCPLAY /RELEASE`)を片付けてください。 |
| `MUCVIEW needs more free TPA memory.` | 常駐プログラムがTPAを多く使っています。常駐プログラムを外して実行し直してください。 |
| `Open failed.` | ファイルを開けませんでした。名前とフォルダを確認してください。 |
| `Text exceeds 60000 bytes; not loaded.` | 文書が改行整理後に60,000バイトを超えています。以前の文書はそのままです。 |
| `Need 64 KiB free mapper RAM to load.` | 文書を読むメモリが足りません。 |
| `Open a MUC file first.` | 文書を開かずにコンパイル・演奏を選びました。 |
| `Compile this text first: F1 then 2.` | コンパイルせずに書き出しを選びました。 |
| `Compile: local name, no spaces. Start in song folder.` | パスが付いている、空白がある、または24文字を超える名前です。曲のフォルダでファイル名だけを指定して開いてください。 |
| `MUCPLAY.COM not found.` | 作業フォルダ、MUCVIEWのフォルダ、PATHにMUCPLAYがありません。 |
| `Use the matching /E3 MUCPLAY.COM.` | MUCPLAYの世代が違います。同じリリースのMUCPLAY・MUCVIEWを一緒に使ってください。 |
| `MUCVIEW.COM must be in this folder or on the PATH.` | MUCPLAYが戻る先のMUCVIEWを見つけられません。 |
| `No room in the DOS environment.` | 見ていた位置を渡す環境変数の領域がありません。使わない環境変数を消してください。 |

## 11. 制限

- 文書は改行整理後60,000バイトまでです。
- 編集・保存・元に戻す・クリップボードはありません。
- ページ送りのキーはありません。遠くへ移動するときはCtrl+HOME/SELECTと検索を使ってください。
- MUCPLAY・MUCEDIT・MUCVIEWは同じリリースのものを使ってください。
