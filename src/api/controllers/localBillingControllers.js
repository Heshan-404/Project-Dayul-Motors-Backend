// backend/controllers/localBillingControllers.js
import pool from "../../utils/database.connection";

// Search users by phone number
export const searchUsersByPhone = async (req, res) => {
  const phoneno = req.body.phone;
  console.log("====================================");
  console.log(phoneno);
  console.log("====================================");
  try {
    const result = await pool.query("SELECT * FROM users WHERE phoneno = $1", [
      phoneno,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search products by code or name
// Search products by code or name
export const searchProducts = async (req, res) => {
  const searchTerm = req.query.searchTerm;
  try {
    const result = await pool.query(
      "SELECT productid, productname, price, brandid FROM products WHERE productid LIKE $1 OR productname LIKE $2",
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Register a new user
export const registerUser = async (req, res) => {
  const { userid, fullname, email, phoneno, address, password } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (userid, fullname, email, phoneno, address, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userid, fullname, email, phoneno, address, password]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Create an order
export const createOrder = async (req, res) => {
  const { orderid, userid, paymentmethod, totalamount } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO orders (orderid, userid, paymentmethod, totalamount) VALUES ($1, $2, $3, $4) RETURNING *",
      [orderid, userid, paymentmethod, totalamount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add items to order
export const addOrderItems = async (req, res) => {
  const { orderid, items } = req.body;
  try {
    const values = items
      .map(
        (item) =>
          `('${item.orderitemid}', '${orderid}', '${item.productid}', ${item.price}, ${item.quantity})`
      )
      .join(",");
    const result = await pool.query(
      `INSERT INTO orderitems (orderitemid, orderid, productid, price, quantity) VALUES ${values} RETURNING *`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
