import { PrismaService } from '../../prisma.service';
export declare class AdminUsersController {
    private prisma;
    constructor(prisma: PrismaService);
    list(role?: 'student' | 'teacher' | 'all', query?: string, offset?: string, limit?: string): Promise<{
        items: {
            id: string;
            login: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string | null;
            lastName: string | null;
            balance: number;
        }[];
        total: number;
    }>;
    getOne(id: string): Promise<{
        user: {
            id: string;
            login: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string | null;
            lastName: string | null;
            tz: string;
            balance: number;
        };
    }>;
    create(body: {
        role: 'student' | 'teacher';
        login: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        tz?: string;
    }): Promise<{
        ok: boolean;
        user: {
            id: string;
            login: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string | null;
            lastName: string | null;
            balance: number;
        };
        newPassword: string | undefined;
    }>;
    updateNames(id: string, body: {
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<{
        user: {
            id: string;
            login: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string | null;
            lastName: string | null;
            balance: number;
        };
    }>;
    setPassword(id: string, body: {
        newPassword?: string;
    }): Promise<{
        ok: boolean;
    }>;
    balance(id: string): Promise<{
        balance: number;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
