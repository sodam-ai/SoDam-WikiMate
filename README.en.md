# Wikimate

Tell an AI agent "organize this," and it tidies scattered materials into **Obsidian notes** and indexes them in **Notion**. A Claude Code plugin.

**[한국어](./README.md)**

## Install (Claude Code)
```
/plugin marketplace add sodam-ai/wikimate
/plugin install wikimate@wikimate-marketplace
```
Restart Claude Code after install. (The repo must be public to install it — public release comes after verification.)

## Usage
Just ask in chat:
> "Organize this link into my Obsidian"

It reports a plan, and on approval creates the note (.md). Duplicates are blocked.
Set the vault path via the `OBSIDIAN_VAULT_PATH` environment variable.

## Safety
Writes run only **after human approval**. Instructions inside external materials are treated as data, not commands (prompt-injection defense).

## References
[notesmd-cli](https://github.com/Yakitrak/notesmd-cli) · [mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) · [notion-mcp-server](https://github.com/makenotion/notion-mcp-server) · [ntn CLI](https://developers.notion.com/cli/get-started/overview)

## License
Apache-2.0

> For development, verification, and local install, see [DEVELOPMENT.md](./DEVELOPMENT.md).
