# 数据库设计文档 (V2)

## 概述

SQLite 数据库，WAL 模式，通过 `migrate-v2.sql` 在原有 V1 数据库基础上新增/改造表结构。

**迁移脚本**: `backend/db/migrate-v2.sql`  
**数据库文件**: `backend/db/app.db`

---

## ER 关系图

```
users ──1:N── planning_nodes (THEME → FOCUS_ITEM)
  │                │                    ↑
  │                │          subject_id (FOCUS_ITEM 作为科目维度)
  │                │                    │
  │                ├──1:N── phases_v2 (parent_id 自引用: 大阶段 → 子阶段)
  │                │          │
  │                │          ├──1:N── phase_points (goal/action/checkpoint)
  │                │          ├──1:N── task_schedules (关联 action → 自动生成 Todo)
  │                │          └──1:N── daily_executions
  │                │
  │                └──1:N── learning_records (题目+知识点+反思三位一体)
  │
  └──1:N── learning_records
```

---

## 数据表详情

### 1. users（用户表）— V2 新增

```sql
CREATE TABLE users (
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

### 2. planning_nodes（节点树）— 改造

节点类型：`THEME` → `FOCUS_ITEM`（2026-08 收敛：原设计的 TASK/SUBTASK 层级未启用，计划任务由 `daily_executions` 承载；`task_type`/`start_date`/`end_date`/`progress_percent` 四个闲置字段已删除）

当前字段：
- 基本信息：`node_type`(THEME/FOCUS_ITEM)、`title`、`codename`、`description`
- 层级：`parent_id`、`sort_order`
- 状态：`is_completed`（仅表示主题/科目已归档完成，不做树形汇总）、`priority`（仅 FOCUS_ITEM 科目优先级）、`is_archived`
- 展示元数据：`tag`（软关联/分类键）、`extra_data`（JSON，存 icon 等）
- 主题完成进度**不落库**，由 `GET /api/themes` 按子树内 `daily_executions` 完成率现算返回 `progress_percent`

FOCUS_ITEM 同时也是**科目维度**（`learning_records.subject_id` 指向它）。

### 3. phases_v2（阶段表）— 新增

```sql
CREATE TABLE phases_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,
  parent_id INTEGER,                     -- 支持子阶段
  phase_number TEXT NOT NULL,            -- "1" / "1.1" / "1.2"
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('active','upcoming','completed')),
  sort_order INTEGER DEFAULT 0,

  -- 评分字段（1:1 直接放入阶段表）
  execution_score   REAL,                -- 自动：AVG(daily_executions.completion_percent)
  achievement_score REAL,                -- 手工录入
  composite_score   REAL,                -- 自动：execution×0.6 + achievement×0.4
  score_remarks     TEXT,
  scored_at         TEXT,

  created_at / updated_at,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES phases_v2(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. phase_points（阶段条目三合一）— 新增

```sql
CREATE TABLE phase_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,

  point_type TEXT NOT NULL CHECK(point_type IN ('goal','action','checkpoint')),
  content    TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,

  extra_data TEXT,  -- JSON:
      /*
        goal:       {"goal_type":"primary","weight":60}
        action:     {"frequency":"daily","estimated_minutes":30}
        checkpoint: {"is_completed":false,"completed_at":null}
      */

  created_at / updated_at,
  FOREIGN KEY (phase_id) REFERENCES phases_v2(id) ON DELETE CASCADE
);
```

### 5. task_schedules（定时任务调度）— 新增

```sql
CREATE TABLE task_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL,
  point_id INTEGER NOT NULL,              -- FK→phase_points (type='action')

  schedule_type   TEXT DEFAULT 'daily' CHECK(schedule_type IN ('daily','weekly','once')),
  is_active       BOOLEAN DEFAULT 1,
  last_generated_date TEXT,
  next_generated_date TEXT,

  created_at / updated_at,
  FOREIGN KEY (point_id) REFERENCES phase_points(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 6. daily_executions（每日执行）— 改造

V2 新增字段：
- `phase_id` — 关联阶段
- `user_id` — 所属用户
- `source` — 来源（manual/auto/excel）
- `result_score` — 执行结果评分（0-5）

2026-08 新增字段（打卡/附件）：
- `actual_start_time` / `actual_end_time` — 实际开始/结束时间（HH:MM）
- `attachments` — 执行附件 JSON：`[{"key":"execution-docs/...","url":"https://...","name":"原始文件名"}]`，文件存阿里云 OSS `execution-docs/` 目录（`POST /api/daily-executions/upload-attachment` 上传）

### 7. learning_records（学习记录三位一体）— 新增

```sql
CREATE TABLE learning_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id     INTEGER NOT NULL,
  subject_id  INTEGER NOT NULL,            -- FK→planning_nodes(FOCUS_ITEM)
  phase_id    INTEGER,
  record_date TEXT NOT NULL,
  execution_id INTEGER,                    -- FK→daily_executions，从任务打卡带入的学习记录关联任务（2026-08 新增，ON DELETE SET NULL）

  record_tags  TEXT NOT NULL DEFAULT 'mistake',  -- "mistake,knowledge,reflection"

  -- ① 题目
  question_text   TEXT,
  question_images TEXT,                     -- JSON
  wrong_answer    TEXT,
  correct_answer  TEXT,

  -- ② 知识点
  knowledge_point TEXT,
  knowledge_note  TEXT,
  knowledge_images TEXT,                     -- 知识点配图 JSON（2026-08 新增）

  -- ③ 反思
  reflection_text TEXT,
  reflection_images TEXT,                    -- 反思配图 JSON（2026-08 新增）

  -- 追踪
  mastery_level    INTEGER DEFAULT 0 CHECK(mastery_level BETWEEN 0 AND 5),
  review_count     INTEGER DEFAULT 0,
  last_review_date TEXT,
  status           TEXT DEFAULT 'active' CHECK(status IN ('active','reviewed','mastered')),

  created_at / updated_at,
  FOREIGN KEY (subject_id) REFERENCES planning_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id)   REFERENCES phases_v2(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)    REFERENCES users(id)
);
```

---

## 查询示例

### 按科目查薄弱知识点
```sql
SELECT knowledge_point, COUNT(*) AS cnt, AVG(mastery_level) AS avg_m
FROM learning_records
WHERE subject_id = :math_id AND knowledge_point IS NOT NULL
GROUP BY knowledge_point ORDER BY avg_m ASC;
```

### 按科目统计错题/知识点/反思分布
```sql
SELECT subject_id,
  SUM(CASE WHEN record_tags LIKE '%mistake%'    THEN 1 ELSE 0 END) AS mistakes,
  SUM(CASE WHEN record_tags LIKE '%knowledge%'  THEN 1 ELSE 0 END) AS knowledges,
  SUM(CASE WHEN record_tags LIKE '%reflection%' THEN 1 ELSE 0 END) AS reflections
FROM learning_records GROUP BY subject_id;
```

### 按阶段自动计算执行度评分
```sql
UPDATE phases_v2 SET execution_score = (
  SELECT AVG(completion_percent) FROM daily_executions
  WHERE phase_id = phases_v2.id
), composite_score = COALESCE(execution_score, 0) * 0.6 + COALESCE(achievement_score, 0) * 0.4
WHERE id = :phase_id;
```
