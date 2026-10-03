# MUCOMSX 문서 릴리즈와 구현 기록

2026-10-03 문서 갱신. 이 문서는 현재 구현의 적용 범위와 실행파일의 차이를 설명합니다. 문서 패키징은 새 실기 시험이나 실행파일 재빌드를 뜻하지 않습니다.

## 먼저 읽을 문서

- [한국어 확장 명령 상세 안내](MUCOMDOTNET_EXTENSIONS.md)
- [English command guide](MUCOMDOTNET_EXTENSIONS.en.md)
- [日本語コマンドガイド](MUCOMDOTNET_EXTENSIONS.ja.md)

네 도구의 한국어·영문·일문 설명서와 GitHub 문서·위키를 갱신하는 기준 문서입니다. 기존 설명서의 옛 빌드 해시·시험 일자는 해당 시점의 기록이며, 아래 빌드 식별자와 혼동하지 마세요. 문서 게시와 실행파일 릴리즈는 별개입니다. 이번 문서 갱신으로 GitHub Releases의 실행파일을 바꾸지는 않습니다.

## 어떤 실행파일에 적용되는가

| 기능 | MucoMSX_261003.zip | 별도 CPU 가속 검증 빌드 |
| --- | --- | --- |
| 일반 다중 페이지와 120 KiB DATA | 포함 | 포함 |
| 확장 매크로·분기·vm3 생략·리듬 자동 팬과 뮤트 | 포함 | 포함 |
| MIDI식 포르타멘토와 ADPCM 음정 LFO·중괄호 포르타멘토 | 포함 | 포함 |
| Panasonic 고속 Z80 자동 선택 | 미포함 | 포함 |
| turbo R 자동 R800 선택과 전용 곱셈 | 미포함 | 포함 |
| /N 자동 가속 해제 | 미포함 | 포함 |

개발 폴더의 오래된 bin 파일을 이름만 보고 최신으로 판단하지 마세요. CPU 빌드는 프로젝트 내부 validation/20261003-cpu-acceleration/build에 있습니다. 이번 문서 작업으로 production 실행파일이나 기존 runtime ZIP을 바꾸지 않았습니다. 문서 팩에는 COM을 넣지 않습니다.

## CPU 가속 사용법

CPU 가속 빌드의 MUCPLAY·MUBPLAY는 연주할 때만 지원 하드웨어를 확인하여 가속합니다.

- Panasonic MSX2+는 제조사 switched I/O와 기능 비트를 확인하고 지원되는 경우 5.37 MHz Z80을 사용합니다. 모든 MSX2+가 해당하는 것은 아닙니다.
- turbo R은 진입 시 Z80이면 R800 ROM 모드로 전환합니다. 이미 R800 ROM·DRAM 모드라면 그대로 유지합니다. DOS 동작 중에 새 DRAM 사본을 초기화하지 않습니다.
- 일반 종료·사용자 중단·처리 가능한 오류 후에는 원래 CPU 모드로 돌려놓습니다. 전원 차단·강제 리셋까지 복원할 수 있다는 뜻은 아닙니다.
- R800임을 확인한 뒤에만 MULUW 전용 명령으로 포르타멘토 보간의 곱셈을 가속합니다. Z80 계산 경로와 몫·나머지 의미를 유지합니다.
- 음악 타이머·MAKOTO 클록·음표·효과를 바꾸거나 생략하지 않습니다. Busy 대기와 리듬 안정화 대기도 유지합니다.
- MUCEDIT 실행파일은 그대로이며 새 MUCPLAY를 호출할 때 가속을 사용합니다. MUC2MUB에는 자동 CPU 전환을 추가하지 않았습니다.

```dos
MUCPLAY SONG.MUC /N
MUCPLAY /PLAY /N
MUBPLAY SONG.MUB /N
```

/N은 자동 CPU 전환을 하지 않고 이식 가능한 곱셈 경로를 쓰는 옵션입니다. 이미 R800으로 들어온 기계를 Z80으로 강제 변경하지 않습니다. 컴파일·적재·VGM export는 자동 가속 대상이 아니며 호출 시 CPU 모드로 실행합니다. 기존 짧은 CLI 도움말에 /N이 표시되지 않을 수 있습니다.

