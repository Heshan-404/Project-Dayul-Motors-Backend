import express from "express";
import {
  registerUser,
  loginUser,
  passwordReset,
  sendOTP,
  OTPCheck,
} from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset", sendOTP);
router.post("/checkOTP", OTPCheck);
router.post("/reset-password", passwordReset);
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

export default router;
