import { TeacherSubjectInput } from './create-teacher.dto';
export declare class UpdateTeacherDto {
    firstName?: string;
    lastName?: string;
    aboutShort?: string;
    photo?: string;
    teacherSubjects?: TeacherSubjectInput[];
}
