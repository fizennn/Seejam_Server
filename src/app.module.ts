import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EquipmentModule } from './equipment/equipment.module';
import { CardModule } from './card/card.module';
import { NpcModule } from './npc/npc.module';
import { DuelModule } from './duel/duel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/seejam_db'),
    AuthModule,
    UsersModule,
    EquipmentModule,
    CardModule,
    NpcModule,
    DuelModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
