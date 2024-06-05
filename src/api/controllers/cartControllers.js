import pool from "../../utils/database.connection";
// Function to get all cart items for the current user
exports.getCartItems = async (req, res) => {
  const userId = req.userid; // Assuming you have user authentication middleware
  console.log(userId);
  try {
    const cartItems = await pool.query(
      "SELECT c.cartid, p.productid, p.productname, p.price, p.imageurl, c.quantity, p.quantity AS stock FROM cartitems c JOIN cart ct ON c.cartid = ct.cartid JOIN products p ON c.productid = p.productid WHERE ct.userid = $1",
      [userId]
    );
    res.json(cartItems.rows);
  } catch (err) {
    console.error("Error fetching cart items:", err);
    res.status(500).json({ message: "Error fetching cart items" });
  }
};

// Function to update the quantity of a cart item
exports.updateCartItemQuantity = async (req, res) => {
  const { cartid, productid } = req.params;
  const quantity = parseInt(req.body.quantity, 10); // Convert to integer

  try {
    await pool.query(
      "UPDATE cartitems SET quantity = $1 WHERE cartid = $2 AND productid = $3",
      [quantity, cartid, productid]
    );
    res.json({ message: "Cart item updated" });
  } catch (err) {
    console.error("Error updating cart item:", err);
    res.status(500).json({ message: "Error updating cart item" });
  }
};
// Function to delete a cart item
exports.deleteCartItem = async (req, res) => {
  const { cartid, productid } = req.params;

  try {
    await pool.query(
      "DELETE FROM cartitems WHERE cartid = $1 AND productid = $2",
      [cartid, productid]
    );
    res.json({ message: "Cart item deleted" });
  } catch (err) {
    console.error("Error deleting cart item:", err);
    res.status(500).json({ message: "Error deleting cart item" });
  }
};

exports.getProductDetails = async (req, res) => {
  const { productIds } = req.body;
  console.log(productIds);
  try {
    const productDetails = await pool.query(
      "SELECT productid, quantity, price, imageurl, productname FROM products WHERE productid = ANY($1)",
      [productIds]
    );
    console.log(productDetails.rows);
    res.json(productDetails.rows);
  } catch (err) {
    console.error("Error fetching product details:", err);
    res.status(500).json({ message: "Error fetching product details" });
  }
};
