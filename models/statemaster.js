const CountryMaster = require('./countrymaster');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'stateMaster';
const StateMaster = sequelize.define(table_name, {
  stateMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },

  stateName: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  stateCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },

});

StateMaster.belongsTo(CountryMaster, {
  foreignKey: { name: 'countryMasterID' },
});

module.exports = StateMaster;