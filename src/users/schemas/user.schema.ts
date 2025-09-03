import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ type: Number, default: null })
  weapon: number | null;

  @Prop({ type: Number, default: null })
  armor: number | null;

  @Prop({ type: Number, default: null })
  helmet: number | null;

  @Prop({ type: Number, default: null })
  boots: number | null;

  @Prop({ type: Number, default: null })
  necklace: number | null;

  @Prop({ type: Number, default: null })
  ring: number | null;

  @Prop({ type: [Types.ObjectId], default: [] })
  inventory: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
