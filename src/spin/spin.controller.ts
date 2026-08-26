import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { SpinService } from './spin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/spin')
export class SpinController {
  constructor(private readonly spinService: SpinService) {}

  @Post('campaign/:campaignId')
  @UseGuards(JwtAuthGuard)
  async spin(@Param('campaignId') campaignId: string, @Request() req: any) {
    const customerPhone = req.user.phone;
    return this.spinService.spin(campaignId, customerPhone);
  }
}
