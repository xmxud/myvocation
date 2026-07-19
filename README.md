# 2026 年规划管理系统

一个现代化的分层规划和任务管理系统，采用前后端分离架构，支持无限层级的任务树、阶段划分、每日执行跟踪和智能统计分析。

## 🌟 核心特性

### 📊 灵活的规划结构
- **树形层级**: 主题 → 重点项 → 执行要点 → 具体任务（无限嵌套）
- **多维度跟踪**: 优先级、完成状态、进度百分比
- **阶段划分**: 为每个计划项划分执行阶段，明确时间线

### 📅 精细化执行管理
- **每日记录**: 记录每日的执行情况、完成度、笔记
- **图片附件**: 支持为执行记录添加图片
- **历史查询**: 按日期范围查询执行历史

### 📈 智能统计分析
- **多层次统计**: 主题、节点、阶段、日期范围的统计聚合
- **完成率计算**: 自动计算完成率和平均完成度
- **趋势分析**: 支持时间段对比分析

## 🚀 快速开始

### 系统要求
- Node.js >= 16.0
- npm >= 8.0

### 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 初始化数据库

```bash
cd backend
npm run init-db
```

### 启动服务

终端 1 - 后端：
```bash
cd backend
npm run dev
```

终端 2 - 前端：
```bash
cd frontend
npm run dev
```

### 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api

## 📁 项目结构

```
myvocation2026/
├── frontend/                      # React 前端
│   ├── src/pages/                 # 页面组件
│   ├── src/css/                   # 样式
│   ├── src/scripts/               # 工具函数
│   └── package.json
│
├── backend/                       # Node.js 后端
│   ├── db/                        # 数据库
│   ├── routes/                    # API 路由
│   ├── controllers/               # 业务逻辑
│   ├── utils/                     # 工具函数
│   ├── server.js                  # 应用入口
│   └── package.json
│
└── 📚 文档
    ├── QUICK_START.md
    ├── DATABASE_DESIGN.md
    ├── FRONTEND_INTEGRATION_GUIDE.md
    ├── API_QUICK_REFERENCE.md
    └── PROJECT_STATUS.md
```

## 🔌 API 概览

```
GET    /api/themes              # 获取主题（分页）
POST   /api/themes              # 创建主题
GET    /api/nodes/:id           # 获取节点
POST   /api/nodes               # 创建节点
GET    /api/phases/by-node/:id  # 获取阶段
POST   /api/daily-executions    # 记录执行
GET    /api/statistics/theme/:id # 获取统计
```

完整 API 文档见 [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)

## 📊 项目进度

| 阶段 | 任务 | 状态 |
|------|------|------|
| 第1阶段 | 数据库设计 | ✅ |
| 第2阶段 | 后端 API | ✅ |
| 第3阶段 | 前端集成 | 🔄 |
| 第4-6阶段 | 功能完善 | ⏳ |

## 📚 重要文档

- [QUICK_START.md](QUICK_START.md) - 快速开始指南
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md) - 数据库设计
- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) - 开发计划
- [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) - 前端集成
- [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) - API 参考
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 项目状态

## 🧪 测试 API

```bash
cd backend
.\test-api.ps1
```

## 💾 重置数据库

```bash
cd backend
npm run init-db
```
