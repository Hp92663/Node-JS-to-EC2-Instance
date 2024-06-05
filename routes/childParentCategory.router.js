const childParentCategorController = require("../controllers/childParentCategory.controller");
const express = require("express");
const router = express.Router();
const { uploadfile } = require("../middleware/upload");

router.post("/addchildcategory", childParentCategorController.addChildCategory); //add

router.put("/editbyid/:id", childParentCategorController.editChildCategory); // update

router.delete(
  "/deletechildcategory/:id",
  childParentCategorController.deleteChildCategoryById
); // delete

router.post(
  "/getallchildcategory",
  childParentCategorController.getAllChildCategory
);

router.post("/poststatuschange", childParentCategorController.poststatuschange);

router.get(
  "/getbyparentcategoryid/:parentSubCategoryID",
  childParentCategorController.getChildCategorybyParentCategoryId
);

router.get(
  "/getbychildparentcategoryid/:childParentCategoryID",
  childParentCategorController.getChildParentCategorybyId
);

router.post(
  "/uploadexcel",
  uploadfile,
  childParentCategorController.uploadChildParentCategory
); //upload

module.exports = router;
