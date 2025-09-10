import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateNpcDeckCardDto {
  @ApiProperty({ description: 'Card ObjectId', example: '68b9967487398953de1cded9' })
  @IsMongoId()
  cardId: string;

  @ApiProperty({ description: 'Quantity of this card', example: 10 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

class CreateNpcDeckDto {
  @ApiProperty({ description: 'Deck name', example: 'My First Deck' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [CreateNpcDeckCardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNpcDeckCardDto)
  cards: CreateNpcDeckCardDto[];
}

export class CreateNpcDto {
  @ApiProperty({ example: 'Luu Quang Huy' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hp?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  atk?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  def?: number;

  @ApiPropertyOptional({ example: '68b859990ab93186ea764ba6' })
  @IsOptional()
  @IsMongoId()
  weapon?: string;

  @ApiPropertyOptional({ example: '68b8596a0ab93186ea764b9c' })
  @IsOptional()
  @IsMongoId()
  armor?: string;

  @ApiPropertyOptional({ example: '68b859720ab93186ea764b9e' })
  @IsOptional()
  @IsMongoId()
  helmet?: string;

  @ApiPropertyOptional({ example: '68b8597b0ab93186ea764ba0' })
  @IsOptional()
  @IsMongoId()
  boots?: string;

  @ApiPropertyOptional({ example: '68b859820ab93186ea764ba2' })
  @IsOptional()
  @IsMongoId()
  necklace?: string;

  @ApiPropertyOptional({ example: '68b859b20ab93186ea764bac' })
  @IsOptional()
  @IsMongoId()
  ring?: string;

  @ApiPropertyOptional({ type: [CreateNpcDeckDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNpcDeckDto)
  decks?: CreateNpcDeckDto[];
}


