import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PerLevelDto {
  @ApiProperty({ example: 2, minimum: 0 })
  @IsInt()
  @Min(0)
  atk: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  def: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  hp: number;
}

export class UpgradePathDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  maxLevel: number;

  @ApiProperty({ type: PerLevelDto })
  @ValidateNested()
  @Type(() => PerLevelDto)
  perLevel: PerLevelDto;
}

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Iron Sword' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'] })
  @IsEnum(['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'] as const)
  type: 'weapon' | 'armor' | 'helmet' | 'boots' | 'necklace' | 'ring';

  @ApiProperty({ enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], required: false, default: 'common' })
  @IsEnum(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const)
  @IsOptional()
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  @ApiProperty({ example: 3, required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  levelReq?: number;

  @ApiProperty({ example: 15, required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  atk?: number;

  @ApiProperty({ example: 0, required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  def?: number;

  @ApiProperty({ example: 0, required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  hp?: number;

  @ApiProperty({
    required: false,
    example: {
      level: 1,
      maxLevel: 10,
      perLevel: { atk: 2, def: 0, hp: 0 },
    },
  })
  @ValidateNested()
  @Type(() => UpgradePathDto)
  @IsOptional()
  upgradePath?: UpgradePathDto;
}


