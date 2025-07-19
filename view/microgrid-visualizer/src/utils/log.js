export function parseLog(log) {
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
    if (parts.length !== 3) return;
    const [type, idxStr, field] = parts;
    const idx = parseInt(idxStr, 10);
    if (!result[type]) result[type] = {};
    if (!result[type][idx]) result[type][idx] = {};
    result[type][idx][field] = v;
  });
  return result;
}

export function getComponentState(status, log, type, idx, manualMode = false) {
  const parsed = parseLog(log);
  const hist = parsed?.[type]?.[idx] || {};
  const fromStatus = status?.[type]?.[idx] || {};
  if (manualMode) {
    return { ...fromStatus };
  }
  const state = { ...fromStatus };
  Object.entries(hist).forEach(([metric, values]) => {
    const steps = Object.keys(values || {}).map(Number);
    if (steps.length > 0) {
      const last = Math.max(...steps);
      state[metric] = Number(values[last]);
    }
  });
  return state;
}
