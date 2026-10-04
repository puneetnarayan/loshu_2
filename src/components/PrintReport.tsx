import type { Report } from '../loshu';
import type { Extra } from '../data/schema';
import { reportBlocks } from '../report/blocks';
import type { Block, Brand } from '../report/blocks';

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

function renderBlock(b: Block, i: number) {
  switch (b.t) {
    case 'h1': return <h1 key={i}>{b.text}</h1>;
    case 'h2': return <h2 key={i}>{b.text}</h2>;
    case 'h3': return <h3 key={i}>{b.text}</h3>;
    case 'p': return <p key={i} className={b.style === 'note' ? 'note' : undefined}>{b.text}</p>;
    case 'ul': return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
    case 'table':
      return (
        <table key={i}>
          {b.caption && <caption>{b.caption}</caption>}
          {b.head && <thead><tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>}
          <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => (k === 0 && !b.head ? <th scope="row" key={k}>{c}</th> : <td key={k}>{c}</td>))}</tr>)}</tbody>
        </table>
      );
    case 'grid':
      return (
        <table key={i}>
          <caption>{b.caption}</caption>
          <tbody>
            {b.cells.map((row, r) => (
              <tr key={r}>
                {row.map((c) => (
                  <td key={c.digit} className="grid-cell">
                    <strong>{c.digit}</strong>
                    <br />
                    {c.line1}
                    <br />
                    <span className="small">{c.line2}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}
