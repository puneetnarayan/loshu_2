import type { SourceRecord } from './schema';

const REVIEWED = '2026-10-04';

const search = (
  id: string,
  title: string,
  url: string,
  kind: SourceRecord['kind'],
  tradition: string | null,
  note: string,
): SourceRecord => ({
  id,
  title,
  author: null,
  organisation: null,
  url,
  publicationDate: null,
  lastReviewed: REVIEWED,
  kind,
  accessMethod: 'search-summary-only',
  tradition,
  note,
});

const unreachable = (id: string, title: string, url: string): SourceRecord => ({
  id,
  title,
  author: null,
  organisation: null,
  url,
  publicationDate: null,
  lastReviewed: REVIEWED,
  kind: 'user-supplied-unreachable',
  accessMethod: 'not-accessible',
  tradition: null,
  note: 'Supplied as a starting reference. The page could not be fetched on the review date (blocked by the network egress proxy), so nothing is attributed to it.',
});

/**
 * Source registry. Titles and URLs are copied from search results returned on the review
 * date. Authors and publication dates are null where they were not visible: they are never guessed.
 * Rules refer to sources by id so metadata is stored once.
 */
export const SOURCES: readonly SourceRecord[] = [
  search(
    'SRC-PARAMARSH',
    'Lo Shu Grid: Meaning, Arrows, Missing Numbers - Paramarsh',
    'https://paramarsh.app/patrika/numerology/lo-shu-grid-numerology',
    'commercial-calculator',
    'Indian (Vedic-style) Lo Shu numerology',
    'Commercial calculator/guide. Example of practice, not independent validation.',
  ),
  search(
    'SRC-VEDICMEET-ARROWS',
    'Arrows in Lo Shu Grid: know Your Life’s Energy & Purpose',
    'https://vedicmeet.com/numerology/arrows',
    'commercial-calculator',
    'Indian (Vedic-style) Lo Shu numerology',
    'Search summary described 9-5-1 as the Will Plane / Arrow of Determination and 4-3-8 as the Thought Plane / Arrow of the Planner. Another search summary attributed "Arrow of Determination" to 4-3-8, so naming is disputed.',
  ),
  search(
    'SRC-600IQ',
    'Lo Shu Grid Calculator: Free Full Grid, Arrows & Remedies',
    'https://600iq.com/tools/lo-shu-grid-calculator/',
    'commercial-calculator',
    null,
    'Commercial calculator. Search summary listed eight named arrows including Golden Line (4-5-6) and Silver Line (2-5-8).',
  ),
  search(
    'SRC-ANKSHASTRA',
    'Lo Shu Grid Calculator (Ankshastra)',
    'https://ankshastra.in/lo-shu-grid-calculator-professional/',
    'commercial-calculator',
    'Indian Lo Shu numerology',
    'Commercial calculator. Search summary described Driver as the reduced day and Conductor as the reduced full date.',
  ),
  search(
    'SRC-SILENTKNOWLEDGE-REPEAT',
    'Repeated Numbers in Lo Shu Grid Explained',
    'https://www.thesilentknowledge.com/2026/01/repeated-numbers-in-lo-shu-grid.html',
    'blog',
    null,
    'Blog. Search summary said repetition indicates stronger influence of that number, positive and challenging. Count-specific examples were reported but are not implemented because they could not be verified.',
  ),
  search(
    'SRC-SWARNSIDDHI-DC',
    'Driver and Conductor Numbers — Mulank and Bhagyank Read Together',
    'https://swarnsiddhi.com/blog/driver-conductor-numbers',
    'blog',
    'Indian numerology',
    'Blog. Search summary reported that many Indian practitioners add Moolank and Bhagyank to the grid, while other schools do not.',
  ),
  search(
    'SRC-KUA-FENGSHUI-FR',
    'What is the kua number? - Feng Shui Expert - Aude à la Déco',
    'https://fengshui-expert.fr/en/kua-number/',
    'blog',
    'Feng Shui (Eight Mansions)',
    'Used only to establish that Kua depends on the solar-year start (Li Chun) and sex-specific formulas, which is why Kua is unavailable here.',
  ),
  search(
    'SRC-SAGE-LUOSHU-2015',
    'Luo Shu: Ancient Chinese Magic Square on Linear Algebra',
    'https://journals.sagepub.com/doi/10.1177/2158244015585828',
    'academic',
    'Mathematics / history of Chinese magic squares',
    'Search results listed authors Albert Ting Pat So, Eric Lee, Kin Lun Li and Dickson Koon Sing Leung, 2015. Not read in full. Candidate source for the square’s mathematical properties and historical context.',
  ),
  search(
    'SRC-JASNH-BIRTHNUMBERS',
    'A Test of Numerology: Do Birth Numbers … (title truncated in search result)',
    'https://www.jasnh.com/pdf/Vol13-No2-article2.pdf',
    'academic',
    null,
    'Candidate empirical study identified by title only. Its method and findings have NOT been read, so no result is claimed from it. Needs review before any rule is labelled empirically tested or refuted.',
  ),
  unreachable('SRC-ASTROSAKI', 'AstroSaki — Lo Shu', 'https://astrosaki.com/numerology/lo-shu'),
  unreachable('SRC-NIDARSHANAVEDH', 'Nidarshanavedh — Lo Shu Grid Calculator', 'https://nidarshanavedh.com/calculators/lo-shu-grid-calculator/'),
  unreachable('SRC-LOSHUGRIDCALCULATORS', 'loshugridcalculators.com — Methodology', 'https://loshugridcalculators.com/methodology/'),
  unreachable('SRC-NUMERELY', 'Numerely — Lo Shu Arrows', 'https://numerely.com/guides/lo-shu-arrows/'),
  unreachable('SRC-LUCKYPROPERTIES', 'lucky.properties — Lo Shu', 'https://www.lucky.properties/learn/lo-shu/'),
];

export function getSource(id: string): SourceRecord | undefined {
  return SOURCES.find((s) => s.id === id);
}
