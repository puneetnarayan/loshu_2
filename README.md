# Lo Shu Grid Calculator and Interpretation Engine

A standalone Vite + React + TypeScript app with two tabs, **Basic** (plain language) and **Advanced** (full audit, overlays, sources, evidence labels). Advanced is the default tab.
Everything is computed in the browser; no backend, API key or analytics.

> **Status note:** the interpretation wording is based on search-result summaries from several web sources; no source page could be opened (network egress was blocked), so nothing is labelled as directly verified. See `docs/research/research-log.md` before relying on any source attribution.

## Defaults

The form opens with the name "Puneet Narayan" and the date 02-06-1970 (constants in `src/App.tsx`), so a reading is shown on load. The name is only a display label and is never used in a calculation. Reset clears both fields. Change or remove the constants to ship different defaults.

## Reading colours

Interpretations are tinted green (positive), yellow (neutral) or red (challenge or area for reflection), each with a text tag; calculations and other text are not coloured. See `docs/methodology.md`.

## Live results and the PDF report

There is no Calculate button: the date is parsed on every keystroke and the reading updates as soon as a complete, valid date is present (errors appear once ten characters are entered or the field is left). **Report PDF** downloads `lo-shu-report.pdf`, a multi-page A4 report (grid, audit, eight lines, interpretation, optional readings with their riders, evidence, sources) built entirely in the browser with `pdf-lib` (loaded on demand). The file name and metadata never contain the name or date. **Print / Save as PDF** uses the browser's print dialog instead and can print characters the standard PDF fonts cannot show.

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
- `src/data/`: schema, source registry, interpretation catalogue (`rules.ts`, `extraRules.ts`, merged in `catalogue.ts`), generated pattern frequencies, catalogue validator.
- `src/components/`: Basic, Advanced (and `AdvancedExtras`), grid, form, help/glossary, print report, shared pieces. `src/report/blocks.ts` is the single report model used by both the PDF writer (`src/pdf/`) and the print view.
- `tests/`: dates, calculations (incl. property tests), catalogue/synthesis, UI.
- `docs/`: research log, methodology and `docs/reviews/` (review of a supplied desktop app and what was ported from it).

## Deployment

`vercel.json` pins the Vite settings (`npm ci`, `npm run build`, `dist`). **Nothing has been deployed.** Deployment requires explicit approval.
