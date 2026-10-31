/**
 * EKUSA Digital Platform - Messaging Controller
 * Private messaging endpoints
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { deviceRegistrationSchema } from '@ekusa/validation';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List user conversations' })
  async listConversations(@Request() req: any) {
    return this.messagingService.listConversations(req.user.sub);
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create conversation' })
  async createConversation(@Request() req: any, @Body() data: {
    recipientId?: string;
    name?: string;
    description?: string;
    memberIds?: string[];
  }) {
    return this.messagingService.createConversation(req.user.sub, data);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get conversation detail' })
  async getConversation(@Param('id') id: string, @Request() req: any) {
    return this.messagingService.getConversation(id, req.user.sub);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send encrypted message' })
  async sendMessage(@Request() req: any, @Body() data: {
    conversationId: string;
    ciphertext: string;
    protocolMetadata: string;
    messageType?: string;
  }) {
    return this.messagingService.sendMessage(req.user.sub, data);
  }

  @Get('messages/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pending messages (long-poll)' })
  async getPendingMessages(@Request() req: any, @Query() params: { limit?: number; beforeMessageId?: string }) {
    return this.messagingService.getPendingMessages(req.user.sub, params);
  }

  @Post('messages/acknowledge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Acknowledge message delivery' })
  async acknowledgeMessage(@Request() req: any, @Body() data: { messageId: string; conversationId: string }) {
    return this.messagingService.acknowledgeMessage(req.user.sub, data);
  }

  @Post('messages/:id/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete message' })
  async deleteMessage(@Param('id') id: string, @Request() req: any, @Body() data: { deleteForEveryone?: boolean }) {
    return this.messagingService.deleteMessage(req.user.sub, id, data.deleteForEveryone || false);
  }

  @Post('users/:id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Block user' })
  async blockUser(@Param('id') id: string, @Request() req: any) {
    return this.messagingService.blockUser(req.user.sub, id);
  }

  // Device registration
  @Post('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register device for E2EE' })
  async registerDevice(@Request() req: any, @Body() data: {
    deviceName: string;
    identityPublicKey: string;
    registrationId: number;
    pushToken?: string;
  }) {
    return this.messagingService.registerDevice(req.user.sub, data);
  }

  @Get('devices/:userId/prekey-bundle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get prekey bundle for user' })
  async getPreKeyBundle(@Param('userId') userId: string) {
    return this.messagingService.getPreKeyBundle(userId);
  }
}