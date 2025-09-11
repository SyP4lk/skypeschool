import { ArticlesService } from './articles.service';
export declare class ArticlesController {
    private readonly svc;
    constructor(svc: ArticlesService);
    list(page?: string, limit?: string): Promise<{
        items: {
            image: string | null;
            id: string;
            createdAt: Date;
            slug: string;
            title: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    bySlug(slug: string): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    }>;
}
