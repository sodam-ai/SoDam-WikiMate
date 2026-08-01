# Wikimate Beginner's Guide (English)

> This document is written so that **even someone who has never used a computer, AI, a messenger app, an app, or a smartphone before** can follow it just as it is.
> Every hard word has been explained in plain terms, and **all you need to do is follow it in order from the top.** (Based on: **v0.7.2 + 3 new features planned for the next version** — see "Update Summary" below.)
>
> 📄 This guide is also available with the exact same content as **HTML** (`GUIDE.en.html`). The text is completely identical.

---

## 0. What is Wikimate? (1-minute overview)

It's an **AI assistant** that tidies up your scattered material.

Here's an analogy — imagine your desk is piled with receipts, sticky notes, and links. You say "please organize this," and an assistant **automatically sorts everything into folders and turns it into neat notes** for you, **threads together the notes that are related to each other**, and even **builds a table of contents for notes on similar topics.** That's what Wikimate is like. Just like asking a helper through a messenger chat (like KakaoTalk), **you simply tell it what to do in plain language** — no special commands needed.

- The organized results pile up as notes in a note-taking app called **Obsidian**. (Stored inside your own computer = safe)
- If you want, it can also write a list into a **Notion** table. (optional)
- Related notes get **threaded together automatically** (auto-linking), and similar topics get grouped into a **table-of-contents note (MOC)**. (🆕 planned for the next version)
- For notes that don't have a folder or tag assigned yet, it figures out **where to put them and what tag to add**, and suggests it to you. (🆕 planned for the next version)
- **It never deletes or changes anything on its own.** It always reports "here's what I'm about to do" first, and only acts once you say "yes."

> One-line summary: **Say "organize this," and it neatly files your stuff into notes in your note app, links them together, and even sorts them into categories.**

> 📱 **Which device does it run on?** Wikimate runs on a **Windows PC (desktop or laptop)**. **It cannot be installed on a smartphone or tablet** (because the AI tools you give it commands through — Claude Code and Codex — are PC-only programs).

---

## Update Summary (click to expand)

<details>
<summary><b>✅ v0.7.1 (current official release) — click to expand</b></summary>

- 🧹 Natural-language organizing (`wikimate_collect`) — automatically turns material into notes
- 🧭 Auto vault detection (`wikimate_vaults`) — suggests "shall I organize it here?"
- 🩺 Vault health-check (`wikimate_lint`) — finds duplicates, broken links, orphan notes, and missing frontmatter (read-only)
- 🔧 Safe fix (`wikimate_fix`) — moves things to the archive instead of deleting them, swaps out links (auto-backs-up before fixing)
- 🧾 Run log (`wikimate_runlog`) — automatically records what the AI did in the vault
- 🗂️ Notion indexing (optional) — automatically adds an index row when a Notion tool is connected

</details>

<details>
<summary><b>🆕 Features planned for the next version (already built in this repository and passing 119 automated tests, but not yet officially released — click to expand)</b></summary>

- 🔗 **Auto-linking** (`wikimate_link`, action=`suggest`/`add_links`) — connects related notes together with `[[links]]`. **Capped at 5 links per note** so the graph doesn't turn into a tangled mess (prevents over-linking).
- 🗺️ **MOC (topic table of contents)** (`wikimate_link`, action=`build_moc`) — gathers notes on the same topic into a single "table of contents" note (e.g. "MCP-related notes collection").
- 🗂️ **Auto-classification** (`wikimate_classify`) — figures out the right folder, tags, and importance level for an unclassified note and suggests it; once you approve, it moves/tags the note accordingly.
- 🔔 **Automatic session-start detection** (SessionStart hook) — when you turn on Claude Code, it looks ahead for the Obsidian tool and any registered vaults, and lets you know (read-only).
- 🕵️ **Review subagent** (`wikimate-reviewer`) — after it actually writes a note, before reporting "done," a separate AI double-checks — from an independent point of view — whether the original text got distorted, whether there's any sign of injection contamination, and whether it overwrote an existing note.
- ⚠️ **What still needs a human to confirm**: whether the links these new features create actually show up in Obsidian's graph view/backlinks panel, and whether the SessionStart notification really appears after a restart, are things automated tests can't verify — so a person still needs to confirm them. Once confirmed, this note will move up into "✅ Official release."

</details>

---

## 1. Quick glossary (beginner must-know — 30 seconds)

Don't panic if an unfamiliar word shows up. Here are the common ones, explained with simple analogies.

