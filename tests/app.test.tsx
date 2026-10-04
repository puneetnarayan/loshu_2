import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function enterDate(user: ReturnType<typeof userEvent.setup>, value: string) {
  const input = screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/);
  await user.clear(input);
  if (value) await user.type(input, value);
}

const cellLabel = (n: number) => new RegExp(`^Number ${n},`);

describe('tabs', () => {
  it('has exactly two tabs and Advanced is selected by default', () => {
    render(<App />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent?.replace(/\(selected\)/, '').trim())).toEqual([
      expect.stringMatching(/^Basic/),
      expect.stringMatching(/^Advanced/),
    ]);
    expect(screen.getByRole('tab', { name: /Advanced/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Basic/ })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-advanced');
  });
  it('supports arrow-key navigation between tabs', async () => {
    const user = userEvent.setup();
    render(<App />);
    screen.getByRole('tab', { name: /Advanced/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /Basic/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Basic/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /Advanced/ })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('defaults', () => {
  // 02-06-1970 by hand: digits 0,2,0,6,1,9,7,0 -> non-zero 2,6,1,9,7 once each; Driver 2; Destiny 25 -> 7.
  // Lines: 2-7-6 complete (all present); 4-3-8 entirely empty; the other six are partial.
  it('opens with 02-06-1970 and Puneet Narayan and shows the interpretation immediately', () => {
    render(<App />);
    expect(screen.getByLabelText(/Name \(optional\)/)).toHaveValue('Puneet Narayan');
    expect(screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/)).toHaveValue('02-06-1970');
    expect(screen.getByText(/Reading for/)).toHaveTextContent('Reading for Puneet Narayan · born 02-06-1970');
    expect(screen.getByRole('status')).toHaveTextContent(/Calculation verified/);
    for (const n of [1, 2, 6, 7, 9]) expect(screen.getByRole('button', { name: cellLabel(n) })).toHaveAccessibleName(/Appears 1 time\. present/);
    for (const n of [3, 4, 5, 8]) expect(screen.getByRole('button', { name: cellLabel(n) })).toHaveAccessibleName(/Appears 0 times\. missing/);
    expect(screen.getByRole('heading', { level: 3, name: 'Interpretation (rule-based)' })).toBeInTheDocument();
    expect(screen.getAllByText(/2–7–6 is complete — Action plane/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4–3–8 is entirely empty/).length).toBeGreaterThan(0);
  });
  it('the interpretation comes before the audit in Advanced', () => {
    render(<App />);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles.indexOf('Interpretation (rule-based)')).toBeGreaterThan(titles.indexOf('Advanced grid'));
    expect(titles.indexOf('Interpretation (rule-based)')).toBeLessThan(titles.indexOf('Calculation audit'));
  });
  it('the name is only a label: changing it does not change any count, and it is not stored', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    const before = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => screen.getByRole('button', { name: cellLabel(n) }).getAttribute('aria-label'));
    await user.clear(screen.getByLabelText(/Name \(optional\)/));
    await user.type(screen.getByLabelText(/Name \(optional\)/), 'Someone Else');
    expect(screen.getByText(/Reading for/)).toHaveTextContent('Reading for Someone Else · born 02-06-1970');
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => screen.getByRole('button', { name: cellLabel(n) }).getAttribute('aria-label'))).toEqual(before);
    expect(setItem).not.toHaveBeenCalled();
  });
  it('renders a name containing markup as plain text', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.clear(screen.getByLabelText(/Name \(optional\)/));
    await user.type(screen.getByLabelText(/Name \(optional\)/), '<b>x</b>');
    expect(screen.getByText(/Reading for/)).toHaveTextContent('Reading for <b>x</b>');
    expect(container.querySelector('.prepared b')).toBeNull();
  });
});

