// server.js (or index.js)
import express from "express";
import cors from "cors";
import pool from "./src/utils/database.connection";
import config from "./src/config/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Dayul Motors Backend</h1>");
  pool.connect();
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
