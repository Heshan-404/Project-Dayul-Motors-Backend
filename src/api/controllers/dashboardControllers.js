import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/config";
import pool from "../../utils/database.connection";

export const getLowStockItems = async (req, res) => {
  try {
    const query = "SELECT * FROM products WHERE quantity < minquantitylevel";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTotalUserCount = async (req, res) => {
  try {
    const query = "SELECT COUNT(*) as total_users FROM users";
    const result = await pool.query(query);
    res.json(result.rows[0].total_users);
  } catch (error) {
    console.error("Error fetching total user count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTotalItemsCount = async (req, res) => {
  try {
    const query = "SELECT COUNT(*) as total_items FROM products";
    const result = await pool.query(query);
    res.json(result.rows[0].total_items);
  } catch (error) {
    console.error("Error fetching total items count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMonthlySalesData = async (req, res) => {
  try {
    const { year, month } = req.query;
    const query =
      "SELECT SUM(totalamount) as total_sales, DATE_PART('day', orderdate) as day FROM orders WHERE orderStatus = 'Completed' AND EXTRACT(YEAR FROM orderdate) = $1 AND EXTRACT(MONTH FROM orderdate) = $2 GROUP BY day ORDER BY day";
    const result = await pool.query(query, [year, month]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching monthly sales data:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getLastMonthSalesData = async (req, res) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let lastYear = currentYear;
    let lastMonth = currentMonth - 1;
    if (lastMonth < 0) {
      lastYear--;
      lastMonth = 11;
    }

    const query =
      "SELECT SUM(totalamount) as total_sales, DATE_PART('day', orderdate) as day FROM orders WHERE orderStatus = 'Completed' AND EXTRACT(YEAR FROM orderdate) = $1 AND EXTRACT(MONTH FROM orderdate) = $2 GROUP BY day ORDER BY day";
    const result = await pool.query(query, [lastYear, lastMonth + 1]);

    const formattedSalesData = result.rows.map((item) => ({
      day: item.day,
      total_sales: parseFloat(item.total_sales).toFixed(2),
    }));

    res.json(formattedSalesData);
  } catch (error) {
    console.error("Error fetching last month sales data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productid } = req.params;
    const { productname, quantity, minquantitylevel } = req.body;

    const query =
      "UPDATE products SET productname = $1, quantity = $2, minquantitylevel = $3 WHERE productid = $4";
    const result = await pool.query(query, [
      productname,
      quantity,
      minquantitylevel,
      productid,
    ]);
    if (result.rowCount > 0) {
      res.json({ message: "Product updated successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSettings = async (req, res) => {
  try {
    const query = "SELECT * FROM settings LIMIT 1";
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { contactNumber, email, transporterKey, id } = req.body;
    console.log(req.body);
    const checkQuery = "SELECT 1 FROM settings";
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      const updateQuery =
        "UPDATE settings SET contact_number = $1, email = $2, transporter_key = $3 WHERE id = $4";
      const updateResult = await pool.query(updateQuery, [
        contactNumber,
        email,
        transporterKey,
        id,
      ]);
      if (updateResult.rowCount > 0) {
        res.json({ message: "Settings updated successfully" });
      } else {
        res
          .status(500)
          .json({ message: "Error updating settings: No rows updated" });
      }
    } else {
      const insertQuery =
        "INSERT INTO settings (contact_number, email, transporter_key) VALUES ($1, $2, $3)";
      const insertResult = await pool.query(insertQuery, [
        contactNumber,
        email,
        transporterKey,
      ]);
      if (insertResult.rowCount > 0) {
        res.json({ message: "Settings inserted successfully" });
      } else {
        res
          .status(500)
          .json({ message: "Error inserting settings: No rows inserted" });
      }
    }
  } catch (error) {
    console.error("Error updating/inserting settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};
