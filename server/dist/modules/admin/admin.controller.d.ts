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
            user: {
                id: string;
                login: string;
                firstName: string | null;
                lastName: string | null;
            };
            id: string;
            createdAt: Date;
            delta: number;
            reason: string | null;
        }[];
    }>;
}
