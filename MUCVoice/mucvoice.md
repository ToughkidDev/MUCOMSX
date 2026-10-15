# MUCVOICE v0.5beta — MSX 음색 에디터

[English](mucvoice.en.md) · [日本語](mucvoice.ja.md)

MUCVOICE v0.5beta는 MUCEDIT·MUCPLAY·MUC2MUB·MUBPLAY와 같은 툴체인 ZIP에 들어 있습니다. 음색 에디터의 빠른 안내는 실행파일 ZIP의 `MUCVOICE/START.MD`, 전체 다국어 설명서는 문서 ZIP에서 읽을 수 있습니다. 추가 기능과 업데이트 방법은 [릴리즈 안내](../shared/docs/RELEASE_UPDATE_261013.md)를 함께 읽어 주세요.

MUCVOICE는 MSX-DOS2/Nextor의 Screen 2에서 YM2608 FM과 SCC/SCC+ 음색을 편집하는 Z80 프로그램입니다. 512KiB 매퍼 RAM 환경을 권장합니다. FM 미리 듣기는 MAKOTO, SCC 미리 듣기는 SCC/SCC+ 카트리지가 필요합니다. `MUCVOICE /TEXT`로 숫자형 콘솔 화면을 사용할 수 있습니다.

## 가장 먼저 해 볼 작업

1. ZIP을 풀어 `MUCVOICE.COM`과 `FMVOICE.DAT`, `SCCVOICE.DAT`, `INIT.TFI`를 SD의 같은 폴더에 복사합니다. ROM·DOS/Nextor 시스템은 포함하지 않습니다.
2. `MUCVOICE`를 실행하고 `P`로 현재 FM 또는 SCC 뱅크의 기본 프리셋을 엽니다.
3. 화살표로 선택합니다. SCC는 실제 32샘플 파형을, FM은 엔벌로프/파라미터 그래픽을 보여줍니다. FM 화면은 실제 오디오 파형이 아닙니다.
4. Space 또는 `C D E F G A B`로 먼저 들어봅니다. 음표는 C4–B4, Shift는 위 옥타브입니다. Enter로 적용하고 Esc로 적용하지 않고 돌아갑니다.
5. 숫자 위치에서 바로 값을 입력합니다. Tab은 확정 후 다음 항목, Esc는 입력 취소입니다. 화살표를 누르고 있으면 점차 빠르게 변하며 Shift를 함께 누르면 1씩 조절합니다.
6. `K`로 건반 연주 모드를 열어 음색을 시험합니다. 저장은 `S`, 종료는 `Q`/Ctrl+Q입니다. 수정한 다른 뱅크도 저장했는지 확인하세요.

## 파일을 찾고 가져오기

`O`/Ctrl+O로 파일 브라우저를 엽니다. 위/아래는 파일, 좌/우는 파일 안의 음색, Tab은 비어 있지 않은 슬롯/전체 슬롯 표시를 전환합니다. 포커스 음색을 미리 보고 Space/음표 키로 들어본 뒤 선택할 수 있습니다. 이동·취소·화면 전환·종료 때 남은 음을 정리하며, 미리 듣기만으로 사용자 뱅크나 Undo가 바뀌지는 않습니다.

파일 브라우저에서 **Enter는 미리 보던 한 음색이 아니라 DAT 전체 뱅크를 불러옵니다.** 미저장 변경 폐기를 확인하고 재검증한 뒤 적용합니다. 먼저 개인 뱅크를 저장하세요. 폴더는 Enter로 들어가고 Backspace로 상위로 갑니다. 브라우징은 DOS 현재 폴더를 바꾸지 않습니다. 브라우저 로드 후 저장 이름을 다시 묻고, 원본 파일에 즉시 덮어쓰지는 않습니다. 이는 `P`의 한 슬롯 프리셋 적용과 다른 동작입니다.

DAT 뱅크, TFI FM 음색, MUC 안의 FM/SCC 음색 정의, VGM의 YM2608 FM 및 SCC/SCC+ 파형을 가져올 수 있습니다. VGZ는 PC에서 압축을 풀어 VGM으로 준비하세요. DAC 스트림 제어 등 지원하지 않는 명령은 안전하게 거부합니다. VGM에서 추출한 FM은 그 시점의 레지스터 음색이며 원래 악보의 음색 이름·의도를 복원하는 기능은 아닙니다.

음색을 DAT나 인라인 MUC로 내보내 곡에서 사용하고, 단음 VGM으로 시험할 수 있습니다. 파일/레코드/슬롯의 정확한 입력 항목은 동봉 `TFI.txt`, `MUCIO.txt`, `VGMIO.txt`를 확인하세요. WAV→ADPCM 뱅크 제작은 지원하지 않습니다. 음악 전체를 편집하거나 재생하는 도구는 MUCEDIT/MUCPLAY/MUBPLAY입니다.

## 저장·복구와 프리셋

저장 파일명은 재사용하며, FM/SCC의 미저장 표시와 Undo는 별도로 유지합니다. SCC 저장이 FM Undo를 지우지 않습니다. 파일 없음과 기존 파일 보호 오류도 구분합니다. 작업 전에 원본 DAT·MUC를 백업하고 저장 결과를 다시 불러 확인하세요.

기본 FM 12종과 SCC 32종은 직접 합성한 프리셋입니다. 가져오는 외부 음색의 이용 조건을 확인하세요.

## 자세한 설명서

상세 사용설명서는 [한국어](docs/README.txt), [English](docs/MANUALEN.md), [日本語](docs/MANUALJA.md)로 제공됩니다.

ZIP의 `README.TXT`, `QUICK.TXT`, `KEYBOARD.txt`, `PRESETS.TXT`, `TFI.txt`, `MUCIO.txt`, `VGMIO.txt`, `USABILITY.txt`가 프로젝트 원본 설명서입니다. 같은 내용을 [파일별 문서](docs/)에서도 보관합니다. 출처·라이선스는 `NOTICE.TXT`, `LICENSES/`에 있습니다.

음색 미리 듣기는 단음이며 FM은 MAKOTO, SCC는 탐색한 SCC/SCC+를 사용합니다. 다른 음악과 동시에 실행하지 마세요. 미리 보기는 뱅크와 Undo를 바꾸지 않지만 Enter로 파일을 읽으면 해당 DAT 뱅크 전체를 교체합니다.
