# Research log and source verification

**Review date:** 2026-10-04
**Reviewer:** Claude (AI assistant), working inside a sandbox.

## Read this first: what could and could not be verified

The network policy of the environment blocked every direct page fetch (`EGRESS_BLOCKED`). That includes all five starter references supplied in the brief and every other site I tried (Wikipedia, arXiv, SAGE, the other calculator sites).
The only research channel that worked was a **web search tool that returns short summaries of result pages**.

Consequences, applied throughout the project:

1. **No source page was read in full.** Every source record has `accessMethod` of `search-summary-only` or `not-accessible`.
2. **Every interpretation rule is labelled `unverified-search-summary`** (or `sources-disagree` / `insufficient-documentation` where that is more accurate). No rule claims `directly-documented` or `multiple-sources`. A validation test in `tests/catalogue.test.ts` enforces this: a rule cannot claim those labels unless every cited source has `read-in-full`.
3. **The wording of every rule is the project's own paraphrase** at the level of detail that search summaries supported. No quotation from any source is used.
4. **Authors and publication dates are `null`** wherever the search result did not show them. None were guessed.
5. **To close this gap:** allow the relevant domains in the environment's network settings (or supply the texts), then re-run the review: open each source, set `accessMethod: 'read-in-full'`, and upgrade `sourceFidelityStatus` only for rules whose text you have actually compared.

## Sources identified

| ID | Title (as returned by search) | Kind | Access |
|---|---|---|---|
| SRC-PARAMARSH | Lo Shu Grid: Meaning, Arrows, Missing Numbers - Paramarsh | calculator/guide | search summary only |
| SRC-VEDICMEET-ARROWS | Arrows in Lo Shu Grid: know Your Life's Energy & Purpose | calculator/guide | search summary only |
| SRC-600IQ | Lo Shu Grid Calculator: Free Full Grid, Arrows & Remedies | calculator | search summary only |
| SRC-ANKSHASTRA | Lo Shu Grid Calculator (Ankshastra) | calculator | search summary only |
| SRC-SILENTKNOWLEDGE-REPEAT | Repeated Numbers in Lo Shu Grid Explained | blog | search summary only |
| SRC-SWARNSIDDHI-DC | Driver and Conductor Numbers — Mulank and Bhagyank Read Together | blog | search summary only |
| SRC-KUA-FENGSHUI-FR | What is the kua number? - Feng Shui Expert | blog | search summary only |
| SRC-SAGE-LUOSHU-2015 | Luo Shu: Ancient Chinese Magic Square on Linear Algebra (listed authors: So, Lee, Li, Leung; 2015) | academic | search summary only |
| SRC-JASNH-BIRTHNUMBERS | "A Test of Numerology: Do Birth Numbers …" (title truncated in result) | academic | title only, **not read** |
| SRC-ASTROSAKI, SRC-NIDARSHANAVEDH, SRC-LOSHUGRIDCALCULATORS, SRC-NUMERELY, SRC-LUCKYPROPERTIES | the five starter references | commercial | **not accessible** |

Commercial calculators are treated as examples of practice, not independent validation.

## Findings by research subject

| # | Subject | Status |
|---|---|---|
| 1 | Historical Lo Shu square and its maths | **Maths verified by this project's tests** (every row, column, diagonal = 15; digits 1–9 once each). **History not verified.** Search summaries gave a legendary date range of roughly 2200–2800 BC and mentioned the *Da Dai Liji* and a 1977 tomb find (Fuyang, Anhui, 2nd c. BCE). I have no verified source for these dates; treat them as unconfirmed. |
| 2 | Fixed 3×3 arrangement | 4 9 2 / 3 5 7 / 8 1 6 as specified in the brief. Other orientations (rotations/reflections of the same square) were not researched. |
| 3 | DOB-only placement | Summaries agree that the grid is filled from the digits of the full date, zero excluded. Implemented as the default and authoritative layer. |
| 4 | Indian conventions | Summaries describe the Indian approach using Moolank/Bhagyank. Not read in full. |
| 5 | Moolank / Driver | Day digits summed and reduced (consistent across summaries). Implemented. |
| 6 | Bhagyank / Destiny | Full-date digits summed and reduced (consistent across summaries). Implemented without master numbers; whether any school preserves 11/22/33 here was **not researched**. |
| 7 | Kua | Summaries confirm it depends on the solar-year start (Li Chun, about 4 February), the post-1999 convention and a sex-specific formula. Boundary handling, time zones and the special-case rules were not verified against primary sources, so **Kua is unavailable** (not guessed). |
| 8 | Meanings of 1–9 | Keyword-level only, from summaries. Wording is deliberately conservative. |
| 9 | Missing and repeated digits | Summaries describe missing = reflection area/"weakness" and repeated = stronger influence, "positive and challenging". Count-specific (2 vs 3+) readings appeared in a summary but were **not verified, so not implemented**. |
| 10 | Complete and missing arrows | Complete line naming collected from summaries. How a *missing* arrow is defined was not verified; the empty-line rules are labelled `insufficient-documentation`. |
| 11 | Lines (rows, columns, diagonals) | Eight geometric lines implemented as the authoritative rule. |
| 12 | Planes | Names (mental, emotional/soul, practical/physical, thought/planning, will, action, golden, silver) from summaries; see disagreements. |
| 13 | Planetary associations | Mapping 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury, 6 Venus, 7 Ketu, 8 Saturn, 9 Mars is the commonly-stated Indian scheme **from my background knowledge; it was not verified against a primary text** and is labelled `insufficient-documentation`. It is off by default. |
| 14 | Interactions (frequencies × lines × overlays) | No documented interaction rules were verified. The synthesis stage only combines rules via project-assigned theme tags and says so. |
| 15 | Differences among authors | Documented below. Only what the summaries showed. |
| 16 | Scientific evidence | See below. |

## Disagreements found

- **"Arrow of Determination".** One search summary named 9-5-1 (the "Will Plane") the Arrow of Determination; another listed "Arrow of Determination 4-3-8", while 4-3-8 was elsewhere called the "Thought Plane / Arrow of the Planner". Both lines are tagged `sources-disagree`.
- **Names for 4-9-2.** "Mental plane" vs "Arrow of Intellect" (treated as alternative names).
- **Diagonals.** "Golden line" (4-5-6) and "Silver line" (2-5-8) came from a limited set of calculators; wealth/luck claims are predictive and are reported as tradition only.
- **Whether Driver/Destiny are added to the grid.** One summary reports they are added by the "modern Chaldean" style; another says many Indian practitioners add them; others use DOB only. Hence the overlay modes, with DOB-only as default.
- **Repetition.** Whether repetition is strength, excess or both varies by author.
- **Planets.** Tables differ between schools (for example outer planets vs Rahu/Ketu).

## Scientific evidence

- Search summaries of blog-level and sceptical-commentary pages claim that no peer-reviewed study supports birth-date numerology. Those are **secondary and not authoritative**; I could not open them or any primary study.
- One candidate empirical paper was identified by title only (SRC-JASNH-BIRTHNUMBERS). **Its design and results are unknown to me.** It is not cited as showing anything.
- Therefore the evidence label used is *"Traditional interpretation · not scientifically validated"*, and its explanation says "no credible controlled study **identified in this project** supports…". This records absence of identified evidence, not proof that no evidence exists. The label `empirically-tested` is not used for any rule and the validator refuses it without an academic source read in full.
- No accuracy percentage is given anywhere.
