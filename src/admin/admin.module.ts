import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminUser, AdminUserSchema } from '../schemas/admin-user.schema';
import { Offer, OfferSchema } from '../schemas/offer.schema';
import { Wheel, WheelSchema } from '../schemas/wheel.schema';
import { Campaign, CampaignSchema } from '../schemas/campaign.schema';
import { SpinModule } from '../spin/spin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Wheel.name, schema: WheelSchema },
      { name: Campaign.name, schema: CampaignSchema },
    ]),
    SpinModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
