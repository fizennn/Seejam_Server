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

  @Prop({ type: Number, default: 0, min: 0 })
  atk: number;

  @Prop({ type: Number, default: 0, min: 0 })
  def: number;

  @Prop({ type: Number, default: 0, min: 0 })
  hp: number;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);


