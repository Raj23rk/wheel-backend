import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import { OtpController } from './otp.controller';
import { OtpSession, OtpSessionSchema } from '../schemas/otp-session.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OtpSession.name, schema: OtpSessionSchema }]),
    AuthModule,
  ],
  controllers: [OtpController],
  providers: [OtpService, SmsService],
  exports: [OtpService, SmsService],
})
export class OtpModule {}
