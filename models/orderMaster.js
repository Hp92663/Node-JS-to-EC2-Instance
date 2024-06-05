const UserMaster = require("./userMaster");
const CityMaster = require("./citymaster");
const StateMaster = require("./statemaster");
const CountryMaster = require("./countrymaster");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "orderMaster";

const OrderMaster = sequelize.define(
  table_name,
  {
    orderMasterID: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    emailAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    mobileNo: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },

    shippingAddress: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    billingAddress: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    zipCode: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    paymentId: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    cartID: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
    },
  },

  {
    indexes: [
      {
        unique: false,
        fields: ["cartID"],
      },
    ],
  }
);

OrderMaster.belongsTo(UserMaster, {
  foreignKey: { name: "userMasterID" },
});

OrderMaster.belongsTo(CityMaster, {
  foreignKey: { name: "cityMasterID" },
});

OrderMaster.belongsTo(StateMaster, {
  foreignKey: { name: "stateMasterID" },
});

OrderMaster.belongsTo(CountryMaster, {
  foreignKey: { name: "countryMasterID" },
});

module.exports = OrderMaster;
