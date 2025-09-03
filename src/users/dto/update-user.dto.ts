import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Họ và tên đầy đủ',
    example: 'Nguyễn Văn B',
    type: String,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Email đăng nhập (phải là email hợp lệ)',
    example: 'newemail@example.com',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'newpassword123',
    minLength: 6,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
