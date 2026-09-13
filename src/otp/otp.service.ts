// import {
//   Injectable,
//   BadRequestException,
//   InternalServerErrorException,
//   Logger,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { JwtService } from '@nestjs/jwt';
// import {
//   OtpSession,
//   OtpSessionDocument,
// } from '../schemas/otp-session.schema';
// import { EmailService } from './email.service';

// @Injectable()
// export class OtpService {
//   private readonly logger = new Logger(OtpService.name);

//   constructor(
//     @InjectModel(OtpSession.name)
//     private readonly otpSessionModel: Model<OtpSessionDocument>,
//     private readonly jwtService: JwtService,
//     private readonly emailService: EmailService,
//   ) {}

//   /**
//    * Request OTP sent to customer's email (or phone fallback)
//    */
//   async requestOtp(
//     identifierOrDto: string | { email?: string; phone?: string },
//   ): Promise<{
//     message: string;
//     emailSent?: boolean;
//     smsSent?: boolean;
//     email?: string;
//     code?: string;
//   }> {
//     let email: string | undefined;
//     let phone: string | undefined;

//     if (typeof identifierOrDto === 'string') {
//       if (identifierOrDto.includes('@')) {
//         email = identifierOrDto.trim().toLowerCase();
//       } else {
//         phone = identifierOrDto.trim();
//       }
//     } else if (identifierOrDto) {
//       if (identifierOrDto.email) {
//         email = identifierOrDto.email.trim().toLowerCase();
//       } else if (identifierOrDto.phone && identifierOrDto.phone.includes('@')) {
//         // In case older frontend sent email in 'phone' key
//         email = identifierOrDto.phone.trim().toLowerCase();
//       } else if (identifierOrDto.phone) {
//         phone = identifierOrDto.phone.trim();
//       }
//     }

//     if (!email && !phone) {
//       throw new BadRequestException('Email address is required to receive OTP');
//     }

//     // Generate 6-digit OTP
//     const code = Math.floor(100000 + Math.random() * 900000).toString();

//     // 10-minute expiry
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     // Primary workflow: Email OTP
//     if (email) {
//       // Remove old OTP sessions for this email
//       await this.otpSessionModel.deleteMany({ email });

//       // Save new OTP session
//       const otpSession = new this.otpSessionModel({
//         email,
//         code,
//         expiresAt,
//         verified: false,
//       });
//       await otpSession.save();

//       this.logger.log(`OTP generated for email ${email}. Dispatching via Resend...`);

//       // Send OTP via Resend email
//       const emailResult = await this.emailService.sendOtpEmail(email, code);

//       if (!emailResult.success) {
//         this.logger.error(`Resend OTP sending failed for ${email}: ${emailResult.error}`);
//         // Return clear message but don't crash if Resend free tier has restrictions
//         return {
//           message:
//             emailResult.error ||
//             'Failed to send OTP email. Please verify your email or check API key.',
//           emailSent: false,
//           email,
//           code, // Included for local testing / fallback
//         };
//       }

//       return {
//         message: 'OTP sent successfully to your email address',
//         emailSent: true,
//         email,
//       };
//     }

//     // =========================================================================
//     // HIDE SMS CODE: Phone SMS sending is hidden / commented out per request
//     // =========================================================================
//     /*
//     if (phone) {
//       const formattedPhone = this.smsService.formatPhoneNumber(phone);
//       await this.otpSessionModel.deleteMany({ phone: formattedPhone });
//       const otpSession = new this.otpSessionModel({
//         phone: formattedPhone,
//         code,
//         expiresAt,
//         verified: false,
//       });
//       await otpSession.save();

//       const result = await this.smsService.sendOtpSms(formattedPhone, code);
//       return {
//         message: result.success ? 'OTP sent successfully to mobile' : 'Failed to send SMS',
//         smsSent: result.success,
//       };
//     }
//     */

//     throw new BadRequestException('Please provide a valid email address');
//   }

