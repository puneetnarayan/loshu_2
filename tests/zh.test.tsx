import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { RULES } from '../src/data/catalogue';
import { buildReport } from '../src/loshu';
import {
  ZH_CONFIDENCE, ZH_DIGIT, ZH_FIDELITY, ZH_LINE, ZH_NOTICE, zhBasicText, zhDateError, zhFrequencyLabel, zhReflection, zhSummary,
} from '../src/i18n/zh';
import { dobOf } from './helpers';

afterEach(cleanup);

const HAN = /[一-鿿]/;
// Characters that exist only in Simplified Chinese; none may appear in Traditional text.
const SIMPLIFIED_ONLY = /[个们这国学说时为发开关门问见点从过还对种经动样现当无机实应并与书会长们爱边东买让车达从]/;
const BASIC_CATEGORIES = ['number', 'missing-number', 'repetition', 'line', 'empty-line', 'partial-line', 'driver', 'destiny'];

describe('Traditional Chinese texts', () => {
  it('every rule that the Basic tab can show has a translation, written in Chinese', () => {
    const rules = RULES.filter((r) => BASIC_CATEGORIES.includes(r.category));
    expect(rules).toHaveLength(45 + 16 + 16 + 18);
    for (const r of rules) {
      const t = zhBasicText(r);
      expect(t, r.id).toBeTruthy();
      expect(t, r.id).toMatch(HAN);
      expect(t, r.id).not.toMatch(/undefined|\[object/);
    }
  });
  it('every number and line rule has a Chinese reflection suggestion', () => {
    for (const r of RULES.filter((x) => ['number', 'missing-number', 'repetition', 'line', 'empty-line'].includes(x.category))) {
      expect(zhReflection(r), r.id).toMatch(HAN);
    }
  });
  it('rules outside the Basic scope have no translation (they stay English)', () => {
    for (const r of RULES.filter((x) => ['remedy', 'cycle', 'name', 'kua', 'element', 'relation', 'planet-profile'].includes(x.category))) {
      expect(zhBasicText(r)).toBeUndefined();
    }
  });
  it('tables are complete and contain no Simplified-only characters', () => {
    const all = [
      ZH_NOTICE, ...Object.values(ZH_DIGIT).flatMap((d) => Object.values(d)), ...Object.values(ZH_LINE).flatMap((l) => Object.values(l)),
      ...Object.values(ZH_FIDELITY), ...Object.values(ZH_CONFIDENCE).flatMap((c) => [c.short, c.rider]),
      ...RULES.filter((r) => BASIC_CATEGORIES.includes(r.category)).map((r) => zhBasicText(r)!),
      ...RULES.filter((r) => BASIC_CATEGORIES.includes(r.category)).map((r) => zhReflection(r) ?? ''),
    ];
    for (const t of all) expect(t).not.toMatch(SIMPLIFIED_ONLY);
    expect(Object.keys(ZH_DIGIT)).toHaveLength(9);
    expect(Object.keys(ZH_LINE)).toHaveLength(8);
  });
  it('the notice says the translation is unreviewed and that Advanced and the PDF stay English', () => {
    expect(ZH_NOTICE).toMatch(/尚未經母語人士審閱/);
    expect(ZH_NOTICE).toMatch(/進階頁/);
    expect(ZH_NOTICE).toMatch(/PDF/);
  });
  it('the Chinese summary is built from the same triggered rules (02-06-1970)', () => {
    const r = buildReport(dobOf('02-06-1970'), 'dob-only');
    const s = zhSummary(r).join('');
    expect(s).toContain('行動層面（2–7–6）完整');
    expect(s).toContain('思考與規劃層面（4–3–8）全空');
    expect(s).toContain('缺少 3');
    expect(s).toContain('驅動數 2');
    expect(s).toContain('命運數 7');
    expect(s).toContain('不是對個人的客觀事實');
  });
  it('frequency labels and date errors are translated', () => {
    expect(zhFrequencyLabel('complete-V-276')).toBe('2–7–6 線完整');
    expect(zhFrequencyLabel('missing-count-4')).toBe('九個數字中恰好缺少 4 個');
    expect(zhDateError('Day 31 does not exist in month 04 of 2021 (that month has 30 days).')).toBe('2021 年 04 月沒有 31 日（該月有 30 天）。');
    expect(zhDateError('A date of birth cannot be in the future.')).toBe('出生日期不能是未來的日期。');
  });
});

describe('language switch in the page', () => {
  it('starts in English and switches to Traditional Chinese for the interface and the Basic reading', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lo Shu Grid Calculator');
    await user.click(screen.getByRole('button', { name: '繁體中文' }));
    expect(container.querySelector('.app')).toHaveAttribute('lang', 'zh-Hant');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('洛書九宮格計算器');
    expect(screen.getByText(ZH_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(/解讀對象：/)).toHaveTextContent('解讀對象：Puneet Narayan · 出生日期 02-06-1970');
    expect(screen.getByRole('button', { name: '報告 PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重設' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /基本/ }));
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['1. 你的洛書九宮格', '2. 九宮格如何計算', '3. 出現的數字', '4. 重複的數字', '5. 缺少的數字', '6. 完整的線', '7. 缺少的線', '8. 你的整體解讀', '9. 實用的反思建議', '10. 了解限制']);
    expect(screen.getByText(/傳統上，缺少 3 被視為值得反思/)).toBeInTheDocument();
    expect(screen.getByText(/你的驅動數是 2/)).toBeInTheDocument();
    expect(screen.getByText(/你的命運數是 7/)).toBeInTheDocument();
    expect(screen.getByText(/此線完整。傳統上稱為「行動層面」/)).toBeInTheDocument();
    expect(container.querySelectorAll('.chip-low').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('傳統解讀・未經科學驗證');
    expect(container.textContent).toContain('⚠ 低信心');
    expect(container.textContent).toContain('✓ 計算已驗證');
  });
  it('grid cells get Chinese accessible names and keywords', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '繁體中文' }));
    const cell = screen.getByRole('button', { name: /^數字 2，/ });
    expect(cell).toHaveAccessibleName(/右上。出現 1 次。出現。/);
    await user.click(screen.getByRole('button', { name: /^數字 3，/ }));
    expect(screen.getByRole('heading', { level: 4, name: /數字 3 · 中左|數字 3 · 左中/ })).toBeInTheDocument();
  });
  it('the Advanced tab stays English under the notice, and switching back restores English', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '繁體中文' }));
    expect(screen.getByRole('tab', { name: /進階/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 3, name: 'Calculation audit' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.queryByText(ZH_NOTICE)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
  it('shows the Chinese help and glossary', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '繁體中文' }));
    await user.click(screen.getByRole('button', { name: '說明：關於本頁' }));
    const region = screen.getByRole('region', { name: '關於本頁' });
    expect(within(region).getAllByRole('listitem').length).toBeGreaterThanOrEqual(10);
    expect(within(region).getByText('詞彙表')).toBeInTheDocument();
    expect(within(region).getByText('卦數（Kua）')).toBeInTheDocument();
  });
  it('Chinese date errors', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '繁體中文' }));
    const input = screen.getByLabelText(/出生日期 \(DD-MM-YYYY\)/);
    await user.clear(input);
    await user.type(input, '31-04-2021');
    expect(screen.getByRole('alert')).toHaveTextContent('2021 年 04 月沒有 31 日');
  });
});
