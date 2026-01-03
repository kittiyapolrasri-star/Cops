import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกชื่อผู้ใช้' })
    username: string;

    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
    @MinLength(4, { message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' })
    password: string;
}
