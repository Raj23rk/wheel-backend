import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpSessionDocument = OtpSession & Document;

@Schema({ timestamps: true })
export class OtpSession {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;
}

export const OtpSessionSchema = SchemaFactory.createForClass(OtpSession);
