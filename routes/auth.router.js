const express = require("express");
const authcontroller = require("../controllers/auth.controller");
const {
  registrationSchema,
  otpVerificationSchema,
} = require("../validators/loginregister");
const { reqObjectType } = require("../utils/commonVars");
const { validateSchema } = require("../middleware/validateSchema");
const { otpvalidateSchema } = require("../middleware/validateSchema");
const router = express.Router();

router.post("/login", authcontroller.login); // login user

router.post(
  "/register",
  validateSchema(registrationSchema, reqObjectType.BODY),
  authcontroller.userregister
); //registration

router.post("/forgotpassword", authcontroller.forgotPassword); //  Forgot Password

router.post("/forgototpverify", authcontroller.forgotOtp);

router.post("/forgotpasswordchange", authcontroller.forgorpasswordchange);

router.post("/resetpassword", authcontroller.resetpassword); //   Password change through otp

router.get("/viewuserprofile/:userId", authcontroller.getUserDetailsById);

router.post(
  "/verification",
  otpvalidateSchema(otpVerificationSchema, reqObjectType.BODY),
  authcontroller.verifyOTP
); //otp verification

module.exports = router;
