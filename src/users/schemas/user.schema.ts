import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Equipment } from '../../equipment/schemas/equipment.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 100 })
  hp: number;

  @Prop({ type: Number, default: 30 })
  atk: number;

  @Prop({ type: Number, default: 50 })
  def: number;

  @Prop({ type: Number, default: 1 })
  level: number;

  @Prop({ type: Types.ObjectId, ref: Equipment.name, default: null })
  weapon: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Equipment.name, default: null })
  armor: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Equipment.name, default: null })
  helmet: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Equipment.name, default: null })
  boots: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Equipment.name, default: null })
  necklace: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Equipment.name, default: null })
  ring: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], default: [] })
  inventory: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  collection: Types.ObjectId[];

  @Prop({
    type: [{
      name: { type: String, required: true },
      cards: [{ type: Types.ObjectId, ref: 'Card' }],
      isSelected: { type: Boolean, default: false }
    }],
    default: []
  })
  desk: {
    name: string;
    cards: Types.ObjectId[];
    isSelected: boolean;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
