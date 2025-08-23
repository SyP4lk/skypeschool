import { PrismaService } from '../../prisma.service';
export declare class ArticlesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: number, limit?: number): Promise<{
        items: {
            id: string;
            slug: string;
            title: string;
            image: string | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    bySlug(slug: string): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    }>;
    findById(id: string): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    } | null>;
    create(data: {
        title: string;
        content: string;
        image: string | null;
    }): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    }>;
    update(id: string, patch: Partial<{
        title: string;
        content: string;
        image: string | null;
    }>): Promise<{
        id: string;
        slug: string;
        title: string;
        content: string;
        image: string | null;
        createdAt: Date;
    }>;
    remove(id: string): Promise<void>;
    private ensureUniqueSlug;
    private slugify;
}
