import { PrismaService } from '../../prisma.service';
export declare class SettingsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private repo;
    getOne(key?: string): Promise<{
        key: string;
        value: any;
    }>;
    upsert(body: any): Promise<{
        ok: boolean;
    }>;
}
