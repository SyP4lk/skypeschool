import { PrismaService } from '../../prisma.service';
export declare class AdminController {
    private prisma;
    constructor(prisma: PrismaService);
    overview(): Promise<{
        metrics: {
            todayLessons: number;
            next7Lessons: number;
            negativeBalances: number;
        };
        recentStudents: {
            id: string;
            login: string;
            firstName: string | null;
            lastName: string | null;
            createdAt: Date;
        }[];
        recentChanges: {
            reason: string | null;
            id: string;
            user: {
                id: string;
                login: string;
                firstName: string | null;
                lastName: string | null;
            };
            createdAt: Date;
            delta: number;
        }[];
    }>;
}
