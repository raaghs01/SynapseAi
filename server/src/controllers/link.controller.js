import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Link } from '../models/links.model.js';

const createLink = asyncHandler(async (req, res) => {
  const link = await Link.create({
    createdBy: req.user._id,
    users: [req.user._id],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, link, 'Workspace created successfully'));
});

export { createLink };
