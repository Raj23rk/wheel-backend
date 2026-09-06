import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SpinService } from '../spin/spin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly spinService: SpinService,
  ) {}

  @Get('spins')
  getSpins(
    @Query('campaignId') campaignId?: string,
    @Query('customerPhone') customerPhone?: string,
    @Query('customerEmail') customerEmail?: string,
  ) {
    return this.spinService.findAllSpins({ campaignId, customerPhone, customerEmail });
  }

  @Get('analytics')
  getAnalytics() {
    return this.spinService.getAnalytics();
  }

  @Get('admins')
  getAdmins() {
    return this.adminService.findAllAdmins();
  }
}
