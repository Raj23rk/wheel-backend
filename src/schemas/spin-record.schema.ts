import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SpinRecordDocument = SpinRecord & Document;

@Schema({ timestamps: true })
export class SpinRecord {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ type: Types.ObjectId, ref: 'Offer', required: true })
  offerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: true })
  couponId: Types.ObjectId;

  @Prop({ required: true })
  result: string;
}

export const SpinRecordSchema = SchemaFactory.createForClass(SpinRecord);
