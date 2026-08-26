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

export class UpdateWheelSegmentDto {
  @IsMongoId()
  offerId: string;

  @IsNumber()
  probability: number;

  @IsString()
  label: string;

  @IsString()
  color: string;
}

export class UpdateWheelDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsMongoId()
  campaignId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateWheelSegmentDto)
  segments?: UpdateWheelSegmentDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
