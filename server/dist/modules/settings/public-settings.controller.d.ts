import { PrismaService } from '../../prisma.service';
export declare class PublicSettingsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private repo;
    get(key?: string): Promise<{
        value: any;
    }>;
}
