import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['percentage', 'fixed', 'freebie', 'tryAgain', 'bogo', 'exchange'])
  discountType?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

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

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
