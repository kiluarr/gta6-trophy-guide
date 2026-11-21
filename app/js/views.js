// Views: everything the reader sees — the checklist rows, the guide pane, the
// roadmap and the missables page. Built with plain DOM calls, no framework.
import { KIND_LABELS, gradeCounts, nextUp } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeChip(grade) {
  return el('span', `grade-chip grade-${grade}`, grade);
}

function kindTag(trophy) {
  return el('span', 'tag', KIND_LABELS[trophy.kind] ?? trophy.kind);
}

export function renderProgress(trophies, progress) {
  const earned = progress.earned.size;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('progressFill').style.width = `${(earned / trophies.length) * 100}%`;
  const counts = gradeCounts(trophies, progress);
  document.getElementById('gradeCounts').innerHTML =
    `Platinum <b>${counts.platinum.earned}/1</b> · Gold <b>${counts.gold.earned}/2</b> · ` +
    `Silver <b>${counts.silver.earned}/6</b> · Bronze <b>${counts.bronze.earned}/46</b>`;
}

export function renderNextUp(trophies, progress, spoiler, onSelect) {
  const box = document.getElementById('nextUp');
  box.replaceChildren();
  const upcoming = nextUp(trophies, progress, 3);
  if (progress.earned.size >= trophies.length) {
    box.append(el('h2', null, 'Platinum earned — Vice Got a Price!'));
    box.append(el('p', null, 'Every trophy is ticked. You are a Leonida Legend.'));
    return;
  }
  box.append(el('h2', null, 'Next up'));
  box.append(el('p', null, 'The next trophies on the roadmap, in order — finish the story step first, then the checklist.'));
  const chips = el('div', 'next-chips');
  for (const t of upcoming) {
    const masked = spoiler && t.story && !progress.earned.has(t.id);
    const chip = el('button', 'next-chip', masked ? 'Hidden story trophy' : `${t.missable ? '⚠ ' : ''}${t.name}`);
    chip.type = 'button';
    chip.addEventListener('click', () => onSelect(t.id));
    chips.append(chip);
  }
  box.append(chips);
}

// One checklist row. Spoiler mode masks story trophies until they are earned.
function trophyRow(trophy, progress, spoiler, selectedId, callbacks) {
  const li = el('li', `trophy${progress.earned.has(trophy.id) ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}`);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = progress.earned.has(trophy.id);
  box.setAttribute('aria-label', `Earned: ${trophy.name}`);
  box.addEventListener('change', () => callbacks.onToggle(trophy.id, box.checked));
  li.append(box);

  const body = el('div');
  const spoiled = spoiler && trophy.story && !progress.earned.has(trophy.id);
  if (spoiled) li.classList.add('spoiled');
  body.append(el('div', 'trophy-name', spoiled ? 'Hidden story trophy' : trophy.name));
  body.append(el('div', 'trophy-desc', spoiled ? 'Complete the story to reveal this trophy.' : trophy.description));
  if (spoiled) body.append(el('div', 'spoiler-note', 'Hidden by the spoiler setting — earn it (or switch spoilers off) to reveal it.'));
  const tags = el('div', 'trophy-tags');
  tags.append(kindTag(trophy));
  if (trophy.missable) tags.append(el('span', 'tag missable', '⚠ Missable'));
  if (trophy.hidden) tags.append(el('span', 'tag hidden-flag', 'Hidden on PSN'));
  if (trophy.target) tags.append(el('span', 'tag target', `PSN target: ${trophy.target.toLocaleString()} ${trophy.targetLabel ?? ''}`.trim()));
  body.append(tags);
  const guideBtn = el('button', 'trophy-guide-btn', 'Read the guide →');
  guideBtn.type = 'button';
  guideBtn.addEventListener('click', () => callbacks.onSelect(trophy.id));
  body.append(guideBtn);
  li.append(body);
  li.append(gradeChip(trophy.grade));
  return li;
}

export function renderList(trophies, progress, filters, spoiler, selectedId, callbacks) {
  const list = document.getElementById('trophyList');
  list.replaceChildren();
  for (const t of trophies) list.append(trophyRow(t, progress, spoiler, selectedId, callbacks));
  document.getElementById('emptyMsg').hidden = trophies.length > 0;
  document.getElementById('resultCount').textContent =
    `${trophies.length} of 55 trophies shown · ${progress.earned.size} earned`;
}