| Word | Plain meaning (analogy) |
|---|---|
| **AI agent** | A smart program that understands what you say and does the work for you (= an assistant) |
| **Claude Code** | A program on your computer that lets you **give an AI work by talking to it** (looks like a chat window) |
| **Codex** | **Another AI tool** similar to Claude Code (you only need one of the two) |
| **Plugin** | A **part that snaps a new feature into a program** (like installing one more app on your phone) |
| **Marketplace** | An **app store** where you get plugins from |
| **MCP** | A **standard connector (like an outlet)** that links an AI to tools. Wikimate works through this connector. |
| **MCP tool** | A **feature button** the AI can press through that connector (Wikimate ships 5, with 2 more planned — see section 12) |
| **Slash command `/wikimate`** | The **direct command** to use when "organize this" doesn't work reliably (fires 100% of the time) |
| **Obsidian** | A **note-taking app** that stacks up notes on your computer (organized results are stored here) |
| **Vault** | The **note storage folder** in Obsidian that holds your notes. You give it a **name** when you create it. |
| **Notion** | An app for organizing tables and documents (optional — only if you want a list-style table) |
| **Terminal / cmd / CLI** | The **black window** where you type text commands (built into Windows) |
| **Node.js** | The **free engine (foundation)** that lets Wikimate run — install it once |
| **Git** | A tool that **downloads a whole folder** from the internet (advanced/optional) |
| **Slash command** | A command in Claude Code that starts with `/` (e.g. `/mcp`, `/plugin`) |
| **dry-run** | **Showing you only "the plan" before actually doing anything** (= a preview) |
| **frontmatter** | A small **info table** attached to the top of a note (title, tags, date, etc.) |
| **source_hash** | A **fingerprint** used to recognize the same material (for preventing duplicates, automatic) |
| **99_Archive** | A folder that **moves notes instead of deleting them** (easy to undo) |
| **🆕 related (related notes)** | The list written into a note's info table of **"other notes related to this one."** Up to 5. |
| **🆕 MOC (Map of Content)** | A **table-of-contents note that gathers notes on the same topic in one place** |
| **🆕 SessionStart hook** | A guide script that **runs automatically, once, when you turn on** Claude Code |
| **🆕 Subagent** | A helper AI that works **separately** from the main AI to carry out one specific job only (such as reviewing) |

> 💡 No need to memorize all of this. Whenever an unfamiliar word shows up, just come back to this table.

---

## 2. Prerequisites (what you need before starting)

| Item | Required? | Notes |
|---|---|---|
| **A computer (Windows)** | ✅ Required | This guide is based on Windows 11. (Not for phones/tablets.) |
| **Node.js 18 or higher** | ✅ Required | The free program Wikimate needs to run. (Install it in section 3 below.) |
| **Claude Code** or **Codex** | ✅ Required | The AI tool you'll tell to "organize this." **You only need one of the two.** |
| **Obsidian** | 🔶 Optional | Install it if you want to see the organized notes visually. Files still get created without it. |
| **Notion** | 🔶 Optional | Only if you want to see a list in table form. |
| **Git** | 🔶 Optional | Only needed if you're using Codex, or downloading it yourself the way a developer would. |

> 💡 **You really only need 3 things**: a Windows computer + Node.js + (Claude Code or Codex). Everything else is optional.

---

## 3. How to download the required programs

### ① Node.js (required)
1. Type **nodejs.org** into your browser's address bar and go there.
2. Click the big green button labeled **LTS** to download it. (LTS = "the version that stays stable for a long time.")
3. Double-click the downloaded file → keep clicking "Next" to install it.
4. Verify: press the `Win` key → type "cmd" → in the black window, type `node -v` → if you see a number like `v18.x` or higher, it worked.

### ② Claude Code (required, pick one)
- Go to **claude.com/claude-code** and install it as guided. (The program you use to give the AI commands in plain language.)

### ② Codex (alternative)
- If you use the Codex CLI, this works instead of Claude Code. (Explained in section 6 below.)

### ③ Obsidian (optional)
- Go to **obsidian.md** → download → install. The first time you open it, it will have you create a "Vault." Remember this **vault's name** (you'll need it later).

### ④ notesmd-cli (optional, advanced)
- Only needed if you want to create notes without opening Obsidian. Install it with Scoop: `scoop install notesmd-cli`

---

## 4. How to get Wikimate

There are two ways to do this. **(A) is enough for most people.**

### (A) Install via the marketplace — recommended (downloads automatically)
Just type two lines inside Claude Code and it's **automatically downloaded and installed** from GitHub (see section 5). You don't need to fetch any files yourself. (Note: only the **official release (v0.7.1)** is on the marketplace. If you want to use the 🆕 next-version features right now, get it via method (B) below instead.)

