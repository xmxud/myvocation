/**
 * 阶段控制器
 * 为规划项划分多个阶段，每个阶段有具体的要点和时间范围
 */

const { query, get, run } = require('../db/db');
const { successResponse, errorResponse } = require('../utils/errorHandler');

/**
 * 获取某节点的所有阶段
 */
async function getPhasesByNode(req, res) {
  try {
    const { nodeId } = req.params;

    // 验证节点存在
    const node = await get('SELECT * FROM planning_nodes WHERE id = ?', [nodeId]);
    if (!node) {
      return errorResponse(res, new Error('节点不存在'), 404, '节点不存在');
    }

    const phases = await query(
      'SELECT * FROM phases WHERE node_id = ? ORDER BY phase_number ASC',
      [nodeId]
    );

    // 为每个阶段添加要点
    for (const phase of phases) {
      phase.points = await query(
        'SELECT * FROM phase_points WHERE phase_id = ? ORDER BY order_index ASC',
        [phase.id]
      );
    }

    successResponse(res, phases);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取单个阶段详情
 */
async function getPhase(req, res) {
  try {
    const { id } = req.params;

    const phase = await get('SELECT * FROM phases WHERE id = ?', [id]);
    if (!phase) {
      return errorResponse(res, new Error('阶段不存在'), 404, '阶段不存在');
    }

    phase.points = await query(
      'SELECT * FROM phase_points WHERE phase_id = ? ORDER BY order_index ASC',
      [id]
    );

    successResponse(res, phase);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 新增阶段
 */
async function createPhase(req, res) {
  try {
    const { node_id, phase_number, title, start_date, end_date, description } = req.body;

    if (!node_id || !phase_number || !title || !start_date || !end_date) {
      return errorResponse(
        res,
        new Error('缺少必填字段：node_id, phase_number, title, start_date, end_date'),
        400,
        '缺少必填字段'
      );
    }

    const result = await run(
      'INSERT INTO phases (node_id, phase_number, title, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [node_id, phase_number, title, start_date, end_date, description]
    );

    const newPhase = await get('SELECT * FROM phases WHERE id = ?', [result.id]);
    successResponse(res, newPhase, '阶段创建成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 更新阶段
 */
async function updatePhase(req, res) {
  try {
    const { id } = req.params;
    const { phase_number, title, start_date, end_date, description, status } = req.body;

    const sql = `
      UPDATE phases
      SET phase_number = COALESCE(?, phase_number),
          title = COALESCE(?, title),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await run(sql, [phase_number, title, start_date, end_date, description, status, id]);

    if (result.changes === 0) {
      return errorResponse(res, new Error('阶段不存在'), 404, '阶段不存在');
    }

    const updatedPhase = await get('SELECT * FROM phases WHERE id = ?', [id]);
    successResponse(res, updatedPhase, '阶段更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除阶段
 */
async function deletePhase(req, res) {
  try {
    const { id } = req.params;

    const result = await run('DELETE FROM phases WHERE id = ?', [id]);

    if (result.changes === 0) {
      return errorResponse(res, new Error('阶段不存在'), 404, '阶段不存在');
    }

    successResponse(res, { deletedId: id }, '阶段删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 添加阶段要点
 */
async function addPhasePoint(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return errorResponse(res, new Error('要点内容不能为空'), 400, '要点内容不能为空');
    }

    const result = await run(
      'INSERT INTO phase_points (phase_id, content, order_index) VALUES (?, ?, (SELECT COUNT(*) FROM phase_points WHERE phase_id = ?))',
      [id, content, id]
    );

    const point = await get('SELECT * FROM phase_points WHERE id = ?', [result.id]);
    successResponse(res, point, '要点添加成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 更新阶段要点
 */
async function updatePhasePoint(req, res) {
  try {
    const { phaseId, pointId } = req.params;
    const { content } = req.body;

    const result = await run(
      'UPDATE phase_points SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND phase_id = ?',
      [content, pointId, phaseId]
    );

    if (result.changes === 0) {
      return errorResponse(res, new Error('要点不存在'), 404, '要点不存在');
    }

    const point = await get('SELECT * FROM phase_points WHERE id = ?', [pointId]);
    successResponse(res, point, '要点更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除阶段要点
 */
async function deletePhasePoint(req, res) {
  try {
    const { phaseId, pointId } = req.params;

    const result = await run(
      'DELETE FROM phase_points WHERE id = ? AND phase_id = ?',
      [pointId, phaseId]
    );

    if (result.changes === 0) {
      return errorResponse(res, new Error('要点不存在'), 404, '要点不存在');
    }

    successResponse(res, { deletedId: pointId }, '要点删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

module.exports = {
  getPhasesByNode,
  getPhase,
  createPhase,
  updatePhase,
  deletePhase,
  addPhasePoint,
  updatePhasePoint,
  deletePhasePoint,
};
