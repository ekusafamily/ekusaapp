/**
 * EKUSA Digital Platform - Messaging Service
 * Simple messaging with sent/delivered/seen status and last seen
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagingGateway,
  ) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          where: { userId: { not: userId } },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                lastSeenAt: true,
                profile: { select: { displayName: true, avatarObjectKey: true } },
              },
            },
          },
        },
        messages: { take: 1, orderBy: { sentAt: 'desc' } },
        _count: { select: { messages: { where: { status: { not: 'seen' }, senderId: { not: userId } } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv: any) => {
      const other = conv.members[0];
      const lastMsg = conv.messages[0];
      return {
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherUser: other?.user
          ? {
              id: other.user.id,
              username: other.user.username,
              displayName: other.user.profile?.displayName || other.user.username,
              avatarUrl: other.user.profile?.avatarObjectKey,
              lastSeenAt: other.user.lastSeenAt,
            }
          : null,
        lastMessage: lastMsg
          ? { id: lastMsg.id, content: lastMsg.content, senderId: lastMsg.senderId, status: lastMsg.status, sentAt: lastMsg.sentAt }
          : null,
        unreadCount: conv._count.messages,
      };
    });
  }

  async getOrCreateDirectConversation(userId: string, recipientId: string) {
    if (userId === recipientId) throw new BadRequestException('Cannot message yourself');

    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          where: { userId: { not: userId } },
          include: {
            user: { select: { id: true, username: true, lastSeenAt: true, profile: { select: { displayName: true, avatarObjectKey: true } } } },
          },
        },
      },
    });

    if (existing && existing.members.length === 1) {
      const other = existing.members[0].user;
      return {
        ...existing,
        otherUser: { id: other.id, username: other.username, displayName: other.profile?.displayName || other.username, avatarUrl: other.profile?.avatarObjectKey, lastSeenAt: other.lastSeenAt },
      };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        members: { create: [{ userId }, { userId: recipientId }] },
      },
      include: {
        members: {
          where: { userId: { not: userId } },
          include: {
            user: { select: { id: true, username: true, lastSeenAt: true, profile: { select: { displayName: true, avatarObjectKey: true } } } },
          },
        },
      },
    });

    const other = conversation.members[0].user;
    return {
      ...conversation,
      otherUser: { id: other.id, username: other.username, displayName: other.profile?.displayName || other.username, avatarUrl: other.profile?.avatarObjectKey, lastSeenAt: other.lastSeenAt },
    };
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, lastSeenAt: true, profile: { select: { displayName: true, avatarObjectKey: true } } } },
          },
        },
        messages: { take: 50, orderBy: { sentAt: 'desc' } },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isMember = conversation.members.some((m: any) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member');

    const other = conversation.members.find((m: any) => m.userId !== userId);
    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      otherUser: other?.user
        ? { id: other.user.id, username: other.user.username, displayName: other.user.profile?.displayName || other.user.username, avatarUrl: other.user.profile?.avatarObjectKey, lastSeenAt: other.user.lastSeenAt }
        : null,
      messages: conversation.messages.reverse().map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        status: m.status,
        sentAt: m.sentAt,
        deliveredAt: m.deliveredAt,
        seenAt: m.seenAt,
      })),
    };
  }

  async sendMessage(userId: string, data: { conversationId: string; content: string }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { members: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.members.some((m: any) => m.userId === userId)) {
      throw new ForbiddenException('Not a member');
    }

    const [message] = await Promise.all([
      this.prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
          status: 'sent',
        },
      }),
      this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    this.gateway.broadcastNewMessage(data.conversationId, message).catch(() => {});

    return message;
  }

  async markDelivered(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return { success: true };

    const isMember = await this.prisma.conversationMember.findFirst({
      where: { conversationId: message.conversationId, userId },
    });
    if (!isMember || message.senderId === userId) return { success: true };

    if (message.status === 'sent') {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'delivered', deliveredAt: new Date() },
      });
      this.gateway
        .broadcastMessageStatus(message.conversationId, {
          messageId,
          status: 'delivered',
          timestamp: new Date().toISOString(),
        })
        .catch(() => {});
    }

    return { success: true };
  }

  async markSeen(userId: string, conversationId: string) {
    const updated = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: 'seen' },
      },
      data: { status: 'seen', seenAt: new Date() },
    });

    if (updated.count > 0) {
      this.gateway
        .broadcastMessageStatus(conversationId, {
          messageId: '*',
          status: 'seen',
          timestamp: new Date().toISOString(),
        })
        .catch(() => {});
    }
    return { success: true };
  }

  async updateLastSeen(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
    return { success: true };
  }

  async getLastSeen(userId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { lastSeenAt: true },
    });
    if (!target) throw new NotFoundException('User not found');
    return { lastSeenAt: target.lastSeenAt };
  }

  async blockUser(userId: string, blockedUserId: string) {
    if (userId === blockedUserId) throw new BadRequestException('Cannot block yourself');
    const existing = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: blockedUserId } },
    });
    if (existing) return { success: true, alreadyBlocked: true };
    await this.prisma.blockedUser.create({ data: { blockerId: userId, blockedId: blockedUserId } });
    return { success: true };
  }
}
