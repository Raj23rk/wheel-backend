// import { Injectable, Logger } from '@nestjs/common';
// import { Resend } from 'resend';

// @Injectable()
// export class EmailService {
//   private readonly logger = new Logger(EmailService.name);
//   private resend: Resend | null = null;

//   constructor() {
//     const apiKey =
//       process.env.RESEND_API_KEY ;

//     if (apiKey) {
//       this.resend = new Resend(apiKey);
//       this.logger.log('Resend Email service initialized successfully');
//     } else {
//       this.logger.warn('RESEND_API_KEY is not configured');
//     }
//   }

//   private get fromAddress(): string {
//     const rawFrom = process.env.MAIL_FROM || 'onboarding@resend.dev';
//     if (rawFrom.includes('<')) {
//       return rawFrom;
//     }
//     return `THE EYE LAND <${rawFrom}>`;
//   }

//   /**
//    * Send 6-digit OTP code to the customer's email
//    */
//   async sendOtpEmail(
//     toEmail: string,
//     code: string,
//   ): Promise<{ success: boolean; data?: any; error?: string }> {
//     const targetEmail = toEmail.trim().toLowerCase();

//     if (!this.resend) {
//       this.logger.error('Resend client is not initialized');
//       return { success: false, error: 'Resend API key not configured' };
//     }

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <title>Your OTP for THE EYE LAND Spin & Win</title>
//         <style>
//           body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
//           .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
//           .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
//           .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
//           .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.85; }
//           .content { padding: 30px 25px; text-align: center; color: #333333; }
//           .otp-badge { display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e3c72; background: #eef2fa; border: 2px dashed #2a5298; border-radius: 8px; padding: 12px 28px; margin: 25px 0; }
//           .info-text { font-size: 14px; color: #666666; line-height: 1.6; margin: 15px 0; }
//           .warning { font-size: 12px; color: #e65100; background: #fff3e0; border-radius: 6px; padding: 10px; margin-top: 20px; display: inline-block; }
//           .footer { background: #f8f9fc; padding: 15px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>THE EYE LAND</h1>
//             <p>Spin & Win Lucky Wheel Verification</p>
//           </div>
//           <div class="content">
//             <p style="font-size: 16px; margin-bottom: 5px;">Hello,</p>
//             <p class="info-text">Please use the verification code below to verify your email and spin the lucky wheel to win exclusive offers:</p>
//             <div class="otp-badge">${code}</div>
//             <p class="info-text">This OTP code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
//             <div class="warning">⚠️ If you did not request this OTP, please ignore this email.</div>
//           </div>
//           <div class="footer">
//             &copy; ${new Date().getFullYear()} THE EYE LAND. All rights reserved.
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     this.logger.log(`Dispatching OTP email to ${targetEmail} via Resend...`);

//     try {
//       const response = await this.resend.emails.send({
//         from: this.fromAddress,
//         to: targetEmail,
//         subject: `Your Verification Code: ${code} - THE EYE LAND`,
//         html: htmlContent,
//       });

//       if (response.error) {
//         this.logger.error(`Resend send error: ${JSON.stringify(response.error)}`);
//         return { success: false, error: response.error.message };
//       }

//       this.logger.log(`OTP email sent successfully to ${targetEmail} (ID: ${response.data?.id})`);
//       return { success: true, data: response.data };
//     } catch (err: any) {
//       this.logger.error(`Failed to send OTP email via Resend: ${err.message}`, err.stack);
//       return { success: false, error: err.message };
//     }
//   }

//   /**
//    * Send winning offer and coupon code email to the customer
//    * Valid for 10 days
//    */
//   async sendOfferEmail(
//     toEmail: string,
//     offerName: string,
//     couponCode: string,
//     validityDays: number = 10,
//     description?: string,
//     terms?: string,
//   ): Promise<{ success: boolean; data?: any; error?: string }> {
//     const targetEmail = toEmail.trim().toLowerCase();

