# Changelog

All notable changes to Squeeze the Notes. Newest first.
Format: version, date, then Added / Changed / Fixed / Removed.

## [Unreleased]
- Nothing yet.

## [1.1.0] - 2026-11-07
### Added
- Daily backups: one snapshot per day in `%APPDATA%\Squeeze the Notes\backups`, last 14 kept. "Backups" button in the control centre and tray opens the folder.
- Export: saves every note to a .txt file (control centre "Export" button, or tray menu).
- Global hotkeys: Ctrl+Alt+N new note, Ctrl+Alt+S show all notes. Listed in the control centre footer, marked "(in use)" if another app owns them.
- Off-screen rescue: notes that would open off every screen (monitor unplugged, resolution or scaling changed) are moved back onto the main screen.

### Fixed
- Damaged notes file: v1.0 started empty and then saved over the damaged file, losing every note. Now the damaged file is kept aside and the newest readable backup is restored, with a notice in the control centre.

### Tested
- Linux, headless: damaged-file recovery (skips a broken backup), backup pruning, export, off-screen rescue, Ctrl+Alt+N via a real key press.
- Windows (Lyndon's PC, 7 Nov 2026): upgrade from 1.0.0 kept notes; Ctrl+Alt+N and Ctrl+Alt+S work from other apps; Backups folder has today's file; Export saves a readable .txt; no shortcut conflicts.
- Not tested: live monitor unplugging (display-change events).

## [1.0.0] - 2026-11-06
### Added
- Sticky notes: plain text, drag by top bar, resize from any edge, autosave while typing.
- 6 muted colours, chosen from the colour dot on each note.
- On-top / send-behind toggle (arrow button).
- Close (x) hides a note; it stays in the control centre.
- Control centre: list of all notes, Show / Hide / Delete, new note in any colour, Show all / Hide all.
- "Show notes when PC starts" setting (on by default).
- System tray icon with menu; app keeps running in the tray.
- Windows installer (NSIS), desktop and Start menu shortcuts.

### Notes
- 2026-11-07: source code rebuilt from the original chat after the build workspace was lost. Verified identical to the shipped installer. Added README, CLAUDE.md, CHANGELOG, BACKLOG, Git.
- 2026-11-07: tested on Lyndon's Windows PC. Installs and runs.
- 2026-11-07: folder deleted by GitHub Desktop (wrong Remove option) and restored again from the cloud build workspace. Git history restarted; app code unaffected.
