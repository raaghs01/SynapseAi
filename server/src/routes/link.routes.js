import { Router } from 'express';


import * as linkControllers from "../controllers/link.controller.js"
import { verifyLinkAccess , requireLinkOwner} from '../middlewares/link.middleware.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.use(verifyJWT);

router.route('/').post(linkControllers.createLink).get(linkControllers.getMyLinks);
router.route('/links/:linkId').get(verifyLinkAccess , linkControllers.getLinkById);

router.route('/join').post(linkControllers.joinLink);
router.route('/:linkId').delete(verifyLinkAccess , requireLinkOwner , linkControllers.deleteLink);

export default router;