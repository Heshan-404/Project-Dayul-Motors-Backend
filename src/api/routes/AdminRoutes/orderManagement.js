import express from "express";

const router = express.Router();

import adminAuthMiddleware from "../../middleware/adminAuthMiddleWare";
import {
  fetchAllOrders,
  fetchOrderDetails,
} from "../../controllers/orderManagement";

router.get("/protected/fetch_all_orders", adminAuthMiddleware, fetchAllOrders);

router.get("/protected/order/:orderid", adminAuthMiddleware, fetchOrderDetails);

export default router;
