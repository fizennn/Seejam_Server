import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CardTypeEnum {
  skill = 'skill',
  buff = 'buff',
}

export enum CardActionEnum {
  damage = 'damage',
  increaseAtk = 'increaseAtk',
  increaseDef = 'increaseDef',
}

export enum CardTargetEnum {
  self = 'self',
  enemy = 'enemy',
}

export enum CardRarityEnum {
  common = 'common',
  uncommon = 'uncommon',
  rare = 'rare',
  epic = 'epic',
  legendary = 'legendary',
}

export class CardEffectDto {
  @ApiProperty({ enum: CardActionEnum })
  @IsEnum(CardActionEnum)
  action: CardActionEnum;

  @ApiProperty({ example: 90 })
  @IsInt()
  value: number;

  @ApiProperty({ enum: CardTargetEnum })
  @IsEnum(CardTargetEnum)
  target: CardTargetEnum;
}

export class CreateCardDto {
  @ApiProperty({ example: 'Thunderbolt' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CardRarityEnum, required: false, default: CardRarityEnum.common })
  @IsEnum(CardRarityEnum)
  rarity?: CardRarityEnum;

  @ApiProperty({ enum: CardTypeEnum })
  @IsEnum(CardTypeEnum)
  type: CardTypeEnum;

  @ApiProperty({ type: CardEffectDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CardEffectDto)
  effect: CardEffectDto;
}


