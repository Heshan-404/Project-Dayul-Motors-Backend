import pool from "../../utils/database.connection";

const placeOrder = async (req, res) => {
  const { paymentMethod, totalAmount, orderItems } = req.body;
  const userId = req.userid;
  let client;
  try {
    // Acquire a client from the connection pool
    client = await pool.connect();

    // Start a transaction
    await client.query("BEGIN");

    // Generate the order ID
    const orderId = await generateOrderId(client);

    // Get the current time in Sri Lanka
    const sriLankanTime = new Date();
    sriLankanTime.setHours(
      sriLankanTime.getHours() + 5,
      sriLankanTime.getMinutes() + 30
    );

    // Format the time as "HH:mm:ss"
    const formattedSriLankanTime = sriLankanTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Insert order details into the orders table
    const orderInsertQuery = `
        INSERT INTO orders (orderid, userid, orderstatus, paymentmethod, totalamount, ordertime)
        VALUES ($1, $2, 'Pending', $3, $4,$5)
        RETURNING orderid;
      `;
    const orderInsertResult = await client.query(orderInsertQuery, [
      orderId,
      userId,
      paymentMethod,
      totalAmount,
      formattedSriLankanTime,
    ]);

    // Insert order items into the orderitems table
    const orderItemsInsertQuery = `
        INSERT INTO orderitems (orderid, productid, price, quantity)
        VALUES ($1, $2, $3, $4);
      `;
    for (const orderItem of orderItems) {
      await client.query(orderItemsInsertQuery, [
        orderId,
        orderItem.productid,
        orderItem.price,
        orderItem.quantity,
      ]);
    }

    // Clear the user's cart and cartitems
    await clearCart(client, userId);

    // Commit the transaction
    await client.query("COMMIT");

    res.status(200).json({ message: "Order placed successfully", orderId });
  } catch (error) {
    // Rollback the transaction
    await client.query("ROLLBACK");

    console.error("Error placing order:", error);
    res.status(500).json({ error: "Error placing order" });
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
};

const generateOrderId = async (client) => {
  try {
    // Get the last order ID from the orders table
    const lastOrderResult = await client.query(
      "SELECT orderid FROM orders ORDER BY orderid DESC LIMIT 1"
    );

    if (lastOrderResult.rows.length > 0) {
      // Extract the numerical part of the last order ID
      const lastOrderId = lastOrderResult.rows[0].orderid;
      const lastOrderNumber = parseInt(lastOrderId.substring(4));

      // Generate the next order ID
      const nextOrderNumber = lastOrderNumber + 1;
      const nextOrderId = `ORD_${nextOrderNumber.toString().padStart(7, "0")}`;
      return nextOrderId;
    } else {
      // If no previous order exists, start with ORD_0000001
      return "ORD_0000001";
    }
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw error;
  }
};

const clearCart = async (client, userId) => {
  try {
    // Delete cartitems for the user
    await client.query(
      "DELETE FROM cartitems WHERE cartid IN (SELECT cartid FROM cart WHERE userid = $1)",
      [userId]
    );

    // Delete the cart itself
    await client.query("DELETE FROM cart WHERE userid = $1", [userId]);
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

const getUserData = async (req, res) => {
  const userId = req.userid; // Assuming userId is available in the request object after authentication

  try {
    const userDataQuery = `
      SELECT * FROM users
      WHERE userid = $1;
    `;
    const userDataResult = await pool.query(userDataQuery, [userId]);
    const userData = userDataResult.rows[0];
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
};

const getCartItems = async (req, res) => {
  const userId = req.userid; // Assuming userId is available in the request object after authentication

  try {
    // Corrected SQL query
    const cartItemsQuery = `
        SELECT 
          ci.quantity,
          p.productid,
          p.productname,
          p.price,
          p.imageurl
        FROM 
          cartitems ci
        JOIN 
          products p ON ci.productid = p.productid
        JOIN 
          cart c ON ci.cartid = c.cartid
        WHERE 
          c.userid = $1;
      `;
    const cartItemsResult = await pool.query(cartItemsQuery, [userId]);
    const cartItems = cartItemsResult.rows;
    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ error: "Error fetching cart items" });
  }
};
const removeFromCart = async (req, res) => {
  const userId = req.userid; // Assuming userId is available in the request object after authentication
  const productId = req.params.productId;

  try {
    // Retrieve the cart ID for the user
    const cartIdResult = await pool.query(
      "SELECT cartid FROM cart WHERE userid = $1",
      [userId]
    );
    const cartId = cartIdResult.rows[0].cartid;

    // Delete the item from cartitems using the cart ID and product ID
    await pool.query(
      "DELETE FROM cartitems WHERE cartid = $1 AND productid = $2",
      [cartId, productId]
    );
    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ error: "Error removing item from cart" });
  }
};
export { placeOrder, getUserData, getCartItems, removeFromCart };
