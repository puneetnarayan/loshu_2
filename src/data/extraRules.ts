import { DIGITS, LINES, lineLabel } from '../loshu/constants';
import { ELEMENT_DIGITS, ELEMENTS } from '../loshu/extras';
import type { Digit } from '../loshu/types';
import type { Confidence, Element, Extra, InterpretationRule, SourceFidelity } from './schema';
import { COMMON_LIMITS, DIGIT_PLANETS, LINE_DATA, N, NO_VALIDATION, REVIEWED, SCHOOL, TRADITION, VERSION } from './rules';

type Draft = Partial<InterpretationRule> &
  Pick<
    InterpretationRule,
    | 'id' | 'title' | 'category' | 'subcategory' | 'sourceIds' | 'ruleDescription' | 'triggerConditions'
    | 'calculationExplanation' | 'basicText' | 'advancedText' | 'summaryPhrase' | 'confidenceReason'
  > & { confidence: Confidence; sourceFidelityStatus: SourceFidelity };

/** Fills the fields every extra rule shares so each record below states only what is specific to it. */
function mk(d: Draft, extra?: Extra): InterpretationRule {
  return {
    school: SCHOOL,
    tradition: TRADITION,
    lastReviewed: REVIEWED,
    version: VERSION,
    empiricalValidationStatus: NO_VALIDATION,
    evidenceClassification: 'traditional-unvalidated',
    sourceAgreement: 'school-specific',
    requiredDigits: [],
    requiredCounts: [],
    requiredLines: [],
    calculationMethod: 'Structured conditions evaluated against the calculated grid and derived numbers.',
    constructiveExpression: 'Not applicable to this reading.',
    potentialChallenge: 'Not applicable to this reading.',
    reflectionSuggestion: 'Use this only as a prompt for reflection.',
    knownDisagreements: [],
    exclusions: [],
    limitations: COMMON_LIMITS,
    priority: 3,
    themes: [],
    direction: 'emphasis',
    activation: extra ?? 'default',
    ...d,
  } as InterpretationRule;
}

const reflect = (d: Digit) => N[d].reflection;

// ---------- 1. Strength tiers for partially populated lines ----------
const partial: InterpretationRule[] = LINES.flatMap((line) => {
  const d = LINE_DATA[line.id]!;
  const lbl = lineLabel(line);
  return ([2, 1] as const).map((n) =>
    mk({
      id: `LINE-${line.id}-PARTIAL-${n}`,
      title: `${lbl} is partly present (${n} of 3) — ${d.name.split(' (')[0]}`,
      category: 'partial-line',
      subcategory: n === 2 ? 'moderate' : 'weak',
      sourceIds: ['SRC-DEEVINESOUL-PLANES', 'SRC-BOX2JOY-PLANES', 'SRC-LOSHUCALC-MINDPLANE'],
      sourceFidelityStatus: 'unverified-search-summary',
      confidence: 'low',
      confidenceReason:
        'A search summary described plane strength tiers (strong = 3 digits, moderate = 2, weak = 1, absent = 0). The tier names are reported, but the meaning of each tier is the same generic wording for every line, written by this project.',
      ruleDescription: `${n} of the 3 digits of ${lbl} are present. Some guides grade this as ${n === 2 ? '"moderate" (partial)' : '"weak"'}.`,
      triggerConditions: `Exactly ${n} of the digits ${line.digits.join(', ')} are present`,
      requiredLines: [{ lineId: line.id, state: 'partial', presentCount: n }],
      calculationExplanation: `Count how many of ${line.digits.join(', ')} have a count of at least 1. Exactly ${n} do, so the line is partial.`,
      basicText:
        n === 2
          ? `Two of the three numbers in ${lbl} appear. Some guides call this a moderate or partial line: the qualities linked with ${d.meaning} are described as present but uneven.`
          : `Only one of the three numbers in ${lbl} appears. Some guides call this a weak line: the qualities linked with ${d.meaning} are described as only lightly emphasised.`,
      advancedText: `Line ${lbl} (${line.kind}), ${n} of 3 present: graded "${n === 2 ? 'moderate' : 'weak'}". Generic tier reading for the "${d.name.split(' (')[0]}" naming: ${d.meaning}, ${n === 2 ? 'present but uneven' : 'lightly emphasised'}.`,
      constructiveExpression: d.expression,
      potentialChallenge: d.challenge,
      reflectionSuggestion: d.reflection,
      knownDisagreements: ['Sources grade tiers differently and some do not grade partial lines at all.'],
      exclusions: ['Which specific digits are present is not interpreted; only how many.'],
      priority: 2,
      summaryPhrase: `${lbl} is ${n === 2 ? 'moderately' : 'weakly'} formed`,
    }),
  );
});

