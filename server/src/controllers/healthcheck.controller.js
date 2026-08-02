import { asyncHandler } from '../utils/asynchandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
// import { ApiError } from '../utils/ApiError.js';

const healthcheck = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: 'ok' }, 'Server is healthy'));
});
// const healthcheck = async(req,res) => {
//   try {
//     res.status(200).json(new ApiResponse());
    
//   } catch (error) {
//     res.status(500).json(new ApiError());
//     process.exit(1);
//   }
// }

export { healthcheck };
