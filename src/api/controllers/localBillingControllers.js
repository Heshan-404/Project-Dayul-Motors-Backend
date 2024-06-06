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
  const { fullname, email, phoneno, address, password } = req.body;

  try {
    // 1. Get the last user ID from the database
    const lastUserIdResult = await pool.query(
      "SELECT userid FROM users ORDER BY userid DESC LIMIT 1"
    );

    // 2. Generate the new user ID
    let newUserId;
    if (lastUserIdResult.rows.length > 0) {
      const lastUserId = lastUserIdResult.rows[0].userid;
      const lastIdNumber = parseInt(lastUserId.substring(4)); // Extract numeric part
      const nextIdNumber = lastIdNumber + 1;
      newUserId = `USR_${nextIdNumber.toString().padStart(5, "0")}`; // Format the new ID
    } else {
      // If no users exist, start with USR_00001
      newUserId = "USR_00001";
    }

    // 3. Insert the new user into the database
    const result = await pool.query(
      "INSERT INTO users (userid, fullname, email, phoneno, address, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [newUserId, fullname, email, phoneno, address, password]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Create an order

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
// Place an order
export const placeOrder = async (req, res) => {
  const { userid, paymentmethod, totalamount, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Items array is required and should not be empty." });
  }

  try {
    const orderid = await generateNextOrderID();
    const orderResult = await pool.query(
      "INSERT INTO orders (orderid, userid, paymentmethod, totalamount, orderstatus) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [orderid, userid, paymentmethod, totalamount, "Completed"]
    );

    await Promise.all(
      items.map(async (item) => {
        if (!item.productid || !item.price || !item.quantity) {
          throw new Error(
            "Each item must have a productid, price, and quantity."
          );
        }
        await pool.query(
          "INSERT INTO orderitems (orderid, productid, price, quantity) VALUES ($1, $2, $3, $4)",
          [orderid, item.productid, item.price, item.quantity]
        );
      })
    );

    res.json({ orderid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const generateNextOrderID = async () => {
  try {
    const result = await pool.query(
      "SELECT MAX(orderid) AS max_orderid FROM orders"
    );
    const lastOrderID = result.rows[0].max_orderid;
    if (!lastOrderID) {
      return "ORD_0000001"; // If no orders exist yet, start with the first order ID
    }
    const lastIDNumber = parseInt(lastOrderID.split("_")[1]);
    const nextIDNumber = lastIDNumber + 1;
    const nextOrderID = `ORD_${nextIDNumber.toString().padStart(7, "0")}`;
    return nextOrderID;
  } catch (err) {
    console.error(err);
    throw new Error("Error generating next order ID");
  }
};
export const getNextOrderID = async (req, res) => {
  var nextOrderID = "ORD_0000001";
  try {
    const result = await pool.query(
      "SELECT MAX(orderid) AS max_orderid FROM orders"
    );
    const lastOrderID = result.rows[0].max_orderid;
    if (!lastOrderID) {
      nextOrderID = "ORD_0000001"; // If no orders exist yet, start with the first order ID
    }
    const lastIDNumber = parseInt(lastOrderID.split("_")[1]);
    const nextIDNumber = lastIDNumber + 1;
    const nextOrderID = `ORD_${nextIDNumber.toString().padStart(7, "0")}`;
    res.json({
      nextOrderID: nextOrderID,
    });
  } catch (err) {
    console.error(err);
    throw new Error("Error generating next order ID");
  }
};
