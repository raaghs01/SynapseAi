import { Router } from 'express';

import {
  registerUser, loginUser, logoutUser,
  refreshAccessToken, getCurrentUser,
  forgotPassword, resetPassword, changePassword
} from '../controllers/auth.controller.js';
import { registerUserValidator , loginUserValidator , userChangeCurrentPasswordValidator , userForgotPasswordValidator , userResetForgotPasswordValidator } from '../validators/index.js';
import { validate } from '../middlewares/validate.middleware.js'
// import { loginUser } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
// import { Ap } from '../utils/ApiError.js';


const router = Router();

// unsecured
router.route('/register').post(registerUserValidator(),validate,registerUser);
router.route('/login').post(loginUserValidator(),validate,loginUser);
router.route('/refreshAccessToken').post(refreshAccessToken);
router.route('/forgot-password').post(userForgotPasswordValidator(),validate,forgotPassword);
router.route('/reset-password/:resetToken').post(userResetForgotPasswordValidator(),validate,resetPassword)


// secured route
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/getCurrentUser').get(verifyJWT,getCurrentUser);
router.route('/change-password').post(verifyJWT,userChangeCurrentPasswordValidator(), validate,changePassword);


export default router;
