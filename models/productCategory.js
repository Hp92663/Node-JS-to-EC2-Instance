const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "productCategory";

const productCategory = sequelize.define(
  table_name,
  {
    productCategoryID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    categoryName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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

module.exports = productCategory;
