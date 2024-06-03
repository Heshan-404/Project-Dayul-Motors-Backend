import pool from "../../utils/database.connection"; // Assuming you have a database connection setup
const cloudinary = require("../../utils/cloudinary"); // Assuming you have a Cloudinary setup
const upload = require("../middleware/multer"); // Assuming you have a Multer setup
import multer from "multer";

// Controller to fetch all products
export const getAllProducts = async (req, res) => {
  try {
    // Query to fetch all products with category and brand IDs
    const query = `
      SELECT 
        p.productid,
        p.productname,
        p.price,
        p.imageurl,
        p.quantity,
        p.minquantitylevel,
        p.categoryid,
        p.brandid,
        c.categoryname,
        b.brandname
      FROM 
        products p
      INNER JOIN 
        categories c ON p.categoryid = c.categoryid
      INNER JOIN 
        brands b ON p.brandid = b.brandid
    `;

    // Execute the query
    const { rows } = await pool.query(query);

    // Send response with product details
    res.status(200).json(rows);
  } catch (error) {
    // Handle error
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to update a product
export const updateProduct = async (req, res) => {
  try {
    const productid = req.params.productid; // Get the product ID from the URL

    // Handle file upload using Multer
    upload.single("image")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error" });
      } else if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).json({ message: "Server error" });
      }

      // Check if an image was uploaded
      if (req.file) {
        const imageData = req.file;

        // Upload image to Cloudinary
        cloudinary.uploader.upload(
          imageData.path,
          async function (cloudinaryErr, cloudinaryResult) {
            if (cloudinaryErr) {
              console.error("Error uploading to Cloudinary:", cloudinaryErr);
              return res
                .status(500)
                .json({ message: "Error uploading to Cloudinary" });
            }

            const imageUrl = cloudinaryResult.secure_url;

            // Update the product in the database with the new image URL
            const query =
              "UPDATE products SET productname = $1, price = $2, quantity = $3, minquantitylevel = $4, description = $5, imageurl = $6 WHERE productid = $7 RETURNING *";
            const values = [
              req.body.productname,
              req.body.price,
              req.body.quantity,
              req.body.minquantitylevel,
              req.body.productdescription,
              imageUrl,
              productid,
            ];

            const result = await pool.query(query, values);
            res.status(200).json(result.rows[0]);
          }
        );
      } else {
        // If no image was uploaded, update the product without changing the image
        const query =
          "UPDATE products SET productname = $1, price = $2, quantity = $3, minquantitylevel = $4, description = $5 WHERE productid = $6 RETURNING *";
        const values = [
          req.body.productname,
          req.body.price,
          req.body.quantity,
          req.body.minquantitylevel,
          req.body.productdescription,
          productid,
        ];

        const result = await pool.query(query, values);
        res.status(200).json(result.rows[0]);
      }
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to delete a product
export const deleteProduct = async (req, res) => {
  try {
    const productid = req.params.productid; // Get the product ID from the URL
    console.log(productid);
    const query = "DELETE FROM products WHERE productid = $1";
    const values = [productid];
    const result = await pool.query(query, values);
    res.status(204).send(); // 204 No Content status for successful delete
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to fetch all brands
export const fetchBrands = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM brands");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to fetch all categories
export const fetchCategories = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to add a new brand (assuming you have a Multer setup for file uploads)
export const addBrand = async (req, res) => {
  try {
    upload.single("image")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // Handle Multer errors, such as file size exceeded
        return res.status(400).json({ message: "File upload error" });
      } else if (err) {
        // Handle other errors
        console.error("Error uploading file:", err);
        return res.status(500).json({ message: "Server error" });
      }

      // Check if no file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // File uploaded successfully, get image data
      const imageData = req.file;

      // Upload image to Cloudinary
      cloudinary.uploader.upload(
        imageData.path,
        async function (cloudinaryErr, cloudinaryResult) {
          if (cloudinaryErr) {
            console.error("Error uploading to Cloudinary:", cloudinaryErr);
            return res
              .status(500)
              .json({ message: "Error uploading to Cloudinary" });
          }

          // Image uploaded successfully to Cloudinary, get the secure URL
          const imageUrl = cloudinaryResult.secure_url;

          // Insert brand data into the database
          const brandid = await getNextbrandid();
          const query =
            "INSERT INTO brands (brandid, brandname, imageurl) VALUES ($1, $2, $3) RETURNING *";
          const values = [brandid, req.body.name, imageUrl]; // Use req.body.name directly
          const result = await pool.query(query, values);

          res.status(201).json(result.rows[0]);
        }
      );
    });
  } catch (error) {
    console.error("Error adding brand:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to add a new category
export const addCategory = async (req, res) => {
  try {
    upload.single("image")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error" });
      } else if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageData = req.file;

      cloudinary.uploader.upload(
        imageData.path,
        async function (cloudinaryErr, cloudinaryResult) {
          if (cloudinaryErr) {
            console.error("Error uploading to Cloudinary:", cloudinaryErr);
            return res
              .status(500)
              .json({ message: "Error uploading to Cloudinary" });
          }

          const imageUrl = cloudinaryResult.secure_url;
          const categoryid = await getNextcategoryid();
          const query =
            "INSERT INTO categories (categoryid, categoryname, imageurl) VALUES ($1, $2, $3) RETURNING *";
          const values = [categoryid, req.body.name, imageUrl];
          const result = await pool.query(query, values);

          res.status(201).json(result.rows[0]);
        }
      );
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//controller for add new product
export const addProduct = async (req, res) => {
  try {
    // Handle file upload using Multer
    upload.single("image")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error" });
      } else if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageData = req.file;

      // Upload image to Cloudinary
      cloudinary.uploader.upload(
        imageData.path,
        async function (cloudinaryErr, cloudinaryResult) {
          if (cloudinaryErr) {
            console.error("Error uploading to Cloudinary:", cloudinaryErr);
            return res
              .status(500)
              .json({ message: "Error uploading to Cloudinary" });
          }

          const imageUrl = cloudinaryResult.secure_url;

          // Get category ID, brand ID, and other product details from the request body
          const { brandid, categoryid, name, description, price, qty, minQty } =
            req.body;

          // Fetch or generate the necessary IDs
          const productid = await getNextProductId();

          // Insert product data into the database
          const query =
            "INSERT INTO products (productid, categoryid, brandid, productname, description, price, quantity, minquantitylevel, imageurl) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";
          const values = [
            productid,
            categoryid,
            brandid,
            name,
            description,
            price,
            qty,
            minQty,
            imageUrl,
          ];
          const result = await pool.query(query, values);

          res.status(201).json(result.rows[0]);
        }
      );
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to generate the next brand ID
const getNextbrandid = async () => {
  try {
    const result = await pool.query(
      "SELECT MAX(brandid) as lastId FROM brands"
    );
    const lastId = result.rows[0].lastid;
    if (lastId) {
      const parts = lastId.split("_");
      const numPart = parseInt(parts[1]);
      return `B_${(numPart + 1).toString().padStart(3, "0")}`;
    } else {
      return "B_001";
    }
  } catch (error) {
    console.error("Error generating brand ID:", error);
    throw new Error("Error generating brand ID");
  }
};

// Function to generate the next category ID
const getNextcategoryid = async () => {
  try {
    const result = await pool.query(
      "SELECT MAX(categoryid) as lastId FROM categories"
    );
    const lastId = result.rows[0].lastid;
    if (lastId) {
      const parts = lastId.split("_");
      const numPart = parseInt(parts[1]);
      return `C_${(numPart + 1).toString().padStart(5, "0")}`;
    } else {
      return "C_00001";
    }
  } catch (error) {
    console.error("Error generating category ID:", error);
    throw new Error("Error generating category ID");
  }
};

const getNextProductId = async () => {
  try {
    // Query to get the latest product ID
    const query =
      "SELECT productid FROM products ORDER BY productid DESC LIMIT 1";
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      // If no products exist, return the first product ID
      return "P_0000001";
    }

    // Extract the last product ID and increment it
    const lastProductId = result.rows[0].productid;
    const numberPart = parseInt(lastProductId.split("_")[1], 10);
    const nextNumberPart = numberPart + 1;

    // Format the new product ID with leading zeros
    const nextProductId = `P_${nextNumberPart.toString().padStart(7, "0")}`;
    return nextProductId;
  } catch (error) {
    console.error("Error generating next product ID:", error);
    throw error;
  }
};
