const list = document.getElementById('list');
const startup = document.getElementById('startup');
const count = document.getElementById('count');
const newrow = document.getElementById('newrow');
let builtNew = false;

function ago(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return new Date(ts).toLocaleDateString();
}

function btn(label, cls, fn) {
  const b = document.createElement('button');
  b.className = 'ic ' + cls;
  b.textContent = label;
  b.onclick = e => { e.stopPropagation(); fn(); };
  return b;
}

function renderKeys(hotkeys) {
  const box = document.getElementById('keys');
  box.innerHTML = '';
  (hotkeys || []).forEach(h => {
    const line = document.createElement('div');
    const k = document.createElement('kbd');
    k.textContent = h.label;
    line.append(k, document.createTextNode(' ' + h.what));
    if (!h.ok) {
      line.className = 'bad';
      line.title = 'Another app is already using this shortcut';
      line.append(document.createTextNode(' (in use)'));
    }
    box.appendChild(line);
  });
}

function render({ settings, notes, colors, notice, hotkeys }) {
  startup.checked = !!settings.showOnStartup;
  renderKeys(hotkeys);
  const nb = document.getElementById('notice');
  nb.hidden = !notice;
  nb.textContent = notice || '';
  const open = notes.filter(n => n.open).length;
  count.textContent = `${notes.length} note${notes.length === 1 ? '' : 's'}, ${open} on screen`;

  if (!builtNew) {
    Object.entries(colors).forEach(([name, hex]) => {
      const d = document.createElement('div');
      d.className = 'new';
      d.style.background = hex;
      d.title = 'New ' + name + ' note';
      d.textContent = '+';
      d.onclick = () => window.stn.newNote(name);
      newrow.appendChild(d);
    });
    builtNew = true;
  }

  list.innerHTML = '';
  if (!notes.length) {
    const p = document.createElement('div');
    p.className = 'emptylist';
    p.textContent = 'No notes yet. Pick a colour above.';
    list.appendChild(p);
    return;
  }

  [...notes].sort((a, b) => b.updated - a.updated).forEach(n => {
    const li = document.createElement('li');
    if (!n.open) li.className = 'hidden';

    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = colors[n.color];

    const txt = document.createElement('div');
    txt.className = 'txt';
    txt.title = 'Bring to front';
    const b = document.createElement('b');
    const first = (n.title || '').trim() || (n.text || '').split('\n').find(l => l.trim());
    if (first) b.textContent = first.trim(); else { b.textContent = 'Empty note'; b.className = 'empty'; }
    const sm = document.createElement('small');
    sm.textContent = (n.open ? 'On screen' : 'Hidden') + ' · ' + ago(n.updated);
    txt.append(b, sm);
    txt.onclick = () => window.stn.open(n.id);

    const act = document.createElement('div');
    act.className = 'act';
    if (n.open) act.append(btn('Hide', '', () => window.stn.hide(n.id)));
    else act.append(btn('Show', '', () => window.stn.open(n.id)));
    act.append(btn('Delete', 'del', () => {
      if (confirm('Delete this note for good?')) window.stn.remove(n.id);
    }));

    li.append(chip, txt, act);
    list.appendChild(li);
  });
}

window.stn.state().then(render);
window.stn.onChanged(render);
startup.onchange = () => window.stn.setStartup(startup.checked);
document.getElementById('showAll').onclick = () => window.stn.showAll();
document.getElementById('hideAll').onclick = () => window.stn.hideAll();
document.getElementById('backupsBtn').onclick = () => window.stn.openBackups();
const exportBtn = document.getElementById('exportBtn');
exportBtn.onclick = async () => {
  const ok = await window.stn.exportTxt();
  if (!ok) return;
  exportBtn.textContent = 'Saved';
  setTimeout(() => { exportBtn.textContent = 'Export'; }, 2000);
};
setInterval(() => window.stn.state().then(render), 60000);