English: automatic acceleration is playback-only. Supported Panasonic MSX2+ machines use 5.37 MHz Z80; turbo R uses R800 ROM when entered from Z80 and preserves an existing R800 mode. Normal return and handled errors restore the caller's mode. /N keeps the current CPU and portable arithmetic; it does not force Z80. Loading, compilation and VGM export do not automatically change CPU. The existing runtime ZIP does not contain these CPU changes.

日本語: 自動高速化は演奏中のみです。対応Panasonic MSX2+は5.37 MHz Z80、turbo RはZ80から入った場合R800 ROMを使用し、既存R800モードは保持します。正常終了・処理可能なエラーで元に戻します。/Nは現在のCPUと共通演算を維持する指定で、Z80への強制変更ではありません。ロード・コンパイル・VGM exportでは自動切替しません。既存runtime ZIPにはCPU変更を収録していません。

## 안정성과 정확성 수정

음악 명령 추가와 함께 페이지별 효과 상태, FM3 슬롯 소유권, SSG 엔벌로프의 소유권·릴리즈, ADPCM의 타이·디튠·페이지 전환을 수정했습니다. 음색 모핑의 TL 저장 공간과 포르타멘토 상태를 분리했습니다. 리듬 자동 팬은 선택한 각 악기에 올바른 대기 인자를 출력하고 뮤트가 키오프를 막지 않도록 했습니다.

컴파일 보조 영역과 연주 런타임의 배치를 분리하고 TPA·스택 경계 검사를 유지했습니다. MUBPLAY의 파일/PCM 전송 버퍼가 DOS 스택을 덮어쓰던 배치를 바로잡았습니다. 압축 해제 및 코드 배치를 개선하되 최소 512 KiB 매퍼 조건은 유지했습니다. 큰 페이지·전체 DATA·잘못된 입력의 한도 검사는 오류를 무시하지 않고 중단하는 방식입니다.

## 검증 결과와 남은 제약

검증은 openMSXTK의 Panasonic_FS-A1WX 및 turbo R FS-A1GT, MAKOTO 환경을 사용했습니다. WX는 외부 512 KiB 매퍼와 기본 RAM, GT 검증은 내부 512 KiB만 사용했습니다. 에뮬레이터 결과를 실물 하드웨어 측정으로 표현하지 않습니다.

| 확인 내용 | 범위와 결과 |
| --- | --- |
| CPU 변경 전후 음악 이벤트 | WX 14개 MUB, GT 재생 가능한 13개 MUB의 1,024 tick 비교 일치 |
| 기본 곱셈 | 2,000개 계산 사례 |
| R800 MULUW | 네이티브 256개 입력 벡터 |
| 종료·중단·오류 복원 | 두 기종·두 플레이어·세 경로, 총 12개 사례 |
| MUCEDIT 연계 | 두 기종에서 곡별 편집·컴파일·연주·MUB/VGM export·복귀 검증 |
| ADPCM 참조 비교 | 39개 비교 중 엄격한 원시 이벤트 일치 37개, 소유권 보호 차이 2개 |

동일한 컨테이너의 비교, 독립 컴파일 결과의 음악 스트림 비교, 전체 파일 바이트 비교, 녹음 파형 비교는 서로 다릅니다. 모든 파일과 모든 파형의 100% 일치를 주장하지 않습니다. 참조 PCMPAGE의 비소유 페이지 Delta-N 쓰기 16건은 MUCOMSX에서 의도적으로 차단합니다. 무음 꼬리, 빈 페이지, 태그 개행이 전체 파일 차이를 만들기도 합니다.

### 처리량

CPU 가속 후 측정한 곡별 평균 tick 처리 시간은 WX 14곡에서 7.276–11.761 ms, GT 13곡에서 2.013–3.229 ms였습니다. 이는 측정 구간 평균입니다. 워밍업 후 최대 tick은 WX 139.348 ms, GT 35.862 ms로 순간 예산 초과가 남아 있습니다. 평균이 약 16.6 ms 이내라는 것만으로 모든 순간의 실시간 연주가 보장되지는 않습니다.

### 2026-10-03: 같은 MUC의 CPU 모드별 전곡 비교

