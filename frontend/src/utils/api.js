const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.code !== 0) {
    throw new Error(payload?.message || `请求失败 (${response.status})`);
  }

  return payload.data;
}

export const themesApi = {
  getThemes: (page = 1, limit = 10) => request(`/themes?page=${page}&limit=${limit}`),
  getTheme: (id) => request(`/themes/${id}`),
  createTheme: (data) => request('/themes', { method: 'POST', body: JSON.stringify(data) }),
  updateTheme: (id, data) => request(`/themes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTheme: (id) => request(`/themes/${id}`, { method: 'DELETE' }),
};

export const nodesApi = {
  getNode: (id) => request(`/nodes/${id}`),
  getChildren: (id) => request(`/nodes/${id}/children`),
  getFullTree: (id) => request(`/nodes/${id}/full-tree`),
  createNode: (data) => request('/nodes', { method: 'POST', body: JSON.stringify(data) }),
  updateNode: (id, data) => request(`/nodes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNode: (id) => request(`/nodes/${id}`, { method: 'DELETE' }),
  getDescriptions: (id) => request(`/nodes/${id}/descriptions`),
  addDescription: (id, data) => request(`/nodes/${id}/descriptions`, { method: 'POST', body: JSON.stringify(data) }),
  updateDescription: (id, descId, data) => request(`/nodes/${id}/descriptions/${descId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDescription: (id, descId) => request(`/nodes/${id}/descriptions/${descId}`, { method: 'DELETE' }),
};

export const phasesApi = {
  getPhasesByNode: (nodeId) => request(`/phases/by-node/${nodeId}`),
  getPhase: (id) => request(`/phases/${id}`),
  createPhase: (data) => request('/phases', { method: 'POST', body: JSON.stringify(data) }),
  updatePhase: (id, data) => request(`/phases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePhase: (id) => request(`/phases/${id}`, { method: 'DELETE' }),
  addPoint: (phaseId, data) => request(`/phases/${phaseId}/points`, { method: 'POST', body: JSON.stringify(data) }),
  updatePoint: (phaseId, pointId, data) => request(`/phases/${phaseId}/points/${pointId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePoint: (phaseId, pointId) => request(`/phases/${phaseId}/points/${pointId}`, { method: 'DELETE' }),
};

export const executionsApi = {
  getExecutions: (nodeId) => request(`/daily-executions/${nodeId}`),
  createExecution: (data) => request('/daily-executions', { method: 'POST', body: JSON.stringify(data) }),
  updateExecution: (id, data) => request(`/daily-executions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExecution: (id) => request(`/daily-executions/${id}`, { method: 'DELETE' }),
};

export const statisticsApi = {
  getNodeStats: (nodeId) => request(`/statistics/node/${nodeId}`),
  getThemeStats: (themeId) => request(`/statistics/theme/${themeId}`),
  getDateRangeStats: (startDate, endDate) => request(`/statistics?startDate=${startDate}&endDate=${endDate}`),
};
