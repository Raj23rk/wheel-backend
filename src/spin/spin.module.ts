import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpinService } from './spin.service';
import { SpinController } from './spin.controller';
import { SpinRecord, SpinRecordSchema } from '../schemas/spin-record.schema';
import { Campaign, CampaignSchema } from '../schemas/campaign.schema';
import { Wheel, WheelSchema } from '../schemas/wheel.schema';
import { Offer, OfferSchema } from '../schemas/offer.schema';
import { CouponModule } from '../coupon/coupon.module';
import { AuthModule } from '../auth/auth.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpinRecord.name, schema: SpinRecordSchema },
      { name: Campaign.name, schema: CampaignSchema },
      { name: Wheel.name, schema: WheelSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
    CouponModule,
    AuthModule,
    OtpModule,
  ],
  controllers: [SpinController],
  providers: [SpinService],
  exports: [SpinService],
})
export class SpinModule {}
