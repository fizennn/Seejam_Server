import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEquipmentDto } from './create-equipment.dto';
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
}


