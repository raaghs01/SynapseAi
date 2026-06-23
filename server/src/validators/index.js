import { body } from 'express-validator';

const registerUserValidator = () => {
  return [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required'),

    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters')
      .isAlphanumeric()
      .withMessage('Username can only contain letters and numbers'),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Enter a valid email address'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ];
};

const loginUserValidator = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Enter a valid email address'),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ];
};

export { registerUserValidator, loginUserValidator };
