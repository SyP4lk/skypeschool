import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PricingController } from './pricing.controller';

@Module({
  controllers: [PricingController],
  providers: [PrismaService],
})
export class PricingModule {}