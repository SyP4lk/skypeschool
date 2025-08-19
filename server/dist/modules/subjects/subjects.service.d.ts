import { PrismaService } from '../../prisma.service';
export declare class SubjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<({
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
}
