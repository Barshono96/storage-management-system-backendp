import { Document, Types } from 'mongoose';

// Base interface without MongoDB-specific fields
export interface IUser {
  name: string;
  email: string;
  password: string;
  storageQuota: number;
  usedStorage: number;
  resetCode?: string;
  resetCodeExpires?: Date;
  googleId?: string;
}

// Document interface that extends both IUser and Mongoose Document
export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  storageQuota: number;
  usedStorage: number;
  resetCode?: string;
  resetCodeExpires?: Date;
  googleId?: string;
  comparePassword(password: string): Promise<boolean>;
  hasStorageSpace(fileSize: number): boolean;
  updateStorageUsage(sizeChange: number): Promise<void>;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface IAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    storageQuota: number;
    usedStorage: number;
  };
}

export interface IGoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IVerifyCodeRequest {
  email: string;
  code: string;
}

export interface IResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// JWT payload type
export interface IJwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}