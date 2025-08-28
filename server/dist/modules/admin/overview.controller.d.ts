import { PrismaService } from '../../prisma.service';
export declare class AdminOverviewController {
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
            createdAt: string;
        }[];
        recentChanges: never[];
    }>;
}
