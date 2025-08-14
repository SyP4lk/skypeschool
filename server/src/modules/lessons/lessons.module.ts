import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { PrismaService } from '../../prisma.service';
import { RolesGuard } from '../common/roles.guard';

@Module({ controllers:[LessonsController], providers:[PrismaService, RolesGuard] })
export class LessonsModule {}
