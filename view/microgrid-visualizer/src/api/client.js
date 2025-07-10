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
export const getLog = (asFrame = true, dropSingletonKey = false) =>
  request(
    'GET',
    `/log?as_frame=${asFrame}&drop_singleton_key=${dropSingletonKey}`
  );
export const runStep = (actions) => request('POST', '/run', actions);
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
  runStep,
  resetModel,
  getProfiles,
  ping,
  getControllerOptions,
};

export default apiClient;
