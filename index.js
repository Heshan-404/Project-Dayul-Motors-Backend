// server.js (or index.js)
import express from "express";
import cors from "cors";
import logger from "./src/utils/logger";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Dayul Motors Backend</h1>");
});

const PORT = process.env.PORT || 3000; // You can still use config.PORT here
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