대상은 Is This What You Desired_s00.muc(53,861바이트) 한 곡이며 모드별 1회 측정입니다. openMSXTK·MAKOTO·MegaFlashROM SCC+ SD의 FAT16 저장장치를 사용했습니다. 일반/고속 Z80는 FS-A1WX의 같은 부팅 세션·외부 512 KiB 매퍼(기본 64 KiB 별도), R800은 FS-A1GT의 별도 세션·내부 512 KiB만 사용했습니다. 시간은 호스트 대기 시간이 아닌 MSX 에뮬레이션 시간입니다.

| Metric / 측정 항목 | Z80 3.58 MHz | Panasonic Z80 5.37 MHz | R800 ROM |
| --- | --- | --- | --- |
| MUC2MUB compile + save (s) | 1313.568 | 822.610 | 188.638 |
| MUCPLAY compile (s) | 1282.428 | 802.317 | 183.025 |
| MUCPLAY load → Player_Start (s) | 1309.393 | 819.791 | 188.081 |
| MUCPLAY load → full-song end (s) | 1530.704 | 1035.580 | 404.433 |
| MUBPLAY average processing (ms/tick) | 15.034 | 9.105 | 2.542 |
| MUBPLAY maximum processing (ms/tick) | 146.140 | 91.968 | 24.211 |
| MUBPLAY over-budget ticks (%) | 20.225 | 5.736 | 0.509 |

고속 Z80와 R800의 MUC2MUB 속도는 일반 Z80의 약 1.60배·6.96배, MUBPLAY 평균 처리 성능은 약 1.65배·5.92배였습니다. CPU 모드는 컴파일 전에 별도 테스트 도구로 지정했습니다. 제품이 컴파일 시 자동 가속한다는 의미가 아닙니다. Player_Start는 연주 루틴 진입이며 정확한 첫 오디오 샘플 시점이 아닙니다. R800 ROM과 WX 사이에는 CPU 외에도 RAM·BIOS·기종 차이가 포함됩니다.

각 실행의 초기 8틱을 제외한 12,954틱을 집계했습니다. 틱별 예산과 비교했으며 평균 예산은 16.629 ms였습니다. 같은 플레이어의 tick/port/register/value 기록은 세 모드에서 일치했습니다. 단독 컴파일과 MUCPLAY export로 만든 MUB 6개는 모두 96,139바이트이며 SHA-256은 295d971b5ed776af8c0c6d6f72c3a473a50551754c0ed2060d7afeeabad598a8입니다. 전곡 종료·매퍼 복원을 확인했지만 R800에도 예산 초과 66틱이 남았습니다. 새로운 녹음 파형 비교나 실기 인증은 아닙니다.

English: this is one song, one run per mode, in openMSXTK. WX uses an external 512 KiB mapper plus its base 64 KiB; GT uses only its internal 512 KiB. CPU mode was selected before compilation by the test harness; product auto-acceleration remains playback-only. R800 ROM is not a DRAM-mode benchmark, and machine/RAM differences are included. All six MUBs are byte-identical; register-event sequences match across CPU modes for each player. Timing excludes eight warm-up ticks. R800 still exceeded the per-tick budget 66 times (0.509%); no universal real-time or waveform guarantee is implied.

日本語: 同一曲を各モード1回、openMSXTKで計測しました。WXは外部512 KiBと本体64 KiB、GTは内蔵512 KiBのみです。コンパイル前のCPU切替はテスト側で行い、製品の自動高速化は演奏中のみです。R800 ROMの結果でありDRAMモードではありません。RAM・BIOS・機種差も含みます。MUB 6個はバイト単位で一致し、各プレイヤーのレジスタイベントもCPUモード間で一致しました。先頭8 tickを除外して集計してもR800には予算超過66 tick (0.509%)が残り、全曲の実時間処理や全波形の一致を保証するものではありません。

### 512 KiB 환경

GT 내부 512 KiB만 사용할 때 Wilderness_s00.mub는 반복 상태용 매퍼 할당에서 실패했습니다. 기존·새 CPU 빌드 모두 CPU 가속 시작 전 실패한 것으로 확인했습니다. CPU를 빠르게 해도 해결되는 문제가 아닙니다.

