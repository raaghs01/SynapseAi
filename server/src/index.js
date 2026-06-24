import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { createServer } from 'http';
import { Server } from 'socket.io';

// DONE
import connectDB from './db/index.js';
import { app } from './app.js';

const port = process.env.PORT || 5000;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

connectDB().then(() => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((error) => {
  console.error('MongoDB connection failed:', error);
  process.exit(1);
}