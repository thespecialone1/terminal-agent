# AGENTS.md — terminal-agent

Read this before writing any code, every session. This is the single source of truth for how to work on this project — `CLAUDE.md` just imports it, so this applies regardless of which tool you are.

## What this is

A terminal coding agent (TUI) built with Bun + Ink (React) + the Vercel `ai` SDK, supporting Anthropic, OpenAI, and DeepSeek. It runs an autonomous Action → Observation → Action loop: the model calls tools, tools execute against the local filesystem and shell, results feed back automatically.

## Where things live

- `src/cli.tsx` — main app: reducer wiring, the AI-response loop (`processAIResponse` / `executeToolsAndContinue`), rendering.
- `src/app/` — state (`state.ts`), actions (`actions.ts`), reducer (`reducer.ts`), config/API keys (`config.ts`).
- `src/ai/` — provider selection (`provider.ts`), the model call + system prompt (`chat.ts`).
- `src/tools/` — tool schemas and their real implementations (`index.ts`).
- `src/ui/` — Ink components (`InputBar`, `Autocomplete`, `ConfirmModal`, `ProviderMenu`, `theme`).
- `src/database.ts` — SQLite session persistence.

Required reading before starting a task, in this order: `ROADMAP.md` (what's actually next), `ARCHITECTURE.md` (target design for system prompt / tool-calling / RAG / context management), `EDGE_CASES.md` (known gotchas — check before you reintroduce one).

## Hard rules

Non-negotiable. If a request conflicts with one of these, say so instead of quietly going around it.

1. **Never claim something works without running it.** Run the build, run the relevant test, run the actual command, report what really happened — not what should happen.
2. **Read a file before you write or patch it.** Don't reconstruct contents from memory of an earlier turn. Re-read if anything else could have touched it since.
3. **Don't invent APIs, flags, or config keys.** If you're not certain a method/option exists on `ai`, `ink`, `zod`, or a provider SDK, check `node_modules/<pkg>/` or its types first. This codebase already has `as any` casts papering over exactly this kind of mismatch — don't add more; fix the underlying type gap or flag it.
4. **New tool-execution paths get a risk tier before they ship.** See `ARCHITECTURE.md` for tier definitions. `execute_command`-style confirmation is not an acceptable default for a new tool — decide deliberately whether it auto-runs, asks once, or always asks.
5. **One logical change per commit, message says what and why.** The existing history is a single commit — don't extend that pattern. Update `CHANGELOG.md` in the same commit as the change it describes, not as an afterthought.
6. **No scratch files at the repo root.** Ad hoc `test-*.ts` scripts belong in a gitignored `scratch/` folder, or better, become real cases in a `*.test.ts` file. Delete them once they've served their purpose.
7. **Don't touch API-key storage without reading the relevant note in `EDGE_CASES.md` first** — it's currently plaintext, and a half-migration is worse than either clean state.

## Definition of done

Before calling anything finished: `bun test` passes, `tsc --noEmit` is clean, you've traced the unhappy path (bad input, missing file, denied confirmation, network error) and not just the happy one, and `CHANGELOG.md` has an entry.
