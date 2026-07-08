# ROADMAP.md — single source of truth for what's next

Check this before starting work. Update it as part of the same change that finishes an item — move finished items to `CHANGELOG.md` with what actually changed, don't just delete them here. If you start something not on this list, add it before you start; no undocumented side quests.

## Now — fix before adding anything new

*(All items in this section have been resolved and moved to CHANGELOG.md!)*

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

- 2026-07-08: Fixed `write_file` auto-run by gating it behind Tier-2 confirmation logic.
- 2026-07-08: Scoped `isConfirming` and `confirmPrompt` to per-session state to fix background agent UI hijacking.
- 2026-07-08: Added `userPrompt` and `agentResponse` colors to `theme.ts`.
- 2026-07-08: Added `.catch()` block and parent-session result channel to `spawn_subagent`.
- 2026-07-08: Capped tool results to 4000 characters before sending to the model to prevent unbounded context growth.
