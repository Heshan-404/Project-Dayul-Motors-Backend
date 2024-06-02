import dotenv from "dotenv";
dotenv.config();

const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ADMIN_EXPIRES_IN: process.env.JWT_ADMIN_EXPIRES_IN,
  JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_SECRET: process.env.JWT_SECRET,
  COMPANY_EMAIL: process.env.COMPANY_EMAIL,
  EMAIL_TRANSPOTER_KEY: process.env.EMAIL_TRANSPOTER_KEY,
  COMPANY_NAME: process.env.COMPANY_NAME,
};

export default config;
