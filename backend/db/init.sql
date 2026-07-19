-- 规划管理系统数据库初始化脚本
-- SQLite 数据库建表语句

-- 1. 项目节点表（核心表，支持树形结构）
CREATE TABLE IF NOT EXISTS planning_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 基本信息
  node_type TEXT NOT NULL CHECK(node_type IN ('THEME', 'FOCUS_ITEM', 'POINT', 'TASK')),
  title TEXT NOT NULL,
  codename TEXT,
  description TEXT,
  
  -- 层级关系
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  
  -- 执行状态
  is_completed BOOLEAN DEFAULT 0,
  progress_percent INTEGER DEFAULT 0 CHECK(progress_percent >= 0 AND progress_percent <= 100),
  
  -- 任务属性
  task_type TEXT CHECK(task_type IN ('DAILY', 'PHASE', 'WEEKLY', 'NORMAL')),
  priority TEXT CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')),
  
  -- 时间信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date TEXT,
  end_date TEXT,
  
  -- 其他属性
  tag TEXT,
  extra_data TEXT,
  
  FOREIGN KEY (parent_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_node_parent_id ON planning_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_node_type ON planning_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_node_theme_sort ON planning_nodes(node_type, sort_order) WHERE node_type='THEME';
CREATE INDEX IF NOT EXISTS idx_node_updated ON planning_nodes(updated_at);

-- 2. 节点文字描述表
CREATE TABLE IF NOT EXISTS node_descriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_desc_node_id ON node_descriptions(node_id);

-- 3. 节点图片表
CREATE TABLE IF NOT EXISTS node_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_image_node_id ON node_images(node_id);

-- 4. 阶段表
CREATE TABLE IF NOT EXISTS phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('active', 'upcoming', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_phase_node_id ON phases(node_id);
CREATE INDEX IF NOT EXISTS idx_phase_status ON phases(status);

-- 5. 阶段要点表
CREATE TABLE IF NOT EXISTS phase_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_point_phase_id ON phase_points(phase_id);

-- 6. 每日执行记录表
CREATE TABLE IF NOT EXISTS daily_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  execution_date TEXT NOT NULL,
  
  -- 执行情况
  is_done BOOLEAN DEFAULT 0,
  completion_percent INTEGER DEFAULT 0 CHECK(completion_percent >= 0 AND completion_percent <= 100),
  
  -- 文图说明
  notes TEXT,
  images TEXT,
  
  -- 其他
  duration_minutes INTEGER,
  mood TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exec_node_date ON daily_executions(node_id, execution_date);
CREATE INDEX IF NOT EXISTS idx_exec_date ON daily_executions(execution_date);

-- 7. 阶段执行统计表
CREATE TABLE IF NOT EXISTS phase_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,
  
  -- 统计数据
  total_days INTEGER,
  completed_days INTEGER,
  avg_completion_percent REAL,
  
  -- 汇总信息
  summary_notes TEXT,
  summary_images TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES planning_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stat_phase_id ON phase_statistics(phase_id);
CREATE INDEX IF NOT EXISTS idx_stat_node_id ON phase_statistics(node_id);

-- 初始数据已移至 seed.js，需要时手动运行: node db/seed.js
-- INSERT OR IGNORE INTO planning_nodes ...
