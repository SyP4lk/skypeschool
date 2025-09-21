import { PrismaService } from '../../prisma.service';
export declare class AdminSettingsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    read(key?: string): Promise<{
        key: string;
        value: string;
    }>;
    write(body: any): Promise<{
        ok: boolean;
    }>;
}
