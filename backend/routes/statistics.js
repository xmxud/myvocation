/**
 * 统计数据路由
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const statisticsController = require('../controllers/statisticsController');

// 阶段统计
router.get('/phase/:phaseId', asyncHandler(statisticsController.getPhaseStatistics));

// 节点统计
router.get('/node/:nodeId', asyncHandler(statisticsController.getNodeStatistics));

// 主题统计
router.get('/theme/:themeId', asyncHandler(statisticsController.getThemeStatistics));

// 日期范围统计
router.get('/', asyncHandler(statisticsController.getDateRangeStatistics));

module.exports = router;
