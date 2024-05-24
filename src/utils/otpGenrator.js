import otpGenerator from "otp-generator";

// Function to generate an OTP
const generateOTP = () => {
  // Generate a 6-digit OTP
  const otp = otpGenerator.generate(6, {
    digits: true,
    alphabets: true,
    upperCase: true,
    specialChars: false,
  });

  return otp;
};

export { generateOTP };
