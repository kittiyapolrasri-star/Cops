import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';

interface LocationUpdate {
    userId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
}

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

    constructor(private trackingService: TrackingService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        this.connectedUsers.delete(client.id);
    }

    @SubscribeMessage('join')
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; stationId?: string }
    ) {
        this.connectedUsers.set(client.id, data.userId);

        // Join user to station room if provided
        if (data.stationId) {
            client.join(`station:${data.stationId}`);
        }

        // Join user to their own room for direct messages
        client.join(`user:${data.userId}`);

        return { success: true, message: 'Joined tracking room' };
    }

    @SubscribeMessage('location:update')
    async handleLocationUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: LocationUpdate
    ) {
        // Save to database
        await this.trackingService.updateLocation(data.userId, {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
        });

        // Broadcast to all clients in the same station
        this.server.emit('location:updated', {
            userId: data.userId,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            timestamp: data.timestamp || new Date(),
        });

        return { success: true };
    }

    @SubscribeMessage('patrol:start')
    async handlePatrolStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string }
    ) {
        const patrol = await this.trackingService.startPatrol(data.userId);
        this.server.emit('patrol:started', patrol);
        return patrol;
    }

    @SubscribeMessage('patrol:end')
    async handlePatrolEnd(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string }
    ) {
        const patrol = await this.trackingService.endPatrol(data.userId);
        this.server.emit('patrol:ended', { userId: data.userId });
        return patrol;
    }

    // Method to broadcast to specific station
    broadcastToStation(stationId: string, event: string, data: any) {
        this.server.to(`station:${stationId}`).emit(event, data);
    }

    // Method to broadcast to all connected clients
    broadcastAll(event: string, data: any) {
        this.server.emit(event, data);
    }
}
