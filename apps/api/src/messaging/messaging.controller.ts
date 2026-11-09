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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { deviceRegistrationSchema } from '@ekusa/validation';

export class CreateConversationDto {
  @ApiPropertyOptional({ description: 'Target user ID for direct 1-on-1 conversation' })
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiPropertyOptional({ description: 'Group conversation name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Group conversation description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Member user IDs for group conversation', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Encrypted message ciphertext' })
  @IsString()
  ciphertext: string;

  @ApiPropertyOptional({ description: 'Signal protocol metadata' })
  @IsOptional()
  @IsString()
  protocolMetadata?: string;

  @ApiPropertyOptional({ description: 'Message type (e.g. text, image)' })
  @IsOptional()
  @IsString()
  messageType?: string;
}

export class AcknowledgeMessageDto {
  @ApiProperty()
  @IsString()
  messageId: string;

  @ApiProperty()
  @IsString()
  conversationId: string;
}

export class DeleteMessageDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  deleteForEveryone?: boolean;
}

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  deviceName: string;

  @ApiProperty()
  @IsString()
  identityPublicKey: string;

  @ApiProperty()
  @IsNumber()
  registrationId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushToken?: string;
}

@ApiTags('Messaging')
@Controller(['messaging', ''])
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
  async createConversation(@Request() req: any, @Body() data: CreateConversationDto) {
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
  async sendMessage(@Request() req: any, @Body() data: SendMessageDto) {
    return this.messagingService.sendMessage(req.user.sub, {
      ...data,
      protocolMetadata: data.protocolMetadata || '',
    });
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
  async acknowledgeMessage(@Request() req: any, @Body() data: AcknowledgeMessageDto) {
    return this.messagingService.acknowledgeMessage(req.user.sub, data);
  }

  @Post('messages/:id/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete message' })
  async deleteMessage(@Param('id') id: string, @Request() req: any, @Body() data: DeleteMessageDto) {
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
  async registerDevice(@Request() req: any, @Body() data: RegisterDeviceDto) {
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