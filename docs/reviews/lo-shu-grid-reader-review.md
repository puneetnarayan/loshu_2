# Review of the supplied "Lo Shu Grid Reader" project, and what was ported

**Project reviewed:** a zip named `lo-shu-grid-main` (a Tauri v2 + React macOS desktop app). Its README points to github.com/dragontpe/lo-shu-grid and states an MIT licence. It is **not part of this repository** and was not modified.
**How it was reviewed:** read the calculation engine, tests, input form, README, Tauri config and a sample of the content; installed its dependencies and ran its tests (25 passed); probed suspected bugs with real calls.
**Licence note:** no code or text from that project was copied. The ideas listed under "Ported" were re-implemented from scratch, and the Kua formulas were checked against separate search summaries of published charts (see `docs/research/research-log.md`).

## Findings in the reviewed project (reproduced unless marked)

| # | Finding | Evidence |
|---|---|---|
| 1 | **Kua can be 0.** For the male formula from 2000, `9 − s` is never mapped from 0 to 9, so any solar year whose last two digits sum to 9 (2009, 2018, 2027…) returns Kua 0. Years from 1899 and earlier also fall into the 2000+ branch. | Probe: male 10/06/2018 → `kuaMale = 0`; 10/06/2009 → 0; 10/06/1899 → 0. Its test suite has no case for it (the nearest test covers year 2000 only). |
| 2 | **The engine accepts impossible dates.** Validation lives only in the form, so `calculateGrid` happily returns results for 31/02/2020. | Probe: 31/02/2020 → a normal result. |
| 3 | **Li Chun is treated as exactly 4 February.** It falls on 3, 4 or 5 February depending on the year and the exact moment (China time), so births on 3 and 5 February can get the wrong solar year, silently. | Search summaries on Li Chun; code reads `month === 2 && day < 4`. |
| 4 | **Derived numbers are mixed into the grid with no separate raw layer.** Conductor is always added and Driver is added unless the day is 1–9, 10, 20 or 30, so the raw date digits cannot be audited. This is one documented convention, not the only one. | `calculateGrid` builds one pool. |
| 5 | **No statement that readings are unvalidated, and strong predictive wording.** Examples in its content include wealth, fame, an "inheritance dimension", "health and wellbeing may require more deliberate attention", and "Progress often accelerates after significant life milestones". No disclaimer text was found in its content, labels or PDF exporter. | Text search of `interpretations.ts`, `labels.ts`, `pdfExporter.ts`. |
| 6 | **Accessibility gaps.** No `aria-*` attributes in the components, labels are not tied to inputs (no `htmlFor`/`id`), and the segmented gender buttons do not expose their selected state. | Grep of `src/components`. |
| 7 | **Security hardening.** `tauri.conf.json` sets `"csp": null`. | File contents. |
| 8 | **Tooling.** No `lint` or `typecheck` script; type-checking only happens inside `build`. The README says "25 unit tests" but the engine is the only thing tested (no UI, report or PDF tests). | `package.json`, file list. |
| 9 | **Per-direction Kua text may not match the standard table (unverified).** Its Kua 1 text names North as the career direction and South as health, whereas the Eight Mansions table as I remember it for Kua 1 gives South-East, East, South and North for the four named directions. I could not verify either version because the table was not visible in search results. Check against a primary source before relying on it. | Content text lines for Kua 1 and Kua 3; **my recollection is unverified**. |

## Ported into this project

| Idea | How it is done here |
|---|---|
| Indian number-pool rule (Destiny always; Driver unless the day is 1–9, 10, 20 or 30) | An **explicit, separate overlay mode** with a low-confidence note; the raw date audit is never changed. A single search summary also described the rule. |
| Kua with solar-year handling | `src/loshu/kua.ts`. Fixes finding 1 (0 counts as 9) and supports **1900–2099 only**. Dates before 3 February use the previous solar year; **3, 4 and 5 February return both candidates** instead of guessing; no result outside the verified years. Formulas are tested against hand values, published chart values and an independent closed form for every year 1900–2099. |
| Gender framing for Kua | A "Kua formula" choice (show both, male formula, female formula). The default shows both formulas and interprets neither. Nothing is stored. |
| Direct PDF download | `src/pdf/renderPdf.ts` using `pdf-lib`, loaded only on demand. Fixed neutral file name `lo-shu-report.pdf`, neutral metadata (no author), A4, riders printed. A print route remains for names with characters the standard PDF fonts cannot show. |
| Kua group directions | Group level only (East: N, S, E, SE; West: W, NW, SW, NE), confirmed by several search summaries. Per-direction meanings are **not** used (finding 9). |

## Not ported (needs your decision)

- **Traditional Chinese (zh-TW) interface and report.** Requires reviewed translations and an embedded CJK font; translation accuracy cannot be verified here.
- **Business branding on reports** (company name, contact details, operator). Not requested for this app.
- **Predictive and wealth/fame wording.** Deliberately left out (finding 5).
- **Desktop packaging (Tauri).** This project is a web app.

## Suggested fixes for the reviewed project itself

Apply finding 1's fix (`0 → 9`) and add regression tests for years 2009 and 2018; validate dates inside the engine; handle 3–5 February explicitly; reject years outside 1900–2099; add an "unvalidated tradition" notice and soften predictive wording; add form labels (`htmlFor`/`id`), `aria-pressed` on the segmented control and a `lint`/`typecheck` script; set a restrictive CSP in `tauri.conf.json`.
