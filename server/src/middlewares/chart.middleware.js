// for idea and injecting chart into req

import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Chart } from '../models/chart.model.js';

const verifyChartAccess = asyncHandler(async (req, res, next) => {
  const { chartId } = req.params;

  const chart = await Chart.findOne({
    _id: chartId,
    board: req.board._id,
  });

  if (!chart) {
    throw new ApiError(404, 'Chart not found');
  }

  req.chart = chart;
  next();
});

export { verifyChartAccess };
