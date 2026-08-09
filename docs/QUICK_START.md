# 快速参考指南

## 项目概述

这是一个前后端分离的个人规划管理系统，用于追踪和管理多层级的规划、任务、阶段执行和学习积累。

### 项目结构

```
myvocation/
├── frontend/                 # React 前端 (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── utils/api.js      # API 封装
│   ├── pages/
│   │   ├── HomePage.jsx      # 首页
│   │   └── PlansPage.jsx     # 规划页
│   ├── css/styles.css        # 军绿黑主题
│   └── package.json
│
├── backend/                  # Python/FastAPI 后端
│   ├── app/
│   │   ├── main.py           # FastAPI 入口
│   │   ├── config.py         # 配置
│   │   ├── database.py       # aiosqlite 封装
│   │   ├── core/auth.py      # JWT 认证
│   │   ├── models/           # Pydantic 模型
│   │   ├── services/         # 业务逻辑
│   │   └── routers/          # API 路由
│   ├── db/
│   │   ├── app.db            # SQLite 数据库
│   │   └── migrate-v2.sql    # V2 迁移
│   ├── requirements.txt
│   └── .env
│
├── backend_nodejs/           # 旧 Node.js 后端（保留参考）
├── docs/                     # 文档
└── start.sh                  # 一键启动
```

---

## 快速开始

### 一键启动

```bash
cd myvocation
bash start.sh
```

### 手动启动

**1. 后端**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

**2. 前端**

```bash
cd frontend
npm install
npm run dev
```

**3. 访问**

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- API 文档：http://localhost:3001/docs

---

## API 端点汇总

### 认证
```
POST /api/auth/register     - 注册
POST /api/auth/login        - 登录
```

### 主题/节点
```
GET    /api/themes?page=&size=   - 主题列表
POST   /api/themes               - 创建主题
GET    /api/themes/:id           - 主题详情
PUT    /api/themes/:id           - 更新主题
DELETE /api/themes/:id           - 删除主题
GET    /api/nodes/:id/children   - 子节点列表
GET    /api/nodes/:id/full-tree  - 完整树
POST   /api/nodes                - 创建节点
PUT    /api/nodes/:id            - 更新节点
DELETE /api/nodes/:id            - 删除节点
POST   /api/nodes/:id/descriptions - 添加描述
DELETE /api/nodes/:id/descriptions/:descId - 删除描述
POST   /api/nodes/:id/images     - 添加图片
DELETE /api/nodes/:id/images/:imageId - 删除图片
```

### 阶段
```
GET    /api/phases/by-node/:nodeId   - 阶段列表
GET    /api/phases/:id               - 阶段详情
POST   /api/phases                   - 创建阶段
PUT    /api/phases/:id               - 更新阶段
DELETE /api/phases/:id               - 删除阶段
PUT    /api/phases/:id/scores        - 更新评分
GET    /api/phases/:id/points?type=  - 阶段条目
POST   /api/phases/:id/points        - 添加条目
PUT    /api/phases/points/:pointId   - 更新条目
DELETE /api/phases/points/:pointId   - 删除条目
```

### 任务调度
```
GET    /api/task-schedules?phase_id=  - 调度列表
POST   /api/task-schedules             - 创建调度
PUT    /api/task-schedules/:id         - 更新调度
DELETE /api/task-schedules/:id         - 删除调度
```

### 每日执行
```
GET    /api/daily-executions/:nodeId?phase_id=  - 执行记录
POST   /api/daily-executions                    - 新增记录
PUT    /api/daily-executions/:id                - 更新记录
DELETE /api/daily-executions/:id                - 删除记录
```

### 学习记录
```
GET    /api/learning-records?subject_id=&tags=&date=  - 查询
GET    /api/learning-records/:id                       - 详情
POST   /api/learning-records                           - 新增
PUT    /api/learning-records/:id                       - 更新
DELETE /api/learning-records/:id                       - 删除
GET    /api/learning-records/stats/subject/:subjectId  - 科目统计
```

---

## 数据模型

### 节点类型
- `THEME` - 主题（如"暑期规划"）
- `FOCUS_ITEM` - 重点目标（如"数学提升"），也是**科目维度**
- `TASK` - 具体任务（如"每日一练"）
- `SUBTASK` - 子任务

### 阶段条目类型 (phase_points)
- `goal` - 重点目标
- `action` - 行动指南
- `checkpoint` - 里程碑检查点

### 学习记录标签 (learning_records.record_tags)
- `mistake` - 错题
- `knowledge` - 知识点
- `reflection` - 反思
- 可组合：`"mistake,knowledge,reflection"`

---

## 技术栈

### 前端
- React 18 + Vite 5
- 原生 CSS（军绿黑战术美学）
- Fetch API

### 后端
- Python 3.12 + FastAPI
- aiosqlite（异步 SQLite）
- Pydantic + JWT 认证

### 数据库
- SQLite 3（WAL 模式）

---

## 常见问题

**Q: 数据库文件在哪里？**
A: `backend/db/app.db`

**Q: 如何重置数据库？**
A: 删除 `app.db`，重新运行 `sqlite3 db/app.db < db/migrate-v2.sql`

**Q: 前后端通信出问题？**
A: 检查后端是否在 3001 端口运行，检查 CORS 配置

**Q: 如何查看数据库内容？**
A: 使用 SQLite 工具，或 `sqlite3 backend/db/app.db`

**Q: 如何添加新的 API？**
A: 在 `backend/app/routers/` 创建新路由文件，在 `main.py` 中注册

---

## 文档参考

- [README](../README.md) - 项目总览
- [数据库设计](./DATABASE_DESIGN.md) - 表结构详解
- [API 快速参考](./API_QUICK_REFERENCE.md) - 前端调用参考
- [V2 设计文档](./design/plans-v2-design.md) - 规划模块设计
