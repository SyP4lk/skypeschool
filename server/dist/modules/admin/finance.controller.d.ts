import { PrismaService } from '../../prisma.service';
export declare class AdminFinanceController {
    private prisma;
    constructor(prisma: PrismaService);
    adjust(body: {
        userId: string;
        delta: number;
        reason?: string;
        adminId?: string;
    }): Promise<{
        ok: boolean;
        balance: number;
    }>;
}
