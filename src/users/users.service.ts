import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EquipInventoryDto } from './dto/equip-inventory.dto';
import { Equipment, EquipmentDocument } from '../equipment/schemas/equipment.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Equipment.name) private equipmentModel: Model<EquipmentDocument>,
  ) {}

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

    return updated;
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

    return updated;
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

    return updated;
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

        // Lưu index thay vì ObjectId
        updateData[type] = index;
      }
    }

    // Nếu không có gì để cập nhật
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu hợp lệ để trang bị');
    }

    // Cập nhật user với index của equipment
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Không thể cập nhật user');
    }

    return updatedUser;
  }

  async getEquippedItems(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }

    const equippedItems: any = {};
    const equipmentTypes = ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'];

    for (const type of equipmentTypes) {
      const index = user[type];
      if (index !== null && index !== undefined && user.inventory && user.inventory[index]) {
        equippedItems[type] = {
          index: index,
          equipmentId: user.inventory[index]
        };
      } else {
        equippedItems[type] = null;
      }
    }

    return equippedItems;
  }
}
