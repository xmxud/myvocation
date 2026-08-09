# 规划模块 V2 设计文档

> 状态：待评审  
> 日期：2026-07-12  
> 基于：现有 `planning_nodes` + `phases` 数据模型，PlansPage 前端实现

---

## 一、需求摘要

| # | 需求 | 说明 |
|---|------|------|
| 1 | 阶段计划维护 | 手工录入 + Excel 批量导入；大阶段可拆分小阶段（阶段嵌套） |
| 2 | PDCA 阶段评估 | 每阶段有：时间范围、重点目标、行动指南、执行度评分（根据每日执行自动计算）、阶段成果检测评分（手工录入） |
| 3 | 每日执行计划 | 根据阶段行动指南自动生成 Todo List；支持手工录入和 Excel 导入 |
| 4 | 阶段检查与积累 | 图文知识点、错题整理、思考复盘、复习与掌握程度记录 |
| 5 | 多用户支持 | 每人独立的目标/阶段/任务视图 |

---

## 二、数据模型设计

### 2.1 核心变更概览

```
[新增] users 用户表
  └── [改造] planning_nodes (节点树：THEME → FOCUS_ITEM → TASK → SUBTASK)
        │                    ↑ subject_id (FOCUS_ITEM = 科目维度)
        ├── [改造] phases (阶段树：parent_id 自引用，支持子阶段)
        │     ├── [新增] phase_points (目标/行动指南/检查点，按 type 区分)
        │     ├── [新增] task_schedules (定时任务调度，关联 phase_points 中的 action)
        │     └── [改造] daily_executions (每日执行，关联阶段)
        └── [新增] learning_records (学习记录：题目+知识点+反思 三位一体)
```

### 2.2 新增/改造表详情

#### 2.2.1 users（用户表）— 新增

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**影响范围**：`planning_nodes`、`phases`、`daily_executions` 等所有业务表需增加 `user_id` 字段关联用户。

#### 2.2.2 planning_nodes 改造

```diff
  ALTER TABLE planning_nodes ADD COLUMN user_id INTEGER REFERENCES users(id);
+ ALTER TABLE planning_nodes ADD COLUMN is_archived BOOLEAN DEFAULT 0;
```

**节点类型调整**：

| node_type | 含义 | parent 关系 | 说明 |
|-----------|------|------------|------|
| THEME | 规划主题（如"2026暑期计划"） | 无 parent | 顶层，属于用户 |
| FOCUS_ITEM | 重点目标（如"数学提升"） | parent=THEME | 同一主题下的多个重点 |
| TASK | 具体任务（如"每日一练"） | parent=FOCUS_ITEM | — |
| SUBTASK | 子任务/检查点 | parent=TASK | 更细粒度的可执行单元 |

> **移除 `POINT` 类型**，其功能由「阶段检查项」(`phase_check_items`) 替代。

#### 2.2.3 phases 改造（支持子阶段嵌套）

