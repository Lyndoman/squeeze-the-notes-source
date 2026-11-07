const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } = require('electron');
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
let db = { settings: { showOnStartup: true }, notes: [] };

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
    db = {
      settings: Object.assign({ showOnStartup: true }, raw.settings || {}),
      notes: Array.isArray(raw.notes) ? raw.notes : []
    };
  } catch (_) { /* first run */ }
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
  return { settings: db.settings, notes: db.notes, colors: COLORS };
}

function createNote(color) {
  const area = screen.getPrimaryDisplay().workArea;
  const offset = (db.notes.length % 8) * 28;
  const note = {
    id: crypto.randomUUID(),
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

function openNote(id, focus) {
  const note = findNote(id);
  if (!note) return;
  note.open = true;
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
    { label: 'New note', click: () => createNote() },
    { label: 'Control centre', click: () => openCentre() },
    { label: 'Show all notes', click: () => db.notes.forEach(n => openNote(n.id, false)) },
    { label: 'Hide all notes', click: () => db.notes.forEach(n => hideNote(n.id)) },
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
  applyLoginItem();
  buildTray();

  db.notes.filter(n => n.open).forEach(n => openNote(n.id, false));

  if (!isStartup) {
    openCentre();
    if (db.notes.length === 0) createNote('sand');
  }
});

// Keep running in the tray when every window is closed.
app.on('window-all-closed', () => { /* stay alive in tray */ });
app.on('before-quit', () => { quitting = true; saveNow(); });
