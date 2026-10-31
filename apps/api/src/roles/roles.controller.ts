/**
 * EKUSA Digital Platform - Roles Controller
 * Role and permission management endpoints
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { createRoleSchema } from '@ekusa/validation';

@ApiTags('Roles')
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all roles (admin)' })
  async list() {
    return this.rolesService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create role (admin)' })
  async create(@Request() req: any, @Body() data: { name: string; displayName: string; description?: string; permissions: string[] }) {
    return this.rolesService.create(req.user.sub, data);
  }

  @Post('user-roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign role to user (admin)' })
  async assign(@Request() req: any, @Body() data: { userId: string; roleId: string }) {
    return this.rolesService.assign(req.user.sub, data.userId, data.roleId);
  }

  @Delete('user-roles/:userId/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke role from user (admin)' })
  async revoke(@Param('userId') userId: string, @Param('roleId') roleId: string, @Request() req: any) {
    return this.rolesService.revoke(req.user.sub, userId, roleId);
  }
}