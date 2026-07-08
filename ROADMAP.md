# ROADMAP.md — single source of truth for what's next

Check this before starting work. Update it as part of the same change that finishes an item — move finished items to `CHANGELOG.md` with what actually changed, don't just delete them here. If you start something not on this list, add it before you start; no undocumented side quests.

## Now — fix before adding anything new

- [ ] `write_file` auto-runs with zero confirmation. Move it to tier-2 (`ARCHITECTURE.md` §2).
- [ ] `isConfirming` / `confirmPrompt` are global state, not per-session — a background sub-agent can hijack the modal for whichever session the user is currently viewing (`EDGE_CASES.md`).
- [ ] `theme.colors.userPrompt` / `theme.colors.agentResponse` don't exist in `theme.ts` — message labels render uncolored.
- [ ] `spawn_subagent`'s detached promise has no `.catch()` and no result channel back to the parent session.
- [ ] Tool results are sent to the model with no size cap or compaction — unbounded context growth on any session with a large file read or command output.

## Next — the gaps that prompted this doc

- [ ] Real system prompt (`ARCHITECTURE.md` §1) — replace the one-liner in `src/ai/chat.ts`.
- [ ] Risk-tiered confirmation instead of the flat `execute_command` check (`ARCHITECTURE.md` §2).
- [ ] `list_dir` and `grep` tools, both tier-1 auto-run, so exploration stops going through `execute_command`.
- [ ] Real `Autocomplete.tsx` — wire up the already-installed `fuzzysort` against a static slash-command list.
- [ ] Context-window compaction (`ARCHITECTURE.md` §3).

## Later

- [ ] Lexical (grep-based) retrieval before anything semantic; revisit a vector layer only once grep stops being enough (`ARCHITECTURE.md` §4).
- [ ] Move API keys off plaintext `~/.terminal-agent/config.json` onto `Bun.secrets` (OS keychain).
- [ ] Standardize command execution on `execa` (already a dependency, currently unused) instead of the raw `node:child_process` + unused `promisify(exec)` in `src/tools/index.ts` — pick one approach, not three.
- [ ] Delete the 11 root-level `test-*.ts` scratch scripts, or fold the useful ones into real `*.test.ts` files.
- [ ] Remove the unused `@anthropic-ai/sdk` dependency (zero references — the `ai` SDK's `@ai-sdk/anthropic` is what's actually used).
- [ ] Decide `spawn_subagent`'s risk tier and whether nested sub-agents can themselves spawn sub-agents.
- [ ] Dated releases in `CHANGELOG.md` once there's an actual release cadence, instead of everything living under `[Unreleased]`.

## Done

Nothing yet — the first completed item moves here with a date and a one-line summary. The same change, with more detail, goes in `CHANGELOG.md`.
