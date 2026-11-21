// views.js — everything the reader sees, built from the data and the state.
// Spoiler safety lives here too: rows, the Next up chip and the detail pane
// all render through displayName / displayDescription / displayGuide from
// filters.js, never the raw fields.

import {
  displayDescription, displayGuide, displayName, gradeCounts, isMasked,
  nextUp, nextUpHint,
} from './filters.js';
import { counterValue, isEarned } from './store.js';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story', activities: 'Activities', collectibles: 'Collectibles',
  robberies: 'Robberies', money: 'Money', world: 'World', misc: 'Misc',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  return el('span', `grade-badge grade-${grade}`, GRADE_LABEL[grade]);
}

export function renderProgress(trophies, state) {
  const earned = state.earned.length;
  const total = trophies.length;
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  document.getElementById('progress-count').textContent = `${earned} / ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const counts = gradeCounts(trophies, state);
  const wrap = document.getElementById('progress-grades');
  wrap.textContent = '';
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const [got, of] = counts[grade];
    wrap.appendChild(el('span', 'grade-count', `${GRADE_LABEL[grade]} ${got}/${of}`));
  }
}

export function renderNextUp(trophies, state, onSelect) {
  const chip = document.getElementById('nextup-chip');
  const hint = document.getElementById('nextup-hint');
  const pick = nextUp(trophies, state);
  if (!pick) {
    chip.textContent = 'Platinum earned — every trophy is yours.';
    hint.textContent = '';
    chip.onclick = null;
    return;
  }
  // Masked by the same rule as the list: a hidden story trophy never shows
  // its name here, even as the suggested next trophy.
  chip.textContent = isMasked(pick, state)
    ? 'Hidden story trophy — keep playing the story'
    : displayName(pick, state);
  hint.textContent = nextUpHint(pick, state);
  chip.onclick = () => onSelect(pick.id);
}

function trophyRow(trophy, state, onSelect, onToggleEarned) {
  const li = el('li', 'trophy-row');
  if (state.selectedId === trophy.id) li.classList.add('is-selected');
  if (isEarned(state, trophy.id)) li.classList.add('is-earned');
  if (isMasked(trophy, state)) li.classList.add('is-masked');

  const check = el('input', 'row-check');
  check.type = 'checkbox';
  check.checked = isEarned(state, trophy.id);
  check.setAttribute('aria-label', `Mark ${displayName(trophy, state)} earned`);
  check.addEventListener('click', (event) => {
    event.stopPropagation();
    onToggleEarned(trophy.id);
  });
  li.appendChild(check);

  const body = el('div', 'row-body');
  const head = el('div', 'row-head');
  head.appendChild(gradeBadge(trophy.grade));
  head.appendChild(el('span', 'row-name', displayName(trophy, state)));
  if (trophy.missable) head.appendChild(el('span', 'tag tag-missable', 'MISSABLE'));
  if (trophy.unsolved) head.appendChild(el('span', 'tag tag-unsolved', 'UNSOLVED'));
  if (trophy.story) head.appendChild(el('span', 'tag tag-story', 'STORY'));
  body.appendChild(head);
  body.appendChild(el('p', 'row-desc', displayDescription(trophy, state)));
  const meta = el('div', 'row-meta');
  meta.appendChild(el('span', 'row-kind', KIND_LABEL[trophy.kind] || trophy.kind));
  if (trophy.target) {
    meta.appendChild(el('span', 'row-counter',
      `${counterValue(state, trophy.id)} / ${trophy.target} ${trophy.targetUnit || ''}`.trim()));
  }
  body.appendChild(meta);
  li.appendChild(body);

  li.addEventListener('click', () => onSelect(trophy.id));
  return li;
}

export function renderList(trophies, state, filters, visible, onSelect, onToggleEarned) {
  const list = document.getElementById('trophy-list');
  list.textContent = '';
  for (const t of visible) list.appendChild(trophyRow(t, state, onSelect, onToggleEarned));
  const meta = document.getElementById('list-meta');
  const earned = visible.filter((t) => isEarned(state, t.id)).length;
  meta.textContent = visible.length === 0
    ? 'No trophies match these filters.'
    : `Showing ${visible.length} of ${trophies.length} trophies · ${earned} earned in this view`;
}

export function renderMissableList(trophies, state, onSelect, onToggleEarned) {
  const list = document.getElementById('missable-list');
  list.textContent = '';
  for (const t of trophies.filter((x) => x.missable)) {
    list.appendChild(trophyRow(t, state, onSelect, onToggleEarned));
  }
}

export function renderDetail(trophy, state, callbacks) {
  const pane = document.getElementById('detail-pane');
  pane.textContent = '';
  if (!trophy) {
    pane.appendChild(el('p', 'detail-empty', 'Select a trophy to read its guide and sources.'));
    return;
  }
  const masked = isMasked(trophy, state);

  const head = el('div', 'detail-head');
  head.appendChild(gradeBadge(trophy.grade));
  head.appendChild(el('h2', 'detail-name', displayName(trophy, state)));
  pane.appendChild(head);

  const tags = el('div', 'detail-tags');
  tags.appendChild(el('span', 'tag', KIND_LABEL[trophy.kind] || trophy.kind));
  if (trophy.story) tags.appendChild(el('span', 'tag tag-story', 'STORY · HIDDEN'));
  if (trophy.missable) tags.appendChild(el('span', 'tag tag-missable', 'MISSABLE'));
  if (trophy.unsolved) tags.appendChild(el('span', 'tag tag-unsolved', 'UNSOLVED'));
  pane.appendChild(tags);

  pane.appendChild(el('p', 'detail-desc', displayDescription(trophy, state)));

  if (masked) {
    const note = el('p', 'detail-locked',
      'Spoilers are on, so this story trophy stays hidden until you earn it. Toggle “Hide story spoilers” off to reveal its name and guide.');
    pane.appendChild(note);
  } else {
    pane.appendChild(el('h3', 'detail-sub', 'Guide'));
    pane.appendChild(el('p', 'detail-guide', displayGuide(trophy, state)));
  }

  if (trophy.target && !masked) {
    const counter = el('div', 'detail-counter');
    counter.appendChild(el('span', 'counter-label',
      `Your progress: ${counterValue(state, trophy.id)} / ${trophy.target} ${trophy.targetUnit || ''}`.trim()));
    const minus = el('button', 'counter-btn', '−');
    minus.type = 'button';
    minus.addEventListener('click', () => callbacks.onCounter(trophy.id, counterValue(state, trophy.id) - 1));
    const plus = el('button', 'counter-btn', '+');
    plus.type = 'button';
    plus.addEventListener('click', () => callbacks.onCounter(trophy.id, counterValue(state, trophy.id) + 1));
    const input = el('input', 'counter-input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.target);
    input.value = String(counterValue(state, trophy.id));
    input.setAttribute('aria-label', `Progress toward ${trophy.target} ${trophy.targetUnit || ''}`);
    input.addEventListener('change', () => callbacks.onCounter(trophy.id, Number(input.value)));
    counter.appendChild(minus);
    counter.appendChild(input);
    counter.appendChild(plus);
    pane.appendChild(counter);
  }

  const earnedBtn = el('button', 'earned-btn', isEarned(state, trophy.id) ? '✓ Earned — click to unmark' : 'Mark as earned');
  earnedBtn.type = 'button';
  earnedBtn.addEventListener('click', () => callbacks.onToggleEarned(trophy.id));
  pane.appendChild(earnedBtn);

  if (!masked) {
    pane.appendChild(el('h3', 'detail-sub', 'Sources'));
    const list = el('ul', 'source-list');
    for (const source of trophy.sources || []) {
      const item = el('li');
      const link = el('a', null, source.name);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      item.appendChild(link);
      list.appendChild(item);
    }
    pane.appendChild(list);
  }
}

export function setView(name) {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === name);
  }
  document.getElementById('checklist-view').hidden = name !== 'checklist';
  document.getElementById('toolbar').hidden = name !== 'checklist';
  document.getElementById('roadmap-view').hidden = name !== 'roadmap';
  document.getElementById('missables-view').hidden = name !== 'missables';
  document.getElementById('detail-pane').hidden = name !== 'checklist';
  document.querySelector('.content').dataset.view = name;
}
