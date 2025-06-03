require("dotenv").config();
const { Sequelize } = require("sequelize");
const logger = require("./logger");
const dbHost = process.env.HOST;
const dbDatabase = process.env.DATABASE;
const dbUser = process.env.USER;
const dbPassword = process.env.PASSWORD;
const dbDialect = process.env.DIALECT;

const node_to_ec2 = new Sequelize(dbDatabase, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
  dialectOptions: {
    useUTC: false,
    ssl: {
      require: true,
      rejectUnauthorized: false, // You may need this for self-signed certs
    },
  },
  timezone: "+05:30",
  logging: false,
});

logger.info(`${dbDatabase} connected.`);

module.exports = node_to_ec2;
