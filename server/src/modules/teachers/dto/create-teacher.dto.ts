import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Данные для одной связки преподаватель–предмет.
 */
export class TeacherSubjectInput {
  /**
   * Идентификатор предмета. Используем оператор `!`, чтобы подавить ошибку
   * strictPropertyInitialization: поле будет присвоено при создании объекта.
   */
  @IsString()
  subjectId!: string;

  /** Цена за занятие по предмету. Должна быть положительным числом. */
  @IsNumber()
  @Min(0)
  price!: number;

  /**
   * Длительность одного занятия по данному предмету (в минутах).
   * Должна быть положительным числом. Оператор `!` подавляет
   * ошибку strictPropertyInitialization.
   */
  @IsNumber()
  @Min(1)
  duration!: number;
}

/**
 * DTO для создания нового преподавателя.
 * Администратор задаёт учётную запись (логин, пароль, имя, фамилию) и информацию профиля.
 * Поле `teacherSubjects` задаёт список преподаваемых предметов и цен.
 */
export class CreateTeacherDto {
  // учётная запись
  @IsString()
  login!: string;

  @IsString()
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  // профиль
  @IsOptional()
  @IsString()
  aboutShort?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherSubjectInput)
  /**
   * Список преподаваемых предметов. Для строгой инициализации задаём
   * значение по умолчанию — пустой массив. В реальных данных сюда
   * передаются объекты с полями subjectId и price.
   */
  teacherSubjects: TeacherSubjectInput[] = [];
}