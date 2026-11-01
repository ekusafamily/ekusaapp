/**
 * EKUSA Digital Platform - Welfare Module
 * Welfare request management
 */

import { Module } from '@nestjs/common';
import { WelfareController, AdminWelfareController } from './welfare.controller';
import { WelfareService } from './welfare.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, NotificationsModule],
  controllers: [WelfareController, AdminWelfareController],
  providers: [WelfareService],
  exports: [WelfareService],
})
export class WelfareModule {}