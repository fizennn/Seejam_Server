import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class EquipInventoryDto {
  @ApiProperty({
    description: 'Vị trí của weapon trong inventory (0-based index)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  weapon?: number;

  @ApiProperty({
    description: 'Vị trí của armor trong inventory (0-based index)',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  armor?: number;

  @ApiProperty({
    description: 'Vị trí của helmet trong inventory (0-based index)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  helmet?: number;

  @ApiProperty({
    description: 'Vị trí của boots trong inventory (0-based index)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  boots?: number;

  @ApiProperty({
    description: 'Vị trí của necklace trong inventory (0-based index)',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  necklace?: number;

  @ApiProperty({
    description: 'Vị trí của ring trong inventory (0-based index)',
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  ring?: number;
}
