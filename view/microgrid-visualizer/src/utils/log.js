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

export function getComponentState(status, log, type, idx) {
  const parsed = parseLog(log);
  const hist = parsed?.[type]?.[idx] || {};
  const fromStatus = status?.[type]?.[idx] || {};
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

export function buildCurrentStatus(status = {}, log = {}) {
  const parsed = parseLog(log);
  const result = {};
  const types = new Set([
    ...Object.keys(status || {}),
    ...Object.keys(parsed || {}),
  ]);
  types.forEach((type) => {
    const statusArr = status[type] || [];
    const logEntries = parsed[type] || {};
    const idxs = new Set([
      ...statusArr.map((_, i) => i),
      ...Object.keys(logEntries).map((i) => parseInt(i, 10)),
    ]);
    idxs.forEach((idx) => {
      if (!result[type]) result[type] = {};
      result[type][idx] = getComponentState(status, log, type, idx);
    });
  });

  return result;
}
