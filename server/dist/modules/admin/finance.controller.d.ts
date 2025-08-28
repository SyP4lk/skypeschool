import { PrismaService } from '../../prisma.service';
export declare class AdminFinanceController {
    private prisma;
    constructor(prisma: PrismaService);
    change(body: {
        userId: string;
        delta: number;
        reason?: string;
    }): Promise<{
        userId: string;
        balance: number;
    }>;
}
