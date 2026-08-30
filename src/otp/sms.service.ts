// // import { Injectable, Logger } from '@nestjs/common';

// // @Injectable()
// // export class SmsService {
// //   private readonly logger = new Logger(SmsService.name);

// //   private get accountSid(): string {
// //     return process.env.TWILIO_ACCOUNT_SID || '';
// //   }

// //   private get apiKey(): string {
// //     return process.env.TWILIO_API_KEY || '';
// //   }

// //   private get apiSecret(): string {
// //     return process.env.TWILIO_API_SECRET || '';
// //   }

// //   private get authToken(): string {
// //     return process.env.TWILIO_AUTH_TOKEN || '';
// //   }

// //   private get fromNumber(): string {
// //     return process.env.TWILIO_FROM_NUMBER || '';
// //   }

// //   /**
// //    * Format phone number to E.164 standard (defaults to +91 if 10 digits)
// //    */
// //   formatPhoneNumber(phone: string): string {
// //     const cleaned = phone.replace(/\D/g, '');
// //     if (cleaned.length === 10) {
// //       return '+91' + cleaned;
// //     }
// //     if (cleaned.length === 12 && cleaned.startsWith('91')) {
// //       return '+' + cleaned;
// //     }
// //     if (phone.startsWith('+')) {
// //       return phone;
// //     }
// //     return '+' + cleaned;
// //   }

// //   /**
// //    * Send SMS via Twilio REST API
// //    */
// //   async sendSms(phone: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
// //     const formattedRecipient = this.formatPhoneNumber(phone);
// //     const accountSid = this.accountSid;
// //     const apiKey = this.apiKey;
// //     const apiSecret = this.apiSecret;
// //     const authToken = this.authToken;
// //     const fromNumber = this.fromNumber;

// //     if (!accountSid || accountSid.includes('YOUR_TWILIO_ACCOUNT_SID_HERE')) {
// //       this.logger.warn('TWILIO_ACCOUNT_SID is not set. Skipping real SMS dispatch.');
// //       return { success: false, error: 'TWILIO_ACCOUNT_SID not configured' };
// //     }

// //     if (!fromNumber || fromNumber.includes('YOUR_TWILIO_FROM_NUMBER_HERE')) {
// //       this.logger.warn('TWILIO_FROM_NUMBER is not set. Skipping real SMS dispatch.');
// //       return { success: false, error: 'TWILIO_FROM_NUMBER not configured' };
// //     }

// //     // Determine auth credentials (either API Key + Secret or Account SID + Auth Token)
// //     let username = accountSid;
// //     let password = authToken;

// //     if (apiKey && apiSecret) {
// //       username = apiKey;
// //       password = apiSecret;
// //     }

// //     if (!password) {
// //       this.logger.warn('Neither TWILIO_API_SECRET nor TWILIO_AUTH_TOKEN is set. Skipping real SMS dispatch.');
// //       return { success: false, error: 'Twilio authentication credentials not configured' };
// //     }

// //     this.logger.log(`Dispatching SMS via Twilio to ${formattedRecipient}: "${message}"`);

// //     try {
// //       const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

// //       const body = new URLSearchParams();
// //       body.append('To', formattedRecipient);
// //       body.append('From', fromNumber);
// //       body.append('Body', message);

// //       const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

// //       const response = await fetch(endpoint, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/x-www-form-urlencoded',
// //           'Authorization': authHeader,
// //         },
// //         body: body.toString(),
// //       });

// //       const data = await response.json().catch(() => null);

// //       if (!response.ok) {
// //         this.logger.error(`Twilio API error (${response.status}): ${JSON.stringify(data)}`);
// //         return { success: false, error: data?.message || `HTTP ${response.status}` };
// //       }

// //       this.logger.log(`SMS successfully sent/queued via Twilio: ${data.sid}`);
// //       return { success: true, data };
// //     } catch (err: any) {
// //       this.logger.error(`Failed to send SMS via Twilio: ${err.message}`, err.stack);
// //       return { success: false, error: err.message };
// //     }
// //   }

