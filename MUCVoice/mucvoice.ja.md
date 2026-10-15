# MUCVOICE v0.5beta — MSX音色エディタ

[한국어](mucvoice.md) · [English](mucvoice.en.md)

MUCVOICE v0.5betaはMUCEDIT・MUCPLAY・MUC2MUB・MUBPLAYと同じツールチェーンZIPに含まれます。実行ファイルZIPの`MUCVOICE/START.MD`にクイックガイド、別の多言語ドキュメントZIPに全説明書があります。[変更点](../shared/docs/RELEASE_UPDATE_261013.ja.md)も参照してください。

MSX-DOS2/NextorのScreen 2でYM2608 FM・SCC/SCC+音色を編集します。512KiBマッパー環境を推奨します。FM試聴はMAKOTO、SCC試聴はSCC/SCC+が必要です。`MUCVOICE /TEXT`で数値型画面を使えます。

## 最初の操作

1. `MUCVOICE.COM`・`FMVOICE.DAT`・`SCCVOICE.DAT`・`INIT.TFI`をSDの同じフォルダーへ。ROMやDOS/Nextorシステムは含みません。
2. `MUCVOICE`を起動し`P`で現在のFM/SCCプリセットを開きます。
3. 矢印で選択。SCCは32サンプル波形、FMはエンベロープ/パラメータ図です。FM図は実際の合成音声波形ではありません。
4. Spaceまたは`C D E F G A B`でC4–B4を試聴、Shiftで上オクターブ。Enter適用、Escは適用せず戻ります。
5. 数値位置で直接入力。Tab確定/次、Esc入力取消。矢印保持は徐々に加速しShiftは1刻みです。
6. `K`で鍵盤モード、`S`保存、`Q`/Ctrl+Q終了。他バンクの未保存状態も確認してください。

## ファイルと入出力

`O`/Ctrl+Oでブラウザを開き、上下でファイル、左右でファイル内音色、Tabで非空/全スロットを切り替えます。適用前に図・音を確認できます。移動・取消・終了で発音を停止し、試聴だけではユーザーバンクやUndoを変更しません。

**ブラウザのEnterは表示中の1音色ではなくDATバンク全体を読み込みます。** 未保存破棄の確認・再検証後に置換するので先に保存してください。フォルダーはEnter、上位はBackspaceです。DOS作業ディレクトリは変えません。読込み後の保存では名前を再入力し、元ファイルを直ちに上書きしません。`P`で1スロットへ適用する操作とは異なります。

DAT・TFI FM・MUC内FM/SCC定義・VGMのYM2608 FM/SCC/SCC+を取り込めます。VGZはPCでVGMへ解凍します。DACストリーム制御など非対応命令は安全に拒否します。VGM抽出FMは記録されたレジスタ状態であり、元楽譜の名前・意図を復元しません。

DAT・インラインMUCへ保存して曲で使用し、単音VGMも出力できます。項目の詳細は`TFI.txt`・`MUCIO.txt`・`VGMIO.txt`へ。WAV→ADPCMバンク作成は未対応です。曲全体はMUCEDIT/MUCPLAY/MUBPLAYを使ってください。

## 保存とプリセット

保存名を再利用し、FM/SCCの未保存・Undoを分離します。SCC保存でFM Undoは消えません。不在ファイル/既存ファイル保護のエラーを区別します。原本をバックアップし保存後の再読込みも確認してください。

FM12種・SCC32種は独自合成プリセットです。取り込む音色の利用条件を確認してください。

## 詳細説明書

[日本語の詳細ユーザーガイド](docs/MANUALJA.md)と[英語版](docs/MANUALEN.md)を用意しています。編集、鍵盤配列、プリセット、DATブラウザ、TFI/MUC/VGM取込み、出力、保存、問題への対処を説明しています。

ZIPの`README.TXT`・`QUICK.TXT`・`KEYBOARD.txt`・`PRESETS.TXT`・`TFI.txt`・`MUCIO.txt`・`VGMIO.txt`・`USABILITY.txt`が原本です。[個別文書](docs/)にも保存します。出典は`NOTICE.TXT` / `LICENSES/`へ。

試聴は単音でFMはMAKOTO、SCCは検出カートリッジを使います。他の音楽と同時実行しないでください。プレビューはバンク/Undoを保持しますがEnter読込みはDAT全体を置換します。
