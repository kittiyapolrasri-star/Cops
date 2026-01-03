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

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Notification client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Notification client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join')
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId?: string; stationId?: string }
    ) {
        if (data.userId) {
            client.join(`user:${data.userId}`);
        }
        if (data.stationId) {
            client.join(`station:${data.stationId}`);
        }
        client.join('broadcast');
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
