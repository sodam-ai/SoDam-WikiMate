---
name: wikimate-link
description: 관련 노트끼리 [[링크]]로 연결 (자동 링크, 노트당 최대 5개)
---

노트끼리 관련도를 판단해 링크로 연결한다. "Wikimate Link" 스킬의 워크플로우를 따른다:

1. 볼트 확정(이름 또는 경로). 모르면 `wikimate_vaults`로 후보를 묻는다.
2. `wikimate_link`를 `action:"suggest"`로 호출해 후보(title·summary·tags)를 읽기전용으로 본다.
3. 유사도 엔진 없이 **직접 관련도를 판단**한다 — 확실한 것만, 노트당 최대 5개.
4. 계획을 보고하고 `AskUserQuestion`으로 [연결하기/건너뛰기/수정] 개별 승인을 받는다(비가역 편집이라 사전승인 무관).
5. 승인된 것만 `wikimate_link`를 `action:"add_links", dry_run:false`로 호출한다.
6. 결과(반영된 related·백업 경로)를 재확인 후 보고하고, 그래프뷰 확인은 사용자에게 안내한다.

인자가 있으면 그 노트를 대상으로 시작한다: $ARGUMENTS