큰 컴파일 세션을 유지한 MUCEDIT에서 다음 문서를 안전하게 읽기 위한 64 KiB 임시 공간이 부족한 경우가 있었습니다. 해당 순환 검증은 정상 종료 후 다시 실행하여 공간을 해제했고 MSX를 재부팅하지 않았습니다. 최소 메모리 조건과 모든 대용량 자료의 동시 적재 보장은 구별해야 합니다.

English: the tests are emulator-based, not real-hardware certification. Average timing improved, but individual ticks still exceed budget. GT internal-only 512 KiB cannot allocate repeat state for Wilderness_s00.mub in either old or new CPU build. Large retained editor sessions can prevent transactional loading of the next document. One ADPCM reference case deliberately differs because non-owning pages must not alter active pitch. Strict reference agreement is 37/39 comparisons, not universal waveform identity.

日本語: エミュレータ検証であり実機認証ではありません。平均時間は改善しましたが瞬間的な予算超過は残ります。GT内蔵512 KiBだけではWilderness_s00.mubの反復状態メモリ確保が旧・新両ビルドで失敗します。大きな編集セッション保持中には次文書の安全ロード領域が不足する場合もあります。ADPCMの非所有ページによる音程上書きは意図的に防止し、厳密比較は39件中37件一致です。全波形の完全一致を保証しません。

## 실행파일 식별용 SHA256

### 기존 런타임 ZIP에 포함한 빌드

```text
MUCPLAY.COM  37936893a549cde7be89f119819b31bd1b9cdf3d0bc035609e67ec722d92f487
MUBPLAY.COM  d33200f1284bdcfee155675502d76c2fdc795967b2f799ea1da9a8bf68f6f9ae
MUC2MUB.COM  6a98ed1c938cb60d95829f68208e8a2be97ca25d9422e46dfc95c83976a4251d
MUCEDIT.COM  4e486be954c1a9aa9bb2b3552cab1930bac3f966a9e0584a3cda6d259585648e
```

### CPU 가속 검증 빌드

```text
MUCPLAY.COM  c9f04e75f1ee56c3193ad8cfee98f87ff0b3627ac4ae6b712fe2db1dd16ddeea
MUBPLAY.COM  308ff812869c4f924315240c748a7ed64eb07f2b3a8fb20df9f7b2fa8bc5a513
MUC2MUB.COM  6a98ed1c938cb60d95829f68208e8a2be97ca25d9422e46dfc95c83976a4251d
MUCEDIT.COM  4e486be954c1a9aa9bb2b3552cab1930bac3f966a9e0584a3cda6d259585648e
```

## 관리와 근거

문서 원본은 각 도구의 프로젝트 설명서와 shared/docs입니다. 다음 패키징도 로컬 원본을 사용합니다. release_docs는 이전 GitHub 사본이며 새 명령 지원 여부를 결정하는 최신 원본이 아닙니다.

명령 설명은 이번 구현 소스와 로컬 mucomDotNET MML 참조를 대조했습니다. 검증 근거는 프로젝트의 다음 기록에 남아 있습니다. 문서 ZIP에 테스트 ROM·DOS·악곡·PCM이나 전체 개발용 로그를 포함하지 않습니다.

- validation/20260930-multipage-phase2/requested-extensions-status.json
- validation/20260930-multipage-phase2/realtime-status.json
- validation/20261003-cpu-acceleration/status.json
- validation/20261003-cpu-acceleration/REPORT.txt
- validation/20261003-cpu-performance-desired/REPORT.txt
- validation/20261003-cpu-performance-desired/comparison.json
- validation/20261003-cpu-acceleration/candidate/shared
- validation/20261003-cpu-acceleration/candidate/muc2mub/src

이번 패키지의 manifest.json은 로컬 문서 출처와 SHA-256을 기록합니다. SHA256SUMS.txt는 ZIP 내부 파일용, .zip.sha256은 ZIP 자체용입니다. 저작권·구성요소 고지는 NOTICE.txt 및 LICENSES를 유지하며, 이 명령 안내가 문서 전체나 프로젝트에 새 라이선스를 부여하는 것은 아닙니다.
