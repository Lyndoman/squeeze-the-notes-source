# Squeeze the Notes

Minimal sticky notes for the Windows desktop. Electron app, NSIS installer.

Version: 1.1.0

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

Notes are saved to `%APPDATA%\Squeeze the Notes\notes.json`. No sync.

Backups: one snapshot per day in `%APPDATA%\Squeeze the Notes\backups\`, last 14 kept.
To restore by hand: Quit from the tray, copy a `notes-YYYY-MM-DD.json` from backups over `notes.json`, start the app.
If notes.json is ever damaged, the app does this automatically and keeps the damaged file as `notes.corrupt-*.json`.

## Known limits

- Unsigned: Windows SmartScreen warns on install ("More info" > "Run anyway").
- About 81MB because of Electron.
- 1.0.0 tested on Windows (7 Nov 2026). 1.1.0 not yet tested on Windows.

## Shortcuts

- Ctrl+Alt+N: new note
- Ctrl+Alt+S: show all notes

See BACKLOG.md for what is planned next.
