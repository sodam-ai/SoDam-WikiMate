# Wikimate

> Tell an AI agent "organize this," and it tidies scattered materials into **Obsidian notes (the source of truth)** and indexes them into **Notion (the index)**. A **Claude Code plugin + portable MCP core**.

**🌐 [한국어 README](./README.md)**

---

## What is Wikimate? (one-line analogy)
A secretary that turns the stuff scattered across your browser tabs, downloads folder, and AI chats into **personal knowledge notes you (and AI) can find and re-read later**.

## Current status (development stage)
- **Phase 1a (now)**: MCP core + collect tool (`wikimate_collect`) — turns materials into Obsidian notes (.md). Includes **safety gate, dedup, and injection defense**.
- Next: auto-classify & Notion index (1b) → auto-trigger skills (2) → marketplace release (3, after verification).

## Architecture at a glance
```
Obsidian  = source / long-term memory (.md files)
Notion    = index / dashboard           (Phase 1b)
MCP core  = one organizing logic        (shared by Claude Code & Codex = model-agnostic)
Safety    = analyze -> report -> human approval -> execute
```

---

## Install (Claude Code) — step by step for beginners

### Option A: Locally on your PC (local test)
1. (once) Install dependencies in this folder:
   ```bash
   npm install
   ```
2. In the Claude Code prompt:
   ```
   /plugin marketplace add <path to this folder>
   /plugin install wikimate@wikimate-marketplace
   ```
3. **Restart** Claude Code.
4. Verify: type `/mcp` → if you see the `wikimate` server and `wikimate_collect` tool, it works.

### Option B: From GitHub (other PCs / sharing)
```
/plugin marketplace add sodam-ai/wikimate
/plugin install wikimate@wikimate-marketplace
```
> Only the `marketplace add` **source** changes (local folder → `sodam-ai/wikimate`); the `install` line stays the same (the marketplace name comes from `marketplace.json`).

---

## Usage
Just ask in chat. Example:
```
Use wikimate_collect to turn this into a note.
title="What is MCP?", text="...body...", vault_path="<my vault path>", dry_run=true
```
- **`dry_run=true` (default)**: reports the plan only, writes nothing. Set `false` to actually create.
- Re-submitting the same material is **blocked by `source_hash`** (dedup).
- The note gets frontmatter (title, source, date, summary, tags, importance) + body.

## Environment variables
| Variable | Description |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to your Obsidian vault. If unset, pass `vault_path` per call |

> Notion variables come in Phase 1b. Keep real values in `.env` and **never commit them**. See `.env.example`.

## For developers (local verification)
```bash
npm install        # dependencies
npm run verify     # verify collect logic (works without the SDK)
npm start          # run the MCP server (stdio)
```

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Tool not shown in `/mcp` | No restart after install | Restart Claude Code |
| "vault_path required" error | Vault path not set | Pass `vault_path` in the call or set `OBSIDIAN_VAULT_PATH` |
| Server won't start on another PC | Dependencies not bundled | Run `npm install` there (packaging improvement planned) |

---

## Safety & security
- Writes/deletes go through a **human approval gate** (`dry_run` is the default).
- Instructions inside external materials are treated as **data, not commands** — **prompt-injection defense**.
- API keys, tokens, and personal data are never stored in notes or the repo. `.env` is git-excluded.

## References
| Tool | Role |
|---|---|
| [Yakitrak/notesmd-cli](https://github.com/Yakitrak/notesmd-cli) | Obsidian CLI (headless) |
| [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) | Obsidian MCP |
| [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) | Notion MCP (official) |
| [Notion `ntn` CLI](https://developers.notion.com/cli/get-started/overview) | Notion CLI (official) |

## Known limitations
- Dependency bundling for GitHub installs (node_modules) → will be improved (zero-dep / bundle).
- Notion indexing and auto-trigger skills are upcoming phases.
- Codex adapter behavior is unverified.

## License
Apache-2.0 (provisional — to be finalized before public release).
