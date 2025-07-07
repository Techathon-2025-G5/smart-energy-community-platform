import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const setupMicrogrid = (payload) => api.post('/setup', payload);

export const getComponents = (type) => api.get('/components', { params: { type } });

export const getActions = () => api.get('/actions');

export const getStatus = () => api.get('/status');

export const runStep = (actions) => api.post('/run', actions);

export const resetModel = () => api.post('/reset');

export default {
  setupMicrogrid,
  getComponents,
  getActions,
  getStatus,
  runStep,
  resetModel,
};
