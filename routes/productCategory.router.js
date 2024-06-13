const express = require("express");
const productCategoryController = require("../controllers/productCategory.controller");
const router = express.Router();

router.post("/addcategory", productCategoryController.addCategory);

router.put("/editbyid/:id", productCategoryController.editCategory);

// Delete a category by ID
router.delete("/deletebyid/:id", productCategoryController.deleteCategory);

// Get all categories
router.post("/getallcategory", productCategoryController.getAllCategories);

// Get a category by ID
router.get("/getcategory/:id", productCategoryController.getCategoryById);

// status change
router.post("/poststatuschange", productCategoryController.poststatuschange);

// recycle category
router.post(
  "/recyclecategory",
  productCategoryController.recycleDeletedCategory
);

// get all deleted category data
router.post(
  "/getalldeletedcategorydata",
  productCategoryController.getAllDeletedCategories
);

module.exports = router;
