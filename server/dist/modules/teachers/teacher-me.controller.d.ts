import { PrismaService } from '../../prisma.service';
import type { Request } from 'express';
type AnyRec = Record<string, any>;
export declare class TeacherMeController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toNum;
    private normStatus;
    private anyToCents;
    subjects(req: Request): Promise<any[]>;
    students(q?: string): Promise<any>;
    myLessons(req: Request): Promise<any>;
    createLesson(req: Request, body: AnyRec): Promise<{
        ok: boolean;
        id: any;
    }>;
    done(id: string): Promise<any>;
    cancel(id: string): Promise<{
        ok: boolean;
    }>;
}
export {};
