import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<AdminUserDocument> {
    const admin = await this.adminUserModel.findOne({ email });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return admin;
  }

  async login(email: string, password: string) {
    const admin = await this.validateAdmin(email, password);
    const payload = { sub: admin._id, email: admin.email, type: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    };
  }
}
