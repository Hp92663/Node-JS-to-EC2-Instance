const express = require("express");
const cityMasterController = require("../controllers/citymaster.controller");
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

router.post("/add", cityMasterController.postAddCity); // save data
router.post(
  "/addfile",
  upload.single("file"),
  cityMasterController.postImportData
); // save data
router.post("/getalldata", cityMasterController.getAllCityData); //get all city data
router.get("/getbyid/:id", cityMasterController.getCityById); //get by id
router.post("/updatebyid", cityMasterController.postUpdateCity); //update city data
router.post("/deletebyid", cityMasterController.postDeleteCityById); //delete by id
router.post("/statuschanges", cityMasterController.poststatuschange); //status change
router.get(
  "/getbgetCityBystateIdyid/:id",
  cityMasterController.getCityBystateId
); //get by id
module.exports = router;
