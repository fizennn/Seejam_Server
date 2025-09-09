import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RenameDeckDto {
  @ApiProperty({ description: 'Tên deck mới', example: 'My Renamed Deck' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  newName: string;
}


