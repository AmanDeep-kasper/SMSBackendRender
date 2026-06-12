// const nodemailer = require('nodemailer');
import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  try {
    console.log("\n=========================================");
    console.log(`📧 Email would be sent to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`🔐 OTP Code: ${text.split(':').pop().trim()}`);
    console.log("=========================================\n");
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"School Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// module.exports = sendEmail;
export default sendEmail;