//     if (!this.resend) {
//       this.logger.error('Resend client is not initialized');
//       return { success: false, error: 'Resend API key not configured' };
//     }

//     const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
//     const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <title>Congratulations on Winning at THE EYE LAND!</title>
//         <style>
//           body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
//           .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
//           .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
//           .header h1 { margin: 0; font-size: 26px; }
//           .header p { margin: 5px 0 0; font-size: 15px; opacity: 0.95; }
//           .content { padding: 30px 25px; text-align: center; color: #333333; }
//           .prize-box { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0; }
//           .prize-title { font-size: 22px; font-weight: 700; color: #15803d; margin: 0 0 10px; }
//           .coupon-badge { display: inline-block; font-size: 24px; font-weight: 700; letter-spacing: 3px; color: #1e3c72; background: #ffffff; border: 2px dashed #11998e; border-radius: 8px; padding: 10px 24px; margin: 15px 0; }
//           .validity-tag { display: inline-block; font-size: 14px; font-weight: 600; color: #b91c1c; background: #fee2e2; border-radius: 20px; padding: 6px 16px; margin-top: 10px; }
//           .instructions { font-size: 14px; color: #555555; line-height: 1.6; margin: 20px 0; text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; }
//           .terms { font-size: 12px; color: #888888; line-height: 1.5; margin-top: 15px; text-align: left; }
//           .footer { background: #f8f9fc; padding: 15px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>🎉 Congratulations! 🎉</h1>
//             <p>You are a Lucky Winner at THE EYE LAND Spin & Win</p>
//           </div>
//           <div class="content">
//             <p style="font-size: 16px;">Great news! You have won an exclusive offer on the lucky wheel:</p>
//             <div class="prize-box">
//               <div class="prize-title">${offerName}</div>
//               ${description ? `<p style="font-size: 14px; color: #4b5563; margin: 5px 0 15px;">${description}</p>` : ''}
//               <div>Your Coupon Code:</div>
//               <div class="coupon-badge">${couponCode}</div>
//               <br/>
//               <div class="validity-tag">⏰ Offer Valid for ${validityDays} Days Only (Expires: ${formattedExpiry})</div>
//             </div>
//             <div class="instructions">
//               <strong>How to Redeem:</strong><br>
//               1. Visit our store at THE EYE LAND.<br>
//               2. Present this email or coupon code <strong>${couponCode}</strong> at the billing counter.<br>
//               3. Enjoy your exclusive discount!
//             </div>
//             ${terms ? `<div class="terms"><strong>Terms & Conditions:</strong><br>${terms}</div>` : ''}
//           </div>
//           <div class="footer">
//             &copy; ${new Date().getFullYear()} THE EYE LAND. All rights reserved.
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     this.logger.log(`Dispatching winning offer email to ${targetEmail} via Resend...`);

//     try {
//       const response = await this.resend.emails.send({
//         from: this.fromAddress,
//         to: targetEmail,
//         subject: `🎉 Congratulations! You won "${offerName}" at THE EYE LAND!`,
//         html: htmlContent,
//       });

//       if (response.error) {
//         this.logger.error(`Resend offer email error: ${JSON.stringify(response.error)}`);
//         return { success: false, error: response.error.message };
//       }

