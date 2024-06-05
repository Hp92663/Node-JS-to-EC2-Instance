const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "countryMaster";
const CountryMaster = sequelize.define(table_name, {
  countryMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },

  countryName: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  countryCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

module.exports = CountryMaster;
