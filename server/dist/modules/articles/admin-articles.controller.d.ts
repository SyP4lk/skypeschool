import { ArticlesService } from './articles.service';
export declare class AdminArticlesController {
    private readonly articles;
    constructor(articles: ArticlesService);
    getOne(id: string): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    }>;
    create(file: Express.Multer.File | undefined, title: string, content: string): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    }>;
    update(id: string, file: Express.Multer.File | undefined, title?: string, content?: string): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
