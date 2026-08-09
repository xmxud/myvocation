# 项目开发设计与开发计划

## 第一部分：项目架构设计

### 1. 技术栈概览

```
前端：
  - React + Vite
  - 组件库（SVG icons + 自定义组件）
  - 数据获取：fetch API + 状态管理（useState/useContext）

后端：
  - Node.js + Express
  - SQLite 数据库
  - RESTful API 设计
  - CORS 支持

数据库：
  - SQLite（轻量级、无需额外服务）
  - 存储在 backend/db/ 目录
```

### 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React + Vite)                      │
├─────────────────────────────────────────────────────────────┤
│  HomePage.jsx  PlansPage.jsx  LearnPage.jsx  ...           │
│  ├─ 组件层：展示、编辑、翻页、阶段展示等                    │
│  └─ 业务逻辑：数据获取、状态管理、用户交互                  │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP/JSON (fetch API)
               ↓
┌─────────────────────────────────────────────────────────────┐
│              后端 (Node.js + Express)                       │
├─────────────────────────────────────────────────────────────┤
│  路由层 (routes/)                                           │
│  ├─ /api/themes          - 主题管理                         │
│  ├─ /api/nodes           - 节点管理（增删改查）             │
│  ├─ /api/phases          - 阶段管理                         │
│  ├─ /api/daily-executions - 每日执行记录                    │
│  └─ /api/statistics      - 统计数据                         │
│                                                              │
│  业务层 (controllers/)                                      │
│  ├─ themesController     - 主题逻辑                         │
│  ├─ nodesController      - 节点逻辑                         │
│  ├─ phasesController     - 阶段逻辑                         │
│  └─ executionsController - 执行记录逻辑                     │
│                                                              │
│  数据层 (database/)                                         │
│  └─ db.js               - SQLite 连接、初始化、查询         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────┐
│            SQLite 数据库 (backend/db/app.db)               │
├─────────────────────────────────────────────────────────────┤
│  - planning_nodes (主表)                                    │
│  - node_descriptions                                        │
│  - node_images                                              │
│  - phases                                                   │
│  - phase_points                                             │
│  - daily_executions                                         │
│  - phase_statistics                                         │
└─────────────────────────────────────────────────────────────┘
```

### 3. API 接口设计

#### 主题管理
```
GET    /api/themes                      - 获取所有主题（分页）
POST   /api/themes                      - 新增主题
GET    /api/themes/:id                  - 获取单个主题详情
PUT    /api/themes/:id                  - 更新主题
DELETE /api/themes/:id                  - 删除主题
```

#### 节点管理（通用）
```
GET    /api/nodes/:id                   - 获取节点详情（含子节点）
POST   /api/nodes                       - 新增节点
PUT    /api/nodes/:id                   - 更新节点
DELETE /api/nodes/:id                   - 删除节点（级联删除）

GET    /api/nodes/:id/children          - 获取子节点列表
GET    /api/nodes/:id/full-tree         - 获取完整树结构
```

#### 阶段管理
```
GET    /api/phases/by-node/:nodeId      - 获取某节点的所有阶段
POST   /api/phases                      - 新增阶段
PUT    /api/phases/:id                  - 更新阶段
DELETE /api/phases/:id                  - 删除阶段

