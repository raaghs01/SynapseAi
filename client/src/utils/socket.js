import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  autoConnect: false,
  auth: (cb) => {
    const token = localStorage.getItem('accessToken');
    cb({ token });
  },
});

export default socket;
