import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma.service';
export declare class AdminFinanceController {
    private readonly service;
    private readonly prisma;
    constructor(service: FinanceService, prisma: PrismaService);
    users(q?: string, limit?: string): Promise<{
        id: string;
        login: string;
        email: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        firstName: string | null;
        lastName: string | null;
        balance: number;
    }[]>;
    adjust(body: {
        userId: string;
        amount: number;
        comment?: string;
    }): Promise<{
        userId: any;
        balance: any;
    }>;
    ops(q: any): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    complete(id: string): Promise<{
        ok: boolean;
    }>;
    cancel(id: string): Promise<{
        ok: boolean;
    }>;
}
