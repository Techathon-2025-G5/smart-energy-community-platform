export function parseTotalsLog(log) {
  const result = {};
  if (!log) return result;
  Object.entries(log).forEach(([k, v]) => {
    let parts;
    try {
      parts = JSON.parse(k);
    } catch (_) {
      parts = k
        .replace(/[()]/g, '')
        .split(',')
        .map((p) => p.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (parts.length !== 3 || parts[0] !== 'totals') return;
    const [, mod, field] = parts;
    if (!result[mod]) result[mod] = {};
    result[mod][field] = v;
  });
  return result;
}

export function parseTotalsTotals(data) {
  const result = {};
  if (!data) return result;
  Object.entries(data).forEach(([k, v]) => {
    let parts;
    try {
      parts = JSON.parse(k);
    } catch (_) {
      parts = k
        .replace(/[()]/g, '')
        .split(',')
        .map((p) => p.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (parts.length !== 3 || parts[0] !== 'totals') return;
    const [, mod, field] = parts;
    if (!result[mod]) result[mod] = {};
    const val = typeof v === 'object' && v !== null ? Object.values(v)[0] : v;
    result[mod][field] = Number(val) || 0;
  });
  return result;
}
