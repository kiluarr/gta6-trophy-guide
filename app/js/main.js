// main.js — boot for Leonida Legend: load the data, wire the toolbar and
// tabs, and re-render on every state change. No network beyond the app's own
// files: trophies.json is fetched once from app/data/ and everything else is
// local.

import { applyFilters } from './filters.js';
import {
  demoState, exportBlob, isEarned, loadState, parseImport, saveState,
  setCounter, toggleEarned,
} from './store.js';
import {
  renderDetail, renderList, renderMissableList, renderNextUp, renderProgress,
  setView,
} from './views.js';

const DATA_URL = './data/trophies.json';

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  return {
    view: ['checklist', 'roadmap', 'missables'].includes(view) ? view : 'checklist',
    demo: params.get('demo'),
    spoiler: params.get('spoiler'),
    select: params.get('select'),
  };
}

export async function boot() {
  const params = readParams();
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`could not load ${DATA_URL}`);
  const data = await response.json();
  const trophies = [...data.trophies].sort((a, b) => a.num - b.num);

  const demo = demoState(params.demo);
  const state = demo || loadState();
  if (params.spoiler === '0') state.spoiler = false;
  if (params.spoiler === '1') state.spoiler = true;
  if (demo) {
    const banner = document.createElement('p');
    banner.className = 'demo-banner';
    banner.textContent = `Demo save ${demo.demo} — sample progress for screenshots. Your real save is untouched; add ?demo=0 or clear the address bar to leave the demo.`;
    document.querySelector('.layout').prepend(banner);
  }
  if (!state.selectedId || !trophies.some((t) => t.id === state.selectedId)) {
    state.selectedId = 'top-fun';
  }
  if (params.select && trophies.some((t) => t.id === params.select)) {
    state.selectedId = params.select;
  }

  const filters = { search: '', kind: 'all', grade: 'all', status: 'all', missableOnly: false };

  const searchInput = document.getElementById('search');
  const kindSelect = document.getElementById('kind-filter');
  const gradeSelect = document.getElementById('grade-filter');
  const statusSelect = document.getElementById('status-filter');
  const missableBox = document.getElementById('missable-only');
  const spoilerBox = document.getElementById('spoiler-toggle');

  spoilerBox.checked = state.spoiler;

  function selected() {
    return trophies.find((t) => t.id === state.selectedId) || null;
  }

  function render() {
    const visible = applyFilters(trophies, state, filters);
    renderProgress(trophies, state);
    renderNextUp(trophies, state, select);
    renderList(trophies, state, filters, visible, select, onToggleEarned);
    renderMissableList(trophies, state, select, onToggleEarned);
    renderDetail(selected(), state, {
      onToggleEarned,
      onCounter: (id, value) => {
        const trophy = trophies.find((t) => t.id === id);
        if (trophy) setCounter(state, id, value, trophy.target);
        render();
      },
    });
  }

  function select(id) {
    state.selectedId = id;
    if (!demo) saveState(state);
    render();
    document.getElementById('detail-pane').scrollIntoView({ block: 'nearest' });
  }

  function onToggleEarned(id) {
    if (demo) {
      // A demo is a preview: flip it in memory only, never touch the real save.
      const at = state.earned.indexOf(id);
      if (at >= 0) state.earned.splice(at, 1);
      else state.earned.push(id);
    } else {
      toggleEarned(state, id);
    }
    render();
  }

  searchInput.addEventListener('input', () => { filters.search = searchInput.value; render(); });
  kindSelect.addEventListener('change', () => { filters.kind = kindSelect.value; render(); });
  gradeSelect.addEventListener('change', () => { filters.grade = gradeSelect.value; render(); });
  statusSelect.addEventListener('change', () => { filters.status = statusSelect.value; render(); });
  missableBox.addEventListener('change', () => { filters.missableOnly = missableBox.checked; render(); });
  spoilerBox.addEventListener('change', () => {
    state.spoiler = spoilerBox.checked;
    if (!demo) saveState(state);
    render();
  });

  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      setView(tab.dataset.view);
      render();
    });
  }

  document.getElementById('export-btn').addEventListener('click', () => {
    const url = URL.createObjectURL(exportBlob(state));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leonida-legend-progress.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      const known = new Set(trophies.map((t) => t.id));
      state.earned = imported.earned.filter((id) => known.has(id));
      state.counters = {};
      for (const [id, value] of Object.entries(imported.counters)) {
        const trophy = trophies.find((t) => t.id === id);
        if (trophy && trophy.target) state.counters[id] = Math.max(0, Math.min(trophy.target, value | 0));
      }
      state.spoiler = imported.spoiler;
      spoilerBox.checked = state.spoiler;
      saveState(state);
    } catch {
      window.alert('That file is not a Leonida Legend progress export.');
    }
    event.target.value = '';
    render();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies and counters in this browser?')) return;
    state.earned = [];
    state.counters = {};
    state.selectedId = 'cunning-stunts';
    saveState(state);
    render();
  });

  setView(params.view);
  render();
}
