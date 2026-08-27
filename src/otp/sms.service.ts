import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private get accountSid(): string {
    return process.env.TWILIO_ACCOUNT_SID || '';
  }

  private get apiKey(): string {
    return process.env.TWILIO_API_KEY || '';
  }

  private get apiSecret(): string {
    return process.env.TWILIO_API_SECRET || '';
  }

  private get authToken(): string {
    return process.env.TWILIO_AUTH_TOKEN || '';
  }

  private get fromNumber(): string {
    return process.env.TWILIO_FROM_NUMBER || '';
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
   * Send SMS via Twilio REST API
   */
  async sendSms(phone: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const formattedRecipient = this.formatPhoneNumber(phone);
    const accountSid = this.accountSid;
    const apiKey = this.apiKey;
    const apiSecret = this.apiSecret;
    const authToken = this.authToken;
    const fromNumber = this.fromNumber;

    if (!accountSid || accountSid.includes('YOUR_TWILIO_ACCOUNT_SID_HERE')) {
      this.logger.warn('TWILIO_ACCOUNT_SID is not set. Skipping real SMS dispatch.');
      return { success: false, error: 'TWILIO_ACCOUNT_SID not configured' };
    }

    if (!fromNumber || fromNumber.includes('YOUR_TWILIO_FROM_NUMBER_HERE')) {
      this.logger.warn('TWILIO_FROM_NUMBER is not set. Skipping real SMS dispatch.');
      return { success: false, error: 'TWILIO_FROM_NUMBER not configured' };
    }

    // Determine auth credentials (either API Key + Secret or Account SID + Auth Token)
    let username = accountSid;
    let password = authToken;

    if (apiKey && apiSecret) {
      username = apiKey;
      password = apiSecret;
    }

    if (!password) {
      this.logger.warn('Neither TWILIO_API_SECRET nor TWILIO_AUTH_TOKEN is set. Skipping real SMS dispatch.');
      return { success: false, error: 'Twilio authentication credentials not configured' };
    }

    this.logger.log(`Dispatching SMS via Twilio to ${formattedRecipient}: "${message}"`);

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const body = new URLSearchParams();
      body.append('To', formattedRecipient);
      body.append('From', fromNumber);
      body.append('Body', message);

      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
        body: body.toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        this.logger.error(`Twilio API error (${response.status}): ${JSON.stringify(data)}`);
        return { success: false, error: data?.message || `HTTP ${response.status}` };
      }

      this.logger.log(`SMS successfully sent/queued via Twilio: ${data.sid}`);
      return { success: true, data };
    } catch (err: any) {
      this.logger.error(`Failed to send SMS via Twilio: ${err.message}`, err.stack);
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
