import { PrismaService } from '../../prisma.service';
export declare class RegisterController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(body: any): Promise<{
        ok: boolean;
        id: any;
    }>;
}
