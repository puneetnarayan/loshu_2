import { LINE_NAMES } from '../data/rules';
import { useLang, useRuleText } from '../i18n';
import { zhFrequencyLabel, zhLineName, zhSummary } from '../i18n/zh';
import { FREQUENCY_RANGE, patternFrequencies } from '../lookup';
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
  const { tr, isZh } = useLang();
  const text = useRuleText();
  const lineName = (id: string) => (isZh ? zhLineName(id) : undefined) ?? LINE_NAMES[id]?.name;
  const summary = isZh ? zhSummary(report) : report.synthesis.summary;
  const { analysis: a, triggered, synthesis, checks } = report;
  const present = triggered.filter((t) => t.rule.category === 'number');
  const repeated = triggered.filter((t) => t.rule.category === 'repetition');
  const missing = triggered.filter((t) => t.rule.category === 'missing-number');
  const complete = triggered.filter((t) => t.rule.category === 'line');
  const empty = triggered.filter((t) => t.rule.category === 'empty-line');
  const partialTiers = triggered.filter((t) => t.rule.category === 'partial-line');
  const keyNumbers = triggered.filter((t) => t.rule.category === 'driver' || t.rule.category === 'destiny');
  const frequencies = patternFrequencies(a);
  const suggestions = [...new Set([...missing, ...empty, ...repeated, ...complete].map((t) => text.reflection(t.rule)))];

  return (
    <div id="panel-basic" role="tabpanel" aria-labelledby="tab-basic" tabIndex={0} className="tabpanel">
      <p className="intro">
        {tr(
          'The Lo Shu Grid is a 3×3 square. Each digit of your birth date goes into its fixed spot. This page shows what the tradition says about the pattern, as ideas to reflect on, not facts about you.',
          '洛書九宮格是一個 3×3 的方陣。出生日期的每個數字都放在固定的位置。本頁呈現傳統對這個模式的說法，作為反思的想法，而不是關於你的事實。',
        )}
      </p>
      <VerificationBadge analysis={a} checks={checks} />

      <Section title={tr('1. Your Lo Shu Grid', '1. 你的洛書九宮格')}>
        <GridView analysis={a} selected={selected} onSelect={onSelect} variant="basic" triggered={triggered} />
        <CellDetail digit={selected} analysis={a} triggered={triggered} variant="basic" />
        <ul className="legend" aria-label="Legend">
          <li><StatusTag status="present" /> {tr('appears once', '出現一次')}</li>
          <li><StatusTag status="repeated" /> {tr('appears more than once', '出現多次')}</li>
          <li><StatusTag status="missing" /> {tr('does not appear in your date', '你的日期中沒有出現')}</li>
        </ul>
      </Section>

      <Section title={tr('2. How Your Grid Was Calculated', '2. 九宮格如何計算')}>
        <ol>
          <li>{tr('Your date is read as day, month, year: ', '日期依「日、月、年」讀取：')}<strong>{a.dob.normalised}</strong>.</li>
          <li>{tr('Its digits are: ', '它的數字依序為：')}<strong>{a.audit.allDigits.join(', ')}</strong>.</li>
          <li>
            {tr(
              `Zeros are left out${a.audit.zerosExcluded > 0 ? ` (${a.audit.zerosExcluded} removed)` : ' (there were none)'}, leaving: `,
              `排除零${a.audit.zerosExcluded > 0 ? `（移除 ${a.audit.zerosExcluded} 個）` : '（沒有零）'}，剩下：`,
            )}
            <strong>{a.audit.nonZeroDigits.join(', ')}</strong>.
          </li>
          <li>{tr('Each remaining digit is counted and placed in its fixed spot in the grid.', '每個剩下的數字都會被計算，並放入九宮格的固定位置。')}</li>
        </ol>
        <Derivation>
          <table className="table">
            <caption>{tr('How many times each number appears', '每個數字出現的次數')}</caption>
            <thead>
              <tr><th scope="col">{tr('Number', '數字')}</th><th scope="col">{tr('Count', '次數')}</th><th scope="col">{tr('Status', '狀態')}</th></tr>
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
          <p className="muted">{tr('Only your birth-date digits are counted. No other numbers are added to this grid.', '只計算出生日期的數字，不會在這個九宮格中加入其他數字。')}</p>
        </Derivation>
      </Section>

      <Section title={tr('3. Numbers Present', '3. 出現的數字')}>
        <p>{tr('Numbers that appear at least once: ', '至少出現一次的數字：')}<strong>{a.audit.presentSet.join(', ') || tr('none', '無')}</strong>.</p>
        {present.length === 0 && <p>{tr('No documented rule applies.', '沒有適用的已記載規則。')}</p>}
        <ul className="plain">
          {present.map((t) => (
            <li key={t.rule.id}>
              <strong>{t.rule.requiredDigits[0]}</strong>: {text.basic(t.rule)}
              <RuleDerivation rule={t.rule} why={t.why} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={tr('4. Repeated Numbers', '4. 重複的數字')}>
        {repeated.length === 0 ? (
          <p>{tr('No number appears more than once.', '沒有任何數字出現超過一次。')}</p>
        ) : (
          <>
            <p>
              {tr('Numbers that appear more than once: ', '出現超過一次的數字：')}<strong>{a.audit.repeatedSet.map((d) => `${d} (×${a.audit.rawCounts[d]})`).join(', ')}</strong>
              {tr(
                '. More repeats do not simply mean more benefit; the tradition describes both strengths and possible excess. The tradition reads two, three and four-or-more repeats differently (strengthened, then excessive, then dominant), so each is explained separately below.',
                '。更多次的重複並不單純代表更多好處；傳統同時描述優點與可能的過度。傳統對兩個、三個及四個以上的重複有不同解讀（先強化、再過度、最後主導），因此下面分別說明。',
              )}
            </p>
            <ul className="plain">
              {repeated.map((t) => (
                <li key={t.rule.id}>
                  <strong>{t.rule.requiredCounts[0]?.digit}</strong>{tr(': ', '：')}{text.basic(t.rule)}
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title={tr('5. Missing Numbers', '5. 缺少的數字')}>
        {missing.length === 0 ? (
          <p>{tr('No number from 1 to 9 is missing.', '1 到 9 之中沒有任何數字缺少。')}</p>
        ) : (
          <>
            <p>
              {tr('Numbers that do not appear: ', '沒有出現的數字：')}<strong>{a.audit.missingSet.join(', ')}</strong>
              {tr(
                '. A missing number is a prompt for reflection in this tradition. It does not mean you lack a talent, quality or opportunity.',
                '。在此傳統中，缺少的數字是反思的提示，並不代表你欠缺才能、特質或機會。',
              )}
            </p>
            <ul className="plain">
              {missing.map((t) => (
                <li key={t.rule.id}>
                  <strong>{t.rule.requiredCounts[0]?.digit}</strong>{tr(': ', '：')}{text.basic(t.rule)}
                  <br />
                  <span className="muted">{tr('Idea to try: ', '可以試試：')}{text.reflection(t.rule)}</span>
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title={tr('6. Complete Lines', '6. 完整的線')}>
        <p>{tr('A line is complete when all three of its numbers appear in your date.', '當一條線的三個數字都出現在你的日期中，這條線就是完整的。')}</p>
        {complete.length === 0 ? (
          <p>{tr('No line is complete in your date.', '你的日期中沒有完整的線。')}</p>
        ) : (
          <ul className="plain">
            {complete.map((t) => {
              const line = a.lines.find((l) => l.def.id === t.rule.requiredLines[0]?.lineId)!;
              return (
                <li key={t.rule.id}>
                  <strong>{lineLabel(line.def)}</strong> · {lineName(line.def.id)}{tr(': ', '：')}{text.basic(t.rule)}
                  <EvidenceLabel rule={t.rule} />
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={tr('7. Missing Lines', '7. 缺少的線')}>
        <p>{tr('A line is missing when none of its three numbers appear in your date.', '當一條線的三個數字都沒有出現在你的日期中，這條線就是缺少的。')}</p>
        {empty.length === 0 ? (
          <p>{tr('No line is entirely missing.', '沒有完全缺少的線。')}</p>
        ) : (
          <ul className="plain">
            {empty.map((t) => {
              const line = a.lines.find((l) => l.def.id === t.rule.requiredLines[0]?.lineId)!;
              return (
                <li key={t.rule.id}>
                  <strong>{lineLabel(line.def)}</strong> · {lineName(line.def.id)}{tr(': ', '：')}{text.basic(t.rule)}
                  <EvidenceLabel rule={t.rule} />
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              );
            })}
          </ul>
        )}
        {partialTiers.length > 0 && (
          <>
            <h4>{tr('Partly present lines', '局部出現的線')}</h4>
            <p className="muted">{tr('Some guides grade a line by how many of its three numbers appear: two is moderate, one is weak. They do not read which numbers those are, so neither do we.', '有些指南依一條線三個數字中出現幾個來分級：兩個為中等，一個為較弱。它們不解讀是哪幾個數字，因此我們也不解讀。')}</p>
            <ul className="plain">
              {partialTiers.map((t) => (
                <li key={t.rule.id}>
                  <strong>{lineLabel(a.lines.find((l) => l.def.id === t.rule.requiredLines[0]?.lineId)!.def)}</strong> · {lineName(t.rule.requiredLines[0]!.lineId)}{tr(': ', '：')}{text.basic(t.rule)}
                  <EvidenceLabel rule={t.rule} />
                  <RuleDerivation rule={t.rule} why={t.why} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title={tr('8. Your Overall Interpretation', '8. 你的整體解讀')}>
        {summary.map((s) => (
          <p key={s}>{s}</p>
        ))}
        <h4>{tr('Your two key numbers', '你的兩個關鍵數字')}</h4>
        <ul className="plain">
          {keyNumbers.map((t) => (
            <li key={t.rule.id}>
              {text.basic(t.rule)}
              <EvidenceLabel rule={t.rule} />
              <RuleDerivation rule={t.rule} why={t.why} />
            </li>
          ))}
        </ul>
        <h4>{tr('How common is your pattern?', '你的模式有多常見？')}</h4>
        <p>
          {tr(
            `Out of all ${FREQUENCY_RANGE.dates.toLocaleString('en-GB')} calendar dates from ${FREQUENCY_RANGE.from.slice(0, 4)} to ${FREQUENCY_RANGE.to.slice(0, 4)}, the share that show the same pattern as yours:`,
            `在 ${FREQUENCY_RANGE.from.slice(0, 4)} 至 ${FREQUENCY_RANGE.to.slice(0, 4)} 年共 ${FREQUENCY_RANGE.dates.toLocaleString('en-GB')} 個日曆日期中，與你相同模式的比例：`,
          )}
        </p>
        <ul>
          {frequencies.map((f) => (
            <li key={f.key}>{isZh ? zhFrequencyLabel(f.key) : f.label}{tr(': ', '：')}<strong>{f.percent.toFixed(2)}%</strong>{tr(' of dates', ' 的日期')}</li>
          ))}
        </ul>
        <p className="muted small">{tr('A common pattern is not special and a rare one is not meaningful in itself. This is arithmetic about calendars, not about people.', '常見的模式並不特別，罕見的模式本身也沒有意義。這是關於日曆的算術，而不是關於人。')}</p>
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

      <Section title={tr('9. Practical Reflection Suggestions', '9. 實用的反思建議')}>
        {suggestions.length === 0 ? (
          <p>{tr('No suggestions apply: no documented pattern was triggered.', '沒有適用的建議：沒有觸發任何已記載的模式。')}</p>
        ) : (
          <>
            <p>{tr('Ordinary, optional ideas linked to the patterns above. They are not remedies and are not promised to change anything.', '與上述模式相關的普通、可選的想法。它們不是補救辦法，也不保證會改變任何事。')}</p>
            <ul>
              {suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title={tr('10. Understanding the Limitations', '10. 了解限制')}>
        <ul>
          <li><strong>{tr('The counting is arithmetic.', '計數是算術。')}</strong> {tr('It is checked automatically and is reproducible.', '它會自動檢查，並且可以重現。')}</li>
          <li><strong>{tr('The meanings are tradition.', '意義屬於傳統。')}</strong> {tr('We found no credible controlled evidence that a birth-date grid predicts personality or life events.', '我們沒有找到可靠的對照研究證據，顯示出生日期九宮格能預測性格或人生事件。')}</li>
          <li>{tr('Different numerology schools read the same grid differently, and some line names are disputed.', '不同的命理流派對同一個九宮格有不同的解讀，有些線的名稱也有爭議。')}</li>
          <li>{tr('The wording is based on summaries of several web sources, not on the full texts, and it has not been checked against them. See the source labels in the Advanced tab.', '文字依據多個網頁來源的摘要，而不是全文，並且尚未與原文核對。請參閱進階頁中的來源標示。')}</li>
          <li>{tr('A reading can feel accurate even when it is not (the Barnum or Forer effect). Feeling that it fits you is not evidence that it is valid.', '即使不準確，解讀也可能讓人覺得很準（巴納姆效應／佛瑞效應）。覺得適合你，並不代表它是有效的。')}</li>
          <li>{tr('Please do not use this for medical, financial, legal or relationship decisions.', '請不要用它來做醫療、財務、法律或感情上的決定。')}</li>
        </ul>
      </Section>
    </div>
  );
}