//   /**
//    * Verify OTP code against email (or phone)
//    */
//   async verifyOtp(
//     identifierOrDto: string | { email?: string; phone?: string },
//     code?: string,
//   ): Promise<{
//     message: string;
//     token: string;
//     email?: string;
//   }> {
//     let email: string | undefined;
//     let phone: string | undefined;
//     let otpCode: string | undefined = code;

//     if (typeof identifierOrDto === 'string') {
//       if (identifierOrDto.includes('@')) {
//         email = identifierOrDto.trim().toLowerCase();
//       } else {
//         phone = identifierOrDto.trim();
//       }
//     } else if (identifierOrDto) {
//       if (identifierOrDto.email) {
//         email = identifierOrDto.email.trim().toLowerCase();
//       } else if (identifierOrDto.phone && identifierOrDto.phone.includes('@')) {
//         email = identifierOrDto.phone.trim().toLowerCase();
//       } else if (identifierOrDto.phone) {
//         phone = identifierOrDto.phone.trim();
//       }
//     }

//     if (!email && !phone) {
//       throw new BadRequestException('Email address is required');
//     }

//     if (!otpCode) {
//       throw new BadRequestException('OTP code is required');
//     }

//     otpCode = otpCode.trim();

//     // Query unverified and unexpired OTP session
//     const orConditions: any[] = [];
//     if (email) {
//       orConditions.push({ email });
//     }
//     if (phone) {
//       orConditions.push({ phone });
//     }

//     const session = await this.otpSessionModel
//       .findOne({
//         $or: orConditions,
//         code: otpCode,
//         verified: false,
//         expiresAt: { $gt: new Date() },
//       })
//       .sort({ createdAt: -1 })
//       .exec();

//     if (!session) {
//       throw new BadRequestException('Invalid or expired OTP. Please try again.');
//     }

//     // Mark as verified
//     session.verified = true;
//     await session.save();

//     // Generate JWT token with customer payload
//     const payload = {
//       email: session.email || email,
//       phone: session.phone || phone,
//       sub: session._id.toString(),
//       type: 'customer',
//     };

//     try {
//       const token = this.jwtService.sign(payload, {
//         expiresIn: '1h',
//       });

