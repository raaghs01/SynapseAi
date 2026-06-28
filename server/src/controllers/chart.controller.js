import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Chart } from '../models/chart.model.js';
import { Board } from '../models/board.model.js';

const createChart = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const chart = await Chart.create({
    title,
    description: description || '',
    board: req.board._id,
    graphNodes: [],
    graphEdges: [],
  });

  await Board.findByIdAndUpdate(req.board._id, {
    $push: { charts: chart._id },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, chart, 'Chart created successfully'));
});

const getCharts = asyncHandler(async (req, res) => {
  const charts = await Chart.find({ board: req.board._id })
    .select('title description createdAt')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, charts, 'Charts fetched successfully'));
});

const getChartById = asyncHandler(async (req, res) => {
  const { chartId } = req.params;

  const chart = await Chart.findOne({
    _id: chartId,
    board: req.board._id,
  }).populate('graphNodes.ideaRef', 'topic description progress');

  if (!chart) {
    throw new ApiError(404, 'Chart not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chart, 'Chart fetched successfully'));
});


const syncGraph = asyncHandler(async (req, res) => {
  const { chartId } = req.params;
  const { graphNodes, graphEdges } = req.body;

  const chart = await Chart.findOneAndUpdate(
    { _id: chartId, board: req.board._id },
    { $set: { graphNodes, graphEdges } },
    { new: true, runValidators: true }
  );

  if (!chart) {
    throw new ApiError(404, 'Chart not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chart, 'Graph synced successfully'));
});


const deleteChart = asyncHandler(async (req, res) => {
  const { chartId } = req.params;

  const chart = await Chart.findOneAndDelete({
    _id: chartId,
    board: req.board._id,
  });

  if (!chart) {
    throw new ApiError(404, 'Chart not found');
  }

  await Board.findByIdAndUpdate(req.board._id, {
    $pull: { charts: chart._id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Chart deleted successfully'));
});





export { createChart  , getCharts , getChartById , syncGraph , deleteChart};
