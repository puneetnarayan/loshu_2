import { LINES, lineLabel, POSITIONS } from '../loshu/constants';
import type { Digit } from '../loshu/types';
import type { InterpretationRule, SourceFidelity } from './schema';

const REVIEWED = '2026-10-04';
const VERSION = '1.0.0';
const SCHOOL = 'Indian-style Lo Shu numerology (DOB digits, 3×3 grid)';
const TRADITION = 'Popular Indian/Chinese-derived Lo Shu numerology as presented by online calculators';
const NO_VALIDATION =
  'No credible controlled study identified in this project supports personality or life-event predictions from Lo Shu patterns. The closest empirical test found (Genovese, 2017, per a search summary; not opened) reported that birth numbers of Nobel Prize winners 1901–2010 did not differ from chance (p = 0.77). It tests birth numbers against one outcome, not Lo Shu grid claims. Readings can also feel accurate for reasons unrelated to validity (the Barnum/Forer effect).';
const NUMEROLOGY_SOURCES = ['SRC-MEDIUM-1-TO-9', 'SRC-AFFIRMATIONFLOW-WHAT', 'SRC-PARAMARSH'];
const PLANE_SOURCES = ['SRC-JCCHAUDHRY-PLANES', 'SRC-HOROSCOPERS-PLANES', 'SRC-OCCULTSCIENCE-PLANES', 'SRC-NUMEROLOGYBYNEHAA-PLANES'];
const EMPTY_SOURCES = ['SRC-ASTROMEDHA-GRID', 'SRC-STARNUM-ARROWS'];
const COMMON_LIMITS = [
  'Traditional symbolism, not a measured trait.',
  'Wording was written for this project from search-summary-level evidence; it is not a quotation of any source.',
];

interface NumberData {
  keywords: string;
  themes: [string, string];
  planet: string;
  presentBasic: string;
  presentAdv: string;
  missingBasic: string;
  missingAdv: string;
  repeatBasic: string;
  repeatAdv: string;
  expression: string;
  challenge: string;
  reflection: string;
  missingReflection: string;
  phrase: string;
  missingPhrase: string;
  repeatPhrase: string;
}

