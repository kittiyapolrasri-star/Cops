import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

// Use environment variable or fallback to backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create socket with auth token
const createSocket = () => {
    const token = Cookies.get('token');

    return io(`${SOCKET_URL}/notifications`, {
        autoConnect: false,
        transports: ['websocket'],
        auth: {
            token,
        },
    });
};

export const socket = createSocket();

// Function to reconnect with new token (after login)
export const reconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
    const token = Cookies.get('token');
    socket.auth = { token };
    socket.connect();
};

