const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartControllers"); // Import your controller

router.get("/cart", cartController.getCartItems);
router.put(
  "/cart/update/:cartid/:productid",
  cartController.updateCartItemQuantity
);
router.delete("/cart/delete/:cartid/:productid", cartController.deleteCartItem);
router.post("/products/details", cartController.getProductDetails);
module.exports = router;