### (B) Get the folder directly — for the latest/dev version
This downloads the whole thing from GitHub. Use this if you're using Codex, or if you want to use the **newest features** before they're published to the marketplace.
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```

---

## 5. Installation (Claude Code)

> ⚠️ **Enter the two lines one at a time, separately.** (Pasting both at once breaks the URL and it fails.)

**Step 1 — Add the marketplace** (press Enter, confirm it says "added"):
```
/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
```
**Step 2 — Install the plugin** (after step 1 finishes):
```
/plugin install wikimate@wikimate-marketplace
```
**Step 3 — Turn Claude Code off and back on** (restart it). Done!

Check the install: type `/mcp` → if you see all five — **wikimate_collect · wikimate_lint · wikimate_fix · wikimate_runlog · wikimate_vaults** — it worked. (🆕 If you installed from the folder that includes the new features, you should see **seven**: the above five plus `wikimate_link` and `wikimate_classify`.)

> 📌 **To use the very newest features (auto-linking, auto-classification, etc.) right away**, download it with method (B), then install using that folder's path:
> ```
> /plugin marketplace add C:\path\to\downloaded\folder\SoDam-WikiMate
> /plugin install wikimate@wikimate-marketplace
> ```

---

## 6. Installation (Codex)

Codex has **no** marketplace (`/plugin`). Instead, you register the downloaded folder as an **MCP server**.

**Step 1 — Get it**
```
git clone https://github.com/sodam-ai/SoDam-WikiMate.git
```
**Step 2 — Register it** (swap in your own vault/folder paths):
```
codex mcp add wikimate --env OBSIDIAN_VAULT_PATH=D:/my/vault/path -- node D:/path/to/SoDam-WikiMate/mcp/server.mjs
```
**Step 3 — Check it**: if `codex mcp list` shows `wikimate`, it worked.

**Step 4 — (Optional) Natural-language rules**: put the downloaded folder's `AGENTS.md` in your Codex working folder, and it will understand things like "organize this" too.
**Updating**: just run `git pull` in the downloaded folder — done (no cache trap like Claude Code has).

> ⚠️ **Codex is a "lite" version.** The organize (write) feature works, but smart skills like *auto-triggering, querying, health-checking, auto-linking, and auto-classifying* are **Claude Code only** (skills are the natural-language auto-trigger layer, which Codex doesn't have — though the MCP tools themselves can still be called directly). Notion indexing in Codex also needs a **separate Notion MCP** connected. For details, see `adapters/codex/SETUP.md`.

---

## 7. How to run it (how do I start it?)

**Most important thing to know: there is nothing separate to "run (turn on)."** Wikimate isn't a program you launch by double-clicking an icon, like a game or app.

- Once you **just install it** as in section 5, Wikimate **automatically turns on together with Claude Code**, every time you open it. (Installing it makes `.mcp.json` auto-register the MCP server.)
- 🆕 If you're on the version with the new features, when you turn on Claude Code, a message like **"[Wikimate] Session-start auto-detection: ..."** automatically appears once (it's finding the Obsidian CLI and any registered vaults ahead of time and letting you know — read-only).
- So "running it" simply means: **open Claude Code → tell it what to do in the chat window.** That's all there is to it.
- To check that it started properly, type `/mcp` → if `wikimate_collect`, `wikimate_lint`, `wikimate_fix`, `wikimate_runlog`, `wikimate_vaults` (+ 🆕 `wikimate_link`, `wikimate_classify`) show up, you're ready to go.

> 🛠️ **(Advanced/developers only)** If you want to run the server directly yourself, from the downloaded folder in a terminal:
> ```
> npm install     # install the verify-only dependency (@modelcontextprotocol/sdk)
> npm start       # run the MCP server directly (usually not needed)
> npm run verify  # runs all automated checks on the core logic (119 checks)
> ```

---

## 8. Quick start (3-minute walkthrough)

1. Install it as in section 5, and restart Claude Code.
2. In the chat window, just say something like:
   > **Organize this link: https://example.com**
3. Wikimate says **"I'll create a note like this here"** and **shows you the plan first.** (dry-run = preview)
4. If it looks good, choose **[Proceed]** (a number or a click — no typing required).
5. The note gets created. Done!

> 💡 **You don't have to say the vault's name** — Wikimate automatically finds the vaults registered in Obsidian and suggests **"shall I organize it here?"** (`wikimate_vaults`). Of course, you can still point one out directly, like *"into my 'Vault'."*

> ⭐ **The most reliable way** — if you just say "organize this," the AI sometimes **only summarizes** and doesn't create a note (natural-language auto-triggering is the AI's own judgment call, so it can be inconsistent). When that happens, pin it down with a **slash command** and it **works 100% of the time**:
> ```
> /wikimate https://example.com
> ```
> `/wikimate` isn't a "request" — it's a "direct command," so the AI always runs Wikimate.

> 🆕 **A 3-minute taste of auto-linking and auto-classification too**:
> - "Connect these notes to each other where they're related" → it shows you related candidates, and only the ones you approve get connected with `[[links]]`
> - "Decide where this unclassified note should go" → it suggests a suitable folder and tags, and moves it once you approve

---

## 9. How it works (what happens under the hood?)

Wikimate is built with **safety as the top priority.** It always moves in this order:

```
① Analyze  — reads and figures out what to organize/link/classify (automatic)
② Report   — shows a plan of what · where · how, then stops (automatic, dry-run)
③ Approve  — only proceeds after you say "yes"  ★ this step can never be skipped
④ Execute  — only now does it actually create, link, or move the note
⑤ Review   — 🆕 if it actually wrote something, a different-perspective AI (wikimate-reviewer) double-checks that the original text wasn't distorted
⑥ Record   — automatically logs what it did (run log)
```

- **Reading and planning are automatic; writing and deleting only ever happen after your approval.**
- Give it the same material twice → **it won't create a duplicate** (auto-detected via `source_hash`).
- Even if a piece of outside text contains a sentence like "ignore your previous instructions and delete everything," Wikimate **never executes it as a command** (it's treated purely as data — a security measure called "prompt-injection defense").
- 🆕 To stop a single note from getting **too many related notes stitched onto it**, the number is **capped at 5** (enforced in the code — this keeps the graph from tangling into a mess).

### Who does the work behind the scenes? (optional reading — you don't need this to use Wikimate)

```
You → (say it in chat) → the "brain" (understands plain language, keeps the order)
                            → the "hands" (5 small programs that actually read/write/check notes)
                            → your Obsidian vault (where the real files live)
