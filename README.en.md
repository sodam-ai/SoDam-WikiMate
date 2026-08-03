# Wikimate

Tell an AI agent **"organize this,"** and it takes your scattered materials (web links, PDFs, chat logs, text), **organizes them into notes in your Obsidian vault**, **links** related notes together, even **classifies** them, and if you want, **indexes them in Notion** — a **Claude Code plugin**. (Codex has no "plugin install (`/plugin`)" — instead, you clone the repo and register it as an **MCP server** via `codex mcp add`: see [`adapters/codex/SETUP.md`](./adapters/codex/SETUP.md).)

**[한국어](./README.md)**

> 📘 **New here?** See the step-by-step [Beginner's Guide](./GUIDE.en.md) ([HTML](./GUIDE.en.html)) — glossary, install, use, troubleshooting, FAQ, and license, all explained simply.

> Status: **based on v0.7.2 + 3 new features planned for the next version** (auto-link/MOC and auto-classify, adding 2 more MCP tools for 7 total — implemented and verified in this repo, with 119 automated tests passing; live confirmation that the Obsidian graph view actually reflects this and that behavior survives a session restart is still pending user confirmation). Organize, query, vault health-check, run log, and vault auto-discovery are working and verified. See "What's new" below. Notion indexing works in environments where a Notion tool is connected (see "Current status" below).

> 📱 **Device note:** Wikimate is **Windows-PC only (desktop/laptop)**. It is **not installable on phones or tablets**.

## What it does
- 🧹 **Organize in plain language** — just say "organize this link" and a note is created. (If auto-trigger sometimes doesn't fire, run **`/wikimate <link>`** — the slash command fires it 100%.)
- 🧭 **Vault auto-discovery** — automatically finds the vaults registered in Obsidian and proposes **"organize into here?"** (you don't have to say the name; tool `wikimate_vaults`).
- 📒 **Into your real Obsidian vault** — auto-detects whatever Obsidian tool (MCP/CLI) is installed, and falls back to the filesystem if none.
- 🗂️ **Notion index (optional)** — if a Notion tool is connected, it adds an index row (Obsidian = source of truth, Notion = one-way index).
- ✋ **Always plan first → execute after approval** — it never writes on its own.
- 🔁 **Dedup** — the same material is captured once, via `source_hash`.
- 🛡️ **Safe by design** — blocks paths outside the vault; treats text inside external materials as data, not commands (prompt-injection defense).
- 🔎 **Ask your notes** — "find ~ from my vault" answers from your organized notes **with sources** (and says so honestly when something isn't there).
- 🩺 **Vault health-check** — finds duplicates, broken `[[links]]`, orphan notes, and missing frontmatter and **reports** them; on approval it fixes things **without deleting** (moves to archive + backup).
- 🧾 **Run log** — auto-records what the AI did in your vault ("show recent activity").
- 🆕 🔗 **Auto-link · MOC** — links related notes together with `[[links]]` (up to 5 per note, to prevent over-linking), and groups notes on the same topic into a table-of-contents note (MOC).
- 🆕 🗂️ **Auto-classify** — judges and proposes a folder, tags, and importance for unclassified notes, and applies them on approval.
- 🆕 🔔 **Session-start notice** — when you start Claude Code, it auto-detects the Obsidian tool and any registered vaults and notifies you (read-only).
- 🆕 🕵️ **Review subagent** — after a note is actually written, before reporting "done," a separate-perspective AI double-checks once more for distortion of the source content, injection contamination, and damage to existing notes.

<details>
<summary><b>📋 What's new — summary (expand to view)</b></summary>

**✅ v0.7.1 (stable release)**
- `wikimate_collect` (organize) · `wikimate_lint` (health-check) · `wikimate_fix` (safe fix) · `wikimate_runlog` (run log) · `wikimate_vaults` (vault discovery) — 5 MCP tools
- Optional Notion indexing, 3 skills (organize/query/lint)

**🆕 Planned for the next version (implemented and verified in this repo, not yet a stable release)**
- `wikimate_link` (auto-link · MOC) · `wikimate_classify` (auto-classify) — 2 more MCP tools (7 total)
- SessionStart hook (automatic session-start detection) · `wikimate-reviewer` review subagent
- All 119 automated tests pass (unit tests + real server-protocol + real vault-fixture E2E); 5 defects found during the run (self-linking, duplicate input, unvalidated importance values, etc.) were all fixed and locked in with regression tests
- ⚠️ Remaining unverified items: actually seeing this in the real Obsidian graph view/backlinks screen, and the SessionStart notification after restarting Claude Code — both need to be confirmed directly in the user's own environment (areas automation cannot confirm)

</details>

## 30-second glossary (for beginners)
| Word | Plain meaning |
|---|---|
| **Plugin** | A new-feature part you plug into a program (like installing one more app) |
| **Marketplace** | The app store you get plugins from |
| **MCP / MCP tool** | The pipe connecting AI to tools / a feature button pressed through that pipe |
| **Vault** | The folder in Obsidian that holds your notes (it has a name) |
| **dry-run** | Showing "the plan" before actually doing it (a preview) |
| **🆕 MOC** | A table-of-contents note that gathers notes on the same topic |

> More terms in [Beginner's Guide §1](./GUIDE.en.md).

## Install (Claude Code)
> ⚠️ Enter the **two commands one at a time** (don't paste both together, or the URL breaks).

**1) Add the marketplace** — enter, then confirm "added":
```
/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
```
**2) Install the plugin** — after step 1 finishes:
```
/plugin install wikimate@wikimate-marketplace
```
Restart Claude Code and you're done. (To verify, check `/mcp` — success means you see all 5 tools: `wikimate_collect`, `wikimate_lint`, `wikimate_fix`, `wikimate_runlog`, `wikimate_vaults`. 🆕 If you installed from a folder that includes the new features, you'll see 7, including `wikimate_link` and `wikimate_classify`.)

## How to run
**There is nothing separate to "launch."** Once installed, Wikimate starts automatically together with Claude Code every time. "Running it" just means **opening Claude Code and asking in chat**. (Developers who want to run the server directly: `npm install` then `npm start` in the cloned folder. For the full automated verification, run `npm run verify`.)

## Install (Codex)
Codex has **no** `/plugin` marketplace. Instead, clone the repo and register it as an **MCP server**.

**1) Clone**
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```
**2) Register the MCP server** (use your own vault/repo paths):
```
codex mcp add wikimate --env OBSIDIAN_VAULT_PATH=D:/your/vault/path -- node D:/your/cloned/SoDam-WikiMate/mcp/server.mjs
```
→ `codex mcp list` should show `wikimate`.

**3) (Optional) Natural-language rules** — put the repo's `AGENTS.md` in your Codex working folder so "organize this" works too.
**Update**: just `git pull` in the cloned folder (no cache trap like Claude Code).

> ⚠️ **Codex is a "cut-down" version.** It gets the organize (write) MCP tool working too, but the *auto-trigger, ask/query, and multi-note synthesis* **skills are Claude Code only**, and Notion indexing needs a **separate Notion MCP** connected in Codex. (Details: [`adapters/codex/SETUP.md`](./adapters/codex/SETUP.md))

## When updates don't show up — the most common trap (Claude Code)
When a new version is pushed to GitHub, your local **marketplace cache does NOT update automatically.** So reinstalling alone may leave you on the old version. To get the latest:
```
/plugin marketplace update wikimate-marketplace
/plugin install wikimate@wikimate-marketplace
```
If that still fails, in the `/plugin` menu **remove → re-add → install** the marketplace (this re-fetches the cache entirely afresh).

> 💡 **"Do I need to push to GitHub?" → No.** Install/update *pulls from* GitHub, so you never need to push anything yourself. (Pushing is only for when a developer changes the code.)
> ⚠️ **If install fails with `EBUSY: resource busy or locked`** → Windows antivirus (Defender) briefly locked the just-written files. **Fully quit and reopen Claude Code**, then re-run the commands above — that usually clears it.

## Usage
Just ask in chat:
> "Organize this into my 'Vault' vault"

> ⭐ **The reliable way (recommended)** — natural "organize this" is an AI judgment call, so it **sometimes just summarizes** instead of creating a note. When that happens, use the **slash command** `/wikimate <link/text>` — it fires **100%** (a direct command). e.g. `/wikimate https://example.com`

- 📎 **The "material" can be anything** — a one-line text, a web link (`organize this link: https://...`), or a file path (`organize this file: D:\notes\today.md`) all work. Nothing to prepare beforehand.
- 🧭 **You don't have to name the vault** — Wikimate finds your registered vaults and asks "organize into here?". You can also name it explicitly, e.g. *"into my 'Vault'"* (the name is in Obsidian's vault switcher, bottom-left).
- It shows a plan first (where, with which tool, whether to index in Notion), then creates the note on approval.

**Ask it too** (read — from notes you already organized):
> "Find and summarize RAG from my vault"

- It searches the index (Notion) and the original (Obsidian) and answers **with the source**. It **checks whether the original actually still exists before answering**, and if the note was deleted (a dangling index), it honestly tells you "no original" (it never claims something exists when it doesn't).
- 🔗 **You can also ask across a bundle of notes**: "using my notes, synthesize the relationship between RAG, embeddings, and vector DBs" → it gathers the related notes and answers with a **synthesis, sourced note by note** (it shows which notes it will use, first).

**Ask about organize health too** (health-check — read):
> "Health-check my 'Vault' vault"

- 🩺 It finds the **orphan notes** (linked to nothing), **broken `[[links]]`**, **duplicates**, and **missing frontmatter** that build up over time, and — if you use Notion — **dangling index rows** (the original was deleted but the Notion row remains), and **reports** them. **It never fixes things on its own** — pick what to fix and approve it, and only then does it touch anything: duplicates are **moved to the archive (99_Archive) instead of being deleted** (easy to undo); link fixes get an **automatic backup before the fix** (anything irreversible is confirmed once more).

**🆕 Link related notes and build a table of contents too, in chat**:
> "Link this note to related notes" / "Group MCP-related notes into a table of contents"

- It searches the whole vault for candidates, judges relevance by looking only at **title, summary, and tags** (never the body), and proposes matches — only the ones you approve get linked (up to 5 per note). For a table-of-contents request, it creates/updates a per-topic table-of-contents note (MOC) (any existing user-written content is preserved).

**🆕 Auto-classify too, in chat**:
> "Organize these unclassified notes"

- It proposes a folder, tags, and importance, and applies them on approval. On a filename conflict, it never overwrites.

## Environment variables (optional)
| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault folder (filesystem fallback + dedup check) |
| `OBSIDIAN_VAULT_NAME` | Vault name registered in Obsidian (for the CLI) |
| `NOTION_RESEARCH_DB_ID` | Pin the Notion index DB (otherwise it searches or asks) |

Copy `.env.example` to `.env`. **Never commit real values (tokens, etc.) to git.**

## Folder structure
```
.claude-plugin/        Plugin & marketplace manifests
mcp/server.mjs         Zero-dependency MCP server (stdio) — 7 tools (collect·lint·fix·runlog·vaults·link·classify)
mcp/lib/shared.mjs     🆕 Shared helpers (path-safety check, backup, frontmatter parsing)
mcp/lib/collect.mjs    Collect (name sanitizing, dedup)
mcp/lib/lint.mjs       Health-check (read-only)
mcp/lib/fix.mjs        Safe fix (no delete, backup)
mcp/lib/runlog.mjs     Run log
mcp/lib/link.mjs       🆕 Auto-link · MOC
mcp/lib/classify.mjs   🆕 Auto-classify
skills/                Auto-triggering natural-language skills (organize·query·lint·link·classify)
commands/              /wikimate · /wikimate-lint · /wikimate-link · /wikimate-classify commands
hooks/                 🆕 Automatic session-start detection
agents/                🆕 Review subagent (wikimate-reviewer)
adapters/codex/        Codex setup guide
templates/             Note template
scripts/               Verification scripts (verify-*·smoke-*·e2e-*)
(in your vault) .wikimate/runlog.jsonl   Run log (hidden)
```

## Architecture (in short)
```
[You] --spoken command--> [Claude Code/Codex] --MCP--> [Wikimate server] --> [collect/link/classify etc.] --> [Your Obsidian vault]
```
Relevance and classification judgments are made **directly by the AI (Claude)**; the server only supplies candidate information and does the safe file writing (no separate similarity engine — to avoid duplicate development). For a detailed diagram, see [Beginner's Guide §14](./GUIDE.en.md).

## Safety & security
- ✅ Writes run only **after human approval** (`dry_run` is the default — the plan is shown first). If approving every single time feels like a hassle, say **"just organize it, don't ask"** → new note creation then runs automatically (but **overwrite/delete are always confirmed once more**). Also, approval appears as a **pick-an-option prompt (number/click)**, so you can choose instead of typing "go ahead."
- 🧾 **Raw-content-preservation notice** — if the material has a web address but the content looks too short ("did you paste a summary instead of the original?"), or is unusually large, the dry-run plan shown before saving will flag it. This is a **notice, not a block** — you can proceed as-is, or re-prepare the full original and organize again.
- ✅ **Strips path separators, forbidden characters, and control characters** from note titles/folders, and **blocks paths outside the vault** (path-traversal prevention).
- ✅ Instructions found inside external materials are treated **only as data, never as commands** (prompt-injection defense).
- ✅ The Obsidian CLI runs **without a shell** (command-injection prevention). Keys/tokens are never stored in notes or in the released package.
- ✅ The `.obsidian/` folder is never touched. Existing notes are never modified or deleted without approval.
- ✅ 🆕 Related links per note are **capped at 5**, enforced directly in code (to prevent over-linking — prompt instructions alone weren't sufficient, so this is validated at the code level).
- ✅ 🆕 Numeric input values (e.g., importance) are range/type-validated and replaced with a safe default if invalid (found and fixed via actual testing on 2026-07-11).
- ℹ️ Notion indexing only happens when a Notion tool is connected. If not, it organizes into Obsidian only and reports that honestly.
- 🧾 **Run Log** — every note actually created, moved, or fixed is automatically recorded, one line at a time, in `.wikimate/runlog.jsonl` (hidden). Just say **"show recent activity"** and it will recap what it did (a read-only, safe audit log).

For detailed security and data flow, see [Beginner's Guide §15](./GUIDE.en.md).

## Current status (honest)
- ✅ **Obsidian organizing**: verified note creation in a real vault (including natural-language auto-trigger).
- ✅ **Health-check, safe fix, run log**: verified by unit tests + server-protocol e2e (duplicate/broken-link/orphan detection, delete-free fixes, auto logging).
- ✅ 🆕 **Auto-link · MOC · auto-classify**: all 119 automated tests pass, E2E-verified with real vault fixtures (injection defense, the 5-link cap, preservation of existing content, etc., all confirmed by actual runs). 5 real defects found during the run were all fixed and locked in with regression tests.
- 🟡 🆕 **Graph-view reflection · live hook loading**: code and automated tests can only confirm so much — the user needs to confirm this directly, by restarting the real Obsidian app / Claude Code.
- 🟡 **Notion indexing**: works in environments where a Notion tool (MCP/CLI) is connected and authenticated. Depending on the environment, if it's not connected, this is skipped automatically.
- 🟡 **Codex**: an adapter is provided so it can use the same MCP core (setup in `adapters/codex/SETUP.md`). Skills (auto-trigger) are Claude Code only.
- ⚠️ **Live session not verified**: a real Claude Code `/mcp` session against your own real vault is recommended in your own environment (2 minutes; see Install above).

## Troubleshooting
- **Said "organize this" but it only summarized (no note created)** → Natural-language auto-trigger is inconsistent. Pin it down with the **`/wikimate <link>`** slash command to make it fire 100% (the most reliable way).
- **`marketplace ... not found`** → The marketplace isn't registered. Start with **`/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git`**, not `update`, then `/plugin install wikimate@wikimate-marketplace`.
- **Not showing in `/mcp`** → Restart Claude Code. If still missing, refresh the cache using the "When updates don't show up" method above.
- **Note not visible in Obsidian** → Check that you said the exact vault *name* (the filesystem fallback creates the note inside the `OBSIDIAN_VAULT_PATH` folder).
- **Notion isn't getting indexed** → Check that a Notion MCP/CLI is connected and authenticated. If not, only the Obsidian note gets created (normal fallback).
- **Some symbols disappeared from a title** → Filename-forbidden characters like `/ \ : * ? " < > |` are cleaned up into spaces for safety (intended behavior).
- **Install fails with `EBUSY ... locked`** → Antivirus file lock. Quit and reopen Claude Code, then reinstall (see "When updates don't show up" above). If it keeps happening, wait a moment and retry.
- **An old version (e.g. 0.1.0) gets installed** → The marketplace cache is stale. Refresh it via `marketplace update` above (or remove → re-add).
- **🆕 It won't link more than 5 notes** → That's an intentional safeguard (to prevent over-linking).

> More symptoms, fixes, and FAQ are tabulated in [Beginner's Guide §16-17](./GUIDE.en.md).

## Reference tools
[notesmd-cli](https://github.com/Yakitrak/notesmd-cli) · [mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) · [notion-mcp-server](https://github.com/makenotion/notion-mcp-server) · [ntn CLI](https://developers.notion.com/cli/get-started/overview)

## License · Copyright · Commercial use
> ⚖️ This is general information, **not legal advice.** The authoritative notices are the `LICENSE` and `NOTICE` files.

- **Wikimate itself: Apache License 2.0** © 2026 SoDam AI Studio. Commercial use, modification, and distribution are allowed, but you must **include the copyright notice + a copy of the license**, **state changes**, and **keep NOTICE**. Provided **AS-IS, no warranty**, and **no trademark rights** (don't use the names "Wikimate" / "SoDam AI Studio" as your own).
- **External tools are NOT bundled** — Node.js, @modelcontextprotocol/sdk, notesmd-cli, mcp-obsidian, notion-mcp-server are **MIT**; **Notion API/`ntn` follow Notion's terms**; **Obsidian is free for personal use but needs a separate commercial license**. Check each one's own terms.
- **Content copyright** stays with the original authors. Respect each source's license/terms when collecting or redistributing. Notes are stored **locally on your computer** and not sent out (Notion indexing only when you enable it).
- **The notes Wikimate organizes for you are 100% your own copyright.** Wikimate (SoDam AI Studio) claims no rights over the resulting notes — Wikimate is only software; it is not the author of the notes it helps create.

> Full license table and disclaimer: [Beginner's Guide §19](./GUIDE.en.md) or `NOTICE`. For development/testing/deployment methods, see [DEVELOPMENT.md](./DEVELOPMENT.md).
