import { PrismaService } from '../../prisma.service';
export declare class TeachersController {
    private prisma;
    constructor(prisma: PrismaService);
    private saveUpload;
    private parseSubjects;
    list(): Promise<({
        user: {
            id: string;
            login: string;
            email: string | null;
            phone: string | null;
            firstName: string | null;
            lastName: string | null;
            balance: number;
        };
        teacherSubjects: ({
            subject: {
                name: string;
                id: string;
                slug: string;
                categoryId: string;
                descriptionShort: string | null;
                descriptionFull: string | null;
                benefits: import(".prisma/client/runtime/library").JsonValue | null;
                program: import(".prisma/client/runtime/library").JsonValue | null;
                seoTitle: string | null;
                seoDescription: string | null;
            };
        } & {
            id: string;
            teacherId: string;
            subjectId: string;
            price: number;
            duration: number;
        })[];
    } & {
        id: string;
        userId: string;
        photo: string | null;
        aboutShort: string | null;
        aboutFull: string | null;
        education: string | null;
        isActive: boolean;
        sortOrder: number;
        contactVk: string | null;
        contactTelegram: string | null;
        contactWhatsapp: string | null;
        contactZoom: string | null;
        contactTeams: string | null;
        contactDiscord: string | null;
        contactMax: string | null;
    })[]>;
    one(id: string): Promise<({
        user: {
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
        };
        teacherSubjects: ({
            subject: {
                name: string;
                id: string;
                slug: string;
                categoryId: string;
                descriptionShort: string | null;
                descriptionFull: string | null;
                benefits: import(".prisma/client/runtime/library").JsonValue | null;
                program: import(".prisma/client/runtime/library").JsonValue | null;
                seoTitle: string | null;
                seoDescription: string | null;
            };
        } & {
            id: string;
            teacherId: string;
            subjectId: string;
            price: number;
            duration: number;
        })[];
    } & {
        id: string;
        userId: string;
        photo: string | null;
        aboutShort: string | null;
        aboutFull: string | null;
        education: string | null;
        isActive: boolean;
        sortOrder: number;
        contactVk: string | null;
        contactTelegram: string | null;
        contactWhatsapp: string | null;
        contactZoom: string | null;
        contactTeams: string | null;
        contactDiscord: string | null;
        contactMax: string | null;
    }) | null>;
    create(file: Express.Multer.File, body: any): Promise<{
        ok: boolean;
        profileId: string;
        userId: string;
    }>;
    update(id: string, file: Express.Multer.File, body: any): Promise<{
        ok: boolean;
    }>;
    addSubject(teacherId: string, body: {
        subjectId: string;
        price: number;
        duration: number;
    }): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        price: number;
        duration: number;
    }>;
    removeLink(linkId: string): Promise<{
        ok: boolean;
    }>;
    removeProfile(id: string): Promise<{
        ok: boolean;
    }>;
}
