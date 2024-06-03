import express from "express";
import cors from "cors";
import pool from "./src/utils/database.connection";
import config from "./src/config/config";
import authUserRoutes from "./src/api/routes/UserRoutes/authRoutes";
import authAdminRoutes from "./src/api/routes/AdminRoutes/authRoutes";
import productsManageRoutes from "./src/api/routes/AdminRoutes/productManagement";
import ordersManageRoutes from "./src/api/routes/AdminRoutes/orderManagement";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Dayul Motors Backend.</h1>");
  pool.connect();
});

app.use("/api/auth/user", authUserRoutes);
app.use("/api/auth/admin", authAdminRoutes);
app.use("/api/auth/admin", productsManageRoutes);
app.use("/api/auth/admin", ordersManageRoutes);

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
