import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/admin/coupons')
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  findAll(
    @Query('redeemed') redeemed?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.couponService.findAll({ redeemed, campaignId });
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.couponService.findByCode(code);
  }

  @Post(':code/redeem')
  redeem(@Param('code') code: string, @Body() dto: RedeemCouponDto) {
    return this.couponService.redeemCoupon(code, dto.redeemedBy);
  }
}
