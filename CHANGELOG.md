# Changelog

All notable changes to this project will be documented in this file.

> **Convention:** one entry per logical change, added in the same commit as the change itself — not written up after the fact. When an item finishes on `ROADMAP.md`, it moves here with what actually changed. Keep everything under `[Unreleased]` until there's a real release cut, then date it and start a fresh `[Unreleased]`.

## [Unreleased]

### Added
- **Tool Risk Tiers**: Introduced risk tiers for tools (auto-run for Tier-1, single confirm for Tier-2) to improve UX and security.
- **Read-only Tools**: Added `list_dir` and `grep` read-only tools to enable agents to search without triggering command confirmation hurdles.
- **Context Truncation**: Truncated overly large tool output responses before appending them to the session history to avoid blowing out context windows.
- **Full-Screen TUI Environment**: Implemented a single-column, full-screen Terminal User Interface (TUI) using Ink.
- **Alternate Screen Buffer**: Application seamlessly takes over the terminal window (`\x1b[?1049h`) and restores previous terminal history upon exit (`\x1b[?1049l`).
- **Interactive UI Updates**: Added real-time rendering of execution status, active modes, and provider info to the input pane.
- **Path Autocompletion**: Added filesystem autocompletion triggered by the `Tab` key when typing `cd ` commands.
- **SQLite Session Management**: Implemented persistent chat and tool execution sessions stored in `sessions.sqlite`.
- **Shortcut Commands**: Added hotkeys for toggling modes (`Ctrl+O`), opening provider menus (`Ctrl+P`), managing sessions (`Ctrl+T`), and navigating history.
- **`userPrompt` and `agentResponse` colors**: Added missing theme colors to `theme.ts`.
- **Sub-agent robustness**: Added `.catch()` block and parent-session result channel to `spawn_subagent`.

### Changed
- **System Prompt Refactor**: Greatly expanded the `chat.ts` system prompt to thoroughly ground the agent in the `Action -> Observation -> Action` loop.
- **Process Orchestration**: Replaced Node's raw `child_process.exec` with `execa` in `execute_command` for robust process execution.
- **Layout Restructure**: Reverted from a side-by-side sidebar approach to a perfectly linear layout to restore native text selection without crossover bugs.
- **UI Polish**: Updated terminal output labels to `System:` and brightened top-bar text colors (`CyanBright` and `White`) for improved visibility.

### Fixed
- **AI SDK Validation Crash ("Agent doesn't reply")**: Fixed a bug where `executeToolsAndContinue` sent malformed `tool-result` payloads (`output` key instead of `result`), causing the Vercel AI SDK to throw synchronous `TypeValidationError` errors. Also patched terminal command mode to inject proper dummy `toolCallId` to satisfy SDK schema requirements.
- **Confirmation Hijacking**: Refactored `AppState` to house `isConfirming` and `confirmPrompt` inside `Session` to prevent background tasks from hijacking the active session's confirmation modal.
- **Autocomplete Module**: Wired up `fuzzysort` to power `Autocomplete.tsx` properly instead of acting as a literal echo placeholder.
- **Theme Rendering**: Fixed non-existent color keys in `theme.ts` that caused labels to render colorless in `cli.tsx`.
- **Input Bleeding Bug**: Blocked `Ctrl+O`, `Ctrl+P`, and `Ctrl+T` shortcut characters from leaking into the text input area by strictly dropping keystrokes occurring within 150ms of a Ctrl modifier.
- **Permission Flow Crash**: Resolved a SQLite `NOT NULL` constraint error by passing the active `sessionId` through the confirmation modal during pending tool executions.
- **Database Schema Validation**: Handled missing columns dynamically during database initialization.
