import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
export declare class AdminTeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    findAll(): Promise<({
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
    })[]>;
    findOne(id: string): Promise<({
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
    }) | null>;
    create(file: any, dto: CreateTeacherDto): Promise<{
        id: string;
    }>;
    update(id: string, file: any, dto: UpdateTeacherDto): Promise<{
        ok: boolean;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
