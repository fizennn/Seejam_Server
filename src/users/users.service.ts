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
    // Không ghi đè stats gốc vào DB; chỉ trả về user sau khi cập nhật trang bị
    return this.findByIdPopulated(finalUser._id as any);
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
    // Không ghi đè stats gốc vào DB; chỉ trả về user sau khi cập nhật trang bị
    return this.findByIdPopulated(finalUser._id as any);
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
    // Không ghi đè stats gốc vào DB; chỉ trả về user sau khi cập nhật trang bị
    return this.findByIdPopulated(finalUser._id as any);
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
    const existingCardIndex = user.collection?.findIndex(
      (item: any) => item.cardId?.toString() === cardId
    );

    let updated;
    if (existingCardIndex !== undefined && existingCardIndex >= 0) {
      // Card đã có, tăng quantity lên 1
      const updateQuery = {};
      updateQuery[`collection.${existingCardIndex}.quantity`] = 1; // Tăng +1
      
      updated = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $inc: updateQuery },
          { new: true }
        )
        .select('-password')
        .exec();
    } else {
      // Card chưa có, thêm mới với quantity = 1
      updated = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $push: { collection: { cardId: cardId as any, quantity: 1 } } },
          { new: true }
        )
        .select('-password')
        .exec();
    }

    if (!updated) {
      throw new NotFoundException('Không thể cập nhật collection');
    }

    return updated;
  }

  async getCollection(userId: string): Promise<{ cardId: string; quantity: number }[]> {
    // Kiểm tra user có tồn tại không
    const user = await this.userModel.findById(userId).select('collection').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Trả về danh sách collection với cardId và quantity
    const collection = (user.collection || []).map((item: any) => ({
      cardId: item.cardId?.toString() || item.toString(),
      quantity: item.quantity ?? 0
    }));
    return collection;
  }

  // Desk (array) management methods
  async getDesk(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('desk').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return Array.isArray((user as any).desk) ? (user as any).desk : [];
  }

  async createDeck(userId: string, name: string, cardIds: string[] = []): Promise<User> {
    if (!name || !name.trim()) {
      throw new BadRequestException('Tên deck không hợp lệ');
    }
    
    // Kiểm tra giới hạn số lượng thẻ trong deck
    if (cardIds.length > 40) {
      throw new BadRequestException('Deck không được quá 40 thẻ');
    }
    
    for (const cardId of cardIds) {
      if (!Types.ObjectId.isValid(cardId)) {
        throw new BadRequestException(`Card ID ${cardId} không hợp lệ`);
      }
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Tên không trùng
    const desk = (user as any).desk || [];
    if (desk.some((d: any) => d.name === name)) {
      throw new ConflictException('Tên deck đã tồn tại');
    }

    // Card phải có trong collection và thêm với quantity = 1
    const userCollection = user.collection || [];
    const cardsWithQuantity: { cardId: string; quantity: number }[] = [];
    const collectionUpdates: any = {};
    
    for (const cardId of cardIds) {
      const collectionItem = userCollection.find((item: any) => 
        item.cardId?.toString() === cardId || item.toString() === cardId
      );
      if (!collectionItem) {
        throw new BadRequestException(`Card ${cardId} không có trong collection`);
      }
      
      // Kiểm tra quantity trong collection có đủ không
      const collectionQuantity = collectionItem.quantity ?? 0;
      if (collectionQuantity <= 0) {
        throw new BadRequestException(`Không đủ card ${cardId} trong collection`);
      }
      
      // Thêm card với quantity = 1 (mỗi card trong deck có quantity = 1)
      cardsWithQuantity.push({ cardId, quantity: 1 });
      
      // Chuẩn bị update collection (trừ 1 cho mỗi card)
      const collectionIndex = userCollection.findIndex((item: any) => 
        item.cardId?.toString() === cardId || item.toString() === cardId
      );
      collectionUpdates[`collection.${collectionIndex}.quantity`] = -1;
    }

    const updateOps: any = {};
    updateOps.$push = { desk: { name, cards: cardsWithQuantity } } as any;
    updateOps.$inc = collectionUpdates;

    const updated = await this.userModel
      .findByIdAndUpdate(userId, updateOps, { new: true })
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không thể tạo deck');
    }
    return updated;
  }

  async deleteDeck(userId: string, deckName: string): Promise<User> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { desk: { name: deckName } } as any },
        { new: true }
      )
      .select('-password')
      .exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy user hoặc deck');
    }
    return updated;
  }

  async renameDeck(userId: string, oldName: string, newName: string): Promise<User> {
    if (!newName || !newName.trim()) {
      throw new BadRequestException('Tên deck mới không hợp lệ');
    }
    const user = await this.userModel.findById(userId).select('desk').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    const desk = (user as any).desk || [];
    if (!desk.some((d: any) => d.name === oldName)) {
      throw new NotFoundException('Không tìm thấy deck cần đổi tên');
    }
    if (desk.some((d: any) => d.name === newName)) {
      throw new ConflictException('Tên deck mới đã tồn tại');
    }

    const updated = await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        { $set: { 'desk.$[d].name': newName } as any },
        { new: true, arrayFilters: [{ 'd.name': oldName }] as any }
      )
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không thể đổi tên deck');
    }
    return updated;
  }

  async selectDeck(userId: string, deckName: string): Promise<User> {
    const user = await this.userModel.findById(userId).select('desk').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    const desk = (user as any).desk || [];
    if (!desk.some((d: any) => d.name === deckName)) {
      throw new NotFoundException('Không tìm thấy deck');
    }

    // Trả về user hiện tại vì không còn logic chọn deck
    return user;
  }

  async addCardToDeckByName(userId: string, deckName: string, cardId: string): Promise<User> {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    
    // Kiểm tra card có trong collection không
    const collectionItem = user.collection?.find((item: any) => 
      item.cardId?.toString() === cardId || item.toString() === cardId
    );
    if (!collectionItem) {
      throw new BadRequestException('Card không có trong collection');
    }

    // Kiểm tra card đã có trong deck chưa
    const existing = await this.userModel.findOne({ 
      _id: userId, 
      desk: { 
        $elemMatch: { 
          name: deckName, 
          'cards.cardId': cardId as any 
        } 
      } 
    }).exec();

    // Kiểm tra quantity trong collection có đủ không
    const collectionQuantity = collectionItem.quantity ?? 0;
    if (collectionQuantity <= 0) {
      throw new BadRequestException('Không đủ card trong collection');
    }

    let updated;
    if (existing) {
      // Card đã có, tăng quantity lên 1 và trừ 1 trong collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk.name': deckName, 'desk.cards.cardId': cardId as any },
          { 
            $inc: { 
              'desk.$[deck].cards.$[card].quantity': 1,
              'collection.$[coll].quantity': -1
            } as any 
          },
          { 
            new: true,
            arrayFilters: [
              { 'deck.name': deckName },
              { 'card.cardId': cardId as any },
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    } else {
      // Card chưa có, thêm mới với quantity = 1 và trừ 1 trong collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk.name': deckName },
          { 
            $push: { 'desk.$.cards': { cardId: cardId as any, quantity: 1 } } as any,
            $inc: { 'collection.$[coll].quantity': -1 } as any
          },
          { 
            new: true,
            arrayFilters: [
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    }
    
    if (!updated) {
      throw new NotFoundException('Không thể cập nhật deck');
    }
    return updated;
  }

  async removeCardFromDeckByName(userId: string, deckName: string, cardId: string): Promise<User> {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }
    
    // Tìm card trong deck
    const user = await this.userModel.findById(userId).select('desk').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    
    const deck = (user as any).desk?.find((d: any) => d.name === deckName);
    if (!deck) {
      throw new NotFoundException('Không tìm thấy deck');
    }
    
    const card = deck.cards?.find((c: any) => c.cardId?.toString() === cardId);
    if (!card) {
      throw new NotFoundException('Không tìm thấy card trong deck');
    }
    
    let updated;
    if (card.quantity > 1) {
      // Giảm quantity xuống 1 và cộng 1 vào collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk.name': deckName, 'desk.cards.cardId': cardId as any },
          { 
            $inc: { 
              'desk.$[deck].cards.$[card].quantity': -1,
              'collection.$[coll].quantity': 1
            } as any 
          },
          { 
            new: true,
            arrayFilters: [
              { 'deck.name': deckName },
              { 'card.cardId': cardId as any },
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    } else {
      // Xóa card hoàn toàn và cộng 1 vào collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk.name': deckName },
          { 
            $pull: { 'desk.$.cards': { cardId: cardId as any } } as any,
            $inc: { 'collection.$[coll].quantity': 1 } as any
          },
          { 
            new: true,
            arrayFilters: [
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    }
    
    if (!updated) {
      throw new NotFoundException('Không thể cập nhật deck');
    }
    return updated;
  }

  async addCardToDeckById(userId: string, deskId: string, cardId: string): Promise<User> {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }
    if (!Types.ObjectId.isValid(deskId)) {
      throw new BadRequestException('deskId không hợp lệ');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Tìm deck và kiểm tra số lượng thẻ hiện tại
    const deck = (user as any).desk?.find((d: any) => d._id?.toString() === deskId);
    if (!deck) {
      throw new NotFoundException('Không tìm thấy deck');
    }
    
    // Kiểm tra giới hạn 40 thẻ trong deck
    const currentCardCount = deck.cards?.reduce((total: number, card: any) => total + (card.quantity || 1), 0) || 0;
    if (currentCardCount >= 40) {
      throw new BadRequestException('Deck đã đạt giới hạn tối đa 40 thẻ');
    }

    // Kiểm tra card có trong collection không
    const collectionItem = user.collection?.find((item: any) => 
      item.cardId?.toString() === cardId || item.toString() === cardId
    );
    if (!collectionItem) {
      throw new BadRequestException('Card không có trong collection');
    }

    // Check duplicate
    const duplicate = await this.userModel
      .findOne({ 
        _id: userId, 
        desk: { 
          $elemMatch: { 
            _id: deskId as any, 
            'cards.cardId': cardId as any 
          } 
        } 
      })
      .select('_id')
      .exec();

    // Kiểm tra quantity trong collection có đủ không
    const collectionQuantity = collectionItem.quantity ?? 0;
    if (collectionQuantity <= 0) {
      throw new BadRequestException('Không đủ card trong collection');
    }

    let updated;
    if (duplicate) {
      // Card đã có, tăng quantity lên 1 và trừ 1 trong collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk._id': deskId as any, 'desk.cards.cardId': cardId as any },
          { 
            $inc: { 
              'desk.$[deck].cards.$[card].quantity': 1,
              'collection.$[coll].quantity': -1
            } as any 
          },
          { 
            new: true,
            arrayFilters: [
              { 'deck._id': deskId as any },
              { 'card.cardId': cardId as any },
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    } else {
      // Card chưa có, thêm mới với quantity = 1 và trừ 1 trong collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk._id': deskId as any },
          { 
            $push: { 'desk.$.cards': { cardId: cardId as any, quantity: 1 } } as any,
            $inc: { 'collection.$[coll].quantity': -1 } as any
          },
          { 
            new: true,
            arrayFilters: [
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    }
    
    if (!updated) {
      throw new NotFoundException('Không thể cập nhật deck');
    }
    return updated;
  }

  async removeCardFromDeckById(userId: string, deskId: string, cardId: string): Promise<User> {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new BadRequestException('Card ID không hợp lệ');
    }
    if (!Types.ObjectId.isValid(deskId)) {
      throw new BadRequestException('deskId không hợp lệ');
    }

    // Tìm card trong deck
    const user = await this.userModel.findById(userId).select('desk').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    
    const deck = (user as any).desk?.find((d: any) => d._id?.toString() === deskId);
    if (!deck) {
      throw new NotFoundException('Không tìm thấy deck');
    }
    
    const card = deck.cards?.find((c: any) => c.cardId?.toString() === cardId);
    if (!card) {
      throw new NotFoundException('Không tìm thấy card trong deck');
    }
    
    let updated;
    if (card.quantity > 1) {
      // Giảm quantity xuống 1 và cộng 1 vào collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk._id': deskId as any, 'desk.cards.cardId': cardId as any },
          { 
            $inc: { 
              'desk.$[deck].cards.$[card].quantity': -1,
              'collection.$[coll].quantity': 1
            } as any 
          },
          { 
            new: true,
            arrayFilters: [
              { 'deck._id': deskId as any },
              { 'card.cardId': cardId as any },
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    } else {
      // Xóa card hoàn toàn và cộng 1 vào collection
      updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, 'desk._id': deskId as any },
          { 
            $pull: { 'desk.$.cards': { cardId: cardId as any } } as any,
            $inc: { 'collection.$[coll].quantity': 1 } as any
          },
          { 
            new: true,
            arrayFilters: [
              { 'coll.cardId': cardId as any }
            ]
          }
        )
        .select('-password')
        .exec();
    }
    
    if (!updated) {
      throw new NotFoundException('Không thể cập nhật deck');
    }
    return updated;
  }
}
