//dashboardRoutes.js
import express from "express";
import {
  getLowStockItems,
  // getTotalProfit,
  getTotalUserCount,
  getTotalItemsCount,
  getMonthlySalesData,
  getLastMonthSalesData,
  updateProduct,
  getSettings,
  updateSettings,
} from "../../controllers/dashboardControllers";

const router = express.Router();

// router.get("/get_total_profit", getTotalProfit);s
router.get("/get_total_user_count", getTotalUserCount);
router.get("/get_total_items_count", getTotalItemsCount);
router.get("/get_monthly_sales_data", getMonthlySalesData);
router.get("/get_last_month_sales_data", getLastMonthSalesData);
router.put("/update_product/:productid", updateProduct);

router.get("/get_low_stock_items", getLowStockItems);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
export default router;
