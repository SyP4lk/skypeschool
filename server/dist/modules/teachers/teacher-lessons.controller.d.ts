import { PrismaService } from '../../prisma.service';
export declare class TeacherLessonsController {
    private prisma;
    constructor(prisma: PrismaService);
    listMyLessons(req: any, status?: string, from?: string, to?: string, page?: string, limit?: string): Promise<any>;
    createLesson(req: any, body: {
        studentId: string;
        subjectId: string;
        startsAt: string;
        durationMin: number;
        price: number;
        comment?: string;
    }): Promise<any>;
    done(req: any, id: string): Promise<any>;
    cancel(req: any, id: string): Promise<any>;
    reschedule(req: any, id: string, body: {
        startsAt: string;
        durationMin?: number;
    }): Promise<any>;
}
