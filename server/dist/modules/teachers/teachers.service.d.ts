import { PrismaService } from '../../prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
export declare class TeachersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllSummary(opts?: {
        subjectId?: string;
        categoryId?: string;
    }): Promise<{
        id: string;
        userId: string;
        aboutShort: string | null;
        photo: string | null;
        subjects: {
            name: string;
            id: string;
            slug: string;
        }[];
        priceRange: {
            min: number;
            max: number;
        } | null;
    }[]>;
    findOneDetail(id: string): Promise<({
        user: {
            login: string;
            firstName: string | null;
            lastName: string | null;
        };
        teacherSubjects: ({
            subject: {
                name: string;
                id: string;
                slug: string;
                categoryId: string;
                descriptionShort: string | null;
                descriptionFull: string | null;
                benefits: import(".prisma/client/runtime/library").JsonValue | null;
                program: import(".prisma/client/runtime/library").JsonValue | null;
                seoTitle: string | null;
                seoDescription: string | null;
            };
        } & {
            id: string;
            teacherId: string;
            subjectId: string;
            price: number;
            duration: number;
        })[];
    } & {
        id: string;
        userId: string;
        photo: string | null;
        aboutShort: string | null;
        aboutFull: string | null;
        education: string | null;
        isActive: boolean;
        sortOrder: number;
        contactVk: string | null;
        contactTelegram: string | null;
        contactWhatsapp: string | null;
        contactZoom: string | null;
        contactTeams: string | null;
        contactDiscord: string | null;
        contactMax: string | null;
    }) | null>;
    findAllForAdmin(): Promise<({
        user: {
            id: string;
            login: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        userId: string;
        photo: string | null;
        aboutShort: string | null;
        aboutFull: string | null;
        education: string | null;
        isActive: boolean;
        sortOrder: number;
        contactVk: string | null;
        contactTelegram: string | null;
        contactWhatsapp: string | null;
        contactZoom: string | null;
        contactTeams: string | null;
        contactDiscord: string | null;
        contactMax: string | null;
    })[]>;
    createTeacher(dto: CreateTeacherDto): Promise<{
        id: string;
    }>;
    updateTeacher(id: string, dto: UpdateTeacherDto): Promise<{
        ok: boolean;
    }>;
    removeTeacher(id: string): Promise<{
        ok: boolean;
    }>;
}