// ---------- 2. Driver and Destiny readings ----------
const DRIVER: Record<Digit, string> = {
  1: 'a natural leader, confident and independent, sometimes egoistic',
  2: 'emotional, sensitive and intuitive, and easily influenced',
  3: 'creative and expressive, and sometimes inconsistent',
  4: 'practical, disciplined and hardworking, and sometimes rigid',
  5: 'quick-thinking and energetic, and fond of change and freedom',
  6: 'caring and relationship-focused, and fond of comfort and beauty',
  7: 'thoughtful, spiritual and introverted, a seeker of truth',
  8: 'hardworking and serious; some guides say success comes late',
  9: 'passionate and forceful, with a "warrior" energy',
};
const DESTINY: Record<Digit, string> = {
  1: 'independent, ambitious and authoritative; described as meant to lead and innovate',
  2: 'sensitive, imaginative and cooperative; a peacemaker oriented towards partnership',
  3: 'creative and joyful, a communicator; described as meant to inspire',
  4: 'a builder and organiser, hardworking, creating structure',
  5: 'adaptable and versatile, thriving on change',
  6: 'responsible, caring and drawn to harmony in relationships',
  7: 'analytical and inward-looking, with a spiritual interest',
  8: 'powerful and determined, with business sense (Saturn-linked)',
  9: 'courageous, selfless and energetic; described as meant to serve others',
};
const derived: InterpretationRule[] = DIGITS.flatMap((d) => [
  mk({
    id: `DRIVER-${d}`,
    title: `Driver (Moolank) ${d}`,
    category: 'driver',
    subcategory: 'driver',
    sourceIds: ['SRC-MULANK-GUIDES', 'SRC-SWARNSIDDHI-DC', 'SRC-ANKSHASTRA'],
    sourceFidelityStatus: 'unverified-search-summary',
    confidence: 'low',
    confidenceReason: 'One-line meanings come from a single search summary of several Mulank guides; wording is paraphrased and the guides were not read.',
    ruleDescription: `Driver number ${d}, described as ${DRIVER[d]}.`,
    triggerConditions: `Driver (reduced day of birth) = ${d}`,
    requiredDerived: [{ kind: 'driver', value: d }],
    calculationExplanation: 'Add the digits of the day of birth and reduce to a single digit 1–9.',
    basicText: `Your Driver number is ${d}. In this tradition it is the number linked with everyday personality, described as ${DRIVER[d]}. Treat it as an idea to reflect on, not a description of you.`,
    advancedText: `Driver ${d}: ${DRIVER[d]}. Planet (Indian scheme): ${DIGIT_PLANETS[d]}.`,
    constructiveExpression: N[d].expression,
    potentialChallenge: N[d].challenge,
    reflectionSuggestion: reflect(d),
    knownDisagreements: ['Guides differ in detail; some add predictive claims (lucky numbers, success timing) that are not used here.'],
    summaryPhrase: `Driver ${d} (${DRIVER[d]})`,
  }),
  mk({
    id: `DESTINY-${d}`,
    title: `Destiny (Bhagyank) ${d}`,
    category: 'destiny',
    subcategory: 'destiny',
    sourceIds: ['SRC-CONDUCTOR-GUIDES', 'SRC-BHAGYANK-PROKERALA', 'SRC-SWARNSIDDHI-DC'],
    sourceFidelityStatus: d === 6 || d === 7 ? 'insufficient-documentation' : 'unverified-search-summary',
    confidence: 'low',
    confidenceReason:
      d === 6 || d === 7
        ? `No Destiny wording for ${d} was visible in the search summaries, so this extends the Lo Shu keywords for ${d} and is the weakest wording here.`
        : 'Meanings come from a single search summary of several Bhagyank guides; wording is paraphrased and the guides were not read.',
    ruleDescription: `Destiny number ${d}, described as ${DESTINY[d]}.`,
    triggerConditions: `Destiny (reduced full date) = ${d}`,
    requiredDerived: [{ kind: 'destiny', value: d }],
    calculationExplanation: 'Add every digit of DD-MM-YYYY and reduce to a single digit 1–9.',
    basicText: `Your Destiny number is ${d}. In this tradition it is linked with the general direction of life, described as ${DESTINY[d]}. Treat it as an idea to reflect on, not a prediction.`,
    advancedText: `Destiny ${d}: ${DESTINY[d]}. Planet (Indian scheme): ${DIGIT_PLANETS[d]}.`,
    constructiveExpression: N[d].expression,
    potentialChallenge: N[d].challenge,
    reflectionSuggestion: reflect(d),
    knownDisagreements: ['One summary says the Conductor shows life direction "after the age of 35"; that predictive claim is not used.'],
    exclusions: ['No timing, career or relationship prediction is made.'],
    summaryPhrase: `Destiny ${d} (${DESTINY[d]})`,
  }),
]);

