import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RolesGuard } from '../common/roles.guard';
import { AdminFinanceController } from './finance.controller';
import { AdminUsersController } from './users.controller';
import { AdminStudentsController } from './students.controller';
import { AdminTrialsController } from './trials.controller';
import { AdminSupportController } from './support.controller';

@Module({
  controllers: [
    AdminUsersController,
    AdminStudentsController,
    AdminFinanceController,
    AdminTrialsController,
    AdminSupportController,
    
  ],
  providers: [PrismaService, RolesGuard],
})
export class AdminModule {}
