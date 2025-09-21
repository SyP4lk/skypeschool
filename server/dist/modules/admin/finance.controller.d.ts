import { PrismaService } from '../../prisma.service';
export declare class AdminFinanceController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ops(q: any): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    adjust(body: any): Promise<{
        ok: boolean;
    }>;
    users(q: string): Promise<any>;
    complete(id: string): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
    cancel(id: string): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
}
