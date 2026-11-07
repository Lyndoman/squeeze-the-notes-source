# Backlog

Work not yet done, in priority order. Move items to CHANGELOG.md when shipped.
Status: Next / Later / Maybe / Rejected

## Next
| # | Item | Why | Effort | Status |
|---|---|---|---|---|
| 11 | Restore from backup button | Restoring is manual today: quit the app, copy a file from backups over notes.json. Fine for the owner, hard for anyone it is shared with. | Low | Later, if needed |

Shipped in 1.1.0: backup and export, off-screen rescue, global hotkey (see CHANGELOG.md).

## Checks to do on Windows (owner)
| Check | How | Status |
|---|---|---|
| Restart | Reboot; do notes come back? | To do |
| Survives quitting | Write a note, Quit from tray, reopen | To do |
| Send behind | Arrow button, then click another window | To do |
| Upgrade | Install 1.1.0 over 1.0.0; are existing notes still there? | Passed 7 Nov |
| Hotkeys | Ctrl+Alt+N and Ctrl+Alt+S from another app | Passed 7 Nov |
| Backups | Control centre > Backups; is today's file there? | Passed 7 Nov |
| Export | Control centre > Export; open the .txt | Passed 7 Nov |

## Later (decide after a few weeks of use)
| # | Item | Why | Effort |
|---|---|---|---|
| 4 | Auto-update | Avoid re-sending an 81MB file for every fix. Via GitHub Releases. | Medium |
| 5 | Trash instead of hard delete | 30-day undo for deleted notes. | Low |
| 6 | Search in control centre | Only useful past ~30 notes. | Low |
| 7 | Text size per note | Ctrl+scroll to zoom. | Low |
| 8 | Tidy arrange | Stack or grid all notes in one click. | Medium |
| 9 | Code signing | Removes SmartScreen warning. ~£200-400/yr. | Medium + cost |

## Maybe
| # | Item | Why not yet |
|---|---|---|
| 10 | Sync across PCs | Accounts, conflicts, hosting. Only if this becomes a product. |

## Rejected
| Item | Reason |
|---|---|
| Reminders, formatting, tags, checklists | Pushes the app toward Notion. Minimal is the point. |
| Rich text (bold/italic/lists) with a bottom toolbar | Asked 7 Nov 2026, held off after pushback. Would force a storage-format change (plain text -> HTML/Markdown), a rewrite of the note editor (textarea -> contenteditable), and a rethink of .txt export. Revisit only with a clear answer to: what specifically needs emphasis, and is a one-way conversion of existing notes acceptable. |

## Bugs
- None reported.
