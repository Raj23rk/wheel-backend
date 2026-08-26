import { IsString, IsOptional } from 'class-validator';

export class RedeemCouponDto {
  @IsOptional()
  @IsString()
  redeemedBy?: string;
}
