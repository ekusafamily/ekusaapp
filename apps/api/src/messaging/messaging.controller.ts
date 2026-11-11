/**
 * EKUSA Digital Platform - Messaging Controller
 */

import {
  Controller, Get, Post, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class CreateConversationDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  recipientId: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Message content (plaintext)' })
  @IsString()
  content: string;
}

export class MarkDeliveredDto {
  @ApiProperty()
  @IsString()
  messageId: string;
}

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async listConversations(@Request() req: any) {
    return this.messagingService.listConversations(req.user.sub);
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async createConversation(@Request() req: any, @Body() data: CreateConversationDto) {
    return this.messagingService.getOrCreateDirectConversation(req.user.sub, data.recipientId);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getConversation(@Param('id') id: string, @Request() req: any) {
    return this.messagingService.getConversation(id, req.user.sub);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async sendMessage(@Request() req: any, @Body() data: SendMessageDto) {
    return this.messagingService.sendMessage(req.user.sub, data);
  }

  @Post('messages/:id/delivered')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async markDelivered(@Request() req: any, @Param('id') id: string) {
    return this.messagingService.markDelivered(req.user.sub, id);
  }

  @Post('conversations/:id/seen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async markSeen(@Request() req: any, @Param('id') id: string) {
    return this.messagingService.markSeen(req.user.sub, id);
  }

  @Post('last-seen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async updateLastSeen(@Request() req: any) {
    return this.messagingService.updateLastSeen(req.user.sub);
  }

  @Get('last-seen/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getLastSeen(@Param('userId') userId: string, @Request() req: any) {
    return this.messagingService.getLastSeen(req.user.sub, userId);
  }

  @Post('users/:id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async blockUser(@Param('id') id: string, @Request() req: any) {
    return this.messagingService.blockUser(req.user.sub, id);
  }
}
