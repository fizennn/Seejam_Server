import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NpcDocument = HydratedDocument<Npc>;

@Schema({ _id: false })
export class NpcDeckCard {
  @Prop({ type: Types.ObjectId, ref: 'Card', required: true })
  cardId: Types.ObjectId;

  @Prop({ type: Number, min: 1, required: true })
  quantity: number;
}

export const NpcDeckCardSchema = SchemaFactory.createForClass(NpcDeckCard);

@Schema({ _id: false })
export class NpcDeck {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: [NpcDeckCardSchema], default: [] })
  cards: NpcDeckCard[];
}

export const NpcDeckSchema = SchemaFactory.createForClass(NpcDeck);

@Schema({ timestamps: true })
export class Npc {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: Number, default: 100, min: 0 })
  hp: number;

  @Prop({ type: Number, default: 0, min: 0 })
  atk: number;

  @Prop({ type: Number, default: 0, min: 0 })
  def: number;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: false })
  weapon?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: false })
  armor?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: false })
  helmet?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: false })
  boots?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: false })
  necklace?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: false })
  ring?: Types.ObjectId | null;

  @Prop({ type: [NpcDeckSchema], default: [] })
  decks: NpcDeck[];
}

export const NpcSchema = SchemaFactory.createForClass(Npc);


