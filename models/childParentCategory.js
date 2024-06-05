const productCategory = require("./productCategory");
const ParentSubCategory = require("../models/parentSubCategory");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "childParentCategory";

const ChildParentCategory = sequelize.define(
  table_name,
  {
    childParentCategoryID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    childParentCategoryName: {
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

ChildParentCategory.belongsTo(productCategory, {
  foreignKey: "productCategoryID",
});
ChildParentCategory.belongsTo(ParentSubCategory, {
  foreignKey: "parentSubCategoryID",
});

module.exports = ChildParentCategory;
