const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const COLORS = {
  sand:     '#E8DDC4',
  sage:     '#CBD5C0',
  rose:     '#E4CBC5',
  slate:    '#C6CFDA',
  lavender: '#D5CDDC',
  stone:    '#DAD6CE'
};

const isStartup = process.argv.includes('--startup');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => openCentre());
}

// ---------- storage ----------
const dataFile = () => path.join(app.getPath('userData'), 'notes.json');
const backupDir = () => path.join(app.getPath('userData'), 'backups');
const KEEP_BACKUPS = 14;
const BACKUP_NAME = /^notes-\d{4}-\d{2}-\d{2}\.json$/;
let db = { settings: { showOnStartup: true }, notes: [] };
let notice = '';

const pad = n => String(n).padStart(2, '0');
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readDb(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!raw || typeof raw !== 'object') throw new Error('not an object');
  return {
    settings: Object.assign({ showOnStartup: true }, raw.settings || {}),
    notes: Array.isArray(raw.notes) ? raw.notes : []
  };
}

function listBackups() {
  try { return fs.readdirSync(backupDir()).filter(f => BACKUP_NAME.test(f)).sort(); }
  catch (_) { return []; }
}

function load() {
  if (!fs.existsSync(dataFile())) return; // first run
  try {
    db = readDb(dataFile());
    return;
  } catch (_) { /* unreadable: recover below */ }

  // Keep the broken file for inspection; never save over it.
  const stamp = `${localDate()}-${Date.now()}`;
  try { fs.renameSync(dataFile(), dataFile().replace(/\.json$/, `.corrupt-${stamp}.json`)); } catch (_) {}

  for (const f of listBackups().reverse()) {
    try {
      db = readDb(path.join(backupDir(), f));
      notice = `Notes file was damaged. Restored from backup ${f.slice(6, 16)}.`;
      saveNow();
      return;
    } catch (_) { /* try an older one */ }
  }
  notice = 'Notes file was damaged and no backup could be read. The damaged file was kept in the data folder.';
}

// One snapshot per day, taken the first time the app runs that day.
function backupIfDue() {
  try {
    if (!db.notes.length) return;
    fs.mkdirSync(backupDir(), { recursive: true });
    const target = path.join(backupDir(), `notes-${localDate()}.json`);
    if (fs.existsSync(target)) return;
    fs.writeFileSync(target, JSON.stringify(db, null, 2));
    const all = listBackups();
    all.slice(0, Math.max(0, all.length - KEEP_BACKUPS))
      .forEach(f => fs.unlinkSync(path.join(backupDir(), f)));
  } catch (e) { console.error('backup failed:', e.message); }
}

async function exportTxt() {
  const opts = {
    title: 'Export notes',
    defaultPath: path.join(app.getPath('documents'), `Squeeze the Notes ${localDate()}.txt`),
    filters: [{ name: 'Text', extensions: ['txt'] }]
  };
  const parent = centreWin && !centreWin.isDestroyed() ? centreWin : null;
  const { canceled, filePath } = parent ? await dialog.showSaveDialog(parent, opts) : await dialog.showSaveDialog(opts);
  if (canceled || !filePath) return false;
  const nl = process.platform === 'win32' ? '\r\n' : '\n';
  const body = [...db.notes]
    .sort((a, b) => a.created - b.created)
    .map(n => `--- ${n.title ? n.title + ' | ' : ''}${n.color}, last edited ${new Date(n.updated).toLocaleString('en-GB')} ---${nl}${(n.text || '').trim() || '(empty)'}`.replace(/\r?\n/g, nl))
    .join(nl + nl);
  fs.writeFileSync(filePath, body + nl);
  return true;
}

function openBackups() {
  fs.mkdirSync(backupDir(), { recursive: true });
  shell.openPath(backupDir());
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 300);
}
function saveNow() {
  clearTimeout(saveTimer);
  const tmp = dataFile() + '.tmp';
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, dataFile());
}

const findNote = id => db.notes.find(n => n.id === id);

// ---------- windows ----------
const noteWins = new Map();
let centreWin = null;
let tray = null;
let quitting = false;

function notifyCentre() {
  if (centreWin && !centreWin.isDestroyed()) centreWin.webContents.send('notes:changed', publicState());
}
function publicState() {
  return { settings: db.settings, notes: db.notes, colors: COLORS, notice, hotkeys: hotkeyInfo() };
}