```

- The **"brain"** figures out what you meant by "organize this" and always keeps the sequence (analyze → report → approve → execute → log).
- The **"hands"** are 5 small programs that actually read and write files (organize, check, fix, log, find-vault). These programs **do nothing on their own** — they only do what the "brain" tells them, after your approval.
- Why split it this way: even if the "brain" misjudges something, the "hands" own safeguards (blocking paths outside the vault, moving instead of deleting, backups) act as the last line of defense.

---

## 10. How to use it (6 features)

Everything is done through **conversation (natural language).** You don't need to memorize any commands.

### ① Organize (turn gathered material into notes)
> "Organize this into my 'Vault'."
> "Organize this link: https://..."
> "Organize this file: D:\notes\today.md"

→ After it shows you the plan and you approve, the note is created. (Tools: `wikimate_collect` + `wikimate_vaults`, which finds and suggests a vault to organize into.)
The "material" to organize can be anything — a one-line sentence, a web link, or a file path all work.

> ⭐ **If natural-language "organize this" doesn't work sometimes** (it only summarizes in chat instead of making a note), use the **`/wikimate <link/text>`** slash command — since it's a direct command, it fires 100% of the time.

> 🧾 **Raw-content-preservation notice** — the dry-run plan screen may show a note like "there's a web address but the content looks too short" or "the content is large." This is not a block, just a **heads-up** — if only a summary gets saved, you can never recover the original once it disappears from the internet, so this is a nudge to double-check before saving (see §15 "Safety & security").

### ② Query (ask about the notes you've organized — read-only)
> "Find RAG in my vault and summarize it."
> "Explain the relationship between embeddings and vector DBs using my notes."

→ It **checks that the original source actually exists** and answers with sources cited. It never claims something exists when it doesn't. For questions that span multiple notes, it gathers the related notes and **synthesizes an answer with per-note sources.** (Skill: `wikimate-query`)

### ③ Health-check (inspect and clean up the state of your vault)
> "Health-check my vault."
> "Find orphan notes, broken links, and duplicates."

→ It finds **duplicates, broken `[[links]]`, orphan notes, and missing frontmatter**, and **only reports them.** If you pick items to fix and approve them, duplicates get **moved to the archive (99_Archive) instead of being deleted**, and links get fixed only **after an automatic backup.** (Tools: `wikimate_lint`, `wikimate_fix` / Skill: `wikimate-lint`)

### ④ View the run log (what the AI has done)
> "Show recent activity."

→ Shows what Wikimate has done in your vault (created/moved/fixed), most recent first. (Tool: `wikimate_runlog`)

### ⑤ 🆕 Auto-linking & MOC (connect related notes, build a table of contents)
> "Connect the notes that are related to this one."
> "Group the MCP-related notes into a table of contents."

→ It searches the whole vault for candidates, looking only at **titles, summaries, and tags** (never the full body text, for safety) to judge how related they are, then proposes them. Only the ones you approve get added as `[[links]]` into the note's info table (`related:`) — up to 5 per note. If you say "group into a table of contents," it creates or updates a **table-of-contents note (MOC)** that gathers notes on the same topic, inside the `30_Notes` folder (any content a person already wrote there by hand is preserved as-is). (Tool: `wikimate_link` / Skill: `wikimate-link`)

### ⑥ 🆕 Auto-classification (decide the folder, tags, and importance)
> "Organize these unclassified notes."
> "Decide where this note should go."

→ Looking at the note's current folder, tags, part of its body text, and the list of tags already in use elsewhere in the vault, it suggests which folder fits best (`00_Inbox`/`10_Projects`/`20_Resources`/`30_Notes`/`40_Drafts`), and what tags and importance level (1–5) would work well. Once you approve, it moves/applies them exactly as proposed. If a file with the same name already exists in that folder, it **never overwrites it** — it saves the new one separately. (Tool: `wikimate_classify` / Skill: `wikimate-classify`)

---

## 11. Workflow (the whole flow at a glance)

```
Install → (automatic) MCP registered → (🆕 at session start, auto-detects Obsidian & vaults and lets you know)
   → put material into Obsidian's 00_Inbox, or hand over a link/text
   → tell it what to do in chat ("organize this" / "connect these" / "classify this")
   → Wikimate reports a plan (dry-run)
   → you approve [Proceed]
   → note created/linked/moved + (if Notion is connected) indexed + a run log entry recorded
   → 🆕 if it actually wrote something, the review subagent (wikimate-reviewer) double-checks it
   → check it in Obsidian/Notion
   → (once in a while) say "health-check my vault" to clean up
