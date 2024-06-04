import express from "express";
import {
  getBrands,
  getCategories,
  getCategoryName,
  getProductById,
  getProducts,
  getProductsByBrand,
  getProductsByCategory,
  getProductsByCategoryAndBrand,
} from "../../controllers/shoppingExpirenceController";

const router = express.Router();

// Routes for Categories
router.get("/categories", getCategories);
router.get("/categories/:categoryid", getCategoryName);

// Routes for Brands
router.get("/brands", getBrands);

// Routes for Products
router.get("/products", getProducts);
router.get("/products/category/:categoryId", getProductsByCategory);
router.get("/products/brand/:brandId", getProductsByBrand);
router.get("/products/:productId", getProductById);
router.get(
  "/products/both/category/:categoryId/brand/:brandId",
  getProductsByCategoryAndBrand
);

export default router;
