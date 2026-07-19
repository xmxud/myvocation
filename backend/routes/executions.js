/**
 * 每日执行记录路由
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const executionsController = require('../controllers/executionsController');

// 获取某节点的所有执行记录（支持日期范围筛选）
router.get('/:nodeId', asyncHandler(executionsController.getExecutionsByNode));

// 获取特定日期的执行记录
router.get('/:nodeId/:date', asyncHandler(executionsController.getExecutionByDate));

// 执行记录 CRUD
router.post('/', asyncHandler(executionsController.createExecution));
router.put('/:id', asyncHandler(executionsController.updateExecution));
router.delete('/:id', asyncHandler(executionsController.deleteExecution));

// 执行记录中的图片
router.post('/:id/images', asyncHandler(executionsController.addExecutionImage));
router.delete('/:id/images/:imageIndex', asyncHandler(executionsController.deleteExecutionImage));

module.exports = router;
