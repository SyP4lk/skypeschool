import { PrismaService } from '../../prisma.service';
export declare class LessonsController {
    private prisma;
    constructor(prisma: PrismaService);
    list(req: any, _p: any, _b: any, studentId?: string, teacherId?: string): Promise<({
        subject: {
            name: string;
            id: string;
        };
        teacher: {
            id: string;
            login: string;
            firstName: string | null;
            lastName: string | null;
        };
        student: {
            id: string;
            login: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        teacherId: string;
        subjectId: string;
        price: number | null;
        duration: number;
        studentId: string;
        startsAt: Date;
        status: import(".prisma/client").$Enums.LessonStatus;
        channel: import(".prisma/client").$Enums.LessonChannel;
        channelLink: string | null;
        note: string | null;
    })[]>;
    create(req: any, body: {
        teacherId: string;
        studentId: string;
        subjectId: string;
        startsAt: string;
        duration: number;
        channel: string;
        note?: string;
    }): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        price: number | null;
        duration: number;
        studentId: string;
        startsAt: Date;
        status: import(".prisma/client").$Enums.LessonStatus;
        channel: import(".prisma/client").$Enums.LessonChannel;
        channelLink: string | null;
        note: string | null;
    }>;
    update(req: any, id: string, data: any): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        price: number | null;
        duration: number;
        studentId: string;
        startsAt: Date;
        status: import(".prisma/client").$Enums.LessonStatus;
        channel: import(".prisma/client").$Enums.LessonChannel;
        channelLink: string | null;
        note: string | null;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
