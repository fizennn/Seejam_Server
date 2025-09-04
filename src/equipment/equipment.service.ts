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

  async syncEquipment(): Promise<{ totalChecked: number; updatedCount: number }> {
    const equipments = await this.equipmentModel.find().lean();
    let updatedCount = 0;

    for (const eq of equipments) {
      const update: any = {};

      if (!eq.rarity) {
        update.rarity = 'common';
      }

      if (!eq.levelReq || typeof eq.levelReq !== 'number' || eq.levelReq < 1) {
        update.levelReq = 1;
      }

      const defaultPerLevel = { atk: 0, def: 0, hp: 0 };
      const defaultUpgrade = { level: 1, maxLevel: 10, perLevel: defaultPerLevel };

      if (!eq.upgradePath) {
        update.upgradePath = defaultUpgrade;
      } else {
        const up = eq.upgradePath as any;
        const fixed: any = { ...up };
        if (!up.level || typeof up.level !== 'number' || up.level < 1) fixed.level = 1;
        if (!up.maxLevel || typeof up.maxLevel !== 'number' || up.maxLevel < 1) fixed.maxLevel = 10;
        const pl = up.perLevel || {};
        fixed.perLevel = {
          atk: typeof pl.atk === 'number' && pl.atk >= 0 ? pl.atk : 0,
          def: typeof pl.def === 'number' && pl.def >= 0 ? pl.def : 0,
          hp: typeof pl.hp === 'number' && pl.hp >= 0 ? pl.hp : 0,
        };
        // Only set if changed
        const changed =
          fixed.level !== up.level ||
          fixed.maxLevel !== up.maxLevel ||
          fixed.perLevel.atk !== (pl.atk ?? 0) ||
          fixed.perLevel.def !== (pl.def ?? 0) ||
          fixed.perLevel.hp !== (pl.hp ?? 0);
        if (changed) update.upgradePath = fixed;
      }

      if (Object.keys(update).length > 0) {
        await this.equipmentModel.updateOne({ _id: eq._id }, { $set: update });
        updatedCount += 1;
      }
    }

    return { totalChecked: equipments.length, updatedCount };
  }
}


