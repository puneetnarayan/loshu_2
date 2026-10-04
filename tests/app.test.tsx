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

describe('PDF report', () => {
  it('has a Report PDF button next to Reset, enabled only for a valid date', async () => {
    const user = userEvent.setup();
    render(<App />);
    const pdf = screen.getByRole('button', { name: 'Report PDF' });
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(pdf).toBeEnabled();
    expect(pdf.parentElement).toBe(reset.parentElement);
    await user.clear(screen.getByLabelText(/Date of birth \(DD-MM-YYYY\)/));
    expect(pdf).toBeDisabled();
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
    await user.click(screen.getByRole('button', { name: 'Report PDF' }));
    expect(print).toHaveBeenCalledTimes(1);
    const report = container.querySelector('.print-report') as HTMLElement;
    expect(report).not.toBeNull();
    const text = report.textContent ?? '';
    expect(text).toMatch(/Prepared for Puneet Narayan/);
    expect(text).toMatch(/Date of birth 02-06-1970/);
    for (const h of ['1. Grid', '2. Calculation audit', '3. The eight lines', '4. Interpretation (rule-based)', '5. Evidence and limitations', '6. Sources cited by the rules above']) expect(text).toContain(h);
    expect(text).toMatch(/2–7–6 is complete — Action plane/);
    expect(text).toMatch(/4–3–8 is entirely empty/);
    expect(text).toMatch(/Calculation verified/);
    expect(text).toMatch(/not scientifically validated/);
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
    expect(screen.getAllByText(/could not be verified from primary sources/).length).toBeGreaterThan(0);
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
