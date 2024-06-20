const jwt = require("jsonwebtoken");
import config from "../../config/config";

const adminAuthMiddleware = (req, res, next) => {
  // Check if Authorization header is present
  var authHeader = req.headers.authorization;
  console.log("====================================");
  console.log(authHeader);
  console.log("====================================");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extract token from Authorization header
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_ADMIN_SECRET);

    // Attach decoded token data to request object
    req.admin = decoded;
    console.log("====================================");
    console.log(decoded);
    console.log("====================================");
    next();
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = adminAuthMiddleware;
