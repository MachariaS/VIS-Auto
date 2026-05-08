import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', credentials: true }, namespace: '/roadside' })
export class RoadsideGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(_client: Socket) { /* connections managed via join messages */ }
  handleDisconnect(_client: Socket) { /* cleanup handled by socket.io */ }

  // Customer or provider joins a request room for live tracking
  @SubscribeMessage('join-request')
  handleJoinRequest(client: Socket, requestId: string) {
    client.join(`request:${requestId}`);
    return { joined: requestId };
  }

  // Provider joins their personal channel to receive job offers
  @SubscribeMessage('join-provider')
  handleJoinProvider(client: Socket, providerId: string) {
    client.join(`provider:${providerId}`);
    return { joined: `provider:${providerId}` };
  }

  // Provider sends live GPS — broadcast to customer in the same request room
  @SubscribeMessage('provider-location')
  handleProviderLocation(
    client: Socket,
    data: { requestId: string; providerId: string; latitude: number; longitude: number; etaMinutes?: number },
  ) {
    client.to(`request:${data.requestId}`).emit('tracking-update', {
      requestId: data.requestId,
      providerLatitude: data.latitude,
      providerLongitude: data.longitude,
      etaMinutes: data.etaMinutes,
      updatedAt: new Date().toISOString(),
    });
  }

  // Called by service when a new job is dispatched to a provider
  pushJobOffer(providerId: string, job: unknown) {
    this.server.to(`provider:${providerId}`).emit('job-offer', job);
  }

  // Called by service when a request status changes
  pushStatusUpdate(requestId: string, update: unknown) {
    this.server.to(`request:${requestId}`).emit('status-update', update);
  }
}
