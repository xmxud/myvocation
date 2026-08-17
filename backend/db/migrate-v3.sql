-- V3 迁移：daily_executions 增加 sort_order（计划项排序，编辑计划页用）
-- SQLite 不支持 IF NOT EXISTS 加列，重复执行会报错，仅需执行一次：
--   cd backend && python3 -c "import sqlite3; sqlite3.connect('db/app.db').executescript(open('db/migrate-v3.sql').read())"
ALTER TABLE daily_executions ADD COLUMN sort_order INTEGER DEFAULT 0;
