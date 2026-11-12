/**
 * EKUSA Mobile App - Socket Service
 * Shared socket.io connection to the /messaging gateway for real-time delivery.
 */

import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl, getAuthTokens } from '@ekusa/api-client';

type Handlers = {
  onNewMessage?: (message: any) => void;
  onMessageStatus?: (data: { messageId: string; status: string; timestamp: string }) => void;
  onLastSeen?: (data: { userId: string; lastSeenAt: string; online: boolean }) => void;
};

class SocketService {
  private socket: Socket | null = null;
  private handlers = new Set<Handlers>();
  private joinedConversationId: string | null = null;

  connect(): void {
    const { accessToken } = getAuthTokens();
    if (!accessToken) return;

    if (this.socket) {
      if (this.socket.connected) return;
      this.socket.auth = { token: accessToken };
      this.socket.connect();
      return;
    }

    this.socket = io(`${getSocketBaseUrl()}/messaging`, {
      transports: ['websocket'],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 2000,
    });

    if (this.joinedConversationId) {
      this.joinConversation(this.joinedConversationId);
    }

    this.socket.on('newMessage', (message: any) => {
      this.handlers.forEach((h) => h.onNewMessage?.(message));
    });
    this.socket.on('messageStatus', (data: any) => {
      this.handlers.forEach((h) => h.onMessageStatus?.(data));
    });
    this.socket.on('lastSeen', (data: any) => {
      this.handlers.forEach((h) => h.onLastSeen?.(data));
    });
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.joinedConversationId = null;
  }

  joinConversation(conversationId: string): void {
    this.joinedConversationId = conversationId;
    if (this.socket?.connected) {
      this.socket.emit('joinConversation', { conversationId });
    }
  }

  leaveConversation(): void {
    if (this.socket?.connected && this.joinedConversationId) {
      this.socket.emit('leaveConversation', { conversationId: this.joinedConversationId });
    }
    this.joinedConversationId = null;
  }

  register(handlers: Handlers): () => void {
    this.handlers.add(handlers);
    return () => this.handlers.delete(handlers);
  }
}

export const socketService = new SocketService();
