# Research log and source verification

**Review dates:** 2026-10-04 (first pass) and 2026-10-04 (second pass, after the owner asked for the research to proceed without extra network access).
**Reviewer:** Claude (AI assistant), working inside a sandbox.

## How the research was done, and its limit

The sandbox's network policy blocks direct page fetches (`EGRESS_BLOCKED`) for every site tried, including the five starter references, Wikipedia, arXiv and SAGE. The only working channel was a **web search tool that returns short summaries aggregated across a set of result pages, with the URLs of those pages**.

So, throughout the project:

1. **No source page was read in full.** Every source record has `accessMethod` of `search-summary-only` or `not-accessible`. A test asserts that no source is marked `read-in-full`.
2. **Fidelity labels are capped accordingly.** `directly-documented` and `multiple-sources` are never used (the validator refuses them unless every cited source was read in full). The strongest label used is **`multiple-summaries-agree`**: separate searches, returning different result sets, gave consistent statements. `unverified-search-summary` means a single summary. A summary is aggregated across several pages, so I often could not tell which page said what; where that is so, the registry says so.
3. **All rule wording is the project's own paraphrase** at the level of detail the summaries supported. No quotations.
4. **Authors and dates are `null`** unless a result showed them. Only the empirical paper has them (see below), flagged as taken from a summary.
5. The planetary table, previously from my background knowledge, has now been cross-checked by several search summaries. Background knowledge still underlies only the Kua assessment, which is why Kua is unavailable.

To strengthen this further, someone with network access should open the sources listed below and compare the wording.

## Sources identified

Grouped by purpose. All are `search-summary-only` unless marked. Titles and URLs are as returned by search; see `src/data/sources.ts` for the full registry and the note on each.

| Purpose | Sources (registry ids) |
|---|---|
| Number meanings | SRC-MEDIUM-1-TO-9, SRC-AFFIRMATIONFLOW-WHAT, SRC-PARAMARSH, SRC-600IQ, SRC-ANKSHASTRA |
| Repetition | SRC-JCCHAUDHRY-REPEAT, SRC-SILENTKNOWLEDGE-REPEAT, SRC-SILENTKNOWLEDGE-9, SRC-NUMERICWISDOM-9 |
| Plane names (complete lines) | SRC-JCCHAUDHRY-PLANES, SRC-HOROSCOPERS-PLANES, SRC-OCCULTSCIENCE-PLANES, SRC-NUMEROLOGYBYNEHAA-PLANES, SRC-VEDICMEET-ARROWS |
| Missing-line ("weakness arrow") names | SRC-ASTROMEDHA-GRID, SRC-ASTROMEDHA-FRUSTRATION, SRC-ASTROMEDHA-POORMEMORY, SRC-STARNUM-ARROWS, SRC-LOSHUCALC-MINDPLANE |
| Diagonals (golden/silver) | SRC-SHIVOHAM-RAJYOG, SRC-ASTROMEDHA-GRID |
| Planets | SRC-OCCULTSCIENCE-PLANETS, SRC-ASTROSIGHT-PLANETS, SRC-WEBINDIA-RULING |
| Driver/Destiny and grid conventions | SRC-SWARNSIDDHI-DC, SRC-ANKSHASTRA |
| Kua (why it is unavailable) | SRC-KUA-FENGSHUI-FR |
| History and maths | SRC-SAGE-LUOSHU-2015, SRC-WIKI-LUOSHU, SRC-WIKI-SHUANGGUDUI |
| Evidence | SRC-JASNH-BIRTHNUMBERS (Genovese 2017), SRC-WIKI-BARNUM |
| Starter references, **not accessible** | SRC-ASTROSAKI, SRC-NIDARSHANAVEDH, SRC-LOSHUGRIDCALCULATORS, SRC-NUMERELY, SRC-LUCKYPROPERTIES |

Commercial calculators and blogs are examples of practice, not independent validation.

## Findings by research subject

