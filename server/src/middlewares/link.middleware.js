import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { LinkMember } from '../models/linkMembers.model.js';
import { UserRolesEnum } from '../utils/constants.js';

const verifyLinkAccess = asyncHandler(async (req, res, next) => {
  const { linkId } = req.params;

  const membership = await LinkMember.findOne({
    link: linkId,
    user: req.user._id,
  }).populate('link');

  if (!membership) {
    throw new ApiError(403, 'You do not have access to this workspace');
  }

  req.link = membership.link;
  req.userRole = membership.role;

  next();
});

const requireLinkOwner = asyncHandler(async (req, res, next) => {
  if (req.userRole !== UserRolesEnum.OWNER) {
    throw new ApiError(403, 'Only the workspace owner can perform this action');
  }
  next();
});

export { verifyLinkAccess, requireLinkOwner };
