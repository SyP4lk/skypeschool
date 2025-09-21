
import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, PrismaService],
})
export class WithdrawalsModule {}
