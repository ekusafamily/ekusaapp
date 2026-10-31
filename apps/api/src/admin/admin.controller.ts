/**
 * EKUSA Digital Platform - Admin Controller
 * Admin dashboard and settings endpoints
 */

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'chairperson', 'vice_chairperson', 'secretary', 'communication_officer', 'treasurer', 'welfare_officer', 'event_coordinator', 'membership_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboard(@Request() req: any) {
    return this.adminService.getDashboardStats();
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get platform settings (super admin)' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update platform settings (super admin)' })
  async updateSettings(@Request() req: any, @Body() data: Record<string, any>) {
    return this.adminService.updateSettings(req.user.sub, data);
  }
}