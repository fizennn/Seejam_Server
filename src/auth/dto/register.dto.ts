import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class RegisterDto {
  @ApiProperty({
    description: 'Họ và tên đầy đủ',
    example: 'Nguyễn Văn A',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullName: string;

  @ApiProperty({
    description: 'Email đăng ký (phải là email hợp lệ và duy nhất)',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu (tối thiểu 6 ký tự, bao gồm chữ hoa, chữ thường và số)',
    example: 'Password123',
    minLength: 6,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  password: string;

  @ApiProperty({
    description: 'Xác nhận mật khẩu (phải giống với mật khẩu)',
    example: 'Password123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Xác nhận mật khẩu không khớp' })
  confirmPassword: string;
}
