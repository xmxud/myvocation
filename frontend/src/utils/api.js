const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token') || null;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    headers,
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

// ── Auth API ──
export const authApi = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, displayName, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, display_name: displayName, password }) }),
  me: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const themesApi = {
  getThemes: (page = 1, size = 20) => request(`/themes?page=${page}&size=${size}`),
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
  // 注意：后端实际端点为 PUT/DELETE /phases/points/{point_id}（见 backend/app/routers/phases.py）
  updatePoint: (pointId, data) => request(`/phases/points/${pointId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePoint: (pointId) => request(`/phases/points/${pointId}`, { method: 'DELETE' }),
};

export const executionsApi = {
  getExecutions: (nodeId) => request(`/daily-executions/${nodeId}`),
  createExecution: (data) => request('/daily-executions', { method: 'POST', body: JSON.stringify(data) }),
  updateExecution: (id, data) => request(`/daily-executions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExecution: (id) => request(`/daily-executions/${id}`, { method: 'DELETE' }),
  // 清空某阶段下的全部执行任务
  clearPhaseExecutions: (phaseId) => request(`/daily-executions?phase_id=${phaseId}`, { method: 'DELETE' }),
  // 根据阶段行动指南（含父阶段）调用 AI 生成该阶段每天的执行任务
  aiGenerateFromGuide: (phaseId) => request('/daily-executions/ai-generate', { method: 'POST', body: JSON.stringify({ phase_id: phaseId }) }),
};

export const statisticsApi = {
  getNodeStats: (nodeId) => request(`/statistics/node/${nodeId}`),
  getThemeStats: (themeId) => request(`/statistics/theme/${themeId}`),
  getDateRangeStats: (startDate, endDate) => request(`/statistics?startDate=${startDate}&endDate=${endDate}`),
};
