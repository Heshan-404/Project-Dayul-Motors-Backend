// utils/database.connection.js
import pg from "pg";
import config from "../config/config";
import logger from "./logger";

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    logger.error("Error connecting to database:", err);
  } else {
    logger.info("Database Synced...");
  }
});

export default pool;
