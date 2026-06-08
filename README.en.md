# Wikimate

Tell an AI agent **"organize this,"** and it files your scattered materials (web links, PDFs, chat logs, text) into **notes in your Obsidian vault** — and optionally **indexes them in Notion**. A Claude Code · Codex plugin.

**[한국어](./README.md)**

> Status: early stage (Phase 1a). Obsidian organizing is verified working; Notion indexing works in environments where a Notion tool is connected (see "Current status").

## What it does
- 🧹 **Organize in plain language** — just say "organize this link" and a note is created (no need to call any tool by hand).
- 📒 **Into your real Obsidian vault** — auto-detects whatever Obsidian tool (MCP/CLI) is installed, and falls back to the filesystem if none.
- 🗂️ **Notion index (optional)** — if a Notion tool is connected, it adds an index row (Obsidian = source of truth, Notion = one-way index).
- ✋ **Always plan first → execute after approval** — never writes on its own.
- 🔁 **Dedup** — the same material is captured once, via `source_hash`.
- 🛡️ **Safe by design** — blocks paths outside the vault; treats text inside external materials as data, not commands (prompt-injection defense).

## Install (Claude Code)
> ⚠️ Enter the **two commands one at a time** (don't paste both together, or the URL breaks).

**1) Add the marketplace** — enter, then confirm "added":
```
/plugin marketplace add https://github.com/sodam-ai/wikimate.git
```
**2) Install the plugin** — after step 1 finishes:
```
/plugin install wikimate@wikimate-marketplace
```
Restart Claude Code and you're done. (To verify, check `/mcp` for `wikimate_collect`.)

## When updates don't show up — the most common trap
When a new version is pushed to GitHub, your local **marketplace cache does NOT update automatically.** So reinstalling alone may keep the old version. To get the latest:
```
/plugin marketplace update wikimate-marketplace
/plugin install wikimate@wikimate-marketplace
```
If that still fails, in the `/plugin` menu **remove → re-add → install** the marketplace (this re-fetches a fresh copy).

> 💡 **"Do I need to push to GitHub?" → No.** Install/update *pulls from* GitHub, so you never push anything yourself. (Pushing is only for developers changing the code.)
> ⚠️ **If install fails with `EBUSY: resource busy or locked`** → Windows antivirus (Defender) briefly locked the just-written files. **Fully quit and reopen Claude Code**, then re-run the commands — that usually clears it.

## Usage
Just ask in chat:
> "Organize this into my 'Vault' vault"

- 📎 **The "material" can be anything** — a one-line text, a web link (`organize this link: https://...`), or a file path (`organize this file: D:\notes\today.md`). Nothing to prepare.
- 🏷️ To use an Obsidian **CLI** (e.g. notesmd-cli), tell it the **vault name** (e.g. "into my 'Vault' vault"). If you don't know it, check Obsidian's vault switcher (bottom-left). Otherwise it falls back to the filesystem.
- It shows a plan first (where, which tool, whether to index in Notion), then creates the note on approval.

**Ask it too** (read — from notes you already organized):
> "Find and summarize RAG from my vault"

- It searches the index (Notion) and originals (Obsidian) and answers **with the source**. It **verifies the original actually exists before answering**, and if a note was deleted (dangling index) it says so honestly (never cites a ghost).
- 🔗 **Ask across multiple notes too**: "synthesize the relationship between RAG, embeddings, and vector DBs from my notes" → it gathers the related notes and **synthesizes with per-note sources** (showing which notes it will use first).

## Environment variables (optional)
| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault folder (filesystem fallback + dedup check) |
| `OBSIDIAN_VAULT_NAME` | Vault name registered in Obsidian (for the CLI) |
| `NOTION_RESEARCH_DB_ID` | Pin the Notion index DB (otherwise it searches or asks) |

Copy `.env.example` to `.env`. **Never commit real values (tokens, etc.) to git.**

## Folder structure
```
.claude-plugin/      Plugin & marketplace manifests
mcp/server.mjs       Zero-dependency MCP server (stdio)
mcp/lib/collect.mjs  Collect logic (name sanitizing, dedup)
skills/              Skill that auto-triggers on natural language
commands/            /wikimate command
adapters/codex/      Codex setup guide
templates/           Note template
```

## Safety & security
- ✅ Writes run only **after human approval** (`dry_run` is the default — plan shown first). If approving every time is tedious, say **"just organize it, don't ask"** → new note creation runs automatically (**overwrite/delete are always confirmed**).
- ✅ Note titles/folders have **path separators, forbidden characters, and control characters stripped**, and **paths outside the vault are blocked** (traversal prevention).
- ✅ Instructions inside external materials are treated as **data, not commands** (prompt-injection defense).
- ✅ The Obsidian CLI runs **without a shell** (command-injection safe). Keys/tokens are never stored in notes or the package.
- ✅ The `.obsidian/` folder is never touched. Existing notes are never modified/deleted without approval.
- ℹ️ Notion indexing only when a Notion tool is connected. Otherwise it organizes Obsidian only and reports honestly.

## Current status (honest)
- ✅ **Obsidian organizing**: verified note creation in a real vault (including natural-language auto-trigger).
- 🟡 **Notion indexing**: works where a Notion tool (MCP/CLI) is connected and authenticated. If not connected, it is skipped automatically.
- 🟡 **Codex**: an adapter lets it use the same MCP core (setup in `adapters/codex/SETUP.md`).

## Troubleshooting
- **Not showing in `/mcp`** → Restart Claude Code. If still missing, refresh the cache via "When updates don't show up" above.
- **Note not visible in Obsidian** → Check you said the exact vault *name* (the filesystem fallback writes into the `OBSIDIAN_VAULT_PATH` folder).
- **Notion isn't getting indexed** → Check that a Notion MCP/CLI is connected and authenticated. If not, only the Obsidian note is created (normal fallback).
- **Some symbols disappeared from a title** → Filename-forbidden characters like `/ \ : * ? " < > |` are replaced with spaces for safety (intended behavior).
- **Install fails with `EBUSY ... locked`** → Antivirus file lock. Quit and reopen Claude Code, then reinstall (see "When updates don't show up"). If it repeats, wait a moment and retry.
- **An old version (e.g. 0.1.0) gets installed** → The marketplace cache is stale. Refresh via `marketplace update` (or remove → re-add) above.

## Reference tools
[notesmd-cli](https://github.com/Yakitrak/notesmd-cli) · [mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) · [notion-mcp-server](https://github.com/makenotion/notion-mcp-server) · [ntn CLI](https://developers.notion.com/cli/get-started/overview)

## License
Apache License 2.0 © 2026 SoDam AI Studio

> For development, testing, and deployment, see [DEVELOPMENT.md](./DEVELOPMENT.md).
