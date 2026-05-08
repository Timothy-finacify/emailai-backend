const nodemailer = require('nodemailer');
const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'smtp';
    
    // Initialize Resend if selected
    if (this.provider === 'resend' && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Email service ready (Provider: Resend)');
      return;
    }
    
    // Fallback to SMTP
    this.initSMTP();
  }

  initSMTP() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // 🔥 CRITICAL FIX for Render - Force IPv4
      family: 4,  // This prevents IPv6 timeout issues
      connectionTimeout: 30000,
      socketTimeout: 30000
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service connection failed:', error.message);
        console.error('   ⚠️  Consider switching to Resend provider (EMAIL_PROVIDER=resend)');
      } else {
        console.log('✅ Email service ready (Provider: SMTP)');
      }
    });
  }

  // Your existing templates remain exactly the same
  getEmailTemplate(content) {
    // ... (keep your existing template method exactly as is)
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: #f5f7fa;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: -0.5px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
          }
          .body-content {
            padding: 40px 35px;
          }
          .body-content h2 {
            font-size: 22px;
            color: #1a202c;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .body-content p {
            color: #4a5568;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border: 2px solid #667eea;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 38px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #667eea;
            font-family: 'Courier New', monospace;
            word-spacing: 10px;
          }
          .otp-info {
            color: #718096;
            font-size: 13px;
            margin-top: 15px;
            font-weight: 500;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            margin: 25px 0;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .feature-list {
            margin: 25px 0;
          }
          .feature-list li {
            color: #4a5568;
            font-size: 14px;
            margin: 12px 0;
            padding-left: 25px;
            position: relative;
          }
          .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            background: #f8fafc;
            padding: 25px 35px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #718096;
            font-size: 12px;
            margin: 8px 0;
            line-height: 1.5;
          }
          .footer-links {
            margin-top: 15px;
          }
          .footer-links a {
            color: #667eea;
            text-decoration: none;
            font-size: 12px;
            margin: 0 12px;
          }
          .footer-links a:hover {
            text-decoration: underline;
          }
          .social-icons {
            margin-top: 15px;
          }
          .social-icons a {
            display: inline-block;
            width: 36px;
            height: 36px;
            background: #e2e8f0;
            border-radius: 50%;
            text-align: center;
            line-height: 36px;
            margin: 0 5px;
            color: #667eea;
            text-decoration: none;
          }
          .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 25px 0;
          }
          .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            color: #92400e;
            font-size: 13px;
          }
          @media (max-width: 600px) {
            .body-content {
              padding: 25px 20px;
            }
            .header {
              padding: 30px 20px;
            }
            .otp-code {
              font-size: 32px;
              letter-spacing: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${content}
        </div>
      </body>
      </html>
    `;
  }

  // Updated _sendEmail method to support both providers
  async _sendEmail(to, subject, content) {
    try {
      const htmlContent = this.getEmailTemplate(content);
      
      // Use Resend for production
      if (this.provider === 'resend' && this.resend) {
        const { data, error } = await this.resend.emails.send({
          from: process.env.EMAIL_FROM || `"EmailBrain" <noreply@${process.env.DOMAIN || 'emailbrain.com'}>`,
          to: [to],
          subject,
          html: htmlContent,
          reply_to: 'support@emailpro.com'
        });
        
        if (error) throw error;
        console.log(`✅ Email sent (Resend): ${subject} → ${to}`);
        return true;
      }
      
      // Use SMTP (with IPv4 fix)
      await this.transporter.sendMail({
        from: `"EmailBrain" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        replyTo: 'support@emailpro.com'
      });

      console.log(`✅ Email sent (SMTP): ${subject} → ${to}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Email failed (${subject}):`, error.message);
      return false;
    }
  }

  // Keep ALL your existing methods exactly as they are:
  // - sendOTP()
  // - sendWelcomeEmail()
  // - sendPasswordResetConfirmation()
  // - sendAccountNotification()
  // - sendTestEmail()
  
  // They remain unchanged - just using the updated _sendEmail()
  
  async sendOTP(email, otp, purpose = 'verification') {
    const isPasswordReset = purpose === 'password-reset';
    const subject = isPasswordReset 
      ? '🔐 Reset Your Password - EmailBrain'
      : '✉️ Verify Your Email - EmailBrain';

    const headerSubtitle = isPasswordReset
      ? 'Password Reset Request'
      : 'Email Verification';

    const mainTitle = isPasswordReset
      ? 'Reset Your Password'
      : 'Verify Your Email Address';

    const description = isPasswordReset
      ? 'We received a request to reset your password. Use the code below to proceed:'
      : 'Thank you for signing up! Use the verification code below to complete your registration:';

    const content = `
      <div class="header">
        <h1>EmailBrain</h1>
        <p>${headerSubtitle}</p>
      </div>
      
      <div class="body-content">
        <h2>${mainTitle}</h2>
        <p>${description}</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <p class="otp-info">This code expires in 10 minutes</p>
        </div>
        
        <div class="warning-box">
          ⚠️ Never share this code with anyone. We will never ask for this code via email or phone.
        </div>
        
        <p>If you didn't request this ${isPasswordReset ? 'password reset' : 'verification'}, you can safely ignore this email.</p>
      </div>
      
      <div class="footer">
        <p>Need help? <a href="${process.env.FRONTEND_URL}/support">Contact our support team</a></p>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL}/privacy">Privacy Policy</a>
          <a href="${process.env.FRONTEND_URL}/terms">Terms of Service</a>
          <a href="${process.env.FRONTEND_URL}/contact">Contact Us</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} EmailBrain. All rights reserved.</p>
        <p>🌍 Made with ❤️ for teams worldwide</p>
      </div>
    `;

    return this._sendEmail(email, subject, content);
  }

  // Add your other methods (welcomeEmail, passwordResetConfirmation, etc.)
  // They remain exactly as you have them - just calling _sendEmail()
  
  async sendWelcomeEmail(user) {
    const subject = `🎉 Welcome to EmailBrain, ${user.name?.split(' ')[0] || 'there'}!`;

    const content = `
      <div class="header">
        <h1>Welcome to EmailBrain!</h1>
        <p>Your AI-Powered Email Marketing Platform</p>
      </div>
      
      <div class="body-content">
        <h2>Hello ${user.name?.split(' ')[0] || 'there'}! 👋</h2>
        <p>We're thrilled to have you on board! Your account has been successfully created and is ready to use.</p>
        
        <p style="font-weight: 600; color: #667eea; margin-top: 25px;">Account Information</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Account Type:</strong> ${user.plan || 'Starter'}</p>
        ${user.company ? `<p><strong>Company:</strong> ${user.company}</p>` : ''}
        
        <div class="divider"></div>
        
        <p style="font-weight: 600; color: #1a202c; margin-bottom: 15px;">Getting Started</p>
        <ul class="feature-list">
          <li>Create your first email campaign</li>
          <li>Explore our AI-powered templates</li>
          <li>Import your subscriber list</li>
          <li>Set up your email analytics</li>
          <li>Access advanced personalization tools</li>
        </ul>
        
        <center>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">Go to Dashboard →</a>
        </center>
        
        <p style="margin-top: 30px; color: #718096; font-size: 14px;">
          <strong>Pro Tip:</strong> Check out our <a href="${process.env.FRONTEND_URL}/docs" style="color: #667eea;">documentation</a> to learn advanced features and best practices.
        </p>
      </div>
      
      <div class="footer">
        <p><strong>Questions?</strong> We're here to help!</p>
        <p>Email us at <a href="mailto:support@emailpro.com">support@emailpro.com</a></p>
        <div class="social-icons">
          <a href="https://twitter.com/emailaipro" title="Twitter">𝕏</a>
          <a href="https://linkedin.com/company/emailaipro" title="LinkedIn">in</a>
          <a href="https://facebook.com/emailaipro" title="Facebook">f</a>
        </div>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL}/privacy">Privacy</a>
          <a href="${process.env.FRONTEND_URL}/terms">Terms</a>
          <a href="${process.env.FRONTEND_URL}/contact">Contact</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} EmailBrain. All rights reserved.</p>
      </div>
    `;

    return this._sendEmail(user.email, subject, content);
  }

  async sendTestEmail(email) {
    const subject = '🧪 Test Email - EmailBrain';
    const content = `
      <div class="header">
        <h1>Test Successful!</h1>
        <p>Your email service is working</p>
      </div>
      
      <div class="body-content">
        <h2>Email Service is Connected</h2>
        <p>This is a test email to verify that your EmailBrain email service is properly configured and working.</p>
        <p><strong>Provider:</strong> ${this.provider}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <center>
          <a href="${process.env.FRONTEND_URL}" class="cta-button">Visit Dashboard →</a>
        </center>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} EmailBrain. All rights reserved.</p>
      </div>
    `;

    return this._sendEmail(email, subject, content);
  }
}

module.exports = new EmailService();