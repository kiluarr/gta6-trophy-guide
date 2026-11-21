# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/kiluarr/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/kiluarr/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend: an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — official names, descriptions and grades, a checklist saved in the browser with export and import, filters, a spoiler setting, a roadmap to the platinum, the missable trophy flagged, and a guide to each trophy in the tracker's own words that cites its sources.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static file server. It works with the network off: every file it loads is under `app/`.

## How it works

- `app/index.html` — the page: header progress, tabs (Checklist / Roadmap to platinum / Missables), filters, and the guide pane.
- `app/js/main.js` — boots the app, routes by hash (`#/checklist`, `#/roadmap`, `#/missables`, `#/trophy/<id>`), seeds the demo save with `?demo=1`.
- `app/js/store.js` — progress (earned trophies, per-trophy counters, spoiler setting) in localStorage, plus export/import.
- `app/js/filters.js` — filtering by kind, grade, status, missable flag and search; the "Next up" order.
- `app/js/views.js` — the checklist rows, the guide pane, the roadmap and the missables page.
- `app/data/trophies.json` — the 55 official trophies with a guide and sources for each.
- `screenshots/` — 4 real renders of the guide (cover: checklist with a guide open; roadmap; missables; spoiler mode).
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=778zzf8x&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
