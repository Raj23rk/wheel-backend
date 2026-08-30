import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpSessionDocument =
  HydratedDocument<OtpSession>;

@Schema({
  timestamps: true,
})
export class OtpSession {
  @Prop({
    required: true,
    index: true,
  })
  phone: string;

  @Prop({
    required: true,
  })
  code: string;

  @Prop({
    required: true,
    index: true,
  })
  expiresAt: Date;

  @Prop({
    default: false,
  })
  verified: boolean;
}

export const OtpSessionSchema =
  SchemaFactory.createForClass(OtpSession);