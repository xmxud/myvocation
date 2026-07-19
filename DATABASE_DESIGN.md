# 项目数据库设计文档

## 概述
使用SQLite数据库存储规划、任务等信息，支持树形结构的多层级数据管理。

---

## 数据表设计

### 1. **项目节点表** (planning_nodes)
核心表，使用单表树形结构存储所有层级的规划项

```sql
CREATE TABLE planning_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 基本信息
  node_type TEXT NOT NULL,        -- 'THEME' | 'FOCUS_ITEM' | 'POINT' | 'TASK'
  title TEXT NOT NULL,             -- 节点名称（如"暑期规划"、"旅游"、"目的地规划"、"预订机票"）
  codename TEXT,                   -- 代码名称（如"SUMMER OPS"）
  description TEXT,                -- 描述信息
  
  -- 层级关系
  parent_id INTEGER,               -- 父节点ID，NULL表示为主题
  sort_order INTEGER DEFAULT 0,    -- 排序字段（用于THEME层级翻页时排序）
  
  -- 执行状态
  is_completed BOOLEAN DEFAULT 0,  -- 是否完成（0=未完成，1=已完成）
  progress_percent INTEGER DEFAULT 0,  -- 完成百分比（0-100）
  
  -- 任务属性
  task_type TEXT,                  -- 任务类型：'DAILY' | 'PHASE' | 'WEEKLY' | 'NORMAL'
  priority TEXT,                   -- 优先级：'HIGH' | 'MEDIUM' | 'LOW'
  
  -- 时间信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date TEXT,                 -- 开始日期（YYYY-MM-DD）
  end_date TEXT,                   -- 结束日期（YYYY-MM-DD）
  
  -- 其他属性
  tag TEXT,                        -- 标签（如'travel'、'robot'、'dailylearn'等）
  extra_data TEXT                  -- JSON字符串，存储额外数据
);

-- 索引优化
CREATE INDEX idx_node_parent_id ON planning_nodes(parent_id);
CREATE INDEX idx_node_type ON planning_nodes(node_type);
CREATE INDEX idx_node_theme_sort ON planning_nodes(node_type, sort_order) WHERE node_type='THEME';
```

### 2. **节点文字描述表** (node_descriptions)
为每个节点存储多条文字描述信息

```sql
CREATE TABLE node_descriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  content TEXT NOT NULL,           -- 描述内容
  order_index INTEGER DEFAULT 0,   -- 排序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_desc_node_id ON node_descriptions(node_id);
```

### 3. **节点图片表** (node_images)
为每个节点存储多张图片链接

```sql
CREATE TABLE node_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,         -- 图片链接或本地路径
  title TEXT,                      -- 图片标题
  description TEXT,                -- 图片描述
  order_index INTEGER DEFAULT 0,   -- 排序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_image_node_id ON node_images(node_id);
```

### 4. **阶段表** (phases)
用于存储规划项的阶段划分信息

```sql
CREATE TABLE phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,        -- 所属规划项ID（通常是FOCUS_ITEM）
  phase_number INTEGER NOT NULL,   -- 阶段编号（1,2,3,4...）
  title TEXT NOT NULL,             -- 阶段标题（如"第一阶段 临界点·破局行动"）
  start_date TEXT NOT NULL,        -- 开始日期（YYYY-MM-DD）
  end_date TEXT NOT NULL,          -- 结束日期（YYYY-MM-DD）
  description TEXT,                -- 阶段描述
  status TEXT DEFAULT 'upcoming',  -- 状态：'active' | 'upcoming' | 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_phase_node_id ON phases(node_id);
```

### 5. **阶段要点表** (phase_points)
用于存储每个阶段的具体要点

```sql
CREATE TABLE phase_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,
  content TEXT NOT NULL,           -- 要点内容
  order_index INTEGER DEFAULT 0,   -- 排序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
);

CREATE INDEX idx_point_phase_id ON phase_points(phase_id);
```

