import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    private tryFindByLogin;
    private tryFindByEmail;
    private tryFindByPhone;
    validateUser(ident: string, password: string): Promise<{
        id: string;
        login: string;
        email: string | null;
        phone: string | null;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string | null;
        lastName: string | null;
        tz: string;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sign(payload: {
        id: string;
        login: string;
        role: string;
    }): Promise<string>;
    me(userId: string): Promise<{
        user: {
            email: string | null;
            phone: string | null;
            id?: string | undefined;
            login?: string | undefined;
            role?: import(".prisma/client").$Enums.Role | undefined;
            firstName?: string | null | undefined;
            lastName?: string | null | undefined;
            createdAt?: Date | undefined;
        };
    }>;
}
