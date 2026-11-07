const id = new URLSearchParams(location.search).get('id');
const ta = document.getElementById('text');
const titleEl = document.getElementById('title');
const pinBtn = document.getElementById('pinBtn');
const colorBtn = document.getElementById('colorBtn');
const swatches = document.getElementById('swatches');
let current = 'sand';

function paint(hex) { document.documentElement.style.setProperty('--bg', hex); }

function setTop(on) {
  pinBtn.classList.toggle('off', !on);
  pinBtn.querySelector('svg').style.transform = on ? '' : 'rotate(180deg)';
  pinBtn.title = on ? 'On top. Click to send behind' : 'Behind. Click to bring to front';
}

function buildSwatches(colors) {
  swatches.innerHTML = '';
  Object.entries(colors).forEach(([name, hex]) => {
    const s = document.createElement('span');
    s.className = 'sw' + (name === current ? ' sel' : '');
    s.style.background = hex;
    s.title = name;
    s.onclick = () => { window.stn.setColor(id, name); swatches.classList.remove('on'); };
    swatches.appendChild(s);
  });
}

window.stn.getNote(id).then(({ note, colors }) => {
  if (!note) return;
  current = note.color;
  ta.value = note.text;
  titleEl.value = note.title || '';
  titleEl.title = titleEl.value;
  paint(colors[note.color]);
  setTop(note.onTop);
  buildSwatches(colors);
  if (!note.text) ta.focus();
  window.stn.onColor((name, hex) => { current = name; paint(hex); buildSwatches(colors); });
});

let t = null;
ta.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => window.stn.setText(id, ta.value), 250);
});
window.addEventListener('beforeunload', () => {
  window.stn.setText(id, ta.value);
  window.stn.setTitle(id, titleEl.value);
});

let tt = null;
titleEl.addEventListener('input', () => {
  titleEl.title = titleEl.value;
  clearTimeout(tt);
  tt = setTimeout(() => window.stn.setTitle(id, titleEl.value), 250);
});
titleEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === 'Escape') {
    e.preventDefault();
    window.stn.setTitle(id, titleEl.value);
    ta.focus();
  }
});

colorBtn.onclick = () => swatches.classList.toggle('on');
pinBtn.onclick = () => window.stn.toggleTop(id);
window.stn.onTop(setTop);
document.getElementById('closeBtn').onclick = () => {
  window.stn.setText(id, ta.value);
  window.stn.hide(id);
};
