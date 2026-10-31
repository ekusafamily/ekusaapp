/**
 * EKUSA Digital Platform - Leadership Controller
 * Leadership directory and positions endpoints
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LeadershipService } from './leadership.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Leadership')
@Controller('leadership')
export class LeadershipController {
  constructor(private readonly leadershipService: LeadershipService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get leadership directory' })
  async getDirectory() {
    return this.leadershipService.getDirectory();
  }

  @Get('positions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get leadership positions' })
  async getPositions() {
    return this.leadershipService.getPositions();
  }

  // Admin
  @Post('admin/leadership/positions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create leadership position (admin)' })
  async createPosition(@Request() req: any, @Body() data: { title: string; description?: string; order: number; isActive: boolean }) {
    return this.leadershipService.createPosition(req.user.sub, data);
  }

  @Post('admin/leadership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign leader (admin)' })
  async assignLeader(@Request() req: any, @Body() data: { userId: string; positionId: string; startDate: string; endDate?: string | null; contactInfo?: string | null }) {
    return this.leadershipService.assignLeader(req.user.sub, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    });
  }
}