import pool from "../../utils/database.connection";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sendMail } from "../../utils/sendemail";

export const searchUsersByPhone = async (req, res) => {
  const phoneno = req.body.phone;
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

export const registerUser = async (req, res) => {
  const { fullname, email, phoneno, address, password } = req.body;
  try {
    const lastUserIdResult = await pool.query(
      "SELECT userid FROM users ORDER BY userid DESC LIMIT 1"
    );
    let newUserId;
    if (lastUserIdResult.rows.length > 0) {
      const lastUserId = lastUserIdResult.rows[0].userid;
      const lastIdNumber = parseInt(lastUserId.substring(4));
      const nextIdNumber = lastIdNumber + 1;
      newUserId = `USR_${nextIdNumber.toString().padStart(5, "0")}`;
    } else {
      newUserId = "USR_00001";
    }
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

export const placeOrder = async (req, res) => {
  const { paymentmethod, totalamount, items, userid } = req.body;
  let client;
  let maxRetries = 5;
  let attempt = 0;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  while (attempt < maxRetries) {
    let transactionStarted = false;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      transactionStarted = true;
      const orderid = await generateNextOrderID();
      const sriLankanTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const orderInsertQuery = `
        INSERT INTO orders (orderid, userid, paymentmethod, totalamount, orderstatus, ordertime)
        VALUES ($1, $2, $3, $4, 'Completed', $5)
        RETURNING *;
      `;
      const orderInsertResult = await client.query(orderInsertQuery, [
        orderid,
        userid,
        paymentmethod,
        totalamount,
        sriLankanTime,
      ]);
      const orderItemsInsertQuery = `
        INSERT INTO orderitems (orderid, productid, price, quantity)
        VALUES ($1, $2, $3, $4);
      `;
      await Promise.all(
        items.map(async (item) => {
          await client.query(orderItemsInsertQuery, [
            orderid,
            item.productid,
            item.price,
            item.quantity,
          ]);
        })
      );
      await client.query("COMMIT");
      transactionStarted = false;
      const pdfDoc = await generateOrderPDF(
        orderid,
        items,
        totalamount,
        sriLankanTime
      );
      const pdfBytes = await pdfDoc.save();
      const mailOptions = {
        from: {
          name: "Dayul Motors",
          address: "dayulmotors@gmail.com", // Replace with your company email
        },
        to: "heshantharushka2002@gmail.com", // Replace with customer's email
        subject: "Order Confirmation",
        text: "Please find attached your order details.",
        attachments: [
          {
            filename: "order_invoice.pdf",
            content: pdfBytes,
            contentType: "application/pdf",
          },
        ],
      };
      await sendMail(mailOptions);
      res.status(200).json({ message: "Order placed successfully", orderid });
      return;
    } catch (error) {
      if (transactionStarted) {
        await client.query("ROLLBACK");
      }
      if (error.code === "40001") {
        attempt++;
        console.warn(
          `Transaction retry attempt ${attempt} due to:`,
          error.message
        );
        await delay(100 * attempt);
      } else {
        console.error("Error placing order:", error);
        res.status(500).json({ error: "Error placing order" });
        return;
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  res
    .status(500)
    .json({ error: "Failed to place order after multiple attempts" });
};
async function generateOrderPDF(orderid, items, totalamount, ordertime) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const titleStyle = {
    size: 16,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  };
  const normalStyle = { size: 12, font: await pdfDoc.embedFont("Helvetica") };
  const startX = 50;
  const startY = 700;
  const columnWidths = [250, 80, 80, 80]; // Increased product name column width
  const maxProductNameWidth = columnWidths[0];

  page.drawText("Order Details", { x: startX, y: startY, ...titleStyle });
  page.drawText(`Order ID: ${orderid}`, {
    x: startX,
    y: startY - 20,
    ...normalStyle,
  });
  page.drawText(`Order Time: ${ordertime}`, {
    x: startX,
    y: startY - 40,
    ...normalStyle,
  });

  let currentY = startY - 80;
  page.drawText("Product", { x: startX, y: currentY, ...normalStyle });
  page.drawText("Price", {
    x: startX + columnWidths[0],
    y: currentY,
    ...normalStyle,
  });
  page.drawText("Quantity", {
    x: startX + columnWidths[0] + columnWidths[1],
    y: currentY,
    ...normalStyle,
  });
  page.drawText("Total", {
    x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
    y: currentY,
    ...normalStyle,
  });
  currentY -= 20;

  for (const item of items) {
    try {
      const productNameResult = await pool.query(
        "SELECT productname FROM products WHERE productid = $1",
        [item.productid]
      );
      const productName = productNameResult.rows[0]?.productname || "N/A";

      const itemPrice = parseFloat(item.price);

      const textWidth = normalStyle.font.widthOfTextAtSize(
        productName,
        normalStyle.size
      );
      const lines = splitTextIntoLines(
        productName,
        normalStyle.font,
        normalStyle.size,
        maxProductNameWidth
      );

      let verticalOffset = 20;
      if (lines.length > 1) {
        verticalOffset += (lines.length - 1) * 20;
      }

      for (const line of lines) {
        page.drawText(line, { x: startX, y: currentY, ...normalStyle });
        currentY -= 20;
      }

      page.drawText(itemPrice.toFixed(2), {
        x: startX + columnWidths[0],
        y: currentY + verticalOffset,
        ...normalStyle,
        align: "right",
      });
      page.drawText(item.quantity.toString(), {
        x: startX + columnWidths[0] + columnWidths[1],
        y: currentY + verticalOffset,
        ...normalStyle,
        align: "center",
      });
      page.drawText((itemPrice * item.quantity).toFixed(2), {
        x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
        y: currentY + verticalOffset,
        ...normalStyle,
        align: "right",
      });

      currentY -= verticalOffset;
    } catch (error) {
      console.error(
        `Error fetching product name or processing price for productid ${item.productid}:`,
        error
      );
      page.drawText("Error", {
        x: startX,
        y: currentY,
        ...normalStyle,
        color: rgb(1, 0, 0),
      });
      currentY -= 20;
    }
  }

  page.drawText(`Total Amount:`, {
    x: startX + columnWidths[0] + columnWidths[1],
    y: currentY - 20,
    ...normalStyle,
  });
  page.drawText(totalamount.toFixed(2), {
    x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
    y: currentY - 20,
    ...normalStyle,
    align: "right",
  });

  return pdfDoc;
}

function splitTextIntoLines(text, font, fontSize, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);

    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  return lines;
}

export const generateNextOrderID = async () => {
  try {
    const result = await pool.query(
      "SELECT MAX(orderid) AS max_orderid FROM orders"
    );
    const lastOrderID = result.rows[0].max_orderid;
    if (!lastOrderID) {
      return "ORD_0000001";
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
      nextOrderID = "ORD_0000001";
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
