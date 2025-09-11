import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RolesGuard } from '../common/roles.guard';
import { AdminFinanceController } from './finance.controller';
import { AdminUsersController } from './users.controller';
import { AdminStudentsController } from './students.controller';
import { AdminTrialsController } from './trials.controller';
import { AdminSupportController } from './support.controller';
import { AdminOverviewController } from './overview.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminTeachersController } from '../teachers/admin-teachers.controller';

@Module({
  controllers: [
    AdminUsersController,
    AdminStudentsController,
    AdminFinanceController,
    AdminTrialsController,
    AdminSupportController,
    AdminOverviewController,
    AdminTeachersController,
    AdminCategoriesController
  ],
  providers: [PrismaService, RolesGuard],
})
export class AdminModule {}
