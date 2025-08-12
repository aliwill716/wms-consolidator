export function getCell(file: { headers: string[] }, row: any, col: number, key?: string) {
  return Number.isInteger(col) ? (Array.isArray(row) ? row[col] : row[file.headers[col]]) 
                               : (key ? row?.[key] : undefined);
}

export const toBool = (v: any) => /^true|1|yes|y$/i.test(String(v ?? '').trim());
export const toNum = (v: any) => { const n = parseFloat(String(v ?? '').replace(/,/g,'')); return Number.isFinite(n)?n:undefined; };
export const clean = (s: any) => String(s ?? '').replace(/[\u200B-\u200D\uFEFF]/g,'').trim();
export const prefix3 = (s: string) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3); 