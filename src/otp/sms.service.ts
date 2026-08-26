import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private get apiKey(): string {
    return process.env.TEXTBEE_API_KEY || '';
  }

  private get deviceId(): string {
    return process.env.TEXTBEE_DEVICE_ID || '';
  }

  /**
   * Format phone number to E.164 standard (defaults to +91 if 10 digits)
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    if (phone.startsWith('+')) {
      return phone;
    }
    return '+' + cleaned;
  }

  /**
   * Send SMS via TextBee Gateway API
   */
  async sendSms(phone: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const formattedRecipient = this.formatPhoneNumber(phone);
    const apiKey = this.apiKey;
    const deviceId = this.deviceId;

    if (!apiKey) {
      this.logger.warn('TEXTBEE_API_KEY is not set. Skipping real SMS dispatch.');
      return { success: false, error: 'TEXTBEE_API_KEY not configured' };
    }

    this.logger.log(`Dispatching SMS via TextBee to ${formattedRecipient}: "${message}"`);

    try {
      const endpoint = deviceId
        ? `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`
        : `https://api.textbee.dev/api/v1/gateway/send-sms`;

      const payload: any = {
        recipients: [formattedRecipient],
        message: message,
      };

      if (deviceId) {
        payload.deviceId = deviceId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        this.logger.error(`TextBee API error (${response.status}): ${JSON.stringify(data)}`);
        return { success: false, error: data?.message || `HTTP ${response.status}` };
      }

      this.logger.log(`SMS successfully queued via TextBee: ${JSON.stringify(data)}`);
      return { success: true, data };
    } catch (err: any) {
      this.logger.error(`Failed to send SMS via TextBee: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  async sendOtpSms(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    const message = `Your OTP for THE EYE LAND Spin & Win is ${code}. Valid for 5 minutes. Do not share this OTP with anyone.`;
    return this.sendSms(phone, message);
  }

  async sendCouponSms(phone: string, offerName: string, couponCode: string): Promise<{ success: boolean; error?: string }> {
    const message = `Congratulations! You won "${offerName}" at THE EYE LAND Spin & Win! Your coupon code is ${couponCode}. Show this SMS at the store counter to redeem.`;
    return this.sendSms(phone, message);
  }
}
