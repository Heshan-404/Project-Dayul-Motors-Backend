import express from "express";
import adminAuthMiddleware from "../../middleware/adminAuthMiddleWare";
import {
  addBrand,
  addCategory,
  addProduct,
  deleteProduct,
  fetchBrands,
  fetchCategories,
  getAllProducts,
  updateProduct,
} from "../../controllers/productMangement";
const router = express.Router();

router.get("/protected/brands", fetchBrands);
router.post("/protected/brands", addBrand);

router.put("/protected/products/:productid", updateProduct); // Update a product
router.delete("/protected/products/:productid", deleteProduct); // Delete a product

router.get("/protected/categories", fetchCategories);
router.post("/protected/categories", addCategory);

router.post("/protected/products", addProduct);
router.get("/protected/products", getAllProducts);

export default router;
