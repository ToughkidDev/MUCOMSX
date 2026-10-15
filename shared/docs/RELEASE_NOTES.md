# MUCOMSX 변경 내역

[한국어 업데이트 안내](RELEASE_UPDATE_261013.md) · [English](RELEASE_UPDATE_261013.en.md) · [日本語](RELEASE_UPDATE_261013.ja.md)

## v0.81-beta 이후 추가·수정

- SCC/SCC+ SSG 확장: `#SSGExtend On/Off`, `@I0..9`, `@W0..255`, `peL,R`. D/E/F의 톤을 SCC/SCC+로 근사하며 노이즈·하드웨어 엔벌로프는 MAKOTO를 사용합니다.
- msPb0101: SSG 확장과 네이티브 혼합을 식별합니다. 기존 MUB8·muPb·msPb0100도 지원합니다.
- 일반 SCC 지원: SCC+ 우선 자동 탐색 후 일반 SCC로 대체합니다. 공통 SCC VGM 출력을 지원합니다.
- `#PCMInvert On/Off`: K의 상대 옥타브 방향을 컴파일 단계에서 변경합니다. PCM 바이트를 변환하지 않습니다.
- 컴파일 최적화: 빈 페이지 검색 생략, 활성 행 검색 범위 축소, 매크로 색인·복사와 청크 저장 개선. 최소 512KiB 매퍼 조건은 유지합니다.
- 리듬 수정: `#OPNA1RhythmMute`가 음악 DATA를 비우던 결함과 MUCPLAY/MUCEDIT 세션의 마스크 복원을 수정했습니다. 영향 받은 MUB는 원본에서 다시 컴파일하세요.
- MUCVOICE v0.5beta: Screen 2 FM·SCC/SCC+ 음색 편집, DAT/TFI/MUC/VGM 입출력, 기본 프리셋과 건반 미리 듣기를 제공합니다. 기존 네 도구와 같은 툴체인 ZIP에 포함되며, 전체 다국어 설명서는 별도 문서 ZIP에 있습니다.

## 기존 기능

v0.81-beta는 일반 다중 페이지, 120KiB 음악 DATA, FM3 독립 슬롯, 확장 매크로·분기·vm3 생략, 리듬 자동 팬, MIDI식/ADPCM 포르타멘토와 음정 LFO를 포함합니다. MSX-MUSIC·내부 PSG·msPb0100, 연주 CPU 자동 가속과 `/N`도 포함합니다.

## CPU 가속 사용법

MUCPLAY·MUBPLAY는 지원 하드웨어에서 **연주 중에만** 자동 가속합니다. 지원 Panasonic MSX2+는 5.37MHz Z80, turbo R은 Z80에서 들어온 경우 R800 ROM을 선택합니다. 이미 사용 중인 R800 모드는 유지하며 정상 종료·사용자 중단·처리 가능한 오류 후에는 원래 CPU 모드로 돌아갑니다.

```dos
MUCPLAY SONG.MUC /N
MUCPLAY /PLAY /N
MUBPLAY SONG.MUB /N
```

`/N`은 자동 전환을 끄고 현재 CPU 모드를 유지합니다. R800을 Z80으로 강제 바꾸는 옵션은 아닙니다. 적재·컴파일·VGM 출력은 자동 가속 대상이 아닙니다.

## 용량과 호환성

MUC 입력은 65,536바이트, MUCEDIT는 정규화 후 60,000바이트, 음악 DATA는 구조·음색을 포함해 122,880바이트입니다. 페이지 스트림은 OPNA 59,546바이트, 네이티브 MSX 59,106바이트입니다. MUB 헤더·태그·PCM은 별도입니다.

512KiB는 모든 최대 크기 문서와 세션의 동시 유지 보장이 아닙니다. 큰 세션 때문에 새 문서 적재에 필요한 여유가 부족하면 작업을 저장하고 세션을 해제하거나 정상 종료하세요. 여러 페이지는 물리 채널을 공유합니다. 중첩 파트 분기, 추가 OPNA/OPNB/OPM, `@M`, `PCn`, `#@pcm`의 WAV 변환은 미지원입니다.

SCC/PSG/YM2413는 근사 변환이며 PC 가상 SSG나 YM2608과 음향적으로 동일하지 않습니다. CPU 가속도 모든 고부하 곡의 틱 처리 시간을 보장하지 않습니다.

## English

New since v0.81: SCC/SCC+ SSG/msPb0101, PCMInvert, compiler optimizations, rhythm-mute/session fixes and MUCVOICE v0.5beta. MUCVOICE is included with the four original tools in the toolchain ZIP; complete multilingual manuals are in the separate documentation ZIP. Native MSX targets and playback CPU acceleration were already included in v0.81. Recompile affected rhythm-mute MUBs; replacing a player cannot recover missing DATA.

Automatic acceleration is playback-only. `/N` keeps the current CPU; it does not force Z80. Editor/source/DATA limits remain 60,000 / 65,536 / 122,880 bytes. 512KiB does not guarantee every simultaneous maximum-size session. Read the [update guide](RELEASE_UPDATE_261013.en.md) for compatibility and safe replacement.

## 日本語

v0.81後の追加はSCC/SCC+ SSG/msPb0101、PCMInvert、コンパイル最適化、リズム/セッション修正、MUCVOICE v0.5betaです。MUCVOICEは従来の4ツールと同じツールチェーンZIPに含まれ、完全な多言語マニュアルは別の文書ZIPに収録されています。MSX対象・演奏CPU高速化はv0.81にも収録済みです。影響を受けた旧MUBは再コンパイルしてください。

自動高速化は演奏中のみで、`/N`は現在CPUを維持します。編集60,000・入力65,536・音楽DATA122,880バイトを維持します。512KiBは最大サイズの同時保持保証ではありません。[更新ガイド](RELEASE_UPDATE_261013.ja.md)で互換性・交換手順を確認してください。
