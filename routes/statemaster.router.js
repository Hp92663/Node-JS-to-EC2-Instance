const express = require("express");
const stateMasterController = require("../controllers/statemaster.controller");
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

router.post("/add", stateMasterController.postAddState); // save data

router.post("/getalldata", stateMasterController.getAllStateData); //get all state data

router.post(
  "/addfile",
  upload.single("file"),
  stateMasterController.postImportData
); // save data

router.get("/getbyid/:id", stateMasterController.getStateById); //get by id

router.post("/updatebyid", stateMasterController.postUpdateState); //update state data

router.post("/deletebyid", stateMasterController.postDeleteStateById); //delete by id

router.get("/getbycountryid/:id", stateMasterController.getStateBycountryid); //get by countryid

router.post("/statuschanges", stateMasterController.poststatuschange); //status change

module.exports = router;
