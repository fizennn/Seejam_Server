import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CardDocument = Card & Document;

export type CardType = 'skill' | 'buff';
export type CardAction = 'damage' | 'increaseAtk' | 'increaseDef';
export type CardTarget = 'self' | 'enemy';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

@Schema({ _id: false })
export class CardEffect {
  @Prop({ required: true, enum: ['damage', 'increaseAtk', 'increaseDef'] })
  action: CardAction;

  @Prop({ type: Number, required: true})
  value: number;

  @Prop({ required: true, enum: ['self', 'enemy'] })
  target: CardTarget;
}

const CardEffectSchema = SchemaFactory.createForClass(CardEffect);

@Schema({ timestamps: true })
export class Card {
  _id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], default: 'common' })
  rarity: CardRarity;

  @Prop({ required: true, enum: ['skill', 'buff'] })
  type: CardType;

  @Prop({ type: Number, required: true, min: 1 })
  energy: number;

  @Prop({ type: CardEffectSchema, required: true })
  effect: CardEffect;
}

export const CardSchema = SchemaFactory.createForClass(Card);


