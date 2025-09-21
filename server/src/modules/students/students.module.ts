import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StudentCancelController } from './student-cancel.controller';
import { StudentMeController } from './student-me.controller';

@Module({
  controllers: [StudentMeController, StudentCancelController],
  providers: [PrismaService],
})
export class StudentsModule {}
