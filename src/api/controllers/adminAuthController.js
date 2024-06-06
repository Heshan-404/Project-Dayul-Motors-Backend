import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/config";
import pool from "../../utils/database.connection";

export const registerAdmin = async (req, res) => {
  const { fullName, email, phoneNo, address, password, level } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Retrieve the latest adminID from the database
    const result = await pool.query(
      "SELECT adminid FROM adminaccounts ORDER BY adminid DESC LIMIT 1"
    );
    let adminid = "ADM001"; // Default adminID if there are no existing records
    if (result.rows.length > 0) {
      const latestID = result.rows[0].adminid;
      const num = parseInt(latestID.slice(3)) + 1; // Extract the number and increment it
      adminid = `ADM${num.toString().padStart(3, "0")}`; // Create new adminID
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
    // Check admin level from decoded token data
    const adminLevel = req.admin.level;
    // Retrieve admin details from the database
    let query;
    if (adminLevel == 3) {
      query = "SELECT * FROM adminaccounts WHERE level != 3";
    } else {
      // Exclude sensitive information if admin level is not sufficient
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

// ... (existing code)

export const freezeAdmin = async (req, res) => {
  const { adminid } = req.params;
  try {
    // Update the status of the admin account to 'freeze'
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
    // Update the status of the admin account to 'active'
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
    // Check if the admin exists
    const checkAdminQuery = "SELECT * FROM adminaccounts WHERE adminid = $1";
    const checkAdminValues = [adminid];
    const adminExists = await pool.query(checkAdminQuery, checkAdminValues);
    if (adminExists.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update the admin details
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
    // Check if the admin exists
    const checkAdminQuery = "SELECT * FROM adminaccounts WHERE adminid = $1";
    const checkAdminValues = [adminid];
    const adminExists = await pool.query(checkAdminQuery, checkAdminValues);
    if (adminExists.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Delete the admin account
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
    console.log("====================================");
    console.log("dsf");
    console.log("====================================");
    const query = "SELECT * FROM adminaccounts WHERE level = 3";
    const result = await pool.query(query);
    console.log("====================================");
    console.log(result);
    console.log("====================================");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching root admins:", error);
    res.status(500).json({ message: "Server error" });
  }
};