// ---------- global hotkeys ----------
const HOTKEYS = [
  { id: 'new',  accel: 'CommandOrControl+Alt+N', label: 'Ctrl+Alt+N', what: 'new note',  run: () => createNote() },
  { id: 'show', accel: 'CommandOrControl+Alt+S', label: 'Ctrl+Alt+S', what: 'show all', run: () => showAllToFront() }
];
const hotkeyOk = {};

function registerHotkeys() {
  for (const h of HOTKEYS) {
    try { hotkeyOk[h.id] = globalShortcut.register(h.accel, h.run); }
    catch (_) { hotkeyOk[h.id] = false; }
  }
}
function hotkeyInfo() {
  return HOTKEYS.map(h => ({ label: h.label, what: h.what, ok: !!hotkeyOk[h.id] }));
}
function showAllToFront() {
  db.notes.forEach(n => openNote(n.id, false));
}

function createNote(color) {
  const area = screen.getPrimaryDisplay().workArea;
  const offset = (db.notes.length % 8) * 28;
  const note = {
    id: crypto.randomUUID(),
    title: '',
    text: '',
    color: color && COLORS[color] ? color : 'sand',
    x: area.x + area.width - 260 - offset,
    y: area.y + 60 + offset,
    w: 220,
    h: 200,
    open: true,
    onTop: true,
    created: Date.now(),
    updated: Date.now()
  };
  db.notes.push(note);
  save();
  openNote(note.id, true);
  notifyCentre();
  return note;
}

// ---------- off-screen rescue ----------
// A note counts as visible if enough of its top bar (the drag handle) is on some screen.
function isReachable(b) {
  return screen.getAllDisplays().some(d => {
    const a = d.workArea;
    const ix = Math.min(b.x + b.width, a.x + a.width) - Math.max(b.x, a.x);
    const iy = Math.min(b.y + 26, a.y + a.height) - Math.max(b.y, a.y);
    return ix >= 60 && iy >= 20;
  });
}

function rescuedBounds(b, slot) {
  if (isReachable(b)) return null;
  const a = screen.getPrimaryDisplay().workArea;
  const w = Math.min(b.width, a.width), h = Math.min(b.height, a.height);
  const off = (slot % 8) * 28;
  return { x: a.x + a.width - w - 40 - off, y: a.y + 60 + off, width: w, height: h };
}

function rescueNote(note, slot) {
  const nb = rescuedBounds({ x: note.x, y: note.y, width: note.w, height: note.h }, slot);
  if (!nb) return false;
  Object.assign(note, { x: nb.x, y: nb.y, w: nb.width, h: nb.height });
  const win = noteWins.get(note.id);
  if (win && !win.isDestroyed()) win.setBounds(nb);
  return true;
}

let rescueSlot = 0;
function rescueAll() {
  let moved = 0;
  db.notes.forEach(n => { if (rescueNote(n, moved)) moved++; });
  if (moved) { save(); notifyCentre(); }
}