describe('live results', () => {
  it('has no Calculate button, and the interpretation updates as soon as a valid date is complete', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Calculate' })).not.toBeInTheDocument();
    const input = screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/);
    await user.clear(input);
    await user.type(input, '23-11-199'); // incomplete: no stale reading, no error yet
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/appears automatically/)).toBeInTheDocument();
    await user.type(input, '4'); // 23-11-1994 is now complete
    expect(screen.getByText(/Reading for/)).toHaveTextContent('born 23-11-1994');
    expect(screen.getByRole('button', { name: cellLabel(1) })).toHaveAccessibleName(/Appears 3 times/);
    expect(screen.getAllByText(/4–9–2 is complete — Mental plane/).length).toBeGreaterThan(0);
    // change the date again: updates with nothing pressed
    await user.clear(input);
    await user.type(input, '02-06-1970');
    expect(screen.getByRole('button', { name: cellLabel(1) })).toHaveAccessibleName(/Appears 1 time/);
    expect(screen.getAllByText(/2–7–6 is complete — Action plane/).length).toBeGreaterThan(0);
  });
  it('shows an error as soon as ten characters are present and the date is invalid, then recovers', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/);
    await user.clear(input);
    await user.type(input, '31-04-2021');
    expect(screen.getByRole('alert')).toHaveTextContent(/does not exist/);
    expect(screen.queryByText(/Reading for/)).not.toBeInTheDocument();
    await user.clear(input);
    await user.type(input, '30-04-2021');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/Reading for/)).toHaveTextContent('born 30-04-2021');
  });
  it('Advanced opens with the per-number and plane panels expanded', () => {
    const { container } = render(<App />);
    expect(screen.getByRole('tab', { name: /Advanced/ })).toHaveAttribute('aria-selected', 'true');
    expect(container.querySelectorAll('details.number-detail[open]')).toHaveLength(9);
    expect(screen.getByRole('heading', { level: 3, name: 'Calculation audit' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Interpretation (rule-based)' })).toBeInTheDocument();
  });
});

describe('extra interpretations', () => {
  const h3s = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  it('Advanced shows every new section by default', () => {
    render(<App />);
    expect(h3s()).toEqual(
      expect.arrayContaining([
        'Driver and Destiny readings', 'How common is this pattern?', 'Grid facts and line weights', 'Planetary profile (optional)',
        'Five elements (optional)', 'Reported remedies (optional)', 'Personal year cycle (optional, forecast style)',
        'Name numbers (optional, Pythagorean)', 'Compare with another date (optional)', 'Kua number (optional, Feng Shui)',
      ]),
    );
  });
  it('shows visible riders: low for remedies/planets/elements, very low for cycle and name', () => {
    const { container } = render(<App />);
    const riders = [...container.querySelectorAll('aside.rider')];
    const text = (re: RegExp) => riders.filter((r) => re.test(r.textContent ?? ''));
    expect(text(/Low confidence.*Remedies were collected/s).length).toBeGreaterThan(0);
    expect(text(/Low confidence.*digit-to-planet mapping/s).length).toBeGreaterThan(0);
    expect(text(/Low confidence.*element of each number/s).length).toBeGreaterThan(0);
    expect(text(/Very low confidence.*Forecast-style/s).length).toBeGreaterThan(0);
    expect(text(/Very low confidence.*separate system/s).length).toBeGreaterThan(0);
    // low-confidence rules also carry a chip that is text, not colour only
    expect(container.querySelectorAll('.chip-low').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.chip-very-low').length).toBeGreaterThan(0);
  });
  it('shows the hand-checked values for the defaults (name 56 -> 11 -> 2, personal year, elements)', () => {
    render(<App />);
    const name = screen.getByRole('heading', { level: 3, name: 'Name numbers (optional, Pythagorean)' }).closest('section')!;
    expect(name).toHaveTextContent('56 → 11 → 2');
    expect(name).toHaveTextContent('16 → 7');
    expect(name).toHaveTextContent('40 → 4');
    const cycle = screen.getByRole('heading', { level: 3, name: /Personal year cycle/ }).closest('section')!;
    expect(cycle).toHaveTextContent(`Personal Year for ${new Date().getFullYear()}`);
    const el = screen.getByRole('heading', { level: 3, name: 'Five elements (optional)' }).closest('section')!;
    expect(el).toHaveTextContent('Most represented: metal');
  });
  it('switching an optional reading off removes its section', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox', { name: /Reported remedies/ }));
    expect(h3s()).not.toContain('Reported remedies (optional)');
    expect(h3s()).toContain('Five elements (optional)');
  });
  it('compares with a second date live, using descriptive arithmetic only', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/Second date of birth/), '23-11-1994');
    const sec = screen.getByRole('heading', { level: 3, name: 'Compare with another date (optional)' }).closest('section')!;
    expect(sec).toHaveTextContent('Present in both: 1, 2, 9.');
    expect(sec).toHaveTextContent('Only in 02-06-1970: 6, 7.');
    expect(sec).toHaveTextContent('Missing from both: 5, 8.');
    expect(sec).toHaveTextContent(/No compatibility verdict is made/);
  });
  it('the historical mirror view redraws the grid without changing counts', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = screen.getByRole('button', { name: cellLabel(2) }).getAttribute('aria-label')!.replace(/, [a-z ]+\./, '.');
    await user.click(screen.getByRole('radio', { name: /Historical mirror/ }));
    expect(screen.getByRole('group', { name: /historical mirror layout: 2 9 4/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: cellLabel(2) })).toHaveAccessibleName(/top left/);
    expect(screen.getByRole('button', { name: cellLabel(2) }).getAttribute('aria-label')!.replace(/, [a-z ]+\./, '.')).toBe(before);
    expect(screen.getAllByText(/Da Dai Liji/).length).toBeGreaterThan(0); // rider explains the source and its low confidence
    const cells = [...document.querySelectorAll('.lo-grid .cell-digit')].map((c) => c.textContent);
    expect(cells).toEqual(['2', '9', '4', '7', '5', '3', '6', '1', '8']);
  });
  it('Basic shows key numbers, partial-line tiers and how common the pattern is, with confidence labels', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('tab', { name: /Basic/ }));
    expect(screen.getByRole('heading', { level: 4, name: 'Your two key numbers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'How common is your pattern?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Partly present lines' })).toBeInTheDocument();
    expect(screen.getByText(/Your Driver number is 2/)).toBeInTheDocument();
    expect(screen.getByText(/Your Destiny number is 7/)).toBeInTheDocument();
    expect(container.querySelectorAll('.chip-low').length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: /Reported remedies/ })).not.toBeInTheDocument(); // optional readings stay in Advanced
  });
});

