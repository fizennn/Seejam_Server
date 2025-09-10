import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NpcService } from './npc.service';
import { CreateNpcDto } from './dto/create-npc.dto';
import { UpdateNpcDto } from './dto/update-npc.dto';

@ApiTags('npc')
@Controller('npc')
export class NpcController {
  constructor(private readonly npcService: NpcService) {}

  @Post()
  create(@Body() payload: CreateNpcDto) {
    return this.npcService.create(payload);
  }

  @Get()
  findAll() {
    return this.npcService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.npcService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateNpcDto) {
    return this.npcService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.npcService.remove(id);
  }
}


