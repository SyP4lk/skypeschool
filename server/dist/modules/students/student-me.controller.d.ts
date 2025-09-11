import { PrismaService } from '../../prisma.service';
import type { Request } from 'express';
export declare class StudentMeController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    myLessons(req: Request): Promise<{
        id: any;
        startsAt: any;
        duration: any;
        durationMin: any;
        price: number;
        status: string;
        subjectName: any;
        teacher: {
            id: any;
            login: any;
            firstName: any;
            lastName: any;
        } | null;
    }[]>;
    topupText(): Promise<{
        text: string;
    }>;
}
