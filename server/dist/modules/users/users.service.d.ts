import { PrismaService } from '../../prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getById(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        login: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string | null;
        lastName: string | null;
        tz: string;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import(".prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
