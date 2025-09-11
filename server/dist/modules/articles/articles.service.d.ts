import { PrismaService } from '../../prisma.service';
export declare class ArticlesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: number, limit?: number): Promise<{
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
    findById(id: string): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    } | null>;
    create(data: {
        title: string;
        content: string;
        image: string | null;
    }): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    }>;
    update(id: string, patch: Partial<{
        title: string;
        content: string;
        image: string | null;
    }>): Promise<{
        image: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        content: string;
    }>;
    remove(id: string): Promise<void>;
    private ensureUniqueSlug;
    private slugify;
}
