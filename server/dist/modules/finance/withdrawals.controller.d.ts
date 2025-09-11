import { PrismaService } from '../../prisma.service';
export declare class TeacherWithdrawalsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(req: any, body: any): Promise<{
        ok: boolean;
        id: any;
    }>;
}
