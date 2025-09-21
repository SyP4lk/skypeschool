import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StudentMeController } from './student-me.controller';
import { StudentCancelController } from './student-cancel.controller';
@Module({
  controllers: [StudentMeController,StudentCancelController],
  providers: [PrismaService],
})
export class StudentsModule {}
