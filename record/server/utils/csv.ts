export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = (cols[idx] ?? '').trim()));
    rows.push(obj);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; continue; }
      inQuotes = !inQuotes; continue;
    }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function toCSV(rows: any[], headers?: string[]): string {
  if (!rows?.length) return '';
  const keys = headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: any) => {
    const s = v === undefined || v === null ? '' : String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const head = keys.join(',');
  const body = rows.map(r => keys.map(k => esc(r[k])).join(',')).join('\n');
  return head + '\n' + body;
}
