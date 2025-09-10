import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class PlayCardDto {
  @ApiProperty({ description: 'Card Id to play', example: '64f0c9a2b1c2d3e4f5a6b7c8' })
  @IsString()
  @IsMongoId()
  cardId: string;
}


