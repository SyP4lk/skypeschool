import { Module } from '@nestjs/common';
import { TrialRequestsController } from './trial-requests.controller';
import { TrialRequestsService } from './trial-requests.service';

@Module({
  controllers: [TrialRequestsController],
  providers: [TrialRequestsService],
})
export class TrialRequestsModule {}
