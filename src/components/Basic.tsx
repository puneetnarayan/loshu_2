import { LINE_NAMES } from '../data/rules';
import type { Digit, Report } from '../loshu';
import { lineLabel } from '../loshu';
import { CellDetail, GridView } from './GridView';
import { Derivation, EvidenceLabel, RuleDerivation, Section, StatusTag, VerificationBadge } from './shared';

interface Props {
  report: Report;
  selected: Digit | null;
  onSelect: (d: Digit) => void;
}

export function Basic({ report, selected, onSelect }: Props) {
  const { analysis: a, triggered, synthesis, checks } = report;
  const present = triggered.filter((t) => t.rule.category === 'number');
  const repeated = triggered.filter((t) => t.rule.category === 'repetition');
  const missing = triggered.filter((t) => t.rule.category === 'missing-number');
  const complete = triggered.filter((t) => t.rule.category === 'line');
  const empty = triggered.filter((t) => t.rule.category === 'empty-line');
  const suggestions = [...new Set([...missing, ...empty, ...repeated, ...complete].map((t) => t.rule.reflectionSuggestion))];

  return (
    <div id="panel-basic" role="tabpanel" aria-labelledby="tab-basic" tabIndex={0} className="tabpanel">
      <p className="intro">
        The Lo Shu Grid is a 3×3 square. Each digit of your birth date goes into its fixed spot. This page shows what the tradition says about the pattern, as ideas to reflect on, not facts about you.
      </p>
      <VerificationBadge analysis={a} checks={checks} />

      <Section title="1. Your Lo Shu Grid">
        <GridView analysis={a} selected={selected} onSelect={onSelect} variant="basic" triggered={triggered} />
        <CellDetail digit={selected} analysis={a} triggered={triggered} variant="basic" />
        <ul className="legend" aria-label="Legend">
          <li><StatusTag status="present" /> appears once</li>
          <li><StatusTag status="repeated" /> appears more than once</li>
          <li><StatusTag status="missing" /> does not appear in your date</li>
        </ul>
      </Section>

      <Section title="2. How Your Grid Was Calculated">
        <ol>
          <li>Your date is read as day, month, year: <strong>{a.dob.normalised}</strong>.</li>
          <li>Its digits are: <strong>{a.audit.allDigits.join(', ')}</strong>.</li>
          <li>
            Zeros are left out{a.audit.zerosExcluded > 0 ? ` (${a.audit.zerosExcluded} removed)` : ' (there were none)'}, leaving: <strong>{a.audit.nonZeroDigits.join(', ')}</strong>.
          </li>
          <li>Each remaining digit is counted and placed in its fixed spot in the grid.</li>
        </ol>
        <Derivation>
          <table className="table">
            <caption>How many times each number appears</caption>
            <thead>
              <tr><th scope="col">Number</th><th scope="col">Count</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {a.digits.map((s) => (
                <tr key={s.digit}>
                  <th scope="row">{s.digit}</th>
                  <td>{s.rawCount}</td>
                  <td><StatusTag status={s.rawStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Only your birth-date digits are counted. No other numbers are added to this grid.</p>
        </Derivation>
      </Section>

      <Section title="3. Numbers Present">
        <p>Numbers that appear at least once: <strong>{a.audit.presentSet.join(', ') || 'none'}</strong>.</p>
        {present.length === 0 && <p>No documented rule applies.</p>}
        <ul className="plain">
          {present.map((t) => (
            <li key={t.rule.id}>
              <strong>{t.rule.requiredDigits[0]}</strong>: {t.rule.basicText}
              <RuleDerivation rule={t.rule} why={t.why} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="4. Repeated Numbers">
        {repeated.length === 0 ? (
          <p>No number appears more than once.</p>
        ) : (
          <>
            <p>
              Numbers that appear more than once: <strong>{a.audit.repeatedSet.map((d) => `${d} (×${a.audit.rawCounts[d]})`).join(', ')}</strong>. More repeats do not simply mean more benefit; the tradition describes both strengths and possible excess. Because sources disagree about how to read two versus three or more repeats, this page uses one general reading.
            </p>
            <ul className="plain">
              {repeated.map((t) => (
                <li key={t.rule.id}>
                  <strong>{t.rule.requiredCounts[0]?.digit}</strong>: {t.rule.basicText}
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="5. Missing Numbers">
        {missing.length === 0 ? (
          <p>No number from 1 to 9 is missing.</p>
        ) : (
          <>
            <p>
              Numbers that do not appear: <strong>{a.audit.missingSet.join(', ')}</strong>. A missing number is a prompt for reflection in this tradition. It does not mean you lack a talent, quality or opportunity.
            </p>
            <ul className="plain">
              {missing.map((t) => (
                <li key={t.rule.id}>
                  <strong>{t.rule.requiredCounts[0]?.digit}</strong>: {t.rule.basicText}
                  <br />
                  <span className="muted">Idea to try: {t.rule.reflectionSuggestion}</span>
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="6. Complete Lines">
        <p>A line is complete when all three of its numbers appear in your date.</p>
        {complete.length === 0 ? (
          <p>No line is complete in your date.</p>
        ) : (
          <ul className="plain">
            {complete.map((t) => {
              const line = a.lines.find((l) => l.def.id === t.rule.requiredLines[0]?.lineId)!;
              return (
                <li key={t.rule.id}>
                  <strong>{lineLabel(line.def)}</strong> ({LINE_NAMES[line.def.id]?.name}): {t.rule.basicText}
                  <EvidenceLabel rule={t.rule} />
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="7. Missing Lines">
        <p>A line is missing when none of its three numbers appear in your date.</p>
        {empty.length === 0 ? (
          <p>No line is entirely missing.</p>
        ) : (
          <ul className="plain">
            {empty.map((t) => {
              const line = a.lines.find((l) => l.def.id === t.rule.requiredLines[0]?.lineId)!;
              return (
                <li key={t.rule.id}>
                  <strong>{lineLabel(line.def)}</strong> ({LINE_NAMES[line.def.id]?.name}): {t.rule.basicText}
                  <EvidenceLabel rule={t.rule} />
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              );
            })}
          </ul>
        )}
        {a.partialLineIds.length > 0 && (
          <p className="muted">
            {a.partialLineIds.length} other line{a.partialLineIds.length === 1 ? ' has' : 's have'} one or two of their numbers. We found no documented reading for that situation, so we do not make one up.
          </p>
        )}
      </Section>

      <Section title="8. Your Overall Interpretation">
        {synthesis.summary.map((s) => (
          <p key={s}>{s}</p>
        ))}
        <Derivation>
          <p>This summary is built only from the rules that matched your date:</p>
          <ul>
            {synthesis.audit
              .filter((e) => e.included)
              .map((e) => (
                <li key={e.ruleId}>
                  <code>{e.ruleId}</code> ({e.tier}): {e.why.join(' ')}
                </li>
              ))}
          </ul>
          {synthesis.conflicts.map((g) => (
            <p key={g.theme}>{g.explanation}</p>
          ))}
          {synthesis.unsupported.length > 0 && (
            <>
              <p>Not covered by any documented rule:</p>
              <ul>
                {synthesis.unsupported.map((u) => (
                  <li key={u.subject}>
                    <strong>{u.subject}</strong>: {u.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Derivation>
      </Section>

      <Section title="9. Practical Reflection Suggestions">
        {suggestions.length === 0 ? (
          <p>No suggestions apply: no documented pattern was triggered.</p>
        ) : (
          <>
            <p>Ordinary, optional ideas linked to the patterns above. They are not remedies and are not promised to change anything.</p>
            <ul>
              {suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="10. Understanding the Limitations">
        <ul>
          <li><strong>The counting is arithmetic.</strong> It is checked automatically and is reproducible.</li>
          <li><strong>The meanings are tradition.</strong> We found no credible controlled evidence that a birth-date grid predicts personality or life events.</li>
          <li>Different numerology schools read the same grid differently, and some line names are disputed.</li>
          <li>We could not open the web pages the wording is based on, so the wording has not been checked against those texts. See the source labels in the Advanced tab.</li>
          <li>Please do not use this for medical, financial, legal or relationship decisions.</li>
        </ul>
      </Section>
    </div>
  );
}
