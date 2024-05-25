import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/config";
import pool from "../../utils/database.connection";

export const registerAdmin = async (req, res) => {
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

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = "SELECT * FROM adminaccounts WHERE email = $1";
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
