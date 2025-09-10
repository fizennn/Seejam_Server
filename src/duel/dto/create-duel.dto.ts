import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateDuelDto {
  @ApiProperty({ enum: ['user', 'npc'] })
  @IsEnum(['user', 'npc'])
  player1Type: 'user' | 'npc';

  @ApiProperty({ description: 'MongoId của owner (user hoặc npc) của player1' })
  @IsMongoId()
  player1Id: string;

  @ApiPropertyOptional({ description: 'DeckId (subdocument _id) của player1. Bắt buộc nếu type=user' })
  @IsOptional()
  @IsString()
  player1DeckId?: string;

  @ApiProperty({ enum: ['user', 'npc'] })
  @IsEnum(['user', 'npc'])
  player2Type: 'user' | 'npc';

  @ApiProperty({ description: 'MongoId của owner (user hoặc npc) của player2' })
  @IsMongoId()
  player2Id: string;

  @ApiPropertyOptional({ description: 'DeckId (subdocument _id) của player2. Bắt buộc nếu type=user' })
  @IsOptional()
  @IsString()
  player2DeckId?: string;
}


