# Wikimate

Tell an AI agent **"organize this,"** and it takes your scattered materials (web links, PDFs, chat logs, text), **organizes them into notes in your Obsidian vault**, **links** related notes together, **classifies** them, **summarizes** them, and if you want, **indexes them in Notion** — a **Claude Code plugin**. (Codex has no "plugin install (`/plugin`)" — instead, you clone the repo and register it as an **MCP server** via `codex mcp add`.)

**[한국어 (Korean version)](./README.md)** · **View as HTML: [README.en.html](./README.en.html)**

> 📱 **Device note**: Wikimate is **Windows-PC only (desktop/laptop)**. It is **not installable on phones or tablets** (Claude Code and Codex, the AI programs you talk to, are themselves PC-only programs).

> ✅ **Current status (as of 2026-08-04, honestly)**: All **8** MCP tools are merged into `main` and pushed to GitHub. **All 126 automated tests pass** (`npm run verify`), verified via the real server protocol and via real Obsidian-vault end-to-end runs. The session-start auto-detection (hook) and the Obsidian graph-view reflection have been **confirmed on real screens in the user's own environment** (screenshot evidence). See [17. Current status, honestly](#17-current-status-honestly) for the item-by-item breakdown.

This document is written so that **someone who has never touched AI, a computer, a mobile device, or any electronic device before** can follow it step by step from top to bottom. Every hard term is spelled out in plain language.

---

## Table of contents

