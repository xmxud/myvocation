# API 快速参考卡

> 后端: Python/FastAPI @ http://localhost:3001 | 前端: React/Vite @ http://localhost:5173

## 🚀 快速开始

### 导入 API
```javascript
import { themesApi, nodesApi, phasesApi, executionsApi, statisticsApi } from '../utils/api';
```

### 基本使用模式
```javascript
import { useState, useEffect } from 'react';
import { themesApi } from '../utils/api';

export default function MyComponent() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await themesApi.getThemes(1, 10);
      setThemes(data.themes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {themes.map(theme => (
        <div key={theme.id}>{theme.title}</div>
      ))}
    </div>
  );
}
```

## 📋 主题 API

### 获取主题列表
```javascript
// 获取第 1 页，每页 10 条
const data = await themesApi.getThemes(1, 10);
// 返回: { themes: [...], pagination: {...} }
```

### 获取单个主题
```javascript
const theme = await themesApi.getTheme(1);
// 返回: { id, title, codename, description, focusItems: [...] }
```

### 创建主题
```javascript
const newTheme = await themesApi.createTheme({
  title: '新主题',
  codename: 'NEW THEME',
  description: '这是一个新主题',
  tag: 'custom'
});
// 返回: { id, title, codename, ... }
```

### 更新主题
```javascript
const updated = await themesApi.updateTheme(1, {
  title: '更新的标题',
  progress_percent: 50
});
```

### 删除主题
```javascript
await themesApi.deleteTheme(1);
```

## 🌳 节点 API

### 获取节点
```javascript
const node = await nodesApi.getNode(5);
// 返回: { id, node_type, title, parent_id, priority, progress_percent, ... }
```

### 获取子节点
```javascript
const children = await nodesApi.getChildren(1);
// 返回: [{ id, title, node_type, ... }, ...]
```

### 获取完整树结构
```javascript
const tree = await nodesApi.getFullTree(1);
// 返回: 递归的树结构，包含所有后代
```

### 创建节点
```javascript
const newNode = await nodesApi.createNode({
  node_type: 'FOCUS_ITEM',  // THEME, FOCUS_ITEM, POINT, TASK
  title: '新的重点项',
  codename: 'NEW FOCUS',
  parent_id: 1,  // 父节点 ID
  priority: 'HIGH',  // LOW, MEDIUM, HIGH
  description: '这是一个新的重点项'
});
```

### 更新节点
```javascript
const updated = await nodesApi.updateNode(5, {
  progress_percent: 75,
  is_completed: 0
});
```

### 删除节点
```javascript
await nodesApi.deleteNode(5);
```

## 📅 阶段 API

### 获取节点的所有阶段
```javascript
const phases = await phasesApi.getPhasesByNode(5);
// 返回: [{ id, phase_number, title, start_date, end_date, points: [...] }, ...]
```

### 获取单个阶段
```javascript
const phase = await phasesApi.getPhase(10);
```

### 创建阶段
```javascript
const newPhase = await phasesApi.createPhase({
  node_id: 5,
  phase_number: 1,
  title: '第一阶段',
  start_date: '2026-07-01',
  end_date: '2026-07-20',
  description: '这是第一个阶段'
});
```

### 更新阶段
```javascript
const updated = await phasesApi.updatePhase(10, {
  title: '更新的阶段名称',
  end_date: '2026-07-25'
});
```

### 删除阶段
```javascript
await phasesApi.deletePhase(10);
```

## ✅ 执行记录 API

### 获取执行记录
```javascript
const executions = await executionsApi.getExecutions(5);
// 返回: [{ id, execution_date, is_done, completion_percent, notes, images, ... }, ...]
```

### 创建执行记录
```javascript
const today = new Date().toISOString().split('T')[0];
const execution = await executionsApi.createExecution({
  node_id: 5,
  execution_date: today,  // 格式: YYYY-MM-DD
  is_done: 1,  // 1 = 完成, 0 = 未完成
  completion_percent: 80,  // 0-100
  notes: '今天完成了核心任务'
});
```

### 更新执行记录
```javascript
const updated = await executionsApi.updateExecution(1, {
  completion_percent: 90,
  notes: '更新的笔记',
  is_done: 1
});
```

### 删除执行记录
```javascript
await executionsApi.deleteExecution(1);
```

## 📊 统计 API

