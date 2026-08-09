# 前端集成指南（第四阶段）

## 🎯 目标
将前端从静态数据改为动态从后端 API 获取数据，实现完整的双向绑定。

## 📋 前端当前状态

### 已有的文件结构
```
frontend/
├── src/
│   ├── main.jsx              # 入口点
│   ├── App.jsx               # 根组件
│   └── pages/
│       ├── HomePage.jsx      # 首页
│       ├── PlansPage.jsx     # 规划页面（主要改造对象）
│       ├── VacationPage.jsx  # 假期页面
│       └── StudyPage.jsx     # 学习页面
├── css/
│   └── *.css                 # 样式文件
├── scripts/
│   └── utils.js              # 工具函数
└── package.json
```

### 当前的静态数据
PlansPage.jsx 中有以下硬编码的静态数据：
- THEMES（4 个主题）
- VACATION_TASKS（假期任务）
- STUDY_ITEMS（学习项）
- FOCUS_ITEMS（重点项）

## 🔧 第一步：创建 API 请求层

### 创建 frontend/src/utils/api.js

```javascript
// API 基础配置
const API_BASE_URL = 'http://localhost:3001/api';

// 响应处理
function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// 通用请求函数
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await handleResponse(response);
    
    if (data.code !== 0) {
      throw new Error(data.message || '请求失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('API 请求失败:', error);
    throw error;
  }
}

// 主题相关 API
export const themesApi = {
  // 获取所有主题（分页）
  getThemes: (page = 1, limit = 10) => 
    apiRequest(`/themes?page=${page}&limit=${limit}`),
  
  // 获取单个主题详情
  getTheme: (id) => 
    apiRequest(`/themes/${id}`),
  
  // 创建主题
  createTheme: (data) => 
    apiRequest('/themes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // 更新主题
  updateTheme: (id, data) => 
    apiRequest(`/themes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // 删除主题
  deleteTheme: (id) => 
    apiRequest(`/themes/${id}`, { method: 'DELETE' }),
};

