import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Duel, DuelDocument } from './schemas/duel.schema';
import { CreateDuelDto } from './dto/create-duel.dto';
import { UsersService } from '../users/users.service';
import { NpcService } from '../npc/npc.service';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Equipment } from '../equipment/schemas/equipment.schema';
import { Card, CardDocument } from '../card/schemas/card.schema';

@Injectable()
export class DuelService {
  constructor(
    @InjectModel(Duel.name) private readonly duelModel: Model<DuelDocument>,
    private readonly usersService: UsersService,
    private readonly npcService: NpcService,
    @InjectMongooseModel(Equipment.name) private readonly equipmentModel: Model<Equipment>,
    @InjectMongooseModel(Card.name) private readonly cardModel: Model<CardDocument>,
  ) {}

  async createDuel(payload: CreateDuelDto): Promise<Duel> {
    if (payload.player1Type === payload.player2Type && payload.player1Id === payload.player2Id) {
      throw new BadRequestException('Hai người chơi không được trùng nhau');
    }

    const player1 = await this.buildPlayerSnapshot(payload.player1Type, payload.player1Id, payload.player1DeckId);
    const player2 = await this.buildPlayerSnapshot(payload.player2Type, payload.player2Id, payload.player2DeckId);

    const duel = await this.duelModel.create({
      player1,
      player2,
      turn: 1,
      status: 'ongoing',
      battleLog: [
        'Khởi tạo trận đấu',
        'Bắt đầu lượt 1',
      ],
    });

    return duel;
  }

  async playCard(duelId: string, userId: string, payload: { cardId: string }): Promise<any> {
    const duel = await this.findById(duelId);
    if (duel.status !== 'ongoing') {
      throw new BadRequestException('Duel không ở trạng thái có thể chơi bài');
    }
    // Only player1 (user) can act
    if (!duel.player1.id.startsWith('user_') || duel.player1.id !== `user_${userId}`) {
      throw new BadRequestException('Chỉ người chơi thứ nhất có thể thực hiện');
    }

    const cardIndex = (duel.player1.currentCards || []).findIndex((c) => c === payload.cardId);
    if (cardIndex === -1) {
      throw new BadRequestException('Lá bài không nằm trong tay hiện tại');
    }

    const card = await this.cardModel.findById(new Types.ObjectId(payload.cardId)).lean();
    if (!card) {
      throw new NotFoundException('Không tìm thấy lá bài');
    }

    const cost = (card as any).energy ?? 1;
    if ((duel.player1.stats.energy ?? 0) < cost) {
      throw new BadRequestException('Không đủ năng lượng');
    }
    duel.player1.stats.energy -= cost;

    // Apply simple effects (target is always player2)
    const playEffect = (card as any).effect;
    if (playEffect) {
      switch (playEffect.action) {
        case 'damage': {
          const baseDmg = Number(playEffect.value) || 0;
          const atk = duel.player1.stats.atk.current;
          const def = duel.player2.stats.def.current;
          const dmg = Math.max(0, Math.floor(baseDmg * (atk / (atk + def))));
          duel.player2.stats.hp.current = Math.max(0, duel.player2.stats.hp.current - dmg);
          break;
        }
        case 'increaseAtk': {
          duel.player1.stats.atk.current += Number(playEffect.value) || 0;
          break;
        }
        case 'increaseDef': {
          duel.player1.stats.def.current += Number(playEffect.value) || 0;
          break;
        }
      }
    }


    // Move card from hand to discard
    const [removed] = duel.player1.currentCards.splice(cardIndex, 1);
    if (!Array.isArray((duel.player1 as any).discardPile)) {
      (duel.player1 as any).discardPile = [];
    }
    (duel.player1 as any).discardPile.push(removed);

    const cardName = (card as any).name || removed;
    const logEffect = (card as any).effect;
    const value = logEffect?.value ?? 0;
    const actualDmg = logEffect?.action === 'damage' 
      ? Math.floor(value * (duel.player1.stats.atk.current / (duel.player1.stats.atk.current + duel.player2.stats.def.current)))
      : 0;
    const actionText = logEffect?.action === 'damage' 
      ? `gây ${actualDmg} sát thương (${value} base), HP đối thủ còn: ${duel.player2.stats.hp.current}`
      : logEffect?.action === 'increaseAtk' 
      ? `tăng ${value} ATK`
      : logEffect?.action === 'increaseDef' 
      ? `tăng ${value} DEF` 
      : '';
    duel.battleLog.push(`Người chơi dùng thẻ ${cardName} ${actionText}`.trim());

    // If any side reaches 0 HP after this action, finish the duel (saves inside)
    const finished = await this.checkAndFinishIfDead(duel);
    if (finished) {
      const result = this.sanitizeDuelForViewer(duel, userId);
      result.lastAction = {
        player: 'player1',
        action: 'playCard',
        cardName,
        effect: logEffect,
        result: actionText,
        energyUsed: cost,
        energyRemaining: duel.player1.stats.energy,
      };
      return result;
    }

    await duel.save();
    const result = this.sanitizeDuelForViewer(duel, userId);
    result.lastAction = {
      player: 'player1',
      action: 'playCard',
      cardName,
      effect: logEffect,
      result: actionText,
      energyUsed: cost,
      energyRemaining: duel.player1.stats.energy,
    };
    return result;
  }