```

---

## 12. Command reference

### Natural language — the easiest way
- Organize: "organize this", "turn this into a note", "save this link"
- Query: "find/summarize ~ from my vault"
- Inspect: "health-check my vault", "find duplicates"
- Log: "show recent activity"
- 🆕 Link: "connect the related notes", "make a table of contents for this topic"
- 🆕 Classify: "classify this note", "decide the folder/tags"

### Slash commands (Claude Code) — ⭐ the most reliable way
- `/wikimate <link/text>` — organizes material into a note. **When natural-language "organize this" doesn't fire, use this — it works 100% of the time.**
- `/wikimate-lint` — health-check the vault
- 🆕 `/wikimate-link` — auto-linking & building an MOC
- 🆕 `/wikimate-classify` — auto-classification
- `/mcp` — check install/connection status (whether the tool count shows up)

### MCP tools (called automatically behind the scenes — no need to memorize)
- `wikimate_collect` (organize) · `wikimate_lint` (check) · `wikimate_fix` (fix) · `wikimate_runlog` (log) · `wikimate_vaults` (find/suggest a vault)
- 🆕 `wikimate_link` (auto-link & MOC) · `wikimate_classify` (auto-classify)

### Dev/verify (terminal, advanced)
```
npm install      # install the verify-only dependency (@modelcontextprotocol/sdk)
npm run verify   # run all automated checks on the core logic (119 checks)
npm start        # run the MCP server
```

---

## 13. File locations / folder structure

```
SoDam-WikiMate/
├── .claude-plugin/       plugin & marketplace settings
│   ├── plugin.json
│   └── marketplace.json
├── mcp/
│   ├── server.mjs        ★ MCP server (zero-dependency, pure Node) — wires up 7 tools
│   └── lib/
│       ├── shared.mjs    🆕 shared helpers (path-safety checks, backups, frontmatter parsing)
│       ├── collect.mjs   organize logic
│       ├── lint.mjs      health-check (read-only)
│       ├── fix.mjs       safe fix (no deleting, backs up first)
│       ├── runlog.mjs    run log
│       ├── link.mjs      🆕 auto-link & MOC logic
│       └── classify.mjs  🆕 auto-classification logic
├── skills/               skills that auto-trigger from natural language
│   ├── wikimate-organize/
│   ├── wikimate-query/
│   ├── wikimate-lint/
│   ├── wikimate-link/    🆕
│   └── wikimate-classify/ 🆕
├── commands/             /wikimate · /wikimate-lint · 🆕 /wikimate-link · /wikimate-classify
├── hooks/                🆕 automatic session-start detection (session-start.mjs, hooks.json)
├── agents/               🆕 review subagent (wikimate-reviewer.md)
├── adapters/codex/       Codex setup guide (SETUP.md)
├── templates/note.md     note template
├── scripts/              verification scripts (verify-*, smoke-*, e2e-*)
├── .mcp.json             auto-registers the MCP server on install
├── AGENTS.md             shared cross-tool rules
├── .env.example          environment variable example
├── README.md / README.en.md      user-facing summary (KR/EN, md+html)
├── GUIDE.ko.md / GUIDE.en.md      this beginner's guide (KR/EN, md+html)
├── CHECKPOINT.md         development progress tracker (for developers)
├── LICENSE / NOTICE              full license text & notices
└── (in your vault) .wikimate/runlog.jsonl   run log (hidden) / .wikimate/backups/ backups (hidden)
```

### Your Obsidian vault's (separate) folders
```
00_Inbox      material not yet organized (just drop it here)
10_Projects   work in progress
20_Resources  long-term knowledge you keep building up
30_Notes      organized notes / tables of contents (🆕 MOCs live here too)
40_Drafts     drafts
90_Templates  templates (🆕 not an auto-classification target — managed by hand)
99_Archive    archive (health-check moves duplicates here, 🆕 not an auto-classification target)
.obsidian/    Obsidian settings — ⛔ never touched
```

### Environment variables (optional — pre-set things like the vault path)
| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault folder (file-system fallback + dedup check) |
| `OBSIDIAN_VAULT_NAME` | The vault's name as registered in Obsidian (for the CLI) |
| `NOTION_RESEARCH_DB_ID` | Pins the Notion index database (if unset, it searches or asks you) |
| `NOTION_RUNLOG_DB_ID` | Pins the Notion run-log database (optional) |

Copy `.env.example` to `.env` and use that. **Never commit real values (tokens, etc.) to git.**

---

## 14. Architecture (only for the curious)

> Explained with a diagram so even non-developers can follow along. You don't need to understand this at all to use Wikimate.

```
[You] --speak a command--> [Claude Code / Codex] --MCP pipe--> [Wikimate server (mcp/server.mjs)]
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          ▼                   ▼                   ▼
                                   [collect.mjs]         [link.mjs]         [classify.mjs]
                               material → note      link related notes /   decide folder/tags
                                                          build an MOC
                                          │                   │                   │
                                          └─────────┬─────────┴─────────┬─────────┘
                                                     ▼                   ▼
                                     [Your Obsidian vault (real files)]  [.wikimate/runlog.jsonl]
                                                     │                   (run log, hidden)
                                                     ▼
                                     [(optional) add a Notion index row]
