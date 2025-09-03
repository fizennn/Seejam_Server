import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equipment, EquipmentDocument } from './schemas/equipment.schema';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectModel(Equipment.name)
    private readonly equipmentModel: Model<EquipmentDocument>,
  ) {}

  async create(payload: CreateEquipmentDto): Promise<Equipment> {
    const created = await this.equipmentModel.create(payload);
    return created.toObject();
  }

  async findAll(): Promise<Equipment[]> {
    return this.equipmentModel.find().lean();
  }

  async findOne(id: string): Promise<Equipment> {
    const found = await this.equipmentModel.findById(id).lean();
    if (!found) throw new NotFoundException('Equipment not found');
    return found;
  }

  async update(id: string, payload: UpdateEquipmentDto): Promise<Equipment> {
    const updated = await this.equipmentModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) throw new NotFoundException('Equipment not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.equipmentModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Equipment not found');
  }
}


