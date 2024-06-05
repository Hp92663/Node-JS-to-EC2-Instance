const dotenv = require("dotenv").config();

module.exports = {
  development: {
    username: dotenv.parsed.USER,
    password: dotenv.parsed.PASSWORD,
    database: dotenv.parsed.DATABASE,
    host: dotenv.parsed.HOST,
    dialect: dotenv.parsed.DIALECT,
  },
};
