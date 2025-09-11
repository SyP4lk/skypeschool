import { PrismaService } from '../../prisma.service';
import type { Request } from 'express';
export declare class FinanceMeController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    balance(req: Request): Promise<{
        balance: number;
        currency: string;
    }>;
    tx(req: Request, pageStr?: string, limitStr?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
