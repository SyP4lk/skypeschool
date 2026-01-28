import { PrismaService } from '../../prisma.service';
export declare class AdminTrialsController {
    private prisma;
    constructor(prisma: PrismaService);
    list(status?: 'new' | 'processed'): Promise<{
        items: {
            message: string | null;
            name: string;
            id: string;
            createdAt: Date;
            subjectId: string | null;
            status: import(".prisma/client").$Enums.InboxStatus;
            contact: string | null;
        }[];
    }>;
    setStatus(id: string, body: {
        status: 'new' | 'processed';
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InboxStatus;
    }>;
}
