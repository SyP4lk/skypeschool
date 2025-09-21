// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AdminModule } from './modules/admin/admin.module';
import { StudentsModule } from './modules/students/students.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TrialRequestsModule } from './modules/trial-requests/trial-requests.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { SupportModule } from './modules/support/support.module';

@Module({
  imports: [
    // Static files (if used in project)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),

    AuthModule,
    CategoriesModule,
    SubjectsModule,
    TeachersModule,
    AdminModule,
    StudentsModule,
    LessonsModule,
    TrialRequestsModule,
    ArticlesModule,
    FinanceModule,
    SettingsModule,
    WithdrawalsModule,
    SupportModule,
  ],
})
export class AppModule {}
