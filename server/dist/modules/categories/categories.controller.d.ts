import { PrismaService } from '../../prisma.service';
export declare class CategoriesController {
    private prisma;
    constructor(prisma: PrismaService);
    all(): Promise<({
        subjects: {
            name: string;
            id: string;
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
        name: string;
        id: string;
    })[]>;
    create(data: {
        name: string;
    }): Promise<{
        name: string;
        id: string;
    }>;
    update(id: string, data: {
        name?: string;
    }): Promise<{
        name: string;
        id: string;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
