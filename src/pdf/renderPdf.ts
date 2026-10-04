import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type { Block } from '../report/blocks';

const A4 = { w: 595.28, h: 841.89 };
const M = 48;
const INK = rgb(0.08, 0.1, 0.15);
const MUTED = rgb(0.3, 0.33, 0.4);
const LINE = rgb(0.45, 0.48, 0.55);
const FILL = rgb(0.93, 0.95, 0.99);

/** Characters the standard PDF fonts cannot encode are replaced by readable equivalents. */
const REPLACEMENTS: Record<string, string> = {
  '→': '->', '≥': '>=', '≤': '<=', '⚠': '(!)', '✓': '(ok)', '✗': '(x)', '○': 'o', '↻': '(r)', '●': '*', '∅': 'none',
  '−': '-', '‘': "'", '’': "'", '“': '"', '”': '"', ' ': ' ', '…': '...',
};

export function makeSafe(text: string, encodable: (cp: number) => boolean): string {
  let out = '';
  for (const ch of text.normalize('NFC')) {
    const mapped = REPLACEMENTS[ch] ?? ch;
    for (const c of mapped) out += c === '\n' || encodable(c.codePointAt(0)!) ? c : '?';
  }
  return out;
}

interface Fonts { regular: PDFFont; bold: PDFFont; italic: PDFFont }

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(private doc: PDFDocument, private f: Fonts, private ok: (cp: number) => boolean) {
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage([A4.w, A4.h]);
    this.y = A4.h - M;
  }
  ensure(h: number) {
    if (this.y - h < M + 18) this.newPage();
  }
  safe(t: string) {
    return makeSafe(t, this.ok);
  }
  /** Greedy word wrap that also splits over-long words (such as URLs). */
  wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const lines: string[] = [];
    for (const para of this.safe(text).split('\n')) {
      let cur = '';
      for (const word of para.split(' ')) {
        const attempt = cur ? `${cur} ${word}` : word;
        if (font.widthOfTextAtSize(attempt, size) <= maxW) {
          cur = attempt;
          continue;
        }
        if (cur) lines.push(cur);
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > maxW) {
          let n = rest.length;
          while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > maxW) n--;
          lines.push(rest.slice(0, n));
          rest = rest.slice(n);
        }
        cur = rest;
      }
      lines.push(cur);
    }
    return lines;
  }
  paragraph(text: string, o: { font: PDFFont; size: number; color?: ReturnType<typeof rgb>; indent?: number; gap?: number; bullet?: boolean }) {
    const indent = o.indent ?? 0;
    const lh = o.size * 1.35;
    const lines = this.wrap(text, o.font, o.size, A4.w - 2 * M - indent);
    lines.forEach((ln, i) => {
      this.ensure(lh);
      this.y -= lh;
      if (o.bullet && i === 0) this.page.drawText('-', { x: M + indent - 9, y: this.y, size: o.size, font: o.font, color: o.color ?? INK });
      this.page.drawText(ln, { x: M + indent, y: this.y, size: o.size, font: o.font, color: o.color ?? INK });
    });
    this.y -= o.gap ?? 4;
  }
  heading(text: string, size: number, gapBefore: number) {
    // Keep a heading with the start of what follows it: start a new page if little room is left.
    this.ensure(size >= 13 ? 110 : size >= 10 ? 70 : size * 2.5);
    this.y -= gapBefore;
    const lines = this.wrap(text, this.f.bold, size, A4.w - 2 * M);
    for (const ln of lines) {
      this.y -= size * 1.3;
      this.page.drawText(ln, { x: M, y: this.y, size, font: this.f.bold, color: INK });
    }
    if (size >= 13) {
      this.y -= 3;
      this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4.w - M, y: this.y }, thickness: 0.8, color: LINE });
    }
    this.y -= 4;
  }
  table(head: string[] | undefined, rows: string[][], caption?: string) {
    const size = 8.5;
    const cols = (head ?? rows[0] ?? []).length;
    if (cols === 0) return;
    if (caption) this.paragraph(caption, { font: this.f.bold, size: 9, gap: 2 });
    const usable = A4.w - 2 * M;
    const all = head ? [head, ...rows] : rows;
    // Column weights follow content length (bounded) so short columns stay narrow.
    const weights = Array.from({ length: cols }, (_, c) => Math.min(42, Math.max(5, ...all.map((r) => (r[c] ?? '').length))));
    const total = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => (w / total) * usable);
    const pad = 3;
    const drawRow = (cells: string[], bold: boolean, shade: boolean) => {
      const font = bold ? this.f.bold : this.f.regular;
      const wrapped = cells.map((c, i) => this.wrap(c ?? '', font, size, widths[i]! - 2 * pad));
      const lines = Math.max(...wrapped.map((w) => w.length));
      const h = lines * size * 1.3 + 2 * pad;
      this.ensure(h);
      const top = this.y;
      const bottom = top - h;
      if (shade) this.page.drawRectangle({ x: M, y: bottom, width: usable, height: h, color: FILL });
      let x = M;
      wrapped.forEach((w, i) => {
        this.page.drawRectangle({ x, y: bottom, width: widths[i]!, height: h, borderColor: LINE, borderWidth: 0.5 });
        w.forEach((ln, j) => this.page.drawText(ln, { x: x + pad, y: top - pad - size - j * size * 1.3 + 2, size, font, color: INK }));
        x += widths[i]!;
      });
      this.y = bottom;
    };
    if (head) drawRow(head, true, true);
    rows.forEach((r) => drawRow(r, false, false));
    this.y -= 8;
  }
  grid(caption: string, cells: Array<Array<{ digit: number; line1: string; line2: string }>>) {
    const cw = 120;
    const ch = 52;
    this.paragraph(caption, { font: this.f.bold, size: 9, gap: 3 });
    this.ensure(ch * 3 + 8);
    const left = M + (A4.w - 2 * M - cw * 3) / 2;
    const top = this.y;
    cells.forEach((row, r) =>
      row.forEach((c, k) => {
        const x = left + k * cw;
        const y = top - (r + 1) * ch;
        this.page.drawRectangle({ x, y, width: cw, height: ch, borderColor: INK, borderWidth: 1 });
        const d = String(c.digit);
        this.page.drawText(d, { x: x + cw / 2 - this.f.bold.widthOfTextAtSize(d, 18) / 2, y: y + ch - 21, size: 18, font: this.f.bold, color: INK });
        const l1 = this.safe(c.line1);
        const l2 = this.safe(c.line2);
        this.page.drawText(l1, { x: x + cw / 2 - this.f.regular.widthOfTextAtSize(l1, 8.5) / 2, y: y + 17, size: 8.5, font: this.f.regular, color: INK });
        this.page.drawText(l2, { x: x + cw / 2 - this.f.regular.widthOfTextAtSize(l2, 7.5) / 2, y: y + 6, size: 7.5, font: this.f.regular, color: MUTED });
      }),
    );
    this.y = top - ch * 3 - 10;
  }
}

