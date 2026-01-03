import { io } from 'socket.io-client';

// Use environment variable or fallback to backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005';

export const socket = io(`${SOCKET_URL}/notifications`, {
    autoConnect: false,
    transports: ['websocket'],
});
