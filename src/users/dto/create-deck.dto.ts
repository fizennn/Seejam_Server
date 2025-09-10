import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString, MaxLength, MinLength, ArrayMaxSize } from 'class-validator';

export class CreateDeckDto {
  @ApiProperty({ description: 'Tên deck', example: 'My First Deck' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Danh sách cardId', example: ['507f1f77bcf86cd799439011'], required: false, isArray: true, type: String })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40, { message: 'Deck không được quá 40 thẻ' })
  @IsMongoId({ each: true })
  cardIds?: string[];

  @ApiProperty({ description: 'Đặt deck này là được chọn', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  selected?: boolean;
}


