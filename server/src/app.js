import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';


const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// necessary server config
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Essential for sending/receiving cookies
  // methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // allowedHeaders: ["Content-Type", "Authorization"],
}));


// ── Routes ──
import userRouter from './routes/auth.routes.js';
import healthcheckRouter from './routes/healthcheck.routes.js';
import linkRouter from './routes/link.routes.js';
import boardRouter from './routes/board.routes.js'
import chartRouter from './routes/chart.routes.js';
import ideaRouter from './routes/idea.routes.js';
import aiRouter from './routes/ai.routes.js'
app.use('/api/v1/users', userRouter);
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/links', linkRouter);
app.use('/api/v1/links/:linkId/boards', boardRouter);
app.use('/api/v1/links/:linkId/boards/:boardId/charts', chartRouter);
app.use('/api/v1/links/:linkId/boards/:boardId/charts/:chartId/ideas', ideaRouter);
app.use('/api/v1/links/:linkId/boards/:boardId/charts/:chartId/ai', aiRouter);




app.get('/', (req, res) => {
  res.send('Hello World!');
});


// ── 404 (must come AFTER all routes) ──
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    data: null,
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: [],
  });
});

// ── Global error handler (must be the LAST middleware) ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;

  if (!isApiError || statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    statusCode,
    data: null,
    success: false,
    message: isApiError ? err.message : 'Internal server error',
    errors: isApiError ? err.errors : [],
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export { app };
