import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AddInventoryDto {
  @ApiProperty({ description: 'ObjectId của equipment', example: '652f1f77bcf86cd799439011' })
  @IsMongoId()
  equipmentId: string;
}


