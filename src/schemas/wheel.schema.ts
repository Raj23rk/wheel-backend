import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class WheelSegment {
  @Prop({ type: Types.ObjectId, ref: 'Offer', required: true })
  offerId: Types.ObjectId;

  @Prop({ required: true })
  probability: number;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  color: string;
}

export type WheelDocument = Wheel & Document;

@Schema({ timestamps: true })
export class Wheel {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle: string;

  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaignId: Types.ObjectId;

  @Prop({
    type: [
      {
        offerId: { type: Types.ObjectId, ref: 'Offer' },
        probability: { type: Number, required: true },
        label: { type: String, required: true },
        color: { type: String, required: true },
      },
    ],
    default: [],
  })
  segments: WheelSegment[];

  @Prop({ default: true })
  isActive: boolean;
}

export const WheelSchema = SchemaFactory.createForClass(Wheel);
