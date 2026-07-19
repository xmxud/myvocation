/**
 * 主题路由
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const themesController = require('../controllers/themesController');

// 主题 CRUD
router.get('/', asyncHandler(themesController.getThemes));
router.post('/', asyncHandler(themesController.createTheme));
router.get('/:id', asyncHandler(themesController.getThemeDetail));
router.put('/:id', asyncHandler(themesController.updateTheme));
router.delete('/:id', asyncHandler(themesController.deleteTheme));

// 主题排序
router.post('/reorder', asyncHandler(themesController.reorderThemes));

module.exports = router;
