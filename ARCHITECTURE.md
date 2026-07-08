# ARCHITECTURE.md — target design

Describes where the system prompt, tool-calling, RAG, and context-window handling should end up. Current state noted inline where it matters; specific known bugs live in `EDGE_CASES.md`, not here.

Audited against commit `4c19988` (2026-07-08). If this file and the actual code disagree, the code has moved on — update this file, don't trust it blindly.

## 1. System prompt (`src/ai/chat.ts`)

Current: one sentence — "You are a helpful CLI AI assistant... Keep your answers extremely concise..." No loop guidance, no grounding rules, no stop conditions. This is the single biggest source of "vague" behavior: the model has never been told it's running in a loop, that it should verify before claiming success, or when to stop and ask.

Target — replace the `system` string with:

```
You are Terminal Agent, an autonomous coding agent with direct access to the
user's local shell and filesystem via tools. You operate in a continuous
Action -> Observation -> Action loop until the task is done.

You do not need to ask before using read_file, list_dir, grep, change_directory,
or execute_command for routine, reversible actions (reading, listing, building,
testing, git status/diff). Proceed -- that's the point of the loop.

Never state that a file was written, a command succeeded, or tests passed
unless a tool result in this session proves it.

Never edit a file you haven't read this session.

If a command is destructive or hard to reverse (deleting files, force-pushing,
sudo, installing global packages, piping a remote script into a shell), say
exactly what you're about to run and why before calling execute_command --
the confirmation modal enforces the actual gate, but flag it in your own
reasoning too so the user isn't surprised by what they're confirming.

If a command fails, read the actual error before retrying. Don't retry an
identical failing command more than once -- change approach or report the
blocker.

Keep status updates short and concrete. Silence during a long tool loop is
worse than a slightly noisy one.
```

This references the tool names that actually exist in this codebase (`read_file`, `write_file`, `execute_command`, `change_directory`, `spawn_subagent`, plus the `list_dir`/`grep` this doc adds below) rather than generic ones.

## 2. Tool-calling

Current tools (`src/tools/index.ts`): `read_file`, `write_file`, `execute_command`, `change_directory`, `spawn_subagent`. Confirmation is one flat check in `cli.tsx`: `toolCalls.some(tc => tc.toolName === 'execute_command')`. Everything else auto-runs, including `write_file`.

### Missing tools

- `list_dir` / `grep` — right now any exploration goes through `execute_command` (`ls`, `find`, `grep` via shell), which trips the confirmation modal and the TUI-suspend/resume dance meant for real shell commands. Add these as separate, always-auto-run tools — that alone removes most of the friction that probably reads as "vague."

### Risk tiers (replace the flat `execute_command` check)

| Tier | Behavior | Tools / patterns |
|---|---|---|
| 1 — auto-run | no confirmation | `read_file`, `list_dir`, `grep`, `change_directory`; `execute_command` when it matches a safe allowlist (`git status`, `git diff`, `git log`, `bun test`, `tsc --noEmit`, `ls`, `cat`, `find`, `grep`) |
| 2 — confirm once per session | asks the first time, then remembered | `write_file`, `git commit`, `bun add` / `npm install`, `mkdir` |
| 3 — always confirm | every time, no exceptions | `rm -rf`, `sudo *`, `git push --force`, `dd`, anything piping a remote script into a shell, edits outside the project root or under `~/.terminal-agent` |

`write_file` currently runs as tier-1 with zero confirmation. Fix that before anything else in this table — it's the one that can actually destroy work.

### `spawn_subagent`

Currently fires a detached `processAIResponse(...).then(...)` with no `.catch()`, and the comment "Wait, how does it report back? For now, it just runs" is still in the shipped code. Before this is more than a demo:

- Give it a result channel — when the sub-agent's loop finishes, push something the parent session can actually see, not just "switch to it and look."
- Add the missing `.catch()` — an unhandled rejection in a detached promise currently just disappears.
- Decide its own risk tier. Right now spawning one isn't gated at all, and a sub-agent can call `execute_command` independently, which is what raises the concurrency issue in `EDGE_CASES.md`.

## 3. Context window management

Current: none. `MessageView`'s 1000-character slice in `cli.tsx` is display-only — the full, untruncated tool output goes into `messagesForAi` / conversation history on every subsequent call (`executeToolsAndContinue` pushes `String(result)` uncapped). One large `cat` or `find` result stays in the prompt, in full, for the rest of the session.

Target:

- Cap what's actually sent to the model per tool result (e.g. 2-4k characters), independent of what's shown in the UI. Keep the full result in SQLite if you want it recoverable, but don't resend it every turn.
- Summarize or drop tool results older than N turns once a session gets long, instead of keeping every one verbatim forever.
- Track approximate token usage per session (the `ai` SDK exposes usage on the stream) and compact proactively, rather than finding out from a 400.

## 4. RAG

Current: none. This is a coding agent operating on local repos, not a general knowledge base — don't reach for a vector DB first.

1. **Lexical pass, do this first**: the missing `grep`/`list_dir` tools above. Ripgrep-backed search beats semantic search most of the time in a codebase this size, and it's free.
2. **Semantic layer, only once grep stops being enough**: file- or function-level embeddings, stored via `bun:sqlite` — a vector extension, or even cached embeddings with in-process cosine similarity for a repo this size. You don't need a hosted vector DB for a single-user local tool.
3. Whichever layer, inject only the top few relevant chunks into context, not whole files — otherwise you've just moved the context-window problem from tool output to retrieved context.

## 5. UI

Concrete findings, not general "improve the UI" advice:

- `theme.ts` defines `terminal`, `ai`, `plan`, `confirm`, `error`. `MessageView` in `cli.tsx` references `theme.colors.userPrompt` and `theme.colors.agentResponse` — neither key exists, so the "You:" / "Agent:" labels render with no color. Add the missing keys, or point them at `theme.colors.terminal` / `theme.colors.ai`.
- `Autocomplete.tsx` is a placeholder ("Placeholder for future Phase 8") that echoes the query back — `fuzzysort` is installed and unused. Wire it: filter a static command list (`/clear`, `/mode`, `/models`, `/session`) through `fuzzysort.go(query, commands)`, render the matches. No new architecture needed, it's a one-file change.
- Colors elsewhere are raw string literals (`'cyanBright'`, `'gray'`, `'yellow'`) scattered directly in JSX instead of routed through `theme`. Route everything through `theme.colors` so the palette lives in one place — this is most of what "premium and cohesive" means in practice.
- There's no real visual distinction for "plan" beyond a border color — the original design called for a genuine planning step, not just a magenta accent on a header. Either implement an actual plan-then-execute display, or drop it from the palette so it's not implying something that isn't there.
