import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { PrismaService } from '../../prisma.service';
import { RolesGuard } from '../common/roles.guard';

@Module({ controllers:[StudentsController], providers:[PrismaService, RolesGuard] })
export class StudentsModule {}
