// used for charts as security access 
import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Board } from '../models/board.model.js';

const verifyBoardAccess = asyncHandler(async (req, res, next) => {
  const { boardId } = req.params;

  const board = await Board.findOne({
    _id: boardId,
    link: req.link._id,
  });

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  req.board = board;
  next();
});

export { verifyBoardAccess };