  async endTurn(duelId: string, userId: string): Promise<any> {
    const duel = await this.findById(duelId);
    if (duel.status !== 'ongoing') {
      throw new BadRequestException('Duel không ở trạng thái có thể kết thúc lượt');
    }
    // Prevent actions if already lethal
    const alreadyFinished = await this.checkAndFinishIfDead(duel);
    if (alreadyFinished) {
      return this.sanitizeDuelForViewer(duel, userId);
    }
    // Only player1 can end turn
    if (!duel.player1.id.startsWith('user_') || duel.player1.id !== `user_${userId}`) {
      throw new BadRequestException('Chỉ người chơi thứ nhất có thể thực hiện');
    }

    // NPC plays cards first (if it's an NPC)
    let npcActions = [];
    if (duel.player2.id.startsWith('npc_')) {
      npcActions = await this.playNpcTurn(duel);
      // Check if duel ended after NPC turn
      const finished = await this.checkAndFinishIfDead(duel);
      if (finished) {
        const result = this.sanitizeDuelForViewer(duel, userId);
        result.lastAction = {
          player: 'player2',
          action: 'npcTurn',
          npcActions,
          turnEnded: true,
        };
        return result;
      }
    }

    // Both draw 1 card if available
    this.drawOne(duel.player1);
    this.drawOne(duel.player2);

    // Compute next turn and set energy equal to next turn index
    const nextTurn = (duel.turn || 0) + 1;
    duel.player1.stats.energy = nextTurn;
    duel.player2.stats.energy = nextTurn;

    // Update turn counter
    duel.turn = nextTurn;

    duel.battleLog.push(`Kết thúc lượt. Lượt hiện tại: ${duel.turn}`);

    await duel.save();
    const result = this.sanitizeDuelForViewer(duel, userId);
    result.lastAction = {
      player: 'system',
      action: 'endTurn',
      npcActions,
      turnEnded: true,
      newTurn: duel.turn,
      energyReset: {
        player1: duel.player1.stats.energy,
        player2: duel.player2.stats.energy,
      },
    };
    return result;
  }

  private drawOne(player: any) {
    if (Array.isArray(player.cards) && player.cards.length > 0) {
      const cardId = player.cards.shift();
      player.currentCards = player.currentCards || [];
      player.currentCards.push(cardId);
    }
  }

  private sanitizeDuelForViewer(duel: any, viewerUserId: string) {
    const json = duel.toObject ? duel.toObject() : JSON.parse(JSON.stringify(duel));
    const viewerIsP1 = json.player1?.id === `user_${viewerUserId}`;
    const hideSide = viewerIsP1 ? 'player2' : 'player1';
    
    // Hide opponent's cards but show count
    if (json[hideSide]) {
      json[hideSide] = {
        ...json[hideSide],
        currentCardsCount: (json[hideSide].currentCards || []).length,
        cardsCount: (json[hideSide].cards || []).length,
      };
      delete json[hideSide].currentCards;
      delete json[hideSide].cards;
    }

    return json;
  }

  private async checkAndFinishIfDead(duel: DuelDocument): Promise<boolean> {
    const p1Dead = duel.player1.stats.hp.current <= 0;
    const p2Dead = duel.player2.stats.hp.current <= 0;
    if (p1Dead || p2Dead) {
      duel.status = 'finished';
      const winner = p1Dead && p2Dead ? 'Hòa' : p1Dead ? 'Người chơi 2' : 'Người chơi 1';
      duel.battleLog.push(`Trận đấu kết thúc. ${winner}${winner === 'Hòa' ? '' : ' chiến thắng'}.`);
      await duel.save();
      return true;
    }
    return false;
  }