describe('more optional readings in the page', () => {
  const h3s = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  it('gemstones are off by default and, once switched on, show a very-low-confidence rider and the Driver pairing', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('checkbox', { name: /Gemstones reported/ })).not.toBeChecked();
    expect(h3s()).not.toContain('Gemstones reported for the Driver number (optional)');
    await user.click(screen.getByRole('checkbox', { name: /Gemstones reported/ }));
    const sec = screen.getByRole('heading', { level: 3, name: 'Gemstones reported for the Driver number (optional)' }).closest('section')!;
    expect(sec).toHaveTextContent(/Very low confidence/);
    expect(sec).toHaveTextContent(/jewellery retailers, who profit from sales/);
    expect(sec).toHaveTextContent(/Driver 2 → pearl/); // 02-06-1970: Driver 2
    expect(sec).toHaveTextContent(/do not buy a stone because of this/i);
  });
  it('shows the Driver–Destiny relation with its conflict warning (02-06-1970: Driver 2, Destiny 7 -> neutral)', () => {
    render(<App />);
    const sec = screen.getByRole('heading', { level: 3, name: 'Driver and Destiny readings' }).closest('section')!;
    expect(sec).toHaveTextContent(/Driver and Destiny relation \(optional\)/);
    expect(sec).toHaveTextContent(/row 8 lists 4 as both friendly and enemy/);
    expect(sec).toHaveTextContent(/listed as neutral to your Driver number/);
  });
  it('shows 12 personal months and a descriptive year grid, each with a rider', () => {
    render(<App />);
    const sec = screen.getByRole('heading', { level: 3, name: /Personal year cycle/ }).closest('section')!;
    const year = new Date().getFullYear();
    expect(within(sec).getByRole('heading', { level: 4, name: `Personal month numbers for ${year}` })).toBeInTheDocument();
    const table = within(sec).getAllByRole('table')[0]!;
    expect(within(table).getAllByRole('row')).toHaveLength(13); // header + 12 months
    expect(within(sec).getByRole('heading', { level: 4, name: `Year grid for ${year} (descriptive)` })).toBeInTheDocument();
    expect(sec).toHaveTextContent(/no forecast is made/);
    expect(sec).toHaveTextContent(/No meanings per number were found, so none are given/);
  });
  it('branding fields appear in the printed report only when filled, and are not stored', { timeout: 30000 }, async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    window.print = vi.fn(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    const { container } = render(<App />);
    await user.click(screen.getByText('Report branding (optional)'));
    await user.type(screen.getByLabelText('Business name'), 'Acme Readings');
    await user.type(screen.getByLabelText('Prepared by'), 'A. Person');
    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
    expect(container.querySelector('.print-report')!.textContent).toContain('Acme Readings · Prepared by A. Person');
    expect(setItem).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Business name')).toHaveValue('');
  });
  it('the print report is rendered from the same blocks as the PDF (same section titles)', async () => {
    const user = userEvent.setup();
    window.print = vi.fn(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
    const titles = [...container.querySelectorAll('.print-report h2')].map((h) => h.textContent);
    expect(titles).toEqual(['1. Grid', '2. Calculation audit', '3. The eight lines', '4. Interpretation (rule-based)', '5. Key numbers and how common the pattern is', '6. Optional readings', '7. Evidence and limitations', '8. Sources cited by the rules above']);
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
  });
});

