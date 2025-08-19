import { PrismaService } from '../../prisma.service';
import { $Enums } from '@prisma/client';
type Range = 'upcoming' | 'past' | 'all';
type CreateLessonDto = {
    studentId: string;
    subjectId: string;
    startsAt: string;
    duration: number;
    channel?: 'skype' | 'zoom' | 'whatsapp' | 'telegram' | 'other';
};
type UpdateStatusDto = {
    status: 'completed' | 'cancelled';
};
export declare class LessonsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createByTeacher(teacherUserId: string, dto: CreateLessonDto): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        duration: number;
        studentId: string;
        startsAt: Date;
        status: $Enums.LessonStatus;
        channel: $Enums.LessonChannel;
    }>;
    listForTeacher(teacherUserId: string, range?: Range): Promise<{
        id: string;
        subject: {
            name: string;
            id: string;
        };
        duration: number;
        studentId: string;
        startsAt: Date;
        status: $Enums.LessonStatus;
        channel: $Enums.LessonChannel;
    }[]>;
    listForStudent(studentUserId: string, range?: Range): Promise<{
        id: string;
        subject: {
            name: string;
            id: string;
        };
        teacherId: string;
        duration: number;
        startsAt: Date;
        status: $Enums.LessonStatus;
        channel: $Enums.LessonChannel;
    }[]>;
    updateStatusByTeacher(teacherUserId: string, lessonId: string, dto: UpdateStatusDto): Promise<{
        id: string;
        studentId: string;
        status: $Enums.LessonStatus;
    } | {
        ok: boolean;
    }>;
    private parseStartsAt;
    private hasOverlapForTeacher;
    private hasOverlapForStudent;
}
export {};
