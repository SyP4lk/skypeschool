import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { AdminArticlesController } from './admin-articles.controller';

@Module({
  controllers: [ArticlesController, AdminArticlesController],
  providers: [PrismaService, ArticlesService],
})
export class ArticlesModule {}
