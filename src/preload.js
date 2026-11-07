const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stn', {
  state: () => ipcRenderer.invoke('state'),
  getNote: id => ipcRenderer.invoke('note:get', id),
  setText: (id, text) => ipcRenderer.send('note:text', id, text),
  setColor: (id, color) => ipcRenderer.send('note:color', id, color),
  toggleTop: id => ipcRenderer.send('note:toggleTop', id),
  hide: id => ipcRenderer.send('note:hide', id),
  open: id => ipcRenderer.send('note:open', id),
  remove: id => ipcRenderer.send('note:delete', id),
  newNote: color => ipcRenderer.send('note:new', color),
  showAll: () => ipcRenderer.send('notes:showAll'),
  hideAll: () => ipcRenderer.send('notes:hideAll'),
  openCentre: () => ipcRenderer.send('centre:open'),
  setStartup: on => ipcRenderer.send('settings:startup', on),
  onChanged: cb => ipcRenderer.on('notes:changed', (_e, s) => cb(s)),
  onColor: cb => ipcRenderer.on('note:color', (_e, name, hex) => cb(name, hex)),
  onTop: cb => ipcRenderer.on('note:onTop', (_e, v) => cb(v))
});