// 节点相关 API
export const nodesApi = {
  // 获取节点详情
  getNode: (id) => 
    apiRequest(`/nodes/${id}`),
  
  // 获取子节点
  getChildren: (id) => 
    apiRequest(`/nodes/${id}/children`),
  
  // 获取完整树结构
  getFullTree: (id) => 
    apiRequest(`/nodes/${id}/full-tree`),
  
  // 创建节点
  createNode: (data) => 
    apiRequest('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // 更新节点
  updateNode: (id, data) => 
    apiRequest(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // 删除节点
  deleteNode: (id) => 
    apiRequest(`/nodes/${id}`, { method: 'DELETE' }),
};

// 阶段相关 API
export const phasesApi = {
  // 获取节点的所有阶段
  getPhasesByNode: (nodeId) => 
    apiRequest(`/phases/by-node/${nodeId}`),
  
  // 获取单个阶段
  getPhase: (id) => 
    apiRequest(`/phases/${id}`),
  
  // 创建阶段
  createPhase: (data) => 
    apiRequest('/phases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // 更新阶段
  updatePhase: (id, data) => 
    apiRequest(`/phases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // 删除阶段
  deletePhase: (id) => 
    apiRequest(`/phases/${id}`, { method: 'DELETE' }),
};

// 执行记录相关 API
export const executionsApi = {
  // 获取节点的所有执行记录
  getExecutions: (nodeId) => 
    apiRequest(`/daily-executions/${nodeId}`),
  
  // 创建执行记录
  createExecution: (data) => 
    apiRequest('/daily-executions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // 更新执行记录
  updateExecution: (id, data) => 
    apiRequest(`/daily-executions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // 删除执行记录
  deleteExecution: (id) => 
    apiRequest(`/daily-executions/${id}`, { method: 'DELETE' }),
};

// 统计相关 API
export const statisticsApi = {
  // 获取节点统计
  getNodeStats: (nodeId) => 
    apiRequest(`/statistics/node/${nodeId}`),
  
  // 获取主题统计
  getThemeStats: (themeId) => 
    apiRequest(`/statistics/theme/${themeId}`),
  
  // 获取日期范围统计
  getDateRangeStats: (startDate, endDate) => 
    apiRequest(`/statistics?startDate=${startDate}&endDate=${endDate}`),
};
```

## 🎨 第二步：创建通用组件库

### 创建 frontend/src/components/common/

1. **LoadingSpinner.jsx** - 加载指示器
```javascript
export default function LoadingSpinner() {
  return (
    <div className="spinner">
      <div className="loader"></div>
      <p>加载中...</p>
    </div>
  );
}
```

2. **Modal.jsx** - 模态框
```javascript
export default function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
```

3. **ConfirmDialog.jsx** - 确认对话框
4. **Pagination.jsx** - 分页器
5. **FormInput.jsx** - 表单输入
6. **ErrorAlert.jsx** - 错误提示

## 📄 第三步：改造 PlansPage.jsx

### 改造步骤

1. **导入 API 和 Hooks**
```javascript
import { useState, useEffect } from 'react';
import { themesApi, nodesApi } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
```

2. **替换静态数据为 State**
```javascript
const [themes, setThemes] = useState([]);
const [loading, setLoading] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [showThemeModal, setShowThemeModal] = useState(false);
const [selectedTheme, setSelectedTheme] = useState(null);
```

3. **添加数据加载逻辑**
```javascript
useEffect(() => {
  loadThemes();
}, [currentPage]);

async function loadThemes() {
  try {
    setLoading(true);
    const data = await themesApi.getThemes(currentPage);
    setThemes(data.themes);
  } catch (error) {
    console.error('加载主题失败:', error);
  } finally {
    setLoading(false);
  }
}
```

4. **实现分页导航**
```javascript
// 当主题数 > 4 时显示箭头
const showPagination = themes.length > 4;
```

5. **实现 CRUD 操作**
```javascript
async function handleCreateTheme(themeData) {
  try {
    await themesApi.createTheme(themeData);
    setShowThemeModal(false);
    loadThemes();
  } catch (error) {
    console.error('创建主题失败:', error);
  }
}

async function handleDeleteTheme(id) {
  if (confirm('确定要删除此主题吗？')) {
    try {
      await themesApi.deleteTheme(id);
      loadThemes();
    } catch (error) {
      console.error('删除主题失败:', error);
    }
  }
}
```

6. **动态加载重点项**
```javascript
async function handleThemeClick(themeId) {
  try {
    const focusItems = await nodesApi.getChildren(themeId);
    setSelectedTheme({
      id: themeId,
      focusItems: focusItems
    });
  } catch (error) {
    console.error('加载重点项失败:', error);
  }
}
```

## 📱 第四步：创建新页面

### DailyExecutionPage.jsx
- 显示今日任务列表
- 记录每日完成情况
- 添加笔记和图片
- 更新进度百分比

### StatisticsPage.jsx
- 显示周期统计信息
- 图表展示完成率趋势
- 时间段对比分析
- 主题和节点的统计数据

## 🔄 改造步骤优先级

### 优先级 1（必须）
- [x] 创建 API 请求层 (api.js)
- [ ] 改造 PlansPage 主题加载和分页
- [ ] 实现主题 CRUD（创建、更新、删除）
- [ ] 实现重点项 CRUD

### 优先级 2（重要）
- [ ] 改造 PlansPage 加载重点项详情
- [ ] 实现执行记录创建
- [ ] 创建 DailyExecutionPage
- [ ] 实现分页和搜索

### 优先级 3（增强）
- [ ] 创建 StatisticsPage
- [ ] 添加数据导出功能
- [ ] 实现离线缓存
- [ ] 性能优化

## 🧪 测试检查表

改造完成后需要验证：
- [ ] API 请求正确处理
- [ ] 错误情况正确处理
- [ ] 分页正确加载
- [ ] CRUD 操作成功更新界面
- [ ] 加载状态正确显示
- [ ] 响应式布局正确

## 📌 关键提示

1. **错误处理**: 所有 API 调用应使用 try-catch
2. **加载状态**: 显示加载指示器，防止用户重复操作
3. **数据刷新**: 操作后重新加载相关数据
4. **缓存考虑**: 考虑缓存主题列表以减少 API 调用
5. **时间戳**: 所有数据格式化日期和时间显示

## 💾 参考数据结构

### 主题对象
```javascript
{
  id: 1,
  title: "2026 年暑期规划",
  codename: "SUMMER 2026",
  description: "...",
  tag: "summer",
  progress_percent: 45,
  is_completed: 0,
  created_at: "2026-07-12 10:30:00"
}
```

### 节点对象
```javascript
{
  id: 5,
  node_type: "FOCUS_ITEM",
  title: "编程练习",
  codename: "CODE PRACTICE",
  parent_id: 1,
  priority: "HIGH",
  progress_percent: 60,
  is_completed: 0,
  created_at: "2026-07-12 10:30:00"
}
```

### 执行记录对象
```javascript
{
  id: 1,
  node_id: 5,
  execution_date: "2026-07-12",
  is_done: 1,
  completion_percent: 80,
  notes: "完成了基础算法题",
  images: ["url1", "url2"],
  created_at: "2026-07-12 15:30:00"
}
```

---

## ⏱️ 预计工时
- API 层 + 组件库: 2 小时
- PlansPage 改造: 3-4 小时
- 新页面创建: 2 小时
- 测试和优化: 2 小时

**总计**: 4-5 天开发时间
