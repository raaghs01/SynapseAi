import { Router } from 'express';

// import {
//   registerUser, loginUser, logoutUser,
//   refreshAccessToken, getCurrentUser,
//   forgotPassword, resetPassword, changePassword
// } from '../controllers/auth.controller.js';

import * as authController from '../controllers/auth.controller.js'

import * as validators from '../validators/index.js'
//import { registerUserValidator , loginUserValidator , userChangeCurrentPasswordValidator , userForgotPasswordValidator , userResetForgotPasswordValidator } from '../validators/index.js';

import { validate } from '../middlewares/validate.middleware.js'

import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();

// unsecured
router.route('/register')
.post(validators.registerUserValidator(),
validate,
authController.registerUser
);

router.route('/login')
.post(validators.loginUserValidator(),
validate,
authController.loginUser
);

router.route('/refreshAccessToken')
.post(authController.refreshAccessToken
);

router.route('/forgot-password')
.post(validators.userForgotPasswordValidator(),
validate,
authController.forgotPassword
);

router.route('/reset-password/:resetToken')
.post(validators.userResetForgotPasswordValidator(),
validate,
authController.resetPassword
);


// secured route
router.route('/logout')
.post(verifyJWT,
  authController.logoutUser
);

router.route('/getCurrentUser')
.get(verifyJWT
  ,authController.getCurrentUser
);

router.route('/change-password')
.post(verifyJWT
  ,validators.userChangeCurrentPasswordValidator()
  ,validate
  ,authController.changePassword
);


export default router;
