const StateMaster = require("./statemaster");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "cityMaster";
const CityMaster = sequelize.define(table_name, {
  cityMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },

  cityName: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

CityMaster.belongsTo(StateMaster, { foreignKey: { name: "stateMasterID" } });

module.exports = CityMaster;
