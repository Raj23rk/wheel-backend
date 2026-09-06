import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'EYELAND-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createCoupon(
    offerId: string,
    campaignId: string,
    customerIdentifier: string | { phone?: string; email?: string; customerPhone?: string; customerEmail?: string },
    expiresAt: Date,
  ): Promise<CouponDocument> {
    let code = this.generateCouponCode();

    // Ensure uniqueness
    let existing = await this.couponModel.findOne({ code }).exec();
    while (existing) {
      code = this.generateCouponCode();
      existing = await this.couponModel.findOne({ code }).exec();
    }

    let customerPhone = '';
    let customerEmail = '';

    if (typeof customerIdentifier === 'string') {
      if (customerIdentifier.includes('@')) {
        customerEmail = customerIdentifier.trim().toLowerCase();
      } else {
        customerPhone = customerIdentifier.trim();
      }
    } else if (customerIdentifier) {
      if (customerIdentifier.email || customerIdentifier.customerEmail) {
        customerEmail = (customerIdentifier.email || customerIdentifier.customerEmail)!.trim().toLowerCase();
      }
      if (customerIdentifier.phone || customerIdentifier.customerPhone) {
        customerPhone = (customerIdentifier.phone || customerIdentifier.customerPhone)!.trim();
      }
    }

    const coupon = new this.couponModel({
      code,
      offerId,
      campaignId,
      customerPhone,
      customerEmail,
      expiresAt,
      redeemed: false,
    });

    return coupon.save();
  }

  async findAll(filters: { redeemed?: string; campaignId?: string; customerEmail?: string; customerPhone?: string } = {}): Promise<CouponDocument[]> {
    const query: any = {};
    if (filters.redeemed !== undefined) {
      query.redeemed = filters.redeemed === 'true';
    }
    if (filters.campaignId) {
      query.campaignId = filters.campaignId;
    }
    if (filters.customerEmail) {
      query.customerEmail = filters.customerEmail.toLowerCase().trim();
    }
    if (filters.customerPhone) {
      query.customerPhone = filters.customerPhone;
    }
    return this.couponModel
      .find(query)
      .populate('offerId')
      .populate('campaignId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCode(code: string): Promise<CouponDocument> {
    const coupon = await this.couponModel
      .findOne({ code })
      .populate('offerId')
      .populate('campaignId')
      .exec();
    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }
    return coupon;
  }

  async redeemCoupon(code: string, redeemedBy?: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findOne({ code }).exec();
    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }
    if (coupon.redeemed) {
      throw new BadRequestException('Coupon has already been redeemed');
    }
    if (coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    coupon.redeemed = true;
    coupon.redeemedAt = new Date();
    coupon.redeemedBy = redeemedBy || 'staff';
    return coupon.save();
  }
}
