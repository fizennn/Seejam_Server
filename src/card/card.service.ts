import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card, CardDocument } from './schemas/card.schema';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
  ) {}

  async create(payload: CreateCardDto): Promise<Card> {
    const created = await this.cardModel.create(payload);
    return created.toObject();
  }

  async findAll(): Promise<Card[]> {
    return this.cardModel.find().lean();
  }

  async findOne(id: string): Promise<Card> {
    const found = await this.cardModel.findById(id).lean();
    if (!found) throw new NotFoundException('Card không tồn tại');
    return found;
  }

  async update(id: string, payload: UpdateCardDto): Promise<Card> {
    const updated = await this.cardModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) throw new NotFoundException('Card không tồn tại');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.cardModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Card không tồn tại');
  }

  async syncCards(): Promise<{ totalChecked: number; updatedCount: number }> {
    const cards = await this.cardModel.find().lean();
    let updatedCount = 0;

    for (const card of cards) {
      const updateQuery: any = {};
      const unsetQuery: any = {};

      if (!card.rarity) {
        updateQuery.rarity = 'common';
      }

      // Normalize energy: ensure exists and >= 1
      if (typeof (card as any).energy === 'undefined') {
        updateQuery.energy = 1;
      } else if (typeof (card as any).energy === 'number' && (card as any).energy < 1) {
        updateQuery.energy = 1;
      }

      if (typeof (card as any).power !== 'undefined') {
        unsetQuery.power = '';
      }

      const hasSet = Object.keys(updateQuery).length > 0;
      const hasUnset = Object.keys(unsetQuery).length > 0;

      if (hasSet || hasUnset) {
        await this.cardModel.updateOne(
          { _id: card._id },
          {
            ...(hasSet ? { $set: updateQuery } : {}),
            ...(hasUnset ? { $unset: unsetQuery } : {}),
          },
        );
        updatedCount += 1;
      }
    }

    return { totalChecked: cards.length, updatedCount };
  }
}


