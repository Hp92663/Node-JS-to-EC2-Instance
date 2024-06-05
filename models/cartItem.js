const productMaster = require("./productMaster");
const userMaster = require("./userMaster");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "cartItem";

const cartItem = sequelize.define(
  table_name,
  {
    cartItemID: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    createBy: {
      type: Sequelize.INTEGER,
    },

    updateBy: {
      type: Sequelize.INTEGER,
    },

    deleteBy: {
      type: Sequelize.INTEGER,
    },

    createByIp: {
      type: Sequelize.STRING,
    },

    updateByIp: {
      type: Sequelize.STRING,
    },

    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

cartItem.belongsTo(productMaster, { foreignKey: "productMasterID" });

cartItem.belongsTo(userMaster, { foreignKey: "userMasterID" });

module.exports = cartItem;