describe('interpretation colours', () => {
  it('every coloured reading carries a visible text tag, and only interpretations are coloured', () => {
    const { container } = render(<App />);
    const readings = [...container.querySelectorAll('.reading')];
    expect(readings.length).toBeGreaterThan(20);
    for (const r of readings) {
      const tag = r.querySelector('.vtag')?.textContent;
      expect(['Positive', 'Neutral', 'Challenge'], r.textContent?.slice(0, 40)).toContain(tag);
    }
    // calculations, tables, the grid, riders and the verification badge are never coloured as readings
    expect(container.querySelectorAll('table .reading, .lo-grid .reading, .verify .reading, .rider .reading, .record .reading')).toHaveLength(0);
    const audit = screen.getByRole('heading', { level: 3, name: 'Calculation audit' }).closest('section')!;
    expect(audit.querySelectorAll('.reading')).toHaveLength(0);
    const facts = screen.getByRole('heading', { level: 3, name: 'Grid facts and line weights' }).closest('section')!;
    expect(facts.querySelectorAll('.reading')).toHaveLength(0);
  });
  it('Advanced colours the summary sentences and the rule lists by framing', () => {
    const { container } = render(<App />);
    const sec = screen.getByRole('heading', { level: 3, name: 'Interpretation (rule-based)' }).closest('section')!;
    expect(sec).toHaveTextContent(/Colour guide for the readings/);
    expect(sec.querySelector('p.reading-positive')).toHaveTextContent(/strongest patterns/);
    expect(sec.querySelector('p.reading-negative')).toHaveTextContent(/areas for reflection/);
    const missing5 = [...container.querySelectorAll('li.reading-negative')].find((li) => li.textContent?.includes('NUM-5-MISSING'))!;
    expect(missing5.querySelector('.vtag')).toHaveTextContent('Challenge');
    const present1 = [...container.querySelectorAll('li.reading-positive')].find((li) => li.textContent?.includes('NUM-1-PRESENT'))!;
    expect(present1.querySelector('.vtag')).toHaveTextContent('Positive');
    const driver = [...container.querySelectorAll('li.reading-neutral')].find((li) => li.textContent?.includes('DRIVER-2'))!;
    expect(driver.querySelector('.vtag')).toHaveTextContent('Neutral');
  });
  it('Basic colours present, repeated, missing, line and key-number readings', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('tab', { name: /Basic/ }));
    expect(screen.getByText(/Colour guide for the readings/)).toBeInTheDocument();
    const find = (cls: string, text: string) => [...container.querySelectorAll(`li.${cls}`)].find((li) => li.textContent?.includes(text));
    expect(find('reading-positive', 'is conventionally associated') || find('reading-positive', 'Traditionally linked')).toBeTruthy();
    expect(find('reading-negative', 'a missing 5 is read as an area for reflection')).toBeTruthy();
    expect(find('reading-positive', 'This line is complete')).toBeTruthy();
    expect(find('reading-negative', 'arrow of indecision')).toBeTruthy();
    expect(find('reading-neutral', 'Your Driver number is 2')).toBeTruthy();
    expect(find('reading-neutral', 'Two of the three numbers')).toBeTruthy();
    // the audit table of the Basic tab stays plain
    expect(container.querySelectorAll('table .reading')).toHaveLength(0);
  });
  it('the cell detail colours the selected number’s reading', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: cellLabel(5) }));
    const block = container.querySelector('.cell-detail .rule-block.reading-negative');
    expect(block).not.toBeNull();
    expect(block!.querySelector('.vtag')).toHaveTextContent('Challenge');
  });
  it('the print report uses the same colours and tags', async () => {
    const user = userEvent.setup();
    window.print = vi.fn(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
    const rep = container.querySelector('.print-report')!;
    expect(rep.querySelectorAll('.reading-positive .vtag, .reading-negative .vtag, .reading-neutral .vtag').length).toBeGreaterThan(10);
    expect(rep.querySelectorAll('table .reading')).toHaveLength(0);
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
  });
});

