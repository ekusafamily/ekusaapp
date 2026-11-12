/**
 * EKUSA Digital Platform - Messaging Gateway
 * WebSocket gateway for real-time messaging with last seen tracking
 */

import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/messaging' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;

      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);

      // Update last seen on connect
      await this.prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
      this.broadcastLastSeen(userId);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    let disconnectedUserId: string | null = null;
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          disconnectedUserId = userId;
        }
        break;
      }
    }
    if (disconnectedUserId) {
      await this.prisma.user.update({ where: { id: disconnectedUserId }, data: { lastSeenAt: new Date() } });
      this.broadcastLastSeen(disconnectedUserId);
    }
  }

  private broadcastLastSeen(userId: string) {
    this.server.emit('lastSeen', { userId, lastSeenAt: new Date().toISOString(), online: this.isUserOnline(userId) });
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    if (!(await this.isMember(client, data.conversationId))) {
      return { success: false, error: 'not_a_member' };
    }
    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  private async isMember(client: Socket, conversationId: string): Promise<boolean> {
    const userId = client.data?.userId;
    if (!userId || !conversationId) return false;
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId },
      select: { id: true },
    });
    return !!member;
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('typing')
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; isTyping: boolean }) {
    client.to(`conversation:${data.conversationId}`).emit('userTyping', data);
  }

  async broadcastNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('newMessage', message);
  }

  async broadcastMessageStatus(conversationId: string, data: { messageId: string; status: string; timestamp: string }) {
    this.server.to(`conversation:${conversationId}`).emit('messageStatus', data);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
