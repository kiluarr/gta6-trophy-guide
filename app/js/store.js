// Progress store: earned trophies, per-trophy counters for PSN targets, and the
// spoiler setting. Everything lives in localStorage; nothing leaves the browser.
export const PROGRESS_KEY = 'leonida-legend-progress-v1';
export const SETTINGS_KEY = 'leonida-legend-settings-v1';

// The demo seed used by ?demo=1 (and by the screenshot views): 13 earned
// trophies, a mix of story, activities and odd jobs, like a real mid-story save.
export const DEMO_EARNED = [2, 3, 4, 8, 16, 20, 21, 33, 36, 46, 51, 53, 55];

// ?demo=2: the same size of save, but with no story trophy earned — so the
// spoiler setting has story trophies left to hide (used by the spoiler shot).
export const DEMO_EARNED_NO_STORY = [15, 16, 17, 18, 19, 20, 21, 30, 31, 32, 33, 35, 36];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProgress() {
  const saved = readJson(PROGRESS_KEY, null);
  return {
    earned: new Set(Array.isArray(saved?.earned) ? saved.earned : []),
    counters: saved?.counters && typeof saved.counters === 'object' ? saved.counters : {},
  };
}

export function saveProgress(progress) {
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ earned: [...progress.earned], counters: progress.counters }),
  );
}

export function loadSettings() {
  const saved = readJson(SETTINGS_KEY, null);
  return { spoiler: saved?.spoiler === true };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function serializeProgress(progress) {
  return JSON.stringify(
    { app: 'leonida-legend', game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...progress.earned].sort((a, b) => a - b), counters: progress.counters },
    null,
    2,
  );
}

// Parses an imported file's text. Returns { earned, counters } or throws.
export function parseImported(text) {
  const data = JSON.parse(text);
  const ids = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(ids)) throw new Error('No earned list found in that file.');
  const earned = new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
  const counters = data.counters && typeof data.counters === 'object' ? data.counters : {};
  return { earned, counters };
}

export function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
