import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';


const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

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

export { app };
