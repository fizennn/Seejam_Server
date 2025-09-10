import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DuelService } from './duel.service';
import { CreateDuelDto } from './dto/create-duel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('duel')
@Controller('duel')
export class DuelController {
  constructor(private readonly duelService: DuelService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() payload: CreateDuelDto) {
    return this.duelService.createDuel(payload);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    return this.duelService.findById(id);
  }

  @Post(':id/play-card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async playCard(@Param('id') id: string, @Body() payload: { cardId: string }, @Request() req: any) {
    return this.duelService.playCard(id, req.user.id, payload);
  }

  @Post(':id/end-turn')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async endTurn(@Param('id') id: string, @Request() req: any) {
    return this.duelService.endTurn(id, req.user.id);
  }
}