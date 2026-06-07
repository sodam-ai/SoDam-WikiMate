# Wikimate

Tell an AI agent "organize this," and it tidies scattered materials into **Obsidian notes** and indexes them in **Notion**. A Claude Code plugin.

**[한국어](./README.md)**

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
Restart Claude Code, then check `/mcp` for `wikimate_collect`.

## Usage
Just ask in chat:
> "Organize this into my Obsidian vault"

It **auto-detects whatever Obsidian/Notion tools are installed (official or community MCP/CLI)** — not limited to any one tool. It reports a plan first, and on approval creates the note. Duplicates are blocked.
> To use an Obsidian CLI (e.g. notesmd-cli), tell it the **vault name** (e.g. "into my 'Vault' vault"). Otherwise it falls back to the filesystem.

## Safety
Writes run only **after human approval**. Instructions inside external materials are treated as data, not commands (prompt-injection defense).

## References
[notesmd-cli](https://github.com/Yakitrak/notesmd-cli) · [mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) · [notion-mcp-server](https://github.com/makenotion/notion-mcp-server) · [ntn CLI](https://developers.notion.com/cli/get-started/overview)

## License
Apache-2.0

> For development, verification, and local install, see [DEVELOPMENT.md](./DEVELOPMENT.md).
