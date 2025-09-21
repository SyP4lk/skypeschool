// Добавьте импорт модуля статей и ArticlesModule в app.module.ts
import { ArticlesModule } from './modules/articles/articles.module';

// ...
@Module({
  imports: [
    // другие модули…
    ArticlesModule,
  ],
})
export class AppModule {}
