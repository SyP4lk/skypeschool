import { PrismaService } from '../../prisma.service';
type AnyRec = Record<string, any>;
export declare class FinanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    repo(p: AnyRec): "balanceChange" | "transaction" | "financeTransaction" | null;
    getBalance(userId: string): Promise<{
        balance: number;
        currency: string;
    }>;
    adjust(userId: string, amountRub: number, comment?: string): Promise<{
        userId: any;
        balance: any;
    }>;
    private mapWithdrawStatus;
    private deriveLessonOpsFromBalanceChanges;
    ops(q: any): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    listUserTransactions(userId: string, q: any): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
}
export {};
