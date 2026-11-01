/**
 * EKUSA Digital Platform - Users Controller
 * User profile management and search endpoints with memory storage for Supabase upload
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req: any, @Body() data: {
    displayName?: string;
    bio?: string;
    avatarObjectKey?: string | null;
    campus?: string;
    course?: string;
    yearOfStudy?: number | null;
  }) {
    return this.usersService.updateProfile(req.user.sub, data);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get public user profile by username' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search users by username or display name' })
  async searchUsers(@Body() data: { query: string; limit?: number; offset?: number }) {
    return this.usersService.searchUsers(data.query, data.limit, data.offset);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload profile avatar to Supabase Storage' })
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const objectKey = await this.usersService.uploadAvatar(req.user.sub, file);
    const avatarUrl = await this.usersService.getAvatarUrl(objectKey);
    return { avatarUrl };
  }
}