// store.js — progress state for Leonida Legend.
// Everything lives in localStorage under one key; demo seeds (?demo=1 / ?demo=2)
// only fill an in-memory preview and never overwrite a real save.

export const STORAGE_KEY = 'leonida-legend-v1';

// A mid-game save: story through Chapter 3 plus a few activities.
export const DEMO_ONE_EARNED = [
  'just-like-paradise', 'paradise-lost', 'tits-ass-drug-money', 'vice-city-baby',
  'trust', 'baited-my-tackle', 'stick-fiddler', 'master-of-none', 'whip-it-good',
  'earn-cash-not-kudos', 'catch-me-if-you-can', 'challenging-tank',
  'lets-go-bowling', 'personal-best',
];
export const DEMO_ONE_COUNTERS = {
  'cunning-stunts': 187,
  'you-wainker': 64,
  'one-last-thing': 41,
  'dime-on-the-dollar': 132000,
};

// A late-game save: story done, cleanup half finished.
export const DEMO_TWO_EARNED = [
  ...DEMO_ONE_EARNED,
  'top-of-the-world-ma', 'you-gotta-know-when-to-get-off', 'break-the-bank',
  'family-matters', 'dwnfall', 'hi-jacked', 'road-to-rehabilitation',
  'this-was-no-boat-accident', 'the-lone-rider', 'supply-and-demand',
  'spin-on-this', 'fair-game', 'top-fun', 'the-shootist', 'hot-together',
  'sneakthief', 'a-classic-blitz-play', 'the-goodtime-state', 'pest-control',
  'positive-mental-attitude', 'dont-touch-my-deck', 'on-the-spot',
];
export const DEMO_TWO_COUNTERS = {
  ...DEMO_ONE_COUNTERS,
  'cunning-stunts': 250,
  'you-wainker': 100,
  'one-last-thing': 50,
  'whip-it-good': 100,
  'dime-on-the-dollar': 250000,
  'treat-yo-self': 100000,
  'strangers-and-freaks': 8,
  'maximum-withdrawal': 5,
};

export function emptyState() {
  return { earned: [], counters: {}, spoiler: true, selectedId: null };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((x) => typeof x === 'string') : [],
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
      spoiler: parsed.spoiler !== false,
      selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : null,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: state.earned,
      counters: state.counters,
      spoiler: state.spoiler,
      selectedId: state.selectedId,
    }));
  } catch {
    // Private mode or full storage: the page still works for the session.
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const at = state.earned.indexOf(id);
  if (at >= 0) state.earned.splice(at, 1);
  else state.earned.push(id);
  saveState(state);
  return state;
}

export function counterValue(state, id) {
  const v = state.counters[id];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

export function setCounter(state, id, value, target) {
  const clamped = Math.max(0, Math.min(target || 0, Math.floor(value) || 0));
  if (clamped === 0) delete state.counters[id];
  else state.counters[id] = clamped;
  saveState(state);
  return state;
}

// Demo seeds: a preview layered over the real save, clearly labelled.
export function demoState(seed) {
  if (seed === '2') {
    return {
      earned: [...DEMO_TWO_EARNED],
      counters: { ...DEMO_TWO_COUNTERS },
      spoiler: true,
      selectedId: 'top-fun',
      demo: 2,
    };
  }
  if (seed === '1') {
    return {
      earned: [...DEMO_ONE_EARNED],
      counters: { ...DEMO_ONE_COUNTERS },
      spoiler: true,
      selectedId: 'top-fun',
      demo: 1,
    };
  }
  return null;
}

export function exportBlob(state) {
  const payload = {
    app: 'leonida-legend',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: state.earned,
    counters: state.counters,
    spoiler: state.spoiler,
  };
  return new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
}

export function parseImport(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
  const earned = Array.isArray(parsed.earned) ? parsed.earned.filter((x) => typeof x === 'string') : [];
  const counters = parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {};
  return {
    earned,
    counters,
    spoiler: parsed.spoiler !== false,
    selectedId: null,
  };
}
