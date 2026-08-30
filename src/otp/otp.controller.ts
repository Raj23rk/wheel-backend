// import { Controller, Post, Body } from '@nestjs/common';
// import { OtpService } from './otp.service';
// import { RequestOtpDto } from './dto/request-otp.dto';
// import { VerifyOtpDto } from './dto/verify-otp.dto';

// @Controller('api/otp')
// export class OtpController {
//   constructor(private readonly otpService: OtpService) {}

//   @Post('request')
//   requestOtp(@Body() dto: RequestOtpDto) {
//     return this.otpService.requestOtp(dto.phone);
//   }

//   @Post('verify')
//   verifyOtp(@Body() dto: VerifyOtpDto) {
//     return this.otpService.verifyOtp(dto.phone, dto.code);
//   }
// }
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { OtpService } from './otp.service';

import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('api/otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
  ) {}

  @Post('request')
  async requestOtp(
    @Body() dto: RequestOtpDto,
  ) {
    return this.otpService.requestOtp(
      dto.phone,
    );
  }

  @Post('verify')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
  ) {
    return this.otpService.verifyOtp(
      dto.phone,
      dto.code,
    );
  }
}