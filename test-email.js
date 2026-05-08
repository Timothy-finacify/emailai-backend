// test-email.js
const nodemailer = require('nodemailer');

// Your Gmail credentials (copy from your .env)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'atohtimothy@gmail.com',
    pass: 'amujfxriwhhspekv'  // Your app password
  }
});
  


async function testEmail() {
  try {
    console.log('📧 Testing email send...');
    
    const info = await transporter.sendMail({
      from: 'atohtimothy@gmail.com',
      to: 'atohtimothy@gmail.com', // Send to yourself
      subject: 'Test Email',
      text: 'If you receive this, email is working!'
    });
    
    console.log('✅ SUCCESS! Email sent!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.log('❌ FAILED! Error:');
    console.log(error.message);
  }
}

testEmail();