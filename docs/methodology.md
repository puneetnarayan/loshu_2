# Methodology

## Calculation conventions (implemented)

- **Input:** strict `DD-MM-YYYY` (separators `-`, `/`, `.`). Two-digit day and month, four-digit year. ISO order, single-digit parts and two-digit years are rejected with an explanation, never reinterpreted. Gregorian dates from 15-10-1582, not in the future.
- **Raw DOB layer (authoritative):** the digits of `DDMMYYYY` in order; zeros are excluded; remaining digits 1–9 are counted. Present = count ≥ 1, repeated = count ≥ 2, missing = count 0.
- **Driver (Moolank):** digits of the **day only**, summed, repeated digit-sum until a single digit 1–9. Example: 23 → 2+3 = 5.
- **Destiny (Bhagyank):** all eight digits of the date, summed, repeated digit-sum until 1–9, with no master-number preservation. Example: 23-11-1994 → 2+3+1+1+1+9+9+4 = 30 → 3.
- **Overlay layer:** separate counts. Each selected overlay adds **one** occurrence of its digit (Driver and/or Destiny; they stack if equal). `combined = raw + overlay`. The raw audit trail is never rewritten.
- **Modes:** DOB only (default), +Driver, +Destiny, +Driver+Destiny. **+Kua is listed but unavailable** (see `docs/research/research-log.md`, subject 7).
- **Repetition:** three tiers per digit: two (strengthened), three (excess begins), four or more (dominant). Per-digit count-specific descriptions are not used because they were not verified.
- **Lines:** exactly eight geometric lines: rows 4-9-2, 3-5-7, 8-1-6; columns 4-3-8, 9-5-1, 2-7-6; diagonals 4-5-6, 2-5-8. Complete = 3 present, empty = 3 missing, partial otherwise. No other groupings are ever created.
- **Basic tab** always uses DOB-only. **Advanced** uses the selected mode. Both call the same `buildReport()` function; there are no separate formulas.

## Interpretation engine

`src/loshu/engine.ts` evaluates structured conditions (`requiredDigits`, `requiredCounts`, `requiredLines`) from the catalogue against an `Analysis`. `src/loshu/synthesis.ts` then:

1. removes duplicates sharing a `conclusionKey`;
2. splits primary (complete/empty lines, repeated, missing numbers) from secondary (present numbers, planetary notes);
3. finds reinforcing themes and themes appearing both as a pattern and as a reflection area (reported as different aspects, not contradictions);
4. lists what is **unsupported** (partial lines, count-specific readings, overlay interactions, Kua) rather than filling gaps;
5. builds a deterministic summary from each rule's `summaryPhrase` and records an audit entry per rule with the reasons it fired.

Theme tags are project-assigned grouping labels, not claims by any source. No LLM or network call is involved.

## Accuracy and confidence: four separate questions

1. **Mathematical verification.** Runtime checks (`verifyAnalysis`) re-derive the result by a different route; the UI says "Calculation verified" only if all pass. The automated test suite additionally covers dates, counts, lines, overlays, rule matching and consistency.
2. **Source fidelity.** Per-rule label from the registry-linked sources. No source page could be opened, so the strongest label is `multiple-summaries-agree`; others are `unverified-search-summary` and `sources-disagree` (see research log).
3. **Scientific evidence.** Per-rule label; all rules are "traditional interpretation, not scientifically validated". The closest empirical test found (Genovese 2017, birth numbers vs Nobel winners) was null and does not test Lo Shu grids. The Barnum/Forer effect is the reason a sense of fit is not evidence.
4. **User-perceived fit.** Not collected. If added later it must be reported separately and never as accuracy.

These are never merged into a single percentage.

### Sketch of a future validation study (not implemented)

Preregister hypotheses and outcome measures; use independent, validated outcome measures (not self-rated agreement with the reading); recruit an adequate sample sized by a power analysis; blind assessors (and participants to which reading is theirs) where feasible; include comparison groups such as randomised or mismatched readings; plan replication; analyse with appropriate statistics and correction for multiple comparisons. Subjective ratings of "fit" are not evidence of predictive accuracy.

## Schema notes

`src/data/schema.ts` implements every field requested in the brief. Deliberate adjustments:

- Source metadata lives in `src/data/sources.ts`. Rules hold `sourceIds`; `resolveSources()` in `src/lookup.ts` yields `sourceTitle`, `sourceAuthor`, `sourceUrl`, `sourceDate` so metadata is not duplicated.
- Added engine fields: `priority`, `themes`, `direction`, `activation`, `summaryPhrase`, `conclusionKey`.
- `triggerConditions` is human-readable; the structured `required*` fields drive matching.
- `src/data/validate.ts` validates the catalogue (tested in `tests/catalogue.test.ts`) and refuses stronger fidelity/evidence labels than the sources support.

To update an interpretation, edit `src/data/rules.ts` (or the registry) only; the calculation code does not change.

## Privacy

All computation is local. The date of birth is held in React state only: no `localStorage`, `sessionStorage`, cookies, URL, file name, analytics, or network request. Tests assert no `fetch` call and no storage write. Interpretation text is rendered by React as text (no HTML injection). External links use `target="_blank"` with `rel="noopener noreferrer"` and are labelled as external.
