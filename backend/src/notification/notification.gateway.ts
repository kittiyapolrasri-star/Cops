import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake auth or query string
            const token = client.handshake.auth?.token ||
                client.handshake.query?.token as string;

            if (!token) {
                console.log(`Client ${client.id} rejected: No token provided`);
                client.emit('error', { message: 'Authentication required' });
                client.disconnect();
                return;
            }

            // Verify JWT token
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            // Attach user info to socket for later use
            (client as any).user = payload;

            console.log(`Notification client connected: ${client.id} (User: ${payload.username})`);

            // Auto-join user-specific and station rooms
            if (payload.sub) {
                client.join(`user:${payload.sub}`);
            }
            if (payload.stationId) {
                client.join(`station:${payload.stationId}`);
            }
            client.join('broadcast');

        } catch (error) {
            console.log(`Client ${client.id} rejected: Invalid token`);
            client.emit('error', { message: 'Invalid or expired token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const user = (client as any).user;
        console.log(`Notification client disconnected: ${client.id} (User: ${user?.username || 'unknown'})`);
    }

    @SubscribeMessage('join')
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId?: string; stationId?: string }
    ) {
        const user = (client as any).user;

        // Only allow joining rooms that match the user's permissions
        if (data.userId && data.userId === user?.sub) {
            client.join(`user:${data.userId}`);
        }
        if (data.stationId && data.stationId === user?.stationId) {
            client.join(`station:${data.stationId}`);
        }
        return { success: true };
    }

    broadcastNotification(notification: any) {
        // Broadcast to all connected clients
        this.server.to('broadcast').emit('notification', notification);

        // Send to specific user if applicable
        if (notification.userId) {
            this.server.to(`user:${notification.userId}`).emit('notification', notification);
        }

        // Send to station if applicable
        if (notification.stationId) {
            this.server.to(`station:${notification.stationId}`).emit('notification', notification);
        }
    }
}

