const BASE_URL = 'http://localhost:8000';

const request = async (method, path, data) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};

export const setupMicrogrid = (payload) => request('POST', '/setup', payload);
export const getComponents = (type) => request('GET', `/components${type ? `?type=${type}` : ''}`);
export const getActions = () => request('GET', '/actions');
export const getStatus = () => request('GET', '/status');
export const runStep = (actions) => request('POST', '/run', actions);
export const resetModel = () => request('POST', '/reset');
export const getProfiles = (component) =>
  request('GET', `/profiles${component ? `?component=${component}` : ''}`);
export const ping = () => request('GET', '/ping');

const apiClient = {
  setupMicrogrid,
  getComponents,
  getActions,
  getStatus,
  runStep,
  resetModel,
  getProfiles,
  ping,
};

export default apiClient;