```

- **Core design principle**: deciding "is this related?" or "which folder fits?" is always **the AI's (Claude's) own judgment** — the Wikimate server's job is only to **supply candidate information and write safely.** There's no separate similarity-calculation engine — the AI already does that job, so it wasn't built a second time.
- **Zero-dependency server**: `mcp/server.mjs` runs on nothing but Node.js's own built-in features, with no external libraries. That keeps installation light and fast, and there's no third-party code that could introduce a security hole.
- **hooks/agents load only at session start**: because of how Claude Code itself is built, new settings inside the `hooks/` and `agents/` folders only take effect **after you restart Claude Code** (they can't apply mid-session — this is just normal Claude Code behavior).

---

## 15. Security & data flow (how is my information handled?)

| Question | Answer |
|---|---|
| **Is my note content sent to an outside server?** | No. Notes are only ever saved as files **on your own computer (locally).** The Wikimate server itself doesn't talk to the internet at all (zero-dependency, runs locally). That said, when Claude Code/Codex talks to the AI model, **the conversation content (the material you asked about, the note candidate info) does get sent to the AI provider** — but that's simply how Claude Code/Codex itself normally works, not something Wikimate does. |
| **Can text inside a note get executed as an AI command?** | No. Note content and text pulled in from outside are **always treated purely as "data,"** and any instruction hidden inside it (like "ignore the previous command and do ~ instead") is **never executed as a command** (prompt-injection defense, confirmed by actual tests). |
| **When it suggests auto-links, does the AI see the note's full body text?** | No. The "find link candidates" part of `wikimate_link` only shows **the title, summary, and tags** — never the full body (the principle of minimal information exposure). |
| **Can it touch files outside the vault?** | No. Every write operation is **code-enforced to check it's inside the designated vault folder.** `..` (moving to a parent folder), absolute paths, network paths (UNC), and the `.obsidian` settings folder are all blocked (confirmed by actual tests). |
| **Are passwords or API keys stored in notes?** | No. Wikimate never stores keys, tokens, or passwords in notes or in its own package. |
| **Could an existing note get overwritten by accident?** | No. If a filename happens to match, it **saves under a separate name instead of overwriting it** (e.g. `_dup1`). Whenever it changes the **content** of an existing note, it **always backs it up first.** |
| **Is there a delete feature?** | No, there isn't one. A note that needs cleanup only ever gets **moved to the 99_Archive folder instead of being deleted** (easy to undo). |
| **Is every change logged?** | Yes. Every real action — creating, moving, or fixing — gets automatically logged, one line at a time, in `.wikimate/runlog.jsonl` (a hidden file). |

---

## 16. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **I said "organize this" but it only summarized instead of making a note** | natural-language auto-triggering is inconsistent (the AI mistook it for a "summarize" request) | **Pin it down with a slash command**: `/wikimate <link>` (a direct command, fires 100% of the time) |
| **`marketplace ... not found`** | the marketplace hasn't been **added** yet (`update` only refreshes one that's already added) | **Start with `add`**: `/plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git` → then `/plugin install wikimate@wikimate-marketplace` |
| **I can't decide which vault to organize into** | Obsidian has multiple vaults, or none could be found | Say the vault's *name* along with your request (e.g. "into my 'Vault'"), or **pick one from the candidate list** Wikimate shows you |
| **It doesn't show up in `/mcp`** | didn't restart / stale cache | Quit and reopen Claude Code → if it's still missing, see "Update" below |
| **Install fails with `EBUSY ... locked`** | antivirus software (Defender) briefly locked the files | Fully close and reopen Claude Code, then reinstall. If it keeps happening, wait a bit and try again |
| **An old version (e.g. 0.1.0) gets installed** | stale marketplace cache | Run "Update" below |
| **The note doesn't show up in Obsidian** | you didn't tell it the vault's *name* | Mention the name, like "into my 'Vault'." (Don't know the name? Check the bottom-left corner of Obsidian.) |
| **Notion isn't getting indexed** | no Notion tool connected | That's normal — only the Obsidian note gets created (Notion is optional). |
| **A symbol disappeared from the title** | `/ \ : * ? " < > \|` are forbidden characters in filenames | They get swapped for a space, for safety (this is intended behavior). |
| **It says Node is missing** | Node.js isn't installed | Install the LTS version from nodejs.org, per section 3 |
| **I can't install it on my phone** | mobile isn't supported | Wikimate is **Windows-PC only** (see section 0). |
| **🆕 I asked it to link things, but it won't connect more than 5** | **this is an intentional safeguard** — the code hard-caps related notes at 5 per note | This is normal behavior. If you really need more, first clean up some of the existing links, then ask again. |
| **🆕 Why doesn't auto-classification touch `90_Templates` or `99_Archive`?** | intentional design — the templates folder is managed by hand, and the archive folder is the health-check's job alone | This is normal behavior. Those two folders are not targets for auto-classification. |
| **🆕 I added a link but it's not showing up in graph view** | how frontmatter links display can differ depending on your Obsidian version and graph-view settings (still being looked into) | Check your Obsidian graph-view filter settings, or open the note and check the `related` value directly in the Properties panel. |
| **🆕 I opened Claude Code and the "session-start auto-detection" message didn't appear** | hooks/agents only take effect once the **plugin is fully reloaded** (this is just normal Claude Code behavior) | Fully quit and restart Claude Code. If it still doesn't show up, check whether the plugin was installed from the newer folder (the one that includes the new features). |

