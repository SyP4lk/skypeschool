import { PrismaService } from '../../prisma.service';
export declare class AdminSupportController {
    private prisma;
    constructor(prisma: PrismaService);
    list(status?: 'new' | 'processed'): Promise<{
        items: {
            message: string;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.InboxStatus;
            contact: string | null;
            fromLogin: string | null;
        }[];
    }>;
    setStatus(id: string, body: {
        status: 'new' | 'processed';
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InboxStatus;
    }>;
}
