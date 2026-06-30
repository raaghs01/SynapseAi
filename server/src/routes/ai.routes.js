import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyLinkAccess } from '../middlewares/link.middleware.js';
import { verifyBoardAccess } from '../middlewares/board.middleware.js';
import { verifyChartAccess } from '../middlewares/chart.middleware.js';
import { expandNode, suggestConnections, summarizeCluster } from '../controllers/ai.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyJWT);
router.use(verifyLinkAccess);
router.use(verifyBoardAccess);
router.use(verifyChartAccess);

router.route('/expand-node').post(expandNode);
router.route('/suggest-connections').post(suggestConnections);
router.route('/summarize-cluster').post(summarizeCluster);

export default router;
