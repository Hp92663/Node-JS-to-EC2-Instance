const express = require("express");
const countryMasterController = require("../controllers/countrymaster.controller");
const router = express.Router();
const multer = require("multer");
const bodyParser = require("body-parser");
router.use(bodyParser.json());

//file Upload setting
const PATH = "./uploads";
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATH);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

let upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 * 1024 },
});

router.post("/add", countryMasterController.postAddCountry); // save data

router.post(
  "/addfile",
  upload.single("file"),
  countryMasterController.postImportData
); // save data

router.post("/getalldata", countryMasterController.getAllCountryData); //get all country data

router.get("/getbyid/:id", countryMasterController.getCountryById); //get by id

router.post("/updatebyid", countryMasterController.postUpdateCountry); //update country data

router.post("/deletebyid", countryMasterController.postDeleteCountryById); //delete by id

router.post("/statuschanges", countryMasterController.poststatuschange); //status change

module.exports = router;
