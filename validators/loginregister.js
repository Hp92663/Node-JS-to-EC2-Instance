const { Joi } = require("../utils/joi");

const registrationSchema = Joi.object({
  userName: Joi.string().required(),
  emailAddress: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  userAddress: Joi.string().required(),
  userMobile: Joi.string().required(),
});

const otpVerificationSchema = Joi.object({
  otp: Joi.string().required(),
});

module.exports = {
  registrationSchema,
  otpVerificationSchema,
};
