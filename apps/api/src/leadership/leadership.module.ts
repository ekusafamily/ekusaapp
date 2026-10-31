/**
 * EKUSA Digital Platform - Leadership Module
 * Leadership directory and positions
 */

import { Module } from '@nestjs/common';
import { LeadershipController } from './leadership.controller';
import { LeadershipService } from './leadership.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [LeadershipController],
  providers: [LeadershipService],
  exports: [LeadershipService],
})
export class LeadershipModule {}