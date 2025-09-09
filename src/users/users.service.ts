import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EquipInventoryDto, EquipOneDto } from './dto/equip-inventory.dto';
import { Equipment, EquipmentDocument } from '../equipment/schemas/equipment.schema';
import { Card, CardDocument } from '../card/schemas/card.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Equipment.name) private equipmentModel: Model<EquipmentDocument>,
    @InjectModel(Card.name) private cardModel: Model<CardDocument>,
  ) {}

  private populateSpec = [] as any[];

  private async findByIdPopulated(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return user;
  }

  private async calculateEffectiveStats(user: User): Promise<{ hp: number; atk: number; def: number }> {
    const baseHp = user.hp ?? 0;
    const baseAtk = user.atk ?? 0;
    const baseDef = user.def ?? 0;

    const equipmentIds: Types.ObjectId[] = [];
    const possibleSlots: Array<'weapon' | 'armor' | 'helmet' | 'boots' | 'necklace' | 'ring'> = [
      'weapon',
      'armor',
      'helmet',
      'boots',
      'necklace',
      'ring',
    ];

    for (const slot of possibleSlots) {
      const id = (user as any)[slot] as Types.ObjectId | null;
      if (id) {
        equipmentIds.push(id);
      }
    }

    if (equipmentIds.length === 0) {
      return { hp: baseHp, atk: baseAtk, def: baseDef };
    }

    const equipments = await this.equipmentModel
      .find({ _id: { $in: equipmentIds } })
      .select('hp atk def')
      .exec();

    const bonus = equipments.reduce(
      (acc, eq) => {
        acc.hp += eq.hp ?? 0;
        acc.atk += eq.atk ?? 0;
        acc.def += eq.def ?? 0;
        return acc;
      },
      { hp: 0, atk: 0, def: 0 },
    );

    return {
      hp: baseHp + bonus.hp,
      atk: baseAtk + bonus.atk,
      def: baseDef + bonus.def,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return user;
  }

  async findOneWithCalculatedStats(id: string): Promise<{ user: User; effective: { hp: number; atk: number; def: number } }> {
    const user = await this.findByIdPopulated(id);
    const effective = await this.calculateEffectiveStats(user);
    return { user, effective };
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Nếu có password mới, hash nó
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy user');
    }
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return user;
  }

  async addEquipmentToInventory(userId: string, equipmentId: string): Promise<User> {
    // Validate equipmentId hợp lệ và tồn tại
    if (!Types.ObjectId.isValid(equipmentId)) {
      throw new BadRequestException('equipmentId không hợp lệ');
    }
    const equipmentExists = await this.equipmentModel.findById(equipmentId).select('_id').exec();
    if (!equipmentExists) {
      throw new NotFoundException('Không tìm thấy equipment');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { inventory: equipmentId as any } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return this.findByIdPopulated(userId);
  }

  async removeEquipmentFromInventory(userId: string, equipmentId: string): Promise<User> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { inventory: equipmentId as any } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return this.findByIdPopulated(userId);
  }

  async removeEquipmentFromInventoryByIndex(userId: string, index: number): Promise<User> {
    const user = await this.userModel.findById(userId).select('inventory').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    if (index < 0 || index >= (user.inventory?.length ?? 0)) {
      throw new NotFoundException('Vị trí cần xoá không hợp lệ');
    }

    await this.userModel
      .updateOne({ _id: userId }, { $unset: { [`inventory.${index}`]: 1 } as any })
      .exec();

    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $pull: { inventory: null as any } }, { new: true })
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return this.findByIdPopulated(userId);
  }

  async equipFromInventory(userId: string, equipDto: EquipInventoryDto): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Kiểm tra inventory có tồn tại không
    if (!user.inventory || user.inventory.length === 0) {
      throw new BadRequestException('Inventory trống, không thể trang bị');
    }

    const updateData: any = {};
    const indicesToRemove: number[] = [];
    const equipmentTypes = ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'];

    // Xử lý từng loại equipment
    for (const type of equipmentTypes) {
      const index = equipDto[type];
      if (index !== undefined && index !== null) {
        // Kiểm tra index có hợp lệ không
        if (index < 0 || index >= user.inventory.length) {
          throw new BadRequestException(`Vị trí ${index} không hợp lệ cho ${type}`);
        }

        const equipmentId = user.inventory[index];
        if (!equipmentId) {
          throw new BadRequestException(`Không có item nào ở vị trí ${index}`);
        }

        // Kiểm tra xem item có phải loại equipment đúng không
        const equipment = await this.equipmentModel.findById(equipmentId).exec();
        if (!equipment) {
          throw new BadRequestException(`Không tìm thấy equipment ở vị trí ${index}`);
        }

        // Kiểm tra type có đúng không
        if (equipment.type !== type) {
          throw new BadRequestException(`Item ở vị trí ${index} có type '${equipment.type}' không thể trang bị vào slot '${type}'`);
        }

        // Kiểm tra level yêu cầu
        const userLevel = (user as any).level ?? 1;
        const requiredLevel = equipment.levelReq ?? 1;
        if (userLevel < requiredLevel) {
          throw new BadRequestException(`Yêu cầu level ${requiredLevel} để trang bị '${equipment.name}'`);
        }

        // Lưu trực tiếp _id của equipment vào slot
        updateData[type] = equipmentId as any;
        indicesToRemove.push(index);
      }
    }

    // Nếu không có gì để cập nhật
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu hợp lệ để trang bị');
    }

    // Cập nhật user với _id của equipment
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Không thể cập nhật user');
    }

    // Xoá các item khỏi inventory theo index đã trang bị
    if (indicesToRemove.length > 0) {
      // Sắp xếp giảm dần để tránh lệch khi unset theo index
      const uniqueSorted = Array.from(new Set(indicesToRemove)).sort((a, b) => b - a);
      const unsetSpec: Record<string, 1> = {};
      for (const idx of uniqueSorted) {
        unsetSpec[`inventory.${idx}`] = 1 as const;
      }

      await this.userModel.updateOne({ _id: userId }, { $unset: unsetSpec as any }).exec();
      await this.userModel.updateOne({ _id: userId }, { $pull: { inventory: null as any } as any }).exec();
    }

    // Trả về user sau khi inventory đã được làm sạch
    const finalUser = await this.userModel.findById(userId).select('-password').exec();
    if (!finalUser) {
      throw new NotFoundException('Không thể tải lại user sau khi cập nhật');
    }
    // Cập nhật cache chỉ số (hp/atk/def) dựa trên trang bị hiện tại
    const totals = await this.calculateEffectiveStats(finalUser);
    const cached = await this.userModel
      .findByIdAndUpdate(userId, { hp: totals.hp, atk: totals.atk, def: totals.def }, { new: true })
      .select('-password')
      .exec();
    const userToReturn = (cached ?? finalUser) as any;
    return this.findByIdPopulated(userToReturn._id as any);
  }

  async equipOneFromInventory(userId: string, type: 'weapon' | 'armor' | 'helmet' | 'boots' | 'necklace' | 'ring', dto: EquipOneDto): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    if (!user.inventory || user.inventory.length === 0) {
      throw new BadRequestException('Inventory trống, không thể trang bị');
    }

    const index = dto.index;
    if (index < 0 || index >= user.inventory.length) {
      throw new BadRequestException(`Vị trí ${index} không hợp lệ cho ${type}`);
    }

    const equipmentId = user.inventory[index];
    if (!equipmentId) {
      throw new BadRequestException(`Không có item nào ở vị trí ${index}`);
    }

    // Validate ObjectId của item trong inventory
    if (!Types.ObjectId.isValid(equipmentId as any)) {
      throw new BadRequestException(`Item tại vị trí ${index} không hợp lệ`);
    }

    const equipment = await this.equipmentModel.findById(equipmentId).exec();
    if (!equipment) {
      throw new BadRequestException(`Không tìm thấy equipment ở vị trí ${index}`);
    }

    if (equipment.type !== type) {
      throw new BadRequestException(`Item ở vị trí ${index} có type '${equipment.type}' không thể trang bị vào slot '${type}'`);
    }

    // Kiểm tra level yêu cầu
    const userLevel = (user as any).level ?? 1;
    const requiredLevel = equipment.levelReq ?? 1;
    if (userLevel < requiredLevel) {
      throw new BadRequestException(`Yêu cầu level ${requiredLevel} để trang bị '${equipment.name}'`);
    }

    // Nếu đang có item được trang bị ở slot này, thêm nó trở lại inventory trước khi thay thế
    const currentlyEquipped = (user as any)[type] as Types.ObjectId | null;
    if (currentlyEquipped) {
      await this.userModel.updateOne({ _id: userId }, { $push: { inventory: currentlyEquipped as any } as any }).exec();
    }

    await this.userModel.updateOne({ _id: userId }, { $set: { [type]: equipmentId } as any }).exec();

    // Xoá theo index (giảm dần không cần vì chỉ 1 index)
    await this.userModel.updateOne({ _id: userId }, { $unset: { [`inventory.${index}`]: 1 } as any }).exec();
    await this.userModel.updateOne({ _id: userId }, { $pull: { inventory: null as any } as any }).exec();

    const finalUser = await this.userModel.findById(userId).select('-password').exec();
    if (!finalUser) {
      throw new NotFoundException('Không thể tải lại user sau khi cập nhật');
    }
    // Cập nhật cache chỉ số sau khi trang bị
    const totals = await this.calculateEffectiveStats(finalUser);
    const cached = await this.userModel
      .findByIdAndUpdate(userId, { hp: totals.hp, atk: totals.atk, def: totals.def }, { new: true })
      .select('-password')
      .exec();
    const userToReturn = (cached ?? finalUser) as any;
    return this.findByIdPopulated(userToReturn._id as any);
  }

  async getEquippedItems(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    const equippedItems: any = {};
    const equipmentTypes = ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'];

    for (const type of equipmentTypes) {
      const equipmentId = user[type as keyof typeof user] as unknown as Types.ObjectId | null;
      equippedItems[type] = equipmentId ?? null;
    }

    return equippedItems;
  }

  async unequipOne(
    userId: string,
    type: 'weapon' | 'armor' | 'helmet' | 'boots' | 'necklace' | 'ring',
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    const currentlyEquipped = (user as any)[type] as Types.ObjectId | null;
    if (!currentlyEquipped) {
      throw new BadRequestException(`Không có item đang trang bị ở slot '${type}'`);
    }

    // Đưa item đang trang bị vào inventory và bỏ trang bị
    await this.userModel
      .updateOne(
        { _id: userId },
        { $push: { inventory: currentlyEquipped as any }, $set: { [type]: null } as any },
      )
      .exec();

    const finalUser = await this.userModel.findById(userId).select('-password').exec();
    if (!finalUser) {
      throw new NotFoundException('Không thể tải lại user sau khi cập nhật');
    }
    // Cập nhật cache chỉ số sau khi cởi trang bị
    const totals = await this.calculateEffectiveStats(finalUser);
    const cached = await this.userModel
      .findByIdAndUpdate(userId, { hp: totals.hp, atk: totals.atk, def: totals.def }, { new: true })
      .select('-password')
      .exec();
    const userToReturn = (cached ?? finalUser) as any;
    return this.findByIdPopulated(userToReturn._id as any);
  }

  async addToCollection(userId: string, cardId: string): Promise<User> {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }

    // Kiểm tra user có tồn tại không
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Kiểm tra card đã có trong collection chưa
    if (user.collection && user.collection.includes(cardId as any)) {
      throw new ConflictException('Card đã có trong collection');
    }

    // Thêm card vào collection
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { collection: cardId as any } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không thể cập nhật collection');
    }

    return updated;
  }

  async getCollection(userId: string): Promise<Card[]> {
    // Kiểm tra user có tồn tại không
    const user = await this.userModel.findById(userId).select('collection').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Nếu collection trống, trả về mảng rỗng
    if (!user.collection || user.collection.length === 0) {
      return [];
    }

    // Lấy thông tin chi tiết của các card trong collection
    const cards = await this.cardModel
      .find({ _id: { $in: user.collection } })
      .exec();

    return cards;
  }

  // Desk management methods
  async addCardToDeck(userId: string, deckType: 'activeCards' | 'deck1' | 'deck2' | 'deck3', cardId: string): Promise<User> {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Kiểm tra card có trong collection không
    if (!user.collection || !user.collection.includes(cardId as any)) {
      throw new BadRequestException('Card không có trong collection');
    }

    // Kiểm tra card đã có trong deck chưa
    const currentDeck = (user.desk as any)?.[deckType] || [];
    if (currentDeck.includes(cardId as any)) {
      throw new ConflictException('Card đã có trong deck này');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { [`desk.${deckType}`]: cardId as any } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không thể cập nhật deck');
    }

    return updated;
  }

  async removeCardFromDeck(userId: string, deckType: 'activeCards' | 'deck1' | 'deck2' | 'deck3', cardId: string): Promise<User> {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { [`desk.${deckType}`]: cardId as any } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy user hoặc không thể cập nhật deck');
    }

    return updated;
  }

  async saveDeck(userId: string, deckName: string, cardIds: string[]): Promise<User> {
    // Validate cardIds
    for (const cardId of cardIds) {
      if (!Types.ObjectId.isValid(cardId)) {
        throw new BadRequestException(`Card ID ${cardId} không hợp lệ`);
      }
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Kiểm tra tên deck đã tồn tại chưa
    const existingDecks = (user.desk as any)?.savedDecks || [];
    if (existingDecks.some((deck: any) => deck.name === deckName)) {
      throw new ConflictException('Tên deck đã tồn tại');
    }

    // Kiểm tra tất cả card có trong collection không
    const userCollection = user.collection || [];
    for (const cardId of cardIds) {
      if (!userCollection.includes(cardId as any)) {
        throw new BadRequestException(`Card ${cardId} không có trong collection`);
      }
    }

    const newDeck = {
      name: deckName,
      cards: cardIds as any[],
      createdAt: new Date()
    };

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { 'desk.savedDecks': newDeck } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không thể lưu deck');
    }

    return updated;
  }

  async loadDeck(userId: string, deckName: string, targetDeck: 'deck1' | 'deck2' | 'deck3'): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    const savedDecks = (user.desk as any)?.savedDecks || [];
    const deck = savedDecks.find((d: any) => d.name === deckName);
    
    if (!deck) {
      throw new NotFoundException('Không tìm thấy deck với tên này');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { [`desk.${targetDeck}`]: deck.cards } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không thể load deck');
    }

    return updated;
  }

  async deleteSavedDeck(userId: string, deckName: string): Promise<User> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { 'desk.savedDecks': { name: deckName } } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy user hoặc deck');
    }

    return updated;
  }

  async getDesk(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('desk').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return user.desk || {
      activeCards: [],
      deck1: [],
      deck2: [],
      deck3: [],
      savedDecks: []
    };
  }
}