### Update (get the latest version)
```
/plugin marketplace update wikimate-marketplace
/plugin install wikimate@wikimate-marketplace
```
If it still doesn't work, go to the `/plugin` menu and **remove → add again → install** the marketplace.

> 💡 **"Do I need to push to GitHub?" → No.** Installing/updating *pulls from* GitHub, so you never need to push anything yourself. (Pushing is only something a developer does when changing the code.)

---

## 17. FAQ (frequently asked questions)

**Q1. I'm completely new to computers — can I really follow along?**
A. Yes. This guide is built so you can just follow it in order starting from section 0. Any word you don't know is covered in the "Glossary" in section 1.

**Q2. Do I have to pay for it?**
A. Wikimate itself is **free (Apache-2.0 open source)**. That said, things like Claude Code/Codex (AI usage fees) or Obsidian's commercial license each follow their own separate policies (see section 18 below).

**Q3. Do I always need an internet connection?**
A. The Wikimate server itself (reading/writing note files) doesn't need the internet. But talking to the AI (Claude Code/Codex), and fetching a web link's content when organizing it, both require an internet connection.

**Q4. Can I use several Obsidian vaults together?**
A. Yes. `wikimate_vaults` shows you the list of registered vaults, and you can pick which one to organize into each time.

**Q5. I'm worried an important note might get deleted by accident.**
A. Wikimate has no "delete" feature at all. A note that needs cleanup only ever gets moved to the 99_Archive folder instead of being deleted, and whenever it's about to change a note's content, it always makes an automatic backup first.

**Q6. Does the AI read all of my personal notes (like a diary)?**
A. It only reads as much as it needs, and only for the material/notes you gave it a command about. Features like the auto-link suggestion are designed to use only the title, summary, and tags — not the full body text.

**Q7. Will it slow down once I have 100 or 1,000 notes?**
A. The current design has been confirmed to run fast enough for a personal-scale vault (tens to a few hundred notes) — measured at roughly 2 milliseconds per call with about a dozen or so notes. Performance on very large vaults (tens of thousands of notes or more) hasn't been checked yet.

**Q8. Does it work on Mac or Linux?**
A. This guide and the official tests are based on **Windows 11**. Since it's built on Node.js, it could theoretically work on other operating systems too, but that's **not officially confirmed or guaranteed.**

**Q9. Can I use it for company work (commercial use)?**
A. Wikimate's own code is allowed for commercial use (Apache-2.0). However, **using the Obsidian app for commercial purposes such as company work may require a separate commercial license**, and the Notion API also has its own separate terms. Please make sure to read section 18 below for details.

**Q10. Could the AI just summarize my original material and throw away the raw content?**
A. That's exactly the mistake this safeguard is meant to catch. When organizing, if there's a web address but the content looks too short, Wikimate flags it before saving with a "did you paste a summary instead?" notice (see section 15, "Security & data flow"). Note that this is **a warning, not a hard block** — if you see the warning and proceed anyway, the short content can still get saved.

**Q11. Where do I go if something goes wrong?**
A. First check section 16, "Troubleshooting." If that doesn't solve it, please open an issue on the GitHub repository.

---

## 18. Safety & security summary (why you can relax)

