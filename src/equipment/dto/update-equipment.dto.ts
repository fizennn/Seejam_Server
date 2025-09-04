import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateEquipmentDto } from './create-equipment.dto';
import { UpgradePathDto } from './create-equipment.dto';
export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {
  @ApiPropertyOptional({ example: 'Steel Sword' })
  name?: string;

  @ApiPropertyOptional({ enum: ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'] })
  type?: 'weapon' | 'armor' | 'helmet' | 'boots' | 'necklace' | 'ring';

  @ApiPropertyOptional({ example: 20, minimum: 0 })
  atk?: number;

  @ApiPropertyOptional({ example: 5, minimum: 0 })
  def?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  hp?: number;

  @ApiPropertyOptional({ enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] })
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  @ApiPropertyOptional({ example: 3, minimum: 1 })
  levelReq?: number;

  @ApiPropertyOptional({
    example: {
      level: 1,
      maxLevel: 10,
      perLevel: { atk: 2, def: 0, hp: 0 },
    },
  })
  @ValidateNested()
  @Type(() => UpgradePathDto)
  upgradePath?: UpgradePathDto;
}


