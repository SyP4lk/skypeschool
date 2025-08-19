import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminFinanceController } from './finance.controller';
import { PrismaService } from '../../prisma.service';
import { RolesGuard } from '../common/roles.guard';

@Module({ controllers:[AdminController, AdminFinanceController], providers:[PrismaService, RolesGuard] })
export class AdminModule {}
