const ProductCategory = require("../models/productCategory");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "parentSubCategory";

const ParentSubCategory = sequelize.define(
  table_name,
  {
    parentSubCategoryID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    parentSubCategoryName: {
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

ParentSubCategory.belongsTo(ProductCategory, {
  foreignKey: "productCategoryID",
});

module.exports = ParentSubCategory;