const N: Record<Digit, NumberData> = {
  1: {
    keywords: 'independence, leadership and self-expression',
    themes: ['independence', 'initiative'],
    planet: 'Sun',
    presentBasic: 'Traditionally linked with independence, taking the lead and a sense of self.',
    presentAdv: 'Digit 1 (grid position bottom centre) is conventionally associated with independence, initiative and self-assertion.',
    missingBasic: 'Traditionally, a missing 1 is read as an area for reflection around self-direction and speaking up for yourself.',
    missingAdv: 'Absence of 1 is conventionally read as less emphasis on self-assertion and initiative. Treated here as a prompt for reflection, not a deficit.',
    repeatBasic: 'More than one 1 is traditionally read as a strong emphasis on independence. Some teachers also say it can show up as stubbornness, so more is not simply better.',
    repeatAdv: 'Repetition of 1 is conventionally read as intensified independence and drive, with the usual caveat of rigidity or dominance when excessive. Count-specific (2 vs 3+) readings are not implemented because they are not verified.',
    expression: 'Taking initiative, making decisions, standing up for your views.',
    challenge: 'Over-assertiveness or reluctance to take advice.',
    reflection: 'Practise making one small decision on your own each day, and notice when you hold back what you need.',
    missingReflection: 'Practise stating your preference in small everyday choices.',
    phrase: 'an emphasis on independence and initiative (1)',
    missingPhrase: 'self-direction and initiative (missing 1)',
    repeatPhrase: 'a strong emphasis on independence (repeated 1)',
  },
  2: {
    keywords: 'sensitivity, cooperation and intuition',
    themes: ['sensitivity', 'cooperation'],
    planet: 'Moon',
    presentBasic: 'Traditionally linked with sensitivity, cooperation and being tuned in to others.',
    presentAdv: 'Digit 2 (top right) is conventionally associated with sensitivity, cooperation, receptivity and intuition.',
    missingBasic: 'Traditionally, a missing 2 is read as an area for reflection around cooperation and noticing how others feel.',
    missingAdv: 'Absence of 2 is conventionally read as less emphasis on tact and cooperation. A reflection prompt only.',
    repeatBasic: 'More than one 2 is traditionally read as heightened sensitivity. Tradition notes this can bring both empathy and over-sensitivity.',
    repeatAdv: 'Repetition of 2 is conventionally read as heightened sensitivity and need for harmony, with possible indecision or over-sensitivity.',
    expression: 'Listening, mediating, building partnerships.',
    challenge: 'Over-sensitivity or indecision.',
    reflection: 'Check in with a friend or colleague about how they see a situation before deciding.',
    missingReflection: 'Practise active listening in one conversation a day.',
    phrase: 'sensitivity and cooperation (2)',
    missingPhrase: 'cooperation and sensitivity (missing 2)',
    repeatPhrase: 'heightened sensitivity (repeated 2)',
  },
  3: {
    keywords: 'creativity, expression and communication',
    themes: ['creativity', 'communication'],
    planet: 'Jupiter',
    presentBasic: 'Traditionally linked with creativity, self-expression and communication.',
    presentAdv: 'Digit 3 (middle left) is conventionally associated with creativity, expression, communication and optimism.',
    missingBasic: 'Traditionally, a missing 3 is read as an area for reflection around expressing ideas and creativity.',
    missingAdv: 'Absence of 3 is conventionally read as less emphasis on expressive and creative outlets. A reflection prompt only.',
    repeatBasic: 'More than one 3 is traditionally read as a strong creative or talkative streak. Tradition notes it can also scatter focus.',
    repeatAdv: 'Repetition of 3 is conventionally read as an intensified expressive and creative drive, with possible scattered focus or over-talkativeness.',
    expression: 'Writing, speaking, making things, sharing ideas.',
    challenge: 'Scattered focus or over-talking.',
    reflection: 'Set aside a regular short slot for a creative or writing practice.',
    missingReflection: 'Try a low-pressure creative habit, such as keeping a short journal.',
    phrase: 'creativity and communication (3)',
    missingPhrase: 'creative expression and communication (missing 3)',
    repeatPhrase: 'a strong expressive streak (repeated 3)',
  },
  4: {
    keywords: 'practicality, discipline and organisation',
    themes: ['organisation', 'discipline'],
    planet: 'Rahu',
    presentBasic: 'Traditionally linked with practicality, discipline and a methodical approach.',
    presentAdv: 'Digit 4 (top left) is conventionally associated with practicality, structure, discipline and diligence.',
    missingBasic: 'Traditionally, a missing 4 is read as an area for reflection around routines, organisation and follow-through.',
    missingAdv: 'Absence of 4 is conventionally read as less emphasis on structure and routine. A reflection prompt only.',
    repeatBasic: 'More than one 4 is traditionally read as a strong emphasis on structure and hard work. Tradition notes it can tip into rigidity.',
    repeatAdv: 'Repetition of 4 is conventionally read as an intensified need for order and diligence, with possible rigidity or over-work.',
    expression: 'Planning, building systems, steady effort.',
    challenge: 'Rigidity or over-work.',
    reflection: 'Build one small routine, such as a weekly planning review, and allow some flexibility.',
    missingReflection: 'Try a simple checklist or weekly plan to support follow-through.',
    phrase: 'practicality and discipline (4)',
    missingPhrase: 'routine and organisation (missing 4)',
    repeatPhrase: 'a strong emphasis on structure (repeated 4)',
  },
  5: {
    keywords: 'balance, adaptability and curiosity',
    themes: ['balance', 'adaptability'],
    planet: 'Mercury',
    presentBasic: 'Traditionally linked with balance, adaptability and curiosity. It sits in the centre of the grid.',
    presentAdv: 'Digit 5 (centre) is conventionally associated with balance, adaptability and curiosity. Its central position is the usual reason given for treating it as a balancing number.',
    missingBasic: 'Traditionally, a missing 5 is read as an area for reflection around balance and adapting to change.',
    missingAdv: 'Absence of 5 is conventionally discussed as less emphasis on balance and adaptability; the central cell is why many sources single it out. A reflection prompt only.',
    repeatBasic: 'More than one 5 is traditionally read as a strong need for variety and change. Tradition notes it can bring restlessness.',
    repeatAdv: 'Repetition of 5 is conventionally read as intensified adaptability and appetite for change, with possible restlessness.',
    expression: 'Adapting to change, learning quickly, keeping perspective.',
    challenge: 'Restlessness or difficulty settling.',
    reflection: 'Pick one routine that gives you stability while you stay open to change elsewhere.',
    missingReflection: 'Notice how you respond to change, and try a short daily pause to take stock.',
    phrase: 'balance and adaptability (5)',
    missingPhrase: 'balance and adaptability (missing 5)',
    repeatPhrase: 'a strong need for variety (repeated 5)',
  },
  6: {
    keywords: 'responsibility, care and harmony',
    themes: ['responsibility', 'harmony'],
    planet: 'Venus',
    presentBasic: 'Traditionally linked with responsibility, caring for others and a wish for harmony.',
    presentAdv: 'Digit 6 (bottom right) is conventionally associated with responsibility, care, home and harmony.',
    missingBasic: 'Traditionally, a missing 6 is read as an area for reflection around responsibility and close relationships.',
    missingAdv: 'Absence of 6 is conventionally read as less emphasis on nurturing and domestic responsibility. A reflection prompt only.',
    repeatBasic: 'More than one 6 is traditionally read as a strong sense of responsibility. Tradition notes it can become over-responsibility or perfectionism.',
    repeatAdv: 'Repetition of 6 is conventionally read as intensified care and responsibility, with possible over-giving or perfectionism.',
    expression: 'Caring for others, creating a harmonious home or team.',
    challenge: 'Over-responsibility or perfectionism.',
    reflection: 'Notice where you take on too much and practise saying no or sharing the load.',
    missingReflection: 'Choose one relationship to invest regular, small acts of care in.',
    phrase: 'responsibility and care (6)',
    missingPhrase: 'responsibility and close relationships (missing 6)',
    repeatPhrase: 'a strong sense of responsibility (repeated 6)',
  },
  7: {
    keywords: 'analysis, reflection and spirituality',
    themes: ['reflection', 'analysis'],
    planet: 'Ketu',
    presentBasic: 'Traditionally linked with reflection, analysis and inner questions.',
    presentAdv: 'Digit 7 (middle right) is conventionally associated with introspection, analysis and spiritual inquiry.',
    missingBasic: 'Traditionally, a missing 7 is read as an area for reflection around quiet time and looking inward.',
    missingAdv: 'Absence of 7 is conventionally read as less emphasis on introspection. A reflection prompt only.',
    repeatBasic: 'More than one 7 is traditionally read as a strong inward, analytical streak. Tradition notes it can bring withdrawal or over-thinking.',
    repeatAdv: 'Repetition of 7 is conventionally read as intensified introspection, with possible withdrawal or over-analysis.',
    expression: 'Study, research, quiet reflection.',
    challenge: 'Withdrawal or over-thinking.',
    reflection: 'Balance quiet time with conversation, and write down thoughts rather than looping on them.',
    missingReflection: 'Set aside a few minutes of quiet time a few days a week.',
    phrase: 'reflection and analysis (7)',
    missingPhrase: 'quiet reflection (missing 7)',
    repeatPhrase: 'a strong inward, analytical streak (repeated 7)',
  },
  8: {
    keywords: 'ambition, organisation and material matters',
    themes: ['ambition', 'organisation'],
    planet: 'Saturn',
    presentBasic: 'Traditionally linked with ambition, organisation and managing resources.',
    presentAdv: 'Digit 8 (bottom left) is conventionally associated with ambition, organisation, authority and resource management.',
    missingBasic: 'Traditionally, a missing 8 is read as an area for reflection around goals, money habits and follow-through.',
    missingAdv: 'Absence of 8 is conventionally read as less emphasis on ambition and resource management. A reflection prompt only; nothing here predicts financial outcomes.',
    repeatBasic: 'More than one 8 is traditionally read as a strong drive for achievement. Tradition notes it can become over-focus on control or status.',
    repeatAdv: 'Repetition of 8 is conventionally read as intensified ambition and need for control, with possible over-focus on status or work.',
    expression: 'Setting goals, managing budgets and teams.',
    challenge: 'Over-focus on control, status or work.',
    reflection: 'Write down one realistic goal and a small budgeting or planning habit that supports it.',
    missingReflection: 'Try a simple monthly money or goals review.',
    phrase: 'ambition and organisation (8)',
    missingPhrase: 'goals and resource management (missing 8)',
    repeatPhrase: 'a strong drive for achievement (repeated 8)',
  },
  9: {
    keywords: 'compassion, wisdom, completion and energy',
    themes: ['idealism', 'energy'],
    planet: 'Mars',
    presentBasic: 'Traditionally linked with compassion, wisdom, a sense of completion and energy.',
    presentAdv: 'Digit 9 (top centre) is conventionally associated with compassion, wisdom and completion, and (via Mars in the Indian scheme) with energy and courage.',
    missingBasic: 'Traditionally, a missing 9 is read as an area for reflection around ideals and concern for the wider world.',
    missingAdv: 'Absence of 9 is conventionally read as less emphasis on idealism and broad concern. A reflection prompt only.',
    repeatBasic: 'More than one 9 is traditionally read as strong compassion and energy. Tradition notes it can bring impatience, anger or intensity.',
    repeatAdv: 'Repetition of 9 is conventionally read as intensified idealism and energy, with possible impatience or emotional intensity.',
    expression: 'Volunteering, advocacy, finishing what you start.',
    challenge: 'Impatience, anger or emotional intensity.',
    reflection: 'Choose a cause or small act of service that matters to you and pace your energy.',
    missingReflection: 'Try one small act of service or a conversation about values.',
    phrase: 'idealism and energy (9)',
    missingPhrase: 'ideals and wider concern (missing 9)',
    repeatPhrase: 'strong idealism and energy (repeated 9)',
  },
};

