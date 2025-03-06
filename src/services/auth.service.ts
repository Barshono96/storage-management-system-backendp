import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { 
  IUserDocument, 
  IAuthResponse, 
  ILoginRequest, 
  IRegisterRequest, 
  IGoogleUser,
  IForgotPasswordRequest,
  IVerifyCodeRequest,
  IResetPasswordRequest
} from '../types/auth.types';

export class AuthService {
  private static generateToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );
  }

  private static formatUserResponse(user: IUserDocument): IAuthResponse {
    return {
      token: this.generateToken(user._id.toString()),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        storageQuota: user.storageQuota,
        usedStorage: user.usedStorage
      }
    };
  }

  static async register(data: IRegisterRequest): Promise<IAuthResponse> {
    const { name, email, password } = data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      storageQuota: 5 * 1024 * 1024 * 1024, // 5GB default
      usedStorage: 0
    });

    return this.formatUserResponse(user);
  }

  static async login(data: ILoginRequest): Promise<IAuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return this.formatUserResponse(user);
  }

  static async googleAuth(profile: IGoogleUser): Promise<IAuthResponse> {
    // Find or create user
    let user = await User.findOne({
      $or: [{ email: profile.email }, { googleId: profile.googleId }]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        storageQuota: 5 * 1024 * 1024 * 1024, // 5GB default
        usedStorage: 0
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = profile.googleId;
      await user.save();
    }

    return this.formatUserResponse(user);
  }

  static async forgotPassword(data: IForgotPasswordRequest): Promise<void> {
    const { email } = data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset code
    const resetCode = Math.random().toString(36).slice(-6).toUpperCase();
    const resetCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save reset code
    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    // TODO: Send email with reset code
    console.log('Reset code:', resetCode);
  }

  static async verifyCode(data: IVerifyCodeRequest): Promise<void> {
    const { email, code } = data;

    // Find user
    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired code');
    }
  }

  static async resetPassword(data: IResetPasswordRequest): Promise<void> {
    const { email, code, newPassword } = data;

    // Find user
    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired code');
    }

    // Update password
    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();
  }

  static async verifyToken(token: string): Promise<IUserDocument> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}