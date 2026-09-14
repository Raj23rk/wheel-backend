import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { Wheel, WheelDocument } from '../schemas/wheel.schema';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';

export const NEW_SPIN_OFFERS = [
  {
    name: 'Free Frame',
    discountType: 'freebie',
    discountValue: 0,
    description: 'Get a stylish complimentary frame with your purchase.',
    terms: 'Valid on select frame collections. Cannot be combined with other offers.',
    color: '#E53E3E',
    isActive: true,
  },
  {
    name: 'Buy One Get One',
    discountType: 'freebie',
    discountValue: 0,
    description: 'Buy one pair of spectacles or frame and get one free!',
    terms: 'Free item applies to equal or lesser value. Terms and conditions apply.',
    color: '#DD6B20',
    isActive: true,
  },
  {
    name: '15% Offer on Spectical',
    discountType: 'percentage',
    discountValue: 15,
    description: 'Flat 15% discount on complete spectacles.',
    terms: 'Valid on frames and lenses. Applicable at store checkout.',
    color: '#D69E2E',
    isActive: true,
  },
  {
    name: '30% Offer on Spectical',
    discountType: 'percentage',
    discountValue: 30,
    description: 'Enjoy a huge 30% discount on spectacles.',
    terms: 'Valid on select spectacle packages and lens combos.',
    color: '#38A169',
    isActive: true,
  },
  {
    name: '10% On Branded Frames',
    discountType: 'percentage',
    discountValue: 10,
    description: 'Exclusive 10% discount on all premium international branded frames.',
    terms: 'Valid on leading designer and branded optical frames.',
    color: '#319795',
    isActive: true,
  },
  {
    name: 'Free Blue Ray Protection Coating',
    discountType: 'freebie',
    discountValue: 0,
    description: 'Free Blue Ray protection filter coating on your lenses for eye comfort.',
    terms: 'Applicable on any prescription or computer lens purchase.',
    color: '#3182CE',
    isActive: true,
  },
  {
    name: 'Old Frame Exchange Offer',
    discountType: 'fixed',
    discountValue: 500,
    description: 'Exchange your old frame and get an instant value discount on your new pair.',
    terms: 'Bring any old eyewear frame to the store to claim exchange value.',
    color: '#805AD5',
    isActive: true,
  },
  {
    name: '30% Offer in Drive Safe Lens',
    discountType: 'percentage',
    discountValue: 30,
    description: 'Flat 30% discount on Drive Safe precision anti-reflective lenses.',
    terms: 'Valid on certified Drive Safe day & night driving lenses.',
    color: '#D53F8C',
    isActive: true,
  },
];

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
    await this.syncOffersAndWheel();
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

  /**
   * Removes old offers and populates the 8 requested offers,
   * updating the spin wheel segments and campaign.
   */
  async syncOffersAndWheel(force: boolean = false) {
    const existingOffers = await this.offerModel.find().exec();
    const existingNames = new Set(existingOffers.map((o) => o.name));
    const targetNames = NEW_SPIN_OFFERS.map((o) => o.name);

    // Check if current offers already match the 8 new offers
    const allPresent =
      existingOffers.length === targetNames.length &&
      targetNames.every((name) => existingNames.has(name));

    if (allPresent && !force) {
      this.logger.log('Spin wheel offers are already up to date with the 8 new offers.');
      return { message: 'Offers are already up to date', count: existingOffers.length };
    }

    this.logger.log('Updating offers and wheel segments with 8 new offers...');

    // 1. Remove old offers
    await this.offerModel.deleteMany({}).exec();

    // 2. Insert new 8 offers
    const createdOffers = await this.offerModel.insertMany(NEW_SPIN_OFFERS);

    // 3. Prepare 8 wheel segments (12.5% each for equal probability = 100%)
    const segments = createdOffers.map((offer) => ({
      offerId: offer._id,
      label: offer.name,
      color: offer.color,
      probability: 12.5,
    }));

    // 4. Update or create the wheel
    let wheel = await this.wheelModel.findOne({ isActive: true }).exec();
    if (!wheel) {
      wheel = await this.wheelModel.findOne().exec();
    }

    if (wheel) {
      wheel.title = 'THE EYE LAND Lucky Spin';
      wheel.subtitle = 'Spin to win exciting discounts and free gifts!';
      wheel.segments = segments as any;
      wheel.isActive = true;
      await wheel.save();
    } else {
      wheel = new this.wheelModel({
        title: 'THE EYE LAND Lucky Spin',
        subtitle: 'Spin to win exciting discounts and free gifts!',
        segments,
        isActive: true,
      });
      await wheel.save();
    }

    // 5. Update or create active campaign
    let campaign = await this.campaignModel.findOne({ isActive: true }).exec();
    if (!campaign) {
      campaign = await this.campaignModel.findOne().exec();
    }

    if (campaign) {
      campaign.wheelId = wheel._id as any;
      campaign.isActive = true;
      await campaign.save();
    } else {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      campaign = new this.campaignModel({
        name: 'Grand Store Spin & Win 2026',
        description: 'Exclusive in-store customer reward campaign for THE EYE LAND.',
        startDate,
        endDate,
        wheelId: wheel._id,
        isActive: true,
      });
      await campaign.save();
    }

    this.logger.log('Initial campaign, wheel, and 8 new offers seeded/updated successfully.');
    return {
      message: 'Successfully removed old offers and updated spin wheel with 8 new offers.',
      offers: createdOffers.map((o) => ({ id: o._id, name: o.name, color: o.color })),
      wheelId: wheel._id,
      campaignId: campaign._id,
    };
  }

  async findAllAdmins(): Promise<AdminUserDocument[]> {
    return this.adminUserModel.find().select('-password').exec();
  }

  async findAdminById(id: string): Promise<AdminUserDocument> {
    return this.adminUserModel.findById(id).select('-password').exec();
  }
}
