import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private auth;
    constructor(auth: AuthService);
    validate(login: string, password: string): Promise<{
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
}
export {};
