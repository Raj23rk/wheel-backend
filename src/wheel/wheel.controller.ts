import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WheelService } from './wheel.service';
import { CreateWheelDto } from './dto/create-wheel.dto';
import { UpdateWheelDto } from './dto/update-wheel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/admin/wheels')
@UseGuards(JwtAuthGuard)
export class WheelController {
  constructor(private readonly wheelService: WheelService) {}

  @Post()
  create(@Body() dto: CreateWheelDto) {
    return this.wheelService.create(dto);
  }

  @Get()
  findAll() {
    return this.wheelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wheelService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWheelDto) {
    return this.wheelService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wheelService.remove(id);
  }
}
