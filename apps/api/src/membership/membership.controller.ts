/**
 * EKUSA Digital Platform - Membership Controller
 * Membership application and verification endpoints
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { submitMembershipRequestSchema } from '@ekusa/validation';

@ApiTags('Membership')
@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit membership application' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 409, description: 'Already applied or verified' })
  async apply(@Request() req: any, @Body() data: {
    registrationNumber: string;
    campus: string;
    course: string;
    yearOfStudy: number;
    contactInfo?: string;
  }) {
    return this.membershipService.apply(req.user.sub, data);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'View own membership status' })
  async getMyStatus(@Request() req: any) {
    return this.membershipService.getMyStatus(req.user.sub);
  }

  // Admin endpoints
  @Get('admin/memberships')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'membership_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List membership applications (admin)' })
  async listApplications(@Query() params: {
    status?: string;
    campus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    return this.membershipService.listApplications(params);
  }

  @Get('admin/memberships/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'membership_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'View membership application detail (admin)' })
  async getApplication(@Param('id') id: string) {
    return this.membershipService.getApplication(id);
  }

  @Patch('admin/memberships/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'membership_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve membership application (admin)' })
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.membershipService.approve(id, req.user.sub);
  }

  @Patch('admin/memberships/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'membership_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reject membership application (admin)' })
  async reject(@Param('id') id: string, @Request() req: any, @Body() data: { rejectionReason: string }) {
    if (!data.rejectionReason || data.rejectionReason.trim().length === 0) {
      throw new ForbiddenException('Rejection reason is required');
    }
    return this.membershipService.reject(id, req.user.sub, data.rejectionReason);
  }
}