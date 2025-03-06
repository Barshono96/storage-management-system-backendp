import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import passport from 'passport';
import { 
  registerValidation, 
  loginValidation, 
  forgotPasswordValidation,
  verifyCodeValidation,
  resetPasswordValidation,
  validateRequest 
} from '../middleware/validation.middleware';
import { RequestHandler } from 'express';

const router = Router();

// Registration and login routes
router.post(
  '/register',
  registerValidation,
  validateRequest,
  AuthController.register
);

router.post(
  '/login',
  loginValidation,
  validateRequest,
  AuthController.login
);

// Password reset flow
router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validateRequest,
  AuthController.forgotPassword
);

router.post(
  '/verify-code',
  verifyCodeValidation,
  validateRequest,
  AuthController.verifyCode
);

router.post(
  '/reset-password',
  resetPasswordValidation,
  validateRequest,
  AuthController.resetPassword
);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  AuthController.googleCallback
);

export default router;