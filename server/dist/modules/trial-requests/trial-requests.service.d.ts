import { PrismaService } from '../../prisma.service';
export declare class TrialRequestsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private emailEnabled;
    accept(payload: {
        name: string;
        phone?: string;
        email?: string;
        subjectId?: string;
        message?: string;
    }): Promise<{
        ok: boolean;
        mode: "noop";
    } | {
        ok: boolean;
        mode: "email";
    }>;
    status(): {
        ok: boolean;
        emailEnabled: boolean;
    };
}
