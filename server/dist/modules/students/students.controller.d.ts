import { PrismaService } from '../../prisma.service';
export declare class StudentsController {
    private prisma;
    constructor(prisma: PrismaService);
    list(q?: string, limit?: string): Promise<{
        id: string;
        login: string;
        firstName: string | null;
        lastName: string | null;
    }[]>;
    create(body: {
        login: string;
        password: string;
        firstName?: string;
        lastName?: string;
        tz?: string;
    }): Promise<{
        id: string;
        login: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    update(id: string, data: {
        firstName?: string;
        lastName?: string;
        tz?: string;
        balance?: number;
    }): Promise<{
        id: string;
        login: string;
        email: string | null;
        phone: string | null;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string | null;
        lastName: string | null;
        tz: string;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
