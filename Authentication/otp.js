const crypto = require('crypto');

// Temporary storage for OTPs and phone numbers
const otpStore = {};
const OTP_EXPIRY_TIME = 2 * 60 * 1000; // 5 minutes



// Route to send OTP
const sendOtp = async (req,res) => {
    const { PhoneNumber } = req.body;

    if (!PhoneNumber || PhoneNumber.length !== 10) {
        return res.status(400).json({ status: 'FAILURE', message: 'Invalid phone number' });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP with expiration
    otpStore[PhoneNumber] = {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_TIME
    };

    console.log(`OTP for ${PhoneNumber} is ${otp}`); // In production, send OTP via SMS

    res.status(200).json({ status: 'SUCCESS', message: 'OTP sent to your phone' });
};

// Route to verify OTP
const verifyOtp =(req, res) => {
    const { PhoneNumber, OTP } = req.body;

    if (!PhoneNumber || !OTP) {
        return res.status(400).json({ status: 'FAILURE', message: 'Phone number and OTP are required' });
    }

    const otpData = otpStore[PhoneNumber];

    // Check if OTP exists, matches, and hasn't expired
    if (!otpData || otpData.otp !== OTP || otpData.expiresAt < Date.now()) {
        return res.status(400).json({ status: 'FAILURE', message: 'Invalid or expired OTP' });
    }

    // OTP is valid, remove it from the store
    delete otpStore[PhoneNumber];

    res.status(200).json({ status: 'SUCCESS', message: 'OTP verified successfully' });
};

module.exports = {sendOtp,verifyOtp};