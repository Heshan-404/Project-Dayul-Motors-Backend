// utils/database.connection.js
import pg from "pg";
import config from "../config/config";

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.log("Error connecting to database:", err);
  } else {
    console.log("Database Synced...");
  }
});

export default pool;
