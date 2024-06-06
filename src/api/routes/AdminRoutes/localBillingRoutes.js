import express from "express";
import {
  addOrderItems,
  createOrder,
  generateNextOrderID,
  getAllProducts,
  getNextOrderID,
  placeOrder,
  registerUser,
  searchProducts,
  searchUsersByPhone,
} from "../../controllers/localBillingControllers";

const router = express.Router();
router.get("/test", (req, res) => {
  res.json("get");
});
router.post("/test", (req, res) => {
  res.json("post");
});
router.post("/search_user_by_phone", searchUsersByPhone);
router.get("/search_products", searchProducts);
router.post("/register_user", registerUser);
router.post("/create_order", placeOrder);
router.post("/add_order_items", addOrderItems);
router.get("/all_products", getAllProducts);
router.get("/next_order_id", getNextOrderID);

export default router;