// ---------- 3. Planet profile ----------
const PLANET_THEME: Record<string, string> = {
  Sun: 'vitality, authority and self-confidence',
  Moon: 'emotion, intuition and care',
  Jupiter: 'learning, wisdom and optimism',
  Rahu: 'ambition, discipline and unconventional thinking',
  Mercury: 'communication, intellect and business sense',
  Venus: 'relationships, comfort and the arts',
  Ketu: 'detachment, introspection and spiritual interest',
  Saturn: 'discipline, patience and hard work',
  Mars: 'energy, courage and competitiveness',
};
const PLANET_SOURCES = ['SRC-OCCULTSCIENCE-PLANETS', 'SRC-ASTROSIGHT-PLANETS', 'SRC-WEBINDIA-RULING'];
const planetProfile: InterpretationRule[] = DIGITS.flatMap((d) => {
  const pl = DIGIT_PLANETS[d];
  const theme = PLANET_THEME[pl]!;
  const common = {
    category: 'planet-profile' as const,
    sourceIds: PLANET_SOURCES,
    sourceFidelityStatus: 'insufficient-documentation' as SourceFidelity,
    confidence: 'low' as Confidence,
    confidenceReason:
      'The digit-to-planet mapping was confirmed by several search summaries, but the planet themes used here are short general keywords, partly from background knowledge and not verified against a primary text.',
    knownDisagreements: ['Planetary tables differ between schools; one summary lists 4 as "Uranus (Rahu)".'],
    exclusions: ['No astronomical or astrological calculation is performed.'],
  };
  return [
    mk({
      ...common,
      id: `PLANETEMPH-${d}`,
      title: `${pl} is emphasised (digit ${d} repeated)`,
      subcategory: 'emphasised',
      ruleDescription: `Digit ${d} (${pl}) occurs two or more times, so the ${pl} themes (${theme}) are read as emphasised.`,
      triggerConditions: `Count of ${d} ≥ 2 and planetary option enabled`,
      requiredCounts: [{ digit: d, min: 2 }],
      calculationExplanation: `Count the digit ${d}; the Indian scheme maps ${d} to ${pl}.`,
      constructiveExpression: N[d].expression,
      potentialChallenge: N[d].challenge,
      reflectionSuggestion: N[d].reflection,
      basicText: `${pl} themes (${theme}) are emphasised.`,
      advancedText: `${pl} (digit ${d}) is emphasised: read as stronger ${theme}.`,
      summaryPhrase: `${pl} emphasised`,
    }, 'planetary'),
    mk({
      ...common,
      id: `PLANETABS-${d}`,
      title: `${pl} is not represented (digit ${d} missing)`,
      subcategory: 'absent',
      ruleDescription: `Digit ${d} (${pl}) does not occur, so the ${pl} themes (${theme}) are read as less emphasised.`,
      triggerConditions: `Count of ${d} = 0 and planetary option enabled`,
      requiredCounts: [{ digit: d, max: 0 }],
      calculationExplanation: `Count the digit ${d}; the Indian scheme maps ${d} to ${pl}. A count of 0 means the planet is not represented.`,
      constructiveExpression: N[d].expression,
      potentialChallenge: N[d].challenge,
      reflectionSuggestion: N[d].missingReflection,
      basicText: `${pl} themes (${theme}) are less emphasised.`,
      advancedText: `${pl} (digit ${d}) is not represented: read as less emphasis on ${theme}. A reflection prompt only.`,
      direction: 'reflection',
      summaryPhrase: `${pl} not represented`,
    }, 'planetary'),
  ];
});

