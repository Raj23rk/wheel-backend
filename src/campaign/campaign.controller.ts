import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  // Public customer routes
  @Get('campaigns/public')
  getPublicActiveCampaign() {
    return this.campaignService.getPublicCampaign();
  }

  @Get('campaigns/public/:id')
  getPublicCampaignById(@Param('id') id: string) {
    return this.campaignService.getPublicCampaign(id);
  }

  // Admin routes
  @Post('admin/campaigns')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.create(dto);
  }

  @Get('admin/campaigns')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.campaignService.findAll();
  }

  @Get('admin/campaigns/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Put('admin/campaigns/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Delete('admin/campaigns/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }
}
