# Squeeze the Notes: project brief for AI sessions

Read this first. Then read BACKLOG.md and the top of CHANGELOG.md.

## What it is
A minimal sticky-note app for the Windows desktop. Owner: Lyndon Antcliff (novice developer, does all real-Windows testing).
Electron app, NSIS installer, Windows only. Shared with others as an unsigned installer.

## Current state
- Version: 1.1.0 (see CHANGELOG.md). 1.1.0 tested on Lyndon's Windows PC (7 Nov 2026): all checks passed.
- Installers: ../Squeeze-the-Notes-Setup/ (keep old versions there; zip for sharing)
- User data: %APPDATA%\Squeeze the Notes\notes.json, daily backups in backups\ (last 14)
- Pushing to GitHub: Lyndon pushes with GitHub Desktop (repo Lyndoman/squeeze-the-notes-source, private). The shell on his PC has no GitHub login, so commit there and ask him to click Push.
- Transfers: device_commit_files rejects .exe files. Send the zip and unzip it on the PC.

## Rules
1. Minimal is the product. Push back on features that move it toward Notion (reminders, formatting, tags, checklists).
2. One change at a time. Build, Lyndon tests on Windows, then commit.
3. Never claim something works on Windows. You can only test on Linux. Say what was tested and what was not.
4. Every finished change: update CHANGELOG.md, BACKLOG.md, version in package.json, and make a Git commit.
5. Keep all records in this folder, not only in chat. Chat sessions and cloud workspaces get wiped.
6. Never break existing notes.json files. New fields must have defaults.
7. Writing style for Lyndon: terse, direct, no em dashes, pushback welcome.
8. Commits use the GitHub no-reply email (12440709+Lyndoman@users.noreply.github.com), set in this repo's git config. Never commit with the Gmail address. The first 5 commits show Gmail; accepted by Lyndon.

## How to build
Needs Node.js. On Linux the Windows build also needs wine.
    npm install
    npm start          # run without installing
    npm run dist       # installer goes to dist\
Copy the finished installer to ../Squeeze-the-Notes-Setup/ and zip it before sharing (bare .exe files get blocked by browsers and email).

## Versioning
1.0.1 = bug fix. 1.1.0 = new feature. 2.0.0 = big or breaking change.

## Key decisions (why things are the way they are)
| Decision | Reason |
|---|---|
| Electron | Only stack that can be built into a Windows installer from the cloud workspace. Cost: ~81MB. |
| Close (x) hides, does not delete | One misclick should not lose a note. Delete lives in the control centre. |
| "Send behind" = always-on-top toggle | Windows does not reliably let apps sit under desktop icons. |
| Plain text only | Like a real post-it. |
| Unsigned installer | Code signing costs ~£200-400/yr. SmartScreen warning accepted for now. |
| Source rebuilt 7 Nov 2026 | Original was lost with a cloud session. Rebuilt from chat, verified byte-identical to the 1.0.0 installer. |
| Rebuilt again 7 Nov 2026 (same day) | Folder was deleted by GitHub Desktop's "remove and delete" option when fixing a mis-published repo. Restored from the cloud build workspace. Git history was lost and restarted fresh. |

## GitHub
GitHub Desktop was used once and went wrong: "Add local repository" created a brand new empty repo in a wrongly-named subfolder instead of publishing this one, and removing it from Desktop's list then deleted this entire folder from disk (the "also move to trash" option, not "just remove from list"). Be careful with GitHub Desktop's Remove dialog: it has both options, and the destructive one is easy to pick by accident.
Now connected: published correctly on 7 Nov 2026 as Lyndoman/squeeze-the-notes-source (private).