const base = {
  school: SCHOOL,
  tradition: TRADITION,
  lastReviewed: REVIEWED,
  version: VERSION,
  empiricalValidationStatus: NO_VALIDATION,
  evidenceClassification: 'traditional-unvalidated' as const,
  limitations: COMMON_LIMITS,
  activation: 'default' as const,
};

const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1).replace(/\.$/, '');

const TIERS = [
  { key: '2', min: 2, max: 2 as number | undefined, label: 'twice', word: 'Two' },
  { key: '3', min: 3, max: 3 as number | undefined, label: 'three times', word: 'Three' },
  { key: '4PLUS', min: 4, max: undefined as number | undefined, label: 'four or more times', word: 'Four or more' },
] as const;

/**
 * Repetition tiers (2 / 3 / 4+). A search summary of Lo Shu guides described this tier
 * pattern: two = strengthened, three = excess begins, four or more = dominant and needing
 * management. Digit-specific detail beyond that framework was not verified, so the text is
 * the generic framework applied to each digit's conservative keywords and challenge.
 */
function tierRules(d: Digit, n: NumberData, common: Partial<InterpretationRule>, pos: string): InterpretationRule[] {
  return TIERS.map((t) => {
    const tierText = {
      '2': {
        basic: `Two ${d}s: the tradition reads this as ${n.keywords} being strengthened. It is usually described as a positive emphasis, with ${lc(n.challenge)} mentioned only if it goes too far.`,
        adv: `${d} occurs twice. Tier reading: strengthened expression of ${n.keywords}; the excess (${lc(n.challenge)}) is a caveat rather than the main reading.`,
      },
      '3': {
        basic: `Three ${d}s: some teachers say the emphasis on ${n.keywords} becomes excessive at this point and can show up as ${lc(n.challenge)} Awareness of this can help.`,
        adv: `${d} occurs three times. Tier reading: the emphasis on ${n.keywords} is described as becoming excessive, with possible ${lc(n.challenge)}.`,
      },
      '4PLUS': {
        basic: `Four or more ${d}s: the tradition describes this as a dominant theme (${n.keywords}) that needs conscious management, since ${lc(n.challenge)} may be more pronounced. It is a prompt for reflection, not a verdict.`,
        adv: `${d} occurs four or more times. Tier reading: a dominant theme (${n.keywords}) that calls for active management; possible ${lc(n.challenge)}.`,
      },
    }[t.key];
    return {
      ...common,
      id: `NUM-${d}-REPEATED-${t.key}`,
      title: `${d} appears ${t.label}`,
      category: 'repetition',
      subcategory: `repeated-${t.key}`,
      sourceIds: ['SRC-JCCHAUDHRY-REPEAT', 'SRC-MEDIUM-1-TO-9', 'SRC-SILENTKNOWLEDGE-REPEAT', ...(d === 9 ? ['SRC-SILENTKNOWLEDGE-9', 'SRC-NUMERICWISDOM-9'] : [])],
      sourceAgreement: 'school-specific',
      sourceFidelityStatus: 'unverified-search-summary',
      ruleDescription: `Digit ${d} occurs ${t.label}; read under the generic tier framework (2 strengthened, 3 excess begins, 4+ dominant) for ${n.keywords}.`,
      triggerConditions: `Count of ${d} ${t.max === undefined ? `≥ ${t.min}` : `= ${t.min}`}`,
      requiredDigits: [d],
      requiredCounts: [{ digit: d, min: t.min, ...(t.max === undefined ? {} : { max: t.max }) }],
      requiredLines: [],
      calculationExplanation: `Count the digit ${d} (grid cell: ${pos}). This tier applies when the count is ${t.max === undefined ? `${t.min} or more` : `exactly ${t.min}`}.`,
      basicText: tierText.basic,
      advancedText: tierText.adv,
      reflectionSuggestion: n.reflection,
      knownDisagreements: [
        'A search summary described the 2 / 3 / 4+ tier pattern, but it did not attribute it to a single page, and sources differ on what each count means for each digit.',
        'Per-digit descriptions for specific counts (for example three 2s or four 2s) appear in some guides; they were not verified and are not reproduced here.',
      ],
      exclusions: ['Counts of five or more share the 4+ tier.'],
      priority: 1,
      direction: 'emphasis',
      summaryPhrase: `${n.repeatPhrase}, appearing ${t.label}`,
    } as InterpretationRule;
  });
}

