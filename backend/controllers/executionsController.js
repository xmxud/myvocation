/**
 * 每日执行记录控制器
 * 记录每项任务的每日执行情况、笔记、图片等
 */

const { query, get, run } = require('../db/db');
const { successResponse, errorResponse } = require('../utils/errorHandler');

/**
 * 获取某节点的所有执行记录
 */
async function getExecutionsByNode(req, res) {
  try {
    const { nodeId } = req.params;
    const { startDate, endDate } = req.query;

    let sql = 'SELECT * FROM daily_executions WHERE node_id = ?';
    const params = [nodeId];

    if (startDate) {
      sql += ' AND execution_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND execution_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY execution_date DESC';

    const executions = await query(sql, params);
    successResponse(res, executions);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取特定日期的执行记录
 */
async function getExecutionByDate(req, res) {
  try {
    const { nodeId, date } = req.params;

    const execution = await get(
      'SELECT * FROM daily_executions WHERE node_id = ? AND execution_date = ?',
      [nodeId, date]
    );

    if (!execution) {
      return successResponse(res, null, '未找到该日期的记录');
    }

    // 解析 images JSON 字符串
    if (execution.images) {
      execution.images = JSON.parse(execution.images);
    }

    successResponse(res, execution);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 新增执行记录
 */
async function createExecution(req, res) {
  try {
    const { node_id, execution_date, is_done, completion_percent, notes, duration_minutes, mood } = req.body;

    if (!node_id || !execution_date) {
      return errorResponse(res, new Error('缺少必填字段：node_id, execution_date'), 400, '缺少必填字段');
    }

    const result = await run(
      `INSERT INTO daily_executions 
       (node_id, execution_date, is_done, completion_percent, notes, duration_minutes, mood)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [node_id, execution_date, is_done ? 1 : 0, completion_percent || 0, notes, duration_minutes, mood]
    );

    const newExecution = await get('SELECT * FROM daily_executions WHERE id = ?', [result.id]);
    successResponse(res, newExecution, '执行记录创建成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 更新执行记录
 */
async function updateExecution(req, res) {
  try {
    const { id } = req.params;
    const { is_done, completion_percent, notes, duration_minutes, mood } = req.body;

    const sql = `
      UPDATE daily_executions
      SET is_done = COALESCE(?, is_done),
          completion_percent = COALESCE(?, completion_percent),
          notes = COALESCE(?, notes),
          duration_minutes = COALESCE(?, duration_minutes),
          mood = COALESCE(?, mood),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await run(sql, [is_done, completion_percent, notes, duration_minutes, mood, id]);

    if (result.changes === 0) {
      return errorResponse(res, new Error('执行记录不存在'), 404, '执行记录不存在');
    }

    const updatedExecution = await get('SELECT * FROM daily_executions WHERE id = ?', [id]);
    successResponse(res, updatedExecution, '执行记录更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除执行记录
 */
async function deleteExecution(req, res) {
  try {
    const { id } = req.params;

    const result = await run('DELETE FROM daily_executions WHERE id = ?', [id]);

    if (result.changes === 0) {
      return errorResponse(res, new Error('执行记录不存在'), 404, '执行记录不存在');
    }

    successResponse(res, { deletedId: id }, '执行记录删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 添加执行记录中的图片
 */
async function addExecutionImage(req, res) {
  try {
    const { id } = req.params;
    const { image_url, title, description } = req.body;

    if (!image_url) {
      return errorResponse(res, new Error('图片URL不能为空'), 400, '图片URL不能为空');
    }

    // 获取现有的执行记录
    const execution = await get('SELECT * FROM daily_executions WHERE id = ?', [id]);
    if (!execution) {
      return errorResponse(res, new Error('执行记录不存在'), 404, '执行记录不存在');
    }

    // 解析现有图片数组
    let images = [];
    if (execution.images) {
      try {
        images = JSON.parse(execution.images);
      } catch (e) {
        images = [];
      }
    }

    // 添加新图片
    images.push({
      url: image_url,
      title: title || '',
      description: description || '',
      addedAt: new Date().toISOString(),
    });

    // 保存更新
    await run('UPDATE daily_executions SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      JSON.stringify(images),
      id,
    ]);

    const updatedExecution = await get('SELECT * FROM daily_executions WHERE id = ?', [id]);
    successResponse(res, updatedExecution, '图片添加成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除执行记录中的图片
 */
async function deleteExecutionImage(req, res) {
  try {
    const { id, imageIndex } = req.params;

    const execution = await get('SELECT * FROM daily_executions WHERE id = ?', [id]);
    if (!execution) {
      return errorResponse(res, new Error('执行记录不存在'), 404, '执行记录不存在');
    }

    let images = [];
    if (execution.images) {
      try {
        images = JSON.parse(execution.images);
      } catch (e) {
        images = [];
      }
    }

    // 删除指定索引的图片
    images.splice(parseInt(imageIndex), 1);

    await run('UPDATE daily_executions SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      JSON.stringify(images),
      id,
    ]);

    const updatedExecution = await get('SELECT * FROM daily_executions WHERE id = ?', [id]);
    successResponse(res, updatedExecution, '图片删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

module.exports = {
  getExecutionsByNode,
  getExecutionByDate,
  createExecution,
  updateExecution,
  deleteExecution,
  addExecutionImage,
  deleteExecutionImage,
};
