const Joi = require("@hapi/joi").defaults((schema) => {
  switch (schema.schemaType) {
    case "number":
    case "boolean":
      return schema.strict();
    default:
      return schema;
  }
});

module.exports = { Joi };
