import dotenv from "dotenv";
dotenv.config();

const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3000,
};

export default config;
