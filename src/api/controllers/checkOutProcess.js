import { config } from "dotenv";
import pool from "../../utils/database.connection";
import { sendMail } from "../../utils/sendemail";

const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

const placeOrder = async (req, res) => {
  const { paymentMethod, totalAmount, orderItems } = req.body;
  const userId = req.userid;
  let client;
  let maxRetries = 5; // Define the maximum number of retries
  let attempt = 0;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Helper function for delay

  while (attempt < maxRetries) {
    let transactionStarted = false;
    try {
      // Acquire a client from the connection pool
      client = await pool.connect();

      // Start a transaction
      await client.query("BEGIN");
      transactionStarted = true;

      // Generate the order ID
      const orderId = await generateOrderId(client);

      // Get the current time in Sri Lanka
      const sriLankanTime = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Insert order details into the orders table
      const orderInsertQuery = `
        INSERT INTO orders (orderid, userid, orderstatus, paymentmethod, totalamount, ordertime)
        VALUES ($1, $2, 'Pending', $3, $4, $5)
        RETURNING orderid;
      `;
      const orderInsertResult = await client.query(orderInsertQuery, [
        orderId,
        userId,
        paymentMethod,
        totalAmount,
        sriLankanTime,
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

      // Commit the transaction
      await client.query("COMMIT");
      transactionStarted = false;
      await clearCart(client, userId);

      // Fetch product names for the email
      const productIds = orderItems.map((item) => item.productid);
      const productNamesQuery = `
        SELECT productid, productname 
        FROM products 
        WHERE productid = ANY($1::VARCHAR[]);
      `;
      const productNamesResult = await client.query(productNamesQuery, [
        productIds,
      ]);
      const productNamesMap = new Map(
        productNamesResult.rows.map((product) => [
          product.productid,
          product.productname,
        ])
      );

      // Generate order details table for email
      const orderDetailsTable = orderItems
        .map(
          (item) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${productNamesMap.get(
                item.productid
              )}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                item.price
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                item.quantity
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${(
                item.price * item.quantity
              ).toFixed(2)}</td>
            </tr>
          `
        )
        .join("");

      const companyEmail = "dayulmotors@gmail.com";
      const companyName = "Dayul Motors";

      // Fetch user details
      const userQuery = `
        SELECT fullname, email, phoneno, address 
        FROM users 
        WHERE userid = $1;
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      // Create PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      // Header
      page.drawText(`${companyName}`, {
        x: 50,
        y: height - 50,
        size: fontSize + 6,
        font: timesRomanFont,
        color: rgb(1, 0.4, 0), // Orange color
      });
      page.drawText(`${companyEmail}`, {
        x: 50,
        y: height - 70,
        size: fontSize,
        font: timesRomanFont,
      });

      // Invoice details
      page.drawText(`Order Invoice`, {
        x: width / 2 - 50,
        y: height - 100,
        size: fontSize + 4,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(`Order ID: ${orderId}`, {
        x: 50,
        y: height - 130,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`Order Time: ${sriLankanTime}`, {
        x: 50,
        y: height - 150,
        size: fontSize,
        font: timesRomanFont,
      });

      // Bill to details
      page.drawText(`Bill To:`, {
        x: 50,
        y: height - 180,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`${user.fullname}`, {
        x: 50,
        y: height - 200,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`${user.phoneno}`, {
        x: 50,
        y: height - 220,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`${user.email}`, {
        x: 50,
        y: height - 240,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`${user.address}`, {
        x: 50,
        y: height - 260,
        size: fontSize,
        font: timesRomanFont,
      });

      // Table header
      let yPosition = height - 290;
      page.drawText(`Product Name`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`Price`, {
        x: 200,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`Quantity`, {
        x: 300,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`Total`, {
        x: 400,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
      });

      // Table rows
      for (const item of orderItems) {
        yPosition -= 20;
        page.drawText(`${productNamesMap.get(item.productid)}`, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
        });
        page.drawText(`${item.price}`, {
          x: 200,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
        });
        page.drawText(`${item.quantity}`, {
          x: 300,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
        });
        page.drawText(`${(item.price * item.quantity).toFixed(2)}`, {
          x: 400,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
        });
      }

      // Total amount
      yPosition -= 20;
      page.drawText(`Total Amount`, {
        x: 300,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
      });
      page.drawText(`${totalAmount.toFixed(2)}`, {
        x: 400,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
      });

      // Footer
      yPosition -= 40;
      page.drawText(`Thank You For Your Order!`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();

      // Send email with PDF attachment

      const mailOptions = {
        from: {
          name: companyName,
          address: companyEmail,
        },
        to: user.email,
        subject: "Your Order Details",
        text: "Please find attached the details of your order.",
        attachments: [
          {
            filename: "order_invoice.pdf",
            content: pdfBytes,
            contentType: "application/pdf",
          },
        ],
      };

      await sendMail(mailOptions);

      // Send response
      res.status(200).json({ message: "Order placed successfully", orderId });
      return; // Exit the function on successful completion
    } catch (error) {
      // Rollback the transaction if it was started
      if (transactionStarted) {
        await client.query("ROLLBACK");
      }

      // If the error is a retryable error, increment the attempt counter and retry
      if (error.code === "40001") {
        attempt++;
        console.warn(
          `Transaction retry attempt ${attempt} due to:`,
          error.message
        );
        await delay(100 * attempt); // Exponential backoff delay
      } else {
        // If the error is not retryable, send an error response
        console.error("Error placing order:", error);
        res.status(500).json({ error: "Error placing order" });
        return;
      }
    } finally {
      // Release the client back to the pool
      if (client) {
        client.release();
      }
    }
  }

  // If all retries fail, send a final error response
  res
    .status(500)
    .json({ error: "Failed to place order after multiple attempts" });
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
