// filters.js — pure helpers: spoiler masking, list filtering, next-up pick.
// One rule everywhere: a story trophy that is not earned yet shows nothing of
// itself (name, description or guide) while spoilers are on. Every surface —
// the list, the Next up chip and the detail pane — asks these same helpers,
// so a spoiler can never leak through a path the list forgot.

export function isMasked(trophy, state) {
  return Boolean(state.spoiler && trophy.story && !state.earned.includes(trophy.id));
}

export function displayName(trophy, state) {
  return isMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isMasked(trophy, state)
    ? 'Hidden until earned — turn spoilers off to reveal it.'
    : trophy.description;
}

export function displayGuide(trophy, state) {
  return isMasked(trophy, state)
    ? 'This is a hidden story trophy. Earn it in the game to reveal its guide here.'
    : trophy.guide;
}

// What the search box may match. A masked trophy only matches the neutral
// placeholder text, never its real name or description.
export function searchableText(trophy, state) {
  if (isMasked(trophy, state)) return 'hidden story trophy';
  return `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
}

export function applyFilters(trophies, state, filters) {
  const needle = filters.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !state.earned.includes(t.id)) return false;
    if (filters.status === 'remaining' && state.earned.includes(t.id)) return false;
    if (filters.missableOnly && !t.missable) return false;
    if (needle && !searchableText(t, state).includes(needle)) return false;
    return true;
  });
}

export function gradeCounts(trophies, state) {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of trophies) {
    counts[t.grade][1] += 1;
    if (state.earned.includes(t.id)) counts[t.grade][0] += 1;
  }
  return counts;
}

// Roadmap order: the one missable first (it can be lost), then story in
// number order, then everything else in number order.
export function nextUp(trophies, state) {
  const remaining = trophies.filter((t) => !state.earned.includes(t.id));
  if (remaining.length === 0) return null;
  const missable = remaining.find((t) => t.missable);
  if (missable) return missable;
  const story = remaining.filter((t) => t.story).sort((a, b) => a.num - b.num);
  if (story.length > 0) return story[0];
  return [...remaining].sort((a, b) => a.num - b.num)[0];
}

export function nextUpHint(trophy, state) {
  if (!trophy) return '';
  if (trophy.missable) return 'Missable — do it before Chapter 1 ends.';
  if (trophy.unsolved) return 'Unsolved — no confirmed unlock yet.';
  if (trophy.story) return 'Story trophy — keep playing the story.';
  if (trophy.target) return `Progress goal: ${trophy.target} ${trophy.targetUnit || ''}`.trim();
  return 'Next on the list.';
}
