import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateTrialRequestDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  message?: string;
}