// ---------- 4. Five elements ----------
const ELEMENT_THEME: Record<Element, string> = {
  water: 'flow, adaptability and depth',
  wood: 'growth and flexibility',
  fire: 'passion and visibility',
  earth: 'stability and steadiness',
  metal: 'precision and structure',
};
const elements: InterpretationRule[] = ELEMENTS.flatMap((el) => {
  const digitsOf = ELEMENT_DIGITS[el].join(', ');
  const common = {
    category: 'element' as const,
    sourceIds: ['SRC-ELEMENTS-FLYINGSTAR', 'SRC-ELEMENTS-NINESTARKI'],
    sourceFidelityStatus: 'insufficient-documentation' as SourceFidelity,
    confidence: 'low' as Confidence,
    confidenceReason:
      'The digit-to-element mapping (1 water; 2, 5, 8 earth; 3, 4 wood; 6, 7 metal; 9 fire) was confirmed by several search summaries. The element themes are general Five Elements keywords from background knowledge and were not verified; the mapping comes from Feng Shui / Nine Star Ki, not from Indian numerology.',
    tradition: 'Chinese Five Elements as applied to Luo Shu numbers (Feng Shui / Nine Star Ki)',
    school: 'Chinese Five Elements',
    knownDisagreements: ['Schools differ on how element balance is read; no source was read in full.'],
    exclusions: ['Not combined with the Indian planetary scheme; the two are different systems.'],
  };
  return [
    mk({
      ...common,
      id: `ELEM-${el}-ABSENT`,
      title: `${el} is not represented (digits ${digitsOf})`,
      subcategory: 'absent',
      ruleDescription: `None of the ${el}-element digits (${digitsOf}) is present; read as less emphasis on ${ELEMENT_THEME[el]}.`,
      triggerConditions: `All of ${digitsOf} missing and elements option enabled`,
      requiredElements: [{ element: el, state: 'absent' }],
      calculationExplanation: `The ${el} digits are ${digitsOf}. None has a count of 1 or more.`,
      constructiveExpression: `Noticing where ${ELEMENT_THEME[el]} show up in your habits.`,
      potentialChallenge: 'Reading an element count as a fixed trait.',
      reflectionSuggestion: `Notice where ${ELEMENT_THEME[el]} already appear in your routines.`,
      basicText: `The ${el} element is not represented.`,
      advancedText: `${el} absent: less emphasis on ${ELEMENT_THEME[el]}. A reflection prompt only.`,
      direction: 'reflection',
      summaryPhrase: `${el} element not represented`,
    }, 'elements'),
    mk({
      ...common,
      id: `ELEM-${el}-DOMINANT`,
      title: `${el} is the most represented element (digits ${digitsOf})`,
      subcategory: 'dominant',
      ruleDescription: `The ${el}-element digits (${digitsOf}) have the highest total count; read as emphasis on ${ELEMENT_THEME[el]}. Ties list every tied element.`,
      triggerConditions: `Highest element total is ${el} (ties included) and elements option enabled`,
      requiredElements: [{ element: el, state: 'dominant' }],
      calculationExplanation: `Sum the counts of ${digitsOf} for ${el} and compare with the other elements. "Most represented" ignores the number of digits per element, which differs (earth has three digits).`,
      constructiveExpression: `Drawing on ${ELEMENT_THEME[el]}.`,
      potentialChallenge: 'Over-relying on one theme.',
      reflectionSuggestion: `Notice whether ${ELEMENT_THEME[el]} crowd out other approaches.`,
      basicText: `The ${el} element is the most represented.`,
      advancedText: `${el} most represented: emphasis on ${ELEMENT_THEME[el]}. Caveat: earth owns three digits, so raw totals favour it.`,
      summaryPhrase: `${el} element most represented`,
    }, 'elements'),
  ];
});

