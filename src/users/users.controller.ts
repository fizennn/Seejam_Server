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
  ParseIntPipe,
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
  ApiConflictResponse,
} from '@nestjs/swagger';
import { EquipInventoryDto, EquipOneDto } from './dto/equip-inventory.dto';
import { CreateDeckDto } from './dto/create-deck.dto';
import { RenameDeckDto } from './dto/rename-deck.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private formatEquipResponse(user: any) {
    const toId = (val: any) => (val && typeof val === 'object' ? (val._id ?? val) : val);
    const equipment = {
      weapon: toId(user.weapon) ?? null,
      armor: toId(user.armor) ?? null,
      helmet: toId(user.helmet) ?? null,
      boots: toId(user.boots) ?? null,
      necklace: toId(user.necklace) ?? null,
      ring: toId(user.ring) ?? null,
    };
    const inventory = Array.isArray(user.inventory)
      ? user.inventory.map((it: any) => toId(it))
      : user.inventory;
    return { equipment, inventory };
  }

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
    const { user, effective } = await this.usersService.findOneWithCalculatedStats(req.user.id);
    const desk = await this.usersService.getDesk(req.user.id);
    const toId = (val: any) => (val && typeof val === 'object' ? (val._id ?? val) : val);
    const weaponId = toId((user as any).weapon);
    const armorId = toId((user as any).armor);
    const helmetId = toId((user as any).helmet);
    const bootsId = toId((user as any).boots);
    const necklaceId = toId((user as any).necklace);
    const ringId = toId((user as any).ring);
    const inventoryIds = Array.isArray((user as any).inventory)
      ? (user as any).inventory.map((it: any) => toId(it))
      : (user as any).inventory;
    return buildResponse({
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
          isActive: user.isActive,
          level: user.level,
        },
        stats: {
          hp: effective.hp,
          atk: effective.atk,
          def: effective.def,
        },
        equipment: {
          weapon: weaponId,
          armor: armorId,
          helmet: helmetId,
          boots: bootsId,
          necklace: necklaceId,
          ring: ringId,
        },
        inventory: inventoryIds,
        collection: user.collection,
        desk: desk,
      },
      message: 'Lấy profile thành công',
    });
  }
  @ApiTags('inventory')
  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip')
  @ApiExcludeEndpoint()
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
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị equipment thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip/weapon/:index')
  @ApiOperation({ summary: 'Trang bị weapon từ inventory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí item trong inventory (0-based)' })
  async equipWeapon(@Request() req, @Param('index', ParseIntPipe) index: number) {
    const dto: EquipOneDto = { index };
    const updated = await this.usersService.equipOneFromInventory(req.user.id, 'weapon', dto);
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị weapon thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip/armor/:index')
  @ApiOperation({ summary: 'Trang bị armor từ inventory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí item trong inventory (0-based)' })
  async equipArmor(@Request() req, @Param('index', ParseIntPipe) index: number) {
    const dto: EquipOneDto = { index };
    const updated = await this.usersService.equipOneFromInventory(req.user.id, 'armor', dto);
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị armor thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip/helmet/:index')
  @ApiOperation({ summary: 'Trang bị helmet từ inventory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí item trong inventory (0-based)' })
  async equipHelmet(@Request() req, @Param('index', ParseIntPipe) index: number) {
    const dto: EquipOneDto = { index };
    const updated = await this.usersService.equipOneFromInventory(req.user.id, 'helmet', dto);
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị helmet thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip/boots/:index')
  @ApiOperation({ summary: 'Trang bị boots từ inventory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí item trong inventory (0-based)' })
  async equipBoots(@Request() req, @Param('index', ParseIntPipe) index: number) {
    const dto: EquipOneDto = { index };
    const updated = await this.usersService.equipOneFromInventory(req.user.id, 'boots', dto);
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị boots thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip/necklace/:index')
  @ApiOperation({ summary: 'Trang bị necklace từ inventory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí item trong inventory (0-based)' })
  async equipNecklace(@Request() req, @Param('index', ParseIntPipe) index: number) {
    const dto: EquipOneDto = { index };
    const updated = await this.usersService.equipOneFromInventory(req.user.id, 'necklace', dto);
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị necklace thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/equip/ring/:index')
  @ApiOperation({ summary: 'Trang bị ring từ inventory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí item trong inventory (0-based)' })
  async equipRing(@Request() req, @Param('index', ParseIntPipe) index: number) {
    const dto: EquipOneDto = { index };
    const updated = await this.usersService.equipOneFromInventory(req.user.id, 'ring', dto);
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Trang bị ring thành công' });
  }

  // 6 endpoint cởi trang bị -> đưa vào inventory
  @UseGuards(JwtAuthGuard)
  @Post('inventory/unequip/weapon')
  @ApiOperation({ summary: 'Cởi weapon và đưa vào inventory' })
  @ApiBearerAuth('JWT-auth')
  async unequipWeapon(@Request() req) {
    const updated = await this.usersService.unequipOne(req.user.id, 'weapon');
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Đã cởi weapon vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/unequip/armor')
  @ApiOperation({ summary: 'Cởi armor và đưa vào inventory' })
  @ApiBearerAuth('JWT-auth')
  async unequipArmor(@Request() req) {
    const updated = await this.usersService.unequipOne(req.user.id, 'armor');
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Đã cởi armor vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/unequip/helmet')
  @ApiOperation({ summary: 'Cởi helmet và đưa vào inventory' })
  @ApiBearerAuth('JWT-auth')
  async unequipHelmet(@Request() req) {
    const updated = await this.usersService.unequipOne(req.user.id, 'helmet');
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Đã cởi helmet vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/unequip/boots')
  @ApiOperation({ summary: 'Cởi boots và đưa vào inventory' })
  @ApiBearerAuth('JWT-auth')
  async unequipBoots(@Request() req) {
    const updated = await this.usersService.unequipOne(req.user.id, 'boots');
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Đã cởi boots vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/unequip/necklace')
  @ApiOperation({ summary: 'Cởi necklace và đưa vào inventory' })
  @ApiBearerAuth('JWT-auth')
  async unequipNecklace(@Request() req) {
    const updated = await this.usersService.unequipOne(req.user.id, 'necklace');
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Đã cởi necklace vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/unequip/ring')
  @ApiOperation({ summary: 'Cởi ring và đưa vào inventory' })
  @ApiBearerAuth('JWT-auth')
  async unequipRing(@Request() req) {
    const updated = await this.usersService.unequipOne(req.user.id, 'ring');
    return buildResponse({ data: this.formatEquipResponse(updated as any), message: 'Đã cởi ring vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/:equipmentId')
  @ApiOperation({ summary: 'Thêm equipment vào inventory của user hiện tại' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'equipmentId', description: 'ObjectId của equipment' })
  async addToInventory(@Request() req, @Param('equipmentId') equipmentId: string) {
    const updated = await this.usersService.addEquipmentToInventory(req.user.id, equipmentId);
    return buildResponse({ data: { inventory: (updated as any).inventory }, message: 'Đã thêm vào inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/:equipmentId')
  @ApiOperation({ summary: 'Xóa equipment khỏi inventory của user hiện tại' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'equipmentId', description: 'ObjectId của equipment' })
  async removeFromInventory(@Request() req, @Param('equipmentId') equipmentId: string) {
    const updated = await this.usersService.removeEquipmentFromInventory(req.user.id, equipmentId);
    return buildResponse({ data: { inventory: (updated as any).inventory }, message: 'Đã xóa khỏi inventory' });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/index/:index')
  @ApiOperation({ summary: 'Xóa 1 phần tử trong inventory theo index' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'index', description: 'Vị trí phần tử trong mảng inventory (0-based)' })
  async removeFromInventoryByIndex(@Request() req, @Param('index') index: string) {
    const updated = await this.usersService.removeEquipmentFromInventoryByIndex(req.user.id, Number(index));
    return buildResponse({ data: { inventory: (updated as any).inventory }, message: 'Đã xóa 1 phần tử khỏi inventory theo index' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('collection')
  @ApiOperation({ 
    summary: 'Lấy danh sách card trong collection của user hiện tại',
    description: 'Lấy tất cả card trong bộ sưu tập của người dùng đang đăng nhập'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách collection thành công',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  async getCollection(@Request() req) {
    const collection = await this.usersService.getCollection(req.user.id);
    return buildResponse({ 
      data: { collection }, 
      message: 'Lấy danh sách collection thành công' 
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/:cardId')
  @ApiOperation({ 
    summary: 'Thêm card vào collection của user hiện tại',
    description: 'Thêm một card vào bộ sưu tập của người dùng đang đăng nhập'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ 
    name: 'cardId', 
    description: 'ObjectId của card cần thêm vào collection',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Thêm card vào collection thành công',
  })
  @ApiBadRequestResponse({
    description: 'Card ID không hợp lệ',
  })
  @ApiConflictResponse({
    description: 'Card đã có trong collection',
  })
  @ApiUnauthorizedResponse({
    description: 'Token không hợp lệ hoặc hết hạn',
  })
  async addToCollection(@Request() req, @Param('cardId') cardId: string) {
    const updated = await this.usersService.addToCollection(req.user.id, cardId);
    return buildResponse({ 
      data: { 
        collection: updated.collection 
      }, 
      message: 'Đã thêm card vào collection thành công' 
    });
  }

  // Desk (array) endpoints
  @UseGuards(JwtAuthGuard)
  @Get('desk')
  @ApiOperation({ summary: 'Lấy danh sách deck' })
  @ApiBearerAuth('JWT-auth')
  async getDesk(@Request() req) {
    const userId = req.user?.id ?? req.user?.sub ?? req.user?._id;
    const desk = await this.usersService.getDesk(userId);
    return buildResponse({ data: { desk }, message: 'Lấy desk thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('desk')
  @ApiOperation({ summary: 'Tạo deck mới' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateDeckDto })
  async createDeck(@Request() req, @Body() body: CreateDeckDto) {
    const updated = await this.usersService.createDeck(req.user.id, body.name, body.cardIds ?? [], body.selected ?? false);
    return buildResponse({ data: { desk: updated.desk }, message: 'Tạo deck thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('desk/:deckName')
  @ApiOperation({ summary: 'Xóa deck theo tên' })
  @ApiBearerAuth('JWT-auth')
  async deleteDeck(@Request() req, @Param('deckName') deckName: string) {
    const updated = await this.usersService.deleteDeck(req.user.id, deckName);
    return buildResponse({ data: { desk: updated.desk }, message: 'Xóa deck thành công' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('desk/select/:deckName')
  @ApiOperation({ summary: 'Chọn deck hiện tại' })
  @ApiBearerAuth('JWT-auth')
  async selectDeck(@Request() req, @Param('deckName') deckName: string) {
    const updated = await this.usersService.selectDeck(req.user.id, deckName);
    return buildResponse({ data: { desk: updated.desk }, message: 'Đã chọn deck' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('desk/rename/:deckName')
  @ApiOperation({ summary: 'Đổi tên deck' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: RenameDeckDto })
  async renameDeck(@Request() req, @Param('deckName') deckName: string, @Body() body: RenameDeckDto) {
    const updated = await this.usersService.renameDeck(req.user.id, deckName, body.newName);
    return buildResponse({ data: { desk: updated.desk }, message: 'Đổi tên deck thành công' });
  }

  // Desk by Id variants
  @UseGuards(JwtAuthGuard)
  @Post('desk/:deskId/cards/:cardId')
  @ApiOperation({ summary: 'Thêm card vào deck theo deskId' })
  @ApiBearerAuth('JWT-auth')
  async addCardToDeckById(@Request() req, @Param('deskId') deskId: string, @Param('cardId') cardId: string) {
    const updated = await this.usersService.addCardToDeckById(req.user.id, deskId, cardId);
    return buildResponse({ data: { desk: updated.desk }, message: 'Đã thêm card vào deck' });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('desk/:deskId/cards/:cardId')
  @ApiOperation({ summary: 'Xóa card khỏi deck theo deskId' })
  @ApiBearerAuth('JWT-auth')
  async removeCardFromDeckById(@Request() req, @Param('deskId') deskId: string, @Param('cardId') cardId: string) {
    const updated = await this.usersService.removeCardFromDeckById(req.user.id, deskId, cardId);
    return buildResponse({ data: { desk: updated.desk }, message: 'Đã xóa card khỏi deck' });
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
