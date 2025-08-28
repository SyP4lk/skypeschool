import { PrismaService } from '../../prisma.service';
export declare class StudentsController {
    private prisma;
    constructor(prisma: PrismaService);
    list(): Promise<{
        id: string;
        login: string;
        firstName: string | null;
        lastName: string | null;
        tz: string;
        balance: number;
        createdAt: Date;
        studentProfile: {
            id: string;
            userId: string;
            avatar: string | null;
            contactSkype: string | null;
            contactVk: string | null;
            contactGoogle: string | null;
            contactWhatsapp: string | null;
            contactMax: string | null;
            contactDiscord: string | null;
        } | null;
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
