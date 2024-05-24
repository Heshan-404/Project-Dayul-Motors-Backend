// /src/utils/generateToken.js
import jwt from "jsonwebtoken";
import config from "../config/config";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

export default generateToken;
