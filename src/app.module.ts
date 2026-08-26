import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { CampaignModule } from './campaign/campaign.module';
import { OfferModule } from './offer/offer.module';
import { WheelModule } from './wheel/wheel.module';
import { CouponModule } from './coupon/coupon.module';
import { OtpModule } from './otp/otp.module';
import { SpinModule } from './spin/spin.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eyeland-spinwin',
    ),
    AuthModule,
    AdminModule,
    CampaignModule,
    OfferModule,
    WheelModule,
    CouponModule,
    OtpModule,
    SpinModule,
  ],
})
export class AppModule {}