### 节点统计
```javascript
const stats = await statisticsApi.getNodeStats(5);
// 返回: {
//   totalExecutions: 10,
//   completedExecutions: 8,
//   completionRate: 80,
//   avgCompletion: 75.5,
//   lastExecution: '2026-07-12'
// }
```

### 主题统计
```javascript
const stats = await statisticsApi.getThemeStats(1);
// 返回: {
//   focusItemsCount: 3,
//   totalExecutions: 25,
//   completionRate: 75,
//   avgCompletion: 78.5
// }
```

### 日期范围统计
```javascript
const stats = await statisticsApi.getDateRangeStats(
  '2026-07-01',
  '2026-07-12'
);
// 返回: {
//   dailyStats: {
//     '2026-07-01': { tasks: 5, completed: 4, avgCompletion: 85 },
//     ...
//   },
//   totalTasks: 50,
//   completionRate: 80
// }
```

## 🔑 数据结构

### 主题对象
```javascript
{
  id: 1,
  title: "暑期规划",
  codename: "SUMMER 2026",
  description: "2026年暑期学习和实践计划",
  tag: "summer",
  progress_percent: 45,
  is_completed: 0,
  created_at: "2026-07-12 07:35:27",
  // 可选的嵌套数据
  focusItems: [...]
}
```

### 节点对象
```javascript
{
  id: 5,
  node_type: "FOCUS_ITEM",  // THEME, FOCUS_ITEM, POINT, TASK
  title: "编程练习",
  codename: "CODE PRACTICE",
  description: "每天1小时编程练习",
  parent_id: 1,
  priority: "HIGH",  // LOW, MEDIUM, HIGH
  progress_percent: 60,
  is_completed: 0,
  sort_order: 1,
  created_at: "2026-07-12 10:30:00",
  // 可选的嵌套数据
  children: [...],
  descriptions: [...],
  images: [...]
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
  notes: "完成了基础算法题集的前10题",
  images: ["url1", "url2"],
  created_at: "2026-07-12 15:30:00",
  updated_at: "2026-07-12 16:45:00"
}
```

### 阶段对象
```javascript
{
  id: 10,
  node_id: 5,
  phase_number: 1,
  title: "第一阶段",
  description: "基础知识学习",
  start_date: "2026-07-01",
  end_date: "2026-07-20",
  target_completion: 80,
  created_at: "2026-07-12 10:30:00",
  // 嵌套阶段要点
  points: [
    { id: 1, content: "学习数据结构" },
    { id: 2, content: "完成10道算法题" }
  ]
}
```

## 🛠️ 常用代码片段

### 创建带加载状态的数据获取 Hook
```javascript
export function useFetchThemes(page = 1, limit = 10) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await themesApi.getThemes(page, limit);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit]);

  return { data, loading, error };
}

// 使用
const { data, loading, error } = useFetchThemes(1, 10);
```

### 处理创建/更新操作
```javascript
async function handleCreateTheme(formData) {
  try {
    setLoading(true);
    const newTheme = await themesApi.createTheme(formData);
    // 操作成功，刷新列表或更新状态
    await loadThemes();
    setShowModal(false);
    alert('创建成功');
  } catch (error) {
    console.error('创建失败:', error);
    alert(`创建失败: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### 处理删除操作
```javascript
async function handleDeleteTheme(id, title) {
  if (!confirm(`确定要删除"${title}"吗？`)) {
    return;
  }

  try {
    setLoading(true);
    await themesApi.deleteTheme(id);
    // 删除成功，刷新列表
    await loadThemes();
    alert('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
    alert(`删除失败: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

## ⏰ 时间相关

### 获取今天的日期字符串
```javascript
const today = new Date().toISOString().split('T')[0];
// 结果: "2026-07-12"
```

### 格式化日期显示
```javascript
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('zh-CN');
  // 结果: "2026/7/12"
}
```

## 🐛 调试技巧

### 打印 API 响应
```javascript
try {
  const result = await themesApi.getThemes();
  console.log('主题列表:', result);
  console.log('主题数:', result.themes.length);
  console.log('总数:', result.pagination.total);
  console.log('页数:', result.pagination.pages);
} catch (error) {
  console.error('API 错误:', error);
}
```

### 检查网络请求
打开浏览器开发者工具 (F12) → Network 标签，查看所有 API 请求

### 验证 CORS
确保请求的响应头包含：
```
Access-Control-Allow-Origin: *
```

---

**完整文档**: 参考 `FRONTEND_INTEGRATION_GUIDE.md`  
**API 端点列表**: 参考 `PROJECT_STATUS.md`
