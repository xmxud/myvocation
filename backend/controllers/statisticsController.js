/**
 * 统计数据控制器
 * 提供各种统计和分析数据
 */

const { query, get } = require('../db/db');
const { successResponse, errorResponse } = require('../utils/errorHandler');

/**
 * 获取阶段统计数据
 */
async function getPhaseStatistics(req, res) {
  try {
    const { phaseId } = req.params;

    // 获取阶段信息
    const phase = await get('SELECT * FROM phases WHERE id = ?', [phaseId]);
    if (!phase) {
      return errorResponse(res, new Error('阶段不存在'), 404, '阶段不存在');
    }

    // 获取该阶段时间范围内所有执行记录
    const executions = await query(
      `SELECT * FROM daily_executions 
       WHERE node_id = ? AND execution_date >= ? AND execution_date <= ?
       ORDER BY execution_date ASC`,
      [phase.node_id, phase.start_date, phase.end_date]
    );

    // 计算统计数据
    const totalDays = executions.length;
    const completedDays = executions.filter((e) => e.is_done).length;
    const totalCompletion = executions.reduce((sum, e) => sum + (e.completion_percent || 0), 0);
    const avgCompletion = totalDays > 0 ? Math.round(totalCompletion / totalDays) : 0;

    const stats = {
      phaseId,
      phaseTitle: phase.title,
      startDate: phase.start_date,
      endDate: phase.end_date,
      totalDays,
      completedDays,
      avgCompletion,
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      executions: executions.map((e) => ({
        date: e.execution_date,
        isDone: !!e.is_done,
        completion: e.completion_percent,
        notes: e.notes,
      })),
    };

    successResponse(res, stats);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取节点的执行统计
 */
async function getNodeStatistics(req, res) {
  try {
    const { nodeId } = req.params;

    // 获取节点信息
    const node = await get('SELECT * FROM planning_nodes WHERE id = ?', [nodeId]);
    if (!node) {
      return errorResponse(res, new Error('节点不存在'), 404, '节点不存在');
    }

    // 获取该节点的所有执行记录
    const executions = await query('SELECT * FROM daily_executions WHERE node_id = ? ORDER BY execution_date ASC', [
      nodeId,
    ]);

    // 按日期分组统计
    const dailyStats = {};
    executions.forEach((e) => {
      if (!dailyStats[e.execution_date]) {
        dailyStats[e.execution_date] = {
          date: e.execution_date,
          isDone: !!e.is_done,
          completion: e.completion_percent,
          duration: e.duration_minutes || 0,
          mood: e.mood,
        };
      }
    });

    // 计算总体统计
    const totalExecutions = executions.length;
    const completedExecutions = executions.filter((e) => e.is_done).length;
    const totalDuration = executions.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const avgCompletion = totalExecutions > 0 ? Math.round(executions.reduce((sum, e) => sum + e.completion_percent, 0) / totalExecutions) : 0;

    const stats = {
      nodeId,
      nodeTitle: node.title,
      totalExecutions,
      completedExecutions,
      completionRate: totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0,
      avgCompletion,
      totalDuration,
      dailyStats: Object.values(dailyStats),
    };

    successResponse(res, stats);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取日期范围内的统计数据
 */
async function getDateRangeStatistics(req, res) {
  try {
    const { nodeId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return errorResponse(res, new Error('缺少必填参数：startDate, endDate'), 400, '缺少必填参数');
    }

    let sql = 'SELECT * FROM daily_executions WHERE execution_date >= ? AND execution_date <= ?';
    const params = [startDate, endDate];

    if (nodeId) {
      sql += ' AND node_id = ?';
      params.push(nodeId);
    }

    sql += ' ORDER BY execution_date ASC';

    const executions = await query(sql, params);

    // 按日期汇总
    const dailyStats = {};
    executions.forEach((e) => {
      if (!dailyStats[e.execution_date]) {
        dailyStats[e.execution_date] = {
          date: e.execution_date,
          tasks: 0,
          completed: 0,
          avgCompletion: 0,
        };
      }
      dailyStats[e.execution_date].tasks += 1;
      if (e.is_done) dailyStats[e.execution_date].completed += 1;
      dailyStats[e.execution_date].avgCompletion = Math.round(
        (dailyStats[e.execution_date].avgCompletion * (dailyStats[e.execution_date].tasks - 1) +
          e.completion_percent) /
          dailyStats[e.execution_date].tasks
      );
    });

    // 计算总体统计
    const totalTasks = executions.length;
    const completedTasks = executions.filter((e) => e.is_done).length;
    const avgCompletion = totalTasks > 0 ? Math.round(executions.reduce((sum, e) => sum + e.completion_percent, 0) / totalTasks) : 0;

    const stats = {
      dateRange: { startDate, endDate },
      nodeId: nodeId || 'all',
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      avgCompletion,
      dailyStats: Object.values(dailyStats),
    };

    successResponse(res, stats);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取主题级别的汇总统计
 */
async function getThemeStatistics(req, res) {
  try {
    const { themeId } = req.params;

    // 获取主题信息
    const theme = await get('SELECT * FROM planning_nodes WHERE id = ? AND node_type = ?', [themeId, 'THEME']);
    if (!theme) {
      return errorResponse(res, new Error('主题不存在'), 404, '主题不存在');
    }

    // 获取该主题下所有重点项
    const focusItems = await query(
      'SELECT id, title, progress_percent, is_completed FROM planning_nodes WHERE parent_id = ? AND node_type = ?',
      [themeId, 'FOCUS_ITEM']
    );

    // 获取该主题下的所有执行记录
    const allFocusItemIds = focusItems.map((item) => item.id);
    let totalExecutions = 0;
    let completedExecutions = 0;
    let avgCompletion = 0;

    if (allFocusItemIds.length > 0) {
      const placeholders = allFocusItemIds.map(() => '?').join(',');
      const executions = await query(
        `SELECT * FROM daily_executions WHERE node_id IN (${placeholders})`,
        allFocusItemIds
      );

      totalExecutions = executions.length;
      completedExecutions = executions.filter((e) => e.is_done).length;
      avgCompletion = totalExecutions > 0 ? Math.round(executions.reduce((sum, e) => sum + e.completion_percent, 0) / totalExecutions) : 0;
    }

    const stats = {
      themeId,
      themeTitle: theme.title,
      focusItemsCount: focusItems.length,
      focusItems: focusItems.map((item) => ({
        id: item.id,
        title: item.title,
        progress: item.progress_percent,
        isCompleted: !!item.is_completed,
      })),
      totalExecutions,
      completedExecutions,
      completionRate: totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0,
      avgCompletion,
    };

    successResponse(res, stats);
  } catch (error) {
    errorResponse(res, error);
  }
}

module.exports = {
  getPhaseStatistics,
  getNodeStatistics,
  getDateRangeStatistics,
  getThemeStatistics,
};
