export declare class TeacherSubjectInput {
    subjectId: string;
    price: number;
    duration: number;
}
export declare class CreateTeacherDto {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    aboutShort?: string;
    photo?: string;
    teacherSubjects: TeacherSubjectInput[];
}
