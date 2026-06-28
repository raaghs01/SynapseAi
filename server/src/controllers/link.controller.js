import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Link } from '../models/links.model.js';
import { LinkMember } from '../models/linkMembers.model.js';
import { UserRolesEnum } from '../utils/constants.js';
import crypto from 'crypto';



const generateInviteCode = () => {
  return crypto.randomBytes(6).toString('hex');
};


const createLink = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, 'Workspace name is required');
  }

  const link = await Link.create({
    name,
    description: description || '',
    createdBy: req.user._id,
    inviteCode:generateInviteCode
  });

  await LinkMember.create({
    link: link._id,
    user: req.user._id,
    role: UserRolesEnum.OWNER,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, link, 'Workspace created successfully'));
});

const getMyLinks = asyncHandler(async (req, res) => {
  const memberships = await LinkMember.find({ user: req.user._id })
    .populate('link', 'name description createdBy boards createdAt');

  const links = memberships.map((membership) => ({
    ...membership.link.toObject(),
    role: membership.role,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, links, 'Workspaces fetched successfully'));
});


const getLinkById = asyncHandler(async (req, res) => {
  await req.link.populate('boards', 'title description createdAt');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { link: req.link, role: req.userRole },
        'Workspace fetched successfully'
      )
    );
});


const joinLink = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  if (!inviteCode?.trim()) {
    throw new ApiError(400, 'Invite code is required');
  }

  const link = await Link.findOne({ inviteCode });

  if (!link) {
    throw new ApiError(404, 'Invalid invite code');
  }

  const existingMembership = await LinkMember.findOne({
    link: link._id,
    user: req.user._id,
  });

  if (existingMembership) {
    throw new ApiError(409, 'You are already a member of this workspace');
  }

  const membership = await LinkMember.create({
    link: link._id,
    user: req.user._id,
    role: UserRolesEnum.MEMBER,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { link, membership }, 'Joined workspace successfully'));
});


const deleteLink = asyncHandler(async (req, res) => {
  await Link.findByIdAndDelete(req.link._id);

  await LinkMember.deleteMany({ link: req.link._id });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Workspace deleted successfully'));
});



export { createLink , getMyLinks, getLinkById , joinLink , deleteLink };