export function renderDetail(trophy, progress, spoiler, callbacks) {
  const pane = document.getElementById('detailPane');
  pane.replaceChildren();
  if (!trophy) {
    const empty = el('div', 'detail-empty');
    empty.append(el('h2', null, 'Pick a trophy to read its guide'));
    empty.append(el('p', null, 'Every trophy has a guide in this tracker’s own words, built from its official description — with the sources it draws on, so you can check each fact. Click any trophy in the list, or a “Next up” chip above.'));
    empty.append(el('p', null, 'Start with the one flagged missable: Positive Mental Attitude. It is the only trophy the published guides say you can lose.'));
    pane.append(empty);
    return;
  }
  const spoiled = spoiler && trophy.story && !progress.earned.has(trophy.id);
  pane.append(el('h2', null, spoiled ? 'Hidden story trophy' : trophy.name));
  pane.append(el('p', 'detail-desc', spoiled ? 'Hidden by the spoiler setting until earned.' : trophy.description));
  const meta = el('div', 'detail-meta');
  meta.append(gradeChip(trophy.grade));
  meta.append(kindTag(trophy));
  if (trophy.missable) meta.append(el('span', 'tag missable', '⚠ Missable'));
  if (trophy.hidden) meta.append(el('span', 'tag hidden-flag', 'Hidden on PSN'));
  meta.append(el('span', 'tag', `Roadmap step ${trophy.roadmap}`));
  pane.append(meta);

  if (trophy.missable) {
    pane.append(el('div', 'missable-banner', '⚠ Missable — read this before you pass Chapter 1. The full warning is on the Missables tab.'));
  }
  if (!spoiled) {
    pane.append(el('h3', null, 'Guide'));
    pane.append(el('p', 'detail-guide', trophy.guide));
    pane.append(el('h3', null, 'Sources'));
    const sources = el('ul', 'source-list');
    for (const s of trophy.sources) {
      const item = el('li');
      const link = document.createElement('a');
      link.href = s.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = s.name;
      item.append(link);
      sources.append(item);
    }
    pane.append(sources);
    if (trophy.target) {
      pane.append(el('h3', null, 'Your count'));
      const counter = el('div', 'counter');
      const minus = el('button', null, '−');
      const plus = el('button', null, '+');
      const value = el('span', 'counter-value', `${progress.counters[trophy.id] ?? 0} / ${trophy.target.toLocaleString()}`);
      minus.type = 'button';
      plus.type = 'button';
      minus.setAttribute('aria-label', 'Decrease count');
      plus.setAttribute('aria-label', 'Increase count');
      minus.addEventListener('click', () => callbacks.onCounter(trophy.id, -1));
      plus.addEventListener('click', () => callbacks.onCounter(trophy.id, 1));
      counter.append(minus, value, plus, el('span', 'counter-note', `${trophy.targetLabel ?? 'progress'} — PSN tracks this target`));
      pane.append(counter);
    }
    pane.append(el('p', 'detail-empty', 'Official name and description as PlayStation publishes them; the guide above is this tracker’s own words.'));
  } else {
    pane.append(el('p', 'detail-empty', 'Earn this trophy — or switch the spoiler setting off — to read its guide and sources.'));
  }
}

const ROADMAP_STEPS = [
  {
    step: 1,
    time: '60–80 hours',
    title: 'Play the story — and mind the one missable',
    body: 'Finish the five chapters and take the optional missions as they appear (purple icons, plus black icons with pink letters). Along the way, scan every new vehicle with the WAiNK app and study animals through your binoculars — the 100% checklist already counts them. Keep a manual save at the start and end of every chapter: there is no mission replay.',
    bullets: [
      'Do the Chapter 1 balcony meditation the moment Lucia offers it (Positive Mental Attitude) — see the Missables tab.',
      'Sample the 9 activity types for Master of None as you meet them.',
      'Keep cheats OFF: they disable trophies and saving, and only unlock after the story.',
      'Avoid the Irredeemable criminal profile — it is permanent and makes the police more aggressive.',
    ],
  },
  {
    step: 2,
    time: 'About 100 hours',
    title: 'The 100% Completion checklist',
    body: 'After the credits, Progress > Stats gains a 100% Completion entry — that checklist is the A Long Road trophy. It is closer to 60% true completion: most side quests are not required and collectibles only partly. But every robbery, underwater discovery, shooting range, drone race and Bret quest is required, and you need 70 of the 80 challenges, so you can skip the hardest ten.',
    bullets: [
      '300 stunts across jumps, bridge flyunders, knife flights and base jumps (the trophy pops at 250).',
      'Gold in all 42 Shooting Range challenges; all 42 drone time trials.',
      'All 33 underwater discoveries; all 15 of Bret’s target decks.',
      '200 of 277 base-model vehicles scanned, 100 of 255 animals studied, 50 of 66 weapons.',
      'Bank vaults, armored trucks, jewelry stores and one illegal operation per gang.',
    ],
  },
  {
    step: 3,
    time: 'About 10 hours',
    title: 'Strangers & Freaks and cleanup',
    body: 'The checklist does not ask for the stranger strands, so they are usually what is left afterwards, together with any stray trophies that did not pop on their own. Every quest giver tied to a trophy comes back after the ending, and the whole map stays open in free-roam.',
    bullets: [
      'Finish 8 stranger mission strands (Strangers & Freaks).',
      'Close out the character strands: Andy (Lucia-only), Tyrone and Bret (Jason-only).',
      'Sweep the last collectibles — cards, WAiNK scans, meditation spots — and the platinum pops with your final trophy.',
    ],
  },
];