  private async playNpcTurn(duel: DuelDocument): Promise<any[]> {
    const npc = duel.player2;
    const availableCards = npc.currentCards || [];
    const energy = npc.stats.energy || 0;

    // Simple AI: play cards that can be afforded, prioritizing damage
    const playableCards = [];
    for (let i = 0; i < availableCards.length; i++) {
      const cardId = availableCards[i];
      const card = await this.cardModel.findById(new Types.ObjectId(cardId)).lean();
      if (card) {
        const cost = (card as any).energy ?? 1;
        if (cost <= energy) {
          playableCards.push({ cardId, card, cost, index: i });
        }
      }
    }

    // Sort by priority: damage > buff > others
    playableCards.sort((a, b) => {
      const aEffect = (a.card as any).effect;
      const bEffect = (b.card as any).effect;
      const aPriority = aEffect?.action === 'damage' ? 3 : aEffect?.action?.includes('increase') ? 2 : 1;
      const bPriority = bEffect?.action === 'damage' ? 3 : bEffect?.action?.includes('increase') ? 2 : 1;
      return bPriority - aPriority;
    });

    // Play cards until energy runs out
    let remainingEnergy = energy;
    const actions = [];
    for (const { card, cost, index } of playableCards) {
      if (remainingEnergy < cost) break;

      // Apply card effect
      const effect = (card as any).effect;
      if (effect) {
        switch (effect.action) {
          case 'damage': {
            const baseDmg = Number(effect.value) || 0;
            const atk = npc.stats.atk.current;
            const def = duel.player1.stats.def.current;
            const dmg = Math.max(0, Math.floor(baseDmg * (atk / (atk + def))));
            duel.player1.stats.hp.current = Math.max(0, duel.player1.stats.hp.current - dmg);
            break;
          }
          case 'increaseAtk': {
            npc.stats.atk.current += Number(effect.value) || 0;
            break;
          }
          case 'increaseDef': {
            npc.stats.def.current += Number(effect.value) || 0;
            break;
          }
        }
      }

      // Consume energy
      remainingEnergy -= cost;
      npc.stats.energy = remainingEnergy;

      // Move card to discard pile
      const [removed] = npc.currentCards.splice(index, 1);
      if (!Array.isArray((npc as any).discardPile)) {
        (npc as any).discardPile = [];
      }
      (npc as any).discardPile.push(removed);

      // Log the action
      const cardName = (card as any).name || removed;
      const value = effect?.value ?? 0;
      const actualDmg = effect?.action === 'damage'
        ? Math.floor(value * (npc.stats.atk.current / (npc.stats.atk.current + duel.player1.stats.def.current)))
        : 0;
      const actionText =
        effect?.action === 'damage'
          ? `gây ${actualDmg} sát thương (${value} base), HP người chơi còn: ${duel.player1.stats.hp.current}`
          : effect?.action === 'increaseAtk'
          ? `tăng ${value} ATK`
          : effect?.action === 'increaseDef'
          ? `tăng ${value} DEF`
          : '';
      duel.battleLog.push(`NPC dùng thẻ ${cardName} ${actionText}`.trim());

      // Record action
      actions.push({
        cardName,
        effect,
        result: actionText,
        energyUsed: cost,
        energyRemaining: remainingEnergy,
      });

      // Check if player is dead
      if (duel.player1.stats.hp.current <= 0) {
        break;
      }
    }
    return actions;
  }

  async findById(duelId: string): Promise<DuelDocument> {
    if (!Types.ObjectId.isValid(duelId)) {
      throw new BadRequestException('Duel id không hợp lệ');
    }
    const duel = await this.duelModel.findById(new Types.ObjectId(duelId)).exec();
    if (!duel) throw new NotFoundException('Không tìm thấy duel');
    return duel;
  }

