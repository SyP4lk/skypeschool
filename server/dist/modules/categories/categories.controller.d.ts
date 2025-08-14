import { PrismaService } from '../../prisma.service';
export declare class CategoriesController {
    private prisma;
    constructor(prisma: PrismaService);
    all(): Promise<({
        subjects: {
            id: string;
            name: string;
            slug: string;
            categoryId: string;
            descriptionShort: string | null;
            descriptionFull: string | null;
            benefits: import(".prisma/client/runtime/library").JsonValue | null;
            program: import(".prisma/client/runtime/library").JsonValue | null;
            seoTitle: string | null;
            seoDescription: string | null;
        }[];
    } & {
        id: string;
        name: string;
    })[]>;
    create(data: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
    }>;
    update(id: string, data: {
        name?: string;
    }): Promise<{
        id: string;
        name: string;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
