const express = require("express");
const ParentSubCategorController = require("../controllers/parentSubCategory.controller");
const router = express.Router();
const { uploadfile } = require("../middleware/upload");

router.post(
  "/addparentsubcategory",
  ParentSubCategorController.addParentCategory
);

router.put(
  "/updateparentcategory/:id",
  ParentSubCategorController.editParentCategory
);

router.delete("/deletebyid/:id", ParentSubCategorController.deleteCategory);

router.post(
  "/getallparentcategory",
  ParentSubCategorController.getAllParentCategory
);

router.get(
  "/getparentsubcategorybyid/:parentSubCategoryID",
  ParentSubCategorController.getParentCategoryById
);

router.get(
  "/getparentsubcategorybycategoryid/:productCategoryID",
  ParentSubCategorController.getParentCategoryByCategoryId
);

router.post(
  "/uploadexcel",
  uploadfile,
  ParentSubCategorController.uploadparentsubcategory
); //upload

module.exports = router;
