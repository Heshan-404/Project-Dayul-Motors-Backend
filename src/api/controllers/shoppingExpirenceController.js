import pool from "../../utils/database.connection";
import { v4 as uuidv4 } from "uuid";
// Error handling middleware
export const handleError = (err, res) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

// Controllers as functions (using async/await)
export const getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories");
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};
export const getCategoryName = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT categoryname FROM categories WHERE categoryid = $1",
      [req.params.categoryid] // Pass the category ID as a parameter
    );
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};

export const getBrands = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM brands");
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};

export const getProducts = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};

export const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE categoryid = $1",
      [categoryId]
    );
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};
export const getProductsByCategoryAndBrand = async (req, res) => {
  const { categoryId, brandId } = req.params;
  console.log(categoryId);
  console.log(brandId);
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE categoryid = $1 AND brandid = $2",
      [categoryId, brandId]
    );
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};

export const getProductsByBrand = async (req, res) => {
  const { brandId } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE brandid = $1",
      [brandId]
    );
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
};

export const getProductById = async (req, res) => {
  const { productId } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE productid = $1",
      [productId]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (err) {
    handleError(err, res);
  }
};

export const addToCart = async (req, res) => {
  const { productid, quantity } = req.body;
  const userId = req.userid;
  let cartid = generateCartId();

  try {
    // 1. Check if a cart already exists for the user
    const existingCart = await pool.query(
      "SELECT cartid FROM cart WHERE userid = $1",
      [userId]
    );

    // 2. If a cart exists, use the existing cartid
    if (existingCart.rows.length > 0) {
      cartid = existingCart.rows[0].cartid;
    } else {
      // 3. If no cart exists, create a new one
      await pool.query("INSERT INTO cart (cartid, userid) VALUES ($1, $2)", [
        cartid,
        userId,
      ]);
    }

    // 4. Check available stock for the product
    const availableStock = await pool.query(
      "SELECT quantity FROM products WHERE productid = $1",
      [productid]
    );

    if (availableStock.rows.length === 0) {
      return res.status(400).json({
        message: `Product ${productid} not found`,
      });
    }

    const currentStock = availableStock.rows[0].quantity;

    // 5. Check if the product already exists in the cart
    const existingItem = await pool.query(
      "SELECT cartid, productid, quantity FROM cartitems WHERE cartid = $1 AND productid = $2",
      [cartid, productid]
    );

    // 6. Calculate remaining stock and existing cart quantity
    let remainingStock = currentStock;

    let existingCartQuantity = 0;
    if (existingItem.rows.length > 0) {
      existingCartQuantity = existingItem.rows[0].quantity;
      remainingStock = currentStock - existingCartQuantity;
    }

    // 7. Check for insufficient stock
    if (quantity > remainingStock) {
      return res.status(400).json({
        message: `Insufficient stock for product ${productid}. Only ${remainingStock} units available. You have already selected ${existingCartQuantity} items.`,
      });
    }

    // 8. Update or Insert cart item (without updating stock)
    if (existingItem.rows.length > 0) {
      // Update the quantity in cartitems
      const updatedQuantity =
        parseInt(existingCartQuantity, 10) + parseInt(quantity, 10);
      await pool.query(
        "UPDATE cartitems SET quantity = $1 WHERE cartid = $2 AND productid = $3",
        [updatedQuantity, cartid, productid]
      );
    } else {
      // Insert a new cartitem
      await pool.query(
        "INSERT INTO cartitems (cartid, productid, quantity) VALUES ($1, $2, $3)",
        [cartid, productid, quantity]
      );
    }

    res.json({ message: "Item added to cart", cartid });
  } catch (err) {
    handleError(err, res);
  }
};

function generateCartId() {
  return `CT${uuidv4().substring(0, 8)}`;
}
