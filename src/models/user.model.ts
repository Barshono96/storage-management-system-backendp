import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserDocument } from '../types/auth.types';

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function(this: IUserDocument): boolean {
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  resetCode: {
    type: String
  },
  resetCodeExpires: {
    type: Date
  },
  storageQuota: {
    type: Number,
    default: 5 * 1024 * 1024 * 1024 // 5GB
  },
  usedStorage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(this: IUserDocument, next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Check if user has enough storage space
userSchema.methods.hasStorageSpace = function(fileSize: number): boolean {
  return this.usedStorage + fileSize <= this.storageQuota;
};

// Update storage usage
userSchema.methods.updateStorageUsage = async function(sizeChange: number): Promise<void> {
  this.usedStorage += sizeChange;
  if (this.usedStorage < 0) this.usedStorage = 0;
  await this.save();
};

export const User = mongoose.model<IUserDocument>('User', userSchema);