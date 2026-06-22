# Wikimate Beginner's Guide (English)

> This guide is written so that **someone new to computers, AI, messengers, apps, or smartphones** can follow it step by step.
> Plain words, top-to-bottom order — **just follow along**. (Target version: **v0.7.1**)
>
> 📄 This guide also exists as an identical **PDF** (`GUIDE.en.pdf`). The text content is exactly the same.

---

## 0. What is Wikimate? (1-minute idea)

It's an **AI assistant that tidies up your scattered material**.

Analogy — imagine receipts, notes, and links piled on your desk. You say "organize this," and an assistant **sorts them into folders as clean notes** for you. Just like asking a helper over a messenger chat, **you simply tell it in plain language.** That's Wikimate.

- Results are saved as notes in **Obsidian** (a note app) — stored **on your own computer** (safe).
- Optionally it also lists them in a **Notion** table (optional).
- It **never deletes or changes things on its own.** It always shows a plan first and waits for your "yes."

> One line: **Say "organize this," and it files your stuff as tidy notes in your note app.**

> 📱 **Which device?** Wikimate runs on a **Windows PC (desktop/laptop)**. It is **not installable on phones or tablets** (because the AI tools you command it with — Claude Code / Codex — are desktop tools).

---

## 1. Quick glossary (beginner must-know — 30 seconds)

Don't panic at unfamiliar words. Here are the common ones, in plain analogies.

| Word | Plain meaning (analogy) |
|---|---|
| **AI agent** | A smart program that understands your words and does work for you (= an assistant) |
| **Claude Code** | A program that lets you **command an AI in plain language** on your computer (looks like a chat box) |
| **Codex** | **Another AI tool** similar to Claude Code (you only need one) |
| **Plugin** | A **part that adds a new feature** to a program (like installing one more app on your phone) |
| **Marketplace** | An **app store** where you get plugins |
| **MCP** | A **standard pipe (outlet)** connecting an AI to tools. Wikimate works through this pipe. |
| **MCP tool** | A **feature button** the AI can press through that pipe (Wikimate has 5: organize, check, fix, log, find-vault) |
| **Slash command `/wikimate`** | A **direct command** to run it reliably when "organize this" doesn't auto-fire (works 100%) |
| **Obsidian** | A **note app** that stores notes on your computer (results are saved here) |
| **Vault** | The **note folder** in Obsidian that holds your notes. You give it a **name** when creating it. |
| **Notion** | An app for tables/docs (optional — only if you want a list table) |
| **Terminal / cmd / CLI** | The **black window** where you type text commands (built into Windows) |
| **Node.js** | The **free engine** that lets Wikimate run — install once |
| **Git** | A tool to **download a whole folder** from the internet (advanced/optional) |
| **Slash command** | A command starting with `/` in Claude Code (e.g. `/mcp`, `/plugin`) |
| **dry-run** | **Showing only "the plan" before actually doing it** (= preview) |
| **frontmatter** | A small **info table** at the top of a note (title, tags, date, etc.) |
| **source_hash** | A **fingerprint** that recognizes the same material (for dedup, automatic) |
| **99_Archive** | A folder that **moves notes instead of deleting** them (easy to undo) |

> 💡 No need to memorize. When an unfamiliar word appears, come back to this table.

---

## 2. Prerequisites (what you need first)

| Item | Required? | Notes |
|---|---|---|
| **A Windows PC** | ✅ Yes | This guide assumes Windows 11. (No phone/tablet support.) |
| **Node.js 18+** | ✅ Yes | A free program Wikimate runs on. (Install in step 3.) |
| **Claude Code** or **Codex** | ✅ Yes | The AI tool you give commands to. **Either one** is fine. |
| **Obsidian** | 🔶 Optional | Install it if you want to see the notes visually. Files are created even without it. |
| **Notion** | 🔶 Optional | Only if you want a table view. |
| **Git** | 🔶 Optional | Needed only for Codex or a developer-style download. |

> 💡 **You really only need 3 things**: a Windows PC + Node.js + (Claude Code or Codex). The rest are optional.

---

## 3. Downloading the required programs

### ① Node.js (required)
1. Go to **nodejs.org**.
2. Click the big green **LTS** button to download. (LTS = "the stable long-term version".)
3. Double-click the file → keep clicking "Next" to install.
4. Verify: press `Win` → type "cmd" → in the black window type `node -v` → if it shows `v18.x` or higher, success.

