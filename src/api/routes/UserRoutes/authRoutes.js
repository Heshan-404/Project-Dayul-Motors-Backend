import express from "express";
import {
  registerUser,
  loginUser,
  passwordReset,
  sendOTP,
  OTPCheck,
} from "../../controllers/userAuthController";
import authMiddleware from "../../middleware/authMiddleware";

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

export default router;
