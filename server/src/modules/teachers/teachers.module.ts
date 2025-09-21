import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TeacherLessonsController } from './teacher-lessons.controller';
import { TeacherMeController} from './teacher-me.controller';
import { AdminTeachersController } from './admin-teachers.controller';
import { TeachersController } from './teachers.controller';

@Module({
  controllers: [TeacherLessonsController, TeacherMeController, AdminTeachersController, TeachersController],
  providers: [PrismaService],
})
export class TeachersModule {}
