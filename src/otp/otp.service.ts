import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
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

  /**
   * Request OTP sent to customer's email (or phone fallback)
   */
  async requestOtp(
    identifierOrDto: string | { email?: string; phone?: string },
  ): Promise<{
    message: string;
    emailSent?: boolean;
    smsSent?: boolean;
    email?: string;
    code?: string;
  }> {
    let email: string | undefined;
    let phone: string | undefined;

    if (typeof identifierOrDto === 'string') {
      if (identifierOrDto.includes('@')) {
        email = identifierOrDto.trim().toLowerCase();
      } else {
        phone = identifierOrDto.trim();
      }
    } else if (identifierOrDto) {
      if (identifierOrDto.email) {
        email = identifierOrDto.email.trim().toLowerCase();
      } else if (identifierOrDto.phone && identifierOrDto.phone.includes('@')) {
        // In case older frontend sent email in 'phone' key
        email = identifierOrDto.phone.trim().toLowerCase();
      } else if (identifierOrDto.phone) {
        phone = identifierOrDto.phone.trim();
      }
    }

    if (!email && !phone) {
      throw new BadRequestException('Email address is required to receive OTP');
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Primary workflow: Email OTP
    if (email) {
      // Remove old OTP sessions for this email
      await this.otpSessionModel.deleteMany({ email });

      // Save new OTP session
      const otpSession = new this.otpSessionModel({
        email,
        code,
        expiresAt,
        verified: false,
      });
      await otpSession.save();

      this.logger.log(`OTP generated for email ${email}. Dispatching via Resend...`);

      // Send OTP via Resend email
      const emailResult = await this.emailService.sendOtpEmail(email, code);

      if (!emailResult.success) {
        this.logger.error(`Resend OTP sending failed for ${email}: ${emailResult.error}`);
        // Return clear message but don't crash if Resend free tier has restrictions
        return {
          message:
            emailResult.error ||
            'Failed to send OTP email. Please verify your email or check API key.',
          emailSent: false,
          email,
          code, // Included for local testing / fallback
        };
      }

      return {
        message: 'OTP sent successfully to your email address',
        emailSent: true,
        email,
      };
    }

    // =========================================================================
    // HIDE SMS CODE: Phone SMS sending is hidden / commented out per request
    // =========================================================================
    /*
    if (phone) {
      const formattedPhone = this.smsService.formatPhoneNumber(phone);
      await this.otpSessionModel.deleteMany({ phone: formattedPhone });
      const otpSession = new this.otpSessionModel({
        phone: formattedPhone,
        code,
        expiresAt,
        verified: false,
      });
      await otpSession.save();

      const result = await this.smsService.sendOtpSms(formattedPhone, code);
      return {
        message: result.success ? 'OTP sent successfully to mobile' : 'Failed to send SMS',
        smsSent: result.success,
      };
    }
    */

    throw new BadRequestException('Please provide a valid email address');
  }

  /**
   * Verify OTP code against email (or phone)
   */
  async verifyOtp(
    identifierOrDto: string | { email?: string; phone?: string },
    code?: string,
  ): Promise<{
    message: string;
    token: string;
    email?: string;
  }> {
    let email: string | undefined;
    let phone: string | undefined;
    let otpCode: string | undefined = code;

    if (typeof identifierOrDto === 'string') {
      if (identifierOrDto.includes('@')) {
        email = identifierOrDto.trim().toLowerCase();
      } else {
        phone = identifierOrDto.trim();
      }
    } else if (identifierOrDto) {
      if (identifierOrDto.email) {
        email = identifierOrDto.email.trim().toLowerCase();
      } else if (identifierOrDto.phone && identifierOrDto.phone.includes('@')) {
        email = identifierOrDto.phone.trim().toLowerCase();
      } else if (identifierOrDto.phone) {
        phone = identifierOrDto.phone.trim();
      }
    }

    if (!email && !phone) {
      throw new BadRequestException('Email address is required');
    }

    if (!otpCode) {
      throw new BadRequestException('OTP code is required');
    }

    otpCode = otpCode.trim();

    // Query unverified and unexpired OTP session
    const orConditions: any[] = [];
    if (email) {
      orConditions.push({ email });
    }
    if (phone) {
      orConditions.push({ phone });
    }

    const session = await this.otpSessionModel
      .findOne({
        $or: orConditions,
        code: otpCode,
        verified: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!session) {
      throw new BadRequestException('Invalid or expired OTP. Please try again.');
    }

    // Mark as verified
    session.verified = true;
    await session.save();

    // Generate JWT token with customer payload
    const payload = {
      email: session.email || email,
      phone: session.phone || phone,
      sub: session._id.toString(),
      type: 'customer',
    };

    try {
      const token = this.jwtService.sign(payload, {
        expiresIn: '1h',
      });

      return {
        message: 'OTP verified successfully',
        token,
        email: session.email || email,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to generate JWT token for OTP verification: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate customer authentication token',
      );
    }
  }
}