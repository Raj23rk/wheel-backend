import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { Wheel, WheelDocument } from '../schemas/wheel.schema';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Wheel.name) private wheelModel: Model<WheelDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
    await this.seedInitialCampaign();
  }

  private async seedDefaultAdmin() {
    const existingAdmin = await this.adminUserModel.findOne({ email: 'admin@theeyeland.in' }).exec();
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new this.adminUserModel({
        email: 'admin@theeyeland.in',
        password: hashedPassword,
        name: 'Admin',
      });
      await admin.save();
      this.logger.log('Default admin user seeded: admin@theeyeland.in / admin123');
    } else {
      this.logger.log('Default admin user already exists');
    }
  }

  private async seedInitialCampaign() {
    const existingOffersCount = await this.offerModel.countDocuments().exec();
    if (existingOffersCount > 0) return;

    this.logger.log('Seeding initial promotional offers, wheel, and campaign...');

    // 1. Create default offers for optical shop
    const offersData = [
      {
        name: '20% OFF Frames',
        discountType: 'percentage',
        discountValue: 20,
        description: 'Get flat 20% off on all premium eyewear frames.',
        terms: 'Valid on frames above ₹1,500. Cannot be combined with other offers.',
        color: '#e53e3e',
        isActive: true,
      },
      {
        name: 'Free Lens Cleaning Kit',
        discountType: 'freebie',
        discountValue: 0,
        description: 'Complimentary premium optical lens spray and microfiber cloth kit.',
        terms: 'Claim at the store checkout on any purchase.',
        color: '#d69e2e',
        isActive: true,
      },
      {
        name: '₹500 OFF Sunglasses',
        discountType: 'fixed',
        discountValue: 500,
        description: 'Flat ₹500 off on designer UV polarized sunglasses.',
        terms: 'Valid on purchases above ₹2,000.',
        color: '#3182ce',
        isActive: true,
      },
      {
        name: '15% OFF Contact Lenses',
        discountType: 'percentage',
        discountValue: 15,
        description: 'Save 15% on monthly and daily contact lens packs.',
        terms: 'Valid on all major brands.',
        color: '#38a169',
        isActive: true,
      },
      {
        name: 'Free Eye Checkup & Consult',
        discountType: 'freebie',
        discountValue: 0,
        description: 'Complete computerized 12-point vision checkup by certified optometrist.',
        terms: 'Walk-in or book appointment. Free voucher.',
        color: '#805ad5',
        isActive: true,
      },
      {
        name: '₹1000 OFF Progressive Lenses',
        discountType: 'fixed',
        discountValue: 1000,
        description: 'Exclusive ₹1000 discount on HD digital progressive lenses.',
        terms: 'Valid on all premium digital lenses.',
        color: '#dd6b20',
        isActive: true,
      },
    ];

    const createdOffers = await this.offerModel.insertMany(offersData);

    // 2. Create default wheel
    const segments = createdOffers.map((offer, index) => ({
      offerId: offer._id,
      label: offer.name,
      color: offer.color,
      probability: index === 1 || index === 4 ? 25 : 12.5, // 25 + 25 + 12.5*4 = 100
    }));

    const wheel = new this.wheelModel({
      title: 'THE EYE LAND Lucky Spin',
      subtitle: 'Spin to win exciting discounts and free gifts!',
      segments,
      isActive: true,
    });
    const savedWheel = await wheel.save();

    // 3. Create active campaign
    const startDate = new Date();
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const campaign = new this.campaignModel({
      name: 'Grand Store Spin & Win 2026',
      description: 'Exclusive in-store customer reward campaign for THE EYE LAND.',
      startDate,
      endDate,
      wheelId: savedWheel._id,
      isActive: true,
    });
    await campaign.save();

    this.logger.log('Initial campaign, wheel, and offers seeded successfully.');
  }

  async findAllAdmins(): Promise<AdminUserDocument[]> {
    return this.adminUserModel.find().select('-password').exec();
  }

  async findAdminById(id: string): Promise<AdminUserDocument> {
    return this.adminUserModel.findById(id).select('-password').exec();
  }
}
