// backend/src/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// ============================================
// HELPER: Send Email
// ============================================
const sendEmail = async (email, subject, message) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
      console.error('❌ Email configuration missing');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' ? true : false,
      auth: {
        user: (process.env.SMTP_USER || '').trim(),
        pass: (process.env.SMTP_PASS || '').trim()
      }
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
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              ${message}
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error:`, error.message);
    return false;
  }
};

// ============================================
// 1. GET USER PROFILE
// ============================================
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user found'
      });
    }

    const user = await User.findById(req.user.id || req.user._id).select(
      '-password -otp -otpExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ Profile fetched for: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        jobTitle: user.jobTitle,
        industry: user.industry,
        companySize: user.companySize,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        role: user.role,
        isFreeUser: user.isFreeUser,
        hasAccessToDashboard: user.hasAccessToDashboard,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// ============================================
// 2. UPDATE USER PROFILE
// ============================================
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { name, phone, company, jobTitle, industry, companySize, avatar } = req.body;

    const allowedUpdates = ['name', 'phone', 'company', 'jobTitle', 'industry', 'companySize', 'avatar'];
    const updates = Object.keys(req.body);
    
    const invalidUpdates = updates.filter(update => !allowedUpdates.includes(update));
    if (invalidUpdates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidUpdates.join(', ')}`
      });
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { name, phone, company, jobTitle, industry, companySize, avatar },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires');

    console.log(`✅ Profile updated for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// ============================================
// 3. CHANGE PASSWORD
// ============================================
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    const user = await User.findById(req.user.id || req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed for: ${user.email}`);

    await sendEmail(
      user.email,
      'Password Changed',
      'Your password has been changed successfully. If this was not you, please contact support.'
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
    });
  }
};

// ============================================
// 4. DELETE ACCOUNT
// ============================================
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findById(req.user.id || req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    const userEmail = user.email;
    await User.findByIdAndDelete(req.user.id || req.user._id);

    console.log(`🗑️ Account deleted for: ${userEmail}`);

    await sendEmail(
      userEmail,
      'Account Deleted',
      'Your account has been permanently deleted.'
    );

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting account'
    });
  }
};

// ============================================
// 5. REQUEST EMAIL VERIFICATION
// ============================================
exports.requestEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(
      user.email,
      'Email Verification Code',
      `Your verification code is: <strong>${otp}</strong><br><br>This code will expire in 10 minutes.`
    );

    console.log(`📧 Verification OTP sent to: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('❌ Request email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting email verification'
    });
  }
};

// ============================================
// 6. VERIFY EMAIL
// ============================================
exports.verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    const user = await User.findById(req.user.id || req.user._id).select('+otp +otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log(`✅ Email verified for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

module.exports = exports;