const cartItemController = require("../controllers/cartItem.controller");
const express = require("express");
const router = express.Router();

router.post("/add-to-cart", cartItemController.addToCart);

router.get("/get-cart-items/:userMasterID", cartItemController.getCartItems);

router.post("/updatecart",cartItemController.updateCartItemQuantity);

router.delete(
  "/deletebyid/:cartItemID",
  cartItemController.removeFromCart
);
module.exports = router;
