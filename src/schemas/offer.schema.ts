import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['percentage', 'fixed', 'freebie', 'tryAgain'] })
  discountType: string;

  @Prop({ required: true, default: 0 })
  discountValue: number;

  @Prop()
  description: string;

  @Prop()
  minPurchase: number;

  @Prop()
  maxUses: number;

  @Prop({ default: 0 })
  currentUses: number;

  @Prop()
  terms: string;

  @Prop({ required: true })
  color: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
