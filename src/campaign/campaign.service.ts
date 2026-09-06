import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) {}

  async create(dto: CreateCampaignDto): Promise<CampaignDocument> {
    const campaign = new this.campaignModel(dto);
    return campaign.save();
  }

  async findAll(): Promise<CampaignDocument[]> {
    return this.campaignModel
      .find()
      .populate({
        path: 'wheelId',
        populate: { path: 'segments.offerId' },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel
      .findById(id)
      .populate({
        path: 'wheelId',
        populate: { path: 'segments.offerId' },
      })
      .exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with id ${id} not found`);
    }
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto): Promise<CampaignDocument> {
    const campaign = await this.campaignModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate({
        path: 'wheelId',
        populate: { path: 'segments.offerId' },
      })
      .exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with id ${id} not found`);
    }
    return campaign;
  }

  async remove(id: string): Promise<void> {
    const result = await this.campaignModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Campaign with id ${id} not found`);
    }
  }

  async findActive(): Promise<CampaignDocument[]> {
    const now = new Date();
    return this.campaignModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .populate({
        path: 'wheelId',
        populate: { path: 'segments.offerId' },
      })
      .exec();
  }

  async getPublicCampaign(id?: string): Promise<CampaignDocument> {
    if (id && id !== 'latest' && id !== 'active') {
      const campaign = await this.campaignModel
        .findById(id)
        .populate({
          path: 'wheelId',
          populate: { path: 'segments.offerId' },
        })
        .exec();
      if (campaign) return campaign;
    }

    const now = new Date();
    // Try currently active campaign
    let campaign = await this.campaignModel
      .findOne({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .populate({
        path: 'wheelId',
        populate: { path: 'segments.offerId' },
      })
      .exec();

    if (!campaign) {
      // Fallback to most recent active campaign
      campaign = await this.campaignModel
        .findOne({ isActive: true })
        .populate({
          path: 'wheelId',
          populate: { path: 'segments.offerId' },
        })
        .sort({ createdAt: -1 })
        .exec();
    }

    if (!campaign) {
      // Fallback to any campaign
      campaign = await this.campaignModel
        .findOne()
        .populate({
          path: 'wheelId',
          populate: { path: 'segments.offerId' },
        })
        .sort({ createdAt: -1 })
        .exec();
    }

    if (!campaign) {
      throw new NotFoundException('No active campaign found');
    }

    return campaign;
  }
}
