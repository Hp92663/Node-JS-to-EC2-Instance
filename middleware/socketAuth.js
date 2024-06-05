const jwt = require("jsonwebtoken");
const userMaster = require("../models/userMaster");

async function verifyAuthForSocket(socket, next) {
  if (socket.handshake.query && socket.handshake.query.Authorization) {
    const token = socket.handshake.query.Authorization.replace("Bearer ", "");
    if (!token || !token.trim()) return next(new Error("Authentication error"));
    try {
      const tokenData = jwt.verify(token, process.env.SECRETKEY);
      const userMasterId = tokenData.token.usermasterid;
      const userDetails = await userMaster.findOne({
        where: { userMasterID: userMasterId, status: 1 },
      });
      if (!userDetails) return next(new Error("Authentication error"));
      socket.userDetails = {
        userMasterId,
        userName: userDetails.displayName,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    next(new Error("Authentication error"));
  }
}

module.exports = { verifyAuthForSocket };
