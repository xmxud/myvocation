# 2026 我在行动 · 个人规划管理系统

前后端分离的个人规划管理系统，支持多用户、树形任务层级、PDCA 阶段管理、每日执行跟踪、学习记录（错题/知识点/反思三位一体）和智能统计分析。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite 5，军绿黑战术美学 UI |
| 后端 | Python 3.12 + FastAPI + aiosqlite |
| 数据库 | SQLite 3（WAL 模式） |
| 认证 | JWT（python-jose + passlib） |

## 快速开始

### 一键启动

```bash
bash start.sh
```

### 分步启动

**后端**：
```bash
cd backend
pip install fastapi uvicorn aiosqlite pydantic pydantic-settings python-jose passlib python-multipart openpyxl
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

**前端**：
```bash
cd frontend
npm install
npm run dev
```

### 访问

- 前端页面：http://localhost:5173
- 后端 API：http://localhost:3001
- API 文档 (Swagger)：http://localhost:3001/docs

## 项目结构

```
myvocation/
├── start.sh                        # 一键启动脚本
├── README.md
├── frontend/                       # React 前端
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── utils/
│   │       └── api.js              # API 调用封装
│   ├── pages/
│   │   ├── HomePage.jsx            # 首页
│   │   └── PlansPage.jsx           # 规划页
│   ├── css/
│   │   └── styles.css              # 全局样式（军绿黑主题）
│   └── package.json
│
├── backend/                        # Python/FastAPI 后端
│   ├── app/
│   │   ├── main.py                 # FastAPI 入口
│   │   ├── config.py               # 配置（Pydantic Settings）
│   │   ├── database.py             # aiosqlite 封装
│   │   ├── core/
│   │   │   └── auth.py             # JWT + 密码哈希
│   │   ├── models/                 # Pydantic 模型
│   │   ├── services/               # 业务逻辑
│   │   └── routers/                # API 路由
│   │       ├── auth.py             # /api/auth/*
│   │       ├── nodes.py            # /api/themes, /api/nodes
│   │       ├── phases.py           # /api/phases, /api/task-schedules
│   │       ├── executions.py       # /api/daily-executions
│   │       └── learning.py         # /api/learning-records
│   ├── db/
│   │   ├── app.db                  # SQLite 数据库
│   │   └── migrate-v2.sql          # V2 迁移脚本
│   ├── requirements.txt
│   └── .env
│
├── backend_nodejs/                 # 旧 Node.js 后端（已迁移保留）
│
└── docs/
    ├── design/
    │   └── plans-v2-design.md      # V2 规划模块设计文档
    ├── QUICK_START.md              # 快速参考指南
    ├── DATABASE_DESIGN.md          # 数据库设计文档
    ├── API_QUICK_REFERENCE.md      # API 参考
    └── DEVELOPMENT_PLAN.md         # 开发计划
```

## API 总览

```
GET    /api/health                     # 健康检查
POST   /api/auth/register              # 注册
POST   /api/auth/login                 # 登录
GET    /api/themes?page=&size=         # 主题列表（分页）
POST   /api/themes                     # 创建主题
GET    /api/themes/:id                 # 主题详情
PUT    /api/themes/:id                 # 更新主题
DELETE /api/themes/:id                 # 删除主题
GET    /api/nodes/:id/children         # 子节点列表
GET    /api/nodes/:id/full-tree        # 完整节点树
POST   /api/nodes                      # 创建节点
PUT    /api/nodes/:id                  # 更新节点
DELETE /api/nodes/:id                  # 删除节点
GET    /api/phases/by-node/:nodeId     # 阶段列表
POST   /api/phases                     # 创建阶段
PUT    /api/phases/:id/scores          # 更新阶段评分
GET    /api/phases/:id/points?type=    # 阶段条目（goal/action/checkpoint）
POST   /api/task-schedules             # 创建自动调度
GET    /api/daily-executions/:nodeId   # 每日执行记录
GET    /api/learning-records?subject_id=&tags=&date=  # 学习记录
POST   /api/learning-records           # 新增学习记录
PUT    /api/learning-records/:id       # 补填知识点/反思
GET    /api/learning-records/stats/subject/:subjectId  # 科目统计
```

## 数据库表

| 表 | 说明 |
|----|------|
| users | 用户 |
| planning_nodes | 节点树（THEME → FOCUS_ITEM → TASK → SUBTASK） |
| phases_v2 | 阶段（含评分字段，支持子阶段） |
| phase_points | 阶段条目三合一（goal / action / checkpoint） |
| task_schedules | 定时任务调度 |
| daily_executions | 每日执行记录 |
| learning_records | 学习记录（题目+知识点+反思三位一体） |

详见 [docs/design/plans-v2-design.md](docs/design/plans-v2-design.md) 和 [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)。

## 文档索引

| 文档 | 说明 |
|------|------|
| [QUICK_START.md](docs/QUICK_START.md) | 快速参考指南 |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | 数据库设计 |
| [API_QUICK_REFERENCE.md](docs/API_QUICK_REFERENCE.md) | API 调用参考 |
| [design/plans-v2-design.md](docs/design/plans-v2-design.md) | V2 规划模块设计 |
| [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) | 开发计划 |
