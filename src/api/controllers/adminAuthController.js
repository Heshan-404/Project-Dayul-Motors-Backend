import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/config";
import pool from "../../utils/database.connection";

export const registerAdmin = async (req, res) => {
  const { fullName, email, phoneNo, address, password, level } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "SELECT adminid FROM adminaccounts ORDER BY adminid DESC LIMIT 1"
    );
    let adminid = "ADM001";
    if (result.rows.length > 0) {
      const latestID = result.rows[0].adminid;
      const num = parseInt(latestID.slice(3)) + 1;
      adminid = `ADM${num.toString().padStart(3, "0")}`;
    }
    const query = `
      INSERT INTO adminaccounts (adminid, fullname, email, phoneno , password, level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [adminid, fullName, email, phoneNo, hashedPassword, level];
    await pool.query(query, values);
    const token = jwt.sign({ email, level }, config.JWT_ADMIN_SECRET, {
      expiresIn: config.JWT_ADMIN_EXPIRES_IN,
    });
    res.status(201).json({ token });
  } catch (error) {
    console.error("Error during admin registration:", error);
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
      { id: user.userid, email: user.email, level: user.level },
      config.JWT_ADMIN_SECRET,
      {
        expiresIn: config.JWT_ADMIN_EXPIRES_IN,
      }
    );
    res.json({
      token: token,
      user: {
        name: user.fullname,
        userid: user.userid,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const adminDetails = async (req, res) => {
  try {
    const adminLevel = 3;
    let query;
    if (adminLevel == 3) {
      query = "SELECT * FROM adminaccounts WHERE level != 3";
    } else {
      query =
        "SELECT adminid, email, fullname,phoneno,level,status FROM adminaccounts WHERE level != 3";
    }
    const result = await pool.query(query);
    res.json({ adminDetails: result.rows, adminLevel });
  } catch (error) {
    console.error("Error retrieving admin details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const freezeAdmin = async (req, res) => {
  const { adminid } = req.params;
  try {
    const query =
      "UPDATE adminaccounts SET status = 'freeze' WHERE adminid = $1";
    const values = [adminid];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin account frozen successfully" });
  } catch (error) {
    console.error("Error during admin freeze:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unfreezeAdmin = async (req, res) => {
  const { adminid } = req.params;
  try {
    const query =
      "UPDATE adminaccounts SET status = 'active' WHERE adminid = $1";
    const values = [adminid];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin account unfrozen successfully" });
  } catch (error) {
    console.error("Error during admin unfreeze:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminDetails = async (req, res) => {
  const { adminid } = req.params;
  const { fullname, email, phoneno, level } = req.body;
  try {
    const checkAdminQuery = "SELECT * FROM adminaccounts WHERE adminid = $1";
    const checkAdminValues = [adminid];
    const adminExists = await pool.query(checkAdminQuery, checkAdminValues);
    if (adminExists.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const query = `
      UPDATE adminaccounts
      SET fullname = \$1, email = \$2, phoneno = \$3, level = \$4
      WHERE adminid = \$5
    `;
    const values = [fullname, email, phoneno, level, adminid];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "Failed to update admin details" });
    }
    res.json({ message: "Admin details updated successfully" });
  } catch (error) {
    console.error("Error during admin details update:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteAdmin = async (req, res) => {
  const { adminid } = req.params;
  try {
    const checkAdminQuery = "SELECT * FROM adminaccounts WHERE adminid = $1";
    const checkAdminValues = [adminid];
    const adminExists = await pool.query(checkAdminQuery, checkAdminValues);
    if (adminExists.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const deleteQuery = "DELETE FROM adminaccounts WHERE adminid = $1";
    const deleteValues = [adminid];
    await pool.query(deleteQuery, deleteValues);
    res.json({ message: "Admin account deleted successfully" });
  } catch (error) {
    console.error("Error during admin deletion:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getRootAdmins = async (req, res) => {
  try {
    const query = "SELECT * FROM adminaccounts WHERE level = 3";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching root admins:", error);
    res.status(500).json({ message: "Server error" });
  }
};
