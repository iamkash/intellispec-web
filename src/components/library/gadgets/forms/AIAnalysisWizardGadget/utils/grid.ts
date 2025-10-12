/** Grid-related helpers: summarization and coercions */

export type GridColumnMeta = { key: string; title?: string; summary?: 'sum' | 'uniqueCount' | 'countMissing' | 'conditionStats'; format?: 'currency' | 'number' };

export function coerceNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const m = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

export function buildSummaryWidgets(rows: Array<Record<string, unknown>>, columns: GridColumnMeta[]) {
  const widgets: Array<{ title?: string; value: unknown; description?: string }> = [];
  widgets.push({ title: 'Total Rows', value: rows.length });
  for (const cm of columns) {
    const key = cm?.key; const label = cm?.title || String(key || ''); const sumType = cm?.summary;
    if (!key || !sumType) continue;
    const isCurrency = (cm as any)?.format === 'currency' || /usd$/i.test(String(key)) || /rateusd$/i.test(String(key)) || /amountusd$/i.test(String(key)) || /extendedusd$/i.test(String(key));
    const fmtCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
    if (sumType === 'sum') {
      const total = rows.reduce((acc, r) => acc + coerceNumber((r as any)[key]), 0);
      widgets.push({ title: `${label} Total`, value: isCurrency ? fmtCurrency(total) : total });
    } else if (sumType === 'uniqueCount') {
      const val = Array.from(new Set(rows.map((r) => String((r as any)[key] ?? '').trim().toLowerCase()).filter(Boolean))).length;
      widgets.push({ title: `${label} Unique`, value: val });
    } else if (sumType === 'countMissing') {
      const val = rows.filter((r) => !String((r as any)[key] ?? '').trim()).length;
      widgets.push({ title: `${label} Missing`, value: val });
    } else if (sumType === 'conditionStats') {
      // Special handling for condition statistics
      const conditions = rows.map((r) => String((r as any)[key] ?? '').trim()).filter(Boolean);
      const conditionCounts = conditions.reduce((acc, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Add individual condition counts
      Object.entries(conditionCounts).forEach(([condition, count]) => {
        widgets.push({ title: condition, value: count, description: `${condition} items` });
      });
    }
  }
  return widgets;
}


