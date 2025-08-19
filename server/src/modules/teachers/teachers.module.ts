import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { PrismaService } from '../../prisma.service';
import { AdminTeachersController } from './admin-teachers.controller';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Module({
  controllers: [TeachersController, AdminTeachersController],
  providers: [TeachersService, PrismaService],
})
export class TeachersModule {}