// // import { Injectable, BadRequestException, Logger } from '@nestjs/common';
// // import { InjectModel } from '@nestjs/mongoose';
// // import { Model } from 'mongoose';
// // import { JwtService } from '@nestjs/jwt';
// // import { OtpSession, OtpSessionDocument } from '../schemas/otp-session.schema';
// // import { SmsService } from './sms.service';

// // @Injectable()
// // export class OtpService {
// //   private readonly logger = new Logger(OtpService.name);

// //   constructor(
// //     @InjectModel(OtpSession.name) private otpSessionModel: Model<OtpSessionDocument>,
// //     private jwtService: JwtService,
// //     private smsService: SmsService,
// //   ) {}

// //   async requestOtp(phone: string): Promise<{ message: string; code?: string; smsSent: boolean }> {
// //     // Generate 6-digit code
// //     const code = Math.floor(100000 + Math.random() * 900000).toString();

// //     // Set 5-minute expiry
// //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

// //     // Remove any existing OTP for this phone
// //     await this.otpSessionModel.deleteMany({ phone });

// //     // Store new OTP session
// //     const otpSession = new this.otpSessionModel({
// //       phone,
// //       code,
// //       expiresAt,
// //       verified: false,
// //     });
// //     await otpSession.save();

// //     // Send SMS via TextBee Gateway
// //     const smsResult = await this.smsService.sendOtpSms(phone, code);
// //     this.logger.log(`OTP generated for ${phone}. SMS dispatch result: ${smsResult.success ? 'Success' : smsResult.error}`);

// //     return {
// //       message: smsResult.success
// //         ? 'OTP sent successfully to your mobile number via SMS'
// //         : 'OTP generated. Please check your SMS or use code shown in console',
// //       code, // Kept for convenient testing / fallback display
// //       smsSent: smsResult.success,
// //     };
// //   }

// //   async verifyOtp(phone: string, code: string): Promise<{ token: string }> {
// //     const session = await this.otpSessionModel
// //       .findOne({
// //         phone,
// //         code,
// //         verified: false,
// //         expiresAt: { $gt: new Date() },
// //       })
// //       .exec();

// //     if (!session) {
// //       throw new BadRequestException('Invalid or expired OTP');
// //     }

// //     // Mark as verified
// //     session.verified = true;
// //     await session.save();

// //     // Generate session token (30-min expiry)
// //     const payload = { phone, type: 'customer' };
// //     const token = this.jwtService.sign(payload, { expiresIn: '30m' });

// //     return { token };
// //   }
// // }
// import {
//   Injectable,
//   BadRequestException,
//   Logger,
// } from '@nestjs/common';

// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';

// import { JwtService } from '@nestjs/jwt';

// import {
//   OtpSession,
//   OtpSessionDocument,
// } from '../schemas/otp-session.schema';

// import { SmsService } from './sms.service';

// @Injectable()
// export class OtpService {
//   private readonly logger =
//     new Logger(OtpService.name);

//   constructor(
//     @InjectModel(OtpSession.name)
//     private readonly otpSessionModel:
//       Model<OtpSessionDocument>,

//     private readonly jwtService: JwtService,

//     private readonly smsService: SmsService,
//   ) {}

//   async requestOtp(
//     phone: string,
//   ): Promise<{
//     message: string;
//     smsSent: boolean;
//     code?: string;
//   }> {
//     if (!phone) {
//       throw new BadRequestException(
//         'Phone number is required',
//       );
//     }

//     const formattedPhone =
//       this.smsService.formatPhoneNumber(phone);

//     // Generate 6 digit OTP
//     const code = Math.floor(
//       100000 +
//         Math.random() * 900000,
//     ).toString();

//     // 5 minute expiry
//     const expiresAt = new Date(
//       Date.now() + 5 * 60 * 1000,
//     );

//     // Remove old OTP
//     await this.otpSessionModel.deleteMany({
//       phone: formattedPhone,
//     });

//     // Save new OTP
//     const otpSession =
//       new this.otpSessionModel({
//         phone: formattedPhone,
//         code,
//         expiresAt,
//         verified: false,
//       });

//     await otpSession.save();

//     // Send SMS
//     const smsResult =
//       await this.smsService.sendOtpSms(
//         formattedPhone,
//         code,
//       );

//     this.logger.log(
//       `OTP SMS result: ${
//         smsResult.success
//           ? 'SUCCESS'
//           : smsResult.error
//       }`,
//     );

//     if (smsResult.success) {
//       return {
//         message:
//           'OTP sent successfully to your mobile number',
//         smsSent: true,
//       };
//     }

//     // Development only
//     return {
//       message:
//         'OTP generated but SMS could not be sent',
//       smsSent: false,
//       code,
//     };
//   }

//   async verifyOtp(
//     phone: string,
//     code: string,
//   ): Promise<{
//     token: string;
//   }> {
//     const formattedPhone =
//       this.smsService.formatPhoneNumber(phone);

//     const session =
//       await this.otpSessionModel.findOne({
//         phone: formattedPhone,
//         code,
//         verified: false,
//         expiresAt: {
//           $gt: new Date(),
//         },
//       });

//     if (!session) {
//       throw new BadRequestException(
//         'Invalid or expired OTP',
//       );
//     }

//     session.verified = true;

//     await session.save();

//     const payload = {
//       phone: formattedPhone,
//       type: 'customer',
//     };

//     const token =
//       this.jwtService.sign(
//         payload,
//         {
//           expiresIn: '30m',
//         },
//       );

//     return {
//       token,
//     };
//   }
// }
import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  private readonly logger =
    new Logger(OtpService.name);

  constructor(
    private readonly jwtService: JwtService,

    private readonly smsService: SmsService,
  ) {}

  /**
   * Send OTP
   */
  async requestOtp(
    phone: string,
  ): Promise<{
    message: string;
    smsSent: boolean;
  }> {
    if (!phone) {
      throw new BadRequestException(
        'Phone number is required',
      );
    }

    const formattedPhone =
      this.smsService.formatPhoneNumber(
        phone,
      );

    const result =
      await this.smsService.sendOtpSms(
        formattedPhone,
      );

    if (!result.success) {
      this.logger.error(
        `OTP sending failed: ${result.error}`,
      );

      throw new BadRequestException(
        result.error ||
          'Failed to send OTP',
      );
    }

    return {
      message:
        'OTP sent successfully to your mobile number',
      smsSent: true,
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{
    token: string;
  }> {
    if (!phone) {
      throw new BadRequestException(
        'Phone number is required',
      );
    }

    if (!code) {
      throw new BadRequestException(
        'OTP code is required',
      );
    }

    const formattedPhone =
      this.smsService.formatPhoneNumber(
        phone,
      );

    const result =
      await this.smsService.verifyOtp(
        formattedPhone,
        code,
      );

    if (!result.success) {
      throw new BadRequestException(
        result.error ||
          'Invalid or expired OTP',
      );
    }

    // OTP approved by Twilio
    const payload = {
      phone: formattedPhone,
      type: 'customer',
    };

    const token =
      this.jwtService.sign(
        payload,
        {
          expiresIn: '30m',
        },
      );

    return {
      token,
    };
  }
}