describe('Kua in the page', () => {
  it('shows both formulas for the default date and interprets none until a formula is chosen', async () => {
    const user = userEvent.setup();
    render(<App />);
    const sec = () => screen.getByRole('heading', { level: 3, name: 'Kua number (optional, Feng Shui)' }).closest('section')!;
    expect(sec()).toHaveTextContent('Born after Li Chun');
    expect(sec()).toHaveTextContent(/Both formulas are shown and neither is interpreted/);
    expect(sec()).toHaveTextContent('3 (east group: North, South, East, Southeast)'); // 02-06-1970: male 3 and female 3
    await user.selectOptions(screen.getByLabelText(/Kua formula/), 'male');
    expect(sec()).toHaveTextContent(/Kua 3 → east group/);
    expect(sec()).toHaveTextContent('Low confidence');
  });
  it('withholds the reading on 3-5 February and shows both candidates', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/);
    await user.clear(input);
    await user.type(input, '04-02-1985');
    await user.selectOptions(screen.getByLabelText(/Kua formula/), 'male');
    const sec = screen.getByRole('heading', { level: 3, name: 'Kua number (optional, Feng Shui)' }).closest('section')!;
    expect(sec).toHaveTextContent(/falls on 3, 4 or 5 February/);
    expect(sec).toHaveTextContent(/withheld because the date falls on 3–5 February/);
    expect(sec).toHaveTextContent('Before Li Chun');
    expect(sec.textContent).not.toMatch(/Kua \d → /);
  });
  it('the Indian pool mode is offered with its low-confidence note and changes the combined counts', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('radio', { name: /Indian pool rule/ })).toBeEnabled();
    expect(screen.getAllByText(/Low confidence: this rule appears in one search summary/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('radio', { name: /Indian pool rule/ }));
    // 02-06-1970: day 2 -> no Driver; Destiny 7 added, so 7 appears twice
    expect(screen.getByRole('button', { name: cellLabel(7) })).toHaveAccessibleName(/Appears 2 times/);
    expect(screen.getByRole('button', { name: cellLabel(2) })).toHaveAccessibleName(/Appears 1 time/);
  });
});

