const UserMaster = require("../models/userMaster");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { sendEmailForOtp } = require("../middleware/sendmail");
const { registrationSchema } = require("../validators/loginregister");
const { otpVerificationSchema } = require("../validators/loginregister");
const specialCharactersRegex = /[!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
const alphabeticRegex = /[a-zA-Z]/;

const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

exports.login = async (req, res, next) => {
  const { identifier, password } = req.body;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (
    !isEmail &&
    (specialCharactersRegex.test(identifier) ||
      alphabeticRegex.test(identifier))
  ) {
    return res.status(200).json({
      message:
        "Invalid characters in identifier. Only numbers are allowed for mobile number",
    });
  }

  try {
    let user;
    if (isEmail) {
      user = await UserMaster.findOne({
        where: { emailAddress: identifier },
      });
    } else {
      user = await UserMaster.findOne({
        where: { userMobile: identifier },
      });
    }

    if (!user) {
      return res
        .status(200)
        .json({ status: 401, message: "User Doesn't exist" });
    }
    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(200).json({
        status: 401,
        message: "Invalid password",
      });
    }

    const tokendata = jwt.sign(
      { userMasterID: user.userMasterID },
      process.env.SECRETKEY,
      { expiresIn: "168h" }
    );

    const loginData = {
      token: tokendata,
      userMasterID: user.userMasterID,
      userName: user.userName,
      userMobile: user.userMobile,
      emailAddress: user.emailAddress,
      resetpassword: user.resetpassword,
      admin: user.admin,
    };

    res.json({
      status: 200,
      message: "Login successful",
      data: loginData,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
    next(error);
  }
};

exports.userregister = async (req, res, next) => {
  const { error: validationError, value } = registrationSchema.validate(
    req.body
  );
  if (validationError) {
    return res
      .status(400)
      .json({ status: 400, message: validationError.details[0].message });
  }

  const { userName, emailAddress, password, userAddress, userMobile, admin } =
    value;

  if (
    specialCharactersRegex.test(userMobile) ||
    alphabeticRegex.test(userMobile)
  ) {
    return res.status(400).json({
      status: 400,
      message: "Invalid characters in userMobile. Only numbers are allowed.",
    });
  }

  try {
    const existingMobile = await UserMaster.findOne({
      where: {
        [Op.or]: [{ userMobile }, { emailAddress }],
      },
    });

    if (existingMobile) {
      const message =
        existingMobile.userMobile === userMobile
          ? "User Mobile Number already exists."
          : "User Email Address already exists..";
      return res.status(200).json({ status: 409, message });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    const emailData = {
      reset_password_token: otp,
      email_id: emailAddress,
    };
    await sendEmailForOtp(emailData);

    cache.set(otp.toString(), {
      userName,
      emailAddress,
      password,
      userAddress,
      userMobile,
      admin,
    });

    res.status(200).json({
      status: 200,
      message: "OTP sent to the registered email address",
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
    next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  const { error: validationError, value } = otpVerificationSchema.validate(
    req.body
  );
  if (validationError) {
    return res
      .status(400)
      .json({ status: 400, message: validationError.details[0].message });
  }

  const { otp } = value;

  try {
    // Retrieve user details from the cache using the string representation of the OTP
    const userDetails = cache.get(otp.toString());

    if (!userDetails) {
      return res.status(200).json({ status: 400, message: "Invalid OTP" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userDetails.password, 10);
    const adminValue = userDetails.admin ? 1 : 0;

    // Save user details to the database
    await UserMaster.create({
      userName: userDetails.userName,
      emailAddress: userDetails.emailAddress,
      password: hashedPassword, // Store the hashed password
      userAddress: userDetails.userAddress,
      userMobile: userDetails.userMobile,
      passwordToken: null, // OTP not needed in DB after verification
      admin: adminValue, // Set the admin field based on user input
    });

    // Clear the cache entry
    cache.del(otp.toString());

    res.status(200).json({
      status: 200,
      message: "OTP verified successfully and user registered",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "An error occurred during OTP verification",
    });
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { emailAddress } = req.body;

  try {
    const user = await UserMaster.findOne({
      where: {
        emailAddress: emailAddress,
        status: 1,
      },
    });

    if (!user) {
      return res.status(200).json({
        status: 400,
        message: "User doesn't exist",
      });
    }

    // Generate random OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Save the OTP to the user's account
    user.passwordToken = otp;
    await user.save();

    // Send OTP to the user registered email
    const emailData = {
      reset_password_token: otp,
      email_id: user.emailAddress,
    };

    await sendEmailForOtp(emailData);

    res.status(200).json({
      status: 200,
      message: "OTP Sented To your Registered E-mail",
      userMasterID: user.userMasterID,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
    next(error);
  }
};

exports.forgotOtp = async (req, res, next) => {
  const { otp } = req.body;

  try {
    // Check if the OTP exists and is valid
    const user = await UserMaster.findOne({
      where: {
        passwordToken: otp,
        status: 1,
      },
    });

    // Clear OTP after successful verification
    user.passwordToken = null;
    await user.save();

    res.status(200).json({
      status: 200,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
    next(error);
  }
};

exports.forgorpasswordchange = async (req, res, next) => {
  const { userMasterID, newPassword } = req.body;

  try {
    // Find user by userMasterID
    const user = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
      },
    });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    // Clear OTP after password change
    user.passwordToken = null;
    await user.save();

    res.status(200).json({
      status: 200,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
    next(error);
  }
};

exports.resetpassword = async (req, res, next) => {
  const { id, oldPassword, newPassword } = req.body;
  try {
    const user = await UserMaster.findOne({
      where: {
        userMasterID: id,
        status: 1,
      },
    });

    // Check if the old password matches
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(200).json({
        status: 400,
        message: "Old password is incorrect",
      });
    }

    // Check if old password and new password are same
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(200).json({
        status: 400,
        message: "New password cannot be the same as the old password",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      status: 200,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
    next(error);
  }
};

exports.getUserDetailsById = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const user = await UserMaster.findOne({
      where: { userMasterID: userId },
    });

    res.status(200).json({ status: 200, data: user });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
    next(error);
  }
};