1. [What is Wikimate? (1-minute overview)](#1-what-is-wikimate-1-minute-overview)
2. [30-second glossary (for beginners)](#2-30-second-glossary-for-beginners)
3. [Prerequisites](#3-prerequisites)
4. [How to download the required programs](#4-how-to-download-the-required-programs)
5. [How to download Wikimate](#5-how-to-download-wikimate)
6. [Install](#6-install)
7. [How to run it](#7-how-to-run-it)
8. [Quick start (3-minute walkthrough)](#8-quick-start-3-minute-walkthrough)
9. [How it works (what happens under the hood)](#9-how-it-works-what-happens-under-the-hood)
10. [Usage (7 features)](#10-usage-7-features)
11. [Workflow (the whole flow at a glance)](#11-workflow-the-whole-flow-at-a-glance)
12. [Command reference](#12-command-reference)
13. [What's new — changelog](#13-whats-new--changelog)
14. [Files & docs — folder structure](#14-files--docs--folder-structure)
15. [Architecture](#15-architecture)
16. [Security & data flow](#16-security--data-flow)
17. [Current status, honestly](#17-current-status-honestly)
18. [Troubleshooting](#18-troubleshooting)
19. [FAQ](#19-faq)
20. [License, copyright & commercial use](#20-license-copyright--commercial-use-please-read)
21. [Cheat sheet](#21-cheat-sheet)

---

## 1. What is Wikimate? (1-minute overview)

It's an **AI assistant** that organizes your scattered materials.

Think of it this way — when your desk is piled with receipts, notes, and links, saying "organize this for me" gets you an assistant that **automatically sorts everything into notes in folders**, **threads related notes together**, **groups similar topics into a table of contents**, and **writes a one-line summary of anything long**. Just like asking an assistant over chat (like a messaging app), **you simply say what you want in plain language.**

- Organized results pile up as notes in **Obsidian**, a note-taking app. (Stored only on your own computer = never sent out.)
- If you want, it also writes a list row into a **Notion** table. (Optional.)
- Related notes get **automatically threaded together** (auto-link), and similar topics get grouped into a **table-of-contents note (MOC)**.
- Notes that don't have a folder/tags yet get a proposed **folder and tags** based on AI judgment.
- Overly long notes get a **one-line summary**, or a separate **atomic note** with just the key points pulled out (the original is never touched).
- **It never deletes or changes things on its own.** It always reports "I'm about to do this" first, and only proceeds once you say yes.

> One-line summary: **Say "organize this," and it organizes your notes app into clean notes, links them together, classifies them, and even summarizes them.**

---

## 2. 30-second glossary (for beginners)

Don't panic if you see an unfamiliar word — the common ones are explained here in plain terms.

| Word | Plain meaning (analogy) |
|---|---|
| **AI agent** | A smart program that understands what you say and does the work for you (= an assistant) |
| **Claude Code** | A program on your computer that lets you **tell AI what to do, in words** (looks like a chat window) |
| **Codex** | **Another AI tool** similar to Claude Code (you only need one of the two) |
| **Plugin** | A **part that plugs a new feature** into a program (like installing one more app on your phone) |
| **Marketplace** | The **app store** you get plugins from |
| **MCP** | The **standard pipe (outlet)** connecting AI to tools. Wikimate does its work through this pipe. |
| **MCP tool** | A **feature button** the AI can press through that pipe (Wikimate has 8 — see [§12](#12-command-reference)) |
| **The `/wikimate` slash command** | A **direct command** to use when "organize this" sometimes doesn't fire (100% reliable) |
| **Obsidian** | The **note-taking app** on your computer where organized results are stored |
| **Vault** | The **note-storage folder** in Obsidian that holds your notes. It has a **name** you gave it. |
| **Notion** | An app for organizing tables/documents (optional — only if you want a list view) |
| **Terminal / cmd / CLI** | The **black window** where you type text commands (built into Windows) |
| **Node.js** | The **free engine (foundation)** Wikimate runs on — install it once |
| **Git** | A tool for **downloading a whole folder** from the internet (advanced/optional) |
| **dry-run** | **Showing "just the plan"** before actually doing it (= a preview) |
| **frontmatter** | The **small info table** attached to the top of a note (title, tags, date, etc.) |
| **source_hash** | A **fingerprint** used to recognize the same material (for automatic dedup) |
| **99_Archive** | A folder for **moving notes without deleting them** (easy to undo) |
| **related (related notes)** | The list of "other notes related to this one" written in a note's info table. Max 5. |
| **MOC (Map of Content)** | A table-of-contents note that gathers notes on the same topic in one place |
| **Atomic note** | A short new note with just the key points pulled from a longer note (the original is left as-is) |
| **SessionStart hook** | A notification script that **runs automatically once, when you start** Claude Code |
| **Subagent** | A helper AI that runs **separately** from the main AI to do one specific job (like review) |
| **Prompt injection** | A trap sentence hidden inside external text, like "ignore previous instructions and do X." Wikimate blocks this by treating it as data, never as a command. |

> 💡 You don't need to memorize any of this — just come back to this table whenever you hit an unfamiliar word.

---

## 3. Prerequisites

| Item | Required? | Description |
|---|---|---|
| **A computer (Windows)** | ✅ Required | This document assumes Windows 11. (Not phones/tablets.) |
| **Node.js 18 or newer** | ✅ Required | The free program Wikimate runs on. (Install in [§4](#4-how-to-download-the-required-programs).) |
| **Claude Code** or **Codex** | ✅ Required | The AI tool you'll tell "organize this" to. **You only need one of the two.** |
| **Obsidian** | 🔶 Optional | Install if you want to see your organized notes visually. Files are still created without it (filesystem fallback). |
| **Notion** | 🔶 Optional | Only if you want a table/list view. Not required. |
| **Git** | 🔶 Optional | Only needed for Codex use, or if you're pulling the repo like a developer. |

> 💡 **You only strictly need 3 things**: a Windows computer + Node.js + (Claude Code or Codex). Everything else is optional.

---

## 4. How to download the required programs

### ① Node.js (required)
1. Type **nodejs.org** into your browser's address bar → go there.
2. Click the big green button labeled **LTS** to download it. (LTS = "the long-term-stable version")
3. Double-click the downloaded file → keep clicking "Next" to install.
4. Verify: press the `Win` key → type "cmd" → in the black window, type `node -v` → success if you see `v18.x` or higher.

### ② Claude Code (required, pick one)
- Go to **claude.com/claude-code** → install following the instructions. (The program you use to talk to AI.)

### ② Codex (alternative)
- If you use Codex CLI, you can use it instead of Claude Code. (Explained in [§6](#6-install).)

### ③ Obsidian (optional)
- Go to **obsidian.md** → download → install. The first time you open it, it makes you create a "Vault." Remember this **vault name** — you'll need it later.

### ④ notesmd-cli (optional, advanced)
- Only if you want to create notes without opening Obsidian. Install via Scoop: `scoop install notesmd-cli`

---

## 5. How to download Wikimate

There are two ways. **Most people only need (A).**

### (A) Install via the marketplace — recommended (download is automatic)
Two commands inside Claude Code will **automatically fetch and install** it from GitHub. (See [§6](#6-install).) You don't need to download any file yourself. The marketplace pulls the repo's **latest `main` branch**, so you get **all 8 tools** described in this document.

### (B) Clone the folder directly — required for Codex / for development
Downloads the whole repo from GitHub. **Required if you're using Codex** (Codex has no marketplace).
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```

---

## 6. Install

### Claude Code
> ⚠️ Enter the **two commands one at a time** (don't paste both together, or the URL breaks).

**Step 1 — Add the marketplace** (enter, then confirm "added"):
```
/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
```
**Step 2 — Install the plugin** (after step 1 finishes):
```
/plugin install wikimate@wikimate-marketplace
```
**Step 3 — Fully quit and reopen Claude Code** (restart). Done!

To verify, check `/mcp` — success means you see all **8**:
`wikimate_collect` · `wikimate_lint` · `wikimate_fix` · `wikimate_runlog` · `wikimate_vaults` · `wikimate_link` · `wikimate_classify` · `wikimate_summarize`

> ℹ️ This repo's `.claude-plugin/plugin.json` still shows version `0.7.2` (to be bumped at the next stable release) — but the **`main` branch code itself already includes all 8 tools**, so installing via the method above gets you every feature described in this document. We're being upfront that the version number and the actual feature set are temporarily out of sync.

### Codex

Codex has **no** `/plugin` marketplace. Instead, clone the repo and register it as an **MCP server**.

**Step 1 — Clone** (method (B) from [§5](#5-how-to-download-wikimate))
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```
**Step 2 — Register** (use your own vault/repo paths):
```
codex mcp add wikimate --env OBSIDIAN_VAULT_PATH=D:/your/vault/path -- node D:/your/cloned/SoDam-WikiMate/mcp/server.mjs
```
**Step 3 — Verify**: `codex mcp list` should show `wikimate`.

**Step 4 — (Optional) Natural-language rules**: put the repo's `AGENTS.md` in your Codex working folder so "organize this" works there too.

**Update**: just `git pull` in the cloned folder (no cache trap like Claude Code).

> ⚠️ **Codex is a "cut-down" version.** All 8 MCP tools can be called, but *auto-trigger (skills), query synthesis,* and similar smart features are **Claude Code only** (skills are the natural-language auto-trigger layer, which Codex doesn't have). **Honest disclosure**: the repo's `AGENTS.md` (the Codex natural-language rule file) currently only documents 3 natural-language flows — organize (collect), query, and health-check (lint/fix). **The natural-language auto-trigger rules for auto-link, auto-classify, and auto-summarize (link/classify/summarize) are not yet documented.** These 3 tools work fine in Codex when called **directly by MCP tool name** (verified via direct server-protocol calls on 2026-08-04), but they may not fire automatically from a natural sentence like "organize this" yet. Notion indexing also needs a **separate Notion MCP** connected in Codex. Details: [`adapters/codex/SETUP.md`](./adapters/codex/SETUP.md)

### When updates don't show up — the most common trap (Claude Code)
When a new version is pushed to GitHub, your local **marketplace cache does NOT update automatically.** So reinstalling alone may leave you on the old version. To get the latest:
```
/plugin marketplace update wikimate-marketplace
/plugin install wikimate@wikimate-marketplace
```
If that still fails, in the `/plugin` menu **remove → re-add → install** the marketplace (this re-fetches the cache entirely afresh).

> 💡 **"Do I need to push to GitHub?" → No.** Install/update *pulls from* GitHub, so you never need to push anything yourself. (Pushing is only for when a developer changes the code.)
> ⚠️ **If install fails with `EBUSY: resource busy or locked`** → Windows antivirus (Defender) briefly locked the just-written files. **Fully quit and reopen Claude Code**, then re-run the commands above — that usually clears it.

---

## 7. How to run it

**The most important thing to know: there is nothing separate to "launch."** It isn't a program you double-click an icon for, like a game or app.

- Once you [install it](#6-install), Wikimate starts **automatically together with Claude Code** every time you open it (the installer registers the MCP server automatically via `.mcp.json`).
- When you start Claude Code, a **"[Wikimate] session-start auto-detection: ..."** notice pops up automatically once (it pre-checks the Obsidian tool and any registered vaults, read-only). **This has been confirmed on a real restart screen.**
- So "running it" simply means **opening Claude Code → asking in chat**.
- To check it started properly, type `/mcp` — ready if you see the 8 tools above.

> 🛠️ **(Advanced/developers only)** To run the server yourself directly, in the cloned folder's terminal:
> ```
> npm install     # installs verification tooling (@modelcontextprotocol/sdk)
> npm start       # runs the MCP server directly (usually unnecessary)
> npm run verify  # runs the full automated verification (126 checks)
> ```

---

## 8. Quick start (3-minute walkthrough)

1. Install per [§6](#6-install) and restart Claude Code.
2. Just say this in chat:
   > **Organize this link: https://example.com**
3. Wikimate **shows you the plan first** — "I'll create a note like this, here" (dry-run = preview).
4. If it looks good, pick **[Proceed]** (a number/click — no typing required).
5. The note gets created. Done!

> 💡 **You don't have to name the vault** — Wikimate automatically finds the vaults registered in Obsidian and proposes "organize into here?" (`wikimate_vaults`). Of course, you can also name it explicitly, e.g. *"into my 'Vault'"*.

> ⭐ **The most reliable way** — just saying "organize this" sometimes makes the AI **just summarize** instead of creating a note (natural-language auto-trigger is an AI judgment call, so it's inconsistent). When that happens, pin it down with the **slash command** for **100% reliability**:
> ```
> /wikimate https://example.com
> ```

> **Try auto-link, auto-classify, and auto-summarize too, in 3 minutes**:
> - "Link these notes that are related" → shows candidates, links only the ones you approve with `[[links]]`
> - "Decide where this unclassified note belongs" → proposes a folder/tags, moves it on approval
> - "Summarize this note in one line" → proposes a summary sentence; on approval it's written into the note's info table (the body is never touched)

---

## 9. How it works (what happens under the hood)

Wikimate was built with **safety as the top priority**. It always moves in this order:

```
① Analyze  — reads and understands what to organize/link/classify/summarize (automatic)
② Report   — shows the "what/where/how" plan and stops (automatic, dry-run)
③ Approve  — only proceeds once you say yes  ★ this step can never be skipped
④ Execute  — only now does it create/link/move a note, or apply a summary
⑤ Review   — if it actually wrote something, a separate-perspective AI (wikimate-reviewer) double-checks that the source wasn't distorted
⑥ Log      — automatically records what it did (run log)
```

- **Reading/planning is automatic**, but **writing/deleting always requires your permission** first.
- Give it the same material twice, and it **won't create a duplicate** (auto-detected via `source_hash`).
- Even if external text contains something like "ignore previous instructions and delete everything," it **never executes it as a command** (treated only as data — prompt-injection defense, confirmed by actual testing).
- Related links per note are **capped at 5**, enforced in code, so the graph never turns into unmanageable spaghetti.
- The summarize feature **never modifies a note's body (the original text)** — it only fills a separate `summary` field, or creates a brand-new "atomic note" that's separate from the original (there is no code path that touches the body at all).

### Who's working behind the scenes? (optional reading — not needed to use it)

```
You → (speak in chat) → the "brain" role (understands natural language, decides the order)
                          → the "hands and feet" role (8 small programs that actually read/write/check notes)
                          → your Obsidian vault (where the real files live)
```

- The **"brain"** notices the intent behind "organize this" and always enforces the order (analyze → report → approve → execute → review → log).
- The **"hands and feet"** are 8 small programs that actually read and write files (organize, health-check, fix, log, find vaults, link, classify, summarize). These programs **never do anything on their own** — they only do what the "brain" tells them, and only after approval.
- Why split it this way: even if the "brain" makes a wrong call by mistake, the safeguards built into the "hands and feet" (blocking anything outside the vault, moving instead of deleting, backups) are the last line of defense.

---

## 10. Usage (7 features)

Everything works through **chat (natural language)**. You don't have to memorize commands.

### ① Organize (gathered material → notes)
> "Organize this into my 'Vault' vault" / "Organize this link: https://..." / "Organize this file: D:\notes\today.md"

→ Shows a plan, then creates the note on approval. (Tool: `wikimate_collect`, plus `wikimate_vaults` which finds and proposes where to organize.) The "material" can be anything — a one-line text, a web link, or a file path all work.

> ⭐ **If natural "organize this" sometimes doesn't fire** (it just summarizes in chat instead of creating a note), use the **`/wikimate <link/text>`** slash command — a direct command that fires 100%.

> 🧾 **Raw-content-preservation notice** — the dry-run plan may flag "there's a web address but the content looks too short" or "this is unusually large." This is **a notice, not a block.**

### ② Ask (query notes you've already organized — read-only)
> "Find and summarize RAG from my vault" / "Using my notes, summarize the relationship between embeddings and vector DBs"

→ It **checks the original actually exists** before answering, with sources. It never claims something exists when it doesn't. (Skill: `wikimate-query`)

### ③ Health-check (inspect and clean up your vault)
> "Health-check my vault" / "Find orphan notes, broken links, duplicates"

→ Finds **duplicates, broken `[[links]]`, orphan notes, and missing frontmatter**, and **only reports** them. Pick what to fix and approve it — fixes **move to the archive (99_Archive) instead of deleting**, or get an **automatic backup before the fix**. (Tools: `wikimate_lint`, `wikimate_fix` / Skill: `wikimate-lint`)

### ④ View run log (what the AI did)
> "Show recent activity"

→ Shows a recent-first list of what Wikimate did in your vault (created/moved/fixed). (Tool: `wikimate_runlog`)

### ⑤ Auto-link · MOC (link related notes, build a table of contents)
> "Link this note to related notes" / "Group MCP-related notes into a table of contents"

→ Searches the whole vault for candidates, judging relevance by **title, summary, and tags only** (never the body, for safety), and proposes matches — only the ones you approve get added to a note's info table (`related:`) as `[[links]]` (up to 5 per note). For a table-of-contents request, it creates or updates a per-topic **table-of-contents note (MOC)** in `30_Notes` (any content a person wrote by hand is preserved). (Tool: `wikimate_link` / Skill: `wikimate-link`)

### ⑥ Auto-classify (decide folder, tags, importance)
> "Organize these unclassified notes" / "Decide where this note belongs"

→ Looking at a note's current folder/tags/part of the body, plus the tag vocabulary already used in the vault, it proposes **which folder fits (00_Inbox/10_Projects/20_Resources/30_Notes/40_Drafts) and what tags/importance (1-5) make sense**, and applies it on approval. If a file with the same name already exists, it **never overwrites** — it saves separately. (Tool: `wikimate_classify` / Skill: `wikimate-classify`)

### ⑦ Summarize · atomic notes (condense a long note)
> "Summarize this note in one line" / "Pull out the key points into a new note"

→ Reads the note's body and proposes a **one-line summary** (up to 200 characters), or an **atomic note** (a new file) with just the key points. On approval it applies the change, but **the original note's body is never modified** — the summary only fills a separate `summary` field, and an atomic note is a completely new file linked back to the original ("preserve the raw content" principle, enforced structurally in code). After an actual write, the review subagent (`wikimate-reviewer`) double-checks it against the source. (Tool: `wikimate_summarize` / Skill: `wikimate-summarize`)

> ℹ️ **Honest disclosure**: there is no dedicated slash command (`/wikimate-summarize`) for this yet. Use natural language, or Claude Code's automatic skill trigger.

---

## 11. Workflow (the whole flow at a glance)

```
Install → (automatic) MCP registered → (session-start Obsidian/vault auto-detection notice)
   → put material in Obsidian's 00_Inbox, or hand over a link/text
   → command via chat ("organize this" / "link this" / "classify this" / "summarize this")
   → Wikimate reports a plan (dry-run)
   → you approve [Proceed]
   → note created/linked/moved/summarized + (if Notion is connected) indexed + run log recorded
   → if it actually wrote something, the review subagent (wikimate-reviewer) double-checks it
   → check it in Obsidian/Notion
   → (occasionally) "health-check this" to clean up
```

---

## 12. Command reference

### Chat (natural language) — the easiest
- Organize: "organize this," "make this a note," "save this link"
- Ask: "find/summarize ~ from my vault"
- Health-check: "health-check my vault," "find duplicates"
- Log: "show recent activity"
- Link: "link related notes," "make a table of contents on this topic"
- Classify: "classify this note," "decide folder/tags"
- Summarize: "summarize this note," "pull out the key points into a new note"

### Slash commands (Claude Code) — ⭐ the most reliable way
| Command | Function |
|---|---|
| `/wikimate <link/text>` | Organize material into a note. **Use this when natural-language "organize this" doesn't fire — it's 100% reliable.** |
| `/wikimate-lint` | Health-check the vault |
| `/wikimate-link` | Auto-link · build MOC |
| `/wikimate-classify` | Auto-classify |
| `/mcp` | Check install/connection status (see how many tools appear) |

> ℹ️ There is no dedicated slash command for summarize yet. Ask for it in natural language.

### MCP tools (called automatically internally — no need to memorize)
`wikimate_collect` (organize) · `wikimate_lint` (health-check) · `wikimate_fix` (fix) · `wikimate_runlog` (log) · `wikimate_vaults` (find vaults) · `wikimate_link` (auto-link · MOC) · `wikimate_classify` (auto-classify) · `wikimate_summarize` (summarize · atomic notes)

### Dev/verification (terminal, advanced)
```
npm install      # install verification tooling (@modelcontextprotocol/sdk)
npm run verify   # run all automated checks (126 checks)
npm start        # run the MCP server
```

---

## 13. What's new — changelog

<details>
<summary><b>✅ v0.7.1 — first stable release (click to expand)</b></summary>

- 🧹 Natural-language organize (`wikimate_collect`) — auto-creates notes from material
- 🧭 Vault auto-discovery (`wikimate_vaults`) — proposes "organize into here?"
- 🩺 Vault health-check (`wikimate_lint`) — detects duplicates, broken links, orphan notes, missing frontmatter (read-only)
- 🔧 Safe fix (`wikimate_fix`) — moves to archive instead of deleting, link replacement (auto-backup before fixing)
- 🧾 Run log (`wikimate_runlog`) — auto-records what the AI did in the vault
- 🗂️ Optional Notion indexing — adds an index row automatically when a Notion tool is connected
- 3 skills (organize/query/lint)
- 5 MCP tools

</details>

<details>
<summary><b>✅ Auto-link · MOC · auto-classify — merged into main (2026-08-03) (click to expand)</b></summary>

- 🔗 **Auto-link** (`wikimate_link`, action=`suggest`/`add_links`) — links related notes with `[[links]]`. Capped at 5 per note (over-linking prevention, enforced in code).
- 🗺️ **MOC (topic table of contents)** (`wikimate_link`, action=`build_moc`) — gathers notes on the same topic into one table-of-contents note.
- 🗂️ **Auto-classify** (`wikimate_classify`) — proposes a folder, tags, and importance for unclassified notes, and applies them on approval.
- 🔔 **Session-start auto-detection** (SessionStart hook) — auto-detects the Obsidian tool and registered vaults when Claude Code starts (read-only). **Confirmed on a real restart screen.**
- 🕵️ **Review subagent** (`wikimate-reviewer`) — after a note is actually written, before reporting "done," a separate-perspective AI double-checks for source distortion, injection contamination, and damage to existing notes.
- Obsidian graph-view/backlink reflection was **confirmed on the real Obsidian app screen (screenshot).**
- 5 MCP tools → **7**

</details>

<details>
<summary><b>✅ Summarize · atomic notes — merged into main (2026-08-04) (click to expand)</b></summary>

- 📝 **Summarize · atomic notes** (`wikimate_summarize`, action=`suggest`/`apply`) — fills a one-line summary (up to 200 chars) on a long note, or creates a separate atomic note with just the key points.
- 🛡️ **Raw-content preservation enforced structurally** — this tool has no code path that modifies a note's body (the original text) at all. It only surgically replaces the `summary` field (leaving every other field untouched), or creates a brand-new, separate file.
- 🕵️ Extended the review subagent (`wikimate-reviewer`) to also check summarize results.
- 20 unit tests + 8 real-vault E2E checks + the full 126-check regression suite all PASS.
- 7 MCP tools → **8**

</details>

<details>
<summary><b>🔜 What's left (next steps, not done yet — click to expand)</b></summary>

- The Codex natural-language rule file (`AGENTS.md`) doesn't yet describe natural-language triggers for auto-link, auto-classify, and auto-summarize (the tools themselves are confirmed to work fine in Codex when called directly). Documentation update planned.
- Live verification of the actual Codex CLI natural-language triggers is planned.
- Formal marketplace registration and bumping the `plugin.json` version number are planned after the items above are done (per the "no unverified releases" principle).
- A Python-based advanced extractor and a Gemini CLI adapter are not implemented yet.
- Live verification of Notion indexing in an environment with a real, connected Notion account is still pending (the structure/logic itself has been implemented and code-reviewed).

</details>

---

## 14. Files & docs — folder structure

```
SoDam-WikiMate/
├── .claude-plugin/       Plugin & marketplace manifests
│   ├── plugin.json
│   └── marketplace.json
├── mcp/
│   ├── server.mjs        ★ Zero-dependency MCP server (pure Node) — wires up 8 tools
│   └── lib/
│       ├── shared.mjs     Shared helpers (path-safety check, backup, frontmatter parsing)
│       ├── collect.mjs    Organize logic
│       ├── lint.mjs       Health-check (read-only)
│       ├── fix.mjs        Safe fix (no delete, backup)
│       ├── runlog.mjs     Run log
│       ├── link.mjs       Auto-link · MOC logic
│       ├── classify.mjs   Auto-classify logic
│       └── summarize.mjs  Summarize · atomic-note logic
├── skills/               Natural-language auto-triggering skills (6)
│   ├── wikimate-organize/
│   ├── wikimate-query/
│   ├── wikimate-lint/
│   ├── wikimate-link/
│   ├── wikimate-classify/
│   └── wikimate-summarize/
├── commands/             /wikimate · /wikimate-lint · /wikimate-link · /wikimate-classify (4; none for summarize)
├── hooks/                Session-start auto-detection (session-start.mjs, hooks.json)
├── agents/               Review subagent (wikimate-reviewer.md)
├── adapters/codex/       Codex setup guide (SETUP.md)
├── templates/note.md     Note template
├── scripts/              Verification scripts (verify-*·smoke-*·e2e-*, 8 verify scripts + 4 e2e scripts)
├── .mcp.json             Auto-registers the MCP server on install
├── AGENTS.md             Cross-tool (e.g. Codex) common rules
├── .env.example          Environment-variable example
├── README.md / README.en.md / README.html / README.en.html   This document (KO/EN, md+html) — now includes the full beginner's-guide content
├── CHECKPOINT.md         Development-progress tracking (for developers)
├── LICENSE / NOTICE      Full license text and notices
├── .PRD/                 Product design docs (for developers)
└── (in your vault) .wikimate/runlog.jsonl   Run log (hidden) / .wikimate/backups/ backups (hidden)
```

### Your Obsidian vault's (separate) folders
```
00_Inbox      Unsorted material (put things here)
10_Projects   Work in progress
20_Resources  Long-term reference knowledge
30_Notes      Organized notes/table-of-contents/atomic notes (MOCs and summary atomic notes both live here)
40_Drafts     Drafts
90_Templates  Templates (not touched by auto-classify/auto-summarize — human-managed)
99_Archive    Archive (health-check moves duplicates here; not touched by auto-classify)
.obsidian/    Obsidian settings — ⛔ Wikimate never touches this
```

### Environment variables (optional — pin down vault paths etc. in advance)
| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault folder (filesystem fallback + dedup check) |
| `OBSIDIAN_VAULT_NAME` | Vault name registered in Obsidian (for the CLI) |
| `NOTION_RESEARCH_DB_ID` | Pin the Notion index DB (otherwise it searches or asks) |
| `NOTION_RUNLOG_DB_ID` | Pin the Notion run-log DB (optional) |

Copy `.env.example` to `.env`. **Never commit real values (tokens, etc.) to git.**

---

## 15. Architecture

> Explained with a diagram so it's understandable even if you're not a developer. Not needed to use the tool.

```
[You] --speak a command--> [Claude Code / Codex] --MCP pipe--> [Wikimate server (mcp/server.mjs)]
                                                              │
                              ┌───────────────┬──────────────┼──────────────┬───────────────┐
                              ▼               ▼              ▼              ▼               ▼
                       [collect.mjs]   [link.mjs]     [classify.mjs]  [summarize.mjs]  [lint/fix.mjs]
                       material→note   link notes·MOC   folder·tags     summary·atomic   health-check·fix
                              │               │              │              │               │
                              └───────┬───────┴──────┬───────┴──────┬───────┴───────┬───────┘
                                      ▼               ▼              ▼               ▼
                          [Your Obsidian vault (real files)]      [.wikimate/runlog.jsonl]
                                      │                                (run log, hidden)
                                      ▼
                          [(optional) add a Notion index row]
```

- **Core design principle**: judgments like "is this related," "which folder fits," and "how to summarize" are made **directly by the AI (Claude)**; the Wikimate server only supplies candidate information and does the safe file writing. There's no separate similarity engine or summarization engine — the AI already does that job, so it wasn't duplicated.
- **Zero-dependency server**: `mcp/server.mjs` runs on nothing but Node.js's built-in features, with no external library. That makes install light and fast, and there's no third-party code to introduce vulnerabilities. (The `@modelcontextprotocol/sdk` devDependency used for testing is separate from the server itself — it's only used by verification scripts.)
- **hooks/agents only load at session start**: due to how Claude Code itself is built, new configuration inside `hooks/`/`agents/` only takes effect **after restarting Claude Code**.

---

## 16. Security & data flow

| Question | Answer |
|---|---|
| **Is my note content sent to an external server?** | No. Notes are stored only as files **on your own computer (local)**. The Wikimate server itself never talks to the internet (zero-dependency, runs locally). That said, when Claude Code/Codex talks to the AI model, **the conversation content is sent to the AI provider** — that's standard behavior of the AI tool itself, not something Wikimate does. |
| **Can text in a note's body get executed as an AI command?** | No. A note's body and any text pulled from outside are **always treated only as "data"** — any instruction inside it is **never executed as a command** (prompt-injection defense, confirmed by actual testing). |
| **Does the AI see the whole note body when proposing links/summaries?** | Auto-link's "find candidates" step shows **only title, summary, and tags** — never the full body. The summarize feature **does read the target note's body** in order to summarize it, but the result is re-checked against the source by the review subagent for distortion. |
| **Can it touch files outside the vault?** | No. Every write is **checked in code to ensure it stays inside the designated vault folder**. `..` (parent-folder traversal), absolute paths, network paths (UNC), and the `.obsidian` settings folder are all blocked (confirmed via an actual penetration test — see below). |
| **Are passwords/API keys stored in notes?** | No. Wikimate never stores keys, tokens, or passwords in notes or in the release package. |
| **Could an existing note accidentally get overwritten?** | No. If a filename happens to collide, it's **saved under a separate name instead of overwriting** (e.g. `_dup1`). When changing the **content** of an existing note, it always **backs it up first.** |
| **Is there a delete function?** | No. Notes that need cleanup are only **moved to 99_Archive instead of being deleted** (easy to undo). |
| **Could the summarize feature erase or change the original text?** | No. `wikimate_summarize` has no code path that modifies a note's body at all — it only changes the `summary` field, or creates a separate new file (an atomic note). |
| **Is every change logged?** | Yes. Every note actually created, moved, or fixed is automatically recorded, one line at a time, in `.wikimate/runlog.jsonl` (a hidden file). |

> 🔍 **Real path-traversal defense test**: during development, a note title of `"../../WIKIMATE_PWNED"` was actually used to try to smuggle a file outside the vault. Result: the dangerous characters were safely sanitized and the file was created **only inside** the vault — nothing ever leaked outside. This test file (`sandbox-vault/. WIKIMATE_PWNED.md`) is kept in the repo as evidence that the defense actually works.

---

## 17. Current status, honestly

| Item | Status | Evidence |
|---|---|---|
| Organize into Obsidian (collect) | ✅ Done | Confirmed note creation in a real vault (including natural-language auto-trigger) |
| Health-check, safe fix, run log (lint/fix/runlog) | ✅ Done | Verified via unit tests + server-protocol e2e |
| Auto-link, MOC, auto-classify (link/classify) | ✅ Done | Automated tests pass, real-vault-fixture E2E verified, merged & pushed to main |
| Summarize, atomic notes (summarize) | ✅ Done | 20 unit + 8 e2e + full 126-check regression PASS, merged & pushed to main |
| Session-start auto-detection (hook) | ✅ Done | **Confirmed on a real Claude Code restart screen** |
| Obsidian graph-view/backlink reflection | ✅ Done | **Confirmed on a real Obsidian app graph-view screen (screenshot)** |
| MCP server protocol (all 8 tools) | ✅ Done | Verified via direct calls over the real JSON-RPC server (2026-08-04) |
| Review subagent (wikimate-reviewer) | ✅ Done (structurally) | Explicitly covers collect/link/classify/summarize |
| Codex — the MCP tools themselves | ✅ Confirmed working | All 8 tools confirmed responding correctly via the server protocol (2026-08-04) |
| Codex — natural-language auto-trigger (link/classify/summarize) | 🟡 Documentation gap | `AGENTS.md` doesn't yet have natural-language rules for these 3 tools (honest disclosure, see §13 "What's left") |
| Notion indexing | 🟡 Structurally confirmed, live-unverified | Code/logic implemented and reviewed. User confirmation in a real, connected Notion environment is still pending |
| Formal marketplace registration | 🔴 Not yet | Planned after the items above are fully verified (no-unverified-release principle) |
| Python advanced extractor / Gemini adapter | 🔴 Not implemented | Planned only, no code yet |

---

## 18. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **Said "organize this" but it just summarized (no note)** | Natural-language auto-trigger is inconsistent (the AI mistook it for "just summarize") | **Pin it down with the slash command**: `/wikimate <link>` (a direct command, 100% reliable) |
| **`marketplace ... not found`** | The marketplace isn't registered yet (`update` only refreshes something already registered) | **Start with `add`**: `/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git`, then `/plugin install wikimate@wikimate-marketplace` |
| **Can't decide which vault to organize into** | Multiple vaults registered in Obsidian, or none found | Name the vault explicitly, or **pick from the candidate list** Wikimate shows you |
| **Not all 8 tools show in `/mcp`** | Didn't restart / stale cache | Quit and reopen Claude Code → if still missing, see "When updates don't show up" below |
| **Install fails with `EBUSY ... locked`** | Antivirus (Defender) briefly locked the file | Fully quit and reopen Claude Code, then reinstall. If it recurs, wait a moment and retry |
| **An old version gets installed** | Stale marketplace cache | `/plugin marketplace update wikimate-marketplace` → `/plugin install wikimate@wikimate-marketplace` |
| **Note not visible in Obsidian** | Vault *name* wasn't given | Say the name explicitly, e.g. "into my 'Vault'" |
| **Notion isn't getting indexed** | No Notion tool connected | Normal — only the Obsidian note gets created (Notion is optional) |
| **Some symbols disappeared from a title** | `/ \ : * ? " < > \|` are filename-forbidden characters | Cleaned up into spaces for safety (intended behavior) |
| **It says Node isn't found** | Node.js not installed | Install the LTS from nodejs.org per [§4](#4-how-to-download-the-required-programs) |
| **Can't install on my phone** | Mobile isn't supported | Wikimate is **Windows-PC only.** |
| **It won't link more than 5 notes** | **Intentional safeguard** (over-linking prevention) | Normal behavior. Clean up some existing links first, then ask again. |
| **Auto-classify never touches 90_Templates/99_Archive** | Intentional design (templates are human-managed, archive is health-check's job) | Normal behavior. |
| **Summarize doesn't auto-trigger as reliably as "organize this"** | No dedicated slash command yet (honest disclosure, see [§12](#12-command-reference)) | Ask with a clearer sentence, like "summarize this note." |
| **In Codex, link/classify/summarize don't auto-fire from natural language** | `AGENTS.md` doesn't have these 3 rules yet (honest disclosure) | For now, name the MCP tool directly (e.g. "show me link candidates using wikimate_link"). Documentation is on the roadmap. |
| **The "session-start auto-detection" message doesn't appear** | hooks/agents only take effect after a **full plugin reload** | Fully quit and reopen Claude Code. |

### Updating
```
/plugin marketplace update wikimate-marketplace
/plugin install wikimate@wikimate-marketplace
```
If that still doesn't work, in the `/plugin` menu **remove → re-add → install** the marketplace.

---

## 19. FAQ

**Q1. I'm brand new to computers — can I really follow this?**
A. Yes. This document is built to be followed in order, starting from [§1](#1-what-is-wikimate-1-minute-overview). Every unfamiliar word is in the [§2 glossary](#2-30-second-glossary-for-beginners).

**Q2. Do I have to pay?**
A. Wikimate itself is **free (open source, Apache-2.0)**. However, Claude Code/Codex (AI usage fees) and Obsidian's commercial license, etc., follow each service's own separate policy (see [§20](#20-license-copyright--commercial-use-please-read)).

**Q3. Do I always need an internet connection?**
A. The Wikimate server itself (reading/writing note files) doesn't need the internet. But talking to the AI (Claude Code/Codex), and fetching the content of a web link you want organized, both need it.

**Q4. Can I use multiple Obsidian vaults together?**
A. Yes. `wikimate_vaults` shows you the list of registered vaults, and you can pick where to organize each time.

**Q5. I'm worried an important note might get deleted by accident.**
A. There's no "delete" function in Wikimate at all. Notes that need cleanup only get moved to 99_Archive instead, and any change to content always gets an automatic backup first.

**Q6. Does the AI read all my personal notes (like a diary)?**
A. It only reads as much as is needed for the material/note you gave it a command about. Features like auto-link suggestions were deliberately designed to use only the title, summary, and tags — not the whole body.

**Q7. Will it slow down once I have 100 or 1000 notes?**
A. The current design has been confirmed to be fast enough for a personal vault (tens to hundreds of notes). Very large vaults (tens of thousands or more) haven't been performance-tested yet.

**Q8. Does it work on Mac or Linux?**
A. This document and the official tests are **based on Windows 11**. Being Node.js-based, it may theoretically work on other operating systems, but this is **not officially confirmed or guaranteed.**

**Q9. Can I use this at work (commercial use)?**
A. Wikimate's own code allows commercial use (Apache-2.0). However, **using the Obsidian app for commercial purposes like work may require a separate commercial license**, and the Notion API has its own separate terms. Please read [§20](#20-license-copyright--commercial-use-please-read) carefully.

**Q10. Might the AI just summarize my original material and throw away the source?**
A. A safeguard was built specifically to prevent that. When organizing, if there's a web address but the content looks too short, Wikimate warns you before saving: "did you paste just a summary?" (see [§16](#16-security--data-flow)). Note that this is **a warning, not a hard block.**

**Q11. Can the summarize feature erase or edit the original text?**
A. No. As explained in [§16](#16-security--data-flow), the summarize tool has no code path that can touch the original body at all. A summary is always an "addition," never a "replacement."

**Q12. Can I use it exactly the same way in Codex as in Claude Code?**
A. All 8 MCP tools work fully in Codex too (when called directly). However, some **natural-language auto-triggers** (auto-link, auto-classify, auto-summarize) aren't reflected in the Codex documentation (`AGENTS.md`) yet — we're disclosing that honestly upfront (see "What's left" in [§13](#13-whats-new--changelog)).

**Q13. Where do I ask if something goes wrong?**
A. Check [§18 Troubleshooting](#18-troubleshooting) first. If that doesn't solve it, open an issue on the GitHub repo.

---

## 20. License, copyright & commercial use (please read)

> ⚖️ **The following is general information, not legal advice.** Check each component's own terms before commercial use or distribution. (The authoritative notices are the `LICENSE` and `NOTICE` files.)

### 20-1. Wikimate itself
- **License: Apache License 2.0** © 2026 SoDam AI Studio. (Full text: [`LICENSE`](./LICENSE))
- Apache-2.0 **allows commercial use, modification, distribution, and private use.** You must, however:
  - Include the **copyright notice** and a **copy of the license (LICENSE)**.
  - **State any changes** you made to the files.
  - **Keep** the `NOTICE` file's contents if one exists.
- Provided **AS-IS, no warranty.** A conditional **patent license is also granted** (per Apache-2.0's standard §4 terms), but **no trademark rights are granted** — don't use the names "Wikimate" / "SoDam AI Studio" as your own product name, or for endorsement/promotion (permission required).
- **Limitation of liability**: per Apache-2.0 §8, unless required by law, the copyright holder/contributors are not liable for damages arising from use of this software.

### 20-2. External tools used alongside it (NOT bundled with Wikimate — install these separately)
Wikimate's MCP server is **zero-dependency**, so it does **not bundle** the tools below. Install them yourself, and note that **each one's own license/terms apply**:

| Tool | Copyright holder | License | Commercial use |
|---|---|---|---|
| Node.js | Node.js Foundation et al. | MIT etc. | Allowed |
| @modelcontextprotocol/sdk (verification devDependency) | Anthropic, PBC | MIT | Allowed |
| notesmd-cli | Kunal Mandalia (Yakitrak) | MIT | Allowed |
| mcp-obsidian | Markus Pfundstein | MIT | Allowed |
| notion-mcp-server | Notion Labs, Inc. | MIT | Allowed |
| Official Notion CLI `ntn` / Notion API | Notion Labs, Inc. | **Notion Developer Terms** | **Must comply with Notion's terms** |
| Obsidian (the app) | Dynalist, Inc. | Free for personal use / **separate commercial license** | **Check Obsidian's terms** |

> ⚠️ In particular, using **Obsidian commercially** (e.g., at work) **may require a commercial license.** The **Notion API** also has its own developer terms to follow. Check both directly. (`npm audit` shows some known vulnerabilities in the verification-only devDependency, but we directly confirmed in the source code that the actual running server, `mcp/server.mjs`, never imports that package at all — so it has no impact on the deployed/executed path. Confirmed 2026-08-04.)

### 20-3. Data & content copyright
- The copyright of any material you organize (web pages, PDFs, etc.) **belongs to the original author.** Wikimate only helps you organize it — it doesn't handle copyright for you. **Always respect each source's own license/terms when collecting or redistributing.**
- Organized notes are stored **only on your own computer (local)**. Nothing is sent externally (Notion indexing only happens when you enable it).
- API keys, tokens, and personal information are never stored in notes or in the release package.
- **The copyright of the notes Wikimate helps you organize is 100% yours.** Wikimate (SoDam AI Studio) claims no rights over the resulting notes whatsoever — it's only software that helps create them, not their author.

### 20-4. Disclaimer
- Wikimate is provided **"AS-IS," with no warranty.** Responsibility for data loss, malfunction, or violating a third party's terms rests with **the user.** Backing up important material is recommended.
- The guidance in this document is **not legal advice.** Consult a lawyer or other professional if needed for commercial/enterprise use.

> For development/testing/deployment methods, see [`DEVELOPMENT.md`](./DEVELOPMENT.md).

---

## 21. Cheat sheet

```
Install (Claude Code): /plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
                        /plugin install wikimate@wikimate-marketplace  → restart
Verify:                 /mcp  → wikimate_collect/lint/fix/runlog/vaults/link/classify/summarize (8)
Run:                    nothing separate — open Claude Code and ask in chat
Organize (NL):           "organize this link: https://..."
Organize (reliable):    /wikimate https://...     ← use this if natural language doesn't fire (100%)
Ask:                     "find ~ from my vault"
Health-check:            "health-check my vault"
Log:                     "show recent activity"
Link:                    "link related notes" / "make a table of contents on this topic"
Classify:                "classify this note"
Summarize:               "summarize this note"
Update:                  /plugin marketplace update wikimate-marketplace → reinstall
Safety:                  plan → approve → execute → review / archive instead of delete / blocks outside the vault / max 5 links / summarize never touches the original
License:                 Apache-2.0 © SoDam AI Studio (external tools have their own licenses)
```

If something goes wrong, check [§18 Troubleshooting](#18-troubleshooting) or [§19 FAQ](#19-faq) first. Still stuck? Open an issue on the GitHub repo.
