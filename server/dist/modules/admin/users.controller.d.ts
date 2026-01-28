import { PrismaService } from '../../prisma.service';
export declare class AdminUsersController {
    private prisma;
    constructor(prisma: PrismaService);
    list(q?: string, role?: string, pageStr?: string, limitStr?: string): Promise<{
        items: {
            [x: string]: ({
                id: string;
                teacherId: string;
                subjectId: string;
                price: number | null;
                duration: number;
                studentId: string;
                startsAt: Date;
                status: import(".prisma/client").$Enums.LessonStatus;
                channel: import(".prisma/client").$Enums.LessonChannel;
                channelLink: string | null;
                note: string | null;
            } | {
                id: string;
                teacherId: string;
                subjectId: string;
                price: number | null;
                duration: number;
                studentId: string;
                startsAt: Date;
                status: import(".prisma/client").$Enums.LessonStatus;
                channel: import(".prisma/client").$Enums.LessonChannel;
                channelLink: string | null;
                note: string | null;
            })[] | ({
                meta: import(".prisma/client/runtime/library").JsonValue | null;
                type: import(".prisma/client").$Enums.TxType | null;
                reason: string | null;
                id: string;
                createdAt: Date;
                userId: string;
                delta: number;
                adminId: string | null;
            } | {
                meta: import(".prisma/client/runtime/library").JsonValue | null;
                type: import(".prisma/client").$Enums.TxType | null;
                reason: string | null;
                id: string;
                createdAt: Date;
                userId: string;
                delta: number;
                adminId: string | null;
            })[] | ({
                id: string;
                createdAt: Date;
                teacherId: string;
                status: import(".prisma/client").$Enums.WithdrawStatus;
                amount: number;
                notes: string | null;
                resolvedAt: Date | null;
            } | {
                id: string;
                createdAt: Date;
                teacherId: string;
                status: import(".prisma/client").$Enums.WithdrawStatus;
                amount: number;
                notes: string | null;
                resolvedAt: Date | null;
            })[] | {
                id: string;
                teacherId: string;
                subjectId: string;
                price: number | null;
                duration: number;
                studentId: string;
                startsAt: Date;
                status: import(".prisma/client").$Enums.LessonStatus;
                channel: import(".prisma/client").$Enums.LessonChannel;
                channelLink: string | null;
                note: string | null;
            }[] | {
                meta: import(".prisma/client/runtime/library").JsonValue | null;
                type: import(".prisma/client").$Enums.TxType | null;
                reason: string | null;
                id: string;
                createdAt: Date;
                userId: string;
                delta: number;
                adminId: string | null;
            }[] | {
                id: string;
                createdAt: Date;
                teacherId: string;
                status: import(".prisma/client").$Enums.WithdrawStatus;
                amount: number;
                notes: string | null;
                resolvedAt: Date | null;
            }[];
            [x: number]: never;
            [x: symbol]: never;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    read(id: string): Promise<{
        user: {
            [x: string]: ({
                id: string;
                teacherId: string;
                subjectId: string;
                price: number | null;
                duration: number;
                studentId: string;
                startsAt: Date;
                status: import(".prisma/client").$Enums.LessonStatus;
                channel: import(".prisma/client").$Enums.LessonChannel;
                channelLink: string | null;
                note: string | null;
            } | {
                id: string;
                teacherId: string;
                subjectId: string;
                price: number | null;
                duration: number;
                studentId: string;
                startsAt: Date;
                status: import(".prisma/client").$Enums.LessonStatus;
                channel: import(".prisma/client").$Enums.LessonChannel;
                channelLink: string | null;
                note: string | null;
            })[] | ({
                meta: import(".prisma/client/runtime/library").JsonValue | null;
                type: import(".prisma/client").$Enums.TxType | null;
                reason: string | null;
                id: string;
                createdAt: Date;
                userId: string;
                delta: number;
                adminId: string | null;
            } | {
                meta: import(".prisma/client/runtime/library").JsonValue | null;
                type: import(".prisma/client").$Enums.TxType | null;
                reason: string | null;
                id: string;
                createdAt: Date;
                userId: string;
                delta: number;
                adminId: string | null;
            })[] | ({
                id: string;
                createdAt: Date;
                teacherId: string;
                status: import(".prisma/client").$Enums.WithdrawStatus;
                amount: number;
                notes: string | null;
                resolvedAt: Date | null;
            } | {
                id: string;
                createdAt: Date;
                teacherId: string;
                status: import(".prisma/client").$Enums.WithdrawStatus;
                amount: number;
                notes: string | null;
                resolvedAt: Date | null;
            })[] | {
                id: string;
                teacherId: string;
                subjectId: string;
                price: number | null;
                duration: number;
                studentId: string;
                startsAt: Date;
                status: import(".prisma/client").$Enums.LessonStatus;
                channel: import(".prisma/client").$Enums.LessonChannel;
                channelLink: string | null;
                note: string | null;
            }[] | {
                meta: import(".prisma/client/runtime/library").JsonValue | null;
                type: import(".prisma/client").$Enums.TxType | null;
                reason: string | null;
                id: string;
                createdAt: Date;
                userId: string;
                delta: number;
                adminId: string | null;
            }[] | {
                id: string;
                createdAt: Date;
                teacherId: string;
                status: import(".prisma/client").$Enums.WithdrawStatus;
                amount: number;
                notes: string | null;
                resolvedAt: Date | null;
            }[];
            [x: number]: never;
            [x: symbol]: never;
        };
    }>;
    create(body?: any): Promise<{
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
    update(id: string, body?: any): Promise<{
        [x: string]: ({
            id: string;
            teacherId: string;
            subjectId: string;
            price: number | null;
            duration: number;
            studentId: string;
            startsAt: Date;
            status: import(".prisma/client").$Enums.LessonStatus;
            channel: import(".prisma/client").$Enums.LessonChannel;
            channelLink: string | null;
            note: string | null;
        } | {
            id: string;
            teacherId: string;
            subjectId: string;
            price: number | null;
            duration: number;
            studentId: string;
            startsAt: Date;
            status: import(".prisma/client").$Enums.LessonStatus;
            channel: import(".prisma/client").$Enums.LessonChannel;
            channelLink: string | null;
            note: string | null;
        })[] | ({
            meta: import(".prisma/client/runtime/library").JsonValue | null;
            type: import(".prisma/client").$Enums.TxType | null;
            reason: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            delta: number;
            adminId: string | null;
        } | {
            meta: import(".prisma/client/runtime/library").JsonValue | null;
            type: import(".prisma/client").$Enums.TxType | null;
            reason: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            delta: number;
            adminId: string | null;
        })[] | ({
            id: string;
            createdAt: Date;
            teacherId: string;
            status: import(".prisma/client").$Enums.WithdrawStatus;
            amount: number;
            notes: string | null;
            resolvedAt: Date | null;
        } | {
            id: string;
            createdAt: Date;
            teacherId: string;
            status: import(".prisma/client").$Enums.WithdrawStatus;
            amount: number;
            notes: string | null;
            resolvedAt: Date | null;
        })[] | {
            id: string;
            teacherId: string;
            subjectId: string;
            price: number | null;
            duration: number;
            studentId: string;
            startsAt: Date;
            status: import(".prisma/client").$Enums.LessonStatus;
            channel: import(".prisma/client").$Enums.LessonChannel;
            channelLink: string | null;
            note: string | null;
        }[] | {
            meta: import(".prisma/client/runtime/library").JsonValue | null;
            type: import(".prisma/client").$Enums.TxType | null;
            reason: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            delta: number;
            adminId: string | null;
        }[] | {
            id: string;
            createdAt: Date;
            teacherId: string;
            status: import(".prisma/client").$Enums.WithdrawStatus;
            amount: number;
            notes: string | null;
            resolvedAt: Date | null;
        }[];
        [x: number]: never;
        [x: symbol]: never;
    }>;
    changePassword(id: string, body?: any): Promise<{
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
    balance(id: string): Promise<{
        balance: number;
        currency: string;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
