import 'dotenv/config';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { connectDB } from './db/index.js';
import { initSocket } from './sockets/handlers.js';

const httpServer = createServer(app);
// const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173/')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initSocket(io);

// Expose io to HTTP controllers so they can broadcast to chart rooms
// (e.g. deleteIdea notifying collaborators a node was removed).
app.set('io', io);

connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
