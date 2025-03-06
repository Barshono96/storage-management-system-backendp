import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { IUserDocument } from '../types/auth.types';

// Note: Type declarations are now in types/express.d.ts
// to avoid conflicts and maintain single source of truth

export interface AuthRequest extends Request {
  userId: string;  
  user: IUserDocument;  
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Cast the request to our custom AuthRequest type
    (req as AuthRequest).user = user;
    (req as AuthRequest).userId = user._id.toString();

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};