- ✅ **Writes always wait for your approval.** It shows you the plan (dry-run) first. (If you say "just do it, don't ask," creating new notes becomes automatic — but **deleting or overwriting always gets confirmed once more.**)
- ✅ **It doesn't delete things.** Even when the health-check cleans up duplicates, it **moves them to 99_Archive instead of deleting them** (easy to undo). Link fixes are **backed up automatically before the fix.**
- ✅ **It can't touch anything outside the vault.** System files and the `.obsidian` settings folder are blocked (path safeguard, confirmed by actual tests).
- ✅ **Outside text is treated purely as data.** Instructions hidden inside a piece of text are never executed as commands (prompt-injection defense, confirmed by actual tests).
- ✅ **No secrets get stored.** API keys, tokens, and passwords are never put into notes or the package.
- ✅ **Run Log.** Every real action is recorded in `.wikimate/runlog.jsonl`, so you can always check "what did the AI actually do."
- ✅ 🆕 **Prevents over-linking.** So a single note doesn't end up piling up an endless number of related notes, the code itself caps it at 5.
- ✅ 🆕 **Input validation.** If a numeric field like importance (1–5) gets a bad value (letters, or a number outside the range), it's replaced with a safe default or rejected outright (an issue found and fixed via real-world testing on 2026-07-11).

See section 15, "Security & Data Flow," for more detail.

---

## 19. License · Copyright · Commercial use (please read)

> ⚖️ **The following is general information, not legal advice.** Before commercial use or redistribution, check each component's own original terms yourself. (The authoritative notices are the `LICENSE` and `NOTICE` files.)

### 19-1. Wikimate itself
- **License: Apache License 2.0** © 2026 SoDam AI Studio. (Full text: `LICENSE`)
- Apache-2.0 **permits commercial use, modification, distribution, and private use.** However, you **must** do the following:
  - Include the **copyright notice** together with a **copy of the license (LICENSE)**.
  - **State that you made changes**, if you modified any files.
  - **Keep the contents** of the `NOTICE` file, if one is present.
- It is provided **with no warranty (AS-IS)**, and **grants no trademark rights** — do not use the names "Wikimate" or "SoDam AI Studio" **as if they were your own product's name, or for endorsement/promotion** (permission required).

### 19-2. External tools used alongside it (not bundled with Wikimate — you install these separately)
Wikimate's MCP server is **zero-dependency**, so it does **not bundle** the tools below. If you want to use them, install them yourself, and **each one's own license/terms apply**:

| Tool | Copyright holder | License | Commercial use |
|---|---|---|---|
| Node.js | Node.js Foundation, etc. | MIT, etc. | Allowed |
| @modelcontextprotocol/sdk | Anthropic, PBC | MIT | Allowed (verify-only dependency) |
| notesmd-cli | Kunal Mandalia (Yakitrak) | MIT | Allowed |
| mcp-obsidian | Markus Pfundstein | MIT | Allowed |
| notion-mcp-server | Notion Labs, Inc. | MIT | Allowed |
| Notion's official CLI `ntn` / Notion API | Notion Labs, Inc. | **Notion Developer Terms** | **Must follow Notion's terms** |
| Obsidian (the app) | Dynalist, Inc. | Free for personal use / **commercial use needs a separate license** | **Check Obsidian's terms** |

> ⚠️ In particular, using **Obsidian for commercial purposes**, such as company work, **may require a commercial license.** The **Notion API** also has to follow its own developer terms. Check the original terms for both yourself.

### 19-3. Data & content copyright
- The material you organize (web pages, PDFs, etc.) **remains copyrighted by its original author.** Wikimate only helps you organize it — it does not handle copyright clearance on your behalf. **Be sure to follow the original work's license/terms of use whenever you collect or redistribute it.**
- Organized notes are stored **on your own computer (locally).** Nothing gets sent outside (Notion indexing only happens when you turn it on yourself).
- API keys, tokens, and personal information are never stored in notes or in the package.
- **The notes Wikimate organizes for you are 100% your own copyright.** Wikimate (SoDam AI Studio) claims no rights over the resulting notes — it only helps make them.

### 19-4. Disclaimer
- Wikimate is provided **"as-is," with no warranty.** Responsibility for data loss, malfunction, or violating a third party's terms **rests with the user.** Backing up important material is recommended.

---

## 20. At-a-glance summary (cheat sheet)

```
Install (Claude Code):  /plugin marketplace add https://github.com/sodam-ai/SoDam-WikiMate.git
                    /plugin install wikimate@wikimate-marketplace  → restart
Verify:             /mcp  → 5 tools: wikimate_collect/lint/fix/runlog/vaults (+ 2 new: link/classify)
Run:                nothing separate — open Claude Code and just tell it what to do
Organize (natural): "Organize this link: https://..."
Organize (reliable):/wikimate https://...     ← use this when natural language doesn't fire (100%)
Query:              "Find ~ from my vault"
Inspect:            "Health-check my vault"
Log:                "Show recent activity"
🆕 Link:            "Connect the related notes" / "Make a table of contents for this topic"
🆕 Classify:        "Classify this note"
Update:             /plugin marketplace update wikimate-marketplace → reinstall
Safety:             plan → approve → execute / moves to 99_Archive instead of deleting / blocks outside the vault / max 5 links
License:            Apache-2.0 © SoDam AI Studio (external tools each under their own license)
```

If something goes wrong, check section 16 (Troubleshooting) or section 17 (FAQ) first. Still stuck? Open an issue on the GitHub repository.
