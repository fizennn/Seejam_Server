import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class AddCardToDeckDto {
  @ApiProperty({
    description: 'ObjectId của card cần thêm vào deck',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  cardId: string;
}

export class SaveDeckDto {
  @ApiProperty({
    description: 'Tên của deck',
    example: 'Deck Attack Mạnh',
  })
  @IsString()
  @IsNotEmpty()
  deckName: string;

  @ApiProperty({
    description: 'Danh sách ObjectId của các card trong deck',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Deck phải có ít nhất 1 card' })
  @ArrayMaxSize(30, { message: 'Deck không được quá 30 card' })
  @IsString({ each: true })
  cardIds: string[];
}

export class LoadDeckDto {
  @ApiProperty({
    description: 'Tên của deck đã lưu',
    example: 'Deck Attack Mạnh',
  })
  @IsString()
  @IsNotEmpty()
  deckName: string;

  @ApiProperty({
    description: 'Deck đích để load (deck1, deck2, deck3)',
    example: 'deck1',
    enum: ['deck1', 'deck2', 'deck3'],
  })
  @IsString()
  @IsNotEmpty()
  targetDeck: 'deck1' | 'deck2' | 'deck3';
}
