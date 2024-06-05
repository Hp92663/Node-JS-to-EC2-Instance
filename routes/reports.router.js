const express = require("express");
const ReportsController = require("../controllers/reports.controller");
const router = express.Router();

router.get("/productsellingreport", ReportsController.productSellingReport);

router.post("/orderreport", ReportsController.getOrderDetailReport)

module.exports = router;
