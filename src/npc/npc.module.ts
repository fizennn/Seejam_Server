import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Npc, NpcSchema } from './schemas/npc.schema';
import { NpcService } from './npc.service';
import { NpcController } from './npc.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Npc.name, schema: NpcSchema }])],
  controllers: [NpcController],
  providers: [NpcService],
  exports: [NpcService],
})
export class NpcModule {}


