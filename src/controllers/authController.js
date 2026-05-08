// backend/src/controllers/authController.js
// At the top of authController.js
const mongoose = require('mongoose');
const User = require('../models/User');
// ... other imports

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// // HELPER: Generate JWT Tokens
// HELPER: Generate JWT Tokens
const generateTokens = (userId, user) => {
  const token = jwt.sign(
    { 
      id: userId, 
      plan: user.selectedPlan || user.plan || 'starter',
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { token, refreshToken };
};

// HELPER: Get PayPal Access Token// ============================================
const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }
    
    return data.access_token;
  } catch (error) {
    console.error('❌ PayPal token error:', error);
    throw error;
  }
};

// ============================================
// HELPER: Send Email
// ============================================
const sendEmail = async (email, subject, message) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
      console.error('❌ Email configuration missing');
      throw new Error('Email service not properly configured');
    }

  const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: (process.env.SMTP_USER || '').trim(),
    pass: (process.env.SMTP_PASS || '').trim()
  },
  tls: { rejectUnauthorized: false },
  family: 4
});

    await transporter.verify();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4F46E5; margin-bottom: 20px;">📧 EmailBrain</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error for ${email}:`, error.message);
    return false;
  }
};

// ============================================
// 1. CHECK EMAIL AVAILABILITY
// ============================================
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email }).select('_id');
    return res.status(200).json({
      success: true,
      data: { available: !existingUser, exists: !!existingUser }
    });
  } catch (error) {
    console.error('❌ Email check error:', error);
    return res.status(500).json({ success: false, message: 'Error checking email availability' });
  }
};

