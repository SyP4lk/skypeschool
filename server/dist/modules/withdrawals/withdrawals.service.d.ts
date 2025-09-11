import { PrismaService } from '../../prisma.service';
export declare class WithdrawalsService {
    private prisma;
    constructor(prisma: PrismaService);
    createTeacherRequest(teacherId: string, amount: number, notes: string): Promise<any>;
    listTeacherRequests(teacherId: string, page?: number, limit?: number): Promise<any>;
    adminList(status?: string, page?: number, limit?: number): Promise<any>;
    approve(id: string, adminId?: string): Promise<any>;
    reject(id: string, adminId?: string): Promise<any>;
}
