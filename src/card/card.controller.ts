import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { buildResponse } from '../common/types/base-response';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@ApiTags('cards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo card' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(@Body() payload: CreateCardDto) {
    const created = await this.cardService.create(payload);
    return buildResponse({ data: created, message: 'Tạo card thành công' });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách card' })
  async findAll() {
    const list = await this.cardService.findAll();
    return buildResponse({ data: list, message: 'Lấy danh sách card thành công' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết card' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(@Param('id') id: string) {
    const found = await this.cardService.findOne(id);
    return buildResponse({ data: found, message: 'Lấy chi tiết card thành công' });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật card' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(@Param('id') id: string, @Body() payload: UpdateCardDto) {
    const updated = await this.cardService.update(id, payload);
    return buildResponse({ data: updated, message: 'Cập nhật card thành công' });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa card' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async remove(@Param('id') id: string) {
    await this.cardService.remove(id);
    return buildResponse({ data: true, message: 'Xóa card thành công' });
  }
}

@ApiTags('sync')
@Controller('sync')
export class CardSyncController {
  constructor(private readonly cardService: CardService) {}

  @Post('card')
  @ApiOperation({ summary: 'Đồng bộ dữ liệu card theo schema mới' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async syncCards() {
    const result = await this.cardService.syncCards();
    return buildResponse({ data: result, message: 'Đồng bộ card hoàn tất' });
  }
}


