/**
 * AI 路由
 * 对接 DeepSeek 大模型的功能接口
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const aiController = require('../controllers/aiController');

// 健康检查
router.get('/health', asyncHandler(aiController.healthCheck));

// 生成变式题
router.post('/generate-exercises', asyncHandler(aiController.generateExercises));

// 错题分析
router.post('/analyze-mistake', asyncHandler(aiController.analyzeMistake));

module.exports = router;
