const nodemailer = require('nodemailer');

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD // Your email password or app-specific password
    }
});

// Middleware for sending email
const sendEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: email, // Receiver address
        subject: 'Your OTP for Password Reset', // Subject line
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`, // Plain text body
        html: `<p>Your OTP is <b>${otp}</b>. It is valid for <b>10 minutes</b>.</p>` // HTML body
    };

    try {
        // Send email
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

module.exports = sendEmail;
