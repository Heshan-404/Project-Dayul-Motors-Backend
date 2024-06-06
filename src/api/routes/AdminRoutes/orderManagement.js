import express from "express";

const router = express.Router();

import adminAuthMiddleware from "../../middleware/adminAuthMiddleWare";
import {
  fetchAllOrders,
  fetchOrderDetails,
  fetchOrderDetailsMore,
  updateOrderStatus,
} from "../../controllers/orderManagement";

router.get("/protected/fetch_all_orders", adminAuthMiddleware, fetchAllOrders);

router.get("/protected/order/:orderid", adminAuthMiddleware, fetchOrderDetails);

router.get("/protected/order_more_detialed/:orderid", fetchOrderDetailsMore);
router.put("/protected/order/status/:orderid", updateOrderStatus);

export default router;
