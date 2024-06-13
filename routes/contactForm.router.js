const express = require("express");
const contactFormController = require("../controllers/contactForm.controller");
const router = express.Router();

router.post("/addcontactquery", contactFormController.postAddContact);

router.post("/getallcontactquery", contactFormController.getAllContactData);

module.exports = router;