function openNote(id, focus) {
  const note = findNote(id);
  if (!note) return;
  note.open = true;
  if (rescueNote(note, rescueSlot)) rescueSlot++;
  save();

  let win = noteWins.get(id);
  if (win && !win.isDestroyed()) {
    win.show();
    win.setAlwaysOnTop(note.onTop);
    win.moveTop();
    if (focus) win.focus();
    notifyCentre();
    return;
  }

  win = new BrowserWindow({
    x: note.x, y: note.y, width: note.w, height: note.h,
    minWidth: 150, minHeight: 110,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: note.onTop,
    backgroundColor: COLORS[note.color] || COLORS.sand,
    show: false,
    title: 'Squeeze the Notes',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  noteWins.set(id, win);
  win.loadFile(path.join(__dirname, 'note.html'), { query: { id } });
  win.once('ready-to-show', () => { focus ? win.show() : win.showInactive(); });

  const storeBounds = () => {
    if (win.isDestroyed()) return;
    const b = win.getBounds();
    Object.assign(note, { x: b.x, y: b.y, w: b.width, h: b.height });
    save();
  };
  win.on('moved', storeBounds);
  win.on('resized', storeBounds);
  win.on('closed', () => noteWins.delete(id));
  notifyCentre();
}

function hideNote(id) {
  const note = findNote(id);
  if (!note) return;
  note.open = false;
  save();
  const win = noteWins.get(id);
  if (win && !win.isDestroyed()) win.close();
  notifyCentre();
}

function deleteNote(id) {
  const win = noteWins.get(id);
  if (win && !win.isDestroyed()) win.close();
  db.notes = db.notes.filter(n => n.id !== id);
  save();
  notifyCentre();
}

function openCentre() {
  if (centreWin && !centreWin.isDestroyed()) {
    centreWin.show();
    centreWin.focus();
    return;
  }
  centreWin = new BrowserWindow({
    width: 420, height: 560, minWidth: 340, minHeight: 360,
    title: 'Squeeze the Notes',
    backgroundColor: '#F4F1EC',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  centreWin.setMenu(null);
  centreWin.loadFile(path.join(__dirname, 'centre.html'));
  centreWin.on('closed', () => { centreWin = null; });
}

function applyLoginItem() {
  if (process.platform !== 'win32' && process.platform !== 'darwin') return;
  app.setLoginItemSettings({
    openAtLogin: db.settings.showOnStartup,
    path: process.execPath,
    args: ['--startup']
  });
}

function buildTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Squeeze the Notes');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'New note', accelerator: 'CommandOrControl+Alt+N', click: () => createNote() },
    { label: 'Control centre', click: () => openCentre() },
    { label: 'Show all notes', accelerator: 'CommandOrControl+Alt+S', click: () => showAllToFront() },
    { label: 'Hide all notes', click: () => db.notes.forEach(n => hideNote(n.id)) },
    { type: 'separator' },
    { label: 'Export notes to text...', click: () => exportTxt() },
    { label: 'Open backups folder', click: () => openBackups() },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', () => openCentre());
}

// ---------- IPC ----------
ipcMain.handle('state', () => publicState());
ipcMain.handle('note:get', (_e, id) => ({ note: findNote(id), colors: COLORS }));

ipcMain.on('note:text', (_e, id, text) => {
  const n = findNote(id);
  if (!n) return;
  n.text = String(text).slice(0, 5000);
  n.updated = Date.now();
  save();
  notifyCentre();
});

ipcMain.on('note:title', (_e, id, title) => {
  const n = findNote(id);
  if (!n) return;
  n.title = String(title).replace(/[\r\n]+/g, ' ').slice(0, 80);
  n.updated = Date.now();
  save();
  notifyCentre();
});

ipcMain.on('note:color', (_e, id, color) => {
  const n = findNote(id);
  if (!n || !COLORS[color]) return;
  n.color = color;
  save();
  const win = noteWins.get(id);
  if (win && !win.isDestroyed()) {
    win.setBackgroundColor(COLORS[color]);
    win.webContents.send('note:color', color, COLORS[color]);
  }
  notifyCentre();
});

ipcMain.on('note:toggleTop', (_e, id) => {
  const n = findNote(id);
  if (!n) return;
  n.onTop = !n.onTop;
  save();
  const win = noteWins.get(id);
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(n.onTop);
    if (n.onTop) { win.moveTop(); win.focus(); }
    else { win.blur(); }
    win.webContents.send('note:onTop', n.onTop);
  }
  notifyCentre();
});

ipcMain.on('note:hide', (_e, id) => hideNote(id));
ipcMain.on('note:new', (_e, color) => createNote(color));
ipcMain.on('note:open', (_e, id) => openNote(id, true));
ipcMain.on('note:delete', (_e, id) => deleteNote(id));
ipcMain.on('notes:showAll', () => db.notes.forEach(n => openNote(n.id, false)));
ipcMain.on('notes:hideAll', () => db.notes.forEach(n => hideNote(n.id)));
ipcMain.on('centre:open', () => openCentre());
ipcMain.handle('notes:export', () => exportTxt());
ipcMain.on('backups:open', () => openBackups());

ipcMain.on('settings:startup', (_e, on) => {
  db.settings.showOnStartup = !!on;
  saveNow();
  applyLoginItem();
  notifyCentre();
});

// ---------- lifecycle ----------
app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('com.squeezethenotes.app');
  load();
  backupIfDue();
  setInterval(backupIfDue, 60 * 60 * 1000); // catches PCs left on past midnight
  applyLoginItem();
  buildTray();
  registerHotkeys();

  db.notes.filter(n => n.open).forEach(n => openNote(n.id, false));
  rescueSlot = 0;

  // Monitor unplugged, resolution or scaling changed: pull notes back into view.
  let rescueTimer = null;
  const scheduleRescue = () => { clearTimeout(rescueTimer); rescueTimer = setTimeout(rescueAll, 500); };
  screen.on('display-removed', scheduleRescue);
  screen.on('display-metrics-changed', scheduleRescue);

  if (!isStartup) {
    openCentre();
    if (db.notes.length === 0) createNote('sand');
  }
});

// Keep running in the tray when every window is closed.
app.on('window-all-closed', () => { /* stay alive in tray */ });
app.on('before-quit', () => { quitting = true; saveNow(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