// ---------- 5. Traditional remedies (low confidence, no promises) ----------
interface Remedy {
  practical: string;
  traditional: string;
  sources: string[];
  practicalFromSources: boolean;
}
const REM_MISSING: Record<Digit, Remedy> = {
  1: { practical: 'wake at a regular time, set one small daily goal, practise a short confidence affirmation', traditional: 'orange or gold colours; offering water to the Sun at sunrise; a water feature (Feng Shui)', sources: ['SRC-REM-VEDICMEET', 'SRC-REM-ASTROPRASUN', 'SRC-REM-NUMBERSANDDESTINY'], practicalFromSources: true },
  2: { practical: 'spend time near water; keep a short emotional journal', traditional: 'white or pearl shades; a Moon mantra; donating rice or sugar', sources: ['SRC-REM-VEDICMEET', 'SRC-REM-NUMBERSANDDESTINY', 'SRC-REM-ASTROPRASUN'], practicalFromSources: true },
  3: { practical: 'write daily; learn a new skill; help others with guidance', traditional: 'green plants or wooden objects; yellow accents; the mantra "Om Guruve Namaha"', sources: ['SRC-REM-VEDICMEET', 'SRC-REM-NUMBERSANDDESTINY', 'SRC-REM-ASTROPRASUN'], practicalFromSources: true },
  4: { practical: 'keep a fixed wake-up time; use a planner with your top three tasks; keep your workspace tidy; exercise regularly', traditional: 'no traditional object or ritual was found for 4', sources: ['SRC-REM-TECHITE', 'SRC-REM-JCCHAUDHRY'], practicalFromSources: true },
  5: { practical: 'read daily; write daily; practise speaking in public informally', traditional: 'green clothing; the Mercury mantra "Om Budhaya Namah" on Wednesdays', sources: ['SRC-REM-ASTROSIGHT-5', 'SRC-REM-VEDICMEET'], practicalFromSources: true },
  6: { practical: 'take responsibility for a shared task; invest in family and close relationships; make your space more beautiful', traditional: 'gold-coloured items; a golden wind chime in the north-west (Feng Shui)', sources: ['SRC-REM-TECHITE', 'SRC-REM-JCCHAUDHRY'], practicalFromSources: true },
  7: { practical: 'set aside regular quiet time or meditation (this habit is from the keywords for 7, not from a remedy source)', traditional: 'a silver-coloured watch or bracelet; white or light colours; a silver wind chime in the west (Feng Shui)', sources: ['SRC-REM-TECHITE', 'SRC-REM-JCCHAUDHRY'], practicalFromSources: false },
  8: { practical: 'practise patience; take responsibility; keep your space orderly', traditional: 'donating food; black sesame on Saturdays; devotion to Saturn or Shiva', sources: ['SRC-REM-VEDICMEET', 'SRC-REM-NUMBERSANDDESTINY', 'SRC-REM-ASTROPRASUN'], practicalFromSources: true },
  9: { practical: 'do one small act of service; talk about your values with someone (this habit is from the keywords for 9, not from a remedy source)', traditional: 'the colour red; fire imagery; devotion to Hanuman with temple visits on Tuesdays and Saturdays; a red thread', sources: ['SRC-REM-TECHITE', 'SRC-REM-JCCHAUDHRY'], practicalFromSources: false },
};
const REM_REPEATED: Partial<Record<Digit, Remedy>> = {
  1: { practical: 'notice when you take over and ask for other views first', traditional: 'dropping a copper coin into flowing water; avoiding ruby, gold and red items', sources: ['SRC-REM-NUMERICWISDOM-1'], practicalFromSources: false },
  4: { practical: 'make room for other people’s points of view', traditional: 'donating dark clothes, wheat and oil; avoiding black or blue clothing', sources: ['SRC-REM-NUMERICWISDOM-4'], practicalFromSources: false },
  5: { practical: 'avoid impulsive commitments and assess situations before agreeing', traditional: 'feeding cows green fodder; avoiding green clothing; donating green gram, ghee or brass utensils on Wednesdays', sources: ['SRC-REM-NUMERICWISDOM-5'], practicalFromSources: true },
};
const remedyRule = (d: Digit, kind: 'MISSING' | 'REPEATED', r: Remedy): InterpretationRule =>
  mk({
    id: `REM-${d}-${kind}`,
    title: `Remedies reported for ${kind === 'MISSING' ? 'missing' : 'repeated'} ${d}`,
    category: 'remedy',
    subcategory: kind === 'MISSING' ? 'missing' : 'repeated',
    sourceIds: r.sources,
    sourceFidelityStatus: 'unverified-search-summary',
    confidence: 'low',
    confidenceReason:
      'Remedies were collected from search summaries of commercial guides and were not read in full. There is no evidence that any traditional remedy changes anything; practical habits are ordinary self-improvement suggestions.',
    ruleDescription: `Remedies some guides suggest when ${d} is ${kind === 'MISSING' ? 'missing' : 'repeated'}: practical habits and traditional practices.`,
    triggerConditions: kind === 'MISSING' ? `Count of ${d} = 0 and remedies option enabled` : `Count of ${d} ≥ 2 and remedies option enabled`,
    requiredCounts: [kind === 'MISSING' ? { digit: d, max: 0 } : { digit: d, min: 2 }],
    calculationExplanation: `Digit ${d} has a count that is ${kind === 'MISSING' ? '0' : '2 or more'}, which is the condition the guides attach these suggestions to.`,
    basicText: `Practical ideas: ${r.practical}.`,
    advancedText: `Practical habits${r.practicalFromSources ? '' : ' (project suggestions)'}: ${r.practical}. Traditional practices reported by some guides (optional; unvalidated; some involve spending or religious practice you may not want): ${r.traditional}. No outcome is promised.`,
    constructiveExpression: N[d].expression,
    potentialChallenge: N[d].challenge,
    reflectionSuggestion: r.practical,
    knownDisagreements: ['Guides disagree on which remedies apply and many are specific to one religious or Feng Shui tradition.'],
    exclusions: ['Gemstone recommendations are deliberately omitted (cost, and no evidence).', 'No remedy is presented as treating any medical, financial or relationship problem.'],
    summaryPhrase: `reported remedies for ${kind === 'MISSING' ? 'missing' : 'repeated'} ${d}`,
  }, 'remedies');
