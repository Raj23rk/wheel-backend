import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WheelSegmentDto {
  @IsMongoId()
  offerId: string;

  @IsNumber()
  probability: number;

  @IsString()
  label: string;

  @IsString()
  color: string;
}

export class CreateWheelDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsMongoId()
  campaignId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WheelSegmentDto)
  segments: WheelSegmentDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