const numberRules: InterpretationRule[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).flatMap((d) => {
  const n = N[d];
  const pos = POSITIONS[d].label;
  const common = {
    ...base,
    sourceIds: NUMEROLOGY_SOURCES,
    sourceAgreement: 'shared' as const,
    sourceFidelityStatus: 'unverified-search-summary' as SourceFidelity,
    constructiveExpression: n.expression,
    potentialChallenge: n.challenge,
    themes: [...n.themes],
    calculationMethod: 'Count of digit in the selected layer (raw DOB digits, plus overlay if enabled).',
  };
  return [
    {
      ...common,
      id: `NUM-${d}-PRESENT`,
      title: `${d} is present`,
      sourceFidelityStatus: 'multiple-summaries-agree' as SourceFidelity,
      category: 'number',
      subcategory: 'present',
      ruleDescription: `Digit ${d} occurs at least once; traditionally associated with ${n.keywords}.`,
      triggerConditions: `Count of ${d} ≥ 1`,
      requiredDigits: [d],
      requiredCounts: [],
      requiredLines: [],
      calculationExplanation: `Count the digit ${d} among the non-zero digits (grid cell: ${pos}). Present when the count is at least 1.`,
      basicText: n.presentBasic,
      advancedText: n.presentAdv,
      reflectionSuggestion: n.reflection,
      knownDisagreements: ['Keyword lists differ between authors; the wording here is a conservative summary.'],
      exclusions: [],
      priority: 2,
      direction: 'strength',
      summaryPhrase: n.phrase,
    } satisfies InterpretationRule,
    {
      ...common,
      id: `NUM-${d}-MISSING`,
      title: `${d} is missing`,
      category: 'missing-number',
      subcategory: 'missing',
      ruleDescription: `Digit ${d} does not occur; read as an area for reflection around ${n.keywords}.`,
      triggerConditions: `Count of ${d} = 0`,
      requiredDigits: [],
      requiredCounts: [{ digit: d, max: 0 }],
      requiredLines: [],
      calculationExplanation: `Count the digit ${d} among the non-zero digits. Missing when the count is 0. In an overlay mode, an added Driver or Destiny digit counts toward the total.`,
      basicText: n.missingBasic,
      advancedText: n.missingAdv,
      reflectionSuggestion: n.missingReflection,
      knownDisagreements: [
        'Some sources describe missing numbers as weaknesses; this project frames them only as reflection prompts.',
        'Whether a Driver/Destiny overlay "fills" a missing number depends on the school.',
      ],
      exclusions: ['Not a statement that the person lacks the related quality or ability.'],
      priority: 1,
      direction: 'reflection',
      summaryPhrase: n.missingPhrase,
    } satisfies InterpretationRule,
    ...tierRules(d, n, common, pos),
  ];
});