POST   /api/phases/:id/points           - 添加阶段要点
PUT    /api/phases/:phaseId/points/:pointId - 更新阶段要点
DELETE /api/phases/:phaseId/points/:pointId - 删除阶段要点
```

#### 每日执行记录
```
GET    /api/daily-executions/:nodeId    - 获取某节点的所有执行记录
GET    /api/daily-executions/:nodeId/:date - 获取特定日期的执行记录
POST   /api/daily-executions            - 新增执行记录
PUT    /api/daily-executions/:id        - 更新执行记录
DELETE /api/daily-executions/:id        - 删除执行记录
```

#### 统计数据
```
GET    /api/statistics/phase/:phaseId   - 获取阶段统计数据
GET    /api/statistics/node/:nodeId     - 获取节点的执行统计
GET    /api/statistics/date-range       - 获取日期范围内的统计
```

---

## 第二部分：开发计划

### 阶段划分

#### **第一阶段：后端基础搭建** （1-2天）
**目标**：建立数据库和基础 API 框架

- [ ] **1.1 数据库初始化**
  - 创建 SQLite 数据库文件（backend/db/app.db）
  - 编写数据库初始化脚本（backend/db/init.sql）
  - 创建 7 个数据表（参考 DATABASE_DESIGN.md）
  - 添加索引优化

- [ ] **1.2 后端项目结构搭建**
  - 创建目录结构：
    ```
    backend/
    ├── db/
    │   ├── app.db
    │   ├── init.sql
    │   └── db.js              # SQLite 连接和初始化
    ├── routes/
    │   ├── themes.js
    │   ├── nodes.js
    │   ├── phases.js
    │   ├── executions.js
    │   └── statistics.js
    ├── controllers/
    │   ├── themesController.js
    │   ├── nodesController.js
    │   ├── phasesController.js
    │   └── executionsController.js
    ├── utils/
    │   └── errorHandler.js    # 统一错误处理
    ├── middleware/
    │   └── validation.js      # 数据校验
    └── server.js              # 主服务文件
    ```

- [ ] **1.3 数据库连接层**
  - 使用 sqlite3 包，创建数据库连接
  - 编写初始化函数，自动创建表
  - 编写通用查询方法（query, run, get 等）

- [ ] **1.4 基础路由和控制器**
  - 创建 express 路由文件
  - 实现基础的增删改查逻辑框架
  - 添加错误处理中间件
  - 安装依赖：`npm install sqlite3 body-parser`

---

#### **第二阶段：主题和节点管理 API** （2-3天）
**目标**：完成节点树形结构的增删改查

- [ ] **2.1 主题 API 实现**
  - GET /api/themes - 分页获取所有主题
  - POST /api/themes - 新增主题
  - PUT /api/themes/:id - 更新主题
  - DELETE /api/themes/:id - 删除主题（级联）
  - 测试：使用 Postman 或 curl 验证

- [ ] **2.2 节点通用 API 实现**
  - GET /api/nodes/:id - 获取节点详情
  - POST /api/nodes - 新增节点（支持指定 parent_id）
  - PUT /api/nodes/:id - 更新节点
  - DELETE /api/nodes/:id - 删除节点（级联）
  - GET /api/nodes/:id/children - 获取子节点
  - GET /api/nodes/:id/full-tree - 获取完整树结构

- [ ] **2.3 图片和描述 API**
  - POST /api/nodes/:id/descriptions - 添加文字描述
  - DELETE /api/nodes/:id/descriptions/:descId - 删除文字描述
  - POST /api/nodes/:id/images - 上传/添加图片
  - DELETE /api/nodes/:id/images/:imageId - 删除图片

- [ ] **2.4 数据校验和错误处理**
  - 编写校验中间件（验证必填字段、数据类型）
  - 统一错误响应格式
  - 记录错误日志

---

#### **第三阶段：阶段和执行记录 API** （2天）
**目标**：实现阶段划分和每日执行记录功能

- [ ] **3.1 阶段管理 API**
  - GET /api/phases/by-node/:nodeId - 获取节点的所有阶段
  - POST /api/phases - 新增阶段
  - PUT /api/phases/:id - 更新阶段
  - DELETE /api/phases/:id - 删除阶段
  - POST /api/phases/:id/points - 添加阶段要点
  - DELETE /api/phases/:phaseId/points/:pointId - 删除阶段要点

- [ ] **3.2 每日执行记录 API**
  - GET /api/daily-executions/:nodeId - 获取节点的所有执行记录
  - GET /api/daily-executions/:nodeId/:date - 获取特定日期记录
  - POST /api/daily-executions - 新增执行记录
  - PUT /api/daily-executions/:id - 更新执行记录
  - DELETE /api/daily-executions/:id - 删除执行记录

- [ ] **3.3 统计数据 API**
  - GET /api/statistics/phase/:phaseId - 获取阶段统计
  - GET /api/statistics/node/:nodeId - 获取节点执行统计
  - 支持日期范围查询

- [ ] **3.4 测试**
  - 用 Postman 或脚本测试所有阶段相关 API
  - 验证级联删除逻辑

---

#### **第四阶段：前端页面重构** （3-4天）
**目标**：将静态页面改为动态页面，与后端接口对接

- [ ] **4.1 前端架构重构**
  - 创建 React Hooks 用于数据管理
  - 创建 API 请求层（utils/api.js）
  - 创建公共组件库（分页器、模态框、加载指示器等）

- [ ] **4.2 规划页面重构** (PlansPage.jsx)
  - **主题列表部分**：
    - 从后端获取主题列表
    - 支持翻页（>4个主题时显示箭头）
    - 支持新增主题（模态框）
    - 支持删除主题
  
  - **重点规划项部分**：
    - 动态加载该主题下的所有 FOCUS_ITEM
    - 支持新增重点项（模态框）
    - 支持编辑/删除重点项
    - 显示优先级和完成度
  
  - **执行要点卡片**：
    - 动态加载 POINT 类型节点
    - 支持新增/编辑/删除要点
    - 支持添加文字描述和图片
  
  - **阶段规划**：
    - 动态加载所有阶段（phases）
    - 显示阶段要点 (phase_points)
    - 支持新增/编辑/删除阶段
  
  - **任务清单**：
    - 动态加载 TASK 类型节点
    - 支持新增任务、标记完成、更新进度
    - 支持每日记录链接

- [ ] **4.3 创建新的每日执行记录页面** (DailyExecutionPage.jsx)
  - 日期选择器
  - 任务列表展示
  - 今日完成情况统计
  - 支持添加执行笔记和图片
  - 心情/感受记录

- [ ] **4.4 创建统计页面** (StatisticsPage.jsx)
  - 阶段完成情况统计图表
  - 任务完成率展示
  - 日期范围数据查询
  - 趋势图表（使用简单的可视化库或自绘）

- [ ] **4.5 模态框/表单组件**
  - 新增主题表单
  - 新增重点项表单
  - 新增阶段表单
  - 添加任务表单
  - 编辑通用表单
  - 图片上传组件

- [ ] **4.6 导航更新**
  - 在右上角导航添加"每日执行"、"统计数据"等新页面链接

---

#### **第五阶段：功能测试与优化** （1-2天）
**目标**：整体测试、性能优化、用户体验改进

- [ ] **5.1 功能测试**
  - 测试所有主题 CRUD 操作
  - 测试多层级节点的树形操作
  - 测试级联删除
  - 测试每日执行记录的增删改
  - 测试统计数据计算准确性

- [ ] **5.2 前后端集成测试**
  - 测试网络请求的错误处理
  - 测试离线模式降级
  - 测试大数据量性能

- [ ] **5.3 UI/UX 改进**
  - 添加加载状态指示器
  - 优化表单验证提示
  - 改进移动端响应式布局
  - 添加确认对话框（删除操作）

- [ ] **5.4 代码优化**
  - 数据库查询优化（添加缓存机制）
  - 前端组件性能优化（useMemo、useCallback）
  - 简化代码逻辑，提高可维护性

---

#### **第六阶段：高级功能** （可选/后续）
**目标**：增加高级特性和改进用户体验

- [ ] **6.1 图片存储优化**
  - 支持图片上传到服务器（而不仅仅是 URL）
  - 图片压缩和缩略图生成
  - 创建 /uploads 目录管理

- [ ] **6.2 数据导入导出**
  - 支持 JSON 格式数据导出
  - 支持从 JSON 导入规划数据
  - CSV 报表导出

- [ ] **6.3 复制规划**
  - 支持复制去年的规划作为今年的模板
  - 快速生成常见的主题和项目

- [ ] **6.4 搜索功能**
  - 全局搜索节点/任务
  - 按标签筛选

- [ ] **6.5 协作功能**
  - 支持多用户（如家庭成员）查看规划
  - 评论和反馈功能

---

### 开发优先级和工作量评估

| 阶段 | 名称 | 工作量 | 优先级 | 关键依赖 |
|------|------|--------|--------|---------|
| 1 | 后端基础搭建 | 2天 | ⭐⭐⭐⭐⭐ | 无 |
| 2 | 主题和节点 API | 3天 | ⭐⭐⭐⭐⭐ | 第1阶段 |
| 3 | 阶段和执行记录 API | 2天 | ⭐⭐⭐⭐ | 第2阶段 |
| 4 | 前端页面重构 | 4天 | ⭐⭐⭐⭐⭐ | 第1-3阶段 |
| 5 | 测试与优化 | 2天 | ⭐⭐⭐⭐ | 第4阶段 |
| 6 | 高级功能 | 3-5天 | ⭐⭐ | 第5阶段 |

**总预计工作量**：12-16 天（按顺序）

---

## 第三部分：关键技术点和注意事项

### 1. 数据库相关
- **SQLite 轻量级方案**：适合小型项目，无需独立数据库服务
- **树形结构管理**：使用 parent_id 实现无限层级，查询时需要递归处理
- **级联删除**：删除主题时需要级联删除所有子节点
- **并发控制**：SQLite 写入有限制，考虑后续升级到 PostgreSQL

### 2. 前后端通信
- **跨域问题**：后端已配置 CORS
- **错误处理**：统一的错误响应格式，前端统一处理
- **数据验证**：前后端双重验证
- **请求超时**：设置合理的超时时间

### 3. 前端状态管理
- 当前使用 useState，后续可考虑 useContext 或 Redux
- 缓存策略：避免重复请求
- 乐观更新：提升用户体验

### 4. 性能考虑
- 分页加载主题（初始加载 4-8 个）
- 节点树的延迟加载（展开时才加载子节点）
- 数据库索引优化
- 前端虚拟列表（任务数量较多时）

### 5. 安全考虑
- **输入验证**：防止 SQL 注入（使用参数化查询）
- **数据验证**：类型检查、长度限制
- **错误信息**：不暴露内部错误细节
- **文件上传**：验证文件类型和大小

### 6. 代码规范
- 后端：按 controllers/routes/middleware 分层
- 前端：按功能模块组织组件
- 命名规范：统一使用 camelCase
- 注释：关键逻辑添加详细注释

---

## 第四部分：快速启动指南

### 步骤 1：初始化数据库
```bash
cd backend
node db/initDb.js  # 创建表并插入初始数据
```

### 步骤 2：启动后端
```bash
cd backend
npm run dev  # 监听 3001 端口
```

### 步骤 3：启动前端
```bash
cd frontend
npm run dev  # 监听 5173 端口
```

### 步骤 4：打开浏览器
```
http://localhost:5173
```

---

## 附录：常见问题 (FAQ)

**Q: 为什么选择 SQLite 而不是 PostgreSQL？**
A: SQLite 足以应对当前项目规模，无需额外部署。后续如果用户和数据量增加，可以迁移到 PostgreSQL。

**Q: 如何处理复杂的树形查询？**
A: 可以使用递归 SQL（WITH RECURSIVE）或在后端代码中递归构建树结构。

**Q: 图片怎么存储？**
A: 初期可以存储 URL 或本地相对路径，后续可以实现图片上传到服务器的功能。

**Q: 如何实现实时更新？**
A: 当前版本使用 polling 或手动刷新，后续可以使用 WebSocket。

**Q: 数据备份方案？**
A: 定期导出 JSON 数据或直接备份 app.db 文件。
