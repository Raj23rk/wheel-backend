import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/admin/offers')
@UseGuards(JwtAuthGuard)
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.offerService.create(dto);
  }

  @Get()
  findAll() {
    return this.offerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offerService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offerService.remove(id);
  }
}
