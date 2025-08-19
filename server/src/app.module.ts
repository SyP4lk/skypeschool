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


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    AuthModule, CategoriesModule, SubjectsModule, TeachersModule, AdminModule, StudentsModule, LessonsModule, TrialRequestsModule, ArticlesModule
  ],
})
export class AppModule {}
