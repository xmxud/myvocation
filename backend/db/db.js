/**
 * SQLite 数据库连接和初始化
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'app.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库:', DB_PATH);
  }
});

/**
 * 初始化数据库，创建所有必要的表
 */
function initializeDatabase() {
  const sqlFilePath = path.join(__dirname, 'init.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf-8');

  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        console.error('数据库初始化失败:', err.message);
        reject(err);
      } else {
        console.log('✓ 数据库初始化成功');
        resolve();
      }
    });
  });
}

/**
 * 执行 SQL 查询（查询）
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * 执行 SQL 查询（单行）
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * 执行 SQL 修改（插入、更新、删除）
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * 关闭数据库连接
 */
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('数据库连接已关闭');
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  initializeDatabase,
  query,
  get,
  run,
  close,
};
