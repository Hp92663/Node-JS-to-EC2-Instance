const userAttributes = [
  "userMasterID",
  "userName",
  "password",
  "emailAddress",
  "userAddress",
  "userMobile",
  "resetpassword",
  "passwordToken",
];

const statusCodes = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
};

const roles = {
  ADMIN: "admin",
  USER: "user",
};

const emailTemplates = {
  EMAIL_VERIFICATION: "Activate-account.html",
  FORGOT_PASSWORD: "Forgot-password.html",
};

const reqObjectType = {
  BODY: "body",
  PARAMS: "params",
  QUERY: "query",
};

module.exports = {
  userAttributes,
  statusCodes,
  roles,
  emailTemplates,
  reqObjectType,
};
