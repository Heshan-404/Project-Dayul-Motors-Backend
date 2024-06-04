import pool from "../../utils/database.connection";

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
