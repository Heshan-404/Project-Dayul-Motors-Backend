// /src/models/userModel.js
import pool from "../../utils/database.connection";
import bcrypt from "bcryptjs";

// Create the user table if it doesn't exist
const createUserTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Users (
      UserID VARCHAR(12) PRIMARY KEY,
      FullName VARCHAR(255) NOT NULL,
      Email VARCHAR(100) NOT NULL UNIQUE,
      PhoneNo VARCHAR(20) NOT NULL UNIQUE,
      Address VARCHAR(255) NOT NULL,
      Password VARCHAR(255) NOT NULL 
    )
  `;
  await pool.query(queryText);
};

createUserTable();

export const findUserByEmail = async (email) => {
  const queryText = "SELECT * FROM Users WHERE Email = ?";
  const [rows] = await pool.query(queryText, [email]);
  console.log(rows);
  return rows[0];
};

export const createUser = async (
  userID,
  fullName,
  email,
  phoneNo,
  address,
  password
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    "INSERT INTO Users (UserID, FullName, Email, PhoneNo, Address, Password) VALUES (?, ?, ?, ?, ?, ?)";
  const [result] = await pool.query(queryText, [
    userID,
    fullName,
    email,
    phoneNo,
    address,
    hashedPassword,
  ]);
  return result;
};
