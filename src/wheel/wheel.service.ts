import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wheel, WheelDocument } from '../schemas/wheel.schema';
import { CreateWheelDto } from './dto/create-wheel.dto';
import { UpdateWheelDto } from './dto/update-wheel.dto';

@Injectable()
export class WheelService {
  constructor(
    @InjectModel(Wheel.name) private wheelModel: Model<WheelDocument>,
  ) {}

  async create(dto: CreateWheelDto): Promise<WheelDocument> {
    const wheel = new this.wheelModel(dto);
    return wheel.save();
  }

  async findAll(): Promise<WheelDocument[]> {
    return this.wheelModel
      .find()
      .populate('segments.offerId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<WheelDocument> {
    const wheel = await this.wheelModel
      .findById(id)
      .populate('segments.offerId')
      .exec();
    if (!wheel) {
      throw new NotFoundException(`Wheel with id ${id} not found`);
    }
    return wheel;
  }

  async update(id: string, dto: UpdateWheelDto): Promise<WheelDocument> {
    const wheel = await this.wheelModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate('segments.offerId')
      .exec();
    if (!wheel) {
      throw new NotFoundException(`Wheel with id ${id} not found`);
    }
    return wheel;
  }

  async remove(id: string): Promise<void> {
    const result = await this.wheelModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Wheel with id ${id} not found`);
    }
  }
}
