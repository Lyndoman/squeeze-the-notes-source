# Squeeze the Notes

Minimal sticky notes for the Windows desktop. Electron app, NSIS installer.

Version: 1.0.0 (source rebuilt 7 Nov 2026, verified identical to the shipped installer)

## Files

| Path | What it is |
|---|---|
| `package.json` | App name, version, build settings for the installer |
| `src/main.js` | Main process: windows, tray, storage, startup setting |
| `src/preload.js` | Safe bridge between the windows and the main process |
| `src/note.html` / `note.js` | A single sticky note |
| `src/centre.html` / `centre.js` | Control centre (list of all notes) |
| `src/icon.png` | Tray and window icon |
| `build/icon.png` / `icon.ico` | Installer and app icons |

## Run and build (needs Node.js)

```
npm install
npm start        # run the app without installing
npm run dist     # build the installer into dist\
```

## Data

Notes are saved to `%APPDATA%\Squeeze the Notes\notes.json`. No backup, no sync.

## Known limits

- Unsigned: Windows SmartScreen warns on install ("More info" > "Run anyway").
- About 81MB because of Electron.
- Not yet tested on real Windows by the builder.

## Planned v1.1

1. Backup and export
2. Off-screen rescue (pull notes back after a monitor change)
3. Global hotkey for a new note
