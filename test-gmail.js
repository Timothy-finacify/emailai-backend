// backend/test-gmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmailConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 Gmail SMTP Connection Test');
  console.log('='.repeat(60));

  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? `[${process.env.SMTP_PASS.length} chars]` : 'NOT SET'}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);

  // Check if credentials are set
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ ERROR: SMTP_USER or SMTP_PASS not set in .env');
    process.exit(1);
  }

  // Create transporter
  console.log('\n🔗 Creating SMTP Transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || 587),
    secure: false, // false for port 587
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim()
    }
  });

  // Test connection
  console.log('\n🧪 Testing SMTP Connection...');
  try {
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('✅ SUCCESS: Gmail SMTP connection verified!');
      console.log('\n🚀 You can now send emails.');
      
      // Try sending a test email
      console.log('\n📧 Sending test email...');
      const testEmail = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER, // Send to self
        subject: '✅ EmailBrain Test Email',
        html: `
          <h2>Email Configuration Works!</h2>
          <p>Your SMTP setup is correct and emails can be sent.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Host: ${process.env.SMTP_HOST}</li>
            <li>Port: ${process.env.SMTP_PORT}</li>
            <li>User: ${process.env.SMTP_USER}</li>
          </ul>
        `
      });
      
      console.log('✅ Test email sent!');
      console.log(`📨 Message ID: ${testEmail.messageId}`);
    }
  } catch (error) {
    console.log('❌ FAILED: Connection error');
    console.log(`\n📌 Error: ${error.message}`);
    
    // Specific error handling
    if (error.message.includes('Invalid login')) {
      console.log('\n⚠️  DIAGNOSIS: Invalid Email/Password');
      console.log('Solutions:');
      console.log('1. Check that SMTP_PASS is the 16-char APP PASSWORD (not regular password)');
      console.log('2. Make sure 2FA is enabled on your Google account');
      console.log('3. Remove any spaces from the app password');
      console.log('4. Try generating a NEW app password:');
      console.log('   - Go to: https://myaccount.google.com/apppasswords');
      console.log('   - Select: Windows Computer + Mail');
      console.log('   - Copy the 16-char password (no spaces)');
      console.log('   - Update .env and restart');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  DIAGNOSIS: Cannot connect to server');
      console.log('Solutions:');
      console.log('1. Check internet connection');
      console.log('2. Verify SMTP_HOST is correct (smtp.gmail.com)');
      console.log('3. Check firewall/antivirus not blocking port 587');
      console.log('4. Try port 465 (with SMTP_SECURE=true)');
    }
    
    process.exit(1);
  }
}

testGmailConnection();