import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    validateUser(login: string, password: string): Promise<{
        id: string;
        login: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string | null;
        lastName: string | null;
        tz: string;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sign(user: {
        id: string;
        login: string;
        role: string;
    }): Promise<string>;
    me(userId: string): Promise<{
        id: string;
        login: string;
        role: import(".prisma/client").$Enums.Role;
        tz: string;
        balance: number;
        createdAt: Date;
    }>;
}
