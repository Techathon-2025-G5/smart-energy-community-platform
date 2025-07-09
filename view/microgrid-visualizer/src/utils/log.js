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