//       this.logger.log(`Offer email sent successfully to ${targetEmail} (ID: ${response.data?.id})`);
//       return { success: true, data: response.data };
//     } catch (err: any) {
//       this.logger.error(`Failed to send offer email via Resend: ${err.message}`, err.stack);
//       return { success: false, error: err.message };
//     }
//   }
// }
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.resend = null;
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email service is disabled.',
      );
      return;
    }

    this.resend = new Resend(apiKey);

    this.logger.log('Resend Email service initialized successfully');
  }

  private get fromAddress(): string {
    return (
      process.env.MAIL_FROM ||
      'THE EYE LAND <noreply@theeyelandopticals.com>'
    );
  }

  /**
   * Escape HTML to prevent HTML injection in email content.
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(
    toEmail: string,
    code: string,
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const targetEmail = toEmail.trim().toLowerCase();
    const otp = String(code).trim();

    if (!this.resend) {
      this.logger.error('Resend client is not initialized');
      return {
        success: false,
        error: 'Resend API key not configured',
      };
    }

    if (!targetEmail) {
      return {
        success: false,
        error: 'Recipient email is required',
      };
    }

    if (!otp) {
      return {
        success: false,
        error: 'OTP code is required',
      };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your OTP - THE EYE LAND</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 20px;
          }

          .container {
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
          }

          .header {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 24px;
          }

          .header p {
            margin: 8px 0 0;
            font-size: 14px;
          }

          .content {
            padding: 30px 25px;
            text-align: center;
            color: #333333;
          }

          .otp-badge {
            display: inline-block;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #1e3c72;
            background: #eef2fa;
            border: 2px dashed #2a5298;
            border-radius: 8px;
            padding: 12px 28px;
            margin: 25px 0;
          }

          .info-text {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
          }

          .warning {
            font-size: 12px;
            color: #e65100;
            background: #fff3e0;
            border-radius: 6px;
            padding: 10px;
            margin-top: 20px;
          }

          .footer {
            background: #f8f9fc;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #888888;
            border-top: 1px solid #eeeeee;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <h1>THE EYE LAND</h1>
            <p>Spin & Win Lucky Wheel Verification</p>
          </div>

          <div class="content">

            <p style="font-size:16px;">
              Hello,
            </p>

            <p class="info-text">
              Please use the verification code below to verify your email
              and continue with THE EYE LAND Spin & Win.
            </p>

            <div class="otp-badge">
              ${this.escapeHtml(otp)}
            </div>

            <p class="info-text">
              This OTP is valid for <strong>10 minutes</strong>.
              Please do not share this code with anyone.
            </p>

            <div class="warning">
              ⚠️ If you did not request this OTP, please ignore this email.
            </div>

          </div>

          <div class="footer">
            &copy; ${new Date().getFullYear()}
            THE EYE LAND. All rights reserved.
          </div>

        </div>
      </body>
      </html>
    `;

    this.logger.log(
      `Sending OTP email to ${targetEmail} from ${this.fromAddress}`,
    );

    try {
      const response = await this.resend.emails.send({
        from: this.fromAddress,
        to: [targetEmail],
        subject: `Your Verification Code: ${otp} - THE EYE LAND`,
        html: htmlContent,
      });

      if (response.error) {
        this.logger.error(
          `Resend OTP error: ${JSON.stringify(response.error)}`,
        );

        return {
          success: false,
          error: response.error.message,
        };
      }

      this.logger.log(
        `OTP email sent successfully to ${targetEmail}. ID: ${response.data?.id}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send OTP email: ${error?.message}`,
        error?.stack,
      );

      return {
        success: false,
        error: error?.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send winning offer / coupon email
   */
  async sendOfferEmail(
    toEmail: string,
    offerName: string,
    couponCode: string,
    validityDays: number = 10,
    description?: string,
    terms?: string,
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const targetEmail = toEmail.trim().toLowerCase();

    if (!this.resend) {
      this.logger.error('Resend client is not initialized');

      return {
        success: false,
        error: 'Resend API key not configured',
      };
    }

    if (!targetEmail) {
      return {
        success: false,
        error: 'Recipient email is required',
      };
    }

    const safeOfferName = this.escapeHtml(offerName);
    const safeCouponCode = this.escapeHtml(couponCode);
    const safeDescription = description
      ? this.escapeHtml(description)
      : '';
    const safeTerms = terms
      ? this.escapeHtml(terms)
      : '';

    const expiryDate = new Date(
      Date.now() + validityDays * 24 * 60 * 60 * 1000,
    );

    const formattedExpiry = expiryDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Congratulations - THE EYE LAND</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 20px;
          }

          .container {
            max-width: 550px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
          }

          .header {
            background: linear-gradient(135deg, #11998e, #38ef7d);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 26px;
          }

          .header p {
            margin: 8px 0 0;
            font-size: 15px;
          }

          .content {
            padding: 30px 25px;
            text-align: center;
            color: #333333;
          }

          .prize-box {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
          }

          .prize-title {
            font-size: 22px;
            font-weight: bold;
            color: #15803d;
            margin-bottom: 10px;
          }

          .coupon-badge {
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            color: #1e3c72;
            background: #ffffff;
            border: 2px dashed #11998e;
            border-radius: 8px;
            padding: 10px 24px;
            margin: 15px 0;
          }

          .validity-tag {
            display: inline-block;
            font-size: 14px;
            font-weight: 600;
            color: #b91c1c;
            background: #fee2e2;
            border-radius: 20px;
            padding: 6px 16px;
            margin-top: 10px;
          }

          .instructions {
            font-size: 14px;
            color: #555555;
            line-height: 1.6;
            margin: 20px 0;
            text-align: left;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
          }

          .terms {
            font-size: 12px;
            color: #888888;
            line-height: 1.5;
            margin-top: 15px;
            text-align: left;
          }

          .footer {
            background: #f8f9fc;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #888888;
            border-top: 1px solid #eeeeee;
          }
        </style>
      </head>

      <body>

        <div class="container">

          <div class="header">
            <h1>🎉 Congratulations! 🎉</h1>
            <p>You are a Lucky Winner at THE EYE LAND</p>
          </div>

          <div class="content">

            <p style="font-size:16px;">
              Great news! You have won an exclusive offer.
            </p>

            <div class="prize-box">

              <div class="prize-title">
                ${safeOfferName}
              </div>

              ${
                safeDescription
                  ? `
                    <p style="font-size:14px;color:#4b5563;">
                      ${safeDescription}
                    </p>
                  `
                  : ''
              }

              <div>Your Coupon Code:</div>

              <div class="coupon-badge">
                ${safeCouponCode}
              </div>

              <br />

              <div class="validity-tag">
                ⏰ Valid for ${validityDays} days
                <br />
                Expires: ${formattedExpiry}
              </div>

            </div>

            <div class="instructions">

              <strong>How to Redeem:</strong>
              <br /><br />

              1. Visit THE EYE LAND store.
              <br />

              2. Present this email or coupon code
              <strong>${safeCouponCode}</strong>
              at the billing counter.
              <br />

              3. Enjoy your exclusive offer!

            </div>

            ${
              safeTerms
                ? `
                  <div class="terms">
                    <strong>Terms & Conditions:</strong>
                    <br />
                    ${safeTerms}
                  </div>
                `
                : ''
            }

          </div>

          <div class="footer">
            &copy; ${new Date().getFullYear()}
            THE EYE LAND. All rights reserved.
          </div>

        </div>

      </body>
      </html>
    `;

    this.logger.log(
      `Sending offer email to ${targetEmail} from ${this.fromAddress}`,
    );

    try {
      const response = await this.resend.emails.send({
        from: this.fromAddress,
        to: [targetEmail],
        subject: `🎉 Congratulations! You won "${safeOfferName}" at THE EYE LAND!`,
        html: htmlContent,
      });

      if (response.error) {
        this.logger.error(
          `Resend offer error: ${JSON.stringify(response.error)}`,
        );

        return {
          success: false,
          error: response.error.message,
        };
      }

      this.logger.log(
        `Offer email sent successfully to ${targetEmail}. ID: ${response.data?.id}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send offer email: ${error?.message}`,
        error?.stack,
      );

      return {
        success: false,
        error: error?.message || 'Failed to send offer email',
      };
    }
  }
}