const remedies: InterpretationRule[] = [
  ...DIGITS.map((d) => remedyRule(d, 'MISSING', REM_MISSING[d])),
  ...(Object.entries(REM_REPEATED) as Array<[string, Remedy]>).map(([d, r]) => remedyRule(Number(d) as Digit, 'REPEATED', r)),
];

// ---------- 6. Personal-year cycle (forecast style: very low confidence) ----------
const YEAR: Record<Digit, string> = {
  1: 'new beginnings and trusting your own instincts',
  2: 'cooperation, listening and letting things develop at their own pace',
  3: 'creativity, socialising and enjoyment',
  4: 'hard work and building foundations',
  5: 'change, freedom and adapting',
  6: 'relationships and responsibilities',
  7: 'rest, reflection, spirituality and intuition',
  8: 'recognition, achievement and results',
  9: 'letting go and completing a cycle before beginning anew',
};
const cycle: InterpretationRule[] = DIGITS.map((d) =>
  mk({
    id: `CYCLE-PY-${d}`,
    title: `Personal Year ${d}`,
    category: 'cycle',
    subcategory: 'personal-year',
    school: 'Pythagorean-style personal-year cycles',
    tradition: 'Western (Pythagorean-style) numerology',
    sourceIds: ['SRC-CYCLE-ASTRALA', 'SRC-CYCLE-ALMANAC', 'SRC-CYCLE-GAIA', 'SRC-CYCLE-SPIRALSEA'],
    sourceFidelityStatus: 'unverified-search-summary',
    confidence: 'very-low',
    confidenceReason:
      'Forecast-style reading. The formula (birth day + birth month + year, reduced) agrees across summaries, but the meanings are generic and unvalidated, they are not part of Lo Shu tradition, and no source text was read.',
    ruleDescription: `Personal Year ${d}, read as a year of ${YEAR[d]} in a nine-year cycle.`,
    triggerConditions: `Personal Year number = ${d} and cycle option enabled`,
    requiredDerived: [{ kind: 'personal-year', value: d }],
    calculationExplanation: 'Add the digits of the birth day, the birth month and the chosen year, then reduce to a single digit.',
    basicText: `This year is described as a Personal Year ${d}: ${YEAR[d]}.`,
    advancedText: `Personal Year ${d}: ${YEAR[d]}. A nine-year cycle idea; not a prediction.`,
    constructiveExpression: `Planning the year around the theme: ${YEAR[d]}.`,
    potentialChallenge: 'Treating a generic yearly theme as a prediction.',
    reflectionSuggestion: 'Use it, if at all, as a prompt for planning your year, not as a forecast.',
    knownDisagreements: ['Whether the year ends at the birthday or on 1 January differs between guides; this project uses the calendar year.'],
    exclusions: ['No month-level cycle is calculated because its formula was not verified.', 'The "Lo Shu grid for the year" idea was not implemented because its method could not be established.'],
    summaryPhrase: `Personal Year ${d}`,
  }, 'cycle'),
);

