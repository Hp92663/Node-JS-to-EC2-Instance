"use strict";
const authRoutes = require("./routes/auth.router");
const userMasterRoutes = require("./routes/userMaster.router");
const contactForm = require("./routes/contactForm.router");
const productCategoryRoutes = require("./routes/productCategory.router");
const productMasterRoutes = require("./routes/productMaster.router");

const { verifyToken } = require("./middleware/tokenverify");

module.exports = (app) => {
  app.use("/auth", authRoutes);
  app.use("/userMaster", verifyToken, userMasterRoutes);
  app.use("/contactform", contactForm);
  app.use("/productCategory", productCategoryRoutes);
  app.use("/productMaster", productMasterRoutes);
};
