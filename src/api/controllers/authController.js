import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/config";
import pool from "../../utils/database.connection";
import { sendMail } from "../../utils/sendemail";
import { generateOTP } from "../../utils/otpGenrator";

export const passwordReset = async (req, res) => {
  const { password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Update the password in the database
    const client = await pool.connect();
    const updateQuery =
      "UPDATE users SET password = $1, reset_password_otp = null WHERE email = $2";
    await client.query(updateQuery, [hashedPassword, email]);
    client.release();

    // Send a response indicating success
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const OTPCheck = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const client = await pool.connect();
    const queryText = "SELECT reset_password_otp FROM users WHERE email = $1";
    const result = await client.query(queryText, [email]);
    const storedOTP = result.rows[0]?.reset_password_otp; // Access the OTP value
    if (!storedOTP) {
      client.release();
      return res
        .status(404)
        .json({ message: "OTP not found. Please try again." });
    } else {
      if (storedOTP.toUpperCase() === otp.toUpperCase()) {
        // Convert both OTPs to uppercase for comparison
        client.release();
        return res
          .status(200)
          .json({
            message: "OTP matched. Proceed with password reset.",
            OTP: `${otp}`,
          });
      } else {
        client.release();
        return res
          .status(400)
          .json({ message: "Invalid OTP. Please try again." });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendOTP = async (req, res) => {
  const email = req.body.email;
  try {
    const client = await pool.connect();
    const queryText = "SELECT * FROM users WHERE email = $1";
    const result = await client.query(queryText, [email]);
    const user = result.rows[0];

    if (!user) {
      client.release();
      return res.status(404).json({ message: "Email is not valid" });
    }

    const otp = generateOTP().toUpperCase();
    const otpExpiration = new Date(Date.now() + 300000); // 5mins from now

    // Save the OTP and expiration time to the user
    const updateQuery = `
        UPDATE users 
        SET reset_password_otp = $1, reset_password_expires = $2 
        WHERE email = $3`;
    await client.query(updateQuery, [otp, otpExpiration, email]);
    client.release();

    const companyEmail = config.COMPANY_EMAIL;
    const companyName = config.COMPANY_NAME;
    const mailOptions = {
      from: {
        name: `${companyName}`,
        address: `${companyEmail}`,
      },
      to: `${email}`,
      subject: "Password Reset OTP",
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; padding: 20px; width: 400px; height: 500px;">
        <h2 style="color: #555; text-align: center;">Dayul Motors Password Reset OTP</h2>
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 100%; box-sizing: border-box;">
          <p style="font-size: 16px; text-align: center;">Your Dayul Motors store account password reset OTP is:</p>
          <h1 style="font-size: 36px; color: #007bff; text-align: center; margin-bottom: 20px; ">${otp}</h1>
          <p style="font-size: 16px; text-align: center;">It is valid for 5 minutes.</p>
        </div>
      </div>
    `,
    };

    await sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const registerUser = async (req, res) => {
  const { fullName, email, phoneNo, address, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = `USR${Math.floor(Math.random() * 10000)}`;
    const query = `
      INSERT INTO Users (UserID, FullName, Email, PhoneNo, Address, Password)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [userID, fullName, email, phoneNo, address, hashedPassword];

    await pool.query(query, values);

    const token = jwt.sign({ email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const values = [email];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: user.userid, email: user.email },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
      }
    );

    res.json({
      token: token,
      user: {
        name: user.fullname,
        userid: user.userid,
      },
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