```sql
-- 改造：增加 parent_id 自引用 + user_id + 评分字段
CREATE TABLE IF NOT EXISTS phases_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,              -- 关联的 planning_node（TASK 层级）
  parent_id INTEGER,                      -- [新增] 父阶段 ID，支持子阶段嵌套
  phase_number TEXT NOT NULL,             -- 改为 TEXT，支持 "1"、"1.1"、"1.2"
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('active', 'upcoming', 'completed')),
  sort_order INTEGER DEFAULT 0,          -- [新增] 排序

  -- 评分字段（1:1 直接放入阶段表）
  execution_score   REAL,                -- 执行度评分（自动计算）
  achievement_score REAL,                -- 成果检测评分（手工录入）
  composite_score   REAL,                -- 综合评分（自动计算）
  score_remarks     TEXT,                -- 评分备注
  scored_at         TEXT,                -- 评分时间

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES phases_v2(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 2.2.4 phase_points（阶段条目：目标/行动指南/检查点 三合一）— 新增

将阶段目标、行动指南、里程碑检查点合并为一张表，通过 `point_type` 区分，通过 `extra_data` 存储类型专属字段。

```sql
CREATE TABLE IF NOT EXISTS phase_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,

  point_type TEXT NOT NULL CHECK(point_type IN ('goal', 'action', 'checkpoint')),

  content     TEXT NOT NULL,                -- 条目内容
  sort_order  INTEGER DEFAULT 0,

  -- 类型专属字段（JSON）
  extra_data TEXT,                          /*
    goal:       { "goal_type": "primary", "weight": 60 }
    action:     { "frequency": "daily", "estimated_minutes": 30 }
    checkpoint: { "is_completed": false, "completed_at": null }
  */

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id) REFERENCES phases_v2(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pp_phase ON phase_points(phase_id);
CREATE INDEX IF NOT EXISTS idx_pp_type  ON phase_points(point_type);
```

**三种 point_type 的 extra_data 结构**：

```js
// goal（阶段重点目标）
{ goal_type: "primary", weight: 60 }   // primary=主目标, secondary=次要目标

// action（行动指南条目）
{ frequency: "daily", estimated_minutes: 30 }  // daily/weekly/once

// checkpoint（阶段里程碑检查项）
{ is_completed: false, completed_at: null }
```

#### 2.2.5 task_schedules（定时任务调度）— 新增

关联 `phase_points` 中 `point_type='action'` 的条目，控制何时自动生成每日 Todo。不在 action 记录上直接存 `is_auto_todo`，而是通过本表独立管理调度规则，更灵活。

```sql
CREATE TABLE IF NOT EXISTS task_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL,
  point_id INTEGER NOT NULL,               -- FK→phase_points (type='action')

  schedule_type   TEXT DEFAULT 'daily' CHECK(schedule_type IN ('daily', 'weekly', 'once')),
  cron_expression TEXT,                    -- 可选，自定义定时规则
  is_active       BOOLEAN DEFAULT 1,

  last_generated_date TEXT,                -- 上次自动生成日期，防止重复
  next_generated_date TEXT,                -- 下次预计生成日期

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (point_id) REFERENCES phase_points(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ts_point  ON task_schedules(point_id);
CREATE INDEX IF NOT EXISTS idx_ts_active ON task_schedules(is_active);
```

**调度逻辑**：
1. 用户创建 `point_type='action'` 的条目后，可选择「启用自动生成」
2. 系统插入一条 `task_schedules` 记录关联该 action
3. 定时任务或用户手动触发时，遍历 `is_active=1` 且到达 `next_generated_date` 的调度记录
4. 对每条调度，生成一条 `daily_executions`（source='auto'），并更新 `last_generated_date`

#### 2.2.6 daily_executions 改造

```diff
  ALTER TABLE daily_executions ADD COLUMN phase_id INTEGER REFERENCES phases_v2(id);
+ ALTER TABLE daily_executions ADD COLUMN user_id INTEGER REFERENCES users(id);
+ ALTER TABLE daily_executions ADD COLUMN source TEXT DEFAULT 'manual' CHECK(source IN ('manual', 'auto', 'excel'));
+ ALTER TABLE daily_executions ADD COLUMN result_score INTEGER DEFAULT 0 CHECK(result_score BETWEEN 0 AND 5);
+ ALTER TABLE daily_executions ADD COLUMN title TEXT;
+ ALTER TABLE daily_executions ADD COLUMN planned_start_time TEXT;
+ ALTER TABLE daily_executions ADD COLUMN planned_duration INTEGER;
+ ALTER TABLE daily_executions ADD COLUMN source_point_id INTEGER REFERENCES phase_points(id);
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | TEXT | 任务描述（独立文本，可为空） |
| `planned_start_time` | TEXT | 计划开始时间 "08:30" |
| `planned_duration` | INTEGER | 计划时长（分钟） |
| `source_point_id` | INTEGER | 来源行动指南 FK→phase_points |
| `source` | TEXT | 来源：manual/auto/excel |
| `duration_minutes` | INTEGER | 实际耗时（分钟） |
| `result_score` | INTEGER | 执行结果评分 0-5 |
| `is_done` | BOOLEAN | 是否完成 |
| `completion_percent` | INTEGER | 完成百分比 0-100 |

**完整表结构**：
- 任务定义：`title`(任务描述) + `planned_start_time`(计划开始时间) + `planned_duration`(计划时长)
- 关联：`node_id`(FOCUS_ITEM) + `phase_id`(阶段) + `source_point_id`(行动指南)
- 执行追踪：`execution_date` + `is_done` + `completion_percent` + `duration_minutes`(实际耗时)
- 评分：`result_score`(0-5)
- 记录：`notes` + `images` + `mood`

#### 2.2.7 learning_records（学习记录：题目+知识点+反思 三位一体）— 新增

**设计理念**：学生完成一天学习后，可以上传错题（文本或图片），同时可选填写对应知识点和反思，也支持后期复习时再补填。一条记录可以只含其中一项信息，也可以三项齐全。同一条记录的三个维度信息可以在不同时间逐步补全。

```
时间线:
  Day 1:  [📷 错题图片]                     → 只有题目
  Day 7:  [📷 错题图片] [📝 知识点: 二次函数]  → 补充知识点
  Day 14: [📷 错题图片] [📝 知识点] [💭 反思]   → 补充反思，掌握度提升
```

```sql
CREATE TABLE IF NOT EXISTS learning_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 归属
  user_id     INTEGER NOT NULL,
  subject_id  INTEGER NOT NULL,              -- FK→planning_nodes(FOCUS_ITEM)，科目维度
  phase_id    INTEGER,                       -- FK→phases_v2，可选关联阶段
  record_date TEXT NOT NULL,                 -- 学习日期 "2026-07-12"

  -- 主维度标签（多选，逗号分隔）
  record_tags  TEXT NOT NULL DEFAULT 'mistake',
      /*
        "mistake"                      — 纯错题
        "knowledge"                    — 纯知识点积累
        "reflection"                   — 纯反思
        "mistake,knowledge"            — 错题 + 知识点
        "mistake,knowledge,reflection" — 三者齐全
        "knowledge,reflection"         — 知识点总结 + 反思
      */

  -- ① 题目
  question_text   TEXT,                      -- 题干文字
  question_images TEXT,                      -- 题干图片 JSON ["url1","url2"]
  wrong_answer    TEXT,                      -- 错误答案
  correct_answer  TEXT,                      -- 正确答案

  -- ② 知识点
  knowledge_point TEXT,                      -- 知识点名称，如"二次函数顶点公式"
  knowledge_note  TEXT,                      -- 笔记/详解

  -- ③ 反思
  reflection_text TEXT,                      -- 反思内容

  -- 学习追踪
  mastery_level    INTEGER DEFAULT 0 CHECK(mastery_level BETWEEN 0 AND 5),
  review_count     INTEGER DEFAULT 0,
  last_review_date TEXT,
  status           TEXT DEFAULT 'active' CHECK(status IN ('active','reviewed','mastered')),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (subject_id) REFERENCES planning_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id)   REFERENCES phases_v2(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)    REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_lr_user       ON learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lr_subject    ON learning_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_lr_date       ON learning_records(record_date);
CREATE INDEX IF NOT EXISTS idx_lr_kp         ON learning_records(knowledge_point);
CREATE INDEX IF NOT EXISTS idx_lr_mastery    ON learning_records(subject_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_lr_tags       ON learning_records(record_tags);
CREATE INDEX IF NOT EXISTS idx_lr_subj_date  ON learning_records(subject_id, record_date);
```

**三种填充场景**：

```
场景1: 当天只传错题照片
  record_tags: "mistake"
  question_images: ["photo.jpg"]
  wrong_answer: "x=2" / correct_answer: "x=-2"
  knowledge_point: NULL / reflection_text: NULL

场景2: 复习时补填知识点和反思 → 更新标签
  record_tags: "mistake,knowledge,reflection"
  knowledge_point: "二次函数顶点公式"
  knowledge_note:  "y=a(x-h)²+k，顶点(h,k)"
  reflection_text: "配方时忘记同时加减常数"
  mastery_level: 4

场景3: 没有错题，纯知识点总结
  record_tags: "knowledge,reflection"
  knowledge_point: "三角函数诱导公式"
  knowledge_note:  "奇变偶不变，符号看象限"
  reflection_text: "本周三角函数刷了30道题，公式记忆基本OK"
```

**按科目分析薄弱知识点**：

```sql
-- 某科目下按知识点统计掌握度
SELECT knowledge_point,
       COUNT(*)            AS record_count,
       AVG(mastery_level)  AS avg_mastery
FROM learning_records
WHERE subject_id = :math_id
  AND knowledge_point IS NOT NULL
GROUP BY knowledge_point
ORDER BY avg_mastery ASC;  -- 掌握最差的排前面

-- 错题归因：只看标记了 mistakes 标签的记录
SELECT record_date, question_text, question_images,
       wrong_answer, correct_answer,
       knowledge_point, reflection_text, mastery_level
FROM learning_records
WHERE record_tags LIKE '%mistake%' AND subject_id = :subject_id
ORDER BY mastery_level ASC;

-- 还没补知识点的错题（需要复习）
SELECT * FROM learning_records
WHERE record_tags LIKE '%mistake%'
  AND knowledge_point IS NULL
  AND (question_text IS NOT NULL OR question_images IS NOT NULL);

-- 按科目统计各维度数量分布
SELECT subject_id,
       SUM(CASE WHEN record_tags LIKE '%mistake%'    THEN 1 ELSE 0 END) AS mistake_count,
       SUM(CASE WHEN record_tags LIKE '%knowledge%'  THEN 1 ELSE 0 END) AS knowledge_count,
       SUM(CASE WHEN record_tags LIKE '%reflection%' THEN 1 ELSE 0 END) AS reflection_count
FROM learning_records GROUP BY subject_id;
```

---

## 三、数据关系图（ER）

```
users ──1:N── planning_nodes (THEME → FOCUS_ITEM → TASK → SUBTASK)
  │                │                    ↑
  │                │          subject_id (FOCUS_ITEM 作为科目维度)
  │                │                    │
  │                ├──1:N── phases_v2 (parent_id 自引用: 大阶段 → 子阶段)
  │                │          │
  │                │          ├──1:N── phase_points (goal/action/checkpoint)
  │                │          ├──1:N── task_schedules (关联 action → 自动生成 Todo)
  │                │          └──1:N── daily_executions
  │                │
  │                │    评分字段 (execution_score, achievement_score, composite_score)
  │                │    直接放在 phases_v2 表中，不再单建表
  │                │
  │                └──1:N── learning_records (题目+知识点+反思三位一体)
  │                             │
  │                             ├── subject_id → planning_nodes(FOCUS_ITEM)
  │                             ├── phase_id   → phases_v2 (可选)
  │                             └── record_tags: "mistake,knowledge,reflection"
  │
  └──1:N── learning_records
```

---

## 四、API 设计

### 4.1 用户相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册 |
| GET | /api/users/me | 获取当前用户信息 |

### 4.2 阶段管理（改造）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/phases/by-node/:nodeId | 获取节点下所有阶段（含子阶段树） |
| GET | /api/phases/:id | 阶段详情（含目标/行动指南/检查项/评分） |
| POST | /api/phases | 新增阶段 |
| PUT | /api/phases/:id | 更新阶段 |
| DELETE | /api/phases/:id | 删除阶段（级联删除子阶段） |
| POST | /api/phases/import-excel | Excel 导入阶段 |

### 4.3 阶段子资源

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/phases/:id/points?type=goal,action,checkpoint | 获取阶段条目（可按 type 筛选） |
| POST | /api/phases/:id/points | 添加条目（type 在 body 中指定） |
| PUT | /api/phases/points/:pointId | 更新条目 |
| DELETE | /api/phases/points/:pointId | 删除条目 |
| PUT | /api/phases/:id/scores | 更新评分（achievement_score + score_remarks，execution_score 自动计算） |

### 4.4 定时任务调度

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/task-schedules?phase_id= | 查看某阶段的调度列表 |
| POST | /api/task-schedules | 为 action 条目创建调度 |
| PUT | /api/task-schedules/:id | 更新调度（启用/禁用/修改频率） |
| DELETE | /api/task-schedules/:id | 删除调度 |
| POST | /api/task-schedules/trigger | 手动触发自动生成今日 Todo |

### 4.5 每日执行（改造）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/daily-executions/:nodeId?phase_id= | 获取执行记录（可按阶段筛选） |
| POST | /api/daily-executions | 新增执行记录 |
| POST | /api/daily-executions/auto-generate | 根据阶段行动指南自动生成今日 Todo |
| POST | /api/daily-executions/import-excel | Excel 导入每日计划 |
| PUT | /api/daily-executions/:id | 更新执行记录（含结果评分） |

### 4.6 学习记录（新增 — 统一接口）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/learning-records?subject_id=&phase_id=&tags=&date= | 查询学习记录（可按科目/阶段/标签/日期筛选） |
| GET | /api/learning-records/:id | 单条记录详情 |
| POST | /api/learning-records | 新增学习记录 |
| PUT | /api/learning-records/:id | 更新记录（补填知识点/反思/修改掌握程度） |
| DELETE | /api/learning-records/:id | 删除记录 |
| GET | /api/learning-records/stats/subject/:subjectId | 按科目统计（知识点薄弱分布/错题归因） |
| GET | /api/learning-records/due-review | 待复习记录列表 |

---

## 五、前端页面设计 — PlanningV2Page

### 5.1 页面整体布局

参照现有 `PlansPage.jsx` 的风格（军绿黑战术美学），改造为新页面 `PlanningV2Page`：

```
┌─ 顶部导航栏（同现有 nav-header） ───────────────────┐
│  LOGO    主题选择下拉   用户头像/登出                 │
├─ 阶段 Hero 区域 ─────────────────────────────────────┤
│  当前主题名称 · 代号                                  │
│  [进度条] 整体完成度 XX%                              │
│  [导入Excel] [新增阶段] [自动生成今日Todo]             │
├─ 阶段时间线（Timeline 可折叠） ──────────────────────┤
│  ┌─ 阶段 1: 7/1-7/15 ──────────────────────────┐    │
│  │  重点目标 · 行动指南 · 执行度评分 · 成果评分   │    │
│  │  ├─ 子阶段 1.1: ...                          │    │
│  │  └─ 子阶段 1.2: ...                          │    │
│  └──────────────────────────────────────────────┘    │
│  ┌─ 阶段 2: 7/16-7/31 ─────────────────────────┐    │
│  │  ...                                         │    │
│  └──────────────────────────────────────────────┘    │
├─ 阶段详情 + 学习记录面板（选中某阶段后展开） ──────────│
│  [科目: 数学] [英语] [物理]                             │
│  [标签过滤: 全部 | 错题 | 知识点 | 反思]                 │
│  ┌─ 记录卡片 ───────────────────────────────────┐     │
│  │ [📝错题] [📚知识点] 二次函数顶点公式  ★★★★☆  │     │
│  │  📷 题目照片                    2026-07-12    │     │
│  │  💭 配方时忘记同时加减常数                    │     │
│  │  [编辑] [复习] [删除]                         │     │
│  └──────────────────────────────────────────────┘     │
│  [＋ 新增学习记录]                                     │
├─ 每日执行 Todo ─────────────────────────────────────│
│  [日期选择器]  [手工添加]  [Excel导入]                │
│  ┌─ □ 数学每日一练 (来自: 阶段2 行动指南) ─── [评分] │
│  │  □ 英语阅读30分钟                              │   │
│  │  ☑ 背诵古诗一首 ✓ 完成                       │   │
│  │  ...                                         │   │
│  └──────────────────────────────────────────────┘    │
└─ Footer ────────────────────────────────────────────┘
```

### 5.2 各区域功能说明

#### 5.2.1 Hero 区域

- 显示当前选中主题的概况
- 操作按钮组：导入Excel、新增阶段、自动生成今日Todo
- 总体进度条

#### 5.2.2 阶段时间线

- **树形展开**：大阶段可展开查看子阶段
- **每个阶段卡片**显示：
  - 阶段编号、标题、时间范围、状态标签（进行中/即将/已完成）
  - 重点目标条数、行动指南条数
  - **执行度评分**（自动计算，绿色进度环）
  - **成果检测评分**（手工录入，金色标记）
  - 综合评分
- 点击阶段卡片 → 下方展开该阶段的详情面板

#### 5.2.3 阶段详情面板（Tab 切换）

阶段条目统一从 `phase_points` 加载，按 `point_type` 分组展示：

| Tab | point_type | 内容 | 交互 |
|-----|-----------|------|------|
| 重点目标 | goal | 目标列表（主目标/次要目标，权重） | CRUD |
| 行动指南 | action | 指南条目，标注频率/预计耗时 + [启用自动调度] | CRUD + 管理 task_schedule |
| 检查点 | checkpoint | 里程碑检查清单（完成/未完成） | 勾选切换 |
| 评分 | — | execution_score(自动) + achievement_score(手工) | 录入成果评分 & 备注 |

**自动调度**：action 条目旁有「自动调度」开关 → 创建/启停 `task_schedules` 记录，控制每日 Todo 自动生成。

#### 5.2.4 学习记录区（题目+知识点+反思一体）

选中阶段后，下方展开该阶段所有科目的学习记录：

- **科目 Tab 切换**：数学/英语/物理…（来自 FOCUS_ITEM）
- **标签过滤**：[全部] [错题] [知识点] [反思] — 基于 `record_tags` 过滤
- **记录卡片**每条显示：
  - 标签徽章（mistake/knowledge/reflection 多色标记）
  - 题干摘要 + 图片缩略图
  - 知识点名称 + 掌握程度星星 (0-5)
  - 反思内容摘要
  - 日期 + 复习状态
- **点击展开**：完整编辑区，可修改题目、补填知识点笔记、补填反思、调整掌握程度
- **快速入口**：每日执行 Todo 完成后直接弹出「新增学习记录」对话框

#### 5.2.5 每日执行 Todo

- 日期选择器，默认今天
- 自动生成的 Todo 项带有来源标注（来自哪个阶段、哪条行动指南）
- 每项可标记完成/未完成、填写执行结果评分(0-5)
- 支持手工添加 Todo 项
- Excel 导入按钮

### 5.3 页面路由

- `/plans-v2` - 新规划页面
- 从 HomePage 导航栏新增入口「规划V2」或替换原有「我的规划」入口

---

## 六、Excel 导入设计

### 6.1 阶段导入 Excel 模板

| 阶段编号 | 阶段标题 | 开始日期 | 结束日期 | 父阶段编号 | 目标1 | 目标权重1 | 行动指南1 | 频率 | 预计分钟 | 自动生成Todo |
|---------|---------|---------|---------|-----------|------|----------|----------|------|---------|-------------|
| 1 | 基础巩固 | 7/1 | 7/15 | — | 完成暑假作业 | 60 | 数学每日一练 | daily | 30 | 是 |
| 1.1 | 数学基础 | 7/1 | 7/7 | 1 | 掌握函数章节 | 100 | 函数专项练习 | daily | 45 | 是 |

- `父阶段编号` 为空表示顶层阶段
- 同一阶段的多条目标/指南，后续行可留空阶段编号

### 6.2 每日执行导入 Excel 模板

| 日期 | 阶段编号 | 任务内容 | 优先级 | 预计分钟 | 备注 |
|------|---------|---------|--------|---------|------|
| 7/1 | 1 | 数学每日一练 | HIGH | 30 | 从阶段行动指南导入 |
| 7/1 | — | 晨跑30分钟 | MEDIUM | 30 | 手工添加 |

---

## 七、评分体系

评分字段直接放在 `phases_v2` 表中，通过 `PUT /api/phases/:id/scores` 更新：

| 字段 | 计算方式 | 说明 |
|------|---------|------|
| `execution_score` | 自动 | AVG(阶段内 daily_executions.completion_percent)，阶段结束后冻结 |
| `achievement_score` | 手工 | 用户录入（如考试成绩、检测结果） |
| `composite_score` | 自动 | execution_score × 0.6 + achievement_score × 0.4 |
| `score_remarks` | 手工 | 评分备注说明 |
| `scored_at` | 自动 | 评分时间

---

## 八、迁移策略

### 8.1 数据库迁移

1. 创建所有新表（users, phases_v2 等）
2. 为现有表增加 `user_id` 字段（默认 user_id=1，即默认管理员）
3. 迁移现有 `phases` → `phases_v2`
4. 迁移现有 `phase_points` → `phase_check_items`
5. 保留旧表作为备份，验证后删除

### 8.2 前端迁移

- 新建 `PlanningV2Page.jsx`，不复用现有 PlansPage
- 在 `App.jsx` 中新增加路由
- 保留旧 PlansPage 作为参考，稳定后替换

### 8.3 新增后端文件清单

```
backend/
├── routes/
│   ├── auth.js              (新增)
│   ├── learningRecords.js   (新增 — 统一学习记录)
│   ├── taskSchedules.js     (新增 — 定时任务调度)
│   └── excel.js             (新增 — Excel导入)
├── controllers/
│   ├── authController.js            (新增)
│   ├── learningRecordsController.js (新增)
│   ├── taskSchedulesController.js   (新增)
│   └── excelController.js           (新增)
├── middleware/
│   └── auth.js              (新增 — JWT认证中间件)
├── db/
│   └── migrate-v2.js        (新增 — 数据迁移脚本)
└── utils/
    └── excelParser.js        (新增 — Excel解析工具)
```

### 8.4 新增前端文件清单

```
frontend/
├── pages/
│   └── PlanningV2Page.jsx   (新增 - 新规划页面)
├── src/
│   └── utils/
│       ├── authApi.js            (新增 — 认证API)
│       └── learningRecordsApi.js (新增 — 学习记录API)
```

---

## 九、开放问题（需评审确认）

1. **用户系统范围**：是简单的本地账号密码登录，还是需要对接第三方（微信/QQ）？
2. **Excel 导入**：Node.js 端解析（使用 `xlsx` 库）还是前端解析后传 JSON？
3. **评分权重**：执行度 60%/成果检测 20%/检查项 20% 是否合理？
4. **阶段自动生成 Todo 的时机**：每天零点自动生成，还是用户手动触发？
5. **旧 PlansPage 保留多久**：是否需要兼容旧数据过渡期？