describe('PDF report', () => {
  it('has Report PDF and Print buttons next to Reset, enabled only for a valid date', async () => {
    const user = userEvent.setup();
    render(<App />);
    const pdf = screen.getByRole('button', { name: 'Report PDF' });
    const print = screen.getByRole('button', { name: 'Print / Save as PDF' });
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(pdf).toBeEnabled();
    expect(print).toBeEnabled();
    expect(pdf.parentElement).toBe(reset.parentElement);
    expect(print.parentElement).toBe(reset.parentElement);
    await user.clear(screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/));
    expect(pdf).toBeDisabled();
    expect(print).toBeDisabled();
  });
  it('Report PDF downloads a real PDF with a neutral file name, without network or storage', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      blob = b as Blob;
      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    const names: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Report PDF' }));
    await vi.waitFor(() => expect(names).toEqual(['lo-shu-report.pdf']));
    expect(blob!.type).toBe('application/pdf');
    expect(blob!.size).toBeGreaterThan(5000);
    expect(names[0]).not.toMatch(/1970|Puneet|Narayan/i);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    click.mockRestore();
    vi.unstubAllGlobals();
  });
  it('prints a complete report only while printing, with no storage, network or date in the title', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const print = vi.fn(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    window.print = print;
    const { container } = render(<App />);
    expect(container.querySelector('.print-report')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
    expect(print).toHaveBeenCalledTimes(1);
    const report = container.querySelector('.print-report') as HTMLElement;
    expect(report).not.toBeNull();
    const text = report.textContent ?? '';
    expect(text).toMatch(/Prepared for Puneet Narayan/);
    expect(text).toMatch(/Date of birth 02-06-1970/);
    for (const h of ['1. Grid', '2. Calculation audit', '3. The eight lines', '4. Interpretation (rule-based)', '5. Key numbers and how common the pattern is', '6. Optional readings', '7. Evidence and limitations', '8. Sources cited by the rules above']) expect(text).toContain(h);
    expect(text).toMatch(/2–7–6 is complete — Action plane/);
    expect(text).toMatch(/4–3–8 is entirely empty/);
    expect(text).toMatch(/Calculation verified/);
    expect(text).toMatch(/not scientifically validated/);
    expect(text).toMatch(/Rider:/); // low-confidence riders are printed too
    expect(text).toMatch(/Name numbers \(very low confidence\)/);
    expect(text).toMatch(/Personal year cycle \(very low confidence\)/);
    expect(text).toMatch(/Reported remedies \(low confidence\)/);
    expect(text).toMatch(/Kua number \(low confidence\)/);
    expect(text).toMatch(/Share of all 46,021 calendar dates/);
    expect(text).toMatch(/https:\/\//); // sources are listed with their URLs
    expect(text).not.toMatch(/\d+(\.\d+)?\s?%\s*(accura|confiden|match|likel)/i);
    // The default PDF file name comes from the page title; it must stay neutral and never be set from the date or name.
    expect(readFileSync('index.html', 'utf8')).toMatch(/<title>Lo Shu Grid Calculator<\/title>/);
    expect(readFileSync('src/App.tsx', 'utf8')).not.toMatch(/document\.title/);
    expect(document.title).not.toMatch(/1970|Puneet/);
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(container.querySelector('.print-report')).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('input and validation', () => {
  it('shows the fixed grid and an empty state after Reset', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText(/Enter a complete, valid date of birth above/)).toBeInTheDocument();
    for (const n of [4, 9, 2, 3, 5, 7, 8, 1, 6]) expect(screen.getByRole('button', { name: new RegExp(`^Number ${n}\\.`) })).toBeInTheDocument();
  });
  it('rejects an impossible date with a clear message and no result', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '31-04-2021');
    expect(screen.getByRole('alert')).toHaveTextContent(/does not exist/);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/)).toHaveAttribute('aria-invalid', 'true');
  });
  it('rejects ambiguous formats instead of guessing', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '1994-11-23');
    expect(screen.getByRole('alert')).toHaveTextContent(/YYYY-MM-DD/);
  });
  it('reset clears the date and the result', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    expect(screen.getByRole('status')).toHaveTextContent(/Calculation verified/);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/)).toHaveValue('');
  });
});

