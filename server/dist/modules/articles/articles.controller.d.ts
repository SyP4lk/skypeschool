import { ArticlesService } from './articles.service';
export declare class ArticlesController {
    private readonly svc;
    constructor(svc: ArticlesService);
    list(page?: string, limit?: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            slug: string;
            title: string;
            image: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    bySlug(slug: string): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    }>;
}
