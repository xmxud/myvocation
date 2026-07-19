# 快速参考指南

## 项目概述

这是一个前后端分离的动态规划管理系统，用于追踪和管理多层级的规划、任务和执行情况。

### 项目结构
```
myvocation2026/
├── frontend/                 # React前端项目
│   ├── src/                  # React源代码
│   ├── pages/                # 页面组件
│   ├── css/                  # 样式
│   ├── scripts/              # 脚本
│   ├── images/               # 图片资源
│   └── package.json
│
├── backend/                  # Node.js后端项目
│   ├── db/
│   │   ├── app.db            # SQLite数据库
│   │   ├── init.sql          # 建表语句
│   │   ├── db.js             # 数据库连接
│   │   └── initDb.js         # 初始化脚本
│   ├── routes/               # API路由
│   ├── controllers/          # 业务逻辑
│   ├── utils/                # 工具函数
│   ├── server.js             # 主服务文件
│   └── package.json
│
├── DATABASE_DESIGN.md        # 数据库设计文档
├── DEVELOPMENT_PLAN.md       # 开发计划
└── README.md
```

---

## 快速开始

### 1. 初始化数据库
```bash
cd backend
npm run init-db
# 或者
node db/initDb.js
```

### 2. 启动后端服务
```bash
cd backend
npm run dev
# 监听 http://localhost:3001
```

### 3. 启动前端应用
```bash
cd frontend
npm run dev
# 监听 http://localhost:5173
```

### 4. 打开浏览器
```
http://localhost:5173
```

---

## API 端点汇总

### 健康检查
```
GET /api/health
响应: { "message": "Backend is running successfully." }
```

### 节点管理
```
GET    /api/nodes/:id                   - 获取节点详情
POST   /api/nodes                       - 新增节点
PUT    /api/nodes/:id                   - 更新节点
DELETE /api/nodes/:id                   - 删除节点
GET    /api/nodes/:id/children          - 获取子节点
GET    /api/nodes/:id/full-tree         - 获取完整树结构
```

### 文字描述和图片
```
POST   /api/nodes/:id/descriptions      - 添加文字描述
DELETE /api/nodes/:id/descriptions/:descId - 删除文字描述
POST   /api/nodes/:id/images            - 添加图片
DELETE /api/nodes/:id/images/:imageId   - 删除图片
```

---

## 数据模型

### 节点类型 (node_type)
- `THEME` - 主题（如"暑期规划"）
- `FOCUS_ITEM` - 主题下的重点规划项（如"旅游"、"英语学习"）
- `POINT` - 执行要点（如"目的地规划"、"预算"）
- `TASK` - 具体任务项（如"预订机票"）

### 树形结构
```
THEME (暑期规划)
└── FOCUS_ITEM (旅游)
    ├── POINT (目的地规划)
    │   └── TASK (查询景点)
    ├── POINT (预算规划)
    │   └── TASK (确定预算)
    └── POINT (行程安排)
        └── TASK (预订机票)
```

### 任务类型 (task_type)
- `DAILY` - 日常任务
- `PHASE` - 阶段任务
- `WEEKLY` - 周期任务
- `NORMAL` - 普通任务

### 优先级 (priority)
- `HIGH` - 高
- `MEDIUM` - 中
- `LOW` - 低

---

## 核心功能

### 1. 多层级规划管理
- 支持无限层级的树形结构
- 支持创建新主题、重点项、执行要点、任务
- 支持编辑和删除任何层级的节点

### 2. 进度追踪
- 每个节点支持完成状态 (`is_completed`)
- 支持完成百分比 (`progress_percent`)
- 自动汇总子节点的进度

### 3. 阶段划分
- 为每个规划项设置多个阶段
- 每个阶段有具体的要点
- 跟踪阶段的执行统计

### 4. 每日执行记录
- 记录每日的具体执行情况
- 支持文字笔记和图片说明
- 统计执行完成度和耗时

### 5. 数据和图片
- 为每个节点添加多条文字描述
- 为每个节点上传多张图片
- 支持排序和组织

---

## 常用测试命令

### 使用 Postman 或 curl 测试 API

**新增主题**
```bash
curl -X POST http://localhost:3001/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "THEME",
    "title": "秋季学期",
    "codename": "AUTUMN TERM",
    "sort_order": 2
  }'
```

**获取所有主题**
```bash
curl http://localhost:3001/api/nodes/1/children
```

**新增重点项**
```bash
curl -X POST http://localhost:3001/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "FOCUS_ITEM",
    "title": "数学学习",
    "parent_id": 1,
    "priority": "HIGH"
  }'
```

**获取完整树结构**
```bash
curl http://localhost:3001/api/nodes/1/full-tree
```

---

## 数据库查询示例

### 获取所有主题
```sql
SELECT id, title, codename, sort_order
FROM planning_nodes
WHERE node_type = 'THEME'
ORDER BY sort_order ASC;
```

### 获取某个主题的所有重点项
```sql
SELECT id, title, priority, progress_percent
FROM planning_nodes
WHERE node_type = 'FOCUS_ITEM' AND parent_id = 1
ORDER BY sort_order ASC;
```

### 获取某个主题的完整树结构（递归查询）
```sql
WITH RECURSIVE node_tree AS (
  SELECT id, parent_id, title, node_type, 1 as depth
  FROM planning_nodes
  WHERE id = 1
  
  UNION ALL
  
  SELECT pn.id, pn.parent_id, pn.title, pn.node_type, nt.depth + 1
  FROM planning_nodes pn
  JOIN node_tree nt ON pn.parent_id = nt.id
)
SELECT * FROM node_tree ORDER BY depth, id;
```

---

## 开发备注

### 前端技术栈
- React 18.3
- Vite 5.4
- 原生 CSS + SVG icons
- Fetch API for HTTP requests

### 后端技术栈
- Node.js + Express 4.19
- SQLite 3
- RESTful API 设计
- CORS support

### 下一步计划
1. 实现前端页面与后端 API 的完整集成
2. 开发规划页面的动态功能
3. 实现阶段管理和每日执行记录功能
4. 添加统计和数据可视化
5. 性能优化和错误处理完善

---

## 常见问题

**Q: 数据库文件在哪里？**
A: `backend/db/app.db` - SQLite 数据库文件

**Q: 如何重置数据库？**
A: 删除 `app.db` 文件，然后运行 `npm run init-db` 重新初始化

**Q: 前后端通信出问题？**
A: 检查后端是否在 3001 端口运行，检查 CORS 配置

**Q: 如何查看数据库内容？**
A: 使用 SQLite 可视化工具（如 DB Browser for SQLite），打开 `backend/db/app.db`

**Q: 如何添加新的 API 端点？**
A: 在 `backend/routes/` 创建新的路由文件，在 `backend/controllers/` 实现逻辑，然后在 `server.js` 中注册路由

---

## 文档参考

- [数据库设计文档](./DATABASE_DESIGN.md) - 详细的表结构和查询示例
- [开发计划](./DEVELOPMENT_PLAN.md) - 分阶段的开发计划和工作量评估
- [项目README](./README.md) - 项目总体介绍
