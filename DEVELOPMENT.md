# 개발 (Development)

## 로컬 검증
```bash
npm install        # 검증용 의존성 (플러그인 실행엔 불필요 — MCP 서버는 무의존)
npm run verify     # 수집 로직 검증
npm start          # MCP 서버(stdio) 실행
```

## 로컬 폴더로 설치 테스트 (배포 전)
```
/plugin marketplace add <이 폴더의 경로>
/plugin install wikimate@wikimate-marketplace
```

## Codex 어댑터
`adapters/codex/SETUP.md` 참고 (`codex mcp add`로 같은 무의존 서버 등록).
