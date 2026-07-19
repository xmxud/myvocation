/**
 * 主题控制器
 * 主题是规划的顶层分类（如"暑期规划"、"秋季学期"等）
 */

const { query, get, run } = require('../db/db');
const { successResponse, errorResponse } = require('../utils/errorHandler');

/**
 * 获取所有主题（分页）
 */
async function getThemes(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const themes = await query(
      'SELECT id, title, codename, tag, progress_percent, is_completed, created_at FROM planning_nodes WHERE node_type = ? ORDER BY sort_order ASC LIMIT ? OFFSET ?',
      ['THEME', limit, offset]
    );

    const countResult = await get(
      'SELECT COUNT(*) as total FROM planning_nodes WHERE node_type = ?',
      ['THEME']
    );

    successResponse(res, {
      themes,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取单个主题详情及其重点项
 */
async function getThemeDetail(req, res) {
  try {
    const { id } = req.params;
    const theme = await get('SELECT * FROM planning_nodes WHERE id = ? AND node_type = ?', [id, 'THEME']);

    if (!theme) {
      return errorResponse(res, new Error('主题不存在'), 404, '主题不存在');
    }

    // 获取该主题下的所有重点项
    const focusItems = await query(
      'SELECT id, title, priority, progress_percent, is_completed, task_type FROM planning_nodes WHERE parent_id = ? AND node_type = ? ORDER BY sort_order ASC',
      [id, 'FOCUS_ITEM']
    );

    successResponse(res, {
      ...theme,
      focusItems,
    });
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 新增主题
 */
async function createTheme(req, res) {
  try {
    const { title, codename, description, tag } = req.body;

    if (!title) {
      return errorResponse(res, new Error('主题名称不能为空'), 400, '主题名称不能为空');
    }

    // 获取最大的 sort_order
    const maxSort = await get('SELECT MAX(sort_order) as max_order FROM planning_nodes WHERE node_type = ?', ['THEME']);
    const nextSort = (maxSort?.max_order || 0) + 1;

    const result = await run(
      'INSERT INTO planning_nodes (node_type, title, codename, description, tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      ['THEME', title, codename, description, tag, nextSort]
    );

    const newTheme = await get('SELECT * FROM planning_nodes WHERE id = ?', [result.id]);
    successResponse(res, newTheme, '主题创建成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 更新主题
 */
async function updateTheme(req, res) {
  try {
    const { id } = req.params;
    const { title, codename, description, tag, is_completed, progress_percent } = req.body;

    const sql = `
      UPDATE planning_nodes
      SET title = COALESCE(?, title),
          codename = COALESCE(?, codename),
          description = COALESCE(?, description),
          tag = COALESCE(?, tag),
          is_completed = COALESCE(?, is_completed),
          progress_percent = COALESCE(?, progress_percent),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND node_type = ?
    `;

    const result = await run(sql, [title, codename, description, tag, is_completed, progress_percent, id, 'THEME']);

    if (result.changes === 0) {
      return errorResponse(res, new Error('主题不存在'), 404, '主题不存在');
    }

    const updatedTheme = await get('SELECT * FROM planning_nodes WHERE id = ?', [id]);
    successResponse(res, updatedTheme, '主题更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除主题（级联删除）
 */
async function deleteTheme(req, res) {
  try {
    const { id } = req.params;

    // 验证主题存在
    const theme = await get('SELECT * FROM planning_nodes WHERE id = ? AND node_type = ?', [id, 'THEME']);
    if (!theme) {
      return errorResponse(res, new Error('主题不存在'), 404, '主题不存在');
    }

    // 级联删除（数据库外键约束会自动处理）
    const result = await run('DELETE FROM planning_nodes WHERE id = ?', [id]);

    successResponse(res, { deletedId: id, deletedRows: result.changes }, '主题删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 重新排序主题
 */
async function reorderThemes(req, res) {
  try {
    const { themeIds } = req.body;

    if (!Array.isArray(themeIds)) {
      return errorResponse(res, new Error('主题ID列表格式错误'), 400, '主题ID列表格式错误');
    }

    // 批量更新 sort_order
    for (let i = 0; i < themeIds.length; i++) {
      await run('UPDATE planning_nodes SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [i + 1, themeIds[i]]);
    }

    successResponse(res, { reorderedCount: themeIds.length }, '主题排序更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

module.exports = {
  getThemes,
  getThemeDetail,
  createTheme,
  updateTheme,
  deleteTheme,
  reorderThemes,
};
