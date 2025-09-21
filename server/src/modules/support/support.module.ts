import { Module } from '@nestjs/common';
import { SupportPublicController } from './support.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [SupportPublicController],
  providers: [PrismaService],
})
export class SupportModule {}
