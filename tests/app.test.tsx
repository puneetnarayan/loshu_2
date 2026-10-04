import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  await user.click(screen.getByRole('button', { name: 'Calculate' }));
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

describe('input and validation', () => {
  it('shows the fixed grid and an empty state before calculating', () => {
    render(<App />);
    expect(screen.getByText(/Enter a date of birth above/)).toBeInTheDocument();
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
