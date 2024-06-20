import express from "express";
import {
  registerUser,
  loginUser,
  passwordReset,
  sendOTP,
  OTPCheck,
  addOrder,
  getUserByID,
  getOrdersByID,
  updateUserByID,
  deleteOrderBYOrderID,
} from "../../controllers/userAuthController";
import authMiddleware from "../../middleware/authMiddleware";
import shoppingRoutes from "../../controllers/shoppingExpirenceController";
import pool from "../../../utils/database.connection";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset", sendOTP);
router.post("/checkOTP", OTPCheck);
router.post("/reset-password", passwordReset);
router.post("/protected/navigationbar", authMiddleware, async (req, res) => {
  try {
    const userid = req.userid;
    // Query the database to get the cart count for the user
    const result = await pool.query(
      "SELECT COUNT(*) AS cart_count FROM cartitems WHERE cartid IN (SELECT cartid FROM cart WHERE userid = $1)",
      [userid]
    );
    // Send the cart count in the response
    res.json({
      cart: result.rows[0].cart_count,
    });
  } catch (error) {
    console.error("Error fetching cart count:", error);
    res.status(500).json({ error: "Error fetching cart count" });
  }
});

router.get("/protected/add_order", authMiddleware, (req, res) => {
  res.json({
    req: req.userid,
  });
});
router.get("/users/:userid", authMiddleware, getUserByID);
router.put("/users/:userid", authMiddleware, updateUserByID);
router.get("/orders/:userid", authMiddleware, getOrdersByID);
router.delete("/orders/:orderid", authMiddleware, deleteOrderBYOrderID);
router.post("/protected/add_order", authMiddleware, addOrder);
export default router;
