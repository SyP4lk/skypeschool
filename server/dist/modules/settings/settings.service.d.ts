import { PrismaService } from '../../prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    get(key: string): Promise<{
        key: string;
        value: string;
    }>;
    set(key: string, value: string): Promise<{
        ok: boolean;
    }>;
}
