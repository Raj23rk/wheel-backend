import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpinRecord, SpinRecordDocument } from '../schemas/spin-record.schema';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { Wheel, WheelDocument } from '../schemas/wheel.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { CouponService } from '../coupon/coupon.service';
import { SmsService } from '../otp/sms.service';

@Injectable()
export class SpinService {
  constructor(
    @InjectModel(SpinRecord.name) private spinRecordModel: Model<SpinRecordDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Wheel.name) private wheelModel: Model<WheelDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    private couponService: CouponService,
    private smsService: SmsService,
  ) {}

  /**
   * Weighted random selection algorithm.
   * Each segment has a probability (percentage). We sum all, pick a random point,
   * then iterate until the cumulative probability covers that point.
   */
  private selectWinningSegment(segments: any[]): any {
    const totalProbability = segments.reduce((sum, seg) => sum + (seg.probability || 1), 0);
    const random = Math.random() * totalProbability;

    let cumulative = 0;
    for (const segment of segments) {
      cumulative += (segment.probability || 1);
      if (random <= cumulative) {
        return segment;
      }
    }

    // Fallback: return last segment
    return segments[segments.length - 1];
  }

  async spin(campaignId: string, customerPhone: string) {
    // 1. Validate and resolve campaign safely
    let campaign: CampaignDocument | null = null;
    const { Types } = await import('mongoose');

    if (campaignId && campaignId !== 'default' && campaignId !== 'active' && Types.ObjectId.isValid(campaignId)) {
      campaign = await this.campaignModel.findById(campaignId).exec();
    }

    if (!campaign) {
      const now = new Date();
      campaign = await this.campaignModel
        .findOne({
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        })
        .exec();
    }

    if (!campaign) {
      campaign = await this.campaignModel.findOne({ isActive: true }).sort({ createdAt: -1 }).exec();
    }

    if (!campaign) {
      campaign = await this.campaignModel.findOne().sort({ createdAt: -1 }).exec();
    }

    if (!campaign) {
      throw new NotFoundException('No active campaign found for spinning');
    }

    const resolvedCampaignId = campaign._id.toString();

    // 2. Check campaign is active
    if (!campaign.isActive) {
      throw new BadRequestException('Campaign is not active');
    }

    // 3. Check if customer has already spun for this campaign
    const existingSpin = await this.spinRecordModel
      .findOne({ campaignId: resolvedCampaignId, customerPhone })
      .exec();
    if (existingSpin) {
      throw new ForbiddenException('You have already spun for this campaign');
    }

    // 4. Get the wheel for this campaign
    if (!campaign.wheelId) {
      throw new BadRequestException('Campaign does not have a wheel configured');
    }
    const wheel = await this.wheelModel.findById(campaign.wheelId).exec();
    if (!wheel || !wheel.isActive) {
      throw new BadRequestException('Wheel is not available');
    }
    if (!wheel.segments || wheel.segments.length === 0) {
      throw new BadRequestException('Wheel has no segments configured');
    }

    // 5. Filter out offers that have exceeded maxUses
    const availableSegments: any[] = [];
    for (let i = 0; i < wheel.segments.length; i++) {
      const segment = wheel.segments[i];
      const offer = await this.offerModel.findById(segment.offerId).exec();
      if (offer && offer.isActive) {
        if (!offer.maxUses || offer.currentUses < offer.maxUses) {
          availableSegments.push({
            ...((segment as any).toObject ? (segment as any).toObject() : segment),
            originalIndex: i,
            offerDoc: offer,
          });
        }
      }
    }

    if (availableSegments.length === 0) {
      throw new BadRequestException('No available offers on the wheel');
    }

    // 6. Select winner via weighted probability
    const winningSegment = this.selectWinningSegment(availableSegments);
    const winningOffer = winningSegment.offerDoc;
    const segmentIndex = winningSegment.originalIndex ?? 0;

    // 7. Create coupon (expires in 30 days from now)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const coupon = await this.couponService.createCoupon(
      winningOffer._id.toString(),
      resolvedCampaignId,
      customerPhone,
      expiresAt,
    );

    // 8. Increment offer usage
    await this.offerModel
      .findByIdAndUpdate(winningOffer._id, { $inc: { currentUses: 1 } })
      .exec();

    // 9. Create spin record
    const spinRecord = new this.spinRecordModel({
      campaignId: resolvedCampaignId,
      customerPhone,
      offerId: winningOffer._id,
      couponId: coupon._id,
      result: winningOffer.name,
    });
    await spinRecord.save();

    // 10. Send Winning Coupon SMS in background
    this.smsService
      .sendCouponSms(customerPhone, winningOffer.name, coupon.code)
      .catch((err) => console.error('Failed to send coupon SMS:', err));

    // 11. Return result
    return {
      success: true,
      segmentIndex,
      spinId: spinRecord._id,
      result: {
        offerName: winningOffer.name,
        discountType: winningOffer.discountType,
        discountValue: winningOffer.discountValue,
        description: winningOffer.description,
        terms: winningOffer.terms,
        segmentLabel: winningSegment.label,
        segmentColor: winningSegment.color,
      },
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        expiresAt: coupon.expiresAt,
      },
    };
  }

  async findAllSpins(filters: { campaignId?: string; customerPhone?: string } = {}): Promise<SpinRecordDocument[]> {
    const query: any = {};
    if (filters.campaignId) {
      query.campaignId = filters.campaignId;
    }
    if (filters.customerPhone) {
      query.customerPhone = filters.customerPhone;
    }
    return this.spinRecordModel
      .find(query)
      .populate('offerId')
      .populate('campaignId')
      .populate('couponId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAnalytics() {
    const totalSpins = await this.spinRecordModel.countDocuments().exec();
    const totalCoupons = totalSpins;

    const { default: mongoose } = await import('mongoose');
    const redeemedCount = await mongoose.model('Coupon').countDocuments({ redeemed: true }).exec();
    const redemptionRate = totalCoupons > 0 ? ((redeemedCount / totalCoupons) * 100).toFixed(1) : '0.0';

    // Top offer by spin count
    const topOfferAgg = await this.spinRecordModel
      .aggregate([
        { $group: { _id: '$offerId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'offers',
            localField: '_id',
            foreignField: '_id',
            as: 'offer',
          },
        },
        { $unwind: { path: '$offer', preserveNullAndEmptyArrays: true } },
      ])
      .exec();

    const topOffer = topOfferAgg.length > 0
      ? { name: topOfferAgg[0].offer?.name || 'Unknown', count: topOfferAgg[0].count }
      : null;

    // Spins per campaign
    const spinsPerCampaign = await this.spinRecordModel
      .aggregate([
        { $group: { _id: '$campaignId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'campaigns',
            localField: '_id',
            foreignField: '_id',
            as: 'campaign',
          },
        },
        { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: true } },
        { $sort: { count: -1 } },
      ])
      .exec();

    return {
      totalSpins,
      totalCoupons,
      redeemedCoupons: redeemedCount,
      redemptionRate: `${redemptionRate}%`,
      topOffer,
      spinsPerCampaign: spinsPerCampaign.map((item) => ({
        campaignName: item.campaign?.name || 'Unknown',
        campaignId: item._id,
        count: item.count,
      })),
    };
  }
}
