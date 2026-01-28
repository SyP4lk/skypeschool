import { PrismaService } from '../../prisma.service';
export declare class AdminCategoriesController {
    private prisma;
    constructor(prisma: PrismaService);
    list(): Promise<any>;
    create(body: {
        name: string;
    }): Promise<any>;
    update(id: string, body: {
        name?: string;
    }): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
