import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from './schemas/card.schema';
import { CardService } from './card.service';
import { CardController, CardSyncController } from './card.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Card.name, schema: CardSchema },
    ]),
  ],
  controllers: [CardController, CardSyncController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}


