const dotenv = require("dotenv").config();
const { Sequelize } = require("sequelize");
const logger = require("./logger");
console.log('dotenv ->>> ', dotenv);
const dbHost = process.dotenv.HOST;
const dbDatabase = process.dotenv.DATABASE;
const dbUser = process.dotenv.USER;
const dbPassword = process.dotenv.PASSWORD;
const dbDialect = process.dotenv.DIALECT;

const node_to_ec2 = new Sequelize(dbDatabase, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
  dialectOptions: {
    useUTC: false,
  },
  timezone: "+05:30",
  logging: false,
});

logger.info(`${dbDatabase} connected.`);

module.exports = node_to_ec2;