/**
 * Renders the report blocks into a PDF. Metadata is deliberately neutral: the title is generic and no author is set,
 * so the file does not carry the name or date of birth outside its visible text.
 */
export async function renderPdf(blocks: Block[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Lo Shu Grid report');
  doc.setCreator('Lo Shu Grid Calculator');
  doc.setProducer('Lo Shu Grid Calculator');
  doc.setCreationDate(new Date());
  const f: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const set = new Set(f.regular.getCharacterSet());
  const w = new Writer(doc, f, (cp) => set.has(cp));
  for (const b of blocks) {
    switch (b.t) {
      case 'h1': w.heading(b.text, 18, 0); break;
      case 'h2': w.heading(b.text, 13, 12); break;
      case 'h3': w.heading(b.text, 10.5, 6); break;
      case 'p': w.paragraph(b.text, { font: b.style === 'note' ? f.italic : f.regular, size: 9.5, color: b.style === 'note' ? MUTED : INK }); break;
      case 'ul': b.items.forEach((it) => w.paragraph(it, { font: f.regular, size: 9, indent: 14, bullet: true, gap: 3 })); w.y -= 2; break;
      case 'table': w.table(b.head, b.rows, b.caption); break;
      case 'grid': w.grid(b.caption, b.cells); break;
    }
  }
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const t = `Page ${i + 1} of ${pages.length}`;
    p.drawText(t, { x: A4.w - M - f.regular.widthOfTextAtSize(t, 8), y: 24, size: 8, font: f.regular, color: MUTED });
    p.drawText('Traditional readings; not scientifically validated.', { x: M, y: 24, size: 8, font: f.regular, color: MUTED });
  });
  return doc.save({ useObjectStreams: false });
}

export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