### 6. **每日执行记录表** (daily_executions)
为每个任务节点记录每日具体执行情况

```sql
CREATE TABLE daily_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,        -- 所属任务节点ID
  execution_date TEXT NOT NULL,    -- 执行日期（YYYY-MM-DD）
  
  -- 执行情况
  is_done BOOLEAN DEFAULT 0,       -- 该天是否完成
  completion_percent INTEGER DEFAULT 0,  -- 该天完成百分比
  
  -- 文图说明
  notes TEXT,                      -- 执行日志/笔记
  images TEXT,                     -- 图片JSON数组：[{url, title, desc}]
  
  -- 其他
  duration_minutes INTEGER,        -- 执行耗时（分钟）
  mood TEXT,                       -- 心情/感受
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_exec_node_date ON daily_executions(node_id, execution_date);
CREATE INDEX idx_exec_date ON daily_executions(execution_date);
```

### 7. **阶段执行统计表** (phase_statistics)
存储每个阶段的执行统计数据

```sql
CREATE TABLE phase_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,        -- 关联的规划项
  
  -- 统计数据
  total_days INTEGER,              -- 阶段共几天
  completed_days INTEGER,          -- 完成天数
  avg_completion_percent REAL,     -- 平均完成百分比
  
  -- 汇总信息
  summary_notes TEXT,              -- 阶段总结
  summary_images TEXT,             -- 总结图片
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_stat_phase_id ON phase_statistics(phase_id);
```

---

## 数据结构图示

```
THEME（主题）
├── id = 1
├── node_type = 'THEME'
├── title = '暑期规划'
├── parent_id = NULL
└── children (FOCUS_ITEM)
    ├── id = 10
    ├── node_type = 'FOCUS_ITEM'
    ├── title = '旅游'
    ├── parent_id = 1
    └── children (POINT)
        ├── id = 101
        ├── node_type = 'POINT'
        ├── title = '目的地规划'
        ├── parent_id = 10
        └── children (TASK)
            ├── id = 1001
            ├── node_type = 'TASK'
            ├── title = '预订机票'
            └── parent_id = 101
```

---

## 查询示例

### 获取所有主题（用于翻页展示）
```sql
SELECT id, title, codename, tag
FROM planning_nodes
WHERE node_type = 'THEME' AND parent_id IS NULL
ORDER BY sort_order ASC;
```

### 获取某个主题的所有重点项
```sql
SELECT id, title, priority, progress_percent
FROM planning_nodes
WHERE node_type = 'FOCUS_ITEM' AND parent_id = ?
ORDER BY sort_order ASC;
```

### 获取某个规划项的所有执行点
```sql
SELECT id, title, description
FROM planning_nodes
WHERE node_type = 'POINT' AND parent_id = ?
ORDER BY sort_order ASC;
```

### 获取某个规划项的具体任务清单
```sql
SELECT pn.id, pn.title, pn.is_completed, pn.progress_percent, pn.updated_at
FROM planning_nodes pn
WHERE pn.node_type = 'TASK' AND pn.parent_id = ?
ORDER BY pn.sort_order ASC;
```

### 获取某个规划项的阶段列表
```sql
SELECT id, phase_number, title, start_date, end_date, status
FROM phases
WHERE node_id = ?
ORDER BY phase_number ASC;
```

### 获取某个规划项的每日执行统计
```sql
SELECT 
  execution_date,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN is_done = 1 THEN 1 ELSE 0 END) as completed_tasks,
  AVG(completion_percent) as avg_completion
FROM daily_executions
WHERE node_id = ? AND execution_date BETWEEN ? AND ?
GROUP BY execution_date
ORDER BY execution_date ASC;
```

---

## 数据初始化建议

项目启动时可以预置一些初始数据：
- 常见主题（暑期、学期等）
- 常见的学习/娱乐分类
- 当前时间的日期范围

后续可以通过前端界面动态添加新的主题和规划项。
