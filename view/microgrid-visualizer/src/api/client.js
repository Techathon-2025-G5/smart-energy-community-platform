// Base de la API: permite override mediante REACT_APP_API_URL para entornos
// desplegados. En desarrollo se usa localhost de forma predeterminada.
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://smart-energy-api-production.up.railway.app');

// Expose the resolved URL without trailing slash for debugging purposes
export const API_BASE_URL = BASE_URL.replace(/\/+$/, '');

const request = async (method, path, data) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const url = new URL(path, BASE_URL);
  const res = await fetch(url.toString(), opts);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};

export const setupMicrogrid = (payload) => request('POST', '/setup', payload);
export const getComponents = (type) => request('GET', `/components${type ? `?type=${type}` : ''}`);
export const getActions = () => request('GET', '/actions');
export const getStatus = () => request('GET', '/status');
export const getLog = (asFrame = true, dropSingletonKey = false) =>
  request(
    'GET',
    `/log?as_frame=${asFrame}&drop_singleton_key=${dropSingletonKey}`
  );
export const getTotals = (asFrame = true, dropSingletonKey = false) =>
  request(
    'GET',
    `/totals?as_frame=${asFrame}&drop_singleton_key=${dropSingletonKey}`
  );
export const runStep = (actions) => request('POST', '/run', actions);
export const previewStep = (actions) => request('POST', '/preview', actions);
export const resetModel = () => request('POST', '/reset');
export const getProfiles = (component) =>
  request('GET', `/profiles${component ? `?component=${component}` : ''}`);
export const ping = () => request('GET', '/ping');
export const getControllerOptions = () =>
  request('GET', '/controller/get_options');

const apiClient = {
  setupMicrogrid,
  getComponents,
  getActions,
  getStatus,
  getLog,
  getTotals,
  runStep,
  previewStep,
  resetModel,
  getProfiles,
  ping,
  getControllerOptions,
};

export default apiClient;
