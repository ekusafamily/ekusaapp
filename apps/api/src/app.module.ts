/**
 * EKUSA Digital Platform - Root App Module
 * Main application module importing all feature modules including Supabase Storage and Health check
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MembershipModule } from './membership/membership.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { EventsModule } from './events/events.module';
import { WelfareModule } from './welfare/welfare.module';
import { MessagingModule } from './messaging/messaging.module';
import { CommunityModule } from './community/community.module';
import { LeadershipModule } from './leadership/leadership.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env', '../.env'],
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MembershipModule,
    AnnouncementsModule,
    EventsModule,
    WelfareModule,
    MessagingModule,
    CommunityModule,
    LeadershipModule,
    AdminModule,
    AuditModule,
    NotificationsModule,
    RolesModule,
  ],
})
export class AppModule {}