interface LineData {
  name: string;
  alt?: string;
  meaning: string;
  themes: string[];
  basicComplete: string;
  completeFidelity: SourceFidelity;
  completeAgreement: 'shared' | 'disputed' | 'school-specific';
  disagreements: string[];
  /** Traditional label some sources give when all three digits are missing. */
  emptyName: string;
  emptyAlt?: string;
  emptyMeaning: string;
  emptyFidelity: SourceFidelity;
  emptyDisagreements: string[];
  reflection: string;
  expression: string;
  challenge: string;
}

const LINE_DATA: Record<string, LineData> = {
  'H-492': {
    name: 'Mental plane',
    alt: 'Arrow of Intellect',
    meaning: 'thinking, memory and intellectual structure',
    themes: ['analysis', 'reflection'],
    basicComplete: 'This line is complete. Traditionally it is called the mental plane and linked with thinking, memory and analysis.',
    completeFidelity: 'multiple-summaries-agree',
    completeAgreement: 'shared',
    disagreements: ['One search summary used "Arrow of Intellect" for this line; others used "Mental plane". Treated as alternative names.'],
    emptyName: 'weakness arrow on the mental plane',
    emptyMeaning: 'difficulty with memory and planning ahead, or acting before thinking',
    emptyFidelity: 'unverified-search-summary',
    emptyDisagreements: ['Poor memory is attached to 3-5-7 (not 4-9-2) in another summary; the label here follows the mental-plane guide.'],
    reflection: 'Make time for reading, puzzles or learning something new.',
    expression: 'Analytical thinking and planning.',
    challenge: 'Over-thinking.',
  },
  'H-357': {
    name: 'Emotional plane (soul plane)',
    meaning: 'feelings, sensitivity, intuition and self-expression',
    themes: ['sensitivity', 'reflection'],
    basicComplete: 'This line is complete. Traditionally it is called the emotional or soul plane and linked with feelings, sensitivity and intuition.',
    completeFidelity: 'multiple-summaries-agree',
    completeAgreement: 'shared',
    disagreements: [
      'Some summaries say "emotional plane", others "soul plane"; treated as alternative names.',
      'One summary called 3-5-7 the "Arrow of Compassion" (strong faith, philosophical outlook); this alias is not used here.',
    ],
    emptyName: 'arrow of poor memory',
    emptyMeaning: 'scattered recall',
    emptyFidelity: 'unverified-search-summary',
    emptyDisagreements: ['The same "poor memory" idea is attached to the mental plane (4-9-2) in another guide.'],
    reflection: 'Keep a short daily note about how you feel and why.',
    expression: 'Empathy and intuition.',
    challenge: 'Being overwhelmed by feelings.',
  },
  'H-816': {
    name: 'Practical plane (physical plane)',
    meaning: 'practical action, material competence and getting things done',
    themes: ['organisation', 'initiative'],
    basicComplete: 'This line is complete. Traditionally it is called the practical or physical plane and linked with practical action and follow-through.',
    completeFidelity: 'multiple-summaries-agree',
    completeAgreement: 'shared',
    disagreements: ['Some summaries say "practical plane", others "physical plane"; treated as alternative names.'],
    emptyName: 'arrow of losses',
    emptyMeaning: 'money and effort leaking away',
    emptyFidelity: 'unverified-search-summary',
    emptyDisagreements: ['The label is a predictive claim about losses; it is reported as a traditional name and not endorsed.'],
    reflection: 'Break one goal into small steps and schedule the first.',
    expression: 'Turning plans into results.',
    challenge: 'Over-focus on material outcomes.',
  },
  'V-438': {
    name: 'Thought and planning plane',
    alt: 'Arrow of the Planner',
    meaning: 'the ability to plan and sequence ideas',
    themes: ['organisation', 'creativity'],
    basicComplete: 'This line is complete. Traditionally it is called the thought plane and linked with planning and sequencing ideas.',
    completeFidelity: 'sources-disagree',
    completeAgreement: 'disputed',
    disagreements: [
      'The plane name "Thought plane" was reported consistently, but one summary lists "Arrow of Determination 4-3-8" while others give that name to 9-5-1 (and some to the diagonal 1-5-9 of a different grid layout). The "Arrow of Determination" alias is therefore disputed.',
    ],
    emptyName: 'arrow of indecision',
    emptyAlt: 'arrow of confusion',
    emptyMeaning: 'overthinking and difficulty being methodical or organised',
    emptyFidelity: 'sources-disagree',
    emptyDisagreements: ['Summaries used "indecision" and "confusion" for the same empty line.'],
    reflection: 'Sketch a simple plan for the next few months and review it monthly.',
    expression: 'Strategy and long-range planning.',
    challenge: 'Planning without acting.',
  },
  'V-951': {
    name: 'Will plane',
    alt: 'Arrow of Determination (disputed)',
    meaning: 'determination and follow-through',
    themes: ['initiative', 'energy'],
    basicComplete: 'This line is complete. Traditionally it is called the will plane and linked with determination and follow-through.',
    completeFidelity: 'sources-disagree',
    completeAgreement: 'disputed',
    disagreements: [
      '"Will plane" for 9-5-1 was reported consistently, but the alias "Arrow of Determination" is attached to 4-3-8 in one summary and to 1-5-9 (a different grid layout) in another. Another guide calls the golden diagonal 4-5-6 the "will power plane".',
    ],
    emptyName: 'arrow of passivity',
    emptyMeaning: 'waiting for others to act',
    emptyFidelity: 'unverified-search-summary',
    emptyDisagreements: [],
    reflection: 'Choose one commitment and track it for a few weeks.',
    expression: 'Persistence and resolve.',
    challenge: 'Obstinacy.',
  },
  'V-276': {
    name: 'Action plane',
    meaning: 'turning thought into real-world action',
    themes: ['initiative', 'energy'],
    basicComplete: 'This line is complete. Traditionally it is called the action plane and linked with taking action and courage.',
    completeFidelity: 'multiple-summaries-agree',
    completeAgreement: 'shared',
    disagreements: ['Not every guide names this line.'],
    emptyName: 'arrow of loneliness',
    emptyMeaning: 'being goal-focused with fewer close relationships',
    emptyFidelity: 'unverified-search-summary',
    emptyDisagreements: ['The label is a predictive claim about relationships; it is reported as a traditional name and not endorsed.'],
    reflection: 'Pick a small action you have been postponing and do it today.',
    expression: 'Decisive action.',
    challenge: 'Acting without enough thought.',
  },
  'D-456': {
    name: 'Golden line (golden yog, raj yog)',
    meaning: 'practical resourcefulness; some guides also associate it with success, fame or money',
    themes: ['organisation', 'balance'],
    basicComplete: 'This line is complete. Some guides call it the golden line and link it with practical resourcefulness. Claims about luck, fame or wealth are traditional and are not supported by evidence.',
    completeFidelity: 'multiple-summaries-agree',
    completeAgreement: 'school-specific',
    disagreements: [
      'The names golden/silver for the diagonals recur across summaries, but some other schools name diagonals differently or not at all.',
      'Wealth, fame and luck are predictive claims. One summary also claimed that only 2–3% of people have this line; no source was given. This project computed 1.5% (1900–2025, DOB digits only) and 7.1% (with Driver and Destiny added) of calendar dates, and the share depends heavily on the date range and on the overlay convention.',
      'Another guide calls 4-5-6 the "will power plane", which conflicts with the "will plane" name for 9-5-1.',
    ],
    emptyName: 'arrow of frustration',
    emptyMeaning: 'repressed energy and emotional churn',
    emptyFidelity: 'sources-disagree',
    emptyDisagreements: ['Another summary gave the name "arrow of frustration" to the empty 2-5-8 line instead.'],
    reflection: 'Review one practical habit (planning, saving or organising) that supports your goals.',
    expression: 'Resourcefulness.',
    challenge: 'Expecting luck instead of effort.',
  },
  'D-258': {
    name: 'Silver line (silver yog, property plane)',
    meaning: 'emotional stability, empathy and patience; some guides also link it with property',
    themes: ['sensitivity', 'balance'],
    basicComplete: 'This line is complete. Some guides call it the silver line and link it with emotional stability and patience. Property or wealth claims are traditional and are not supported by evidence.',
    completeFidelity: 'multiple-summaries-agree',
    completeAgreement: 'school-specific',
    disagreements: ['Names and meanings for the diagonals vary or are absent in other schools.'],
    emptyName: 'arrow of sensitivity',
    emptyMeaning: 'being very sensitive and hiding feelings',
    emptyFidelity: 'sources-disagree',
    emptyDisagreements: ['Another summary gave the name "arrow of frustration" to the empty 2-5-8 line.'],
    reflection: 'Try a regular calming practice, such as a short walk or breathing exercise.',
    expression: 'Empathy and balance.',
    challenge: 'Absorbing other people’s moods.',
  },
};

