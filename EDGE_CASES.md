# EDGE_CASES.md — known gotchas and unhandled paths

Check this before touching related code. Add to it whenever you hit something non-obvious — this file is more useful with 40 entries than 10.

## Confirmed bugs (found by reading the current code, commit `4c19988`)

- **Global confirmation state vs. per-session pending calls.** `AppState.isConfirming` / `confirmPrompt` are top-level fields; `Session.pendingToolCalls` is per-session. `REQUIRE_CONFIRMATION` sets the global flag regardless of which session raised it. If a background `spawn_subagent` session requests confirmation while the user is viewing a different session, the modal appears over whatever the user is doing, and `onConfirm` in `cli.tsx` resolves against `activeSession.pendingToolCalls` — the *currently viewed* session, not necessarily the one that asked. Fix: scope `isConfirming`/`confirmPrompt` per-session like `pendingToolCalls` already is, and show which session actually has the pending request if it's not the active one.
- **`spawn_subagent` has no error path.** `processAIResponse([initMsg], newSessionId).then(() => { ... })` has no `.catch()`. If the sub-agent's loop throws, it disappears silently.
- **`theme.colors.userPrompt` / `theme.colors.agentResponse` don't exist** (`theme.ts` only defines `terminal`, `ai`, `plan`, `confirm`, `error`) — those two `<Text color={...}>` calls in `MessageView` get `undefined` and render in the terminal's default color.
- **`write_file` has no confirmation and no read-before-write check.** The model can overwrite any file the process has permission to touch, first try, no gate.
- **`execute_command` has no timeout.** A hung or long-running command (an accidental dev server, an interactive prompt the passthrough doesn't handle) blocks the loop indefinitely — there's no `timeout_seconds` anywhere in the schema or the executor.
- **Duplicate `case 'TOGGLE_THOUGHT_VISIBILITY'`** in `reducer.ts` — the second is dead code. Harmless today, but a sign the reducer needs a `no-duplicate-case` lint pass.

## Not yet handled — think through before shipping related features

- **Network failure mid-stream.** If the provider connection drops partway through `streamChatResponse`, whatever's in `finalResponseText` gets saved as if it were the complete response — no "this response was cut off" marker.
- **Malformed tool-call arguments.** `agentTools` schemas are defined with zod, but nothing calls `.safeParse()` on the arguments before `executePendingTool` uses them directly (`args.path`, `args.content`, etc.). A model hallucinating an argument shape fails inside the tool, not at a clear validation boundary.
- **Empty or missing API key for the active provider.** `getApiKey` returns `undefined` silently — unclear what the actual failure looks like to the user in that case.
- **Provider rate limits / 429s.** No retry-with-backoff anywhere in `chat.ts` or `provider.ts`.
- **Two sessions writing the same file concurrently** (a sub-agent and the main session, or two sub-agents) — no locking, last write wins, no warning.
- **`execute_command` on something that expects stdin the agent can't provide** (a prompt with no default) — the passthrough handles genuinely interactive commands, but an agent-issued command that blocks on stdin with no one deciding what to type will hang the same as the no-timeout case above.
- **SQLite lock contention** if more than one `terminal-agent` process points at the same `~/.terminal-agent/history.sqlite`.
- **Ctrl+C mid-tool-execution** — unclear from the current code whether an in-flight `execute_command` child process gets killed or orphaned if the user force-quits.
