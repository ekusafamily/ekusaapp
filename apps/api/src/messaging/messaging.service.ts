/**
 * EKUSA Digital Platform - Messaging Service
 * Private messaging with E2EE support
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Device registration
  async registerDevice(userId: string, data: {
    deviceName: string;
    identityPublicKey: string;
    registrationId: number;
    pushToken?: string;
  }) {
    // Check if device already exists
    const existing = await this.prisma.device.findUnique({
      where: { userId_registrationId: { userId, registrationId: data.registrationId } },
    });

    if (existing) {
      // Update existing device
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          deviceName: data.deviceName,
          identityPublicKey: data.identityPublicKey,
          pushToken: data.pushToken,
          deviceStatus: 'active',
          lastSeenAt: new Date(),
        },
      });
    }

    return this.prisma.device.create({
      data: {
        userId,
        deviceName: data.deviceName,
        identityPublicKey: data.identityPublicKey,
        registrationId: data.registrationId,
        pushToken: data.pushToken,
        deviceStatus: 'active',
      },
    });
  }

  // Get prekey bundle for a user (for Signal Protocol)
  async getPreKeyBundle(userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { userId, deviceStatus: 'active' },
      include: {
        preKeys: { take: 1, orderBy: { keyId: 'asc' } },
        signedPreKeys: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!device || device.preKeys.length === 0 || device.signedPreKeys.length === 0) {
      throw new NotFoundException('No prekey bundle available for user');
    }

    return {
      identityKey: device.identityPublicKey,
      registrationId: device.registrationId,
      preKey: {
        keyId: device.preKeys[0].keyId,
        publicKey: device.preKeys[0].publicKey,
      },
      signedPreKey: {
        keyId: device.signedPreKeys[0].keyId,
        publicKey: device.signedPreKeys[0].publicKey,
        signature: device.signedPreKeys[0].signature,
      },
    };
  }

  // Conversations
  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: { some: { userId, leftAt: null } },
      },
      include: {
        members: {
          where: { userId: { not: userId }, leftAt: null },
          include: {
            user: {
              select: { id: true, username: true, profile: { select: { displayName: true, avatarObjectKey: true } } },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' },
          include: { sender: { select: { id: true, username: true } } },
        },
        _count: { select: { messages: { where: { status: { not: 'read' }, senderId: { not: userId } } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv: any) => {
      const otherMember = conv.members[0];
      const lastMessage = conv.messages[0];
      return {
        ...conv,
        otherUser: otherMember?.user ? {
          ...otherMember.user,
          displayName: otherMember.user.profile?.displayName || otherMember.user.username,
        } : null,
        lastMessage: lastMessage ? {
          ...lastMessage,
          senderName: lastMessage.senderId === userId ? 'You' : lastMessage.sender.username,
        } : null,
        unreadCount: conv._count.messages,
      };
    });
  }

  async createConversation(userId: string, data: { recipientId?: string; name?: string; description?: string; memberIds?: string[] }) {
    if (data.recipientId) {
      if (data.recipientId === userId) {
        throw new BadRequestException('Cannot start a direct conversation with yourself');
      }

      // Direct conversation - check if already exists
      const existing = await this.prisma.directConversationPair.findUnique({
        where: {
          user1Id_user2Id: {
            user1Id: userId < data.recipientId ? userId : data.recipientId,
            user2Id: userId < data.recipientId ? data.recipientId : userId,
          },
        },
        include: { conversation: true },
      });

      if (existing) {
        return existing.conversation;
      }

      // Create new direct conversation
      return this.prisma.$transaction(async (tx: any) => {
        const conversation = await tx.conversation.create({
          data: { type: 'direct' },
        });

        await tx.conversationMember.createMany({
          data: [
            { conversationId: conversation.id, userId },
            { conversationId: conversation.id, userId: data.recipientId! },
          ],
        });

        await tx.directConversationPair.create({
          data: {
            user1Id: userId < data.recipientId! ? userId : data.recipientId!,
            user2Id: userId < data.recipientId! ? data.recipientId! : userId,
            conversationId: conversation.id,
          },
        });

        return conversation;
      });
    } else if (data.name && data.memberIds && data.memberIds.length >= 2) {
      // Group conversation
      const allMemberIds = [...new Set([userId, ...data.memberIds])];

      return this.prisma.$transaction(async (tx: any) => {
        const conversation = await tx.conversation.create({
          data: {
            type: 'group',
            name: data.name,
            description: data.description,
            createdBy: userId,
          },
        });

        await tx.conversationMember.createMany({
          data: allMemberIds.map(id => ({
            conversationId: conversation.id,
            userId: id,
            isAdmin: id === userId,
          })),
        });

        return conversation;
      });
    }

    throw new BadRequestException('Either recipientId (direct) or name + memberIds (group) required');
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, username: true, profile: { select: { displayName: true, avatarObjectKey: true } } } },
          },
        },
        messages: {
          take: 50,
          orderBy: { sentAt: 'desc' },
          include: { sender: { select: { id: true, username: true } } },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check membership
    const isMember = conversation.members.some((m: any) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member of this conversation');

    return {
      ...conversation,
      messages: conversation.messages.reverse(),
    };
  }

  // Messages
  async sendMessage(userId: string, data: {
    conversationId: string;
    ciphertext: string;
    protocolMetadata: string;
    messageType?: string;
  }) {
    // 1. Single query: Fetch conversation, active members, and their active devices
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                devices: {
                  where: { deviceStatus: 'active' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check membership
    const membership = conversation.members.find((m: any) => m.userId === userId);
    if (!membership) throw new ForbiddenException('Not a member of this conversation');

    // Sender's active device (or auto-create one if none exists)
    let senderDeviceId = membership.user?.devices?.[0]?.id;
    if (!senderDeviceId) {
      const newDevice = await this.prisma.device.create({
        data: {
          userId,
          deviceName: 'Primary Device',
          identityPublicKey: `id_pub_${userId.slice(0, 8)}_${Date.now()}`,
          registrationId: Math.floor(Math.random() * 100000) + 1,
          deviceStatus: 'active',
        },
      });
      senderDeviceId = newDevice.id;
    }

    // 2. Insert message & update conversation timestamp in parallel
    const [message] = await Promise.all([
      this.prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: userId,
          senderDeviceId,
          ciphertext: data.ciphertext,
          protocolMetadata: data.protocolMetadata || '',
          messageType: (data.messageType as any) || 'text',
          status: 'pending',
        },
      }),
      this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    const messageId = message.id;
    const recipientMembers = conversation.members.filter((m: any) => m.userId !== userId);

    // 3. Process recipient queues and push notifications asynchronously
    // Returning immediately ensures fast response times without waiting on external notifications
    if (recipientMembers.length > 0) {
      setImmediate(async () => {
        try {
          const queueEntries = recipientMembers.map((recipient: any) => {
            const recipientDeviceId = recipient.user?.devices?.[0]?.id || null;
            const dedupeKey = `${data.conversationId}_${userId}_${messageId}_${recipient.userId}`;
            return {
              dedupeKey,
              conversationId: data.conversationId,
              senderUserId: userId,
              senderDeviceId,
              recipientUserId: recipient.userId,
              recipientDeviceId,
              messageId,
              ciphertext: data.ciphertext,
              protocolMetadata: data.protocolMetadata || '',
            };
          });

          await this.prisma.messageQueue.createMany({
            data: queueEntries,
            skipDuplicates: true,
          });

          // Send push notifications in parallel
          await Promise.allSettled(
            recipientMembers.map((recipient: any) =>
              this.notificationsService.create({
                userId: recipient.userId,
                category: 'message',
                priority: 'high',
                title: 'New Message',
                body: 'You have a new message',
                data: { conversationId: data.conversationId, messageId },
              })
            )
          );
        } catch (err) {
          console.error('Background message delivery error:', err);
        }
      });
    }

    return { messageId, message };
  }

  async getPendingMessages(userId: string, params: { limit?: number; beforeMessageId?: string }) {
    const limit = Math.max(1, Number(params.limit) || 50);
    const { beforeMessageId } = params;

    const where: any = { recipientUserId: userId };
    if (beforeMessageId) {
      where.createdAt = { lt: new Date(beforeMessageId) }; // This would need proper cursor pagination
    }

    const messages = await this.prisma.messageQueue.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  }

  async acknowledgeMessage(userId: string, data: { messageId: string; conversationId: string }) {
    // Find and delete queue entries
    const deleted = await this.prisma.messageQueue.deleteMany({
      where: {
        messageId: data.messageId,
        recipientUserId: userId,
      },
    });

    // Update message status
    await this.prisma.message.updateMany({
      where: { id: data.messageId },
      data: { status: 'delivered', deliveredAt: new Date() },
    });

    // Create delivery receipt
    await this.prisma.deliveryReceipt.create({
      data: {
        messageId: data.messageId,
        conversationId: data.conversationId,
        senderUserId: (await this.prisma.message.findUnique({ where: { id: data.messageId } }))?.senderId || '',
        recipientUserId: userId,
        recipientDeviceId: (await this.prisma.device.findFirst({ where: { userId, deviceStatus: 'active' } }))?.id || '',
        deliveredAt: new Date(),
      },
    });

    return { success: true, deletedCount: deleted.count };
  }

  async deleteMessage(userId: string, messageId: string, deleteForEveryone: boolean) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId !== userId && !deleteForEveryone) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    if (deleteForEveryone) {
      // Mark for deletion for everyone
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date(), deleteForEveryone: true },
      });
    } else {
      // Delete for me only (soft delete by marking as deleted for this user)
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      });
    }

    return { success: true };
  }

  async blockUser(userId: string, blockedUserId: string) {
    if (userId === blockedUserId) throw new BadRequestException('Cannot block yourself');

    const existing = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: blockedUserId } },
    });

    if (existing) return { success: true, alreadyBlocked: true };

    await this.prisma.blockedUser.create({
      data: { blockerId: userId, blockedId: blockedUserId },
    });

    return { success: true };
  }
}