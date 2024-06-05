const express = require("express");
const orderMasterController = require("../controllers/orderMaster.controller");
const router = express.Router();

router.post("/addorder", orderMasterController.postAddOrder);

router.get(
  "/getOrderDataById/:orderMasterID",
  orderMasterController.getOrderDataById
);

router.post(
  "/getorderdataforadmin",
  orderMasterController.getOrderDataForAdmin
);

router.post("/getuserorder", orderMasterController.getUserOrderData);

router.post(
  "/generateOrderInvoicePDF/:orderMasterID",
  orderMasterController.generateOrderInvoicePDF
);

router.get("/orderrevenue", orderMasterController.getTotalOrderRevenue);

router.get("/bestselling", orderMasterController.getBestSellingProducts);

module.exports = router;
