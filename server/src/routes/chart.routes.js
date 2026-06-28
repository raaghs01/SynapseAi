import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyLinkAccess } from '../middlewares/link.middleware.js';
import { verifyBoardAccess } from '../middlewares/board.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createChartValidator, updateChartValidator } from '../validators/index.js';
import { createChart, getCharts, getChartById, syncGraph, deleteChart } from '../controllers/chart.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyJWT);
router.use(verifyLinkAccess);
router.use(verifyBoardAccess);

router.route('/').post(createChartValidator(), validate, createChart).get(getCharts);
router.route('/:chartId').get(getChartById).delete(deleteChart);
router.route('/:chartId/sync').patch(syncGraph);

export default router;
