import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Board } from '../models/board.model.js';
import { Link } from '../models/links.model.js';

const createBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const board = await Board.create({
    title,
    description: description || '',
    link: req.link._id,
  });

  await Link.findByIdAndUpdate(req.link._id, {
    $push: { boards: board._id },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, board, 'Board created successfully'));
});


const getBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find({ link: req.link._id }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, boards, 'Boards fetched successfully'));
});

const getBoardById = asyncHandler(async (req, res) => {
  const { boardId } = req.params;

  const board = await Board.findOne({
    _id: boardId,
    link: req.link._id,
  }).populate('charts', 'title description createdAt');

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, board, 'Board fetched successfully'));
});


const deleteBoard = asyncHandler(async (req, res) => {
  const { boardId } = req.params;

  const board = await Board.findOne({
    _id: boardId,
    link: req.link._id,
  });

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  await Board.findByIdAndDelete(boardId);

  await Link.findByIdAndUpdate(req.link._id, {
    $pull: { boards: board._id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Board deleted successfully'));
});

const updateBoard = asyncHandler(async (req, res) => {
  const { boardId } = req.params;
  const { title, description } = req.body;

  const board = await Board.findOneAndUpdate(
    { _id: boardId, link: req.link._id },
    { $set: { title, description } },
    { new: true, runValidators: true }
  );

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, board, 'Board updated successfully'));
});


export { createBoard , getBoards , getBoardById , updateBoard , deleteBoard};
