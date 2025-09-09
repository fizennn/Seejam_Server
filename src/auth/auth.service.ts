import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    };
  }

  async loginLocal(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    };
  }

  async register(registerDto: RegisterDto) {
    // Kiểm tra xác nhận mật khẩu
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Xác nhận mật khẩu không khớp');
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    // Tạo CreateUserDto từ RegisterDto
    const createUserDto: CreateUserDto = {
      fullName: registerDto.fullName,
      email: registerDto.email,
      password: registerDto.password,
    };

    const user = await this.usersService.create(createUserDto);

    const payload = { email: user.email, sub: user._id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy thông tin user');
    }
    return user;
  }
}
