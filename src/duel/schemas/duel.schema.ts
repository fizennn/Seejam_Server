import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DuelDocument = HydratedDocument<Duel>;

@Schema({ _id: false })
export class DuelPlayerStatsValue {
  @Prop({ type: Number, required: true })
  max: number;

  @Prop({ type: Number, required: true })
  current: number;
}

export const DuelPlayerStatsValueSchema = SchemaFactory.createForClass(DuelPlayerStatsValue);

@Schema({ _id: false })
export class DuelPlayerStats {
  @Prop({ type: DuelPlayerStatsValueSchema, required: true })
  hp: DuelPlayerStatsValue;

  @Prop({ type: Object, required: true })
  atk: { base: number; current: number };

  @Prop({ type: Object, required: true })
  def: { base: number; current: number };

  @Prop({ type: Number, default: 1 })
  energy: number;
}

export const DuelPlayerStatsSchema = SchemaFactory.createForClass(DuelPlayerStats);

@Schema({ _id: false })
export class DuelPlayerEquipment {
  @Prop({ type: String, default: null })
  weapon: string | null;

  @Prop({ type: String, default: null })
  armor: string | null;

  @Prop({ type: String, default: null })
  helmet: string | null;

  @Prop({ type: String, default: null })
  boots: string | null;

  @Prop({ type: String, default: null })
  necklace: string | null;

  @Prop({ type: String, default: null })
  ring: string | null;
}

export const DuelPlayerEquipmentSchema = SchemaFactory.createForClass(DuelPlayerEquipment);

@Schema({ _id: false })
export class DuelPlayerSnapshot {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: DuelPlayerStatsSchema, required: true })
  stats: DuelPlayerStats;

  @Prop({ type: DuelPlayerEquipmentSchema, required: true })
  equipment: DuelPlayerEquipment;

  @Prop({ type: [String], default: [] })
  cards: string[];

  @Prop({ type: [String], default: [] })
  currentCards: string[];

  @Prop({ type: [String], default: [] })
  discardPile: string[];
}

export const DuelPlayerSnapshotSchema = SchemaFactory.createForClass(DuelPlayerSnapshot);

@Schema({ timestamps: true })
export class Duel {
  @Prop({ type: DuelPlayerSnapshotSchema, required: true })
  player1: DuelPlayerSnapshot;

  @Prop({ type: DuelPlayerSnapshotSchema, required: true })
  player2: DuelPlayerSnapshot;

  @Prop({ type: Number, default: 1 })
  turn: number;

  @Prop({ type: String, enum: ['ongoing', 'finished', 'cancelled'], default: 'ongoing' })
  status: 'ongoing' | 'finished' | 'cancelled';

  @Prop({ type: [String], default: [] })
  battleLog: string[];
}

export const DuelSchema = SchemaFactory.createForClass(Duel);


