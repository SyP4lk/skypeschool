import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly svc: ArticlesService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.list(Number(page) || 1, Number(limit) || 12);
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.svc.bySlug(slug);
  }
}
