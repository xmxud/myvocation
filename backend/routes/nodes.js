/**
 * 节点路由
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const nodesController = require('../controllers/nodesController');

// 节点 CRUD（注意：/:id 路由要放在更具体的路由后面）
router.get('/:id/children', asyncHandler(nodesController.getChildren));
router.get('/:id/full-tree', asyncHandler(nodesController.getFullTree));
router.get('/:id/descriptions', async (req, res) => {
  const { query } = require('../db/db');
  try {
    const descriptions = await query('SELECT * FROM node_descriptions WHERE node_id = ? ORDER BY order_index ASC', [req.params.id]);
    const { successResponse } = require('../utils/errorHandler');
    successResponse(res, descriptions);
  } catch (error) {
    const { errorResponse } = require('../utils/errorHandler');
    errorResponse(res, error);
  }
});
router.get('/:id/images', async (req, res) => {
  const { query } = require('../db/db');
  try {
    const images = await query('SELECT * FROM node_images WHERE node_id = ? ORDER BY order_index ASC', [req.params.id]);
    const { successResponse } = require('../utils/errorHandler');
    successResponse(res, images);
  } catch (error) {
    const { errorResponse } = require('../utils/errorHandler');
    errorResponse(res, error);
  }
});

// 基础 CRUD
router.get('/:id', asyncHandler(nodesController.getNode));
router.post('/', asyncHandler(nodesController.createNode));
router.put('/:id', asyncHandler(nodesController.updateNode));
router.delete('/:id', asyncHandler(nodesController.deleteNode));

// 文字描述
router.post('/:id/descriptions', asyncHandler(nodesController.addDescription));
router.delete('/:id/descriptions/:descId', asyncHandler(nodesController.deleteDescription));
router.put('/:id/descriptions/:descId', async (req, res) => {
  const { run, get } = require('../db/db');
  const { successResponse, errorResponse } = require('../utils/errorHandler');
  try {
    const { content } = req.body;
    await run('UPDATE node_descriptions SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND node_id = ?', 
      [content, req.params.descId, req.params.id]);
    const desc = await get('SELECT * FROM node_descriptions WHERE id = ?', [req.params.descId]);
    successResponse(res, desc, '描述更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
});

// 图片
router.post('/:id/images', asyncHandler(nodesController.addImage));
router.delete('/:id/images/:imageId', asyncHandler(nodesController.deleteImage));
router.put('/:id/images/:imageId', async (req, res) => {
  const { run, get } = require('../db/db');
  const { successResponse, errorResponse } = require('../utils/errorHandler');
  try {
    const { image_url, title, description } = req.body;
    await run('UPDATE node_images SET image_url = ?, title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND node_id = ?', 
      [image_url, title, description, req.params.imageId, req.params.id]);
    const image = await get('SELECT * FROM node_images WHERE id = ?', [req.params.imageId]);
    successResponse(res, image, '图片更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
});

module.exports = router;
