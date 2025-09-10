import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Duel, DuelSchema } from './schemas/duel.schema';
import { DuelService } from './duel.service';
import { DuelController } from './duel.controller';
import { UsersModule } from '../users/users.module';
import { NpcModule } from '../npc/npc.module';
import { Equipment, EquipmentSchema } from '../equipment/schemas/equipment.schema';
import { Card, CardSchema } from '../card/schemas/card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Duel.name, schema: DuelSchema },
      { name: Equipment.name, schema: EquipmentSchema },
      { name: Card.name, schema: CardSchema },
    ]),
    UsersModule,
    NpcModule,
  ],
  controllers: [DuelController],
  providers: [DuelService],
})
export class DuelModule {}