const lineRules: InterpretationRule[] = LINES.flatMap((line) => {
  const d = LINE_DATA[line.id];
  if (!d) throw new Error(`Missing LINE_DATA for ${line.id}`);
  const lbl = lineLabel(line);
  const common = {
    ...base,
    subcategory: line.kind,
    requiredDigits: [] as Digit[],
    requiredCounts: [],
    constructiveExpression: d.expression,
    potentialChallenge: d.challenge,
    reflectionSuggestion: d.reflection,
    themes: d.themes,
  };
  const aliasNote = d.alt ? ` (also: ${d.alt})` : '';
  const emptyAlias = d.emptyAlt ? ` (also "${d.emptyAlt}")` : '';
  const diagonalSources = ['SRC-SHIVOHAM-RAJYOG', 'SRC-ASTROMEDHA-GRID'];
  return [
    {
      ...common,
      id: `LINE-${line.id}-COMPLETE`,
      title: `${lbl} is complete — ${d.name}`,
      category: 'line',
      sourceIds: line.kind === 'diagonal' ? [...PLANE_SOURCES, ...diagonalSources] : PLANE_SOURCES,
      sourceAgreement: d.completeAgreement,
      calculationMethod: 'Geometric line membership: a line is complete when all three of its digits are present.',
      ruleDescription: `All of ${line.digits.join(', ')} are present; this line is named "${d.name}"${aliasNote} in one naming tradition and linked with ${d.meaning}.`,
      triggerConditions: `Line ${lbl} has all three digits present`,
      requiredLines: [{ lineId: line.id, state: 'complete' }],
      calculationExplanation: `The three positions of the ${line.kind} line ${lbl} hold digits ${line.digits.join(', ')}. The line is complete when each has a count of at least 1.`,
      basicText: d.basicComplete,
      advancedText: `Line ${lbl} (${line.kind}) complete. Name: ${d.name}${aliasNote}. Meaning in this naming: ${d.meaning}.`,
      sourceFidelityStatus: d.completeFidelity,
      knownDisagreements: d.disagreements,
      exclusions: ['Partially populated lines have no documented rule here.', 'Arrows that belong to a different grid layout (such as 1-2-3 or 1-5-9) are not lines of the Lo Shu square and are not used.'],
      priority: 1,
      direction: 'strength',
      summaryPhrase: `the ${d.name.split(' (')[0]!.toLowerCase()} (${lbl}) is complete`,
    } satisfies InterpretationRule,
    {
      ...common,
      id: `LINE-${line.id}-EMPTY`,
      title: `${lbl} is entirely empty — ${d.emptyName}`,
      category: 'empty-line',
      sourceIds: line.id === 'H-492' ? [...EMPTY_SOURCES, 'SRC-LOSHUCALC-MINDPLANE'] : line.id === 'D-456' ? [...EMPTY_SOURCES, 'SRC-ASTROMEDHA-FRUSTRATION'] : line.id === 'H-357' ? [...EMPTY_SOURCES, 'SRC-ASTROMEDHA-POORMEMORY'] : EMPTY_SOURCES,
      sourceAgreement: d.emptyFidelity === 'sources-disagree' ? 'disputed' : 'school-specific',
      calculationMethod: 'Geometric line membership: a line is empty when none of its three digits is present.',
      ruleDescription: `None of ${line.digits.join(', ')} are present. Some sources call this the "${d.emptyName}"${emptyAlias} and describe ${d.emptyMeaning}. Framed here as a reflection prompt about ${d.meaning}.`,
      triggerConditions: `Line ${lbl} has all three digits missing`,
      requiredLines: [{ lineId: line.id, state: 'empty' }],
      calculationExplanation: `The three positions of the ${line.kind} line ${lbl} hold digits ${line.digits.join(', ')}. The line is empty when each has a count of 0.`,
      basicText: `None of the three numbers appear. Some sources call this the "${d.emptyName}" and describe ${d.emptyMeaning}. The tradition presents it as an area for reflection, not a fixed trait or a prediction.`,
      advancedText: `Line ${lbl} (${line.kind}) entirely empty. Traditional label: "${d.emptyName}"${emptyAlias}, described as ${d.emptyMeaning}. Related complete-line name: ${d.name}.`,
      sourceFidelityStatus: d.emptyFidelity,
      knownDisagreements: [...d.emptyDisagreements, 'Negative labels such as "losses" or "loneliness" are the sources’ words; this project reports them as tradition and frames them as reflection prompts only.'],
      exclusions: ['A line with one or two digits is not empty and has no documented rule here.'],
      priority: 1,
      direction: 'reflection',
      summaryPhrase: `the ${d.name.split(' (')[0]!.toLowerCase()} (${lbl}) is entirely empty`,
    } satisfies InterpretationRule,
  ];
});

