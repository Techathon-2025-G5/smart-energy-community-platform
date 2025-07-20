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

export function splitTotalsLogLatest(log) {
  const parsed = parseTotalsLog(log);
  let lastStep = null;
  Object.values(parsed || {}).forEach((fields) => {
    Object.values(fields || {}).forEach((values) => {
      Object.keys(values || {}).forEach((s) => {
        const n = Number(s);
        if (!Number.isNaN(n) && (lastStep === null || n > lastStep)) {
          lastStep = n;
        }
      });
    });
  });
  if (lastStep === null) return { history: {}, current: {} };
  const history = {};
  const current = {};
  Object.entries(parsed).forEach(([mod, fields]) => {
    Object.entries(fields).forEach(([field, values]) => {
      Object.entries(values).forEach(([stepStr, val]) => {
        const step = Number(stepStr);
        if (step === lastStep) {
          if (!current[mod]) current[mod] = {};
          current[mod][field] = Number(val);
        } else {
          if (!history[mod]) history[mod] = {};
          if (!history[mod][field]) history[mod][field] = {};
          history[mod][field][step] = val;
        }
      });
    });
  });
  return { history: { totals: history }, current: { totals: current } };
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
