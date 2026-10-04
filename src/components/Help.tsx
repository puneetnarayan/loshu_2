import { useId } from 'react';

const GLOSSARY: Array<[string, string]> = [
  ['Lo Shu Grid', 'A 3×3 magic square (4 9 2 / 3 5 7 / 8 1 6) used in numerology as a fixed map onto which birth-date digits are placed.'],
  ['Magic square', 'A square of numbers where every row, column and diagonal has the same sum. Here the sum is 15 (a mathematical fact).'],
  ['Raw DOB layer', 'Only the non-zero digits of the full date of birth in DD-MM-YYYY. Always kept separate from overlays.'],
  ['Overlay', 'Optional extra numbers (Driver, Destiny) counted in a separate layer when a mode is selected. They never rewrite the raw digits.'],
  ['Driver (Moolank, Birth Number)', 'The digits of the day of birth added and reduced to a single digit 1–9. Month and year are not used.'],
  ['Destiny (Bhagyank, Conductor)', 'All digits of the full date added and reduced to a single digit 1–9. Master numbers are not preserved.'],
  ['Kua', 'A Feng Shui number that depends on the solar year and sex-specific formulas. Shown as unavailable because those conventions could not be verified here.'],
  ['Present / Repeated / Missing', 'Present: count of at least 1. Repeated: count of 2 or more. Missing: count of 0.'],
  ['Line, arrow, plane', 'Any of the eight straight lines of three cells (3 rows, 3 columns, 2 diagonals). Names such as "mental plane" or "arrow of determination" are traditional labels that differ between sources.'],
  ['Complete / partial / empty line', 'Complete: all three digits present. Empty: all three missing. Partial: one or two present.'],
  ['Source fidelity', 'How faithfully a rule represents an identified source. "Source not directly verified" means only search-result summaries were available.'],
  ['Scientific evidence label', 'Whether credible controlled research supports the claim. Traditional interpretations here carry the label "not scientifically validated".'],
  ['Rule ID', 'A stable identifier (for example NUM-5-MISSING) so any conclusion can be traced to the catalogue entry that produced it.'],
];

export function HelpPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className="help">
      <button type="button" className="btn" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        {open ? 'Hide help' : 'Help: about this tab'}
      </button>
      {open && (
        <div id={id} className="panel help-body" role="region" aria-label="About this tab">
          <h2>About the Lo Shu Grid tab</h2>
          <ol>
            <li><strong>What the grid is.</strong> A 3×3 magic square from Chinese tradition, used in numerology as a fixed layout: 4 9 2 / 3 5 7 / 8 1 6. Every line of three adds to 15.</li>
            <li><strong>What this does.</strong> It places the digits of a date of birth onto that grid, counts them, finds missing, repeated and complete lines, and shows what the tradition says, with sources.</li>
            <li><strong>Entering a date.</strong> Type DD-MM-YYYY (for example 23-11-1994) or use the calendar picker, then press Calculate. Impossible dates are rejected, never guessed.</li>
            <li><strong>How it is calculated.</strong> The date is read as day, month, year. Zeros are dropped. Each remaining digit is counted and placed in its fixed cell.</li>
            <li><strong>Present, repeated, missing.</strong> Present means it appears at least once; repeated means two or more; missing means zero. Within this tradition a missing number is a topic for reflection and a repeated one is an emphasis, not a verdict.</li>
            <li><strong>Arrows and planes.</strong> Each straight line of three cells is checked. A complete line has all three digits; an empty line has none. Line names vary by school and some are disputed.</li>
            <li><strong>Driver and Destiny overlays (Advanced).</strong> Optional extra numbers derived from the date. They are counted in a separate layer so the raw date digits stay unchanged. Whether to include them depends on the school.</li>
            <li><strong>Reading the labels.</strong> "Calculation verified" means the arithmetic checks passed. The evidence label tells you whether science supports the meaning (here: traditional, not validated). The source label says how well the wording is tied to its source. These are never combined into a percentage.</li>
            <li><strong>Limitations.</strong> The meanings are traditional symbolism. No credible controlled evidence was identified that birth-date grids predict personality or events. The wording was based on search summaries because the source pages could not be opened. Do not use it for medical, financial, legal or relationship decisions.</li>
            <li><strong>Why it is here.</strong> It gives a numerology app a reproducible, transparent calculation with a traceable, source-labelled reading, so users and practitioners can see exactly how each statement arose and compare conventions.</li>
          </ol>
          <h3>Glossary</h3>
          <dl className="glossary">
            {GLOSSARY.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
