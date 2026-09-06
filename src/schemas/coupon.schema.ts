import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'Offer', required: true })
  offerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ required: false, default: '' })
  customerPhone?: string;

  @Prop({ required: false, default: '', index: true })
  customerEmail?: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  redeemed: boolean;

  @Prop()
  redeemedAt: Date;

  @Prop()
  redeemedBy: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
