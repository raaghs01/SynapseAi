import { Router } from 'express';
import { registerUser , loginUser , logoutUser , refreshAccessToken , getCurrentUser} from '../controllers/auth.controller.js';
import { registerUserValidator , loginUserValidator } from '../validators/index.js';
import { validate } from '../middlewares/validate.middleware.js'
// import { loginUser } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
// import { Ap } from '../utils/ApiError.js';


const router = Router();

// unsecured
router.route('/register').post(registerUserValidator(),validate,registerUser);
router.route('/login').post(loginUserValidator(),validate,loginUser);
router.route('/refreshAccessToken').post(refreshAccessToken);


// secured route
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/getCurrentUser').get(verifyJWT,getCurrentUser);


export default router;
