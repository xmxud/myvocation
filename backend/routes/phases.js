/**
 * 阶段路由
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const phasesController = require('../controllers/phasesController');

// 获取某节点的所有阶段
router.get('/by-node/:nodeId', asyncHandler(phasesController.getPhasesByNode));

// 阶段 CRUD
router.get('/:id', asyncHandler(phasesController.getPhase));
router.post('/', asyncHandler(phasesController.createPhase));
router.put('/:id', asyncHandler(phasesController.updatePhase));
router.delete('/:id', asyncHandler(phasesController.deletePhase));

// 阶段要点
router.post('/:id/points', asyncHandler(phasesController.addPhasePoint));
router.put('/:phaseId/points/:pointId', asyncHandler(phasesController.updatePhasePoint));
router.delete('/:phaseId/points/:pointId', asyncHandler(phasesController.deletePhasePoint));

module.exports = router;
