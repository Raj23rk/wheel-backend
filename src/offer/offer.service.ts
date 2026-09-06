import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  async create(dto: CreateOfferDto): Promise<OfferDocument> {
    const offer = new this.offerModel(dto);
    return offer.save();
  }

  async findAll(): Promise<OfferDocument[]> {
    return this.offerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<OfferDocument> {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with id ${id} not found`);
    }
    return offer;
  }

  async update(id: string, dto: UpdateOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!offer) {
      throw new NotFoundException(`Offer with id ${id} not found`);
    }
    return offer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.offerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Offer with id ${id} not found`);
    }
  }

  async incrementUsage(id: string): Promise<void> {
    await this.offerModel.findByIdAndUpdate(id, { $inc: { currentUses: 1 } }).exec();
  }
}
