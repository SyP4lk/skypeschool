import { ArticlesService } from './articles.service';
export declare class AdminArticlesController {
    private readonly articles;
    constructor(articles: ArticlesService);
    getOne(id: string): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    }>;
    create(file: Express.Multer.File | undefined, title: string, content: string): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    }>;
    update(id: string, file: Express.Multer.File | undefined, title?: string, content?: string): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