export function renderRoadmap(trophies, progress) {
  const intro = document.getElementById('roadmapIntro');
  intro.replaceChildren();
  intro.append(el('h2', null, 'Roadmap to the platinum'));
  intro.append(el('p', null, 'Three steps, in order, after PowerPyx’s trophy roadmap. The story is 60–80 hours; the checklist is the long grind; cleanup is short. One playthrough is enough, everything is offline, and there are no online trophies.'));
  const facts = el('div', 'roadmap-facts');
  for (const fact of ['~200 hours to platinum', 'Difficulty 4/10 (PowerPyx)', '1 playthrough', '0 online trophies', 'No mission replay — keep chapter saves', 'Cheats disable trophies']) {
    facts.append(el('span', 'fact', fact));
  }
  intro.append(facts);

  const steps = document.getElementById('roadmapSteps');
  steps.replaceChildren();
  for (const step of ROADMAP_STEPS) {
    const item = el('li', 'roadmap-step');
    item.append(el('div', 'step-time', `Step ${step.step} · ${step.time}`));
    item.append(el('h3', null, step.title));
    item.append(el('p', null, step.body));
    const list = el('ul');
    for (const b of step.bullets) list.append(el('li', null, b));
    item.append(list);
    const stageTrophies = trophies.filter((t) => t.roadmap === step.step);
    const earned = stageTrophies.filter((t) => progress.earned.has(t.id)).length;
    item.append(el('p', 'step-progress', `${earned} of ${stageTrophies.length} trophies in this step earned`));
    steps.append(item);
  }

  const notes = document.getElementById('roadmapNotes');
  notes.replaceChildren();
  notes.append(el('h3', null, 'Before you start'));
  const list = el('ul');
  for (const note of [
    'Keep a manual save at the start and end of every chapter — missions cannot be replayed.',
    'Do the Chapter 1 meditation before leaving Chapter 1 (Missables tab). It is the only trophy the published guides say can be missed.',
    'Scan vehicles and study animals from the first hour: the checklist counts 200 of 277 vehicles and 100 of 255 animals, and progress made during the story already counts.',
    'The 100% checklist appears only after the story, under Progress > Stats — but everything you do before the ending already counts toward it.',
  ]) list.append(el('li', null, note));
  notes.append(list);
}

export function renderMissables(trophies, progress) {
  const box = document.getElementById('missableList');
  box.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const card = el('div', 'missable-card');
    card.append(el('div', 'missable-flag', '⚠ The only missable trophy'));
    card.append(el('h2', null, t.name));
    card.append(el('p', 'detail-desc', t.description));
    card.append(el('p', null, t.guide));
    const sources = el('ul', 'source-list');
    for (const s of t.sources) {
      const item = el('li');
      const link = document.createElement('a');
      link.href = s.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = s.name;
      item.append(link);
      sources.append(item);
    }
    card.append(el('h3', null, 'Sources'));
    card.append(sources);
    card.append(el('p', null, progress.earned.has(t.id) ? '✓ Earned — you are safe.' : 'Not earned yet — do the Chapter 1 meditation before you leave Chapter 1.'));
    box.append(card);
  }
  const safe = document.getElementById('safeNote');
  safe.replaceChildren();
  safe.append(el('h2', null, 'Everything else is safe'));
  safe.append(el('p', null, 'Every other trophy is confirmed unmissable in the published guides: story trophies pop automatically, free-roam continues after the story, and every quest giver tied to a trophy returns after the ending. PowerPyx and GTABase agree there is only the one possible missable above — though the game is days old, so this page follows the published guides as they are updated.'));
  safe.append(el('p', null, 'Still, the cheap insurance costs nothing: keep a manual save at the start and end of every chapter. With no mission replay, a chapter save is the only way back.'));
}