describe('results for 23-11-1994', () => {
  it('Advanced shows the audit, verified calculation and expected counts', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    expect(screen.getByRole('status')).toHaveTextContent(/Calculation verified/);
    expect(screen.getByRole('button', { name: cellLabel(1) })).toHaveAccessibleName(/Appears 3 times\. repeated/);
    expect(screen.getByRole('button', { name: cellLabel(5) })).toHaveAccessibleName(/Appears 0 times\. missing/);
    expect(screen.getByRole('button', { name: cellLabel(4) })).toHaveAccessibleName(/Appears 1 time\. present/);
    expect(screen.getByText(/Showing:/)).toHaveTextContent(/RAW DOB layer/);
    const audit = screen.getByText('Full digit sequence').closest('tr')!;
    expect(within(audit).getByText('2, 3, 1, 1, 1, 9, 9, 4')).toBeInTheDocument();
    expect(screen.getByText('Driver (Moolank)').closest('tr')!).toHaveTextContent('5');
    expect(screen.getByText('Destiny (Bhagyank)').closest('tr')!).toHaveTextContent('3');
  });
  it('Kua mode is disabled with an explanation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    const kua = screen.getByRole('radio', { name: /Kua \(unavailable\)/ });
    expect(kua).toBeDisabled();
    expect(screen.getAllByText(/not added to the date-of-birth grid/).length).toBeGreaterThan(0);
  });
  it('overlay mode changes the combined view but the raw layer label and audit stay put', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    await user.click(screen.getByRole('radio', { name: /^DOB \+ Driver \+ Destiny(?! \+ Kua)/ }));
    expect(screen.getByText(/Showing:/)).toHaveTextContent(/COMBINED/);
    expect(screen.getByRole('button', { name: cellLabel(5) })).toHaveAccessibleName(/Appears 1 time/);
    await user.click(screen.getByRole('radio', { name: 'Raw DOB' }));
    expect(screen.getByRole('button', { name: cellLabel(5) })).toHaveAccessibleName(/Appears 0 times/);
    const audit = screen.getByText('Full digit sequence').closest('tr')!;
    expect(within(audit).getByText('2, 3, 1, 1, 1, 9, 9, 4')).toBeInTheDocument();
  });
  it('Basic and Advanced show the same counts for the same date', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    const counts = () => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => screen.getByRole('button', { name: cellLabel(n) }).getAttribute('aria-label'));
    const adv = counts();
    await user.click(screen.getByRole('tab', { name: /Basic/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/Calculation verified/);
    expect(counts()).toEqual(adv);
    await user.click(screen.getByRole('tab', { name: /Advanced/ }));
    expect(counts()).toEqual(adv);
  });
  it('Basic has the ten required sections', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    await user.click(screen.getByRole('tab', { name: /Basic/ }));
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual([
      '1. Your Lo Shu Grid', '2. How Your Grid Was Calculated', '3. Numbers Present', '4. Repeated Numbers',
      '5. Missing Numbers', '6. Complete Lines', '7. Missing Lines', '8. Your Overall Interpretation',
      '9. Practical Reflection Suggestions', '10. Understanding the Limitations',
    ]);
    expect(screen.getAllByText(/4–9–2/).length).toBeGreaterThan(0);
  });
  it('selecting a cell explains it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterDate(user, '23-11-1994');
    await user.click(screen.getByRole('tab', { name: /Basic/ }));
    await user.click(screen.getByRole('button', { name: cellLabel(5) }));
    expect(screen.getByRole('heading', { name: /Number 5/ })).toBeInTheDocument();
    expect(screen.getAllByText(/missing 5 is read as an area for reflection/).length).toBeGreaterThan(0);
  });
  it('never shows an accuracy percentage', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await enterDate(user, '23-11-1994');
    expect(container.textContent).not.toMatch(/\d+(\.\d+)?\s?%\s*(accura|confiden|match|likel)/i);
    expect(container.textContent).toMatch(/not scientifically validated/);
  });
});

describe('privacy and safety', () => {
  it('does not use the network or browser storage for the date of birth', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    await enterDate(user, '23-11-1994');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe('');
    vi.unstubAllGlobals();
  });
  it('opens external source links safely and labels them as external', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await enterDate(user, '23-11-1994');
    const links = [...container.querySelectorAll('a')];
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toMatch(/noopener/);
      expect(a.getAttribute('rel')).toMatch(/noreferrer/);
      expect(a.textContent).toMatch(/external site/);
    }
    expect(container.innerHTML).not.toMatch(/dangerouslySetInnerHTML/);
  });
});

describe('help', () => {
  it('opens a help panel covering the ten required topics and a glossary', async () => {
    const user = userEvent.setup();
    render(<App />);
    const btn = screen.getByRole('button', { name: /Help: about this tab/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    const region = screen.getByRole('region', { name: 'About this tab' });
    expect(within(region).getAllByRole('listitem').length).toBeGreaterThanOrEqual(10);
    for (const t of ['What the grid is', 'What this does', 'Entering a date', 'How it is calculated', 'Present, repeated, missing', 'Arrows and planes', 'Driver and Destiny overlays', 'Reading the labels', 'Limitations', 'Why it is here']) {
      expect(within(region).getByText(new RegExp(t))).toBeInTheDocument();
    }
    expect(within(region).getByText('Glossary')).toBeInTheDocument();
    expect(within(region).getByText('Kua')).toBeInTheDocument();
  });
});
