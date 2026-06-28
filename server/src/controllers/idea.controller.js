import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Idea } from '../models/idea.model.js';
import { Chart } from '../models/chart.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const createIdea = asyncHandler(async (req, res) => {
  const {
    topic,
    description,
    idea_space,
    github_link,
    progress,
    guidingPoints,
    additionalPoints,
    constraints,
    nodeId,
  } = req.body;

  const imageUrls = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) {
        imageUrls.push(uploaded.secure_url);
      }
    }
  }

  const idea = await Idea.create({
    topic,
    description: description || '',
    idea_space: idea_space || '',
    github_link: github_link || '',
    progress: progress || 0,
    guidingPoints: guidingPoints || [],
    additionalPoints: additionalPoints || [],
    constraints: constraints || [],
    images: imageUrls,
    chart: req.chart._id,
    createdBy: req.user._id,
  });

  await Chart.findByIdAndUpdate(req.chart._id, {
    $push: { ideas: idea._id },
  });

  if (nodeId) {
    await Chart.findOneAndUpdate(
      { _id: req.chart._id, 'graphNodes.nodeId': nodeId },
      { $set: { 'graphNodes.$.ideaRef': idea._id } }
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, idea, 'Idea created successfully'));
});

const getIdeas = asyncHandler(async (req, res) => {
  const ideas = await Idea.find({ chart: req.chart._id })
    .select('topic description progress createdBy createdAt')
    .populate('createdBy', 'fullName username')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, ideas, 'Ideas fetched successfully'));
});

const getIdeaById = asyncHandler(async (req, res) => {
  const { ideaId } = req.params;

  const idea = await Idea.findOne({
    _id: ideaId,
    chart: req.chart._id,
  })
    .populate('createdBy', 'fullName username avatar')
    .populate('contributors', 'fullName username avatar');

  if (!idea) {
    throw new ApiError(404, 'Idea not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, idea, 'Idea fetched successfully'));
});

const updateIdea = asyncHandler(async (req, res) => {
  const { ideaId } = req.params;
  const {
    topic,
    description,
    idea_space,
    github_link,
    progress,
    guidingPoints,
    additionalPoints,
    constraints,
  } = req.body;

  const newImageUrls = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) {
        newImageUrls.push(uploaded.secure_url);
      }
    }
  }

  const updateFields = {
    ...(topic && { topic }),
    ...(description !== undefined && { description }),
    ...(idea_space !== undefined && { idea_space }),
    ...(github_link !== undefined && { github_link }),
    ...(progress !== undefined && { progress }),
    ...(guidingPoints && { guidingPoints }),
    ...(additionalPoints && { additionalPoints }),
    ...(constraints && { constraints }),
  };

  if (newImageUrls.length > 0) {
    updateFields.$push = { images: { $each: newImageUrls } };
  }

  const idea = await Idea.findOneAndUpdate(
    { _id: ideaId, chart: req.chart._id },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!idea) {
    throw new ApiError(404, 'Idea not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, idea, 'Idea updated successfully'));
});


const deleteIdea = asyncHandler(async (req, res) => {
  const { ideaId } = req.params;

  const idea = await Idea.findOneAndDelete({
    _id: ideaId,
    chart: req.chart._id,
  });

  if (!idea) {
    throw new ApiError(404, 'Idea not found');
  }

  await Chart.findByIdAndUpdate(req.chart._id, {
    $pull: { ideas: idea._id },
  });

  await Chart.findOneAndUpdate(
    { _id: req.chart._id, 'graphNodes.ideaRef': idea._id },
    { $set: { 'graphNodes.$.ideaRef': null } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Idea deleted successfully'));
});



export { createIdea , getIdeas , getIdeaById , updateIdea , deleteIdea};