// //   async sendOtpSms(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
// //     const message = `Your OTP for THE EYE LAND Spin & Win is ${code}. Valid for 5 minutes. Do not share this OTP with anyone.`;
// //     return this.sendSms(phone, message);
// //   }

// //   async sendCouponSms(phone: string, offerName: string, couponCode: string): Promise<{ success: boolean; error?: string }> {
// //     const message = `Congratulations! You won "${offerName}" at THE EYE LAND Spin & Win! Your coupon code is ${couponCode}. Show this SMS at the store counter to redeem.`;
// //     return this.sendSms(phone, message);
// //   }
// // }
// import { Injectable, Logger } from '@nestjs/common';
// import twilio, { Twilio } from 'twilio';

// @Injectable()
// export class SmsService {
//   private readonly logger = new Logger(SmsService.name);

//   private readonly client: Twilio;
//   private readonly fromNumber: string;

//   constructor() {
//     const accountSid = process.env.TWILIO_ACCOUNT_SID;
//     const authToken = process.env.TWILIO_AUTH_TOKEN;
//     const fromNumber = process.env.TWILIO_FROM_NUMBER;

//     // Check Account SID
//     if (!accountSid) {
//       throw new Error(
//         'TWILIO_ACCOUNT_SID is not configured',
//       );
//     }

//     if (!accountSid.startsWith('AC')) {
//       throw new Error(
//         'TWILIO_ACCOUNT_SID must start with AC',
//       );
//     }

//     // Check Auth Token
//     if (!authToken) {
//       throw new Error(
//         'TWILIO_AUTH_TOKEN is not configured',
//       );
//     }

//     // Check From Number
//     if (!fromNumber) {
//       throw new Error(
//         'TWILIO_FROM_NUMBER is not configured',
//       );
//     }

//     // Initialize Twilio
//     this.client = twilio(
//       accountSid,
//       authToken,
//     );

//     this.fromNumber = fromNumber;

//     this.logger.log(
//       'Twilio SMS service initialized successfully',
//     );
//   }

//   /**
//    * Convert phone number to E.164 format
//    *
//    * 6380629995
//    *      ↓
//    * +916380629995
//    */
//   formatPhoneNumber(phone: string): string {
//     if (!phone) {
//       throw new Error(
//         'Phone number is required',
//       );
//     }

//     const trimmed = phone.trim();

//     // Already E.164 format
//     if (trimmed.startsWith('+')) {
//       return trimmed;
//     }

//     // Remove spaces, -, (, )
//     const cleaned = trimmed.replace(/\D/g, '');

//     // Indian 10 digit number
//     if (cleaned.length === 10) {
//       return `+91${cleaned}`;
//     }

//     // Indian number with 91
//     if (
//       cleaned.length === 12 &&
//       cleaned.startsWith('91')
//     ) {
//       return `+${cleaned}`;
//     }

//     // Other international number
//     return `+${cleaned}`;
//   }

//   /**
//    * Send SMS
//    */
//   async sendSms(
//     phone: string,
//     message: string,
//   ): Promise<{
//     success: boolean;
//     sid?: string;
//     status?: string;
//     error?: string;
//     code?: number;
//   }> {
//     try {
//       const formattedPhone =
//         this.formatPhoneNumber(phone);

//       if (!message || !message.trim()) {
//         return {
//           success: false,
//           error: 'SMS message cannot be empty',
//         };
//       }

//       this.logger.log(
//         `Sending SMS to ${formattedPhone}`,
//       );

//       const sms =
//         await this.client.messages.create({
//           body: message,
//           from: this.fromNumber,
//           to: formattedPhone,
//         });

//       this.logger.log(
//         `Twilio SMS created successfully`,
//       );

//       this.logger.log(
//         `Message SID: ${sms.sid}`,
//       );

//       this.logger.log(
//         `Message Status: ${sms.status}`,
//       );

