import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StudentMeController } from './student-me.controller';

@Module({
  controllers: [StudentMeController],
  providers: [PrismaService],
})
export class StudentsModule {}
