import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyLinkAccess, requireLinkOwner } from '../middlewares/link.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createBoardValidator , updateBoardValidator } from '../validators/index.js';
import { createBoard, getBoards, getBoardById, deleteBoard , updateBoard} from '../controllers/board.controller.js';


// One important thing — mergeParams: true:

// Board routes are nested under link routes (/api/v1/links/:linkId/boards). By default,
//  a child router can't see the parent's params — req.params.linkId would be undefined in 
// board routes. mergeParams: true merges the parent params into the child router so verifyLinkAccess
//  can read req.params.linkId.
const router = Router({ mergeParams: true });



router.use(verifyJWT);
router.use(verifyLinkAccess);

router.route('/').post(createBoardValidator(), validate, createBoard).get(getBoards);
router.route('/:boardId').get(getBoardById).delete(requireLinkOwner, deleteBoard).patch(updateBoardValidator(), validate, updateBoard);

export default router;