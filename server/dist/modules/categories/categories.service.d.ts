import { PrismaService } from '../../prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: string;
    }[]>;
}