// ============================================
// 2. SEND OTP
// ============================================
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(email, 'Email Verification OTP', `Your OTP is: <strong>${otp}</strong>`);
    console.log(`✅ OTP sent to ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      data: { email, expiresIn: 600 }
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// ============================================
// 3. SIGN UP
// ============================================
exports.signUp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, company, jobTitle, industry, companySize } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name, email, password, phone, company, jobTitle, industry, companySize,
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      emailVerified: false,
      otpVerified: false,
      isFreeUser: false,
      hasAccessToDashboard: false
    });

    await user.save();
    await sendEmail(email, 'Email Verification OTP', `Your verification code is: <strong>${otp}</strong><br><br>This code will expire in 10 minutes.`);

    console.log(`✅ User created: ${email}`);
    res.status(201).json({
      success: true,
      message: 'Account created! OTP sent to your email',
      data: { email: user.email, nextStep: 'verify-email' }
    });
  } catch (error) {
    console.error('❌ Sign up error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 4. VERIFY OTP - UPDATED TO USE resetPasswordToken FOR PASSWORD RESET
// ============================================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    console.log(`🔍 Verifying OTP for ${email}: ${otp}, purpose: ${purpose}`);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ✅ Check purpose - if password reset, check resetPasswordToken
    if (purpose === 'password-reset') {
      console.log(`📊 Checking resetPasswordToken:`, {
        stored: user.resetPasswordToken,
        received: otp,
        match: user.resetPasswordToken === otp,
        expires: user.resetPasswordExpires,
        notExpired: user.resetPasswordExpires > new Date()
      });

      if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      if (user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired' });
      }

      // Don't clear the token yet - needed for reset
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        verified: true
      });
    }

    // ✅ For email verification, check otp field
    console.log(`📊 Checking email verification OTP:`, {
      stored: user.otp,
      received: otp,
      match: user.otp === otp,
      expires: user.otpExpires,
      notExpired: user.otpExpires > new Date()
    });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // For email verification, mark as verified
    user.emailVerified = true;
    user.otpVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    const userCount = await User.countDocuments();

    if (userCount <= 5) {
      user.isFreeUser = true;
      user.paymentStatus = 'completed';
      user.hasAccessToDashboard = true;
      user.paymentDate = new Date();
      user.userNumber = userCount;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: '🎉 Email verified! You got FREE access!',
        data: { email: user.email, isFreeUser: true, nextStep: 'dashboard' }
      });
    } else {
      user.paymentStatus = 'pending';
      user.hasAccessToDashboard = false;
      user.userNumber = userCount;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: '✅ Email verified! Now select a plan.',
        data: { email: user.email, isFreeUser: false, nextStep: 'plan-selection' }
      });
    }

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
//// ============================================
// 5. SIGN IN - FIXED VERSION
// ============================================
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found. Please sign up first.',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    // ✅ FIX: Ensure loginAttempts is a valid number
    if (typeof user.loginAttempts !== 'number' || isNaN(user.loginAttempts)) {
      user.loginAttempts = 0;
    }

    // ✅ FIX: Ensure selectedPlan has a value
    if (!user.selectedPlan) {
      user.selectedPlan = 'starter';
    }

    if (user.isLocked && user.isLocked()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is locked. Try again later' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // ✅ Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        code: 'UNVERIFIED_EMAIL',
        requiresVerification: true,
        email: user.email
      });
    }

    // ✅ Check payment/dashboard access
    if (!user.hasAccessToDashboard) {
      return res.status(403).json({
        success: false,
        message: 'Payment required to access dashboard',
        code: 'PAYMENT_REQUIRED',
        data: { 
          email: user.email, 
          isFreeUser: user.isFreeUser, 
          paymentStatus: user.paymentStatus, 
          nextStep: user.isFreeUser ? 'dashboard' : 'plan-selection' 
        }
      });
    }

    // ✅ All checks passed - generate tokens
    await user.resetLoginAttempts();
    const { token, refreshToken } = generateTokens(user._id, user.selectedPlan || user.plan);

    console.log(`✅ Login successful: ${email}`);
    
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        selectedPlan: user.selectedPlan,  // ✅ Include selectedPlan
        plan: user.plan,
        isFreeUser: user.isFreeUser, 
        hasAccessToDashboard: user.hasAccessToDashboard 
      },
      token,
      refreshToken
    });

  } catch (error) {
    console.error('❌ Sign in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sign in' 
    });
  }
}; 

// 6. SIGN OUT
// ============================================
exports.signOut = async (req, res) => {
  try {
    console.log(`👋 User logged out: ${req.user?.id}`);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Sign out error:', error);
    res.status(500).json({ success: false, message: 'Failed to sign out' });
  }
};

// backend/src/controllers/authController.js

const getCurrentUser = async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findOne({ email: req.user.email })
      .select('-password -otp -otpExpiry -__v');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log('👤 Current user fetched:', {
      email: user.email,
      selectedPlan: user.selectedPlan,
      plan: user.plan
    });
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedPlan: user.selectedPlan || null,
        plan: user.plan || null,
        avatar: user.avatar,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ getCurrentUser error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user data' 
    });
  }
};

// ============================================
// 7. REFRESH TOKEN
// ============================================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
const user = await User.findById(decoded.id);
const { token, refreshToken: newRefreshToken } = generateTokens(decoded.id, user); 

    res.status(200).json({ success: true, data: { token, refreshToken: newRefreshToken } });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};
// backend/src/controllers/authController.js

// ============================================
// 8. FORGOT PASSWORD - USE resetPasswordToken
// ============================================
// In forgotPassword, make sure resetPasswordToken is properly set:
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log(`🔑 Forgot password request for ${email}`);

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists, a reset code will be sent' 
      });
    }

    // Generate 6-digit OTP
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ✅ Set resetPasswordToken fields
    user.resetPasswordToken = resetOTP;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    // ✅ Mark as modified
    user.markModified('resetPasswordToken');
    user.markModified('resetPasswordExpires');
    
    await user.save();

    console.log(`📊 Reset token saved:`, {
      email,
      token: user.resetPasswordToken,
      expires: user.resetPasswordExpires
    });

    // Send email
    await sendEmail(
      email, 
      'Password Reset OTP', 
      `Your password reset code is: <strong>${resetOTP}</strong><br><br>This code will expire in 10 minutes.`
    );
    
    console.log(`✅ Reset OTP sent to ${email}: ${resetOTP}`);

    res.status(200).json({ 
      success: true, 
      message: 'If an account exists, a reset code will be sent' 
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};
// ============================================
// 9. RESET PASSWORD - USE resetPasswordToken
// ============================================
// backend/src/controllers/authController.js

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    console.log(`🔑 Reset password request:`, { email, otp });

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // ✅ Select the resetPasswordToken field explicitly
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');

    console.log(`📊 User found:`, {
      found: !!user,
      email: email,
      storedToken: user?.resetPasswordToken,
      receivedToken: otp,
      tokenMatch: user?.resetPasswordToken === otp,
      expires: user?.resetPasswordExpires,
      notExpired: user?.resetPasswordExpires > new Date()
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP. Please request a new one.' 
      });
    }

    // ✅ Check token
    if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    // Update password
    user.password = newPassword;
    
    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    console.log(`✅ Password reset successful for ${email}`);

    res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully! You can now login.' 
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};
// ============================================
// 10-13. PLAN & PAYMENT (UNCHANGED)
// ============================================
exports.selectPlan = async (req, res) => { /* ... unchanged ... */ };
exports.createPayPalOrder = async (req, res) => { /* ... unchanged ... */ };
exports.capturePayPalOrder = async (req, res) => { /* ... unchanged ... */ };
exports.checkPaymentStatus = async (req, res) => { /* ... unchanged ... */ };

module.exports = exports;