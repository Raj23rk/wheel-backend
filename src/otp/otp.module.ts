import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { JwtModule } from '@nestjs/jwt';

import { OtpController } from './otp.controller';

import { OtpService } from './otp.service';

import {
  OtpSession,
  OtpSessionSchema,
} from '../schemas/otp-session.schema';

import { SmsService } from './sms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OtpSession.name,
        schema: OtpSessionSchema,
      },
    ]),

    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'eyeland-spin-win-secret-key-2024',
      signOptions: {
        expiresIn: '30m',
      },
    }),
  ],

  controllers: [
    OtpController,
  ],

  providers: [
    OtpService,
    SmsService,
  ],

  exports: [
    OtpService,
    SmsService,
  ],
})
export class OtpModule {}