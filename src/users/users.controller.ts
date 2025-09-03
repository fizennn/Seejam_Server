import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description: 'Đăng ký tài khoản người dùng mới',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'Tạo người dùng thành công',
    type: CreateUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả người dùng',
    description: 'Lấy danh sách tất cả người dùng (yêu cầu xác thực)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách người dùng thành công',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Lấy thông tin profile người dùng hiện tại',
    description: 'Lấy thông tin chi tiết của người dùng đang đăng nhập',
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
    const user = await this.usersService.findOne(req.user.id);
    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng theo ID',
    description: 'Lấy thông tin chi tiết của một người dùng cụ thể',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy người dùng',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng',
    description: 'Cập nhật thông tin của một người dùng cụ thể',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng cần cập nhật',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Cập nhật người dùng thành công',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy người dùng',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Xóa người dùng',
    description: 'Xóa một người dùng khỏi hệ thống',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng cần xóa',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Xóa người dùng thành công',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy người dùng',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
