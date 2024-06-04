import express from "express";
import {
  registerUser,
  loginUser,
  passwordReset,
  sendOTP,
  OTPCheck,
  addOrder,
} from "../../controllers/userAuthController";
import authMiddleware from "../../middleware/authMiddleware";
import shoppingRoutes from "../../controllers/shoppingExpirenceController";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset", sendOTP);
router.post("/checkOTP", OTPCheck);
router.post("/reset-password", passwordReset);
router.post("/protected/navigationbar", authMiddleware, (req, res) => {
  res.json({
    cart: 3,
  });
});
router.get("/protected/add_order", authMiddleware, (req, res) => {
  res.json({
    req: req.userid,
  });
});

router.post("/protected/add_order", authMiddleware, addOrder);
export default router;
