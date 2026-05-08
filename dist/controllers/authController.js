// backend/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// ============================================
// HELPER: Generate JWT Tokens
// ============================================
const generateTokens = (userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { token, refreshToken };
};
// ============================================
// HELPER: Get PayPal Access Token
// ============================================
const getPayPalAccessToken = async () => {
    try {
        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
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
    }
    catch (error) {
        console.error('❌ PayPal token error:', error);
        throw error;
    }
};
// ============================================
// HELPER: Send Email (FIXED - Uses SMTP env vars)
// ============================================
const sendEmail = async (email, subject, message) => {
    try {
        // ✅ VALIDATE CORRECT ENVIRONMENT VARIABLES
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
            console.error('❌ Email configuration missing. Ensure SMTP_USER, SMTP_PASS, and SMTP_HOST are set in .env');
            throw new Error('Email service not properly configured');
        }
        console.log('📧 Attempting to send email via SMTP...');
        console.log('🔍 DEBUG:');
        console.log('   SMTP_HOST:', process.env.SMTP_HOST);
        console.log('   SMTP_PORT:', process.env.SMTP_PORT);
        console.log('   SMTP_USER:', JSON.stringify(process.env.SMTP_USER));
        console.log('   SMTP_USER (trimmed):', JSON.stringify(process.env.SMTP_USER.trim()));
        console.log('   SMTP_PASS length:', process.env.SMTP_PASS.length);
        console.log('   SMTP_PASS (trimmed) length:', process.env.SMTP_PASS.trim().length);
        // ✅ CREATE TRANSPORTER WITH CORRECT SMTP SETTINGS
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true' ? true : false, // false for 587, true for 465
            auth: {
                user: (process.env.SMTP_USER || '').trim(),
                pass: (process.env.SMTP_PASS || '').trim()
            }
        });
        // ✅ TEST CONNECTION FIRST
        await transporter.verify();
        console.log('✅ Email SMTP connection verified');
        const mailOptions = {
            from: process.env.SMTP_USER, // Use the SMTP user as sender
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4F46E5; margin-bottom: 20px;">📧 EmailAI Pro</h2>
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
        console.log(`✅ Email sent successfully to ${email}`);
        console.log(`📨 Message ID: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Email error for ${email}:`, error.message);
        console.error('📋 Troubleshooting:');
        console.error('   1. Check .env file for SMTP_USER, SMTP_PASS, SMTP_HOST');
        console.error('   2. Ensure NO extra spaces in .env around = sign');
        console.error('   3. Verify SMTP credentials are correct');
        console.error('   4. For Gmail: Use app-specific password, not regular password');
        console.error('   5. Gmail requires 2FA and app password setup');
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
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        console.log('📧 Checking email:', email);
        const existingUser = await User.findOne({ email }).select('_id');
        return res.status(200).json({
            success: true,
            data: {
                available: !existingUser,
                exists: !!existingUser
            }
        });
    }
    catch (error) {
        console.error('❌ Email check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking email availability'
        });
    }
};
// ============================================
// 2. SEND OTP
// ============================================
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        console.log(`📧 Sending OTP to ${email}`);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
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
            data: {
                email: email,
                expiresIn: 600
            }
        });
    }
    catch (error) {
        console.error('❌ Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
};
// ============================================
// 3. SIGN UP
// ============================================
exports.signUp = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone, company, jobTitle, industry, companySize } = req.body;
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and confirm password are required'
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const user = new User({
            name,
            email,
            password,
            phone,
            company,
            jobTitle,
            industry,
            companySize,
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
        console.log(`📧 OTP sent to ${email}: ${otp}`);
        res.status(201).json({
            success: true,
            message: 'Account created! OTP sent to your email',
            data: {
                email: user.email,
                nextStep: 'verify-email'
            }
        });
    }
    catch (error) {
        console.error('❌ Sign up error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// 4. VERIFY OTP
// ============================================
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }
        console.log(`🔍 Verifying OTP for ${email}: ${otp}`);
        const user = await User.findOne({ email }).select('+otp +otpExpires');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        console.log(`📊 User OTP in DB: ${user.otp}`);
        console.log(`✅ OTP Match: ${user.otp === otp}`);
        console.log(`✅ Not Expired: ${user.otpExpires > new Date()}`);
        if (user.otp !== otp || user.otpExpires < new Date()) {
            console.log(`❌ OTP mismatch or expired`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        user.emailVerified = true;
        user.otpVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        const userCount = await User.countDocuments();
        console.log(`📊 Total users: ${userCount}`);
        if (userCount <= 5) {
            user.isFreeUser = true;
            user.paymentStatus = 'completed';
            user.hasAccessToDashboard = true;
            user.paymentDate = new Date();
            user.userNumber = userCount;
            await user.save();
            console.log(`🎉 Free user #${userCount}: ${email}`);
            return res.status(200).json({
                success: true,
                message: '🎉 Email verified! You got FREE access!',
                data: {
                    email: user.email,
                    isFreeUser: true,
                    userNumber: userCount,
                    nextStep: 'dashboard'
                }
            });
        }
        else {
            user.paymentStatus = 'pending';
            user.hasAccessToDashboard = false;
            user.userNumber = userCount;
            await user.save();
            console.log(`💳 Paid user #${userCount}: ${email}`);
            return res.status(200).json({
                success: true,
                message: '✅ Email verified! Now select a plan and complete payment.',
                data: {
                    email: user.email,
                    isFreeUser: false,
                    userNumber: userCount,
                    nextStep: 'plan-selection'
                }
            });
        }
    }
    catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// 5. SIGN IN
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
        // ✅ CHANGED: Return 404 with specific message for non-existent email
        if (!user) {
            console.log(`❌ Login attempt with non-existent email: ${email}`);
            return res.status(404).json({
                success: false,
                message: 'Email not found. Please sign up first.',
                code: 'EMAIL_NOT_FOUND',
                data: {
                    email: email,
                    nextStep: 'signup'
                }
            });
        }
        if (user.isLocked()) {
            return res.status(401).json({
                success: false,
                message: 'Account is locked. Try again later'
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incLoginAttempts();
            console.log(`❌ Invalid password for ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        if (!user.emailVerified) {
            console.log(`❌ Unverified email attempt: ${email}`);
            return res.status(403).json({
                success: false,
                message: 'Please verify your email first',
                code: 'EMAIL_NOT_VERIFIED',
                data: {
                    email: user.email,
                    nextStep: 'verify-email'
                }
            });
        }
        if (!user.hasAccessToDashboard) {
            console.log(`❌ No dashboard access: ${email} - Payment status: ${user.paymentStatus}`);
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
        await user.resetLoginAttempts();
        const { token, refreshToken } = generateTokens(user._id);
        console.log(`✅ Login successful: ${email}`);
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isFreeUser: user.isFreeUser,
                    hasAccessToDashboard: user.hasAccessToDashboard
                },
                token,
                refreshToken
            }
        });
    }
    catch (error) {
        console.error('❌ Sign in error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sign in'
        });
    }
};
// ============================================
// 6. SIGN OUT
// ============================================
exports.signOut = async (req, res) => {
    try {
        console.log(`👋 User logged out: ${req.user.id}`);
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('❌ Sign out error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sign out'
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
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const { token, refreshToken: newRefreshToken } = generateTokens(decoded.id);
        res.status(200).json({
            success: true,
            data: {
                token,
                refreshToken: newRefreshToken
            }
        });
    }
    catch (error) {
        console.error('❌ Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};
// ============================================
// 8. FORGOT PASSWORD
// ============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        console.log(`🔑 Forgot password request for ${email}`);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a reset code will be sent'
            });
        }
        const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = resetOTP;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendEmail(email, 'Password Reset OTP', `Your password reset code is: <strong>${resetOTP}</strong><br><br>This code will expire in 10 minutes.`);
        console.log(`✅ Reset OTP sent to ${email}: ${resetOTP}`);
        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a reset code will be sent'
        });
    }
    catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request'
        });
    }
};
// ============================================
// 9. RESET PASSWORD
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;
        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and passwords are required'
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        console.log(`🔑 Resetting password for ${email}`);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        console.log(`✅ Password reset for ${email}`);
        await sendEmail(email, 'Password Reset Successful', 'Your password has been reset successfully. You can now log in with your new password.');
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
};
// ============================================
// 10. PLAN SELECTION
// ============================================
exports.selectPlan = async (req, res) => {
    try {
        const { email, plan } = req.body;
        console.log(`📋 Plan selection request: ${email} - ${plan}`);
        if (!['starter', 'pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan. Choose: starter, pro, or enterprise'
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (!user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email not verified'
            });
        }
        user.selectedPlan = plan;
        user.paymentStatus = 'pending';
        await user.save();
        console.log(`✅ Plan saved: ${email} - ${plan}`);
        const planDetails = {
            starter: {
                price: 9.99,
                name: 'Starter',
                features: ['100 campaigns/month', '1,000 subscribers', 'Basic analytics']
            },
            pro: {
                price: 29.99,
                name: 'Pro',
                features: ['1,000 campaigns/month', '10,000 subscribers', 'Advanced analytics']
            },
            enterprise: {
                price: 99.99,
                name: 'Enterprise',
                features: ['Unlimited campaigns', 'Unlimited subscribers', 'Priority support']
            }
        };
        res.status(200).json({
            success: true,
            message: 'Plan selected successfully',
            data: {
                email: user.email,
                selectedPlan: plan,
                planDetails: planDetails[plan],
                nextStep: 'payment'
            }
        });
    }
    catch (error) {
        console.error('❌ Select plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// 11. CREATE PAYPAL ORDER
// ============================================
exports.createPayPalOrder = async (req, res) => {
    try {
        const { email, plan } = req.body;
        console.log(`💳 Creating PayPal order: ${email} - ${plan}`);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const planPrices = {
            starter: '9.99',
            pro: '29.99',
            enterprise: '99.99'
        };
        const planNames = {
            starter: 'Starter Plan',
            pro: 'Pro Plan',
            enterprise: 'Enterprise Plan'
        };
        const accessToken = await getPayPalAccessToken();
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: planPrices[plan]
                    },
                    description: planNames[plan]
                }
            ],
            return_url: `${process.env.FRONTEND_URL}/payment-success?email=${email}&plan=${plan}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?email=${email}`
        };
        const response = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(orderData)
        });
        const order = await response.json();
        if (!response.ok) {
            console.error('❌ PayPal error:', order);
            return res.status(400).json({
                success: false,
                message: 'Failed to create PayPal order',
                error: order
            });
        }
        console.log(`✅ PayPal order created: ${order.id}`);
        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                approveUrl: order.links.find(link => link.rel === 'approve')?.href
            }
        });
    }
    catch (error) {
        console.error('❌ Create PayPal order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// 12. CAPTURE PAYPAL ORDER
// ============================================
exports.capturePayPalOrder = async (req, res) => {
    try {
        const { email, orderId } = req.body;
        console.log(`💰 Capturing PayPal order: ${orderId}`);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const order = await response.json();
        if (order.status === 'COMPLETED') {
            user.paymentStatus = 'completed';
            user.paymentDate = new Date();
            user.paypalTransactionId = orderId;
            user.hasAccessToDashboard = true;
            await user.save();
            console.log(`✅ Payment successful for ${email}`);
            res.status(200).json({
                success: true,
                message: '🎉 Payment successful!',
                data: {
                    email: user.email,
                    hasAccessToDashboard: true,
                    selectedPlan: user.selectedPlan,
                    nextStep: 'dashboard'
                }
            });
        }
        else {
            user.paymentStatus = 'failed';
            await user.save();
            console.log(`❌ Payment failed for ${email}`);
            res.status(400).json({
                success: false,
                message: 'Payment could not be completed',
                data: { nextStep: 'retry-payment' }
            });
        }
    }
    catch (error) {
        console.error('❌ Capture PayPal order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// 13. CHECK PAYMENT STATUS
// ============================================
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            data: {
                email: user.email,
                isFreeUser: user.isFreeUser,
                paymentStatus: user.paymentStatus,
                hasAccessToDashboard: user.hasAccessToDashboard,
                selectedPlan: user.selectedPlan
            }
        });
    }
    catch (error) {
        console.error('❌ Check payment status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = exports;
//# sourceMappingURL=authController.js.map