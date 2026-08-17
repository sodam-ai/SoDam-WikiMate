# RESEARCH_SOURCES

아래는 **LLM Wiki / Karpathy LLM Wiki / LLM 기반 개인 지식베이스** 관련 주소만 모아서 정리한 것입니다. 원본 아이디어는 Karpathy의 GitHub Gist이고, 핵심은 문서·노트·자료를 LLM이 읽기 좋은 **마크다운 위키형 지식베이스**로 계속 정리하게 만드는 방식입니다. ([Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f?utm_source=chatgpt.com))

## 1. 원본 / 핵심 주소

```text
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
https://github.com/karpathy
https://karpathy.ai/
https://karpathy.github.io/
```

## 2. LLM Wiki 오픈소스 구현체

```text
https://github.com/nvk/llm-wiki
https://github.com/nashsu/llm_wiki
https://github.com/lucasastorian/llmwiki
https://llmwiki.app/
https://github.com/Pratiyush/llm-wiki
https://github.com/Astro-Han/karpathy-llm-wiki
```

`nvk/llm-wiki`는 `AGENTS.md` 기반으로 어떤 LLM 에이전트든 읽고 쓸 수 있는 위키 프로토콜을 제공하고, `nashsu/llm_wiki`는 문서를 자동으로 연결된 지식베이스로 바꾸는 데스크톱 앱 형태입니다. `lucasastorian/llmwiki`는 Karpathy LLM Wiki의 오픈소스 구현체로, 문서를 업로드하고 Claude MCP와 연결하는 흐름을 설명합니다. ([GitHub](https://github.com/nvk/llm-wiki?utm_source=chatgpt.com))

## 3. Claude Code / MCP / 플러그인 관련

```text
https://github.com/lucasastorian/llmwiki
https://github.com/kfchou/wiki-skills
https://github.com/Astro-Han/karpathy-llm-wiki
https://github.com/nvk/llm-wiki
```

`wiki-skills`는 Karpathy의 LLM Wiki 패턴을 Claude Code 플러그인으로 구현한 프로젝트이고, “RAG처럼 매번 다시 답을 찾는 방식”이 아니라 LLM이 계속 유지하는 마크다운 위키 구조를 지향합니다. ([GitHub](https://github.com/kfchou/wiki-skills?utm_source=chatgpt.com))

## 4. 논문 / 연구 자료

```text
https://arxiv.org/abs/2605.25480
https://arxiv.org/html/2605.25480v2
https://arxiv.org/pdf/2605.25480
```

논문 **Retrieval as Reasoning: Self-Evolving Agent-Native Retrieval via LLM-Wiki**는 LLM-Wiki를 단순 RAG가 아니라, 문서를 양방향 링크가 있는 위키 페이지로 컴파일하고 `wiki_search`, `wiki_read`, 링크 추적을 통해 에이전트가 탐색하게 만드는 구조로 설명합니다. ([arXiv](https://arxiv.org/abs/2605.25480?utm_source=chatgpt.com))

## 5. 가이드 / 설명 / 토론

```text
https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code
https://news.ycombinator.com/item?id=47640875
https://news.ycombinator.com/item?id=47656181
https://news.ycombinator.com/item?id=47905223
https://news.ycombinator.com/item?id=48351115
```

MindStudio 글은 Karpathy LLM Wiki를 Claude Code와 Obsidian 기반 개인 지식베이스로 구성하는 방법을 설명하고, Hacker News에는 원본 아이디어와 오픈소스 구현체 관련 토론이 올라와 있습니다. ([MindStudio](https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code?utm_source=chatgpt.com))

## 6. LLM Wiki v2 / 확장 아이디어

```text
https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2
https://arxiv.org/abs/2604.12034
```

`LLM Wiki v2` 계열은 Karpathy의 LLM Wiki 패턴을 더 운영형 구조로 확장하려는 설계 문서에 가깝고, 관련 연구에서는 개인용 LLM 메모리와 위키형 지식 시스템을 장기 기억 구조로 다룹니다. ([Gist](https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2?utm_source=chatgpt.com))

## 7. LLM / RAG / 지식베이스 참고용 인기 자료

```text
https://github.com/hannibal046/awesome-llm
https://github.com/Shubhamsaboo/awesome-llm-apps
https://github.com/mlabonne/llm-course
https://github.com/GNEHUY/Awesome-AgenticRAG
https://github.com/topics/llm-wiki-personal-knowledge-base
https://en.wikipedia.org/wiki/Large_language_model
https://developers.google.com/machine-learning/crash-course/llm
```

## 최종 추천만 압축

```text
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
https://github.com/nvk/llm-wiki
https://github.com/nashsu/llm_wiki
https://github.com/lucasastorian/llmwiki
https://llmwiki.app/
https://github.com/Pratiyush/llm-wiki
https://github.com/kfchou/wiki-skills
https://github.com/Astro-Han/karpathy-llm-wiki
https://arxiv.org/abs/2605.25480
https://news.ycombinator.com/item?id=47640875
```

검증 결과, **원본 아이디어는 Karpathy Gist**, **바로 실험해볼 구현체는 `nvk/llm-wiki`, `lucasastorian/llmwiki`, `nashsu/llm_wiki`**, **Claude Code 플러그인 형태는 `kfchou/wiki-skills`**, **연구적으로 깊게 볼 자료는 arXiv LLM-Wiki 논문**이 가장 관련성이 높습니다.
