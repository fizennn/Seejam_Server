import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Npc, NpcDocument } from './schemas/npc.schema';
import { CreateNpcDto } from './dto/create-npc.dto';
import { UpdateNpcDto } from './dto/update-npc.dto';

@Injectable()
export class NpcService {
  constructor(@InjectModel(Npc.name) private readonly npcModel: Model<NpcDocument>) {}

  async create(payload: CreateNpcDto): Promise<Npc> {
    const created = await this.npcModel.create(payload);
    return created;
  }

  async findAll(): Promise<Npc[]> {
    return this.npcModel
      .find()
      .populate('weapon')
      .populate('armor')
      .populate('helmet')
      .populate('boots')
      .populate('necklace')
      .populate('ring')
      .populate('decks.cards.cardId')
      .lean(false)
      .exec();
  }

  async findOne(id: string): Promise<Npc> {
    const npc = await this.npcModel
      .findById(new Types.ObjectId(id))
      .populate('weapon')
      .populate('armor')
      .populate('helmet')
      .populate('boots')
      .populate('necklace')
      .populate('ring')
      .populate('decks.cards.cardId')
      .exec();
    if (!npc) throw new NotFoundException('NPC not found');
    return npc;
  }

  async update(id: string, payload: UpdateNpcDto): Promise<Npc> {
    const npc = await this.npcModel
      .findByIdAndUpdate(new Types.ObjectId(id), payload, { new: true })
      .exec();
    if (!npc) throw new NotFoundException('NPC not found');
    return npc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.npcModel.findByIdAndDelete(new Types.ObjectId(id)).exec();
    if (!res) throw new NotFoundException('NPC not found');
  }
}


