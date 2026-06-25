import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendEmail } from '../utils/sendEmail.js';

// Helper to generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (requires email verification unless bypassed in development)
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    const usernameExists = await User.findOne({ username });

    if (emailExists || usernameExists) {
      return errorResponse(res, 400, 'User with this email or username already exists');
    }

    // Check if verification is bypassed in development mode
    const bypassVerification = process.env.BYPASS_EMAIL_VERIFICATION === 'true' || process.env.NODE_ENV === 'development';

    // Generate email verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = await User.create({
      name: name || username,
      username,
      email: email.toLowerCase(),
      password,
      isVerified: bypassVerification, // Set true directly if bypassed
      verificationToken: bypassVerification ? undefined : verificationToken,
      verificationTokenExpire: bypassVerification ? undefined : verificationTokenExpire
    });

    if (bypassVerification) {
      return successResponse(res, 201, 'Registration successful. Account activated and ready to log in.');
    }

    // Verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // Email message
    const message = `Welcome to CryptoVision, ${name || username}!\n\nPlease verify your email by clicking the link below:\n\n${verifyUrl}\n\nThis link is valid for 24 hours.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to CryptoVision AI</h2>
        <p>Hi ${name || username},</p>
        <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 12px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 11px; text-align: center;">This link will expire in 24 hours. If you did not sign up for this account, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'CryptoVision Email Verification',
        message,
        html
      });

      return successResponse(res, 201, 'Registration successful. Please check your email to verify your account.');
    } catch (err) {
      // If email sending fails, delete the created user so they can try again
      await User.findByIdAndDelete(user._id);
      console.error('[Registration Email Error]', err);
      return errorResponse(res, 500, 'Verification email could not be sent. Registration cancelled.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;

    // Find user by verification token and check expiry
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired email verification link');
    }

    // Update verification state
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    return successResponse(res, 200, 'Your email has been verified successfully. You can now log in.', {
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification token
 * @access  Public
 */
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Please provide an email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return errorResponse(res, 404, 'No account found with this email address');
    }

    if (user.isVerified) {
      return errorResponse(res, 400, 'This account is already verified');
    }

    // Generate new email verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpire = verificationTokenExpire;
    await user.save();

    // Verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // Email message
    const message = `Please verify your email by clicking the link below:\n\n${verifyUrl}\n\nThis link is valid for 24 hours.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">CryptoVision Email Verification</h2>
        <p>Hi ${user.name || user.username},</p>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 12px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'CryptoVision Email Verification Request',
        message,
        html
      });

      return successResponse(res, 200, 'Verification email sent successfully.');
    } catch (err) {
      console.error('[Resend Email Error]', err);
      return errorResponse(res, 500, 'Verification email could not be sent.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user, check verification status & get token
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { loginCredential, password } = req.body;

    // Search user by email OR username, select password
    const user = await User.findOne({
      $or: [
        { email: loginCredential.toLowerCase() },
        { username: loginCredential }
      ]
    }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email/username or password');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email/username or password');
    }

    // Check if email is verified (bypass in dev mode)
    const bypassVerification = process.env.BYPASS_EMAIL_VERIFICATION === 'true' || process.env.NODE_ENV === 'development';
    if (!user.isVerified && !bypassVerification) {
      return errorResponse(res, 403, 'Your email is not verified. Please verify your email before logging in.');
    }

    // Return profile + signed token
    return successResponse(res, 200, 'Login successful', {
      _id: user._id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      cashUSD: user.cashUSD,
      holdings: user.holdings,
      watchlist: user.watchlist,
      joinedDate: user.joinedDate,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Generate password reset token & email reset URL
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return successResponse(res, 200, 'If this email exists in our records, a reset link has been sent.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set expiry (15 mins)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Email message
    const message = `You requested a password reset on CryptoVision.\n\nPlease reset your password by clicking the link below:\n\n${resetUrl}\n\nThis link is valid for 15 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">CryptoVision Password Reset</h2>
        <p>Hi ${user.name || user.username},</p>
        <p>You are receiving this email because you (or someone else) requested a password reset for your account. Please click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 12px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 11px; text-align: center;">This link will expire in 15 minutes. If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'CryptoVision Password Reset Request',
        message,
        html
      });

      return successResponse(res, 200, 'If this email exists in our records, a reset link has been sent.');
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error('[Forgot Password Email Error]', err);
      return errorResponse(res, 500, 'Password reset email could not be sent.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/auth/reset-password/:token
 * @desc    Verify reset token & update password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token;

    // Hash token to match with DB record
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and make sure it has not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired password reset token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save(); // Password will be hashed by pre-save hook

    return successResponse(res, 200, 'Password has been reset successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth strategy success redirect handler
 * @access  Private (Redirect)
 */
export const googleOAuthCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=GoogleAuthFailed`);
    }

    // Sign JWT
    const token = generateToken(req.user._id);

    // Redirect to frontend OAuth Success handler
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${token}`);
  } catch (error) {
    console.error('[Google OAuth Callback Error]', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=ServerError`);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = req.user; // Appended by protect middleware
    
    return successResponse(res, 200, 'User profile retrieved successfully', {
      _id: user._id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      cashUSD: user.cashUSD,
      holdings: user.holdings,
      watchlist: user.watchlist,
      joinedDate: user.joinedDate
    });
  } catch (error) {
    next(error);
  }
};
