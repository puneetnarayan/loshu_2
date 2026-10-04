import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { EXTRAS } from '../src/data/schema';
import { buildReport } from '../src/loshu';
import { makeSafe, renderPdf } from '../src/pdf/renderPdf';
import { reportBlocks } from '../src/report/blocks';
import { dobOf } from './helpers';

const AS_OF = new Date(2026, 9, 4);
const opts = { name: 'Puneet Narayan', extras: [...EXTRAS], compareText: '23-11-1994', generated: '04 October 2026' };
const make = (dob = '02-06-1970') =>
  buildReport(dobOf(dob), 'dob-only', { extras: [...EXTRAS], name: opts.name, asOf: AS_OF, kuaFormula: 'male' });

describe('direct PDF', () => {
  it('produces a valid multi-page A4 PDF with neutral metadata (no name or date)', async () => {
    const bytes = await renderPdf(reportBlocks(make(), opts));
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toMatch(/^%PDF-1\./);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(5);
    expect(doc.getTitle()).toBe('Lo Shu Grid report');
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getSubject()).toBeUndefined();
    expect(doc.getKeywords()).toBeUndefined();
    const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
    expect([Math.round(w), Math.round(h)]).toEqual([595, 842]);
  });
  it('is built from the same report blocks as the print report (same section titles)', () => {
    const titles = reportBlocks(make(), opts).filter((b) => b.t === 'h2').map((b) => (b as { text: string }).text);
    expect(titles).toEqual([
      '1. Grid', '2. Calculation audit', '3. The eight lines', '4. Interpretation (rule-based)',
      '5. Key numbers and how common the pattern is', '6. Optional readings', '7. Evidence and limitations', '8. Sources cited by the rules above',
    ]);
  });
  it('contains the hand-checked facts and every low-confidence rider', () => {
    const text = JSON.stringify(reportBlocks(make(), opts));
    expect(text).toContain('Prepared for Puneet Narayan');
    expect(text).toContain('2–7–6 is complete');
    expect(text).toContain('56 → 11 → 2'); // Expression number chain
    expect(text).toContain('Low confidence: remedies come from');
    expect(text).toContain('Very low confidence: forecast-style');
    expect(text).toContain('Kua 3 (east group)');
    expect(text).toMatch(/Comparison with 23-11-1994/);
    expect(text).not.toMatch(/\d+(\.\d+)?\s?%\s*(accura|confiden|likel)/i);
  });
  it('replaces characters the standard fonts cannot encode instead of failing', async () => {
    const ok = (cp: number) => cp < 0x100; // Latin-1 only
    expect(makeSafe('a → b ≥ c ⚠ ✓ И', ok)).toBe('a -> b >= c (!) (ok) ?');
    expect(makeSafe('José – naïve', ok)).toBe('José ? naïve'); // the en dash is not Latin-1, so it becomes ?
    const bytes = await renderPdf(reportBlocks(make(), { ...opts, name: 'Иван Zoë' }));
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(5);
  });
  it('works with no optional readings and no comparison', async () => {
    const r = buildReport(dobOf('23-11-1994'), 'dob-only', { asOf: AS_OF });
    const bytes = await renderPdf(reportBlocks(r, { name: '', extras: [], compareText: '', generated: 'x' }));
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(3);
  });
});