  private async buildPlayerSnapshot(ownerType: 'user' | 'npc', ownerId: string, deckId?: string) {
    if (ownerType === 'user') {
      if (!deckId) {
        throw new BadRequestException('DeckId là bắt buộc đối với user');
      }
      const user = await this.findUserById(ownerId);
      const cards = this.shuffle(this.resolveCardsFromUserDeck(user, deckId));
      const currentCards = cards.slice(0, 4);
      const remaining = cards.slice(4);
      const { finalHp, finalAtk, finalDef } = await this.applyEquipmentBonuses({
        baseHp: user.hp ?? 100,
        baseAtk: user.atk ?? 30,
        baseDef: user.def ?? 30,
        equipmentIds: [user.weapon, user.armor, user.helmet, user.boots, user.necklace, user.ring]
          .filter(Boolean)
          .map((x: any) => x.toString()),
      });
      return {
        id: `user_${user._id.toString()}`,
        fullName: user.fullName,
        stats: {
          hp: { max: finalHp, current: finalHp },
          atk: { base: finalAtk, current: finalAtk },
          def: { base: finalDef, current: finalDef },
          energy: 1,
        },
        equipment: {
          weapon: user.weapon ? user.weapon.toString() : null,
          armor: user.armor ? user.armor.toString() : null,
          helmet: user.helmet ? user.helmet.toString() : null,
          boots: user.boots ? user.boots.toString() : null,
          necklace: user.necklace ? user.necklace.toString() : null,
          ring: user.ring ? user.ring.toString() : null,
        },
        currentCards,
        cards: remaining,
      };
    }

    const npc = await this.npcService.findOne(ownerId);
    const cards = this.shuffle(this.resolveCardsFromNpcFirstDeck(npc as any));
    const currentCards = cards.slice(0, 4);
    const remaining = cards.slice(4);
    const { finalHp, finalAtk, finalDef } = await this.applyEquipmentBonuses({
      baseHp: (npc as any).hp ?? 100,
      baseAtk: (npc as any).atk ?? 30,
      baseDef: (npc as any).def ?? 30,
      equipmentIds: [
        (npc as any).weapon,
        (npc as any).armor,
        (npc as any).helmet,
        (npc as any).boots,
        (npc as any).necklace,
        (npc as any).ring,
      ]
        .filter(Boolean)
        .map((x: any) => x.toString()),
    });
    return {
      id: `npc_${(npc as any)._id.toString()}`,
      fullName: (npc as any).fullName,
      stats: {
        hp: { max: finalHp, current: finalHp },
        atk: { base: finalAtk, current: finalAtk },
        def: { base: finalDef, current: finalDef },
        energy: 1,
      },
      equipment: {
        weapon: (npc as any).weapon ? (npc as any).weapon.toString() : null,
        armor: (npc as any).armor ? (npc as any).armor.toString() : null,
        helmet: (npc as any).helmet ? (npc as any).helmet.toString() : null,
        boots: (npc as any).boots ? (npc as any).boots.toString() : null,
        necklace: (npc as any).necklace ? (npc as any).necklace.toString() : null,
        ring: (npc as any).ring ? (npc as any).ring.toString() : null,
      },
      currentCards,
      cards: remaining,
    };
  }

  private async findUserById(userId: string): Promise<any> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    return user as any;
  }

  private resolveCardsFromUserDeck(user: any, deckId: string): string[] {
    const deck = (user.desk || []).find((d: any) => d._id?.toString() === deckId);
    if (!deck) throw new NotFoundException('Deck của user không tồn tại');
    return (deck.cards || []).flatMap((c: any) => {
      const id = this.normalizeId(c.cardId);
      const quantity = c.quantity ?? 1;
      return Array(quantity).fill(id);
    });
  }

  private resolveCardsFromNpcFirstDeck(npc: any): string[] {
    const first = (npc.decks || [])[0];
    if (!first) throw new NotFoundException('NPC không có deck nào');
    return (first.cards || []).flatMap((c: any) => {
      const id = this.normalizeId(c.cardId);
      const quantity = c.quantity ?? 1;
      return Array(quantity).fill(id);
    });
  }

  private normalizeId(ref: any): string {
    // If populated document with _id
    if (ref && typeof ref === 'object' && ref._id) {
      return ref._id.toString();
    }
    // If already an ObjectId instance
    if (ref && typeof ref === 'object' && typeof ref.toString === 'function') {
      const str = ref.toString();
      if (Types.ObjectId.isValid(str)) return str;
    }
    // If raw string id
    if (typeof ref === 'string') {
      return ref;
    }
    throw new BadRequestException('Không thể chuẩn hóa id thẻ');
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private async applyEquipmentBonuses(params: {
    baseHp: number;
    baseAtk: number;
    baseDef: number;
    equipmentIds: string[];
  }): Promise<{ finalHp: number; finalAtk: number; finalDef: number }> {
    const { baseHp, baseAtk, baseDef, equipmentIds } = params;
    if (!equipmentIds.length) return { finalHp: baseHp, finalAtk: baseAtk, finalDef: baseDef };

    const equipments = await this.equipmentModel
      .find({ _id: { $in: equipmentIds.map((id) => new Types.ObjectId(id)) } })
      .select('hp atk def')
      .lean()
      .exec();

    const bonus = equipments.reduce(
      (acc, eq: any) => {
        acc.hp += eq?.hp ?? 0;
        acc.atk += eq?.atk ?? 0;
        acc.def += eq?.def ?? 0;
        return acc;
      },
      { hp: 0, atk: 0, def: 0 },
    );

    return {
      finalHp: baseHp + bonus.hp,
      finalAtk: baseAtk + bonus.atk,
      finalDef: baseDef + bonus.def,
    };
  }
}


