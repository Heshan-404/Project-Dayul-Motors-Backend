import express from "express";
import {
  registerAdmin,
  loginAdmin,
  adminDetails,
  unfreezeAdmin,
  freezeAdmin,
  updateAdminDetails,
} from "../../controllers/adminAuthController";
import adminAuthMiddleware from "../../middleware/adminAuthMiddleWare";
import {
  activateUser,
  fetchAllUsers,
  freezeUnfreezeUser,
  updateUserDetails,
} from "../../controllers/userAuthController";
const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/protected/details", adminAuthMiddleware, adminDetails);
router.put(
  "/protected/admin_freeze/:adminid",
  adminAuthMiddleware,
  freezeAdmin
);
router.put(
  "/protected/admin_unfreeze/:adminid",
  adminAuthMiddleware,
  unfreezeAdmin
);
router.put(
  "/protected/admin_update/:adminid",
  adminAuthMiddleware,
  updateAdminDetails
);

router.put(
  "/protected/user_freeze_unfreeze/:userId",
  adminAuthMiddleware,
  freezeUnfreezeUser
);
router.put(
  "/protected/user_update/:userid",
  adminAuthMiddleware,
  updateUserDetails
);
router.post("/protected/sidebar", adminAuthMiddleware, (req, res) => {
  res.json({
    level: req.admin.level,
  });
});
router.get("/protected/fetch_all_users", adminAuthMiddleware, fetchAllUsers);
export default router;