import { OAuth2Client } from 'google-auth-library';
import { IUserDocument, IGoogleUser } from '../types/auth.types';
import { User } from '../models/user.model';
import { generateToken } from './jwt';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    return {
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture,
      googleId: payload.sub
    };
  } catch (error) {
    throw new Error('Failed to verify Google token');
  }
}

export async function handleGoogleAuth(googleUserInfo: GoogleUserInfo) {
  try {
    let user = await User.findOne({ email: googleUserInfo.email });

    if (!user) {
      // Create new user with default storage quota
      user = await User.create({
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        password: Math.random().toString(36).slice(-8), // Random password for Google users
        googleId: googleUserInfo.googleId,
        storageQuota: 5 * 1024 * 1024 * 1024, // 5GB default
        usedStorage: 0
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleUserInfo.googleId;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        storageQuota: user.storageQuota,
        usedStorage: user.usedStorage
      }
    };
  } catch (error) {
    throw new Error('Failed to process Google authentication');
  }
}