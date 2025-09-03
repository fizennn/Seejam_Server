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
import { buildResponse } from '../common/types/base-response';
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
import { AddInventoryDto } from './dto/add-inventory.dto';
import { EquipInventoryDto } from './dto/equip-inventory.dto';

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
  async create(@Body() createUserDto: CreateUserDto) {
    const created = await this.usersService.create(createUserDto);
    return buildResponse({ data: created, message: 'Tạo người dùng thành công' });
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
  async findAll() {
    const list = await this.usersService.findAll();
    return buildResponse({ data: list, message: 'Lấy danh sách người dùng thành công' });
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
    return buildResponse({
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        isActive: user.isActive,
        hp: user.hp,
        atk: user.atk,
        def: user.def,
        weapon: user.weapon,
        armor: user.armor,
        helmet: user.helmet,
        boots: user.boots,
        necklace: user.necklace,
        ring: user.ring,
        inventory: user.inventory,
      },
      message: 'Lấy profile thành công',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip')
  @ApiOperation({ 
    summary: 'Trang bị equipment từ inventory',
    description: 'Trang bị các item từ inventory vào các slot tương ứng (weapon, armor, helmet, boots, necklace, ring)'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: EquipInventoryDto })
  @ApiResponse({
    status: 200,
    description: 'Trang bị equipment thành công',
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ hoặc vị trí không tồn tại',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  async equipFromInventory(@Request() req, @Body() equipDto: EquipInventoryDto) {
    const updated = await this.usersService.equipFromInventory(req.user.id, equipDto);
    return buildResponse({ 
      data: {
        id: updated._id,
        weapon: updated.weapon,
        armor: updated.armor,
        helmet: updated.helmet,
        boots: updated.boots,
        necklace: updated.necklace,
        ring: updated.ring,
        inventory: updated.inventory
      }, 
      message: 'Trang bị equipment thành công' 
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/:equipmentId')
  @ApiOperation({ summary: 'Thêm equipment vào inventory của user hiện tại' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'equipmentId', description: 'ObjectId của equipment' })
  async addToInventory(@Request() req, @Param('equipmentId') equipmentId: string) {
    const updated = await this.usersService.addEquipmentToInventory(req.user.id, equipmentId);
    return buildResponse({ data: { inventory: updated.inventory }, message: 'Đã thêm vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/:equipmentId')
  @ApiOperation({ summary: 'Xóa equipment khỏi inventory của user hiện tại' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'equipmentId', description: 'ObjectId của equipment' })
  async removeFromInventory(@Request() req, @Param('equipmentId') equipmentId: string) {
    const updated = await this.usersService.removeEquipmentFromInventory(req.user.id, equipmentId);
    return buildResponse({ data: { inventory: updated.inventory }, message: 'Đã xóa khỏi inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/index/:index')
  @ApiOperation({ summary: 'Xóa 1 phần tử trong inventory theo index' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí phần tử trong mảng inventory (0-based)' })
  async removeFromInventoryByIndex(@Request() req, @Param('index') index: string) {
    const updated = await this.usersService.removeEquipmentFromInventoryByIndex(req.user.id, Number(index));
    return buildResponse({ data: { inventory: updated.inventory }, message: 'Đã xóa 1 phần tử khỏi inventory theo index' });
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
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return buildResponse({ data: user, message: 'Lấy thông tin người dùng thành công' });
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
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updated = await this.usersService.update(id, updateUserDto);
    return buildResponse({ data: updated, message: 'Cập nhật người dùng thành công' });
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
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return buildResponse({ data: true, message: 'Xóa người dùng thành công' });
  }
}
