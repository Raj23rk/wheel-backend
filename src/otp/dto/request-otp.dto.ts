import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}