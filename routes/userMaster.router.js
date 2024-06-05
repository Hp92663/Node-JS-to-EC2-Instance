const express = require("express");
const userMasterController = require("../controllers/userMaster.controller");
const router = express.Router();

router.post("/getuserprofile", userMasterController.getUserProfileData);

router.put("/edituserprofile", userMasterController.updateUserProfile);

router.post("/getalluserdata", userMasterController.getAllUserData);

module.exports = router;
