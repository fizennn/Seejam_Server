import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { buildResponse } from '../common/types/base-response';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo trang bị' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(@Body() payload: CreateEquipmentDto) {
    const created = await this.equipmentService.create(payload);
    return buildResponse({
      data: created,
      message: 'Tạo trang bị thành công',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách trang bị' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const list = await this.equipmentService.findAll();
    return buildResponse({ data: list, message: 'Lấy danh sách trang bị thành công' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết trang bị' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(@Param('id') id: string) {
    const found = await this.equipmentService.findOne(id);
    return buildResponse({ data: found, message: 'Lấy chi tiết trang bị thành công' });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật trang bị' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(@Param('id') id: string, @Body() payload: UpdateEquipmentDto) {
    const updated = await this.equipmentService.update(id, payload);
    return buildResponse({ data: updated, message: 'Cập nhật trang bị thành công' });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa trang bị' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async remove(@Param('id') id: string) {
    await this.equipmentService.remove(id);
    return buildResponse({ data: true, message: 'Xóa trang bị thành công' });
  }
}

@ApiTags('sync')
@Controller('sync')
export class EquipmentSyncController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post('equipment')
  @ApiOperation({ summary: 'Đồng bộ dữ liệu equipment theo schema mới' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async syncEquipment() {
    const result = await this.equipmentService.syncEquipment();
    return buildResponse({ data: result, message: 'Đồng bộ equipment hoàn tất' });
  }
}


