const dotenv = require("dotenv").config();
const { Sequelize } = require("sequelize");
const logger = require("./logger");

const dbHost = dotenv.parsed.HOST;
const dbDatabase = dotenv.parsed.DATABASE;
const dbUser = dotenv.parsed.USER;
const dbPassword = dotenv.parsed.PASSWORD;
const dbDialect = dotenv.parsed.DIALECT;

// logger.info('Connecting to DB...');
const mehta = new Sequelize(dbDatabase, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
  dialectOptions: {
    useUTC: false,
  },
  timezone: "+05:30",
  logging: false,
});

logger.info(`${dbDatabase} connected.`);

module.exports = mehta;