//       return {
//         success: true,
//         sid: sms.sid,
//         status: sms.status,
//       };
//     } catch (error: any) {
//       this.logger.error(
//         `Twilio SMS failed: ${error.message}`,
//       );

//       if (error.code) {
//         this.logger.error(
//           `Twilio error code: ${error.code}`,
//         );
//       }

//       if (error.moreInfo) {
//         this.logger.error(
//           `Twilio information: ${error.moreInfo}`,
//         );
//       }

//       return {
//         success: false,
//         error:
//           error.message ||
//           'Twilio SMS failed',
//         code: error.code,
//       };
//     }
//   }

//   /**
//    * Send OTP SMS
//    */
//   // async sendOtpSms(
//   //   phone: string,
//   //   code: string,
//   // ) {
//   //   const message =
//   //     `Your OTP for THE EYE LAND Spin & Win is ${code}. ` +
//   //     `Valid for 5 minutes. Do not share this OTP with anyone.`;

//   //   return this.sendSms(
//   //     phone,
//   //     message,
//   //   );
//   // }

//   async sendOtpSms(
//   phone: string,
//   code: string,
// ) {
//   return this.sendSms(
//     phone,
//     'sms_2fa',
//   );
// }

//   /**
//    * Send Coupon SMS
//    */
//   async sendCouponSms(
//     phone: string,
//     offerName: string,
//     couponCode: string,
//   ) {
//     const message =
//       `Congratulations! You won "${offerName}" at THE EYE LAND Spin & Win! ` +
//       `Your coupon code is ${couponCode}. ` +
//       `Show this SMS at the store counter to redeem.`;

//     return this.sendSms(
//       phone,
//       message,
//     );
//   }
// }
import {
  Injectable,
  Logger,
} from '@nestjs/common';

