import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EquipmentDocument = Equipment & Document;

export type EquipmentType =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'boots'
  | 'necklace'
  | 'ring';

@Schema({ timestamps: true })
export class Equipment {
  _id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'] })
  type: EquipmentType;

  @Prop({ required: false, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], default: 'common' })
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  @Prop({ type: Number, default: 1, min: 1 })
  levelReq?: number;

  @Prop({ type: Number, default: 0, min: 0 })
  atk: number;

  @Prop({ type: Number, default: 0, min: 0 })
  def: number;

  @Prop({ type: Number, default: 0, min: 0 })
  hp: number;

  @Prop({
    type: {
      level: { type: Number, default: 1, min: 1 },
      maxLevel: { type: Number, default: 1, min: 1 },
      perLevel: {
        atk: { type: Number, default: 0, min: 0 },
        def: { type: Number, default: 0, min: 0 },
        hp: { type: Number, default: 0, min: 0 },
      },
    },
    required: false,
    default: undefined,
  })
  upgradePath?: {
    level: number;
    maxLevel: number;
    perLevel: { atk: number; def: number; hp: number };
  };
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);


