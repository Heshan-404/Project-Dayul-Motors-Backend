import express from "express";
import {
  registerAdmin,
  loginAdmin,
  adminDetails,
  unfreezeAdmin,
  freezeAdmin,
  updateAdminDetails,
  deleteAdmin,
  getRootAdmins,
} from "../../controllers/adminAuthController";
import {
  activateUser,
  fetchAllUsers,
  freezeUnfreezeUser,
  updateUserDetails,
} from "../../controllers/userAuthController";
import adminAuthMiddleware from "../../middleware/adminAuthMiddleWare";
const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/protected/details", adminDetails);
router.put(
  "/protected/admin_freeze/:adminid",
  adminAuthMiddleware,
  freezeAdmin
);
router.put(
  "/protected/admin_active/:adminid",
  adminAuthMiddleware,
  unfreezeAdmin
);
router.put(
  "/protected/admin_update/:adminid",
  adminAuthMiddleware,
  updateAdminDetails
);
router.delete(
  "/protected/admin_delete/:adminid",
  adminAuthMiddleware,
  deleteAdmin
);

router.put(
  "/protected/user_freeze_unfreeze/:userid",
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

router.get("/protected/rootadmins", getRootAdmins);

router.post("/protected/token_verify", adminAuthMiddleware, (req, res) => {
  res.json(req.admin);
});
export default router;
