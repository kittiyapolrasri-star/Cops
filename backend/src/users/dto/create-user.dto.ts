import { IsString, IsNotEmpty, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกชื่อผู้ใช้' })
    username: string;

    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
    @MinLength(4, { message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกชื่อ' })
    firstName: string;

    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกนามสกุล' })
    lastName: string;

    @IsString()
    @IsOptional()
    rank?: string;

    @IsString()
    @IsOptional()
    position?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsString()
    @IsOptional()
    stationId?: string;
}
