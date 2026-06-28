import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyLinkAccess } from '../middlewares/link.middleware.js';
import { verifyBoardAccess } from '../middlewares/board.middleware.js';
import { verifyChartAccess } from '../middlewares/chart.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { createIdeaValidator, updateIdeaValidator } from '../validators/index.js';
import { createIdea, getIdeas, getIdeaById, updateIdea, deleteIdea } from '../controllers/idea.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyJWT);
router.use(verifyLinkAccess);
router.use(verifyBoardAccess);
router.use(verifyChartAccess);

router.route('/')
  .post(upload.array('images', 5), createIdeaValidator(), validate, createIdea)
  .get(getIdeas);

router.route('/:ideaId')
  .get(getIdeaById)
  .patch(upload.array('images', 5), updateIdeaValidator(), validate, updateIdea)
  .delete(deleteIdea);

export default router;
