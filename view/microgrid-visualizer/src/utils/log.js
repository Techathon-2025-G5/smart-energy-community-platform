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

export function buildCurrentStatus(
  status = {},
  log = {},
  manualMode = false,
  modules = [],
  manualActions = { battery: [], grid: [] }
) {
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
      result[type][idx] = getComponentState(status, log, type, idx, manualMode);
    });
  });

  if (!manualMode) {
    return result;
  }

  const batMods = modules
    .filter((m) => m.type === 'battery')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  batMods.forEach((m, i) => {
    const slider = manualActions.battery?.[i] ?? 0;
    if (!result.battery) result.battery = {};
    const state = result.battery[i] || {};
    const maxCap = Number(m.params?.max_capacity ?? 0) || 1;
    const current = Number(state.current_charge ?? 0);
    state.charge_amount = slider > 0 ? slider : 0;
    state.discharge_amount = slider < 0 ? -slider : 0;
    state.soc = Math.max(0, Math.min(1, (current + slider) / maxCap));
    result.battery[i] = state;
  });

  const gridMods = modules
    .filter((m) => m.type === 'grid')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  gridMods.forEach((m, i) => {
    const slider = manualActions.grid?.[i] ?? 0;
    if (!result.grid) result.grid = {};
    const state = result.grid[i] || {};
    const impPrice = Number(state.import_price_current ?? 0);
    const expPrice = Number(state.export_price_current ?? 0);
    const co2per = Number(state.co2_per_kwh_current ?? 0);
    const grid_import = slider < 0 ? -slider : 0;
    const grid_export = slider > 0 ? slider : 0;
    state.grid_import = grid_import;
    state.grid_export = grid_export;
    state.grid_spent = grid_import * impPrice;
    state.grid_earn = grid_export * expPrice;
    state.grid_balance = state.grid_earn - state.grid_spent;
    state.co2_production = grid_import * co2per;
    result.grid[i] = state;
  });

  const loadMods = modules
    .filter((m) => ['house', 'building'].includes(m.type))
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  const requests = loadMods.map((m, i) => {
    const state = result.load?.[i] || {};
    return Math.abs(Number(state.load_current ?? 0));
  });

  const renewableMods = modules
    .filter((m) => m.type === 'solar')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  const totalRenewable = renewableMods.reduce((acc, m, i) => {
    const val = Number(result.renewable?.[i]?.renewable_current ?? 0);
    return acc + val;
  }, 0);

  const totalLoads = requests.reduce((a, b) => a + b, 0);
  const totalGridImport = manualActions.grid.reduce(
    (a, v) => (v < 0 ? a + -v : a),
    0
  );
  const totalGridExport = manualActions.grid.reduce(
    (a, v) => (v > 0 ? a + v : a),
    0
  );
  const totalBatCharge = manualActions.battery.reduce(
    (a, v) => (v > 0 ? a + v : a),
    0
  );
  const totalBatDischarge = manualActions.battery.reduce((a, v, idx) => {
    if (v < 0) {
      const eff = Number(batMods[idx]?.params?.efficiency ?? 1);
      return a + -v * eff;
    }
    return a;
  }, 0);

  const energyBalance =
    totalRenewable +
    totalGridImport +
    totalBatDischarge -
    (totalLoads + totalGridExport + totalBatCharge);

  let remaining = totalLoads + energyBalance;
  loadMods.forEach((m, i) => {
    const met = Math.max(0, Math.min(requests[i], remaining));
    if (!result.load) result.load = {};
    const state = result.load[i] || {};
    state.load_met = met;
    result.load[i] = state;
    remaining -= met;
  });

  const loadMetTotal = loadMods.reduce((acc, _, i) => {
    return acc + (result.load?.[i]?.load_met ?? 0);
  }, 0);

  const renewableUsed = Math.min(
    totalRenewable,
    loadMetTotal + totalBatCharge
  );
  const ratio = totalRenewable > 0 ? renewableUsed / totalRenewable : 0;

  renewableMods.forEach((m, i) => {
    if (!result.renewable) result.renewable = {};
    const state = result.renewable[i] || {};
    const avail = Number(state.renewable_current ?? 0);
    state.renewable_used = avail * ratio;
    state.curtailment = avail - state.renewable_used;
    result.renewable[i] = state;
  });

  return result;
}
