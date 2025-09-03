import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { buildResponse } from '../common/types/base-response';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới với email và mật khẩu',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ hoặc xác nhận mật khẩu không khớp',
  })
  @ApiConflictResponse({
    description: 'Email đã tồn tại trong hệ thống',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return buildResponse({ data: result, message: 'Đăng ký thành công' });
  }

  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập người dùng',
    description: 'Xác thực email và mật khẩu để đăng nhập',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiUnauthorizedResponse({
    description: 'Email hoặc mật khẩu không đúng',
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return buildResponse({ data: result, message: 'Đăng nhập thành công' });
  }

  @UseGuards(LocalAuthGuard)
  @Post('login-local')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Đăng nhập với Local Strategy',
    description: 'Sử dụng Local Strategy để xác thực',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Xác thực thất bại',
  })
  async loginLocal(@Request() req) {
    const result = await this.authService.loginLocal(req.user);
    return buildResponse({ data: result, message: 'Đăng nhập thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Lấy thông tin profile',
    description: 'Lấy thông tin người dùng từ JWT token',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin profile thành công',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  async getProfile(@Request() req) {
    const user = await this.authService.getUserProfile(req.user.id);
    return buildResponse({
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        isActive: user.isActive,
        inventory: user.inventory
      },
      message: 'Lấy profile thành công',
    });
  }
}
