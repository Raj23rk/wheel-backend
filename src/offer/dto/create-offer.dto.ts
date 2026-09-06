import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  name: string;

  @IsIn(['percentage', 'fixed', 'freebie', 'tryAgain'])
  discountType: string;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
