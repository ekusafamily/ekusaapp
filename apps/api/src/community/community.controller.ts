/**
 * EKUSA Digital Platform - Community Controller
 * Community group management endpoints
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { createCommunityRequestSchema } from '@ekusa/validation';

@ApiTags('Community')
@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List communities' })
  async list(@Query() params: { type?: string; isPublic?: boolean; page?: number; limit?: number }) {
    return this.communityService.list(params);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get community detail' })
  async get(@Param('id') id: string) {
    return this.communityService.get(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Join community' })
  async join(@Param('id') id: string, @Request() req: any) {
    return this.communityService.join(id, req.user.sub);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Leave community' })
  async leave(@Param('id') id: string, @Request() req: any) {
    return this.communityService.leave(id, req.user.sub);
  }

  // Admin
  @Post('admin/communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create community (admin)' })
  async create(@Request() req: any, @Body() data: { name: string; description: string; type: string; isPublic: boolean; avatarObjectKey?: string | null }) {
    return this.communityService.create(req.user.sub, data);
  }

  @Patch('admin/communities/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update community (admin)' })
  async update(@Param('id') id: string, @Request() req: any, @Body() data: Partial<{ name: string; description: string; type: string; isPublic: boolean; avatarObjectKey?: string | null }>) {
    return this.communityService.update(id, req.user.sub, data);
  }
}