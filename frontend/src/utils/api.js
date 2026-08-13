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
  // params 支持：phase_id / date / start_date / end_date / focus_id
  getExecutions: (nodeId, params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return request(`/daily-executions/${nodeId}${qs ? `?${qs}` : ''}`);
  },
  createExecution: (data) => request('/daily-executions', { method: 'POST', body: JSON.stringify(data) }),
  updateExecution: (id, data) => request(`/daily-executions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExecution: (id) => request(`/daily-executions/${id}`, { method: 'DELETE' }),
  // 上传执行附件到阿里云 OSS（multipart，不能走 request() 的 JSON 通道）
  uploadAttachment: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/daily-executions/upload-attachment`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload || payload.code !== 0) {
      throw new Error(payload?.message || `请求失败 (${res.status})`);
    }
    return payload.data;
  },
  // 清空某阶段下的全部执行任务
  clearPhaseExecutions: (phaseId) => request(`/daily-executions?phase_id=${phaseId}`, { method: 'DELETE' }),
  // 根据阶段行动指南（含父阶段）调用 AI 生成该阶段每天的执行任务
  aiGenerateFromGuide: (phaseId) => request('/daily-executions/ai-generate', { method: 'POST', body: JSON.stringify({ phase_id: phaseId }) }),
  // 学习计划导入模版下载地址
  planTemplateUrl: `${API_BASE_URL}/daily-executions/plan-template/download`,
  // 按导入模版样式导出某阶段计划的下载地址
  exportPlanUrl: (phaseId) => `${API_BASE_URL}/daily-executions/export-excel/${phaseId}`,
  // 导出某日计划打印表格的下载地址（后 4 列留空供手工填写）
  exportDailyUrl: (nodeId, date) =>
    `${API_BASE_URL}/daily-executions/export-daily/${nodeId}${date ? `?date=${date}` : ''}`,
  // 从 Excel 导入学习计划（multipart 上传，不能走 request() 的 JSON 通道）
  importPlanExcel: async (nodeId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/daily-executions/import-excel?node_id=${nodeId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload || payload.code !== 0) {
      throw new Error(payload?.message || `请求失败 (${res.status})`);
    }
    return payload;
  },
};

export const statisticsApi = {
  getNodeStats: (nodeId) => request(`/statistics/node/${nodeId}`),
  getThemeStats: (themeId) => request(`/statistics/theme/${themeId}`),
  getDateRangeStats: (startDate, endDate) => request(`/statistics?startDate=${startDate}&endDate=${endDate}`),
};

// ── 学习记录 API（错题/知识总结/反思，可关联执行任务 execution_id）──
export const learningRecordsApi = {
  // params 支持：subject_id / phase_id / tags / date / execution_id / mastery_level / knowledge_point
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return request(`/learning-records${qs ? `?${qs}` : ''}`);
  },
  create: (data) => request('/learning-records', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/learning-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/learning-records/${id}`, { method: 'DELETE' }),
  // 上传错题/反思附件到阿里云 OSS（multipart，不能走 request() 的 JSON 通道）
  uploadAttachment: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/learning-records/upload-attachment`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload || payload.code !== 0) {
      throw new Error(payload?.message || `请求失败 (${res.status})`);
    }
    return payload.data;
  },
};
