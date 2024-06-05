const { statusCodes, reqObjectType } = require("../utils/commonVars");
const validateSchema = (schema, type) => {
  const options = {
    errors: {
      wrap: {
        label: "",
      },
    },
  };
  return (req, res, next) => {
    const { error } = schema.validate(req[type || "body"], {
      ...options,
      abortEarly: false,
    });
    if (error) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: error.details[0].message });
    }
    next();
  };
};

const otpvalidateSchema = (schema, type) => {
  const options = {
    errors: {
      wrap: {
        label: "",
      },
    },
  };
  return (req, res, next) => {
    const { error } = schema.validate(req[type || "body"], {
      ...options,
      abortEarly: false,
    });
    if (error) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: error.details[0].message });
    }
    next();
  };
};
module.exports = { validateSchema, otpvalidateSchema };
