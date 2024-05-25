import config from "../config/config";

const nodemailer = require("nodemailer");
require("dotenv").config();

const path = require("path");

const companyEmail = config.COMPANY_EMAIL;
const emailTransporterKEY = config.EMAIL_TRANSPOTER_KEY;
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: `${companyEmail}`,
    pass: `${emailTransporterKEY}`,
  },
});

export const sendMail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
