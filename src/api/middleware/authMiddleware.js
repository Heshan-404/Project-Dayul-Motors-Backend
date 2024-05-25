import jwt from "jsonwebtoken";
import config from "../../config/config";
// Middleware function to authenticate requests
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    next();
  });
};

module.exports = authMiddleware;