| # | Subject | Result |
|---|---|---|
| 1 | Historical Lo Shu and its maths | Maths **verified by this project's tests** (every row, column, diagonal = 15). History, per search summaries (verify): the *Da Dai Liji* (about 80 CE) gives the arrangement as 2-9-4 / 7-5-3 / 6-1-8, which is a left-right **mirror** of the layout used here; the earliest occurrence is a Western Han divination board from the 1977 Fuyang (Shuanggudui) excavation. The legendary dating (turtle, Emperor Yu) varied between summaries (roughly 2200–2800 BC) and is legend, not historical evidence. A mirror image maps lines to lines, so line membership is unaffected. |
| 2 | Fixed arrangement | 4 9 2 / 3 5 7 / 8 1 6 (the modern numerology orientation, as specified). |
| 3 | DOB-only placement | Summaries agree digits of the full date are placed, zero excluded. |
| 4 | Indian conventions | Moolank and Bhagyank are used; see 5, 6 and the disagreement list. |
| 5 | Moolank / Driver | Day digits summed and reduced. Consistent across summaries. |
| 6 | Bhagyank / Destiny | Full-date digits summed and reduced. Consistent. Master-number handling in this context was not researched; none are kept. |
| 7 | Kua | Summaries confirm dependence on Li Chun (about 4 February), a post-1999 convention and sex-specific formulas. Exact boundary dates and times, time zones and special cases were not verifiable, so **Kua stays unavailable**. |
| 8 | Meanings of 1–9 | Keyword level; consistent across several summaries (1 individuality/leadership, 2 sensitivity, 3 expression, 4 discipline, 5 balance, 6 responsibility, 7 analysis/spirituality, 8 ambition, 9 wisdom/completion/compassion). Present-number rules are labelled `multiple-summaries-agree`. |
| 9 | Missing and repeated digits | Missing = area for development (consistent). Repetition: a summary described a tier pattern: two strengthened, three excessive, four or more dominant. **Implemented as three generic tiers**; per-digit count descriptions (for example three 2s, four 2s) appeared but were not verified and are not used. |
| 10 | Complete and missing arrows | Complete-line plane names consistent across searches. **Missing-line names now documented**: 4-5-6 Frustration, 3-5-7 Poor Memory, 2-7-6 Loneliness, 8-1-6 Losses, 4-3-8 Indecision (or Confusion), 9-5-1 Passivity, 2-5-8 Sensitivity (or Frustration), 4-9-2 "weakness arrow on the mental plane". Sources conflict for some (below). Reported as traditional labels, framed as reflection prompts. |
| 11 | Lines | Eight geometric lines only. Some guides' "arrows" (1-2-3, 1-5-9, and so on) belong to a different grid layout and are excluded. |
| 12 | Planes | Mental 4-9-2, Emotional/Soul 3-5-7, Practical/Physical 8-1-6, Thought 4-3-8, Will 9-5-1, Action 2-7-6, Golden 4-5-6, Silver 2-5-8. |
| 13 | Planets | Sun 1, Moon 2, Jupiter 3, Rahu 4, Mercury 5, Venus 6, Ketu 7, Saturn 8, Mars 9: confirmed by several summaries (`multiple-summaries-agree`); one lists 4 as "Uranus (Rahu)". Off by default. |
| 14 | Interactions | No documented interaction rules were found. Synthesis uses project theme tags and says so. |
| 15 | Author differences | See below. |
| 16 | Scientific evidence | See below. |

## Disagreements found

- **"Arrow of Determination".** Attached to 4-3-8 in one summary, to 9-5-1 ("Will plane") in others, and to the diagonal 1-5-9 in another (a different grid layout). Both verticals are tagged `sources-disagree`.
- **4-5-6.** "Golden line / golden yog / raj yog" in several; another guide also calls it the "will power plane", which conflicts with 9-5-1.
- **Empty 2-5-8.** "Arrow of Sensitivity" in one summary, "Arrow of Frustration" in another (which others assign to 4-5-6).
- **Empty 4-3-8.** "Indecision" vs "Confusion".
- **Poor memory.** Assigned to empty 3-5-7 by one guide and to an empty mental plane (4-9-2) by another.
- **Whether Driver and Destiny are added to the grid.** Summaries say many Indian practitioners add them, a "modern" method adds them, and a purist method uses only the date digits. One summary also says Moolank is not written when the day is 1–9, 10, 20 or 30 (the source was not identified). The app keeps DOB-only as default and offers separate overlays.
- **Repetition tiers** are not described identically across guides.
- **Planets.** 4 as Rahu vs Uranus.

## An independent check of one quoted statistic

One summary quoted that the golden pattern (4-5-6 complete) occurs in "1.89%" of grids from date digits alone and about "7.85%" when extra numbers are added, and another that "only 2–3% of people" have it. This project computed, over every calendar date (unweighted by population):

| Date range | 4-5-6 complete, DOB digits only | with Driver + Destiny added |
|---|---|---|
| 1900–2025 (46,021 dates) | 1.52% | 7.13% |
| 1950–2000 (18,628 dates) | 2.16% | 8.50% |

The quoted figures are the same order of magnitude and show the same roughly fivefold jump. The share depends strongly on the date range and on the overlay convention, which is why overlays are kept in a separate, labelled layer. Wealth, fame or luck associated with this pattern are predictive claims and are not endorsed.

## Scientific evidence

