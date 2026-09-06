import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WheelService } from './wheel.service';
import { WheelController } from './wheel.controller';
import { Wheel, WheelSchema } from '../schemas/wheel.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wheel.name, schema: WheelSchema }]),
    AuthModule,
  ],
  controllers: [WheelController],
  providers: [WheelService],
  exports: [WheelService],
})
export class WheelModule {}
