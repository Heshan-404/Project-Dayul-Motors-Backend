import express from "express";
import {
  placeOrder,
  getUserData,
  getCartItems,
  removeFromCart,
} from "../controllers/checkOutProcess";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Define routes
router.post("/", authMiddleware, placeOrder);
router.get("/user-data", authMiddleware, getUserData);
router.get("/cart-items", authMiddleware, getCartItems);
router.delete("/cart-items/:productId", authMiddleware, removeFromCart);

export default router;