import twilio, { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger =
    new Logger(SmsService.name);

  private readonly client: Twilio;
  private readonly verifyServiceSid: string;

  constructor() {
    const accountSid =
      process.env.TWILIO_ACCOUNT_SID?.trim();

    const authToken =
      process.env.TWILIO_AUTH_TOKEN?.trim();

    const verifyServiceSid =
      process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

    // Account SID
    if (!accountSid) {
      throw new Error(
        'TWILIO_ACCOUNT_SID is not configured',
      );
    }

    if (!accountSid.startsWith('AC')) {
      throw new Error(
        'TWILIO_ACCOUNT_SID must start with AC',
      );
    }

    // Auth Token
    if (!authToken) {
      throw new Error(
        'TWILIO_AUTH_TOKEN is not configured',
      );
    }

    // Verify Service SID
    if (!verifyServiceSid) {
      throw new Error(
        'TWILIO_VERIFY_SERVICE_SID is not configured',
      );
    }

    if (!verifyServiceSid.startsWith('VA')) {
      throw new Error(
        'TWILIO_VERIFY_SERVICE_SID must start with VA',
      );
    }

    // Initialize Twilio
    this.client = twilio(
      accountSid,
      authToken,
    );

    this.verifyServiceSid =
      verifyServiceSid;

    this.logger.log(
      'Twilio Verify service initialized successfully',
    );
  }

  /**
   * Convert phone number to E.164
   *
   * 6380629995
   *      ↓
   * +916380629995
   */
  formatPhoneNumber(
    phone: string,
  ): string {
    if (!phone) {
      throw new Error(
        'Phone number is required',
      );
    }

    const trimmed = phone.trim();

    // Already +91...
    if (trimmed.startsWith('+')) {
      return trimmed;
    }

    const cleaned =
      trimmed.replace(/\D/g, '');

    // 10 digit Indian number
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    // 91XXXXXXXXXX
    if (
      cleaned.length === 12 &&
      cleaned.startsWith('91')
    ) {
      return `+${cleaned}`;
    }

    return `+${cleaned}`;
  }

  /**
   * Send OTP using Twilio Verify
   *
   * Twilio generates the OTP.
   * Your application does NOT generate the OTP.
   */
  async sendOtpSms(
    phone: string,
  ): Promise<{
    success: boolean;
    sid?: string;
    status?: string;
    error?: string;
    code?: number;
  }> {
    try {
      const formattedPhone =
        this.formatPhoneNumber(phone);

      this.logger.log(
        `Sending Twilio Verify OTP to ${formattedPhone}`,
      );

      const verification =
        await this.client.verify.v2
          .services(this.verifyServiceSid)
          .verifications.create({
            to: formattedPhone,
            channel: 'sms',
          });

      this.logger.log(
        `Twilio Verify SMS sent successfully`,
      );

      this.logger.log(
        `Verification SID: ${verification.sid}`,
      );

      this.logger.log(
        `Verification status: ${verification.status}`,
      );

      return {
        success: true,
        sid: verification.sid,
        status: verification.status,
      };
    } catch (error: any) {
      this.logger.error(
        `Twilio Verify SMS failed: ${error.message}`,
      );

      if (error.code) {
        this.logger.error(
          `Twilio error code: ${error.code}`,
        );
      }

      if (error.moreInfo) {
        this.logger.error(
          `Twilio information: ${error.moreInfo}`,
        );
      }

      return {
        success: false,
        error:
          error.message ||
          'Twilio Verify SMS failed',
        code: error.code,
      };
    }
  }

  /**
   * Verify OTP using Twilio Verify
   */
  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{
    success: boolean;
    valid: boolean;
    status?: string;
    error?: string;
    code?: number;
  }> {
    try {
      const formattedPhone =
        this.formatPhoneNumber(phone);

      this.logger.log(
        `Verifying OTP for ${formattedPhone}`,
      );

      const verificationCheck =
        await this.client.verify.v2
          .services(this.verifyServiceSid)
          .verificationChecks.create({
            to: formattedPhone,
            code: code.trim(),
          });

      this.logger.log(
        `Twilio verification status: ${verificationCheck.status}`,
      );

      const approved =
        verificationCheck.status ===
        'approved';

      return {
        success: approved,
        valid: approved,
        status:
          verificationCheck.status,
      };
    } catch (error: any) {
      this.logger.error(
        `Twilio OTP verification failed: ${error.message}`,
      );

      if (error.code) {
        this.logger.error(
          `Twilio error code: ${error.code}`,
        );
      }

      if (error.moreInfo) {
        this.logger.error(
          `Twilio information: ${error.moreInfo}`,
        );
      }

      return {
        success: false,
        valid: false,
        error:
          error.message ||
          'OTP verification failed',
        code: error.code,
      };
    }
  }

  /**
   * Normal SMS
   *
   * Keep this only if you want to send
   * non-OTP SMS such as coupon messages.
   */
  async sendSms(
    phone: string,
    message: string,
  ) {
    try {
      const formattedPhone =
        this.formatPhoneNumber(phone);

      if (!message?.trim()) {
        return {
          success: false,
          error:
            'SMS message cannot be empty',
        };
      }

      const sms =
        await this.client.messages.create({
          body: message,
          from:
            process.env.TWILIO_FROM_NUMBER,
          to: formattedPhone,
        });

      return {
        success: true,
        sid: sms.sid,
        status: sms.status,
      };
    } catch (error: any) {
      this.logger.error(
        `Normal SMS failed: ${error.message}`,
      );

      return {
        success: false,
        error:
          error.message ||
          'SMS failed',
        code: error.code,
      };
    }
  }

  /**
   * Coupon SMS
   */
  async sendCouponSms(
    phone: string,
    offerName: string,
    couponCode: string,
  ) {
    const message =
      `Congratulations! You won "${offerName}" ` +
      `at THE EYE LAND Spin & Win! ` +
      `Your coupon code is ${couponCode}. ` +
      `Show this SMS at the store counter to redeem.`;

    return this.sendSms(
      phone,
      message,
    );
  }
}