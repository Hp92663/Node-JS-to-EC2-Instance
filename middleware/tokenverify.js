const jwt = require("jsonwebtoken");
const userMaster = require("../models/userMaster");

/**
 * Verifies the token received in the header of each request
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns App to proceed with next step in lifecycle of application
 */
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(200).json({ status: 401, message: "Unauthorized" });
  }

  const tokenData = token.replace("Bearer ", "");

  try {
    const decodedToken = jwt.verify(tokenData, process.env.SECRETKEY);
    const userMasterId = decodedToken.userMasterID;
    const userDetails = await userMaster.findOne({
      where: { userMasterID: userMasterId, status: 1 },
    });

    if (!userDetails) {
      return res.status(200).json({ status: 401, message: "Unauthorized" });
    }

    // Attach user details to the request for further processing if needed
    req.userDetails = {
      userMasterId,
      userName: userDetails.displayName,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(200).json({ status: 401, message: "Unauthorized" });
  }
};

module.exports = { verifyToken };
