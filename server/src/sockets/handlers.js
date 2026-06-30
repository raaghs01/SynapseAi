import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const initSocket = (io) => {

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select('-password -refreshToken');

      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.user.username}`);

    socket.on('join-chart', (chartId) => {
      socket.join(chartId);

      socket.to(chartId).emit('user-joined', {
        userId: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar,
      });
    });

    socket.on('leave-chart', (chartId) => {
      socket.leave(chartId);

      socket.to(chartId).emit('user-left', {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    socket.on('graph-updated', ({ chartId, graphNodes, graphEdges }) => {
      socket.to(chartId).emit('graph-updated', {
        graphNodes,
        graphEdges,
        updatedBy: {
          userId: socket.user._id,
          username: socket.user.username,
        },
      });
    });

    socket.on('cursor-move', ({ chartId, x, y }) => {
      socket.to(chartId).emit('cursor-move', {
        userId: socket.user._id,
        username: socket.user.username,
        x,
        y,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.user.username}`);
    });
  });
};
