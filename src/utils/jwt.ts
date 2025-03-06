import jwt from 'jsonwebtoken';
import { IUserDocument } from '../types/auth.types';
import { config } from '../config';

export const generateToken = (user: IUserDocument): string => {
  if (!user._id) {
    throw new Error('User ID is required');
  }

  return jwt.sign(
    { id: user._id.toString() },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): { id: string } => {
  try {
    return jwt.verify(token, config.jwtSecret) as { id: string };
  } catch (error) {
    throw new Error('Invalid token');
  }
};