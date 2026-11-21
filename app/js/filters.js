// Filtering for the checklist: by kind, grade, earned status, missable flag and
// free-text search. Pure functions, so the list re-renders from one place.
export const KIND_LABELS = {
  story: 'Story',
  side: 'Side quest',
  collectible: 'Collectible',
  activity: 'Activity',
  robbery: 'Robbery',
  exploration: 'Exploration',
  money: 'Money',
  oddjob: 'Odd job',
  platinum: 'Platinum',
  completion: '100% completion',
};

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function applyFilters(trophies, progress, filters) {
  const query = filters.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !progress.earned.has(t.id)) return false;
    if (filters.status === 'remaining' && progress.earned.has(t.id)) return false;
    if (filters.missableOnly && !t.missable) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function gradeCounts(trophies, progress) {
  const out = {};
  for (const grade of GRADE_ORDER) {
    const total = trophies.filter((t) => t.grade === grade).length;
    const earned = trophies.filter((t) => t.grade === grade && progress.earned.has(t.id)).length;
    out[grade] = { earned, total };
  }
  return out;
}

// The next trophies to chase, in roadmap order: earliest stage first, then the
// missable one first inside its stage, then by trophy id.
export function nextUp(trophies, progress, limit = 3) {
  return trophies
    .filter((t) => !progress.earned.has(t.id) && t.id !== 1)
    .sort((a, b) => a.roadmap - b.roadmap || (b.missable - a.missable) || a.id - b.id)
    .slice(0, limit);
}
