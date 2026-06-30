import { Router } from 'express';


import * as linkControllers from "../controllers/link.controller.js"
import { verifyLinkAccess , requireLinkOwner} from '../middlewares/link.middleware.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.use(verifyJWT);


router.route('/').post(linkControllers.createLink).get(linkControllers.getMyLinks);
// Why /join before /:linkId matters: Express matches routes top to bottom. If /:linkId is declared first,
//  a request to /join gets captured as { linkId: 'join' } and the join controller never runs. Always put 
// literal paths before parameterized ones.
router.route('/join').post(linkControllers.joinLink);
router.route('/:linkId').get(verifyLinkAccess , linkControllers.getLinkById);


router.route('/:linkId').delete(verifyLinkAccess , requireLinkOwner , linkControllers.deleteLink);

export default router;