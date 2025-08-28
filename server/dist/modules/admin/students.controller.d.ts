import { PrismaService } from '../../prisma.service';
export declare class AdminStudentsController {
    private prisma;
    constructor(prisma: PrismaService);
    getOne(id: string): Promise<{
        user: {
            id: string;
            login: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string | null;
            lastName: string | null;
            balance: number;
        };
        profile: {
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
    }>;
    updateProfile(id: string, body: {
        firstName?: string | null;
        lastName?: string | null;
        contactSkype?: string | null;
        contactVk?: string | null;
        contactGoogle?: string | null;
        contactWhatsapp?: string | null;
        contactMax?: string | null;
        contactDiscord?: string | null;
    }): Promise<{
        ok: boolean;
    }>;
    setPassword(id: string, body: {
        newPassword?: string;
    }): Promise<{
        newPassword: string;
    }>;
    uploadAvatar(id: string, file?: Express.Multer.File): Promise<{
        ok: boolean;
        image: string;
    }>;
}
