import type { Report } from '../loshu';
import type { Extra } from '../data/schema';
import { reportBlocks } from '../report/blocks';
import { VALENCE_TAG } from '../data/valence';
import type { Block, Brand, Cell, GridSpec } from '../report/blocks';
import { TONE_KEY } from '../report/blocks';

/**
 * Printable report: renders the same block model as the PDF writer, so the two cannot drift apart.
 * It is only mounted while the browser is printing (see App). All text is rendered as plain text.
 */
export function PrintReport({ report, name, extras, compareText, brand }: { report: Report; name: string; extras: readonly Extra[]; compareText: string; brand?: Brand }) {
  const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const blocks = reportBlocks(report, { name, extras, compareText, generated, brand });
  return (
    <article className="print-report" aria-label="Printable report">
      {blocks.map((b, i) => renderBlock(b, i))}
    </article>
  );
}

const lines = (t: string) =>
  t.split('\n').map((l, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {l}
    </span>
  ));

const asCell = (c: string | Cell): Cell => (typeof c === 'string' ? { text: c } : c);

function GridBox({ g, size }: { g: GridSpec; size: 'large' | 'small' }) {
  return (
    <figure className={`pgrid pgrid-${size}`}>
      {g.title && <figcaption>{g.title}</figcaption>}
      <div className="pgrid-cells">
        {g.cells.flat().map((c, i) => (
          <div key={i} className={`pcell tone-${c.tone}`}>
            <strong>{c.text}</strong>
            {c.sub && <span className="small">{c.sub}</span>}
          </div>
        ))}
      </div>
    </figure>
  );
}

function renderBlock(b: Block, i: number) {
  switch (b.t) {
    case 'h1': return <h1 key={i} className="tone-accent">{b.text}</h1>;
    case 'h2': return <h2 key={i} className="tone-accent">{b.text}</h2>;
    case 'h3': return <h3 key={i}>{b.text}</h3>;
    case 'p': return <p key={i} className={b.style === 'note' ? 'note' : undefined}>{b.text}</p>;
    case 'ul': return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
    case 'legend':
      return (
        <div key={i} className="plegend">
          {(['positive', 'neutral', 'negative'] as const).map((v) => (
            <span key={v} className={`tone-${v}`}>{VALENCE_TAG[v]}</span>
          ))}
          <p className="note">{TONE_KEY}</p>
        </div>
      );
    case 'table':
      return (
        <table key={i}>
          {b.caption && <caption>{b.caption}</caption>}
          {b.widths && <colgroup>{b.widths.map((w, j) => <col key={j} style={{ width: `${w}%` }} />)}</colgroup>}
          {b.head && <thead><tr>{b.head.map((h, j) => <th key={j} className="tone-accent">{h}</th>)}</tr></thead>}
          <tbody>
            {b.rows.map((r, j) => (
              <tr key={j}>
                {r.map((raw, k) => {
                  const c = asCell(raw);
                  const cls = [c.tone ? `tone-${c.tone}` : '', c.bold ? 'b' : '', c.center ? 'c' : ''].filter(Boolean).join(' ') || undefined;
                  return <td key={k} className={cls}>{lines(c.text)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'grids':
      return (
        <div key={i} className="pgrids">
          {b.caption && <p className="pgrids-caption">{b.caption}</p>}
          <div className="pgrids-row">{b.grids.map((g, j) => <GridBox key={j} g={g} size={b.size} />)}</div>
        </div>
      );
  }
}
