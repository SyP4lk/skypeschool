import { ArticlesService } from './articles.service';
export declare class AdminArticlesController {
    private readonly articles;
    constructor(articles: ArticlesService);
    getOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    }>;
    create(file: Express.Multer.File | undefined, title: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    }>;
    update(id: string, file: Express.Multer.File | undefined, title?: string, content?: string): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
