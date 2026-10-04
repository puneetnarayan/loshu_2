import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import { VALENCE_TAG } from '../data/valence';
import { TONE_KEY } from '../report/blocks';
import type { Block, Cell, GridSpec, Tone } from '../report/blocks';

const A4 = { w: 595.28, h: 841.89 };
const M = 48;
const INK = rgb(0.08, 0.1, 0.15);
const MUTED = rgb(0.3, 0.33, 0.4);
const LINE = rgb(0.72, 0.75, 0.81);
type Colour = ReturnType<typeof rgb>;
/** Pastel palette: green good, yellow medium, red not good, plus one lavender accent for headers. */
const TINT: Record<Tone, { bg: Colour; edge: Colour }> = {
  positive: { bg: rgb(0.89, 0.96, 0.91), edge: rgb(0.18, 0.49, 0.27) },
  neutral: { bg: rgb(0.99, 0.96, 0.84), edge: rgb(0.6, 0.48, 0.07) },
  negative: { bg: rgb(0.98, 0.89, 0.89), edge: rgb(0.69, 0.24, 0.24) },
  accent: { bg: rgb(0.9, 0.92, 0.98), edge: rgb(0.66, 0.72, 0.88) },
  plain: { bg: rgb(1, 1, 1), edge: rgb(0.72, 0.75, 0.81) },
};

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
    const lines = this.wrap(text, this.f.bold, size, A4.w - 2 * M - 16);
    const lh = size * 1.3;
    if (size >= 13) {
      const h = lines.length * lh + 8;
      const t = TINT.accent;
      this.page.drawRectangle({ x: M, y: this.y - h, width: A4.w - 2 * M, height: h, color: t.bg, borderColor: t.edge, borderWidth: 0.6 });
      if (size < 16) this.page.drawRectangle({ x: M, y: this.y - h, width: 4, height: h, color: t.edge });
      this.y -= 4;
      for (const ln of lines) {
        this.y -= lh;
        this.page.drawText(ln, { x: M + 10, y: this.y, size, font: this.f.bold, color: INK });
      }
      this.y -= 4 + 6;
      return;
    }
    for (const ln of lines) {
      this.y -= lh;
      this.page.drawText(ln, { x: M, y: this.y, size, font: this.f.bold, color: INK });
    }
    this.y -= 4;
  }
  legend() {
    this.ensure(40);
    let x = M;
    const size = 8.5;
    for (const v of ['positive', 'neutral', 'negative'] as const) {
      const label = VALENCE_TAG[v];
      const w = this.f.bold.widthOfTextAtSize(label, size) + 14;
      this.page.drawRectangle({ x, y: this.y - 14, width: w, height: 14, color: TINT[v].bg, borderColor: TINT[v].edge, borderWidth: 0.8 });
      this.page.drawText(label, { x: x + 7, y: this.y - 10.5, size, font: this.f.bold, color: INK });
      x += w + 8;
    }
    this.y -= 18;
    this.paragraph(TONE_KEY, { font: this.f.italic, size: 8.5, color: MUTED, gap: 6 });
  }
  table(head: string[] | undefined, rows: Array<Array<string | Cell>>, caption?: string, widthPct?: number[]) {
    const size = 8.5;
    const norm = rows.map((r) => r.map((c): Cell => (typeof c === 'string' ? { text: c } : c)));
    const cols = (head ?? rows[0]?.map(() => '') ?? []).length;
    if (cols === 0) return;
    if (caption) {
      this.ensure(60); // keep the caption with the head and first row
      this.paragraph(caption, { font: this.f.bold, size: 9, gap: 2 });
    }
    const usable = A4.w - 2 * M;
    const all = [...(head ? [head.map((text): Cell => ({ text }))] : []), ...norm];
    // Explicit widths win; otherwise column weights follow content length (bounded) so short columns stay narrow.
    const weights =
      widthPct && widthPct.length === cols
        ? widthPct
        : Array.from({ length: cols }, (_, c) => Math.min(42, Math.max(5, ...all.map((r) => Math.max(0, ...(r[c]?.text ?? '').split('\n').map((l) => l.length))))));
    const total = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => (w / total) * usable);
    const pad = 3;
    const drawRow = (cells: Cell[], isHead: boolean) => {
      const wrapped = cells.map((c, i) => this.wrap(c.text, isHead || c.bold ? this.f.bold : this.f.regular, size, widths[i]! - 2 * pad));
      const lines = Math.max(1, ...wrapped.map((w) => w.length));
      const h = lines * size * 1.3 + 2 * pad;
      this.ensure(h);
      const top = this.y;
      const bottom = top - h;
      let x = M;
      wrapped.forEach((w, i) => {
        const c = cells[i]!;
        const tone: Tone = isHead ? 'accent' : (c.tone ?? 'plain');
        const font = isHead || c.bold ? this.f.bold : this.f.regular;
        this.page.drawRectangle({ x, y: bottom, width: widths[i]!, height: h, color: TINT[tone].bg, borderColor: isHead ? TINT.accent.edge : LINE, borderWidth: 0.5 });
        w.forEach((ln, j) => {
          const tx = c.center ? x + (widths[i]! - font.widthOfTextAtSize(ln, size)) / 2 : x + pad;
          this.page.drawText(ln, { x: tx, y: top - pad - size - j * size * 1.3 + 2, size, font, color: INK });
        });
        x += widths[i]!;
      });
      this.y = bottom;
    };
    if (head) drawRow(head.map((text): Cell => ({ text })), true);
    norm.forEach((r) => drawRow(r, false));
    this.y -= 8;
  }
  /** One or more titled 3x3 grids side by side, wrapping to further rows when they do not fit. */
  grids(caption: string | undefined, size: 'large' | 'small', grids: GridSpec[]) {
    // Square cells keep every grid proportionate.
    const cw = size === 'large' ? 64 : 34;
    const ch = cw;
    const gap = 14;
    const gw = cw * 3;
    const titleH = grids.some((g) => g.title) ? 13 : 0;
    const gh = ch * 3 + titleH;
    if (caption) this.paragraph(caption, { font: this.f.bold, size: 9, gap: 3 });
    const usable = A4.w - 2 * M;
    const perRow = Math.max(1, Math.floor((usable + gap) / (gw + gap)));
    for (let start = 0; start < grids.length; start += perRow) {
      const rowGrids = grids.slice(start, start + perRow);
      this.ensure(gh + 8);
      const rowW = rowGrids.length * gw + (rowGrids.length - 1) * gap;
      const left = size === 'large' ? M + (usable - rowW) / 2 : M;
      const top = this.y;
      rowGrids.forEach((g, gi) => {
        const gx = left + gi * (gw + gap);
        if (g.title) {
          const tt = this.safe(g.title);
          this.page.drawText(tt, { x: gx + (gw - this.f.bold.widthOfTextAtSize(tt, 8)) / 2, y: top - 9, size: 8, font: this.f.bold, color: INK });
        }
        g.cells.forEach((row, r) =>
          row.forEach((c, k) => {
            const x = gx + k * cw;
            const y = top - titleH - (r + 1) * ch;
            this.page.drawRectangle({ x, y, width: cw, height: ch, color: TINT[c.tone].bg, borderColor: size === 'large' ? INK : TINT.accent.edge, borderWidth: size === 'large' ? 0.9 : 0.6 });
            const fs = size === 'large' ? 20 : 9;
            const subFs = size === 'large' ? 8.5 : 6.5;
            const main = this.safe(c.text);
            const lines = main.split('\n');
            const sub = c.sub ? this.safe(c.sub) : '';
            const blockH = lines.length * fs * 1.15 + (sub ? subFs + 3 : 0);
            let ty = y + ch / 2 + blockH / 2 - fs * 0.95;
            for (const ln of lines) {
              this.page.drawText(ln, { x: x + cw / 2 - this.f.bold.widthOfTextAtSize(ln, fs) / 2, y: ty, size: fs, font: this.f.bold, color: INK });
              ty -= fs * 1.15;
            }
            if (sub) this.page.drawText(sub, { x: x + cw / 2 - this.f.regular.widthOfTextAtSize(sub, subFs) / 2, y: ty - 1, size: subFs, font: this.f.regular, color: MUTED });
          }),
        );
      });
      this.y = top - gh - 8;
    }
    this.y -= 4;
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
      case 'legend': w.legend(); break;
      case 'table': w.table(b.head, b.rows, b.caption, b.widths); break;
      case 'grids': w.grids(b.caption, b.size, b.grids); break;
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
