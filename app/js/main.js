// Boot: loads the trophy data, wires the controls, routes by hash, and renders.
// Views are hash-routed so screenshots can open each one directly:
//   #/checklist            the tracker
//   #/roadmap              the roadmap to the platinum
//   #/missables            the missable trophies
//   #/trophy/<id>          the checklist with one trophy's guide open
// ?demo=1 seeds 13 earned trophies (a mid-story save) when nothing is saved yet,
// ?demo=2 seeds 13 earned trophies with no story trophy among them (for the
// spoiler shot), ?spoiler=1 switches the spoiler setting on — all for screenshots.
import {
  DEMO_EARNED,
  DEMO_EARNED_NO_STORY,
  download,
  loadProgress,
  loadSettings,
  parseImported,
  saveProgress,
  saveSettings,
  serializeProgress,
} from './store.js';
import { applyFilters } from './filters.js';
import {
  renderDetail,
  renderList,
  renderMissables,
  renderNextUp,
  renderProgress,
  renderRoadmap,
} from './views.js';

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

let progress = loadProgress();
let settings = loadSettings();

if (params.get('demo') === '1' && progress.earned.size === 0) {
  progress.earned = new Set(DEMO_EARNED);
  saveProgress(progress);
}
if (params.get('demo') === '2' && progress.earned.size === 0) {
  progress.earned = new Set(DEMO_EARNED_NO_STORY);
  saveProgress(progress);
}
if (params.get('spoiler') === '1') {
  settings.spoiler = true;
  saveSettings(settings);
}
if (params.get('spoiler') === '0') {
  settings.spoiler = false;
  saveSettings(settings);
}

let filters = { kind: 'all', grade: 'all', status: 'all', query: '', missableOnly: false };
let selectedId = null;

const spoilerToggle = document.getElementById('spoilerToggle');
spoilerToggle.checked = settings.spoiler;

function currentView() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('trophy/')) return { view: 'checklist', trophy: Number(hash.slice(7)) };
  if (hash === 'roadmap') return { view: 'roadmap' };
  if (hash === 'missables') return { view: 'missables' };
  return { view: 'checklist' };
}

function showView(name) {
  for (const view of ['checklist', 'roadmap', 'missables']) {
    document.getElementById(`view-${view}`).hidden = view !== name;
    const tab = document.querySelector(`.tab[data-view="${view}"]`);
    tab.classList.toggle('active', view === name);
    tab.setAttribute('aria-selected', String(view === name));
  }
}

function renderAll() {
  const { view, trophy } = currentView();
  if (trophy && trophies.some((t) => t.id === trophy)) selectedId = trophy;
  showView(view);
  renderProgress(trophies, progress);
  renderNextUp(trophies, progress, settings.spoiler, (id) => {
    location.hash = `#/trophy/${id}`;
  });
  const shown = applyFilters(trophies, progress, filters);
  renderList(shown, progress, filters, settings.spoiler, selectedId, {
    onToggle: (id, checked) => {
      if (checked) progress.earned.add(id);
      else progress.earned.delete(id);
      saveProgress(progress);
      renderAll();
    },
    onSelect: (id) => {
      location.hash = `#/trophy/${id}`;
    },
  });
  const selected = trophies.find((t) => t.id === selectedId) ?? null;
  renderDetail(selected, progress, settings.spoiler, {
    onCounter: (id, delta) => {
      const next = Math.max(0, (progress.counters[id] ?? 0) + delta);
      progress.counters[id] = next;
      saveProgress(progress);
      renderAll();
    },
  });
  renderRoadmap(trophies, progress);
  renderMissables(trophies, progress);
}

document.getElementById('searchBox').addEventListener('input', (e) => {
  filters.query = e.target.value;
  renderAll();
});
document.getElementById('kindFilter').addEventListener('change', (e) => {
  filters.kind = e.target.value;
  renderAll();
});
document.getElementById('gradeFilter').addEventListener('change', (e) => {
  filters.grade = e.target.value;
  renderAll();
});
document.getElementById('statusFilter').addEventListener('change', (e) => {
  filters.status = e.target.value;
  renderAll();
});
document.getElementById('missableOnly').addEventListener('change', (e) => {
  filters.missableOnly = e.target.checked;
  renderAll();
});
spoilerToggle.addEventListener('change', () => {
  settings.spoiler = spoilerToggle.checked;
  saveSettings(settings);
  renderAll();
});
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    location.hash = `#/${tab.dataset.view}`;
  });
});
document.getElementById('exportBtn').addEventListener('click', () => {
  download('gta6-trophy-progress.json', serializeProgress(progress));
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    progress = parseImported(await file.text());
    saveProgress(progress);
    renderAll();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  e.target.value = '';
});
window.addEventListener('hashchange', renderAll);

renderAll();
