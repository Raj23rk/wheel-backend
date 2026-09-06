import { Injectable, Logger } from '@nestjs/common';

/**
 * SmsService is fully commented / disabled because Twilio SMS is not in use.
 * EmailService with Resend is used instead.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor() {
    this.logger.log('SmsService is inactive (Twilio SMS hidden/disabled)');
  }

  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return phone.startsWith('+') ? phone : '+' + cleaned;
  }

  async sendOtpSms(phone: string, code?: string): Promise<{ success: boolean; error?: string }> {
    this.logger.warn('SMS dispatch skipped: Twilio SMS is disabled.');
    return { success: false, error: 'SMS service is disabled' };
  }

  async verifyOtp(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    this.logger.warn('SMS OTP verify skipped: Twilio SMS is disabled.');
    return { success: false, error: 'SMS service is disabled' };
  }

  async sendCouponSms(phone: string, offerName: string, couponCode: string): Promise<{ success: boolean; error?: string }> {
    this.logger.warn('Coupon SMS skipped: Twilio SMS is disabled.');
    return { success: false, error: 'SMS service is disabled' };
  }
}

/* =========================================================================
   LEGACY TWILIO CODE (PREVIOUS IMPLEMENTATION - FULLY HIDDEN / COMMENTED OUT)
   =========================================================================

import twilio, { Twilio } from 'twilio';

export class LegacyTwilioSmsService {
  private readonly client: Twilio;
  private readonly verifyServiceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = twilio(accountSid, authToken);
    this.verifyServiceSid = verifyServiceSid;
  }
}
========================================================================= */