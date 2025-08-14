import { AuthService } from './auth.service';
import { Response } from 'express';
import { PrismaService } from '../../prisma.service';
export declare class AuthController {
    private readonly auth;
    private readonly prisma;
    constructor(auth: AuthService, prisma: PrismaService);
    login(req: any, res: Response): Promise<{
        ok: boolean;
        user: {
            id: any;
            login: any;
            role: any;
        };
    }>;
    registerStudent(req: any, res: Response): Promise<{
        ok: boolean;
        user: {
            id: string;
            login: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    logout(res: Response): Promise<{
        ok: boolean;
    }>;
    me(req: any): Promise<{
        id: string;
        login: string;
        role: import(".prisma/client").$Enums.Role;
        tz: string;
        balance: number;
        createdAt: Date;
    }>;
}
