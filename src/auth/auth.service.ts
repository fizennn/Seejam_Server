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
      // Trả về bản sao không chứa password
      // Tránh tạo biến không dùng để thỏa linter
      const clone: any = { ...(user as any) };
      delete clone.password;
      return clone;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Lấy lại user đầy đủ từ DB để đảm bảo có đủ trường và _id chính xác
    const fullUser = await this.usersService.findByEmail(loginDto.email);

    const payload = {
      email: fullUser.email,
      sub: fullUser._id,
      role: fullUser.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    } as any;
  }

  async loginLocal(user: any) {
    // Lấy lại user đầy đủ theo email
    const fullUser = await this.usersService.findByEmail(user.email);
    const payload = { email: fullUser.email, sub: (fullUser as any)._id, role: (fullUser as any).role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: (fullUser as any)._id,
        email: fullUser.email,
        fullName: (fullUser as any).fullName,
        role: (fullUser as any).role,
        isEmailVerified: (fullUser as any).isEmailVerified,
        avatar: (fullUser as any).avatar,
        isActive: (fullUser as any).isActive,
        inventory: (fullUser as any).inventory,
      },
    } as any;
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

    const payload = { email: user.email, sub: (user as any)._id, role: (user as any).role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    } as any;
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy thông tin user');
    }
    return user;
  }
}
