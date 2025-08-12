import { MoveRow } from './engine';

export function movesToCsv(rows: MoveRow[]): string {
  const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = ['sku', 'from_location', 'to_location', 'qty_to_move', 'reason', 'est_fill_after'];
  const body = rows.map(r => [r.sku, r.from, r.to, r.qty, r.reason, (r.estFillAfter * 100).toFixed(1) + '%'].map(esc).join(','));
  return [header.join(','), ...body].join('\n');
} 