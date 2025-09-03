import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  access_token: string;

  @ApiProperty({
    description: 'Thông tin người dùng',
    example: {
      id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      fullName: 'Nguyễn Văn A',
      role: 'user',
      isEmailVerified: false,
    },
    type: Object,
  })
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isEmailVerified: boolean;
  };
}
