import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Iron Sword' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'] })
  @IsEnum(['weapon', 'armor', 'helmet', 'boots', 'necklace', 'ring'] as const)
  type: 'weapon' | 'armor' | 'helmet' | 'boots' | 'necklace' | 'ring';

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
}


