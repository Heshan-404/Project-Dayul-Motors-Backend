import express from "express";
import {
  registerUser,
  loginUser,
  passwordReset,
  sendOTP,
  OTPCheck,
} from "../../controllers/authController";
import { loginAdmin } from "../../controllers/adminAuthController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginAdmin);

export default router;
