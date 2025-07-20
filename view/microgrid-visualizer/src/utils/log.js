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

export function splitLogLatest(log) {
  const parsed = parseLog(log);
  let lastStep = null;
  Object.values(parsed || {}).forEach((components) => {
    Object.values(components || {}).forEach((metrics) => {
      Object.values(metrics || {}).forEach((values) => {
        Object.keys(values || {}).forEach((s) => {
          const n = Number(s);
          if (!Number.isNaN(n) && (lastStep === null || n > lastStep)) {
            lastStep = n;
          }
        });
      });
    });
  });
  if (lastStep === null) return { history: {}, current: {} };
  const history = {};
  const current = {};
  Object.entries(parsed).forEach(([type, comps]) => {
    Object.entries(comps).forEach(([idx, metrics]) => {
      Object.entries(metrics).forEach(([metric, values]) => {
        Object.entries(values).forEach(([stepStr, val]) => {
          const step = Number(stepStr);
          if (step === lastStep) {
            if (!current[type]) current[type] = {};
            if (!current[type][idx]) current[type][idx] = {};
            current[type][idx][metric] = Number(val);
          } else {
            if (!history[type]) history[type] = {};
            if (!history[type][idx]) history[type][idx] = {};
            if (!history[type][idx][metric]) history[type][idx][metric] = {};
            history[type][idx][metric][step] = val;
          }
        });
      });
    });
  });
  return { history, current };
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
    const statusEntry = status[type] || [];
    const logEntries = parsed[type] || {};
    const statusIdxs = Array.isArray(statusEntry)
      ? statusEntry.map((_, i) => i)
      : Object.keys(statusEntry).map((i) => parseInt(i, 10));
    const idxs = new Set([
      ...statusIdxs,
      ...Object.keys(logEntries).map((i) => parseInt(i, 10)),
    ]);
    idxs.forEach((idx) => {
      if (!result[type]) result[type] = {};
      result[type][idx] = getComponentState(status, log, type, idx);
    });
  });

  return result;
}

