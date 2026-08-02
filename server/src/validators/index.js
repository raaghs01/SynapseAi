import { body } from 'express-validator';

export const registerUserValidator = () => {
  return [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters'),

    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9_.]+$/)
       .withMessage('Username can only contain letters, numbers, _ and .'),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Enter a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ];
};

export const loginUserValidator = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Enter a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ];
};

export const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
  .notEmpty()
  .withMessage("New password is required")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number")
  ];
};

export const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage("Email is invalid"),
  ];
};

export const userResetForgotPasswordValidator = () => {
  return [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")];
};


export const createLinkValidator = () => [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Workspace name is required'),
    
  body('description')
    .optional()
    .trim(),
];

export const updateLinkValidator = () => [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Workspace name cannot be empty'),
  body('description')
    .optional()
    .trim(),
];


// import { body } from 'express-validator';

export const createBoardValidator = () => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Board title is required'),
  body('description')
    .optional()
    .trim(),
];

export const updateBoardValidator = () => [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .trim(),
];

// import { body } from 'express-validator';

export const createChartValidator = () => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Chart title is required'),
  body('description')
    .optional()
    .trim(),
];

export const updateChartValidator = () => [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .trim(),
];


export const createIdeaValidator = () => [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required'),
  body('description').optional().trim(),
  body('idea_space').optional().trim(),
  body('github_link').optional().trim().isURL().withMessage('Invalid GitHub link'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('guidingPoints').optional().isArray(),
  body('additionalPoints').optional().isArray(),
  body('constraints').optional().isArray(),
];

export const updateIdeaValidator = () => [
  body('topic').optional().trim().notEmpty().withMessage('Topic cannot be empty'),
  body('description').optional().trim(),
  body('idea_space').optional().trim(),
  body('github_link').optional().trim().isURL().withMessage('Invalid GitHub link'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('guidingPoints').optional().isArray(),
  body('additionalPoints').optional().isArray(),
  body('constraints').optional().isArray(),
];

// export { createChartValidator, updateChartValidator };


// export { createBoardValidator, updateBoardValidator };


// export { createBoardValidator };


// export { registerUserValidator, loginUserValidator , userChangeCurrentPasswordValidator , userResetForgotPasswordValidator , userForgotPasswordValidator};
