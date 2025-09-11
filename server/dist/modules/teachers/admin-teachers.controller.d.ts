import { PrismaService } from '../../prisma.service';
export declare class AdminTeachersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private resolveIds;
    list(): Promise<any>;
    create(body: any): Promise<{
        ok: boolean;
        id: any;
        userId: string;
    }>;
    read(id: string): Promise<{
        user: {
            id: any;
            login: any;
            role: any;
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            balance: any;
            createdAt: any;
        };
        aboutShort: any;
        photo: any;
        teacherSubjects: any[];
        contactVk: any;
        contactTelegram: any;
        contactWhatsapp: any;
        contactZoom: any;
        contactTeams: any;
        contactDiscord: any;
        contactMax: any;
    }>;
    update(id: string, body: any): Promise<{
        ok: boolean;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