const planetRules: InterpretationRule[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).map((d) => ({
  ...base,
  id: `PLANET-${d}`,
  title: `${d} and ${N[d].planet} (Indian planetary scheme)`,
  category: 'planetary',
  subcategory: 'planet',
  school: 'Indian numerology, planetary assignment',
  tradition: 'Indian numerology (Moolank/Bhagyank school)',
  sourceIds: ['SRC-OCCULTSCIENCE-PLANETS', 'SRC-ASTROSIGHT-PLANETS', 'SRC-WEBINDIA-RULING'],
  sourceAgreement: 'school-specific',
  sourceFidelityStatus: 'multiple-summaries-agree',
  ruleDescription: `In one common Indian scheme the digit ${d} is assigned to ${N[d].planet}.`,
  triggerConditions: `Count of ${d} ≥ 1 and planetary option enabled`,
  requiredDigits: [d],
  requiredCounts: [],
  requiredLines: [],
  calculationMethod: 'Lookup of the digit in the selected planetary table.',
  calculationExplanation: `Digit ${d} is mapped to ${N[d].planet} in this scheme. The mapping is a convention, not a calculation.`,
  basicText: `In one Indian tradition, ${d} is linked with ${N[d].planet}.`,
  advancedText: `Planetary association (Indian scheme): ${d} → ${N[d].planet}. Other schemes may differ; one summary lists 4 as Uranus (Rahu).`,
  constructiveExpression: N[d].expression,
  potentialChallenge: N[d].challenge,
  reflectionSuggestion: N[d].reflection,
  knownDisagreements: [
    'Several search summaries agreed on this nine-planet mapping, but planetary tables differ between schools; one summary lists 4 as "Uranus (Rahu)". The mapping was not verified against a primary text.',
  ],
  exclusions: ['No astronomical or astrological calculation is performed.'],
  limitations: [...COMMON_LIMITS, 'Mapping not verified against a primary text; no astronomical or astrological calculation is performed.'],
  priority: 2,
  themes: [],
  direction: 'strength',
  activation: 'planetary',
  summaryPhrase: `${N[d].planet} association (${d})`,
}));

export const RULES: readonly InterpretationRule[] = [...numberRules, ...lineRules, ...planetRules];

/** Short display strings used by the grid cells (kept next to the rule text they summarise). */
export const DIGIT_KEYWORDS: Record<Digit, string> = Object.fromEntries(
  ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).map((d) => [d, N[d].keywords]),
) as Record<Digit, string>;

export const DIGIT_PLANETS: Record<Digit, string> = Object.fromEntries(
  ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).map((d) => [d, N[d].planet]),
) as Record<Digit, string>;

/** Traditional line names for display. Naming is disputed for some lines; see each rule's knownDisagreements. */
export const LINE_NAMES: Record<string, { name: string; alt?: string }> = Object.fromEntries(
  Object.entries(LINE_DATA).map(([id, d]) => [id, { name: d.name, alt: d.alt }]),
);
