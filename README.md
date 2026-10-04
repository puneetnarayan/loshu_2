# Lo Shu Grid Calculator and Interpretation Engine

A standalone Vite + React + TypeScript app with two tabs, **Basic** (plain language) and **Advanced** (full audit, overlays, sources, evidence labels). Advanced is the default tab.
Everything is computed in the browser; no backend, API key or analytics.

> **Status note:** the interpretation wording is based on search-result summaries from several web sources; no source page could be opened (network egress was blocked), so nothing is labelled as directly verified. See `docs/research/research-log.md` before relying on any source attribution.

## Run

```bash
npm ci
npm run dev        # development server
npm test           # unit + UI tests (FC_RUNS=5000 npm test for a heavier property-test pass)
npm run lint
npm run typecheck
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ locally
```

Node 22 was used for development.

## Layout

- `src/loshu/`: calculation engine (`calculate.ts`, `overlays.ts`, `date.ts`), rule matching (`engine.ts`), synthesis (`synthesis.ts`), single entry point `buildReport()` in `index.ts`.
- `src/data/`: schema, source registry, interpretation catalogue, catalogue validator.
- `src/components/`: Basic, Advanced, grid, form, help/glossary, shared pieces.
- `tests/`: dates, calculations (incl. property tests), catalogue/synthesis, UI.
- `docs/`: research log and methodology.

## Deployment

`vercel.json` pins the Vite settings (`npm ci`, `npm run build`, `dist`). **Nothing has been deployed.** Deployment requires explicit approval.
