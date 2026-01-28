import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TeacherSubjectInput } from './create-teacher.dto';

/**
 * DTO для обновления информации о преподавателе.
 * Позволяет менять только «человеческие» поля: имя, фамилия, фото, описание и список предметов.
 */
export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  aboutShort?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherSubjectInput)
  teacherSubjects?: TeacherSubjectInput[];
}