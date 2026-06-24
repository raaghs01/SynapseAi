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
app.use('/api/v1/users', userRouter);
app.use('/api/v1/healthcheck', healthcheckRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export { app };
