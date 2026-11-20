# MUCView

Read-only MUC viewer for MSX2 and later: it opens a `.MUC` on the 80-column screen and, from its F1 menu, compiles, plays and exports the song to MUB through MUCPLAY.
MSX에서 `.MUC`를 열어 보고, F1 메뉴에서 MUCPLAY를 불러 컴파일·연주·MUB 내보내기를 하는 읽기 전용 뷰어입니다(MSX2 이상).
MSX上で`.MUC`を開いて読み、F1メニューからMUCPLAYを呼んでコンパイル・演奏・MUB書き出しを行う読み取り専用ビューアです（MSX2以降）。

| Manual | |
|---|---|
| 한국어 | [MUCView.md](MUCView.md) |
| English | [MUCViewE.md](MUCViewE.md) |
| 日本語 | [MUCViewJ.md](MUCViewJ.md) |

- No editing and nothing to save: MUCVIEW writes no state file and no temporary file. Only a MUB exported from its menu appears on the disk. To change a song, use [MUCEdit](../MUCEdit/MUCEditE.md).
- Compiling, playing and exporting need `MUCPLAY.COM` and `MUCPLAY.MXR` of the same release.
- From a file manager such as MM (Multi Mente), a `.MUC` can be opened in the viewer with RETURN; the manual shows the line for `MMRET.DAT`.

`MUCVIEW.COM` is part of the toolchain package from the packages dated 2026-11-21. See also the [project README](../README.md).
