const nodemailer = require("nodemailer");
require("dotenv").config();

const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "pubg200212111@gmail.com",
    pass: "mbmj gbew qeoz nflk",
  },
});

export const sendMail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
