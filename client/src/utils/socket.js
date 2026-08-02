import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
  autoConnect: false,
  // Send the httpOnly auth cookie with the handshake; the server reads it there.
  withCredentials: true,
});




export default socket;
