import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TrialRequestsController } from './trial-requests.controller';
import { TrialRequestsService } from './trial-requests.service';

@Module({
  controllers: [TrialRequestsController],
  providers: [TrialRequestsService, PrismaService],
})
export class TrialRequestsModule {}
