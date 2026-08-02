import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Chart } from '../models/chart.model.js';
import { LinkMember } from '../models/linkMembers.model.js';

export const initSocket = (io) => {

  // Minimal cookie-header parser — avoids depending on the transitive `cookie`
  // package. "a=1; b=2" → { a: '1', b: '2' }.
  const parseCookies = (header = '') =>
    header.split(';').reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key) acc[key] = decodeURIComponent(val);
      return acc;
    }, {});

  io.use(async (socket, next) => {
    try {
      // Auth token now rides in the httpOnly cookie sent with the handshake.
      // Fall back to handshake.auth.token so Postman/manual testing still works.
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.accessToken || socket.handshake.auth?.token;

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

    const hasChartAccess = async (chartId) => {
      const chart = await Chart.findById(chartId).populate('board');
      if (!chart || !chart.board) return false;

      const membership = await LinkMember.findOne({
        link: chart.board.link,
        user: socket.user._id,
      });

      return !!membership;
    };

    socket.on('join-chart', async (chartId) => {
      const allowed = await hasChartAccess(chartId);
      if (!allowed) {
        return socket.emit('error', { message: 'You do not have access to this chart' });
      }

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
      if (!socket.rooms.has(chartId)) return;

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
      if (!socket.rooms.has(chartId)) return;

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
