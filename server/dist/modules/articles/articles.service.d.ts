import { PrismaService } from '../../prisma.service';
export declare class ArticlesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: number, limit?: number): Promise<{
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
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    } | null>;
    create(data: {
        title: string;
        content: string;
        image: string | null;
    }): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    }>;
    update(id: string, patch: Partial<{
        title: string;
        content: string;
        image: string | null;
    }>): Promise<{
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
        image: string | null;
    }>;
    remove(id: string): Promise<void>;
    private ensureUniqueSlug;
    private slugify;
}
