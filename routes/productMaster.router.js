const express = require("express");
const productMastercontroller = require("../controllers/productMaster.controller");
const multer = require("multer");
const router = express.Router();
const { uploadproduct } = require("../middleware/upload");
const { uploadfile } = require("../middleware/upload");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Uploads will be stored in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Appending current timestamp to filename to make it unique
  },
});

const upload = multer({ storage: storage });

router.post("/addproduct", uploadproduct, productMastercontroller.addProduct);

router.put(
  "/editproducts/:id",
  uploadproduct,
  productMastercontroller.editProduct
);

router.delete("/deleteproduct/:id", productMastercontroller.deleteProductById);

router.post("/getallproduct", productMastercontroller.getAllProducts);

router.get("/getproductbyid/:id", productMastercontroller.getProductById);

router.get(
  "/getproductbycategory/:categoryId",
  productMastercontroller.getProductsByCategory
);

router.get(
  "/getproductbyparentsubcategory/:id",
  productMastercontroller.getProductsByParentCategory
);

router.post("/deletebyid/:id", productMastercontroller.deleteProductById);

router.post("/poststatuschange", productMastercontroller.poststatuschange);

router.post("/uploadexcel", uploadfile, productMastercontroller.uploadProduct); //upload

module.exports = router;
