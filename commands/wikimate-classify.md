---
name: wikimate-classify
description: Inbox 노트를 7폴더 체계로 분류하고 태그·중요도 매기기
---

노트를 올바른 폴더로 옮기고 태그를 정리한다. "Wikimate Classify" 스킬의 워크플로우를 따른다:

1. 볼트 확정. `wikimate_classify`를 `action:"suggest"`로 호출해 현재 상태·후보 폴더·기존 태그 어휘를 본다.
2. 유사도 엔진 없이 **직접 판단**한다 — 애매하면 폴더 유지, 새 태그보다 기존 태그 재사용 우선.
3. 계획을 보고하고 `AskUserQuestion`으로 [적용/건너뛰기/수정] 개별 승인을 받는다.
4. 승인된 것만 `wikimate_classify`를 `action:"apply", dry_run:false`로 호출한다.
5. 결과(이동 경로·백업)를 재확인 후 보고한다. 90_Templates·99_Archive는 대상 아님.

인자가 있으면 그 노트를 대상으로 시작한다: $ARGUMENTS
