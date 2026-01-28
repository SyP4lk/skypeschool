import { Response, Request } from 'express';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthController {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(body: any, res: Response): Promise<{
        id: string;
        login: any;
        role: any;
        email: any;
        phone: any;
        firstName: any;
        lastName: any;
        balance: any;
        createdAt: any;
    }>;
    logout(res: Response): Promise<{
        ok: boolean;
    }>;
    me(req: Request): Promise<{
        id: string;
        login: any;
        role: any;
        email: any;
        phone: any;
        firstName: any;
        lastName: any;
        balance: any;
        createdAt: any;
    }>;
}
