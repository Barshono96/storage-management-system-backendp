import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { IUserDocument } from '../types/auth.types';
import { sendResetCode } from '../utils/email';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, username, email, password } = req.body;
      const displayName = name || username;  // Use either name or username

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({
        name: displayName,  // Store as name in database
        email,
        password,
        storageQuota: 5 * 1024 * 1024 * 1024, // 5GB default
        usedStorage: 0
      });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          storageQuota: user.storageQuota,
          usedStorage: user.usedStorage
        },
        message: 'Registration successful'
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          storageQuota: user.storageQuota,
          usedStorage: user.usedStorage
        }
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  static async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user as IUserDocument;
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`/auth-callback?token=${token}`);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate reset code
      const resetCode = Math.random().toString(36).slice(-6).toUpperCase();
      const resetCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Save reset code
      user.resetCode = resetCode;
      user.resetCodeExpires = resetCodeExpires;
      await user.save();

      // Send email with reset code
      await sendResetCode(email, resetCode);

      res.json({ message: 'Reset code sent to email' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async verifyCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      const user = await User.findOne({
        email,
        resetCode: code,
        resetCodeExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired code' });
      }

      res.json({ message: 'Code verified successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;

      const user = await User.findOne({
        email,
        resetCode: code,
        resetCodeExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired code' });
      }

      // Update password
      user.password = newPassword;
      user.resetCode = undefined;
      user.resetCodeExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}