import { PrismaService } from '../../prisma.service';
export declare class SubjectsController {
    private prisma;
    constructor(prisma: PrismaService);
    all(query?: string, q?: string): Promise<({
        category: {
            name: string;
            id: string;
        };
    } & {
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
    })[]>;
    search(query?: string, q2?: string): Promise<({
        category: {
            name: string;
            id: string;
        };
    } & {
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
    })[]>;
    create(body: {
        name: string;
        categoryId: string;
        slug?: string;
    }): Promise<{
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
    }>;
    update(id: string, data: {
        name?: string;
        categoryId?: string;
        descriptionShort?: string;
    }): Promise<{
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
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