// ---------- 7. Name numbers (Pythagorean; very low confidence) ----------
const NAME_ROLE = {
  expression: { id: 'EXPRESSION', label: 'Expression number (all letters)', text: 'linked in Pythagorean-style guides with natural abilities and how a person expresses themselves' },
  'soul-urge': { id: 'SOUL', label: 'Soul Urge number (vowels A, E, I, O, U)', text: 'linked with inner motivations' },
  personality: { id: 'PERSONALITY', label: 'Personality number (consonants)', text: 'linked with the outer impression a person gives' },
} as const;
const names: InterpretationRule[] = (Object.keys(NAME_ROLE) as Array<keyof typeof NAME_ROLE>).flatMap((k) =>
  DIGITS.map((d) =>
    mk({
      id: `NAME-${NAME_ROLE[k].id}-${d}`,
      title: `${NAME_ROLE[k].label} ${d}`,
      category: 'name',
      subcategory: k,
      school: 'Pythagorean name numerology',
      tradition: 'Western (Pythagorean) numerology',
      sourceIds: ['SRC-NAME-NUMEROLOGYCALC', 'SRC-NAME-NUMROLAB', 'SRC-NAME-SOULURGE'],
      sourceFidelityStatus: 'insufficient-documentation',
      confidence: 'very-low',
      confidenceReason:
        'The letter table and the three-number method agree across summaries, but no source text was read, the reading below is only the Lo Shu keywords for the digit (a simplification), and schools differ on Y, master numbers and which name to use.',
      ruleDescription: `${NAME_ROLE[k].label} ${d}: ${NAME_ROLE[k].text}; read here with the traditional keywords for ${d}.`,
      triggerConditions: `${NAME_ROLE[k].label} = ${d} and name option enabled`,
      requiredDerived: [{ kind: k, value: d }],
      calculationExplanation: 'Convert letters to digits with the Pythagorean table (A J S = 1 … I R = 9), add, and reduce to a single digit.',
      constructiveExpression: N[d].expression,
      potentialChallenge: N[d].challenge,
      reflectionSuggestion: N[d].reflection,
      basicText: `${NAME_ROLE[k].label} is ${d} (${N[d].keywords}).`,
      advancedText: `${NAME_ROLE[k].label} ${d}: ${NAME_ROLE[k].text}. Keywords borrowed from the Lo Shu digit ${d}: ${N[d].keywords}. Name-numerology guides may read ${d} differently.`,
      knownDisagreements: ['Y is treated as a consonant here; some guides treat it as a vowel in some names.', 'Some schools keep master numbers (11, 22, 33); the calculation shows the intermediate total so they remain visible.', 'The Chaldean system uses a different letter table and is not implemented.'],
      exclusions: ['The name is not placed in the Lo Shu grid and does not change any grid calculation.'],
      summaryPhrase: `${NAME_ROLE[k].label} ${d}`,
    }, 'name'),
  ),
);

export const EXTRA_RULES: readonly InterpretationRule[] = [...partial, ...derived, ...planetProfile, ...elements, ...remedies, ...cycle, ...names];
