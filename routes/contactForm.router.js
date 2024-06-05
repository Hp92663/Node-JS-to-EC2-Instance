const express = require("express");
const contactFormController = require("../controllers/contactForm.controller");
const router = express.Router();

router.post("/addcontact", contactFormController.postAddContact);

router.post("/getallcontactdata", contactFormController.getAllContactData);

module.exports = router;