//       return {
//         message: 'OTP verified successfully',
//         token,
//         email: session.email || email,
//       };
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to generate JWT token for OTP verification: ${error.message}`,
//         error.stack,
//       );
//       throw new InternalServerErrorException(
//         'Failed to generate customer authentication token',
//       );
//     }
//   }
// }

// import {
//   Injectable,
//   BadRequestException,
//   InternalServerErrorException,
//   Logger,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { JwtService } from '@nestjs/jwt';
// import { randomInt } from 'crypto';

// import {
//   OtpSession,
//   OtpSessionDocument,
// } from '../schemas/otp-session.schema';

// import { EmailService } from './email.service';

// @Injectable()
// export class OtpService {
//   private readonly logger = new Logger(OtpService.name);

//   constructor(
//     @InjectModel(OtpSession.name)
//     private readonly otpSessionModel: Model<OtpSessionDocument>,

//     private readonly jwtService: JwtService,

//     private readonly emailService: EmailService,
//   ) {}

//   /**
//    * Request OTP via email
//    */
//   async requestOtp(
//     identifierOrDto: string | { email?: string; phone?: string },
//   ): Promise<{
//     message: string;
//     emailSent: boolean;
//     email: string;
//   }> {
//     let email: string | undefined;

//     /*
//      * Support both:
//      *
//      * "customer@gmail.com"
//      *
//      * {
//      *   email: "customer@gmail.com"
//      * }
//      *
//      * Also support old frontend which may send email
//      * inside the phone field.
//      */

//     if (typeof identifierOrDto === 'string') {
//       const identifier = identifierOrDto.trim().toLowerCase();

//       if (identifier.includes('@')) {
//         email = identifier;
//       }
//     } else if (identifierOrDto) {
//       if (identifierOrDto.email) {
//         email = identifierOrDto.email.trim().toLowerCase();
//       } else if (
//         identifierOrDto.phone &&
//         identifierOrDto.phone.includes('@')
//       ) {
//         // Backward compatibility
//         email = identifierOrDto.phone.trim().toLowerCase();
//       }
//     }

//     // Email is required
//     if (!email) {
//       throw new BadRequestException(
//         'Please provide a valid email address',
//       );
//     }

//     /*
//      * Generate secure 6-digit OTP
//      */
//     const code = randomInt(100000, 1000000).toString();

//     /*
//      * OTP expires after 10 minutes
//      */
//     const expiresAt = new Date(
//       Date.now() + 10 * 60 * 1000,
//     );

//     try {
//       /*
//        * Remove previous OTP sessions
//        * for this email.
//        */
//       await this.otpSessionModel.deleteMany({
//         email,
//       });

//       /*
//        * Save new OTP
//        */
//       const otpSession = new this.otpSessionModel({
//         email,
//         code,
//         expiresAt,
//         verified: false,
//       });

//       await otpSession.save();

//       this.logger.log(
//         `OTP generated for ${email}. Sending email...`,
//       );

//       /*
//        * Send OTP using Resend
//        */
//       const emailResult =
//         await this.emailService.sendOtpEmail(
//           email,
//           code,
//         );

//       /*
//        * If email failed, remove OTP session
//        * so it cannot be used.
//        */
//       if (!emailResult.success) {
//         await this.otpSessionModel.deleteMany({
//           email,
//         });

//         this.logger.error(
//           `Failed to send OTP to ${email}: ${emailResult.error}`,
//         );

//         throw new InternalServerErrorException(
//           emailResult.error ||
//             'Failed to send OTP email. Please try again.',
//         );
//       }

//       this.logger.log(
//         `OTP email sent successfully to ${email}`,
//       );

//       return {
//         message:
//           'OTP sent successfully to your email address',
//         emailSent: true,
//         email,
//       };
//     } catch (error: any) {
//       /*
//        * Don't convert NestJS HTTP exceptions
//        * into generic 500 errors.
//        */
//       if (
//         error instanceof BadRequestException ||
//         error instanceof InternalServerErrorException
//       ) {
//         throw error;
//       }

//       this.logger.error(
//         `OTP request failed for ${email}: ${error.message}`,
//         error.stack,
//       );

//       throw new InternalServerErrorException(
//         'Failed to send OTP. Please try again.',
//       );
//     }
//   }

//   /**
//    * Verify OTP
//    */
//   async verifyOtp(
//     identifierOrDto: string | { email?: string; phone?: string },
//     code?: string,
//   ): Promise<{
//     message: string;
//     token: string;
//     email: string;
//   }> {
//     let email: string | undefined;
//     let otpCode: string | undefined = code;

//     /*
//      * Extract email
//      */
//     if (typeof identifierOrDto === 'string') {
//       const identifier =
//         identifierOrDto.trim().toLowerCase();

//       if (identifier.includes('@')) {
//         email = identifier;
//       }
//     } else if (identifierOrDto) {
//       if (identifierOrDto.email) {
//         email =
//           identifierOrDto.email.trim().toLowerCase();
//       } else if (
//         identifierOrDto.phone &&
//         identifierOrDto.phone.includes('@')
//       ) {
//         // Backward compatibility
//         email =
//           identifierOrDto.phone.trim().toLowerCase();
//       }
//     }

//     if (!email) {
//       throw new BadRequestException(
//         'Please provide a valid email address',
//       );
//     }

//     /*
//      * Validate OTP
//      */
//     if (!otpCode) {
//       throw new BadRequestException(
//         'OTP code is required',
//       );
//     }

//     otpCode = otpCode.trim();

//     if (!/^\d{6}$/.test(otpCode)) {
//       throw new BadRequestException(
//         'OTP must be a 6-digit number',
//       );
//     }

//     /*
//      * Find latest valid OTP
//      */
//     const session = await this.otpSessionModel
//       .findOne({
//         email,
//         code: otpCode,
//         verified: false,
//         expiresAt: {
//           $gt: new Date(),
//         },
//       })
//       .sort({
//         createdAt: -1,
//       })
//       .exec();

//     /*
//      * OTP not found / expired / already used
//      */
//     if (!session) {
//       throw new BadRequestException(
//         'Invalid or expired OTP. Please request a new OTP.',
//       );
//     }

//     /*
//      * Mark OTP as verified
//      */
//     session.verified = true;

//     await session.save();

//     /*
//      * Create JWT payload
//      */
//     const payload = {
//       email: session.email,
//       sub: session._id.toString(),
//       type: 'customer',
//     };

//     try {
//       const token = this.jwtService.sign(
//         payload,
//         {
//           expiresIn: '1h',
//         },
//       );

//       this.logger.log(
//         `OTP verified successfully for ${email}`,
//       );

//       return {
//         message:
//           'OTP verified successfully',
//         token,
//         email: session.email,
//       };
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to generate JWT for ${email}: ${error.message}`,
//         error.stack,
//       );

