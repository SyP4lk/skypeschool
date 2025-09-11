import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma.service';
export declare class AdminFinanceOpsController {
    private readonly finance;
    private readonly prisma;
    constructor(finance: FinanceService, prisma: PrismaService);
    ops(q: any): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    adjust(body: any): Promise<{
        userId: any;
        balance: any;
    }>;
    users(q: string): Promise<any>;
}
