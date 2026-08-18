---
name: wikimate-link
description: 관련 노트끼리 [[링크]]로 연결(자동 링크, 노트당 최대 5개) 또는 같은 주제 노트를 목차(MOC)로 묶기
---

"Wikimate Link" 스킬의 워크플로우를 따른다. 사용자 의도가 "연결"이면 A, "목차/MOC"면 B를 따른다.

## A. 노트끼리 연결 (`add_links`)
1. 볼트 확정(이름 또는 경로). 모르면 `wikimate_vaults`로 후보를 묻는다.
2. `wikimate_link`를 `action:"suggest"`로 호출해 후보(title·summary·tags)를 읽기전용으로 본다.
3. 유사도 엔진 없이 **직접 관련도를 판단**한다 — 확실한 것만, 노트당 최대 5개.
4. 계획을 보고하고 `AskUserQuestion`으로 [연결하기/건너뛰기/수정] 개별 승인을 받는다(비가역 편집이라 사전승인 무관).
5. 승인된 것만 `wikimate_link`를 `action:"add_links", dry_run:false`로 호출한다.
6. 결과(반영된 related·백업 경로)를 재확인 후 보고하고, 그래프뷰 확인은 사용자에게 안내한다.

## B. 목차(MOC) 만들기·갱신 (`build_moc`)
1. 주제(topic)와 묶을 노트들을 확인한다(지어낸 노트 이름 금지). 볼트 확정은 A와 동일.
2. `wikimate_link`를 `action:"build_moc", topic:<주제>, targets:<노트 제목 배열>, dry_run:true`로 호출해 신규/갱신 여부와 멤버를 확인한다(5개 상한 없음).
3. `AskUserQuestion`으로 [만들기(갱신)/건너뛰기/대상 수정] 개별 승인을 받는다.
4. 승인된 것만 `dry_run:false`로 실제 호출한다. 기존 MOC가 있었다면 사용자가 직접 쓴 다른 섹션이 보존됐는지 확인한다.
5. 생성/갱신된 경로와 최종 멤버를 확인 후 보고하고, 그래프뷰 확인은 사용자에게 안내한다.

인자가 있으면 그 노트(또는 주제)를 대상으로 시작한다: $ARGUMENTS