//       throw new InternalServerErrorException(
//         'Failed to generate customer authentication token',
//       );
//     }
//   }
// }

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';

import {
  OtpSession,
  OtpSessionDocument,
} from '../schemas/otp-session.schema';

import { EmailService } from './email.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(OtpSession.name)
    private readonly otpSessionModel: Model<OtpSessionDocument>,

    private readonly jwtService: JwtService,

    private readonly emailService: EmailService,
  ) {}

  // ============================================================
  // REQUEST OTP
  // ============================================================

  /**
   * Request OTP via email.
   *
   * OTP is sent ONLY to the customer email.
   */
  async requestOtp(
    identifierOrDto: string | { email?: string; phone?: string },
  ): Promise<{
    message: string;
    emailSent: boolean;
    email: string;
  }> {
    let email: string | undefined;

    /*
     * Support:
     *
     * "customer@gmail.com"
     *
     * OR
     *
     * {
     *   email: "customer@gmail.com"
     * }
     *
     * Also support old frontend:
     *
     * {
     *   phone: "customer@gmail.com"
     * }
     */

    if (typeof identifierOrDto === 'string') {
      const identifier =
        identifierOrDto.trim().toLowerCase();

      if (identifier.includes('@')) {
        email = identifier;
      }
    } else if (identifierOrDto) {
      if (identifierOrDto.email) {
        email =
          identifierOrDto.email.trim().toLowerCase();
      } else if (
        identifierOrDto.phone &&
        identifierOrDto.phone.includes('@')
      ) {
        // Backward compatibility
        email =
          identifierOrDto.phone.trim().toLowerCase();
      }
    }

    // ----------------------------------------------------------
    // Validate email
    // ----------------------------------------------------------

    if (!email) {
      throw new BadRequestException(
        'Please provide a valid email address',
      );
    }

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new BadRequestException(
        'Please provide a valid email address',
      );
    }

    // ----------------------------------------------------------
    // Generate secure 6-digit OTP
    // ----------------------------------------------------------

    const code =
      randomInt(100000, 1000000).toString();

    // ----------------------------------------------------------
    // OTP expires after 10 minutes
    // ----------------------------------------------------------

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    try {
      // --------------------------------------------------------
      // Delete previous OTPs for this customer
      // --------------------------------------------------------

      await this.otpSessionModel.deleteMany({
        email,
      });

      // --------------------------------------------------------
      // Save new OTP session
      // --------------------------------------------------------

      const otpSession =
        new this.otpSessionModel({
          email,
          code,
          expiresAt,
          verified: false,
        });

      await otpSession.save();

      this.logger.log(
        `OTP generated for ${email}`,
      );

      // --------------------------------------------------------
      // Send OTP ONLY to customer
      // --------------------------------------------------------

      const emailResult =
        await this.emailService.sendOtpEmail(
          email,
          code,
        );

      // --------------------------------------------------------
      // Email failed
      // --------------------------------------------------------

      if (!emailResult.success) {
        // Delete OTP so failed email cannot be used
        await this.otpSessionModel.deleteMany({
          email,
        });

        this.logger.error(
          `Failed to send OTP to ${email}: ${emailResult.error}`,
        );

        throw new InternalServerErrorException(
          emailResult.error ||
            'Failed to send OTP email. Please try again.',
        );
      }

      // --------------------------------------------------------
      // Email successfully sent
      // --------------------------------------------------------

      this.logger.log(
        `OTP email sent successfully to ${email}`,
      );

      return {
        message:
          'OTP sent successfully to your email address',

        emailSent: true,

        email,
      };
    } catch (error: any) {
      // --------------------------------------------------------
      // Keep NestJS HTTP exceptions
      // --------------------------------------------------------

      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error(
        `OTP request failed for ${email}: ${error?.message}`,
        error?.stack,
      );

      throw new InternalServerErrorException(
        'Failed to send OTP. Please try again.',
      );
    }
  }

  // ============================================================
  // VERIFY OTP
  // ============================================================

  /**
   * Verify customer OTP and create JWT.
   */
  async verifyOtp(
    identifierOrDto:
      | string
      | { email?: string; phone?: string },

    code?: string,
  ): Promise<{
    message: string;
    token: string;
    email: string;
  }> {
    let email: string | undefined;

    let otpCode: string | undefined =
      code;

    // ----------------------------------------------------------
    // Extract email
    // ----------------------------------------------------------

    if (typeof identifierOrDto === 'string') {
      const identifier =
        identifierOrDto
          .trim()
          .toLowerCase();

      if (identifier.includes('@')) {
        email = identifier;
      }
    } else if (identifierOrDto) {
      if (identifierOrDto.email) {
        email =
          identifierOrDto.email
            .trim()
            .toLowerCase();
      } else if (
        identifierOrDto.phone &&
        identifierOrDto.phone.includes('@')
      ) {
        // Backward compatibility
        email =
          identifierOrDto.phone
            .trim()
            .toLowerCase();
      }
    }

    // ----------------------------------------------------------
    // Validate email
    // ----------------------------------------------------------

    if (!email) {
      throw new BadRequestException(
        'Please provide a valid email address',
      );
    }

    // ----------------------------------------------------------
    // Validate OTP exists
    // ----------------------------------------------------------

    if (!otpCode) {
      throw new BadRequestException(
        'OTP code is required',
      );
    }

    otpCode = otpCode.trim();

    // ----------------------------------------------------------
    // Validate OTP format
    // ----------------------------------------------------------

    if (!/^\d{6}$/.test(otpCode)) {
      throw new BadRequestException(
        'OTP must be a 6-digit number',
      );
    }

    // ----------------------------------------------------------
    // Find latest valid OTP
    // ----------------------------------------------------------

    const session =
      await this.otpSessionModel
        .findOne({
          email,

          code: otpCode,

          verified: false,

          expiresAt: {
            $gt: new Date(),
          },
        })
        .sort({
          createdAt: -1,
        })
        .exec();

    // ----------------------------------------------------------
    // OTP invalid / expired / already used
    // ----------------------------------------------------------

    if (!session) {
      throw new BadRequestException(
        'Invalid or expired OTP. Please request a new OTP.',
      );
    }

    // ----------------------------------------------------------
    // Mark OTP as verified
    // ----------------------------------------------------------

    session.verified = true;

    await session.save();

    this.logger.log(
      `OTP verified successfully for ${email}`,
    );

    // ----------------------------------------------------------
    // Create JWT payload
    // ----------------------------------------------------------

    const payload = {
      email: session.email,

      sub: session._id.toString(),

      type: 'customer',
    };

    // ----------------------------------------------------------
    // Generate JWT
    // ----------------------------------------------------------

    try {
      const token =
        this.jwtService.sign(
          payload,
          {
            expiresIn: '1h',
          },
        );

      this.logger.log(
        `Customer JWT generated for ${email}`,
      );

      return {
        message:
          'OTP verified successfully',

        token,

        email: session.email,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to generate JWT for ${email}: ${error?.message}`,
        error?.stack,
      );

      throw new InternalServerErrorException(
        'Failed to generate customer authentication token',
      );
    }
  }
}