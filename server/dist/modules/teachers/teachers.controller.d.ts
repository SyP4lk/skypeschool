import { PrismaService } from '../../prisma.service';
export declare class TeachersController {
    private prisma;
    constructor(prisma: PrismaService);
    list(): Promise<({
        user: {
            id: string;
            login: string;
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
    })[]>;
    one(id: string): Promise<({
        user: {
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
    }) | null>;
    create(body: {
        userId: string;
        aboutShort?: string;
        isActive?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        userId: string;
        photo: string | null;
        aboutShort: string | null;
        aboutFull: string | null;
        education: string | null;
        isActive: boolean;
        sortOrder: number;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        userId: string;
        photo: string | null;
        aboutShort: string | null;
        aboutFull: string | null;
        education: string | null;
        isActive: boolean;
        sortOrder: number;
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
}