- **Empirical test found:** Genovese (2017), *A Test of Numerology: Do Birth Numbers Predict Nobel Prize Winners?*, Journal of Articles in Support of the Null Hypothesis 13(2). Per search summaries (the paper was not opened; verify the figures): birth numbers (digit sum of birth date) of Nobel Prize winners 1901–2010 did not differ from chance (chi-square 4.92, df 8, p = 0.77; by prize category chi-square 28.9, df 40, p = 0.90). This tests one claim, birth number against one outcome, **not** Lo Shu grid interpretations.
- **Perceived accuracy:** the Barnum (Forer) effect: Forer (1949) gave students an identical 13-statement profile, drawn largely from an astrology book, and they rated it highly accurate; Dickson and Kelly (1985) is cited in later discussion. This is why a feeling that a reading "fits" is not evidence that it is valid (details from a search summary of the Wikipedia article; not opened).
- **No supporting study identified.** Blog-level summaries claim that no peer-reviewed study supports birth-date numerology; those are secondary and weak evidence, but I found no study that does.
- The label used for every rule is *Traditional interpretation · not scientifically validated*, with the explanation "no credible controlled study **identified in this project** supports…". `empirically-tested` is not used, and the validator refuses it without an academic source read in full.
- No accuracy percentage is given anywhere.

## Remaining gaps

- No page was read in full; wording has not been compared with source texts.
- Per-digit repetition detail beyond the three generic tiers was not verified.
- How a "missing arrow" is defined in primary Indian numerology texts was not checked; the labels come from commercial sites.
- Kua conventions (Li Chun boundaries, time zones, special cases) are unverified, so Kua is unavailable.
- The Genovese figures and the Forer details come from summaries and should be checked against the papers.

---

## Third pass: extra interpretations (same method, same limit)

Still search summaries only; no page opened. Added on request ("build all of them, put a rider wherever confidence is low"). Every new rule carries a `confidence` (moderate, low or very low) and a plain-text `confidenceReason`; the UI and the PDF print it as a rider.

| Feature | What the summaries supported | Confidence | Not used, and why |
|---|---|---|---|
| Partial-line tiers | One summary described plane strength tiers: strong (3 digits), moderate (2), weak (1), absent (0). | Low | Per-line, digit-specific partial readings: none found. Tier meaning is generic wording written by this project. |
| Driver (Moolank) 1–9 | One-line meanings from a result set of Mulank guides. | Low | Lucky numbers and success timing. |
| Destiny (Bhagyank) 1–9 | Meanings for 1, 2, 3, 4, 5, 8, 9 visible; 6 and 7 not visible, so those two extend the Lo Shu keywords and are labelled `insufficient-documentation`. | Low | The claim that the Conductor shows life direction "after age 35" (predictive). |
| Driver/Destiny compatibility | A friend/average/enemy table was visible only for rows 1–4 and other results differ. | none | **Not implemented.** No compatibility verdict anywhere. |
| Planet profile | Digit-to-planet mapping confirmed by several summaries. Planet themes are short keywords partly from background knowledge. | Low | Planet friendships and dashas. |
| Five elements | Mapping 1 water; 2, 5, 8 earth; 3, 4 wood; 6, 7 metal; 9 fire confirmed by several summaries (Feng Shui / Nine Star Ki). Element themes are general keywords from background knowledge. | Low | Combining elements with the Indian planetary scheme (different traditions). |
| Remedies | Habits, colours, mantras, charity and Feng Shui objects reported for missing 1–9 and repeated 1, 4, 5. | Low | **Gemstones** (cost, no evidence). Remedies for repeated 2, 3, 6, 7, 8, 9: none found. No remedy is presented as treating anything. |
| Personal year | Formula (birth day + birth month + year, digits added, reduced) agrees across summaries and a worked example (22 December, 2026 gives 8) is reproduced by a test. Meanings 1–9 are generic. | Very low | Personal month; the "Lo Shu grid for the year" (method not establishable); Lo Shu tradition does not include it. |
| Name numbers | Pythagorean table (A J S = 1 … I R = 9) and the Expression / Soul Urge / Personality method agree across summaries. Readings reuse the Lo Shu keywords. | Very low | Chaldean table; master-number rules (the reduction chain is shown instead); Y is treated as a consonant (summaries differ). |
| Two-date comparison | Descriptive set arithmetic only (shared and unshared digits, line states, Driver/Destiny equality). | Arithmetic is reproducible; no interpretation | Any compatibility verdict. |
| Historical mirror view | Per a summary of an encyclopedia article, the *Da Dai Liji* (about 80 CE) shows 2-9-4 / 7-5-3 / 6-1-8. Drawing only; no calculation changes. | Low | — |
| Line weights, grid facts, pattern frequency | Arithmetic, tested. Frequencies are regenerated from the engine and checked against an independent string-based count. | Reproducible | Any meaning for heavy or light lines (no source). |

Sources added to the registry: tier guides, Mulank/Conductor guides, remedy guides, element mapping pages, personal-year pages and name-numerology pages (see `src/data/sources.ts`). One result (an astrology blog's compatibility table) was reviewed and deliberately not registered because nothing relies on it.