### ② Claude Code (required, pick one)
- Go to **claude.com/claude-code** and install as guided. (The program you command the AI with.)

### ② Codex (alternative)
- If you use the Codex CLI, you can use it instead of Claude Code (see step 6).

### ③ Obsidian (optional)
- Go to **obsidian.md** → download → install. On first run, create a "Vault." Remember the **Vault name** (you'll use it later).

### ④ notesmd-cli (optional, advanced)
- Only if you want to create notes without opening Obsidian. Install via Scoop: `scoop install notesmd-cli`

---

## 4. Getting Wikimate

Two ways. **(A) is enough for most people.**

### (A) Install via marketplace — recommended (auto-download)
Inside Claude Code, two commands download and install it **automatically** from GitHub (see step 5). No manual file download needed.

### (B) Download the folder — latest/dev
Clone the whole thing from GitHub. Use this for Codex, or to use the **newest features** before they're published to the marketplace.
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```

---

## 5. Install (Claude Code)

> ⚠️ Enter the **two lines one at a time** (pasting both at once breaks the URL).

**Step 1 — Add the marketplace** (Enter, confirm "added"):
```
/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
```
**Step 2 — Install the plugin** (after step 1):
```
/plugin install wikimate@wikimate-marketplace
```
**Step 3 — Restart Claude Code.** Done!

Verify: type `/mcp` → you should see five tools: **wikimate_collect · wikimate_lint · wikimate_fix · wikimate_runlog · wikimate_vaults**.

> 📌 **To use the very newest features (health-check, run log) right away**, download with (B), then install from that folder path:
> ```
> /plugin marketplace add C:\path\to\SoDam-WikiMate
> /plugin install wikimate@wikimate-marketplace
> ```

---

## 6. Install (Codex)

Codex has **no** marketplace (`/plugin`). Instead, register the folder as an **MCP server**.

**Step 1 — Clone**
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```
**Step 2 — Register** (use your own vault/folder paths):
```
codex mcp add wikimate --env OBSIDIAN_VAULT_PATH=D:/your/vault -- node D:/path/to/SoDam-WikiMate/mcp/server.mjs
```
**Step 3 — Verify**: `codex mcp list` should show `wikimate`.

**Step 4 — (Optional) Natural-language rules**: put the repo's `AGENTS.md` in your Codex working folder so "organize this" works too.
**Update**: just `git pull` in the cloned folder (no marketplace-cache trap like Claude Code).

> ⚠️ **Codex is a subset.** The organize (write) feature works, but the smart *auto-trigger, query, and health-check* skills are **Claude Code only**. Notion indexing also needs a **separate Notion MCP** connected in Codex. Details: `adapters/codex/SETUP.md`.

---

## 7. How to run (how do I start it?)

**Most important note: there is nothing to "launch."** Wikimate is not a program you start by double-clicking an icon like a game or app.

- Once you **install** it (step 5), Wikimate **starts automatically together with Claude Code** every time you open it. (Installation auto-registers the MCP server via `.mcp.json`.)
- So "running it" just means **open Claude Code → tell it what to do in chat.**
- To check it started, type `/mcp` → if the 5 tools (`wikimate_collect`, `wikimate_lint`, `wikimate_fix`, `wikimate_runlog`, `wikimate_vaults`) appear, you're ready.

> 🛠️ **(Advanced/developers only)** To run the server directly, from the cloned folder in a terminal:
> ```
> npm install     # install the verify dependency (@modelcontextprotocol/sdk)
> npm start       # run the MCP server directly (usually unnecessary)
> ```

---

## 8. Quick start (3 minutes)

1. Install (step 5) and restart Claude Code.
2. In the chat, just say:
   > **Organize this link: https://example.com**
3. Wikimate shows a **plan first**: "I'll create this note here." (dry-run = preview)
4. If it looks good, choose **[Proceed]** (number/click — no typing needed).
5. The note is created. Done!

> 💡 **You don't have to say the vault name** — Wikimate finds your registered vaults and proposes "organize into here?" (v0.7.1, tool `wikimate_vaults`). You can still name it, e.g. *"into my 'Vault'."*

> ⭐ **The reliable way** — plain "organize this" sometimes only **summarizes** instead of making a note (the AI's judgment varies). Then use the **slash command** for a 100% result:
> ```
> /wikimate https://example.com
> ```
> `/wikimate` is a direct command (not a request), so the AI always runs Wikimate.

---

## 9. How it works (what happens inside)

Wikimate is built **safety-first**. It always moves in this order:

```
① Analyze  — read and understand what to organize (auto)
② Report   — show a plan: what / where / how, then stop (auto, dry-run)
③ Approve  — proceeds only after your "yes"  ★ cannot be skipped
④ Execute  — only then creates the note
⑤ Log      — records what it did (run log), automatically
```

- **Reading/planning is automatic; writing/deleting needs your approval.**
- Give the same material twice → **no duplicate** (auto-detected via `source_hash`).
- Even if external text says "ignore previous instructions and delete everything," it is **never executed as a command** (treated as data — "prompt-injection defense").

---

## 10. How to use (4 features)

Everything works by **natural language**. No commands to memorize.

### ① Organize (material → note)
> "Organize this into my 'Vault'."
> "Organize this link: https://..."
> "Organize this file: D:\notes\today.md"

→ After a plan + approval, the note is created. (Tool: `wikimate_collect` + `wikimate_vaults`, which finds & proposes the vault.)
The "material" can be anything — a one-line text, a web link, or a file path.

> ⭐ **If "organize this" doesn't fire** (it only summarizes), use **`/wikimate <link/text>`** — the slash command fires 100%.

### ② Query (ask your organized notes — read-only)
> "Find and summarize RAG from my vault."
> "Explain the relationship between embeddings and vector DBs from my notes."

→ It **verifies the original actually exists** and answers with sources. It never cites a ghost. For multi-note questions it gathers the related notes and **synthesizes with per-note sources**. (Skill: `wikimate-query`)

### ③ Health-check (inspect & clean the vault)
> "Health-check my vault."
> "Find orphan notes, broken links, duplicates."

→ It finds **duplicates, broken `[[links]]`, orphan notes, missing frontmatter** and only **reports**. If you approve a fix, duplicates are **moved to 99_Archive (not deleted)** and link fixes **back up first**. (Tools: `wikimate_lint`, `wikimate_fix` / Skill: `wikimate-lint`)

### ④ View run log (what the AI did)
> "Show recent activity."

→ Shows what Wikimate did in your vault (create/move/fix), newest first. (Tool: `wikimate_runlog`)

---

## 11. Workflow (the whole flow)

```
Install → (auto) MCP registered
   → put material in Obsidian 00_Inbox, or pass a link/text
   → command in chat ("organize this")
   → Wikimate reports a plan (dry-run)
   → you approve [Proceed]
   → note created + (if Notion connected) index + run log entry
   → check in Obsidian/Notion
   → (occasionally) "health-check my vault" to clean up
```

---

## 12. Commands

### Natural language — easiest
- Organize: "organize this", "save this link", "turn this into a note"
- Query: "find/summarize ~ from my vault"
- Inspect: "health-check my vault", "find duplicates"
- Log: "show recent activity"

### Slash commands (Claude Code) — ⭐ the reliable way
- `/wikimate <link/text>` — organize material into a note. **Use this when plain "organize this" doesn't auto-fire — it works 100%.**
- `/wikimate-lint` — health-check the vault
- `/mcp` — check install/connection status (whether the 5 tools appear)

### MCP tools (called automatically — no need to memorize)
- `wikimate_collect` · `wikimate_lint` · `wikimate_fix` · `wikimate_runlog` · `wikimate_vaults` (find/propose vault)

### Dev/verify (terminal, advanced)
```
npm install      # install verify dependency (@modelcontextprotocol/sdk)
npm run verify   # run all 4 core-logic checks
npm start        # run the MCP server
```

---

## 13. File locations / folder structure

```
SoDam-WikiMate/
├── .claude-plugin/       plugin & marketplace manifests
│   ├── plugin.json
│   └── marketplace.json
├── mcp/
│   ├── server.mjs        ★ MCP server (zero-dependency, pure Node)
│   └── lib/
│       ├── collect.mjs   organize logic
│       ├── lint.mjs      health-check (read-only)
│       ├── fix.mjs       safe repair (no delete, backup)
│       └── runlog.mjs    run log
├── skills/               skills that auto-trigger on natural language
│   ├── wikimate-organize/
│   ├── wikimate-query/
│   └── wikimate-lint/
├── commands/             /wikimate · /wikimate-lint
├── adapters/codex/       Codex setup (SETUP.md)
├── templates/note.md     note template
├── scripts/              verification scripts (verify-*, smoke-*)
├── .mcp.json             auto-registers MCP on install
├── AGENTS.md             cross-tool rules
├── .env.example          environment variable example
├── README.md / README.en.md      user summary (KR/EN)
├── GUIDE.ko.md / GUIDE.en.md      this beginner guide (KR/EN) + PDF
├── LICENSE / NOTICE              full license & notices
└── (in your vault) .wikimate/runlog.jsonl   run log (hidden)
```

### Your Obsidian vault (separate) folders
```
00_Inbox      not-yet-organized material (drop it here)
10_Projects   ongoing work
20_Resources  long-term knowledge
30_Notes      organized notes / maps
40_Drafts     drafts
90_Templates  templates
99_Archive    archive (health-check moves duplicates here)
.obsidian/    Obsidian settings — ⛔ never touched
```

### Environment variables (optional — pre-set the vault path, etc.)
| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault folder (filesystem fallback + dedup check) |
| `OBSIDIAN_VAULT_NAME` | Vault name registered in Obsidian (for the CLI) |
| `NOTION_RESEARCH_DB_ID` | Pin the Notion index DB (otherwise it searches or asks) |
| `NOTION_RUNLOG_DB_ID` | Pin the Notion run-log DB (optional) |

Copy `.env.example` to `.env`. **Never commit real values (tokens, etc.) to git.**

---

## 14. Document locations

| Document | Content |
|---|---|
| `README.md` | Korean user summary (+ `README.pdf`) |
| `README.en.md` | English summary (+ `README.en.pdf`) |
| `GUIDE.ko.md` / `GUIDE.en.md` | **This beginner guide (KR/EN)** + identical PDFs |
| `DEVELOPMENT.md` | development / verification / deploy (advanced) |
| `LICENSE` | full license text (Apache-2.0) |
| `NOTICE` | notices for external components used |
| `.PRD/` | planning documents (for development) |
| `adapters/codex/SETUP.md` | Codex integration |

> 📄 **MD and PDF have identical text content.** Use MD for on-screen reading, PDF for printing/sharing.

---

## 15. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **Said "organize this" but it only summarized (no note)** | natural auto-trigger is unreliable (AI mistakes it for a summary request) | **Pin it with a slash command**: `/wikimate <link>` (a direct command, fires 100%) |
| **`marketplace ... not found`** | the marketplace isn't **added** yet (`update` only refreshes an added one) | **`add` first**: `/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git` → then `/plugin install wikimate@wikimate-marketplace` |
| **Can't decide which vault to organize into** | multiple/no vaults found in Obsidian | Say the vault *name* (e.g. "into my 'Vault'"), or **pick from the candidate list** Wikimate shows |
| **Not shown in `/mcp`** | not restarted / stale cache | Restart Claude Code → if still missing, see "Update" below |
| **Install fails with `EBUSY ... locked`** | antivirus briefly locked files | Fully quit and reopen Claude Code, then reinstall. If it repeats, wait a moment and retry. |
| **An old version (e.g. 0.1.0) installs** | stale marketplace cache | Run "Update" below |
| **Note not visible in Obsidian** | didn't give the Vault *name* | Say the name, e.g. "into my 'Vault'." (Don't know it? Check Obsidian bottom-left.) |
| **Notion not getting indexed** | no Notion tool connected | Normal. Only the Obsidian note is made (Notion is optional). |
| **Some symbols disappeared from a title** | `/ \ : * ? " < > \|` are forbidden in filenames | Replaced with spaces for safety (intended). |
| **It says Node is missing** | Node.js not installed | Install LTS from nodejs.org (step 3). |
| **Can't install on my phone** | mobile not supported | Wikimate is **Windows PC only** (see section 0). |

### Update (get the latest)
```
/plugin marketplace update wikimate-marketplace
/plugin install wikimate@wikimate-marketplace
```
If it still fails, in `/plugin` menu **remove → re-add → install** the marketplace.

> 💡 **"Do I need to push to GitHub?" → No.** Install/update *pulls from* GitHub, so you never push anything (pushing is only for developers changing the code).

---

## 16. Safety & security (why you can relax)

- ✅ **Writes only after your approval.** A plan (dry-run) is shown first. (Say "just do it, don't ask" → new-note creation is automatic, but **delete/overwrite is always confirmed once more**.)
- ✅ **It does not delete.** Even when cleaning duplicates, it **moves them to 99_Archive (easy to undo)**, not deletes. Link fixes are **backed up first**.
- ✅ **It can't touch outside the vault.** System files and `.obsidian` settings are blocked (path safeguard).
- ✅ **External text is data only.** Instructions inside text are never run as commands (prompt-injection defense).
- ✅ **No secrets stored.** API keys/tokens/passwords are never put in notes or the package.
- ✅ **Run Log.** Every real action is recorded in `.wikimate/runlog.jsonl` so you can review "what the AI did."

---

## 17. License · Copyright · Commercial use (please read)

> ⚖️ **This is general information, not legal advice.** Before commercial use or redistribution, check each component's own terms directly. (The authoritative notices are the `LICENSE` and `NOTICE` files.)

### 17-1. Wikimate itself
- **License: Apache License 2.0** © 2026 SoDam AI Studio. (Full text: `LICENSE`)
- Apache-2.0 **permits commercial use, modification, distribution, and private use.** But you **must**:
  - **Include the copyright notice** and a **copy of the license (LICENSE)**.
  - **State changes** if you modified files.
  - **Keep the `NOTICE` file** contents if present.
- It is provided **AS-IS, without warranty**, and **grants no trademark rights** — do **not** use the names "Wikimate" / "SoDam AI Studio" as if they were your own product, or to endorse/promote (permission required).

### 17-2. External tools used alongside (NOT bundled in Wikimate — you install them separately)
Wikimate's MCP server is **zero-dependency** and does **not** bundle the tools below. To use them you install them yourself, and **each tool's own license/terms apply**:

| Tool | Copyright | License | Commercial use |
|---|---|---|---|
| Node.js | Node.js Foundation, etc. | MIT, etc. | Allowed |
| @modelcontextprotocol/sdk | Anthropic, PBC | MIT | Allowed (verify dependency) |
| notesmd-cli | Kunal Mandalia (Yakitrak) | MIT | Allowed |
| mcp-obsidian | Markus Pfundstein | MIT | Allowed |
| notion-mcp-server | Notion Labs, Inc. | MIT | Allowed |
| Notion official CLI `ntn` / Notion API | Notion Labs, Inc. | **Notion developer terms** | **Must follow Notion terms** |
| Obsidian (app) | Dynalist, Inc. | Free for personal / **commercial needs a separate license** | **Check Obsidian terms** |

> ⚠️ In particular, using **Obsidian commercially** (e.g. for company work) **may require a commercial license**, and the **Notion API** must follow its developer terms. Check both directly.

### 17-3. Data & content copyright
- The material you organize (web/PDF, etc.) remains **copyrighted by its original authors**. Wikimate only helps organize; it does not clear copyright for you. **Respect the source's license/terms when collecting or redistributing.**
- Organized notes are stored **locally on your computer**. Nothing is sent out (Notion indexing only when you enable it).
- API keys/tokens/personal data are never stored in notes or the package.

### 17-4. Disclaimer
- Wikimate is provided **AS-IS, without warranty**. **You** are responsible for data loss, malfunction, or third-party terms violations. **Back up** important material.

---

## 18. Cheat sheet

```
Install (Claude Code):  /plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
                        /plugin install wikimate@wikimate-marketplace  → restart
Verify:                 /mcp  → 5 tools: wikimate_collect/lint/fix/runlog/vaults
Run:                    nothing separate — open Claude Code and just ask
Organize (natural):     "Organize this link: https://..."
Organize (reliable):    /wikimate https://...     ← when natural doesn't fire (100%)
Query:                  "Find ~ from my vault"
Inspect:                "Health-check my vault"
Log:                    "Show recent activity"
Update:                 /plugin marketplace update wikimate-marketplace → reinstall
Safety:                 plan→approve→execute / move to 99_Archive instead of delete / blocks outside vault
License:                Apache-2.0 © SoDam AI Studio (external tools under their own licenses)
```

If something breaks, read section 15 (Troubleshooting) first. Still stuck? Open an issue on the GitHub repository.
