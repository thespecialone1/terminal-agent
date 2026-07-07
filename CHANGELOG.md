# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Full-Screen TUI Environment**: Implemented a single-column, full-screen Terminal User Interface (TUI) using Ink.
- **Alternate Screen Buffer**: Application seamlessly takes over the terminal window (`\x1b[?1049h`) and restores previous terminal history upon exit (`\x1b[?1049l`).
- **Path Autocompletion**: Added filesystem autocompletion triggered by the `Tab` key when typing `cd ` commands.
- **SQLite Session Management**: Implemented persistent chat and tool execution sessions stored in `sessions.sqlite`.
- **Shortcut Commands**: Added hotkeys for toggling modes (`Ctrl+O`), opening provider menus (`Ctrl+P`), managing sessions (`Ctrl+T`), and navigating history.

### Changed
- **Layout Restructure**: Reverted from a side-by-side sidebar approach to a perfectly linear layout to restore native text selection without crossover bugs.
- **UI Polish**: Updated terminal output labels to `System:` and brightened top-bar text colors (`CyanBright` and `White`) for improved visibility.

### Fixed
- **Input Bleeding Bug**: Blocked `Ctrl+O`, `Ctrl+P`, and `Ctrl+T` shortcut characters from leaking into the text input area by strictly dropping keystrokes occurring within 150ms of a Ctrl modifier.
- **Permission Flow Crash**: Resolved a SQLite `NOT NULL` constraint error by passing the active `sessionId` through the confirmation modal during pending tool executions.
- **Database Schema Validation**: Handled missing columns dynamically during database initialization.
