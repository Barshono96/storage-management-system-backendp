import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model';
import { IUserDocument } from '../types/auth.types';
import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';  // Change from 'bcrypt' to 'bcryptjs'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth credentials not found in environment variables');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails?.[0].value) {
          return done(new Error('Email not provided by Google'));
        }

        // Check if user exists
        let user = await User.findOne({
          $or: [
            { email: profile.emails[0].value },
            { googleId: profile.id }
          ]
        });

        if (!user) {
          // Create new user
          user = await User.create({
            name: profile.displayName || 'Google User',
            email: profile.emails[0].value,
            googleId: profile.id,
            password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
            storageQuota: 5 * 1024 * 1024 * 1024, // 5GB default
            usedStorage: 0
          });
        } else if (!user.googleId) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// Serialize just the user ID
passport.serializeUser((user: Express.User, done) => {
  const userDoc = user as IUserDocument;
  done(null, userDoc._id);
});

// Deserialize user from ID
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;